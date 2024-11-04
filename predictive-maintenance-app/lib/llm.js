const LLM_PROVIDER_API_KEY = process.env.LLM_PROVIDER_API_KEY;
const LLM_PROVIDER_API_COMPLETIONS_MODEL = process.env.LLM_PROVIDER_API_COMPLETIONS_MODEL;
const LLM_PROVIDER_API_EMBEDDINGS_MODEL = process.env.LLM_PROVIDER_API_EMBEDDINGS_MODEL;
const LLM_PROVIDER_BASE_URL = process.env.LLM_PROVIDER_BASE_URL;

export async function getEmbeddings(question) {
    const response = await fetch(`${LLM_PROVIDER_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_PROVIDER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: [question],
        model: LLM_PROVIDER_API_EMBEDDINGS_MODEL,
        input_type: "query",
        encoding_format: 'float',
        truncate: "NONE"
      })
    });
  
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
  
    const data = await response.json();
    return data.data[0].embedding;
  }