import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
import { ChatGoogle } from "@langchain/google";

/* const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
*/

const app = express();

app.use(express.json());

/**
 * const main = async () => {
 *   const response = await ai.models.generateContentStream({
 *     model: "gemini-3.1-flash-lite",
 *     contents: "Who is Nibedan Pati ? Do you know him ?",
 *   });
 *
 *   for await (const chunk of response) {
 *     console.log(chunk.text);
 *   }
 * };
 */
// main();

// project

/* app.post("/chat", async (req, res) => {
  const { prompt } = req.body;
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
  });
  const result = await response.text;
  return res.json({ result });
});
*/

// langchain implementation

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;
  const ai = new ChatGoogle("gemini-3.1-flash-lite");
  const result = await ai.invoke(prompt);
  return res.json({ result: result.content });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server is running on port " + port);
});
