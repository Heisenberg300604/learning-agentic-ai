import express from "express";
import dotenv from "dotenv";
import { ChatGroq } from "@langchain/groq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { ApiError } from "@google/genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

dotenv.config();

const app = express();
app.use(express.json());

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001", // 768 dimensions
});

const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
  url: process.env.QDRANT_URL,
  collectionName: "nodejsdocumentation",
  apiKey: process.env.QDRANT_API_KEY
});

const upload = async () => {
  const path = "./knowledge.pdf";
  const buffer = fs.readFileSync(path);
  const pdfResult = new PDFParse({ data: buffer })
  const result = await pdfResult.getText()
  const text = result.text
  const spilitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
  })
  const docs = await spilitter.createDocuments([text])
  await vectorStore.addDocuments(docs)
}

app.post("/chat",async (req,res)=>{
   const {prompt}=req.body
   const docs=await vectorStore.similaritySearch(prompt,5)
   const context=docs.map(doc=>doc.pageContent).join("/n")
   const result=await model.invoke([
    {
        role:"system",
        content:`you are a rag assistant and use this context ${context}`
    },
    {
        role:"human",
        content:prompt
    }
   ])
   return res.json(result.content)
})

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server is running on port " + port);
});
