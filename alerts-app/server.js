require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const { MongoClient, ObjectId } = require("mongodb");
const socketIo = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 5003;
const alerts = [];
const mongoURI = process.env.MONGODB_CONNECTION_STRING;
const dbName = process.env.DATABASE;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "client/build")));

// MongoDB client
const client = new MongoClient(mongoURI);

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

async function watchAlerts() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("machine_failures");

    // Open a change stream
    const changeStream = collection.watch();

    // Listen for changes in the machine_failure collection
    changeStream.on("change", (change) => {
      console.log("Received a change to the collection: ", change);

      if (change.operationType === "insert") {
        const newAlert = change.fullDocument;
        const tempobj = {
          _id: newAlert._id.toString(),
          failure: newAlert.failure,
          machineID: newAlert.machineID,
          ts: newAlert.ts.toDateString(),
          isAcknowledged: newAlert.isAcknowledged,
          repairSteps: newAlert.repairSteps,
        };
        alerts.push(tempobj);
        console.log("New alert added: ", tempobj);

        // Emit the new alert to all connected clients
        io.emit("alertUpdate", tempobj);
      }
    });
  } catch (error) {
    console.error("Error setting up change stream:", error);
  }
}

// API to get alerts
app.get("/api/alerts", async (req, res) => {
  res.json(alerts);
  alerts.length = 0;
});

// API to acknowledge an alert
app.post("/api/alerts/acknowledge/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const db = client.db(dbName);
    const collection = db.collection("machine_failures");
    const objectId = ObjectId.createFromHexString(id); // Convert string ID to ObjectId

    // Find the alert and update isAcknowledged field
    const result = await collection.updateOne(
      { _id: objectId },
      { $set: { isAcknowledged: true } }
    );

    if (result.matchedCount === 1) {
      const updatedAlert = await collection.findOne({ _id: objectId });

      // Update the in-memory `alerts` array so that the front-end knows it's acknowledged
      const alertIndex = alerts.findIndex((alert) => alert._id === id);
      if (alertIndex !== -1) {
        alerts[alertIndex].isAcknowledged = true;
      }

      // Emit the updated alert to all connected clients
      res.json({
        _id: updatedAlert._id.toString(),
        failure: updatedAlert.failure,
        machineID: updatedAlert.machineID,
        ts: updatedAlert.ts.toDateString(),
        isAcknowledged: updatedAlert.isAcknowledged,
        repairSteps: updatedAlert.repairSteps,
      });
    } else {
      res.status(404).send("Alert not found");
    }
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    res.status(500).send("Failed to acknowledge alert");
  }
});

// Catchall handler: serves React's index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

// Start watching alerts
watchAlerts();

// Start the server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
