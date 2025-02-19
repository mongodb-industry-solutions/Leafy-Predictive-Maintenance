// This module exports a function that returns a MongoDB change stream
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_CONNECTION_STRING;
const options = {};
const changeStreams = new Map();
const dbName = process.env.DATABASE;
const collectionName = process.env.FAILURES_COLLECTION;

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  global._mongoClientPromise = clientPromise;
} else {
  clientPromise = global._mongoClientPromise;
}

/**
 * Returns a MongoDB change stream for insert and update operations
 * in the failures collection, with fullDocument lookup enabled.
 */
async function getChangeStream(key) {
  if (!changeStreams.has(key)) {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // We define a static pipeline to watch only inserts
    const pipeline = [
      {
        $match: {
          operationType: { $in: ['insert'] },
        },
      },
    ];

    // Create the change stream with fullDocument lookup
    const changeStream = collection.watch(pipeline, {
      fullDocument: 'updateLookup',
    });

    changeStream.on('change', (change) => {
      //console.log("Change: ", change);
    });

    changeStream.on('error', (error) => {
      console.log('Error: ', error);
    });

    changeStreams.set(key, changeStream);
  }
  return changeStreams.get(key);
}

export { clientPromise, getChangeStream };
