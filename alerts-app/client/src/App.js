import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, ListGroup, Navbar } from "react-bootstrap";
import socketIOClient from "socket.io-client";

function App() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAlerts();
    // Setup WebSocket connection
    const socket = socketIOClient("http://localhost:5003");

    // Listen for alert updates
    socket.on("alertUpdate", (updatedAlerts) => {
      setAlerts((prevAlerts) => [...prevAlerts, updatedAlerts]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get("http://localhost:5003/api/alerts");
      console.log(response.data);
      setAlerts(response.data);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  const handleOpenModal = (alert) => {
    setSelectedAlert(alert);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const acknowledgeAlert = async (id) => {
    try {
      await axios.post(`http://localhost:5003/api/alerts/acknowledge/${id}`);
      fetchAlerts();
      handleCloseModal();
    } catch (error) {
      console.error("Error acknowledging alert:", error);
    }
  };

  const totalAlerts = alerts.length;
  const acknowledgedAlerts = alerts.filter(
    (alert) => alert.isAcknowledged
  ).length;

  return (
    <div className="App">
      <Navbar style={{ backgroundColor: "#4CAF50" }}>
        <Navbar.Brand href="#" style={{ color: "white", padding: 10 }}>
          Alerts Dashboard
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Navbar.Text style={{ color: "white" }}>
            Total Alerts: {totalAlerts} | Acknowledged: {acknowledgedAlerts}
          </Navbar.Text>
        </Navbar.Collapse>
      </Navbar>

      <ListGroup className="m-3">
        {alerts.map((alert) => (
          <ListGroup.Item
            key={alert._id}
            action
            onClick={() => handleOpenModal(alert)}
            style={{
              backgroundColor: alert.isAcknowledged ? "#d4edda" : "",
              cursor: "pointer",
            }}
          >
            {alert.ts} -- {alert.failure}
          </ListGroup.Item>
        ))}
      </ListGroup>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Alert Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAlert && (
            <>
              <p>
                <strong>Failure Type:</strong> {selectedAlert.failure}
              </p>
              <p>
                <strong>Machine ID:</strong> {selectedAlert.machineID}
              </p>
              <p>
                <strong>Time:</strong> {selectedAlert.ts}
              </p>
              <p>
                <strong>Acknowledged:</strong>{" "}
                {selectedAlert.isAcknowledged ? "Yes" : "No"}
              </p>
              <p>
                <strong>Repair Steps:</strong>{" "}
                <pre>{selectedAlert.repairSteps}</pre>
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => acknowledgeAlert(selectedAlert._id)}
          >
            Acknowledge
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App;
