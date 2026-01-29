const { Pool } = require("pg");
require("dotenv").config({ path: "../server/.env" }); // Try to load from server if local

// Fallback to minimal if run directly with env var
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "ERROR: DATABASE_URL not found. lease run with: DATABASE_URL=... node cleanup_production.js",
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function pruneData() {
  const client = await pool.connect();
  try {
    console.log("--- CLEANUP STARTED ---");
    console.log("Target: Delete tickets with ID <= 75");

    await client.query("BEGIN");

    // 1. Delete comments first (Foreign Key constraint)
    const deleteCommentsRes = await client.query(
      "DELETE FROM ticket_comments WHERE ticket_id <= 75",
    );
    console.log(`Deleted ${deleteCommentsRes.rowCount} comments.`);

    // 2. Delete tickets
    const deleteTicketsRes = await client.query(
      "DELETE FROM tickets WHERE id <= 75",
    );
    console.log(`Deleted ${deleteTicketsRes.rowCount} tickets.`);

    await client.query("COMMIT");
    console.log("--- CLEANUP SUCCESS ---");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("ERROR during cleanup:", e);
  } finally {
    client.release();
    pool.end();
  }
}

pruneData();
