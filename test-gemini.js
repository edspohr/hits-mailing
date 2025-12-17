require("dotenv").config({ path: "./server/.env" });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  console.log("Testing Key:", key ? key.substring(0, 5) + "..." : "MISSING");

  if (!key) {
    console.error("No API Key found in .env");
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = "Reply with 'OK'.";
    console.log("Sending prompt to Gemini (gemini-2.5-flash)...");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log("SUCCESS! Gemini replied:", response.text());
  } catch (error) {
    console.error("FAILURE!", error.message);
  }
}

testGemini();
