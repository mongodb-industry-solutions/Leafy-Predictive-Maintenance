import { MongoClient } from "mongodb";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";

const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function getEmbeddings(texts) {
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
}

const llm = new BedrockChat({
  model: "cohere.command-r-v1:0",
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function generateCompletion(prompt) {
  try {
    const conversation = [
      ["system", "You are a helpful assistant."],
      ["human", prompt],
    ];

    const aiMessage = await llm.invoke(conversation);
    console.log(aiMessage);

    const response = aiMessage.content.trim();
    return response;
  } catch (error) {
    console.error("Error generating completion:", error);
    throw new Error("Failed to generate completion");
  }
}

export default async function handler(
  req = NextApiRequest,
  res = NextApiResponse
) {
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
    const db = client.db(process.env.DATABASE);
    const collection = db.collection(
      process.env.MAINTAINENCE_HISTORY_COLLECTION
    );

    console.log("Connected to MongoDB");

    const vector = await getEmbeddings([question]);

    const filter = { "source.filename": { $in: selectedDocuments } };

    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: process.env.CRITICALITY_ANALYSIS_SEARCH_INDEX,
            path: "embeddings",
            queryVector: vector[0],
            numCandidates: 150,
            limit: 15,
            filter: filter,
          },
        },
      ])
      .toArray();

    const dataSources = results.map((obj) => ({ source: obj.source }));
    const context = results.map((result) => result.text_chunk).join("\n");

    const prompt = `Given the following context sections, answer the question using only the given context. If you are unsure and the answer is not explicitly written in the documentation, say "Sorry, I don't know how to help with that as I cannot find this information in the docs you provided."\n\nContext:\n${context}\n\nQuestion: ${question}`;

    const response = await generateCompletion(prompt);

    const answer = response.trim();
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
