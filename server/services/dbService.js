const admin = require("firebase-admin");
require("dotenv").config();

// Initialize Firebase
// In a real scenario, we handle if the file doesn't exist gracefully or use mock
let db;

try {
  // Check if service account path is defined and file exists
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // NOTE: Depending on how the user runs this, we might need absolute path
    // For now, we assume requirements are met or we mock.
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    db = admin.firestore();
    console.log("Firebase initialized successfully.");
  } else {
    console.warn(
      "FIREBASE_SERVICE_ACCOUNT_PATH not set. Database operations will be mocked."
    );
  }
} catch (error) {
  console.warn("Error initializing Firebase (Mocking active):", error.message);
}

// Mock DB for when credentials aren't present
const mockDb = {
  collection: (name) => ({
    add: async (data) => {
      console.log(`[MOCK DB] Added to ${name}:`, data);
      return { id: "MOCK-ID-" + Math.floor(Math.random() * 1000) };
    },
    doc: (id) => ({
      update: async (data) =>
        console.log(`[MOCK DB] Updated ${name}/${id}:`, data),
      collection: (subName) => ({
        add: async (data) =>
          console.log(`[MOCK DB] Added to ${name}/${id}/${subName}:`, data),
      }),
      set: async (data) => console.log(`[MOCK DB] Set ${name}/${id}:`, data),
    }),
  }),
};

const getDb = () => db || mockDb;

module.exports = {
  /**
   * Creates a new ticket in Firestore
   */
  createTicket: async (ticketData) => {
    try {
      ticketData.createdAt = new Date();
      ticketData.status = "OPEN";
      const docRef = await getDb().collection("tickets").add(ticketData);
      console.log(`Ticket created in DB with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error("Error creating ticket:", error);
      throw error;
    }
  },

  /**
   * Updates a ticket status
   */
  updateTicketStatus: async (ticketId, status) => {
    try {
      await getDb().collection("tickets").doc(ticketId).update({
        status: status,
        updatedAt: new Date(),
      });
      console.log(`Ticket ${ticketId} updated to ${status}`);
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  },

  /**
   * Lists all tickets (Simple implementation)
   */
  listTickets: async () => {
    try {
      const snapshot = await getDb().collection("tickets").get();
      if (!snapshot.docs) return []; // Mock handling
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.warn("Error listing tickets (likely mock mode or empty):", error);
      return [];
    }
  },

  /**
   * Adds a comment/reply to the ticket history
   */
  addTicketComment: async (ticketId, commentData) => {
    try {
      await getDb()
        .collection("tickets")
        .doc(ticketId)
        .collection("history")
        .add({
          ...commentData,
          createdAt: new Date(),
        });
      console.log(`Comment added to ticket ${ticketId}`);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  },
};
