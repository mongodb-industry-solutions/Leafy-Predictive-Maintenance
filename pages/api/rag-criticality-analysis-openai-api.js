import { MongoClient } from "mongodb";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_MODEL = process.env.OPENAI_API_MODEL;
const uri = process.env.MONGODB_CONNECTION_STRING;
const dbName = process.env.DATABASE_OPEN_AI;
const collectionName = process.env.MAINTAINENCE_HISTORY_COLLECTION;
const indexName = process.env.CRITICALITY_ANALYSIS_SEARCH_INDEX_OPEN_AI;

const model = new ChatOpenAI({
  apiKey: OPENAI_API_KEY,
  modelName: OPENAI_API_MODEL,
});

const embeddings = new OpenAIEmbeddings({
  apiKey: OPENAI_API_KEY,
});

const client = new MongoClient(uri);

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
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    console.log("connected to MongoDB");

    const vector = await embeddings.embedQuery(question);

    const filter = { "source.filename": { $in: selectedDocuments } };
    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: indexName,
            path: "vector_embedding",
            queryVector: vector,
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

    const response = await model.invoke([
      new HumanMessage({ content: prompt }),
    ]);

    const answer = response.content.trim();
    res.status(200).json({ answer, dataSources });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error generating answer", error: error.message });
  }
}
