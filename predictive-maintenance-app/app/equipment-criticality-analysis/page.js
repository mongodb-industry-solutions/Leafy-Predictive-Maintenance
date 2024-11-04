"use client";

import Navbar from "../_components/navBar/NavBar";
import styles from "./analysis.module.css";

import React, { useEffect, useState } from "react";

import {
  H1,
  H2,
  H3,
  Body,
  Subtitle,
  Description,
  Link,
} from "@leafygreen-ui/typography";
import Button from "@leafygreen-ui/button";
import ApiSelector from "../_components/apiSelector/ApiSelector";

export default function Page() {
  const [apiChoice, setApiChoice] = useState("cohere");
  const [question, setQuestion] = useState("");
  const [isAsked, setIsAsked] = useState(false);
  const [isDocumentsSelected, setIsDocumentsSelected] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState({
    workorders: false,
    interview: false,
    maintenancehistory: false,
  });

  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (isAsked) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isAsked]);

  const handleSuggestionOne = () => {
    setQuestion("Which machine has the most maintenance cost");
  };

  const handleSuggestionTwo = () => {
    setQuestion("Which machine ID needs to be prioritized and why?");
  };

  const handleSuggestionThree = () => {
    setQuestion("How the criticality analysis was performed?");
  };

  const handleChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleCheckboxChange = (document) => {
    setSelectedDocuments((prevState) => ({
      ...prevState,
      [document]: !prevState[document],
    }));
  };

  const handleAsk = async () => {
    setIsLoading(true);
    try {
      const endpoint =
        apiChoice === "openai"
          ? "/api/rag-criticality-analysis-openai-api"
          : "/api/rag-criticality-analysis";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          selectedDocuments: Object.keys(selectedDocuments).filter(
            (doc) => selectedDocuments[doc]
          ),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch answer");
      }

      const data = await response.json();
      setAnswer(data.answer);
      setSources(data.dataSources);
      setIsAsked(true);
    } catch (error) {
      console.error("Error asking question:", error);
      setAnswer("There was an error getting the answer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDocuments = () => {
    setIsDocumentsSelected(true);
  };

  const handleSelectDocumentsInterview = () => {
    window.open("/interview.pdf", "_blank");
  };

  const handleSelectDocumentsLossesReport = () => {
    window.open("/maintenancehistory.pdf", "_blank");
  };

  const handleSelectDocumentsWorkOrders = () => {
    window.open("/workorders.pdf", "_blank");
  };

  return (
    <>
      <Navbar></Navbar>

      <div className={styles.body}>
        <div className={styles.pageInfo}>
          <H2 className={styles.h2}>Equipment Criticality Analysis</H2>
          <Body>
            Implementing Equipment Criticality Analysis with MongoDB streamlines
            predictive maintenance by utilizing generative AI to reduce manual
            analysis. Traditionally, machine prioritization relies on historical
            data and maintenance managers' insights, which can be time-consuming
            and inaccurate. MongoDB Atlas enhances this process by storing both
            structured data (e.g., machine breakdown histories) and unstructured
            data (e.g., expert interviews). Atlas Vector Search performs
            semantic searches to provide relevant context for AI-driven
            decisions. This setup prioritizes machines based on criticality and
            maintenance costs, ensuring accurate, data-driven outcomes and
            reducing the total cost of ownership.
          </Body>
        </div>

        <div className={styles.selectDocumentsSection}>
          <h3>Select the Documents for Analysis</h3>

          <Body className={styles.hint}>
            {" "}
            Select all three docs for best results :){" "}
          </Body>

          <ApiSelector apiChoice={apiChoice} setApiChoice={setApiChoice} />
          <div className={styles.documentsPreviewSection}>
            <div className={styles.checkboxButtonSection}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedDocuments.workorders}
                  onChange={() => handleCheckboxChange("workorders")}
                />
                Old Work Orders
              </label>
              <Button onClick={handleSelectDocumentsWorkOrders}>Preview</Button>
            </div>

            <div className={styles.checkboxButtonSection}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedDocuments.interview}
                  onChange={() => handleCheckboxChange("interview")}
                />
                Interview with Maintenance Manager
              </label>
              <Button onClick={handleSelectDocumentsInterview}>Preview</Button>
            </div>

            <div className={styles.checkboxButtonSection}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedDocuments.maintenancehistory}
                  onChange={() => handleCheckboxChange("maintenancehistory")}
                />
                Report on Maintenance History
              </label>
              <Button onClick={handleSelectDocumentsLossesReport}>
                Preview
              </Button>
            </div>
          </div>

          <div style={{ marginTop: "20px" }}></div>

          <Button
            onClick={handleSelectDocuments}
            variant="baseGreen"
            className={styles.confirmBtn}
          >
            Confirm Selection
          </Button>
        </div>

        {isDocumentsSelected && (
          <div className={styles.askSection}>
            <h3>Ask a Question</h3>
            <div className={styles.documentsPreviewSection}></div>

            <div className={styles.question}>
              <input
                className={styles.input}
                type="text"
                value={question}
                onChange={handleChange}
                placeholder="Type your question here..."
              />

              <button
                className={styles.askBtn}
                onClick={handleAsk}
                disabled={!question.trim() || isLoading} // Disable button if input is empty or loading
              >
                {isLoading ? "Asking..." : "Ask"}
              </button>

              <div className={styles.suggestedQuestions}>
                <p>Suggested Questions:</p>
                <button
                  className={styles.suggestion}
                  onClick={handleSuggestionOne}
                >
                  Which machine has the most maintenance cost?
                </button>
                <button
                  className={styles.suggestion}
                  onClick={handleSuggestionTwo}
                >
                  Which machine ID needs to be prioritized and why?
                </button>
                <button
                  className={styles.suggestion}
                  onClick={handleSuggestionThree}
                >
                  How the criticality analysis was performed?
                </button>
              </div>
            </div>
          </div>
        )}

        {isAsked && (
          <>
            <div className={styles.answerSection}>
              <p>{answer}</p>
            </div>

            <div className={styles.sourcesSection}>
              <h3>Data Sources</h3>
              <table className={styles.sourcesTable}>
                <thead>
                  <tr>
                    <th className={styles.sourcesTableHeader}>File Name</th>
                    <th className={styles.sourcesTableHeader}>Page Number</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source, index) => (
                    <tr key={index}>
                      <td className={styles.sourcesTableCell}>
                        {source.source.filename}
                      </td>
                      <td className={styles.sourcesTableCell}>
                        {source.source.page_number}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {showPopup && (
          <div className={styles.popup}>
            <Subtitle className={styles.popupTitle}>Step completed! </Subtitle>
            <Body className={styles.popupBody}>Move on to the next tab</Body>
          </div>
        )}
      </div>
    </>
  );
}
