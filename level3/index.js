import express from "express";
import dotenv from "dotenv";
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import nodemailer from "nodemailer";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, StateSchema } from "@langchain/langgraph";
import { MessagesAnnotation, MemorySaver } from "@langchain/langgraph";
import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";

dotenv.config();

const app = express();
app.use(express.json());

const client = new MongoClient(
  "mongodb+srv://nibedanpati:U8VAZj7wUsOmybn6@cluster1.couxdos.mongodb.net",
);
const checkpointer = new MongoDBSaver({ client });

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

const tools = [tool1, tool2, tool3];
const model = new ChatGoogle("gemini-3.6-flash").bindTools(tools);

const toolNode = new ToolNode(tools);

const agent = async (state) => {
  const result = await model.invoke(state.messages);

  return {
    messages: [result],
  };
};

const shouldContinue = (state) => {
  if (state.messages[state.messages.length - 1].tool_calls.length > 0) {
    return "tool_node";
  } else {
    return "__end__";
  }
};

const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", agent)
  .addNode("tool_node", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tool_node", "agent")
  .compile({ checkpointer });

app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    const result = await graph.invoke(
      {
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        configurable: {
          thread_id: "user-1",
        },
      },
    );

    console.log(result.messages);

    return res.json(result.messages[result.messages.length - 1].content);
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server is running on port " + port);
});
