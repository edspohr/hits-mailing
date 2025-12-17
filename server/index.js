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

  // 1. Analyze with AI
  const analysis = await aiService.analyzeNewTicket(
    email.subject,
    email.text,
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
    emailBody: email.text,
  };

  const ticketId = await dbService.createTicket(ticketData);

  // 4. Forward Email
  await emailService.forwardTicket(email, ticketId, assigneeEmail, analysis);

  return ticketId;
}

async function processReplyEmail(email, ticketId) {
  console.log(`Processing REPLY for Ticket ${ticketId}: ${email.subject}`);

  // 1. Analyze for Closure
  const analysis = await aiService.analyzeReply(email.text);
  console.log("Reply Analysis:", analysis);

  // 2. Add as Comment to DB
  await dbService.addTicketComment(ticketId, {
    from: email.fromAddress,
    body: email.text,
    aiAnalysis: analysis,
  });

  // 3. Close if Resolved
  if (analysis.isResolved) {
    console.log(`Ticket ${ticketId} marked as RESOLVED by AI.`);
    await dbService.updateTicketStatus(ticketId, "CLOSED");
  }
}

async function runWorkerCycle() {
  console.log("--- [Worker] Checking for new emails ---");
  try {
    const emails = await emailService.fetchUnreadEmails();
    console.log(`[Worker] Found ${emails.length} unread emails.`);

    const processedUids = [];

    for (const email of emails) {
      const ticketId = emailService.parseTicketId(email.subject);

      if (ticketId) {
        await processReplyEmail(email, ticketId);
      } else {
        await processNewEmail(email);
      }

      processedUids.push(email.uid);
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
  // Mock update
  console.log(`Reassigning Ticket ${id} to ${assignedTo}`);
  res.json({ success: true, message: "Reassigned" });
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
