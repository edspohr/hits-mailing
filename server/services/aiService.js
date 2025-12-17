const { GoogleGenerativeAI } = require("@google/generative-ai");
const rules = require("../config/rules");
require("dotenv").config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "MOCK_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

module.exports = {
  /**
   * Analyzes an incoming new email to categorize it.
   */
  analyzeNewTicket: async (subject, body, sender) => {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("No GEMINI_API_KEY. Returning mock analysis.");
      return {
        category: "Otro",
        urgency: "Media",
        summary: "Resumen simulado (Sin API Key)",
        sentiment: "Neutral",
      };
    }

    const categories = rules.getCategories();

    const prompt = `
      Actúa como un asistente de triaje de correos para "Hits Corredora de Seguros". Analiza el siguiente correo electrónico.
      
      Remitente: ${sender}
      Asunto: ${subject}
      Cuerpo: ${body}
      
      Tus tareas:
      1. Clasifica el correo en una de estas categorías: [${categories}].
         - Si el usuario menciona explícitamente que es una "prueba", "test", o "validación", clasifícalo como 'Prueba'.
         - Si tiene que ver explícitamente con "RC Médica", "Responsabilidad Civil", "Mala Praxis", clasifícalo como 'Responsabilidad Civil Médica'.
         - Cualquier otro tipo de seguro (Auto, Hogar, Vida, Incendio, etc) clasifícalo como 'Otros Seguros'.
      2. Determina la urgencia (Baja, Media, Alta).
      3. Genera un resumen ejecutivo de 1 linea.
      4. Analiza el sentimiento (Positivo, Negativo, Neutral).

      Responde ÚNICAMENTE con un JSON válido con este formato:
      {
        "category": "string",
        "urgency": "string",
        "summary": "string",
        "sentiment": "string"
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      // Cleanup json if markdown ticks are present
      const jsonStr = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Error classifying email with Gemini:", error);
      // Fallback
      return {
        category: "Otro",
        urgency: "Media",
        summary: "Error al analizar",
        sentiment: "Neutral",
      };
    }
  },

  /**
   * Analyzes a reply to determine if the ticket should be closed.
   */
  analyzeReply: async (body) => {
    if (!process.env.GEMINI_API_KEY) {
      return { isResolved: false, reason: "Mock" };
    }

    const prompt = `
      Actúa como supervisor. Analiza la siguiente respuesta de un agente de soporte hacia un cliente o interna.
      Determina si, basándote explícitamente en el texto, el problema ha sido RESUELTO o el ticket CERRADO.
      Busca frases como "quedó solucionado", "ticket cerrado", "listo", "ya arreglamos el problema", "procesado con éxito".
      
      Cuerpo: ${body}

      Responde ÚNICAMENTE con un JSON válido:
      {
        "isResolved": boolean,
        "reason": "Breve justificación de por qué crees que está resuelto o no"
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonStr = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Error analyzing reply:", error);
      return { isResolved: false };
    }
  },
};
