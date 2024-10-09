import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function generateCompletion(prompt) {
  const input = {
    modelId: "cohere.command-r-v1:0",
    contentType: "application/json",
    accept: "*/*",
    body: JSON.stringify({
      message: prompt,
      max_tokens: 400,
      temperature: 0.75,
      p: 0.01,
      k: 0,
      stop_sequences: [],
    }),
  };

  const command = new InvokeModelCommand(input);
  const response = await bedrockClient.send(command);
  const rawRes = response.body;

  const jsonString = new TextDecoder().decode(rawRes);
  const parsedResponse = JSON.parse(jsonString);

  return parsedResponse.text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { answer_pre, translatedTextFirstValue } = req.body;
  console.log("previous answer is " + answer_pre);
  console.log("translated text is " + translatedTextFirstValue);

  if (!answer_pre) {
    return res.status(400).json({ message: "Repair plan is required" });
  }

  try {
    const prompt = `Update the repair plan using the points mentioned in the service notes. Both repair plan and service notes are provided in the context.\n\nContext:\nRepair plan: ${answer_pre}\nService notes: ${translatedTextFirstValue}`;

    const completion = await generateCompletion(prompt);
    const answer_new = completion.replace("\n", "\n\n");

    console.log("New answer is: " + answer_new);
    res.status(200).json({ answer_new });
  } catch (error) {
    console.error("Error generating answer:", error);
    res
      .status(500)
      .json({ message: "Error generating answer", error: error.message });
  }
}
