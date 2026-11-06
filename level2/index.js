import express from "express";
import dotenv from "dotenv";
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(express.json());

const tool1 = new TavilySearch({
  maxResults: 5,
  topic: "general",
});

// custom tool
const tool2 = tool(
  ({ a, b }) => {
    return `addition of ${a} and ${b} is ${a + b}`;
  },
  {
    name: "addition_tool",
    description: "use this tool to add two numbers together",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  },
);

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_EMAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

// Custom email tool
const tool3 = tool(
  async ({ to, subject, body }) => {
    const info = await transporter.sendMail({
      from: process.env.GOOGLE_EMAIL,
      to,
      subject,
      text: body,
    });

    return `Email sent successfully to ${to}. Message ID: ${info.messageId}`;
  },
  {
    name: "send_email",
    description:
      "Use this tool to send an email to a recipient. Requires the recipient email address, subject, and email body. Use this tool whenever the user explicitly asks you to send an email.",
    schema: z.object({
      to: z.string().email().describe("Recipient email address"),
      subject: z.string().min(1).describe("Subject of the email"),
      body: z.string().min(1).describe("Content of the email"),
    }),
  },
);

const model = new ChatGoogle("gemini-3.6-flash");

const agent = createAgent({
  model,
  tools: [tool1, tool2, tool3],
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
    console.dir(result.messages, { depth: null });
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
