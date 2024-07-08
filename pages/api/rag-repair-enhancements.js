import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import {HumanMessage} from "@langchain/core/messages";



  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_API_MODEL=process.env.OPENAI_API_MODEL;
  const uri = process.env.MONGODB_CONNECTION_STRING;
  const dbName=process.env.DATABASE;
  const collectionName = process.env.REPAIR_MANUALS_COLLECTION; 
  const indexName=process.env.REPAIR_PLAN_SEARCH_INDEX;


  //initialize model and embeddings
  const model = new ChatOpenAI({
    apiKey: OPENAI_API_KEY,
    modelName: OPENAI_API_MODEL,
  });
  
  const embeddings = new OpenAIEmbeddings({
    apiKey: OPENAI_API_KEY,
  });



  // Initialize MongoDB Client
  //const client = new MongoClient(uri);

  export default async function handler(req = NextApiRequest, res = NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    const { answer_pre, translatedTextFirstValue} = req.body;
    console.log("previous answer is " +  answer_pre);
    console.log("translated text is " + translatedTextFirstValue);
    if (!answer_pre) {
      return res.status(400).json({ message: 'Question is required' });
    }
  
    try {
      // Connect to MongoDB
      //await client.connect();
      //const db = client.db(dbName);
      //const collection = db.collection(collectionName);
      //console.log("connected to MongoDB");
      //console.log(answer);
  
      // Generate vector embeddings for the question
      //const vector = await embeddings.embedQuery(question);
     // console.log(vector);
   /*
      const results = await collection.aggregate([
        {
          "$vectorSearch": {
            "index": indexName,
            "path": 'vector_embedding',
            "queryVector": vector,
            "numCandidates": 150,
            "limit": 10
          }

        },
      ]).toArray();
      */

      //console.log(results);
      // Store the sources of data
      //const dataSources = results.map(obj => ({ source: obj.source }));
      //console.log(dataSources);
      // Create context from search results
      //const context = results.map(result => result.text_chunk).join('\n');
      // Create prompt with context
      const prompt = `Update the repair plan using the points mentioned in the service notes. Both repair plan and service notes are provided in the context"\n\nContext:\n"repair plan = ${answer_pre} and translated text = ${translatedTextFirstValue}`;
  
      // Generate answer from LLM with context
      const response =  await model.invoke([new HumanMessage({ content: prompt })]);

    // console.log(response);

  
  
      const answer_new = response.content.replace('\n','\n\n');
      console.log("new answer is: " + answer_new);
      res.status(200).json({ answer_new });
    } catch (error) {
      res.status(500).json({ message: 'Error generating answer', error: error.message });
    }
  }