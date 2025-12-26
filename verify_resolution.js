const aiService = require("./server/services/aiService");
require("dotenv").config();

const samples = [
  "Ya está resuelto, gracias.",
  "Ticket cerrado.",
  "Favor cerrar el ticket.",
  `---------- Forwarded message ---------
From: Edmundo Spohr <edmundo@spohr.cl>
Date: Thu, Dec 26, 2025 at 2:20 AM
Subject: Re: [TICKET-123] Fwd: Demo Ticket
To: bot <bot@hitscorredoraseguros.cl>

El caso está solucionado.
`,
  `<div>El problema fue <strong>resuelto</strong>.</div>`,
];

(async () => {
  console.log("Testing AI Resolution Logic...");

  for (const sample of samples) {
    console.log("\n--- Analyzing Sample ---");
    console.log(`"${sample.substring(0, 50)}..."`);
    try {
      const result = await aiService.analyzeReply(sample);
      console.log("Result:", result);
    } catch (e) {
      console.error("Error:", e);
    }
  }
})();
