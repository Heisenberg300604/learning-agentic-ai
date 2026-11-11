import express from "express";
import dotenv from "dotenv";
import { ChatGroq } from "@langchain/groq";

dotenv.config();

const app = express();
app.use(express.json());

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
});


const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server is running on port " + port);
});
