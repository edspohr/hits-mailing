const express = require("express");
const cors = require("cors");
const emailService = require("./services/emailService");
const aiService = require("./services/aiService");
const dbService = require("./services/dbService");
const rules = require("./config/rules");
require("dotenv").config();

const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const POLL_INTERVAL = process.env.POLL_INTERVAL_MS || 60000;

app.use(cors());
app.use(express.json());

// Serve Static Frontend (Production)
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

// --- WORKER LOGIC ---

async function processNewEmail(email) {
  console.log(`Processing NEW email: ${email.subject}`);

  /* 
   Prepare Body Content (Text or HTML)
   Some clients send HTML only. fallback to HTML if text is empty.
  */
  const bodyContent = email.text || email.html || "(Sin contenido)";

  // 1. Analyze with AI
  const analysis = await aiService.analyzeNewTicket(
    email.subject,
    bodyContent,
    email.from
  );
  console.log("AI Analysis:", analysis);

  // 2. Determine Assignee
  const assigneeEmail =
    rules.assignments[analysis.category] || rules.assignments["Otro"];

  // 3. Create Ticket in DB
  const ticketData = {
    originalSubject: email.subject,
    from: email.fromAddress,
    category: analysis.category,
    urgency: analysis.urgency,
    summary: analysis.summary,
    sentiment: analysis.sentiment,
    assignedTo: assigneeEmail,
    emailBody: bodyContent,
  };

  const ticketId = await dbService.createTicket(ticketData);

  // 4. Forward Email
  await emailService.forwardTicket(email, ticketId, assigneeEmail, analysis);

  // 5. Bitacora Log (for Demo)
  if (analysis.category === "Demo" || analysis.category === "Prueba") {
    await dbService.addTicketComment(ticketId, {
      from: "System",
      body: `Ticket ${analysis.category} creado el ${new Date().toLocaleString(
        "es-CL",
        { timeZone: "America/Santiago" }
      )}`,
      aiAnalysis: { isSystemLog: true },
    });
  }

  return ticketId;
}

async function processReplyEmail(email, ticketId) {
  console.log(`[Worker] Processing REPLY for Ticket ${ticketId}`);
  console.log(`[Worker] Reply from: ${email.fromAddress}`);
  const bodyContent = email.text || email.html || "";
  console.log(`[Worker] Body preview: "${bodyContent.substring(0, 100)}..."`);

  // 1. Analyze for Closure
  const analysis = await aiService.analyzeReply(bodyContent);
  console.log(
    `[Worker] AI Analysis: isResolved=${analysis.isResolved}, reason="${
      analysis.reason || "N/A"
    }"`
  );

  // 2. Add as Comment to DB
  await dbService.addTicketComment(ticketId, {
    from: email.fromAddress,
    body: bodyContent,
    aiAnalysis: analysis,
  });
  console.log(`[Worker] Comment added to Ticket ${ticketId}`);

  // 3. Close if Resolved
  if (analysis.isResolved) {
    console.log(
      `[Worker] *** CLOSING Ticket ${ticketId} (AI detected resolution) ***`
    );
    await dbService.updateTicketStatus(ticketId, "CLOSED", email.fromAddress);

    // Log closure in Bitacora (Worker)
    await dbService.addTicketComment(ticketId, {
      from: "System",
      body: `Ticket cerrado el ${new Date().toLocaleString("es-CL", {
        timeZone: "America/Santiago",
      })} por ${email.fromAddress}`,
      aiAnalysis: { isSystemLog: true },
    });

    console.log(`[Worker] Ticket ${ticketId} closed by ${email.fromAddress}.`);
  } else {
    console.log(
      `[Worker] Ticket ${ticketId} remains OPEN (AI did not detect resolution).`
    );
  }
}

async function runWorkerCycle() {
  console.log("--- [Worker] Checking for new emails ---");
  try {
    const emails = await emailService.fetchUnreadEmails();
    console.log(`[Worker] Found ${emails.length} unread emails.`);

    const processedUids = [];

    for (const email of emails) {
      console.log(`[Worker] Processing email. Subject: "${email.subject}"`);

      try {
        const ticketId = emailService.parseTicketId(email.subject);
        console.log(
          `[Worker] Parsed Ticket ID: ${ticketId || "NONE (new ticket)"}`
        );

        if (ticketId) {
          await processReplyEmail(email, ticketId);
        } else {
          await processNewEmail(email);
        }

        processedUids.push(email.uid);
      } catch (err) {
        console.error(
          `[Worker] Failed to verify/process email ${email.uid}:`,
          err
        );
        // CRITICAL: Mark as read to avoid infinite blocking loop.
        // If an email causes a crash/error, we must skip it to process newer emails.
        processedUids.push(email.uid);
      }
    }

    if (processedUids.length > 0) {
      await emailService.markAsRead(processedUids);
    }
  } catch (error) {
    console.error("[Worker] Error in main loop:", error);
  }

  setTimeout(runWorkerCycle, POLL_INTERVAL);
}

// --- API ROUTES ---

app.get("/api/tickets", async (req, res) => {
  try {
    const tickets = await dbService.listTickets();
    res.json(tickets);
  } catch (e) {
    console.error(e);
    // Fallback mock
    res.json([
      {
        id: "MOCK-101",
        summary: "Problema Factura",
        status: "OPEN",
        assignedTo: "finanzas@empresa.com",
        category: "Facturación",
        urgency: "Alta",
      },
      {
        id: "MOCK-102",
        summary: "Error en Login",
        status: "CLOSED",
        assignedTo: "soporte@empresa.com",
        category: "Soporte Técnico",
        urgency: "Media",
      },
    ]);
  }
});

app.post("/api/tickets/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;
  console.log(`Reassigning Ticket ${id} to ${assignedTo}`);
  res.json({ success: true, message: "Reassigned" });
});

// Manual close ticket
app.post("/api/tickets/:id/close", async (req, res) => {
  const { id } = req.params;
  const { closedBy } = req.body || {};
  try {
    await dbService.updateTicketStatus(id, "CLOSED", closedBy || "Portal");

    // Log closure in Bitacora
    await dbService.addTicketComment(id, {
      from: "System",
      body: `Ticket cerrado el ${new Date().toLocaleString("es-CL", {
        timeZone: "America/Santiago",
      })} por ${closedBy || "Portal"}`,
      aiAnalysis: { isSystemLog: true },
    });
    console.log(
      `[API] Ticket ${id} manually closed by ${closedBy || "Portal"}.`
    );
    res.json({ success: true, message: "Ticket closed" });
  } catch (e) {
    console.error(`[API] Error closing ticket ${id}:`, e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get comments
app.get("/api/tickets/:id/comments", async (req, res) => {
  const { id } = req.params;
  try {
    const comments = await dbService.getTicketComments(id);
    res.json(comments);
  } catch (e) {
    console.error(`[API] Error fetching comments for ${id}:`, e);
    res.json([]);
  }
});

// Add manual comment
app.post("/api/tickets/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { from, body } = req.body;
  try {
    await dbService.addTicketComment(id, {
      from: from || "Portal User",
      body: body,
      aiAnalysis: { isManual: true },
    });
    console.log(`[API] Comment added to ticket ${id} by ${from}`);
    res.json({ success: true });
  } catch (e) {
    console.error(`[API] Error adding comment to ${id}:`, e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- FALLBACK (SPA) ---
// Any request that doesn't match an API route returns index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// --- START ---

app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
  console.log("Starting Email Worker...");
  runWorkerCycle();
});
