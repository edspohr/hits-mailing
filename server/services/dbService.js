const { Pool } = require("pg");
require("dotenv").config();

// Config for Railway or local Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false, // Railway needs SSL
});

// Helper to init DB
const initDB = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      original_subject TEXT,
      from_address TEXT,
      category TEXT,
      urgency TEXT,
      summary TEXT,
      sentiment TEXT,
      assigned_to TEXT,
      email_body TEXT,
      status TEXT DEFAULT 'OPEN',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS ticket_comments (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER REFERENCES tickets(id),
      from_address TEXT,
      body TEXT,
      ai_analysis JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    const client = await pool.connect();
    await client.query(createTableQuery);
    client.release();
    console.log("DB Initialized (Tables Verified)");
  } catch (err) {
    console.error("Error initializing DB:", err);
  }
};

// Auto-init on load (or call externally)
if (process.env.DATABASE_URL) {
  initDB();
} else {
  console.log(
    "No DATABASE_URL found. Skipping auto-init. (Mock Mode Active if DB calls fail)"
  );
}

module.exports = {
  createTicket: async (ticketData) => {
    if (!process.env.DATABASE_URL) {
      console.log("[MOCK DB] Created ticket:", ticketData.summary);
      return "MOCK-" + Math.floor(Math.random() * 1000);
    }

    const query = `
      INSERT INTO tickets (original_subject, from_address, category, urgency, summary, sentiment, assigned_to, email_body, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPEN')
      RETURNING id;
    `;
    const values = [
      ticketData.originalSubject,
      ticketData.from,
      ticketData.category,
      ticketData.urgency,
      ticketData.summary,
      ticketData.sentiment,
      ticketData.assignedTo,
      ticketData.emailBody,
    ];

    const res = await pool.query(query, values);
    return res.rows[0].id;
  },

  updateTicketStatus: async (ticketId, status) => {
    if (!process.env.DATABASE_URL) return;
    await pool.query(
      "UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2",
      [status, ticketId]
    );
  },

  addTicketComment: async (ticketId, commentData) => {
    if (!process.env.DATABASE_URL) return;
    const query = `
      INSERT INTO ticket_comments (ticket_id, from_address, body, ai_analysis)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(query, [
      ticketId,
      commentData.from,
      commentData.body,
      commentData.aiAnalysis,
    ]);
  },

  listTickets: async () => {
    if (!process.env.DATABASE_URL) {
      // Return fake data for local dev without DB
      return [
        {
          id: 999,
          summary: "Demo Ticket (No DB connection)",
          status: "OPEN",
          category: "Demo",
          urgency: "Low",
          assigned_to: "admin@demo.com",
        },
      ];
    }
    const res = await pool.query(
      "SELECT * FROM tickets ORDER BY created_at DESC"
    );
    // Map camelCase for frontend consistency if needed, or just return rows
    // Doing quick mapping:
    return res.rows.map((row) => ({
      id: row.id,
      originalSubject: row.original_subject,
      from: row.from_address,
      category: row.category,
      urgency: row.urgency,
      summary: row.summary,
      sentiment: row.sentiment,
      assignedTo: row.assigned_to,
      status: row.status,
      createdAt: row.created_at,
    }));
  },
};
