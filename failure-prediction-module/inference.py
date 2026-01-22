import logging
import pickle
import os
import blosc
import datetime
import pandas as pd
import sklearn
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
from typing import Any, Dict, Optional

dotenv_path = Path("./.env")
load_dotenv(dotenv_path=dotenv_path)

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)
logger = logging.getLogger("inference-service")

MONGODB_CONNECTION_STRING = os.getenv("MONGODB_CONNECTION_STRING")
DATABASE = os.getenv("DATABASE")
FAILURES_COLLECTION = os.getenv("FAILURES_COLLECTION")
DATA_COLLECTION = os.getenv("TRANSFORMED_DATA_COLLECTION")
MODELS_COLLECTION = os.getenv("MODELS_COLLECTION")


def add_latest_failure(client: MongoClient, prediction: int, machine_id: Any):
    db = client[DATABASE]
    collection_failure = db[FAILURES_COLLECTION]
    # Different failure categories
    failures = [
        "No Failure",
        "Power Failure",
        "Overstrain Failure",
        "Tool Wear Failure",
        "Random Failures",
        "Heat Dissipation Failure",
    ]
    # Below document will be inserted in failure collection.
    failure_doc = {
        "machineID": machine_id,
        "failure": failures[prediction],
        "ts": datetime.datetime.utcnow(),
        "isAcknowledged": False,
        "repairSteps": "",
        # "repairSteps": "1. Shut down the CNC milling machine to ensure safety during maintenance procedures. \n2. Inspect the cutting tool and machine components for signs of wear or damage. \n3. Remove the worn-out cutting tool from the spindle. \n4. Replace the cutting tool with a new one from inventory (Part No.: CT-123). \n5. Adjust cutting parameters and tool offsets as necessary for optimal  performance. \n6. Conduct test machining operations to verify cutting performance and quality. \n7. Document repair activities and update maintenance logs for future reference."
    }
    # Insert into MongoDB
    doc = collection_failure.insert_one(failure_doc)
    logger.info(
        "Alert stored: machineID=%s failure=%s",
        machine_id,
        failures[prediction],
    )
    return doc


def transform(data: Dict[str, Any]) -> pd.DataFrame:
    try:
        df_inputdata = pd.DataFrame([data])
        type_dict = {"L": 0, "M": 1, "H": 2}
        # Convert all columns as float
        df_inputdata["Air temperature [K]"] = (
            df_inputdata["Air temperature [K]"] - 272.15
        )
        df_inputdata["Process temperature [K]"] = (
            df_inputdata["Process temperature [K]"] - 272.15
        )
        df_inputdata = df_inputdata.rename(
            columns={
                "Air temperature [K]": "Air temperature [C]",
                "Process temperature [K]": "Process temperature [C]",
            }
        )
        df_inputdata[
            [
                "Air temperature [C]",
                "Process temperature [C]",
                "Rotational speed [rpm]",
                "Torque [Nm]",
                "Tool wear [min]",
            ]
        ] = df_inputdata[
            [
                "Air temperature [C]",
                "Process temperature [C]",
                "Rotational speed [rpm]",
                "Torque [Nm]",
                "Tool wear [min]",
            ]
        ].astype(
            float
        )
        df_inputdata = df_inputdata[
            [
                "Type",
                "Air temperature [C]",
                "Process temperature [C]",
                "Rotational speed [rpm]",
                "Torque [Nm]",
                "Tool wear [min]",
            ]
        ]
        logger.debug("Raw input row: %s", df_inputdata.to_dict(orient="records")[0])
        # NOTE: Avoid `inplace=True` on a Series under pandas Copy-on-Write.
        # It may not mutate the parent DataFrame, leaving strings like 'L' in the model input.
        df_inputdata["Type"] = df_inputdata["Type"].astype(str).str.strip()
        df_inputdata["Type"] = df_inputdata["Type"].replace(type_dict)
        if df_inputdata["Type"].isna().any():
            bad_vals = (
                df_inputdata.loc[df_inputdata["Type"].isna(), "Type"].unique().tolist()
            )
            raise ValueError(
                f"Unknown Type values encountered: {bad_vals}. Expected one of {list(type_dict.keys())}."
            )
        df_inputdata["Type"] = df_inputdata["Type"].astype(float)
        df_inputdata["Temperature difference"] = (
            df_inputdata["Process temperature [C]"]
            - df_inputdata["Air temperature [C]"]
        )
        return df_inputdata
    except Exception as e:
        logger.exception("Transform failed")
        raise


