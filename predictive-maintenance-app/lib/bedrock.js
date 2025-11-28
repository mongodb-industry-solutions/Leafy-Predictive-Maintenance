import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

const AWS_REGION = process.env.AWS_REGION;
const AWS_PROFILE = process.env.AWS_PROFILE;

function getBedrockCredentials() {
  return defaultProvider(AWS_PROFILE ? { profile: AWS_PROFILE } : {});
}

let cachedBedrockRuntimeClient = null;

export function getBedrockRuntimeClient() {
  if (cachedBedrockRuntimeClient) return cachedBedrockRuntimeClient;
  
  cachedBedrockRuntimeClient = new BedrockRuntimeClient({
    region: AWS_REGION,
    credentials: getBedrockCredentials(),
  });
  
  return cachedBedrockRuntimeClient;
}

export function createBedrockChat(modelName) {
  return new BedrockChat({
    model: modelName,
    region: AWS_REGION,
    credentials: getBedrockCredentials(),
  });
}

