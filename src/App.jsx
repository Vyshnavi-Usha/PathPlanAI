import React, { useState, useRef, useEffect } from "react";
import { message, Layout, Spin, Alert, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

import InitialUploadScreen from "./components/InitialUploadScreen";
import MainAppLayout from "./components/MainAppLayout";

const { Header, Footer } = Layout;
const { Title, Paragraph } = Typography;

function App() {
  const [prompt, setPrompt] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [uploadedPrdContent, setUploadedPrdContent] = useState("");
  const [uploadedFeedbackContent, setUploadedFeedbackContent] = useState("");
  const [prdFileName, setPrdFileName] = useState("");
  const [feedbackFileName, setFeedbackFileName] = useState("");

  const [prdSummaryData, setPrdSummaryData] = useState(null);
  const [feedbackAnalyticsData, setFeedbackAnalyticsData] = useState(null);
  const [prdDownloadableSummary, setPrdDownloadableSummary] = useState(null);
  const [feedbackDownloadableSummary, setFeedbackDownloadableSummary] =
    useState(null);

  const [uploadingFile, setUploadingFile] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [prdFileList, setPrdFileList] = useState([]);
  const [feedbackFileList, setFeedbackFileList] = useState([]);

  const [chatHistory, setChatHistory] = useState([]);

  const chatHistoryEndRef = useRef(null);

  const [uiStage, setUiStage] = useState("initial_upload");

  const siderWidth = 300;
  const contentGap = 24;
  const headerHeight = 120;
  const footerHeight = 70;
  const verticalPadding = 24;
  const contentPadding = "24px";

  const commonCardStyle = {
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    width: "100%",
  };

  useEffect(() => {
    chatHistoryEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory.length]);

  const handleAnalyzeClick = () => {
    console.log("[App handleAnalyzeClick] Triggered.");
    if (uploadedPrdContent && uploadedFeedbackContent) {
      setIsAnalyzing(true);
      console.log(
        `[App handleAnalyzeClick] Calling backend /initial-analysis with PRD length: ${uploadedPrdContent.length} Feedback length: ${uploadedFeedbackContent.length}`
      );

      fetch("http://127.0.0.1:5000/initial-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prdContent: uploadedPrdContent,
          feedbackContent: uploadedFeedbackContent,
          isPrdPdf: prdFileName.endsWith(".pdf"),
        }),
      })
        .then((response) => {
          console.log(
            "[App handleAnalyzeClick] Initial Analysis Raw response object:",
            response
          );
          if (!response.ok) {
            return response.text().then((text) => {
              throw new Error(text);
            });
          }
          return response.json();
        })
        .then((result) => {
          console.log(
            "[App handleAnalyzeClick] Initial Analysis Backend Response:",
            result
          );
          if (result.prdAnalysis && result.feedbackAnalysis) {
            setPrdSummaryData(result.prdAnalysis);
            setFeedbackAnalyticsData(result.feedbackAnalysis);
            setPrdDownloadableSummary(result.prdDownloadableSummary);
            setFeedbackDownloadableSummary(result.feedbackDownloadableSummary);
            setUiStage("main_app_view"); // Transition to main app view (3 columns)
            message.success("Documents analyzed! Ready to chat.");
            console.log(
              "[App handleAnalyzeClick] Transitioning to main_app_view."
            );
          } else {
            const errMsg =
              result.error ||
              "Failed to get initial analysis from backend (missing prdAnalysis or feedbackAnalysis).";
            setError(errMsg);
            message.error(errMsg);

            console.error(
              "[App handleAnalyzeClick] Error or missing data:",
              errMsg
            );
          }
        })
        .catch((err) => {
          const displayError = err.message.includes("Failed to fetch")
            ? `Failed to connect to backend: ${err.message}. Please ensure the Python backend is running.`
            : `Error during initial analysis: ${err.message}`;
          setError(displayError);
          message.error(displayError);

          console.error(
            "[App handleAnalyzeClick] Fetch or JSON parsing error:",
            err
          );
        })
        .finally(() => {
          setIsAnalyzing(false);
          console.log(
            "[App handleAnalyzeClick] Custom loading overlay dismissed."
          );
        });
    } else {
      message.warn(
        "Please upload both PRD and User Feedback files before analyzing."
      );
      console.warn(
        "[App handleAnalyzeClick] Attempted analysis without both files."
      );
    }
  };

  const handleFileUpload = async (
    info,
    setContentState,
    setFileNameState,
    setUploadingFileState,
    type
  ) => {
    console.log(`--- handleFileUpload for ${type} ---`);
    const file = info.file.originFileObj || info.file;

    if (!file) {
      setContentState("");
      setFileNameState("");
      message.error(`No file selected or invalid file object for ${type}.`);
      return Promise.reject(
        `No file selected or invalid file object for ${type}.`
      );
    }

    setUploadingFileState(true);

    if (type === "PRD") {
      setPrdFileList(info.fileList);
    } else {
      setFeedbackFileList(info.fileList);
    }

    setFileNameState(file.name);
    setError("");

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        let contentToSet = "";
        if (file.type === "application/pdf") {
          contentToSet = btoa(
            new Uint8Array(e.target.result).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );
        } else if (
          file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          const msg = `DOCX files are not directly processed by the AI yet. Please convert "${file.name}" to PDF, plain text, or Markdown.`;
          setError(msg);
          setContentState("");
          setFileNameState("");
          message.error(msg);
          reject(new Error(msg));
          return;
        } else if (
          file.type.startsWith("text/") ||
          file.name.endsWith(".md") ||
          file.name.endsWith(".csv")
        ) {
          contentToSet = e.target.result;
        } else {
          const msg = `Unsupported file type for ${type}. Please upload a PDF, DOCX, plain text, Markdown, or CSV file.`;
          setError(msg);
          setContentState("");
          setFileNameState("");
          message.error(msg);
          reject(new Error(msg));
          return;
        }
        setContentState(contentToSet);
        resolve(contentToSet);
      };

      reader.onerror = (e) => {
        const msg = `Failed to read file: ${file.name}. Reader error: ${e.target.error.message}`;
        setError(msg);
        setContentState("");
        setFileNameState("");
        message.error(msg);
        reject(new Error(msg));
      };

      if (file.type === "application/pdf") {
        reader.readAsArrayBuffer(file);
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        // Handled above, no read action needed here
      } else if (
        file.type.startsWith("text/") ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".csv")
      ) {
        reader.readAsText(file);
      } else {
        reject(
          new Error(`Unsupported file type for ${type} during read initiation.`)
        );
      }
    }).finally(() => {
      setUploadingFileState(false);
    });
  };

  const generateRoadmap = async () => {
    if (!prompt.trim()) {
      message.error("Please enter a prompt.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    console.log("--- App: Attempting to Generate Strategic Output ---");
    console.log(
      "App: Frontend sending request to /generate-roadmap. Documents are expected to be in backend store."
    );

    const userMessage = { role: "user", content: prompt };

    setChatHistory((prevHistory) => [...prevHistory, userMessage]);
    setPrompt("");

    const backendUrl = "http://127.0.0.1:5000/generate-roadmap";

    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage.content,
          chatHistory: chatHistory,
        }),
      });

      const result = await response.json();

      console.log("App: Backend raw response result:", result);
      console.log("App: response.ok status:", response.ok);

      if (response.ok) {
        if (result.roadmap) {
          console.log("App: AI response contains roadmap:", result.roadmap);

          setChatHistory((prevHistory) => [
            ...prevHistory,
            { role: "ai", content: result.roadmap, type: result.roadmap.type },
          ]);
          setRoadmap(result.roadmap);
          console.log("App: roadmap state update initiated.");
        } else {
          const aiErrorMsg =
            result.error || "Backend returned an empty or malformed response.";
          setError(aiErrorMsg);
          setChatHistory((prevHistory) => [
            ...prevHistory,
            { role: "ai", content: `Error: ${aiErrorMsg}` },
          ]);
          console.error("App: Backend OK, but no roadmap data:", aiErrorMsg);
        }
      } else {
        const backendErrorMsg = `Backend Error: ${
          result.error || "Unknown error"
        }`;
        setError(backendErrorMsg);
        setChatHistory((prevHistory) => [
          ...prevHistory,
          { role: "ai", content: `Error: ${backendErrorMsg}` },
        ]);
        console.error("App: Backend response not OK:", backendErrorMsg, result);
      }
    } catch (err) {
      const networkErrorMsg = `Failed to connect to backend: ${err.message}. Please ensure the Python backend is running.`;
      setError(networkErrorMsg);
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { role: "ai", content: `Error: ${networkErrorMsg}` },
      ]);
      console.error("App: Fetch error:", err);
    } finally {
      setLoading(false);
      console.log("App: --- End Generate Strategic Output ---");
    }
  };

  const handleDownloadFile = (contentToDownload, fileName) => {
    const blob = new Blob([contentToDownload], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success("File downloaded successfully!");
  };

  const handleDownloadOutput = () => {
    if (roadmap) {
      let downloadContent = "";
      let fileNameSuffix = roadmap.type || "unknown";

      downloadContent = JSON.stringify(roadmap, null, 2);
      handleDownloadFile(
        downloadContent,
        `product_strategy_output_${fileNameSuffix}_${new Date().toISOString()}.json`
      );
      message.success("Output downloaded successfully!");
    } else {
      message.warning("No output to download.");
    }
  };

  const mainContentAreaStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    minHeight: `calc(100vh - ${headerHeight}px - ${footerHeight}px - ${
      verticalPadding * 2
    }px)`,
    padding: contentPadding,
    transition: "margin-left 0.5s ease-in-out, width 0.5s ease-in-out",
    overflowY: "auto",
  };

  const siderComponentStyle = {
    backgroundColor: "#f0f2f5",
    padding: "24px",
    transition: "width 0.5s ease-in-out, transform 0.5s ease-in-out",
    overflowY: "auto",
    height: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`,
    position: "fixed",
    left: 0,
    top: headerHeight,
    bottom: footerHeight,
    zIndex: 10,
    boxShadow: "2px 0 6px rgba(0,0,0,0.1)",
    borderRadius: "0 8px 8px 0",
  };

  if (uiStage === "main_app_view") {
    mainContentAreaStyle.marginLeft = `${siderWidth + contentGap}px`;
    mainContentAreaStyle.marginRight = `${siderWidth + contentGap}px`;
    mainContentAreaStyle.width = `calc(100% - ${
      (siderWidth + contentGap) * 2
    }px)`;
    mainContentAreaStyle.maxWidth = "none";
  } else {
    mainContentAreaStyle.maxWidth = "800px";
    mainContentAreaStyle.margin = "0 auto";
    mainContentAreaStyle.width = "100%";
  }

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <Header
        style={{
          textAlign: "center",
          height: headerHeight,
          lineHeight: "normal",
          backgroundColor: "#fff",
          padding: "24px 0",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          marginBottom: "0",
          zIndex: 1,
        }}
      >
        <Title level={1} style={{ margin: 0, color: "#1890ff" }}>
          {/* AI-Powered Product Strategist */}
          RoadmapAI
        </Title>
        <Paragraph
          style={{
            margin: "8px 0 0",
            fontSize: "16px",
            color: "rgba(0, 0, 0, 0.65)",
          }}
        >
          {/* Bridge the gap between strategic goals and the voice of the customer.
          Upload your documents and enter your strategic question. */}
        </Paragraph>
      </Header>

      {/* Custom Full-Screen Loading Overlay */}
      {isAnalyzing && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            color: "#1890ff",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          <div style={{ marginTop: "20px" }}>Analyzing documents...</div>
        </div>
      )}

      {/* Main Layout Container for 3 Columns or Initial Upload */}
      <Layout
        style={{ flex: 1, flexDirection: "row", alignItems: "flex-start" }}
      >
        {/* Render InitialUploadScreen or MainAppLayout based on uiStage */}
        {uiStage === "initial_upload" ? (
          <InitialUploadScreen
            setPrdFileName={setPrdFileName}
            setUploadedPrdContent={setUploadedPrdContent}
            prdFileList={prdFileList}
            setPrdFileList={setPrdFileList}
            setFeedbackFileName={setFeedbackFileName}
            setUploadedFeedbackContent={setUploadedFeedbackContent}
            feedbackFileList={feedbackFileList}
            setFeedbackFileList={setFeedbackFileList}
            handleFileUpload={handleFileUpload}
            uploadingFile={uploadingFile}
            setUploadingFile={setUploadingFile}
            commonCardStyle={commonCardStyle}
            handleAnalyzeClick={handleAnalyzeClick}
          />
        ) : (
          <MainAppLayout
            siderWidth={siderWidth}
            siderComponentStyle={siderComponentStyle}
            commonCardStyle={commonCardStyle}
            prdFileName={prdFileName}
            prdSummaryData={prdSummaryData}
            prdDownloadableSummary={prdDownloadableSummary}
            handleDownloadFile={handleDownloadFile}
            feedbackFileName={feedbackFileName}
            feedbackAnalyticsData={feedbackAnalyticsData}
            feedbackDownloadableSummary={feedbackDownloadableSummary}
            chatHistory={chatHistory}
            chatHistoryEndRef={chatHistoryEndRef}
            prompt={prompt}
            setPrompt={setPrompt}
            generateRoadmap={generateRoadmap}
            loading={loading}
            error={error}
            roadmap={roadmap}
            setRoadmap={setRoadmap} /* <-- CRITICAL: Pass setRoadmap here */
            handleDownloadOutput={handleDownloadOutput}
          />
        )}
      </Layout>

      <Footer
        style={{
          textAlign: "center",
          backgroundColor: "#f0f2f5",
          padding: "24px 0",
        }}
      >
        AI-Powered Product Strategist ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  );
}

export default App;
