const emailService = require("./server/services/emailService");
require("dotenv").config();

(async () => {
  console.log("Checking environment...");
  if (!process.env.IMAP_USER) {
    console.log("No IMAP_USER defined in .env");
    return;
  }
  console.log("IMAP_USER found:", process.env.IMAP_USER);

  console.log("Fetching unread emails...");
  try {
    const emails = await emailService.fetchUnreadEmails();
    console.log("Success! Found:", emails.length);
    emails.forEach((e) => console.log(`- ${e.subject} (UID: ${e.uid})`));
  } catch (e) {
    console.error("Fetch failed:", e);
  }
})();