def _validate_env() -> None:
    missing = []
    if not MONGODB_CONNECTION_STRING:
        missing.append("MONGODB_CONNECTION_STRING")
    if not DATABASE:
        missing.append("DATABASE")
    if not FAILURES_COLLECTION:
        missing.append("FAILURES_COLLECTION")
    if not DATA_COLLECTION:
        missing.append("TRANSFORMED_DATA_COLLECTION")
    if not MODELS_COLLECTION:
        missing.append("MODELS_COLLECTION")
    if missing:
        raise RuntimeError(
            f"Missing required environment variables: {', '.join(missing)}"
        )


def main():
    logger.info(
        "Starting inference-service (python=%s pandas=%s sklearn=%s log_level=%s)",
        os.getenv("PYTHON_VERSION", "3.11"),
        getattr(pd, "__version__", "unknown"),
        getattr(sklearn, "__version__", "unknown"),
        LOG_LEVEL,
    )
    _validate_env()

    # Connect to MongoDB
    client = MongoClient(MONGODB_CONNECTION_STRING)
    db = client[DATABASE]
    collection_data = db[DATA_COLLECTION]
    collection_model = db[MODELS_COLLECTION]

    # Find model from model collection
    model_out = collection_model.find_one({"tag": "RootCauseClassifier"})
    if not model_out or "model_ckpt" not in model_out:
        raise RuntimeError("Model not found in MongoDB: tag=RootCauseClassifier")
    decompressed_pickle = blosc.decompress(model_out["model_ckpt"])
    model_bin = pickle.loads(decompressed_pickle)
    logger.info("Model loaded: %s", type(model_bin).__name__)

    # Define the pipeline to watch for insert operations
    pipeline = [{"$match": {"operationType": "insert"}}]

    # Open a change stream
    logger.info(
        "Watching for inserts: db=%s collection=%s",
        DATABASE,
        DATA_COLLECTION,
    )
    with collection_data.watch(pipeline) as stream:
        for change in stream:
            try:
                full_doc = change.get("fullDocument") or {}
                machine_id = full_doc.get("machineID")
                data = (
                    (full_doc.get("data") or {})
                    if isinstance(full_doc.get("data"), dict)
                    else {}
                )

                # Too verbose at INFO for healthy traffic; keep details at DEBUG.
                logger.debug("Insert detected: machineID=%s", machine_id)
                df = transform(data)

                # If the model was trained with pandas DataFrames, honor its expected feature order.
                expected_cols = getattr(model_bin, "feature_names_in_", None)
                if expected_cols is not None:
                    df = df.reindex(columns=list(expected_cols))

                prediction = model_bin.predict(df)
                pred0 = int(prediction[0])
                logger.debug("Prediction: machineID=%s class=%s", machine_id, pred0)

                if pred0 > 0:
                    logger.info(
                        "Alert detected: machineID=%s class=%s", machine_id, pred0
                    )
                    add_latest_failure(client, pred0, machine_id)
            except Exception:
                logger.exception("Failed processing insert event")


if __name__ == "__main__":
    main()


"""
pickled_model = pickle.dumps(fit_model_multi_class)  # returns model as a bytes object
compressed_pickle_model = blosc.compress(pickled_model)
model_out = {"tag":"RootCauseClassifier", "model_ckpt":compressed_pickle_model}
model_coll = db['ml_models']
res = model_coll.insert_one(model_out)
print(dumps(change, indent=2))  # Print the change document

"""

# important rows PF 9975,9765 TW 9175,9759 OS 9823 9668 HD 4852
