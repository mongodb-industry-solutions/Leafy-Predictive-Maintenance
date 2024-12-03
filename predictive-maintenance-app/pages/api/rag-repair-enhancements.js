import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";

const AI_MODEL_PROVIDER = process.env.AI_MODEL_PROVIDER;

let model, generateCompletion;

if (AI_MODEL_PROVIDER === "openai") {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_API_MODEL = process.env.OPENAI_API_MODEL;
  console.log("Using OpenAI");

  model = new ChatOpenAI({
    apiKey: OPENAI_API_KEY,
    modelName: OPENAI_API_MODEL,
  });

  generateCompletion = async (prompt) => {
    const response = await model.invoke([
      new HumanMessage({ content: prompt }),
    ]);
    return response.content.trim();
  };
} else if (AI_MODEL_PROVIDER === "cohere") {
  console.log("Using Cohere");
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

  const { answer_pre, translatedTextFirstValue } = req.body;

  if (!answer_pre) {
    return res.status(400).json({ message: "Repair plan is required" });
  }

  try {
    const prompt = `Update the repair plan using the points mentioned in the service notes. Both repair plan and service notes are provided in the context.\n\nContext:\nRepair plan: ${answer_pre}\nService notes: ${translatedTextFirstValue}`;

    const answer_new = await generateCompletion(prompt);
    res.status(200).json({ answer_new });
  } catch (error) {
    console.error("Error generating answer:", error);
    res
      .status(500)
      .json({ message: "Error generating answer", error: error.message });
  }
}
