"use client";

import styles from "./plan.module.css";
import Navbar from "../_components/navBar/NavBar";

import React, { useState } from "react";
//import * as pdfjsLib from 'pdfjs-dist/build/pdf';
//import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf"; // Using legacy build for compatibility

import { H1, H3, H2, Body, Description, Link } from "@leafygreen-ui/typography";
import Button from "@leafygreen-ui/button";
import { RadioGroup, Radio } from "@leafygreen-ui/radio-group";

//pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function Page() {
  const [question, setQuestion] = useState("");
  const [isAsked, setIsAsked] = useState(false);
  const [isDocumentsSelected, setIsDocumentsSelected] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState("");
  const [isEnhancedResultLoading, setIsEnhancedResultLoading] = useState(false);

  const handleSuggestionOne = () => {
    setQuestion(
      "Generate a repair plan for toolwear failure using machine manual and old work orders"
    );
  };

  const handleSuggestionTwo = () => {
    setQuestion(
      "Generate a repair plan for power failure using machine manual and old work orders"
    );
  };

  const handleSuggestionThree = () => {
    setQuestion(
      "Generate a repair plan for overstrain failure using machine manual and old work orders"
    );
  };

  const handleChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleAsk = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/rag-repair-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
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

  const handlePreview = () => {
    if (!selectedOption) return;
    let pdfUrl = "";
    switch (selectedOption) {
      case "option-1":
        pdfUrl = "/spanish.pdf";
        break;
      case "option-2":
        pdfUrl = "/french.pdf";
        break;
      case "option-3":
        pdfUrl = "/german.pdf";
        break;
      default:
        return;
    }

    window.open(pdfUrl, "_blank");
  };

  const extractTextFromPDF = async (pdfUrl) => {
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    let textContent = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      text.items.forEach((item) => {
        textContent += item.str + " ";
      });
    }

    return textContent;
  };

  const translateText = async (text, targetLang = "en") => {
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
        }),
      });
      const data = await response.json();

      return data.translatedText;
    } catch (error) {
      console.error("Translation error:", error);
      return "";
    }
  };

  const handleSelectDocuments = async () => {
    if (!selectedOption || !answer) return;
    setIsEnhancedResultLoading(true);
    setIsDocumentsSelected(true);
    let pdfUrl = "";
    switch (selectedOption) {
      case "option-1":
        pdfUrl = "/spanish.pdf";
        break;
      case "option-2":
        pdfUrl = "/french.pdf";
        break;
      case "option-3":
        pdfUrl = "/german.pdf";
        break;
      default:
        setIsEnhancedResultLoading(false);
        return;
    }

    const extractedText = await extractTextFromPDF(pdfUrl);
    let translatedText = await translateText(extractedText);
    const translatedTextFirstValue = translatedText[0];
    const answer_pre = answer;

    try {
      const response = await fetch("/api/rag-repair-enhancements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer_pre,
          translatedTextFirstValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch answer");
      }

      const data = await response.json();
      setEnhancedResult(data.answer_new);
      setIsDocumentsSelected(true);
    } catch (error) {
      console.error(
        "Error getting response back from rag-repair-enhancements:",
        error
      );
      setEnhancedResult(
        "There was an error getting the enhanced plan. Please try again."
      );
    } finally {
      setIsEnhancedResultLoading(false);
    }
  };

  return (
    <>
      <Navbar></Navbar>

      <div className={styles.body}>
        <div className={styles.pageInfo}>
          <H2>Repair Plan Generation</H2>
          <Body>
            Generating a repair plan with MongoDB involves creating detailed
            maintenance work orders, including repair instructions, spare parts,
            schedules, and resource availability. MongoDB Atlas handles both
            structured and unstructured data, like machine manuals and past work
            orders. Information is extracted, vectorized, and stored in MongoDB.
            Atlas Vector Search and Aggregation pipelines integrate and analyze
            this data using a large language model (LLM) to generate work order
            templates, leveraging past examples for accurate inventory and
            resource details. This comprehensive strategy uses a single MongoDB
            database for all data management within a central maintenance
            system.
          </Body>
        </div>

        <div className={styles.sections}>
          <div className={styles.leftSection}>
            <div className={styles.askSection}>
              <H3>Ask a Question</H3>
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
                  disabled={!question.trim() || isLoading} // Disable button if input is empty
                >
                  {isLoading ? "Asking..." : "Ask"}
                </button>

                <div className={styles.suggestedQuestions}>
                  <p>Suggested Questions:</p>
                  <button
                    className={styles.suggestion}
                    onClick={handleSuggestionOne}
                  >
                    Generate a repair plan for toolwear failure using machine
                    manual and old work orders
                  </button>
                  <button
                    className={styles.suggestion}
                    onClick={handleSuggestionTwo}
                  >
                    Generate a repair plan for power failure using machine
                    manual and old work orders
                  </button>
                  <button
                    className={styles.suggestion}
                    onClick={handleSuggestionThree}
                  >
                    Generate a repair plan for overstrain failure using machine
                    manual and old work orders
                  </button>
                </div>
              </div>
            </div>

            {isAsked && (
              <>
                <div className={styles.answerSection}>
                  <Body>
                    {answer.split("\n").map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </Body>
                </div>
                <div className={styles.sourcesSection}>
                  <h3>Data Sources</h3>
                  <table className={styles.sourcesTable}>
                    <thead>
                      <tr>
                        <th className={styles.sourcesTableHeader}>File Name</th>
                        <th className={styles.sourcesTableHeader}>
                          Page Number
                        </th>
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
          </div>
          <div className={styles.rightSection}>
            <H3>Generate an Enhanced Plan</H3>

            <div className={styles.selectDocumentsSection}>
              <Body>Select a service notes PDF to merge with repair plan</Body>
              <div className={styles.documentsPreviewSection}>
                <RadioGroup
                  name="name-of-input-group"
                  size="xsmall"
                  onChange={(e) => setSelectedOption(e.target.value)}
                  className={styles.radioGroup}
                >
                  <Radio
                    className={styles.radioButtons}
                    value="option-1"
                    disabled={!isAsked}
                  >
                    Spanish
                  </Radio>
                  <Radio
                    className={styles.radioButtons}
                    value="option-2"
                    disabled={!isAsked}
                  >
                    French
                  </Radio>
                  <Radio
                    className={styles.radioButtons}
                    value="option-3"
                    disabled={!isAsked}
                  >
                    German
                  </Radio>
                </RadioGroup>
              </div>

              <Button
                className={styles.selectButton}
                onClick={handlePreview}
                disabled={!selectedOption || !isAsked}
              >
                Preview Selection
              </Button>
              <Button
                className={styles.selectButton}
                onClick={handleSelectDocuments}
                //disabled={isEnhancedResultLoading}
                disabled={
                  !selectedOption || !isAsked || isEnhancedResultLoading
                }
              >
                {isEnhancedResultLoading
                  ? "Wait for Answer..."
                  : "Confirm Selection"}
              </Button>
            </div>

            {isDocumentsSelected && (
              <div className={styles.answerSection}>
                <Body>
                  {enhancedResult.split("\n").map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </Body>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
