import { MongoClient } from "mongodb";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";

const AI_MODEL_PROVIDER = process.env.AI_MODEL_PROVIDER;
const uri = process.env.MONGODB_CONNECTION_STRING;
const dbName = process.env.DATABASE;
const collectionName = process.env.MAINTAINENCE_HISTORY_COLLECTION;
const indexNameOpenAI = process.env.CRITICALITY_ANALYSIS_SEARCH_INDEX_OPEN_AI;
const indexNameCohere = process.env.CRITICALITY_ANALYSIS_SEARCH_INDEX;

const client = new MongoClient(uri);

let model, embeddings, getEmbeddings, generateCompletion;

if (AI_MODEL_PROVIDER === "openai") {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_API_MODEL = process.env.OPENAI_API_MODEL;
  console.log("Using OpenAI");

  model = new ChatOpenAI({
    apiKey: OPENAI_API_KEY,
    modelName: OPENAI_API_MODEL,
  });

  embeddings = new OpenAIEmbeddings({
    apiKey: OPENAI_API_KEY,
  });

  getEmbeddings = async (texts) => {
    return await embeddings.embedQuery(texts[0]);
  };

  generateCompletion = async (prompt) => {
    const response = await model.invoke([
      new HumanMessage({ content: prompt }),
    ]);
    return response.content.trim();
  };
} else if (AI_MODEL_PROVIDER === "cohere") {
  console.log("Using Cohere");
  const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  getEmbeddings = async (texts) => {
    const input = {
      modelId: "cohere.embed-english-v3",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        texts,
        input_type: "search_document",
      }),
    };

    const command = new InvokeModelCommand(input);
    const response = await bedrockClient.send(command);
    const rawRes = response.body;

    const jsonString = new TextDecoder().decode(rawRes);
    const parsedResponse = JSON.parse(jsonString);

    return parsedResponse.embeddings;
  };

  const llm = new BedrockChat({
    model: "cohere.command-r-v1:0",
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  generateCompletion = async (prompt) => {
    const conversation = [
      ["system", "You are a helpful assistant."],
      ["human", prompt],
    ];

    const aiMessage = await llm.invoke(conversation);
    return aiMessage.content.trim();
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  let { question, selectedDocuments } = req.body;
  selectedDocuments = selectedDocuments.map((i) => i + ".pdf");

  if (!question || !selectedDocuments) {
    return res
      .status(400)
      .json({ message: "Question and selected documents are required" });
  }

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    console.log("Connected to MongoDB");

    const vector = await getEmbeddings([question]);
    console.log(vector);

    const filter = { "source.filename": { $in: selectedDocuments } };
    const indexName =
      AI_MODEL_PROVIDER === "openai" ? indexNameOpenAI : indexNameCohere;

    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: indexName,
            path:
              AI_MODEL_PROVIDER === "openai"
                ? "embeddings_openai"
                : "embeddings",
            queryVector: AI_MODEL_PROVIDER === "openai" ? vector : vector[0],
            numCandidates: 150,
            limit: 10,
            filter: filter,
          },
        },
      ])
      .toArray();

    const dataSources = results.map((obj) => ({ source: obj.source }));
    const context = results.map((result) => result.text_chunk).join("\n");

    const prompt = `Given the following context sections, answer the question using only the given context. If you are unsure and the answer is not explicitly written in the documentation, say "Sorry, I don't know how to help with that as I cannot find this information in the docs you provided."\n\nContext:\n${context}\n\nQuestion: ${question}`;

    const answer = await generateCompletion(prompt);
    res.status(200).json({ answer, dataSources });
  } catch (error) {
    console.error("Error in handler:", error);
    res
      .status(500)
      .json({ message: "Error generating answer", error: error.message });
  } finally {
    await client.close();
  }
}
