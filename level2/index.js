import express from "express";
import dotenv from "dotenv";
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import { createAgent } from "langchain";

dotenv.config();

const app = express();
app.use(express.json());

const tool = new TavilySearch({
  maxResults: 5,
  topic: "general",
});

const model = new ChatGoogle("gemini-3.6-flash");

const agent = createAgent({
  model,
  tools: [tool],
});

app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    const result = await agent.invoke({
      messages: [{ role: "user", content: prompt }],
    });

    const lastMessage = result.messages[result.messages.length - 1];
    return res.json({ response: lastMessage.content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server is running on port " + port);
});
