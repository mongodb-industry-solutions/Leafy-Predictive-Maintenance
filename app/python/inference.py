import pymongo
import pickle
import os
import blosc
import datetime
import pandas as pd
from sklearn import tree
from pymongo import MongoClient
from bson.json_util import dumps

MONGODB_CONNECTION_STRING = os.environ.get('MONGODB_CONNECTION_STRING')
DATABASE=os.environ.get('DATABASE')
FAILURES_COLLECTION=os.environ.get('FAILURES_COLLECTION')
DATA_COLLECTION=os.environ.get('DATA_COLLECTION')
MODELS_COLLECTION=os.environ.get('MODELS_COLLECTION')


def add_latest_failure(client, prediction, machine_id):
    client = MongoClient(MONGODB_CONNECTION_STRING)
    db = client[DATABASE]
    collection_failure = db[FAILURES_COLLECTION]
    # Different failure categories
    failures = ['No Failure', 'Power Failure','Overstrain Failure','Tool Wear Failure', 'Random Failures','Heat Dissipation Failure']
    # Below document will be inserted in failure collection.
    failure_doc = {
        "machineID" : machine_id,
        "failure" : failures[prediction],
        "ts": datetime.datetime.utcnow(),
        "isAcknowledged": False,
        "repairSteps": ""
        #"repairSteps": "1. Shut down the CNC milling machine to ensure safety during maintenance procedures. \n2. Inspect the cutting tool and machine components for signs of wear or damage. \n3. Remove the worn-out cutting tool from the spindle. \n4. Replace the cutting tool with a new one from inventory (Part No.: CT-123). \n5. Adjust cutting parameters and tool offsets as necessary for optimal  performance. \n6. Conduct test machining operations to verify cutting performance and quality. \n7. Document repair activities and update maintenance logs for future reference."

    }
    print(failures[prediction])
    # Insert into MongoDB 
    doc = collection_failure.insert_one(failure_doc)
    print("new doc inserted in failure collection")
    return doc



def transform(data):
    try:
        df_inputdata = pd.DataFrame([data])
        type_dict = {'L': 0, 'M': 1, 'H': 2}
        # Convert all columns as float
        df_inputdata["Air temperature [K]"] = df_inputdata["Air temperature [K]"] - 272.15
        df_inputdata["Process temperature [K]"] = df_inputdata["Process temperature [K]"] - 272.15
        df_inputdata.rename(columns={"Air temperature [K]" : "Air temperature [C]","Process temperature [K]" : "Process temperature [C]"},inplace=True)
        df_inputdata[['Air temperature [C]','Process temperature [C]','Rotational speed [rpm]','Torque [Nm]','Tool wear [min]']] = df_inputdata[['Air temperature [C]','Process temperature [C]','Rotational speed [rpm]','Torque [Nm]','Tool wear [min]']].astype(float)
        df_inputdata = df_inputdata[['Type','Air temperature [C]','Process temperature [C]','Rotational speed [rpm]','Torque [Nm]','Tool wear [min]']]
        print(df_inputdata)
        df_inputdata['Type'].replace(to_replace=type_dict, inplace=True)
        df_inputdata["Temperature difference"] = df_inputdata["Process temperature [C]"] - df_inputdata["Air temperature [C]"]
        return df_inputdata 
    except Exception as e:
        print("EXCEPTION", e)



def main():
    # Connect to MongoDB
    client = MongoClient(MONGODB_CONNECTION_STRING)
    db = client[DATABASE]
    collection_data = db[DATA_COLLECTION]
    collection_model = db[MODELS_COLLECTION]

    # Find model from model collection
    model_out = collection_model.find_one({"tag": "RootCauseClassifier"})
    decompressed_pickle = blosc.decompress(model_out['model_ckpt'])
    model_bin = pickle.loads(decompressed_pickle)


    # Define the pipeline to watch for insert operations
    pipeline = [
        {'$match': {'operationType': 'insert'}}
    ]

    # Open a change stream
    with collection_data.watch(pipeline) as stream:
        for change in stream:
            print("Insert detected:")
            df = transform(change['fullDocument']['data'])
            prediction = model_bin.predict(df)
            # print("pred {}".format(prediction))
            print(prediction)
            print(prediction[0])
            if prediction[0] > 0:
                add_latest_failure(client, prediction[0], change['fullDocument']['machineID'])

                


if __name__ == "__main__":
    main()


'''
pickled_model = pickle.dumps(fit_model_multi_class)  # returns model as a bytes object
compressed_pickle_model = blosc.compress(pickled_model)
model_out = {"tag":"RootCauseClassifier", "model_ckpt":compressed_pickle_model}
model_coll = db['ml_models']
res = model_coll.insert_one(model_out)
print(dumps(change, indent=2))  # Print the change document

'''

# important rows PF 9975,9765 TW 9175,9759 OS 9823 9668 HD 4852