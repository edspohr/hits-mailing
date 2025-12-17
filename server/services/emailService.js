const imaps = require("imap-simple");
const nodemailer = require("nodemailer");
const simpleParser = require("mailparser").simpleParser;
require("dotenv").config();

// Configuration for IMAP
const imapConfig = {
  imap: {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST,
    port: process.env.IMAP_PORT || 993,
    tls: process.env.IMAP_TLS === "true",
    authTimeout: 3000,
  },
};

// Transporter for sending emails (SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

module.exports = {
  /**
   * Helper to parse [TICKET-XYZ] from subject
   */
  parseTicketId: (subject) => {
    const match = subject.match(/\[TICKET-([^\]]+)\]/);
    return match ? match[1] : null; // Returns ID (e.g. 101) or null
  },

  /**
   * Fetches unread emails from Inbox
   * Returns parsed email objects
   */
  fetchUnreadEmails: async () => {
    try {
      const connection = await imaps.connect(imapConfig);
      await connection.openBox("INBOX");

      const searchCriteria = ["UNSEEN"];
      const fetchOptions = {
        bodies: ["HEADER", "TEXT", ""], // Empty string fetches the whole body
        markSeen: false, // We mark seen strictly after processing
      };

      const messages = await connection.search(searchCriteria, fetchOptions);

      const emails = [];
      for (const item of messages) {
        const all = _.find(item.parts, { which: "" });
        const id = item.attributes.uid;
        const idHeader = "Imap-Id: " + id + "\r\n";

        // Use mailparser to parse the raw email source
        // Since imap-simple returns raw stream/chunks, simpleParser is best
        // Note: For simplicity here we assume 'parts' accesses what we need or we use the helper
        const rawPart = item.parts.find((p) => p.which === "");
        // imap-simple is a bit low-level, a simpler way is usually getting the full body.

        // Let's use a simpler approach often used with imap-simple:
        // Retreive the 'TEXT' part if we just want content, BUT parser is better for attachments/html.
        // We will pass the raw body to simpleParser.

        const parsed = await simpleParser(rawPart ? rawPart.body : "");

        emails.push({
          uid: item.attributes.uid,
          subject: parsed.subject,
          from: parsed.from.text,
          fromAddress: parsed.from.value[0].address,
          text: parsed.text,
          html: parsed.html,
          messageId: item.attributes.uid, // Store UID to mark as read later
        });
      }

      // Close properly
      connection.end();
      return emails;
    } catch (error) {
      if (process.env.IMAP_USER) {
        // Only log error if we actually tried to connect with credentials
        console.error("Error fetching emails:", error);
      } else {
        console.log("Skipping email fetch (No credentials provided).");
      }
      return [];
    }
  },

  /**
   * Marks specific email UIDs as SEEN (Read)
   */
  markAsRead: async (uids) => {
    if (!uids || uids.length === 0) return;
    try {
      const connection = await imaps.connect(imapConfig);
      await connection.openBox("INBOX");
      await connection.addFlags(uids, "SEEN");
      connection.end();
    } catch (error) {
      console.error("Error marking emails as read:", error);
    }
  },

  /**
   * Forwards an email to the assignee with the Ticket ID in the subject.
   */
  forwardTicket: async (
    originalEmail,
    ticketId,
    assigneeAddress,
    aiSummary
  ) => {
    const newSubject = `[TICKET-${ticketId}] Fwd: ${originalEmail.subject}`;

    const intro = `
    <div style="background-color: #f3f4f6; padding: 10px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
      <strong>Nuevo Ticket Asignado</strong><br/>
      <strong>Resumen IA:</strong> ${aiSummary.summary}<br/>
      <strong>Urgencia:</strong> ${aiSummary.urgency}<br/>
      <strong>Sentimiento:</strong> ${aiSummary.sentiment}
    </div>
    <hr/>
    `;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: assigneeAddress,
      cc: process.env.SMTP_USER, // Keep bot in CC to track replies
      subject: newSubject,
      html: intro + (originalEmail.html || originalEmail.text),
      replyTo: originalEmail.fromAddress, // So if agent replies normally, it might go to user...
      // WAIT: The requirement is "Two-Way Sync".
      // If the agent replies, they should Reply-All (to User + Bot).
      // Or they Reply to Bot and Bot forwards to User.
      // Simplest: Agent replies ALL. Bot is CC'd.
    };

    try {
      if (process.env.SMTP_USER) {
        await transporter.sendMail(mailOptions);
        console.log(`Email forwarded to ${assigneeAddress}`);
      } else {
        console.log(
          `[MOCK EMAIL] Would forward to ${assigneeAddress} with subject: ${newSubject}`
        );
      }
    } catch (error) {
      console.error("Error sending email:", error);
    }
  },
};

// Polyfill for dash in fetchUnreadEmails loop if library not available in scope
const _ = {
  find: (arr, predicate) =>
    arr.find(predicate.which === "" ? (p) => p.which === "" : () => false),
};
