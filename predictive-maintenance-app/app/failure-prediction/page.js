"use client";

import { useState, useEffect } from "react";

import Navbar from "../_components/navBar/NavBar";
import styles from "./prediction.module.css";
import {
  H1,
  H3,
  H2,
  Body,
  Subtitle,
  Description,
  Link,
} from "@leafygreen-ui/typography";
import Button from "@leafygreen-ui/button";
import Banner from "@leafygreen-ui/banner";

export default function Page() {
  const [isStreamDisabled, setIsStreamDisabled] = useState(true);
  const [startMachine, setStartMachine] = useState(false);
  const [isMachineRunning, setIsMachineRunning] = useState(false);
  const [rawData, setRawData] = useState(null);
  const [transformedData, setTransformedData] = useState(null);
  const [showPopup, setShowPopup] = useState(false); // State for managing pop-up visibility

  const alertappname = process.env.NEXT_PUBLIC_ALERT_APP_URL;
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;

  /*const handleStreamButtonClick = () => {
    setToastOpen(true);
    console.log("Hello I am clicked");
  }; */

  /* const handleRunMachineClick = async () => {
     try {
       const response = await fetch('/api/machine-simulator');
       if (!response.ok) {
         throw new Error('Network response was not ok');
       }
       setIsStreamDisabled(false); // Enable the stream processing button
       const result = await response.text();
       console.log(result);
     } catch (error) {
       console.error('Error:', error);
     }
   };*/

  /* const handleRunMachineClick = () => {
     console.log('start machine button clicked');
     setIsStreamDisabled(false); // Enable the second button
     setStartMachine(true); // Start the machine
   };*/

  useEffect(() => {
    let eventSource;
    if (isMachineRunning) {
      eventSource = new EventSource("/api/machine-simulator");
      eventSource.onmessage = function (event) {
        const newData = JSON.parse(event.data);
        //setJsonData(prevData => [...prevData, newData]);
        setRawData(newData.rawDoc);
        setTransformedData(newData.transformedDoc);
      };

      eventSource.addEventListener("end", function () {
        console.log("Process completed");
        eventSource.close();
        setIsMachineRunning(false); // Reset the machine state to stopped
        setTimeout(() => {
          setShowPopup(true); // Show the pop-up after 5 seconds
        }, 1000);
      });

      eventSource.addEventListener("stop", function () {
        console.log("Process stopped");
        eventSource.close();
        setIsMachineRunning(false); // Reset the machine state to stopped
      });

      eventSource.onerror = function (err) {
        console.error("EventSource failed:", err);
        eventSource.close();
        setIsMachineRunning(false); // Reset the machine state to stopped
      };
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isMachineRunning]);

  const handleViewWebAppButton = async () => {
    // Open the URL in a new tab
    window.open(alertappname, "_blank");
  };

  const handleRunMachineClick = async () => {
    if (isMachineRunning) {
      // Send a request to stop the machine
      await fetch("/api/machine-simulator", {
        method: "POST",
      });
    }
    setIsMachineRunning((prevState) => !prevState);
  };

  return (
    <>
      <Navbar></Navbar>

      <div className={styles.body}>
        <div className={styles.pageInfo}>
          <H2 className={styles.h2}>Failure Prediction</H2>
          <Body>
            MongoDB Atlas facilitates failure prediction by offering essential
            tools such as real-time data processing, integrated monitoring, and
            compatibility with machine learning. It collects operational data
            from sensors, processes it through Atlas Stream Processing, and uses
            machine learning models to predict failures. Results are stored in
            MongoDB Atlas, visualized using Atlas Charts, and alerts are pushed
            to mobile devices via Change Streams. This streamlined workflow
            optimizes machine performance and minimizes downtime, providing a
            comprehensive, end-to-end solution for predictive maintenance.
          </Body>

          <Banner className={styles.howTo}>
            {" "}
            To run this demo, click on the <b>Run Machine button</b>, this will
            generate milling machine sensor data and pass it through{" "}
            <b>Atlas Stream Processing</b>. You will see the results of
            inference in Atlas Charts and a Machine Technician Web App
          </Banner>
        </div>

        <div className={styles.runMachineSection}>
          <Button className={styles.runButton} onClick={handleRunMachineClick}>
            {isMachineRunning
              ? "Stop Machine"
              : "Run Machine and Start Stream Processing"}
          </Button>

          {rawData && (
            <div>
              {/** 
              {rawData && (
                <div>
                  <h3>Raw Data:</h3>
                  <pre>{JSON.stringify(rawData, null, 2)}</pre>
                </div>
              )}
              {transformedData && (
                <div>
                  <h3>Transformed Data:</h3>
                  <pre>{JSON.stringify(transformedData, null, 2)}</pre>
                </div>
              )}
              <div>
                <Button
                  className={styles.runButton}
                  onClick={handleViewWebAppButton}
                >
                  {'View Live Alerts'}
                </Button>
              </div>
*/}

              {rawData && (
                <div>
                  <div className={styles.dataCardsSection}>
                    <div className={styles.card}>
                      <h3>Raw Data:</h3>
                      <pre>{JSON.stringify(rawData, null, 2)}</pre>
                    </div>
                    <div className={styles.card}>
                      <h3>Transformed Data:</h3>
                      <pre>{JSON.stringify(transformedData, null, 2)}</pre>
                    </div>
                  </div>
                  <div>
                    <Button
                      className={styles.viewAlertButton}
                      onClick={handleViewWebAppButton}
                    >
                      <img
                        src="/alert.png"
                        className={styles.image}
                        alt="Insurance"
                      ></img>
                      {"View Live Alerts"}
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <h3> Alerts Dashboard (Powered by Atlas Charts)</h3>

                <iframe
                  className={styles.chartSection}
                  src={dashboardUrl}
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPopup && (
        <div className={styles.popup}>
          <Subtitle className={styles.popupTitle}>Step completed! </Subtitle>
          <Body className={styles.popupBody}>Move on to the next tab</Body>
        </div>
      )}
    </>
  );
}
