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
    const rulesDetail = rules.rulesDetail || "";

    const prompt = `
      Actúa como un asistente de triaje de correos para "Hits Corredora de Seguros". Analiza el siguiente correo electrónico.
      
      Remitente: ${sender}
      Asunto: ${subject}
      Cuerpo: ${body}
      
      Reglas de Asignación:
      ${rulesDetail}

      Tus tareas:
      1. Clasifica el correo en EXACTAMENTE una de estas categorías: [${categories}].
         - Prioriza "Cobranza" si habla de pagos, facturas, deudas.
         - Prioriza "Certificados..." si pide emitir un certificado.
         - Prioriza "Cotizaciones" si es una solicitud de nuevo seguro o RCM.
         - Si es "Consulta general", decide entre Rodrigo (Operativo/General) o Juan Pablo (Comercial/Grandes Clientes) según el tono y contenido. Si dudas, usa "Consultas generales (Rodrigo)".
      
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
      Eres un supervisor de tickets. Analiza la siguiente respuesta y determina si indica que el ticket está RESUELTO.
      
      IMPORTANTE: Responde isResolved: true si el mensaje contiene CUALQUIERA de estos indicadores:
      - "resuelto", "solucionado", "listo", "ok", "hecho", "completado"
      - "ticket cerrado", "caso cerrado", "problema resuelto", "cerrar ticket"
      - "ya está", "quedó listo", "arreglado"
      - "procesado", "gestionado", "tramitado", "finalizado"
      - Cualquier confirmación de que el trabajo está terminado o instrucciones de cerrar.
      
      Cuerpo del mensaje:
      ---
      ${body}
      ---

      Responde ÚNICAMENTE con un JSON válido:
      {
        "isResolved": boolean,
        "reason": "Breve justificación"
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
