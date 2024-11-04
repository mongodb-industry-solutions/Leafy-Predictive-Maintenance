let s = {
    "$source": {
        "connectionName": "<YOUR-SOURCE-CONNECTION-NAME>",
        "db": "<YOUR-DB-NAME>",
        "coll": "raw_data"
    }
}

let af = {
    "$addFields": {
        "sessionID": "$fullDocument.Session ID",
        "machineID": "M0001",
        "data": {
        "Product ID": "$fullDocument.Product ID",
        "Type": "$fullDocument.Type",
        "Air temperature [K]": {
            "$toDouble": "$fullDocument.Air temperature [K]"
        },
        "Process temperature [K]": {
            "$toDouble": "$fullDocument.Process temperature [K]"
        },
        "Rotational speed [rpm]": {
            "$toInt": "$fullDocument.Rotational speed [rpm]"
        },
        "Torque [Nm]": {
            "$toDouble": "$fullDocument.Torque [Nm]"
        },
        "Tool wear [min]": {
            "$toInt": "$fullDocument.Tool wear [min]"
        }
        }
    }
}


let u = {
    "$unset": [
        "documentKey",
        "fullDocument",
        "ns",
        "operationType",
        "wallTime",
        "clusterTime",
        "_id",
        "_stream_meta"
    ]
}


let m = {
    "$merge": {
        "into": {
        "connectionName": "<YOUR-SINK-CONNECTION-NAME>",
        "db": "<YOUR-DB-NAME>",
        "coll": "transformed_data"
        }
    }
}

sp.createStreamProcessor("pmproc01", [s, af, u, m])