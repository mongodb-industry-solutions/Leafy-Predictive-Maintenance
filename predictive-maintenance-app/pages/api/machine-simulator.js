import { MongoClient } from 'mongodb';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import csv from 'csv-parser';
import path from 'path';
import { getSessionId, resetSessionId } from '../../app/failure-prediction/utils/session-manager';

const pipelineAsync = promisify(pipeline);


const uri = process.env.MONGODB_CONNECTION_STRING;
const dbname=process.env.DATABASE;
const collectionname = process.env.RAW_DATA_COLLECTION;
const transformedcollectionname = process.env.TRANSFORMED_DATA_COLLECTION;
const failurescollectionname = process.env.FAILURES_COLLECTION


let shouldStop = false;


export default async function handler(req, res) {
  if (req.method === 'GET') {
    shouldStop = false;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const client = new MongoClient(uri);
    try {
      await client.connect();
      const database = client.db(dbname);
      const collection = database.collection(collectionname);
      const transformedCollection = database.collection(transformedcollectionname);
      const failuresCollection = database.collection(failurescollectionname);
      
      const estimate = await failuresCollection.estimatedDocumentCount();
     console.log(`Estimated number of documents in the failures collection: ${estimate}`);

      failuresCollection.deleteMany({});
      const estimate2 = await failuresCollection.estimatedDocumentCount();
      console.log(`Estimated number of documents now in the failures collection: ${estimate2}`);


      const sessionId = getSessionId();
      console.log('Session ID:', sessionId);

         // Listen to changes in the transformed_data collection with the same session ID
         const changeStream = transformedCollection.watch([
          { $match: { 'fullDocument.sessionID': sessionId } }
        ]);

        changeStream.on('change', async (change) => {
          if (change.operationType === 'insert') {
            const transformedDoc = change.fullDocument;
            const rawDoc = await collection.findOne({}, { sort: { _id: -1 } }); 
            if (rawDoc) {
              res.write(`data: ${JSON.stringify({ rawDoc, transformedDoc })}\n\n`);
              //console.log('Found transformed doc ', transformedDoc);

              res.flush();  // Ensure data is sent immediately
            }
          }
        });
  


      const processRow = async (row) => {
        if (shouldStop) {
          res.write('event: stop\n');
          res.write('data: Processing stopped\n\n');
          res.end();
          changeStream.close();  // Close the change stream when processing stops
          await client.close();
          return;
        }
        const jsonRow = {
          "Product ID": row['Product ID'],
          "Type": row['Type'],
          "Air temperature [K]": row['Air temperature [K]'],
          "Process temperature [K]": row['Process temperature [K]'],
          "Rotational speed [rpm]": row['Rotational speed [rpm]'],
          "Torque [Nm]": row['Torque [Nm]'],
          "Tool wear [min]": row['Tool wear [min]'],
          "Session ID": sessionId
        };

        try {
          await collection.insertOne(jsonRow);
          //res.write(`data: ${JSON.stringify(jsonRow)}\n\n`);
          //res.flush()
         // console.log('Inserted row:', jsonRow);
        } catch (err) {
          console.error('Error inserting row:', err);
        }
      };

      const processCSV = async () => {
        const csvFilePath = path.resolve(process.cwd(), 'app/failure-prediction/public', 'test_data.csv');
        await pipelineAsync(
          fs.createReadStream(csvFilePath).pipe(csv()),
          async function* (source) {
            for await (const row of source) {
              if (shouldStop) {
                res.write('event: stop\n');
                res.write('data: Processing stopped\n\n');
                res.end();
                changeStream.close();  // Close the change stream when processing stops
                await client.close();
                return;
              }
              await new Promise(resolve => setTimeout(resolve, 2000));
              await processRow(row);
            }
          }
        );
        if (!shouldStop) {
          console.log('CSV file successfully processed');
          res.write('event: end\n');
          res.write('data: Process completed\n\n');
          res.end();
          changeStream.close();  // Close the change stream when processing completes
          await client.close();
        }
      };

      await processCSV();
    } catch (err) {
      console.error('Error connecting to MongoDB:', err);
      res.status(500).send('Internal Server Error');
      await client.close();  // Ensure the client is closed on error
    } 
  } else if (req.method === 'POST') {
    shouldStop = true;
    res.status(200).send('Stopping process');
  } else {
    res.status(405).send('Method Not Allowed');
  }
}