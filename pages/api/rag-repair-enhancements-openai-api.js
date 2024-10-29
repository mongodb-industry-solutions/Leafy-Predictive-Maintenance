import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_MODEL = process.env.OPENAI_API_MODEL;

const model = new ChatOpenAI({
  apiKey: OPENAI_API_KEY,
  modelName: OPENAI_API_MODEL,
});

const embeddings = new OpenAIEmbeddings({
  apiKey: OPENAI_API_KEY,
});

export default async function handler(
  req = NextApiRequest,
  res = NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { answer_pre, translatedTextFirstValue } = req.body;
  if (!answer_pre) {
    return res.status(400).json({ message: "Question is required" });
  }

  try {
    const prompt = `Update the repair plan using the points mentioned in the service notes. Both repair plan and service notes are provided in the context"\n\nContext:\n"repair plan = ${answer_pre} and translated text = ${translatedTextFirstValue}`;
    const response = await model.invoke([
      new HumanMessage({ content: prompt }),
    ]);
    const answer_new = response.content.replace("\n", "\n\n");
    res.status(200).json({ answer_new });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error generating answer", error: error.message });
  }
}
