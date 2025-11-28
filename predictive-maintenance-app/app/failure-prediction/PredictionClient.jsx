'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '../_components/navBar/NavBar';
import styles from './prediction.module.css';
import { H2, Body, Subtitle } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import Banner from '@leafygreen-ui/banner';
import ChartsEmbedSDK from '@mongodb-js/charts-embed-dom';

export default function PredictionClient({ 
  alertAppUrl, 
  chartId, 
  chartsBaseUrl 
}) {
  // Tracks whether the "machine" is streaming data
  const [isMachineRunning, setIsMachineRunning] = useState(false);

  // Data states
  const [rawData, setRawData] = useState(null);
  const [transformedData, setTransformedData] = useState(null);

  // Chart initialization state
  const [chartInstance, setChartInstance] = useState(null);
  // Controls whether to render the chart container & initialize
  const [chartReady, setChartReady] = useState(false);

  // Pop-up for "step complete"
  const [showPopup, setShowPopup] = useState(false);

  // Refs
  const chartContainerRef = useRef(null);
  const sessionId = useRef(
    `session_${Math.random().toString(36).substr(2, 9)}`
  );

  /**
   * Handle "Run Machine" button click
   */
  const handleRunMachineClick = async () => {
    if (isMachineRunning) {
      // If already running, issue a stop request
      await fetch('/api/machine-simulator', { method: 'POST' });
    } else {
      // When starting the machine, initialize the chart immediately
      setChartReady(true);
    }
    setIsMachineRunning((prev) => !prev);
  };

  /**
   * SSE to receive raw/transformed data from /api/machine-simulator
   */
  useEffect(() => {
    let eventSource;

    if (isMachineRunning) {
      eventSource = new EventSource('/api/machine-simulator');

      eventSource.onmessage = (event) => {
        const newData = JSON.parse(event.data);
        setRawData(newData.rawDoc);
        setTransformedData(newData.transformedDoc);
      };

      // The "end" event signals the simulation is done
      eventSource.addEventListener('end', () => {
        console.log('Process completed.');
        eventSource.close();
        setIsMachineRunning(false);
        setTimeout(() => {
          setShowPopup(true); // pop-up after 1 second
        }, 1000);
      });

      // The "stop" event signals manual stopping
      eventSource.addEventListener('stop', () => {
        console.log('Process stopped.');
        eventSource.close();
        setIsMachineRunning(false);
      });

      // On error, close out to avoid memory leaks
      eventSource.onerror = (err) => {
        console.error('EventSource failed:', err);
        eventSource.close();
        setIsMachineRunning(false);
      };
    }

    // Clean up eventSource on unmount or changes
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isMachineRunning]);

  /**
   * Initialize the chart when chartReady is set to true
   * (happens immediately when "Run Machine" button is clicked)
   */
  useEffect(() => {
    if (chartReady && !chartInstance && chartContainerRef.current) {
      // Add detailed logging of the base URL to debug
      console.log('Charts base URL:', chartsBaseUrl);

      // Make sure the URL is valid before proceeding
      if (!chartsBaseUrl) {
        console.error('Charts base URL is not defined');
        return;
      }

      // Ensure the URL has the proper format (add trailing slash if missing)
      let formattedBaseUrl = chartsBaseUrl;
      if (formattedBaseUrl && !formattedBaseUrl.endsWith('/')) {
        formattedBaseUrl = `${formattedBaseUrl}/`;
      }

      console.log('Using formatted base URL:', formattedBaseUrl);

      try {
        const sdk = new ChartsEmbedSDK({
          baseUrl: formattedBaseUrl,
        });

        // Enhanced dashboard configuration
        const chart = sdk.createDashboard({
          dashboardId: chartId,

          // Customize size
          //height: 400,
          //width: 800,

          // Attribution settings
          showAttribution: true,
        });

        chart
          .render(chartContainerRef.current)
          .then(() => {
            console.log('Chart rendered successfully.');
            setChartInstance(chart);
          })
          .catch((err) => {
            console.error('Error rendering chart:', err);
            // Log more details about the error
            console.error(
              'Error details:',
              JSON.stringify(err, null, 2)
            );
          });
      } catch (error) {
        console.error('Error creating Charts SDK:', error);
      }
    }
  }, [
    chartReady,
    chartInstance,
    chartContainerRef,
    chartId,
    chartsBaseUrl,
  ]);

  /**
   * SSE for change streams. Whenever a change occurs in MongoDB,
   * we refresh the chart if it is initialized.
   */
  useEffect(() => {
    // Only set up change stream if chart has been initialized
    if (!chartInstance) return;

    const sseUrl = `/api/sse?sessionId=${sessionId.current}`;
    console.log('Connecting to change stream SSE...');

    const changeStreamSource = new EventSource(sseUrl);

    changeStreamSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Refresh the chart when data changes
        chartInstance
          .refresh()
          .catch((err) =>
            console.error('Error refreshing chart:', err)
          );
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    changeStreamSource.onerror = (err) => {
      console.error('Change stream SSE error:', err);
      changeStreamSource.close();
    };

    // Clean up SSE on unmount
    return () => {
      console.log('Closing change stream SSE...');
      changeStreamSource.close();
    };
  }, [chartInstance]);

  /**
   * Button that opens your separate web app in a new tab.
   */
  const handleViewWebAppButton = async () => {
    window.open(alertAppUrl, '_blank');
  };

  return (
    <>
      <Navbar />

      <div className={styles.body}>
        <div className={styles.pageInfo}>
          <H2 className={styles.h2}>Failure Prediction</H2>
          <Body>
            {/* Explanatory text about how it works... */}
            MongoDB Atlas facilitates failure prediction by offering
            essential tools such as real-time data processing,
            integrated monitoring, and compatibility with machine
            learning. It collects operational data from sensors,
            processes it through Atlas Stream Processing, and uses
            machine learning models to predict failures. Results are
            stored in MongoDB Atlas, visualized using Atlas Charts,
            and alerts are pushed to mobile devices via Change
            Streams. This streamlined workflow optimizes machine
            performance and minimizes downtime, providing a
            comprehensive, end-to-end solution for predictive
            maintenance.
          </Body>
          <Banner className={styles.howTo}>
            To run this demo, click on the <b>Run Machine button</b>,
            this will generate milling machine sensor data and pass it
            through <b>Atlas Stream Processing</b>. You will see the
            results of inference in Atlas Charts and a Machine
            Technician Web App
          </Banner>
        </div>

        <div className={styles.runMachineSection}>
          {/* Machine Run/Stop Button */}
          <Button
            className={styles.runButton}
            onClick={handleRunMachineClick}
          >
            {isMachineRunning
              ? 'Stop Machine'
              : 'Run Machine and Start Stream Processing'}
          </Button>

          {/* Once we have raw/transformed data, show them */}
          {(rawData || transformedData) && (
            <div>
              <div className={styles.dataCardsSection}>
                {rawData && (
                  <div className={styles.card}>
                    <h3>Raw Data:</h3>
                    <pre>{JSON.stringify(rawData, null, 2)}</pre>
                  </div>
                )}

                {transformedData && (
                  <div className={styles.card}>
                    <h3>Transformed Data:</h3>
                    <pre>
                      {JSON.stringify(transformedData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Button to open the separate web app */}
              <div>
                <Button
                  className={styles.viewAlertButton}
                  onClick={handleViewWebAppButton}
                >
                  <img
                    src="/alert.png"
                    className={styles.image}
                    alt="Alerts"
                  />
                  {'View Live Alerts'}
                </Button>
              </div>
            </div>
          )}

          {/* Only render the chart container if we've declared it "ready" */}
          {chartReady && (
            <div>
              <h3>Alerts Dashboard (Powered by Atlas Charts)</h3>
              {/* The container where the chart will render */}
              <div
                ref={chartContainerRef}
                className={styles.chartSection}
              />
            </div>
          )}
        </div>
      </div>

      {/* Optional popup after machine finishes */}
      {showPopup && (
        <div className={styles.popup}>
          <Subtitle className={styles.popupTitle}>
            Step completed!
          </Subtitle>
          <Body className={styles.popupBody}>
            Move on to the next tab
          </Body>
        </div>
      )}
    </>
  );
}

