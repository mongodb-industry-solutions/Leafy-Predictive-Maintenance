import { BedrockChat } from "@langchain/community/chat_models/bedrock";

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

    const response = aiMessage.content.trim();
    return response;
  } catch (error) {
    console.error("Error generating completion:", error);
    throw new Error("Failed to generate completion");
  }
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

    const completion = await generateCompletion(prompt);
    const answer_new = completion.replace("\n", "\n\n");

    res.status(200).json({ answer_new });
  } catch (error) {
    console.error("Error generating answer:", error);
    res
      .status(500)
      .json({ message: "Error generating answer", error: error.message });
  }
}
