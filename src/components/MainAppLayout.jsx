import React, { useState, useEffect } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Send,
  Loader2,
  Download,
  Eye,
  Maximize,
  Info,
  XCircle,
} from "lucide-react";
import { marked } from "marked";

import {
  Layout,
  Button,
  Typography,
  Input,
  Alert,
  Card,
  Space,
  message,
} from "antd";
import {
  SendOutlined,
  DownloadOutlined,
  EyeOutlined,
  LoadingOutlined as AntLoadingOutlined,
} from "@ant-design/icons";

import PRDSummaryColumn from "./PRDSummaryColumn";
import FeedbackAnalyticsColumn from "./FeedbackAnalyticsColumn";
import AiResponseRenderer from "./AirResponseRenderer";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const getAiResponseTypeTitle = (type) => {
  switch (type) {
    case "roadmap":
      return "Product Roadmap";
    case "feature_brief":
      return "Feature Brief";
    case "bug_list":
      return "Bug List";
    case "strategic_summary":
      return "Strategic Summary";
    case "qa_response":
      return "AI Answer";
    default:
      return "AI Answer";
  }
};

const MainAppLayout = ({
  siderWidth,
  prdFileName,
  prdSummaryData,
  prdDownloadableSummary,
  feedbackFileName,
  feedbackAnalyticsData,
  feedbackDownloadableSummary,
  chatHistory,
  chatHistoryEndRef,
  prompt,
  setPrompt,
  generateRoadmap,
  loading,
  error,
  roadmap,
  handleDownloadOutput,
}) => {
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [selectedAiResponse, setSelectedAiResponse] = useState(null);
  const [conversationExpanded, setConversationExpanded] = useState(true);

  const [activeRightPanelSection, setActiveRightPanelSection] = useState("prd");

  const defaultAntdBlue = "#1890ff";
  const defaultAntdTextPrimary = "rgba(0, 0, 0, 0.85)";
  const defaultAntdTextSecondary = "rgba(0, 0, 0, 0.45)";
  const defaultAntdBorderColor = "#d9d9d9";
  const defaultAntdBackground = "#f0f2f5";
  const defaultAntdSurface = "#ffffff";
  const defaultAntdErrorRed = "#ff4d4f";

  useEffect(() => {
    if (chatHistory.length > 0) {
      setShowLeftPanel(true);
    } else {
      setShowLeftPanel(false);
      setConversationExpanded(true);
      setSelectedAiResponse(null);
    }
  }, [chatHistory.length]);

  useEffect(() => {
    if (roadmap && !conversationExpanded) {
      setSelectedAiResponse(roadmap);
    }
  }, [roadmap, conversationExpanded]);

  const handleDownloadFileForColumns = (
    content,
    baseFilename,
    format = "md"
  ) => {
    const blob = new Blob([content], { type: `text/${format};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${baseFilename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success("File downloaded successfully!");
  };

  const renderConversationContent = () => (
    <>
      {chatHistory.length === 0 ? (
        <Paragraph type="secondary" style={{ color: defaultAntdTextSecondary }}>
          Start the conversation by asking a strategic question!
        </Paragraph>
      ) : (
        chatHistory.map((message, index) => {
          const isUser = message.role === "user";
          return (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                paddingLeft: "8px",
                paddingRight: "8px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  maxWidth: "90%",
                  minWidth: "120px",
                  padding: "12px",
                  borderRadius: "12px",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  backgroundColor: isUser ? "#e6f7ff" : "#f0f2f5",
                  color: defaultAntdTextPrimary,
                  textAlign: isUser ? "right" : "left",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <Text
                  strong
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    color: isUser ? defaultAntdBlue : "#595959",
                  }}
                >
                  {isUser ? "You" : "AI"}:
                </Text>

                {typeof message.content === "string" ? (
                  <div
                    className="ant-typography"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(message.content),
                    }}
                    style={{ color: defaultAntdTextPrimary }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <Text strong style={{ color: defaultAntdTextPrimary }}>
                      {getAiResponseTypeTitle(
                        message.type || message.content.type
                      )}{" "}
                      Generated
                    </Text>
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setSelectedAiResponse(message.content);
                        setConversationExpanded(false);
                      }}
                      style={{ paddingLeft: 0, color: defaultAntdBlue }}
                    >
                      View Details
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
      <div ref={chatHistoryEndRef} />
    </>
  );

  const gridTemplateColumns = `
    ${showLeftPanel ? `${siderWidth}px` : "0px"}
    1fr
    ${showRightPanel ? `${siderWidth}px` : "0px"}
  `;

  return (
    <div
      style={{
        height: "100vh",
        position: "relative",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Toggle Buttons Container - Adjusted top positioning */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "16px",
          right: "16px",
          zIndex: 10,
        }}
      >
        {" "}
        {/* Pushed buttons up slightly */}
        {/* Left Toggle Button */}
        {(chatHistory.length > 0 || showLeftPanel) && (
          <div style={{ position: "absolute", left: 0 }}>
            <Button
              type="default"
              icon={
                showLeftPanel ? (
                  <PanelLeftClose size={16} />
                ) : (
                  <PanelLeftOpen size={16} />
                )
              }
              onClick={() => {
                setShowLeftPanel((prev) => !prev);
              }}
              style={{
                backgroundColor: defaultAntdBlue,
                color: defaultAntdSurface,
                borderColor: defaultAntdBlue,
              }}
            >
              {showLeftPanel ? "Hide Conversation" : "Show Conversation"}
            </Button>
          </div>
        )}
        {/* Right Toggle Button */}
        <div style={{ position: "absolute", right: 0 }}>
          <Button
            type="default"
            icon={
              showRightPanel ? (
                <PanelRightClose size={16} />
              ) : (
                <PanelRightOpen size={16} />
              )
            }
            onClick={() => setShowRightPanel((prev) => !prev)}
            style={{
              backgroundColor: defaultAntdBlue,
              color: defaultAntdSurface,
              borderColor: defaultAntdBlue,
            }}
          >
            {showRightPanel ? "Hide Analysis" : "Show Analysis"}
          </Button>
        </div>
      </div>
      {/* Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: gridTemplateColumns,
          height: "100%",
          width: "100%",
          transition: "grid-template-columns 0.3s ease-in-out",
        }}
      >
        {/* Left Sidebar (Conversation) */}
        <div
          style={{
            overflow: "hidden",
            borderRight: `1px solid ${defaultAntdBorderColor}`,
            backgroundColor: defaultAntdSurface,
            display: "flex",
            flexDirection: "column",
            transition: "width 0.3s ease-in-out",
            width: showLeftPanel ? siderWidth : 0,
            boxShadow: "2px 0 6px rgba(0,0,0,0.05)",
            zIndex: 5,
            paddingTop: "80px",
          }}
        >
          {showLeftPanel && (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                boxSizing: "border-box",
              }}
            >
              <Card
                title={
                  <Title
                    level={4}
                    style={{ margin: 0, color: defaultAntdBlue }}
                  >
                    Conversation
                  </Title>
                }
                bordered={true}
                style={{
                  width: "100%",
                  color: defaultAntdTextPrimary,
                  marginBottom: "16px",
                  borderColor: defaultAntdBorderColor,
                }}
                headStyle={{
                  borderBottom: `1px solid ${defaultAntdBorderColor}`,
                }}
              >
                {renderConversationContent()}
              </Card>
              {chatHistory.length > 0 && !conversationExpanded && (
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "12px",
                    borderTop: `1px solid ${defaultAntdBorderColor}`,
                  }}
                >
                  <label
                    htmlFor="prompt-input-left"
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: defaultAntdTextPrimary,
                    }}
                  >
                    <Text strong>Your Next Prompt:</Text>
                  </label>
                  <TextArea
                    id="prompt-input-left"
                    placeholder="Ask another strategic question..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: `1px solid ${defaultAntdBorderColor}`,
                      borderRadius: "4px",
                      outline: "none",
                      marginBottom: "12px",
                    }}
                  />
                  <Button
                    type="primary"
                    icon={loading ? <AntLoadingOutlined /> : <SendOutlined />}
                    style={{ width: "100%" }}
                    onClick={() => {
                      setConversationExpanded(false);
                      generateRoadmap();
                    }}
                    disabled={!prompt.trim()}
                    loading={loading}
                  >
                    {loading ? "Generating..." : "Send Prompt"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Main Content */}
        <div
          style={{
            overflowY: "auto",
            padding: "24px",
            backgroundColor: defaultAntdBackground,
            paddingTop: "30px",
          }}
        >
          <div
            style={{
              width: "100%",
              padding: "16px",
              backgroundColor: defaultAntdSurface,
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: `1px solid ${defaultAntdBorderColor}`,
            }}
          >
            <Card
              title={
                <Title level={3} style={{ margin: 0, color: defaultAntdBlue }}>
                  {conversationExpanded ? "Conversation" : "AI Output"}
                </Title>
              }
              bordered={false}
              style={{ width: "100%", color: defaultAntdTextPrimary }}
              headStyle={{
                borderBottom: `1px solid ${defaultAntdBorderColor}`,
              }}
            >
              {conversationExpanded ? (
                <>
                  {renderConversationContent()}
                  <div
                    style={{
                      marginTop: "16px",
                      paddingTop: "12px",
                      borderTop: `1px solid ${defaultAntdBorderColor}`,
                    }}
                  >
                    <label
                      htmlFor="prompt-input-main"
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        color: defaultAntdTextPrimary,
                      }}
                    >
                      <Text strong>Your Strategic Prompt:</Text>
                    </label>
                    <TextArea
                      id="prompt-input-main"
                      placeholder="Ask a follow-up question..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      autoSize={{ minRows: 4, maxRows: 6 }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: `1px solid ${defaultAntdBorderColor}`,
                        borderRadius: "4px",
                        outline: "none",
                        marginBottom: "16px",
                      }}
                    />
                    <Button
                      type="primary"
                      style={{
                        width: "100%",
                        fontSize: "18px",
                        height: "48px",
                      }}
                      icon={loading ? <AntLoadingOutlined /> : <SendOutlined />}
                      onClick={() => {
                        setConversationExpanded(false);
                        generateRoadmap();
                      }}
                      disabled={!prompt.trim()}
                      loading={loading}
                    >
                      {loading ? "Generating..." : "Generate Strategic Output"}
                    </Button>
                  </div>
                </>
              ) : selectedAiResponse ? (
                <>
                  <AiResponseRenderer content={selectedAiResponse} />
                  <Button
                    type="dashed"
                    style={{
                      width: "100%",
                      marginTop: "24px",
                      fontSize: "16px",
                    }}
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadOutput}
                  >
                    Download Current Output (.json)
                  </Button>
                </>
              ) : (
                <Paragraph
                  type="secondary"
                  style={{ color: defaultAntdTextSecondary }}
                >
                  No AI output to display yet. Submit a prompt to get started.
                </Paragraph>
              )}

              {error && (
                <Alert
                  message="Oops! Something went wrong:"
                  description={
                    <>
                      <Paragraph style={{ color: defaultAntdTextPrimary }}>
                        {error}
                      </Paragraph>
                      <Paragraph
                        type="secondary"
                        style={{ color: defaultAntdTextSecondary }}
                      >
                        Please check your prompt and try again.
                      </Paragraph>
                    </>
                  }
                  type="error"
                  showIcon
                  style={{
                    marginTop: "24px",
                    backgroundColor: "rgba(255, 77, 79, 0.1)",
                    borderColor: defaultAntdErrorRed,
                    color: defaultAntdTextPrimary,
                  }}
                />
              )}
            </Card>
          </div>
        </div>
        {/* Right Sidebar (Feedback Analytics + PRD Summary) */}
        <div
          // style={{
          //   overflow: "hidden",
          //   borderLeft: `1px solid ${defaultAntdBorderColor}`,
          //   backgroundColor: defaultAntdSurface,
          //   display: "flex",
          //   flexDirection: "column",
          //   transition: "width 0.3s ease-in-out",
          //   width: showRightPanel ? siderWidth : 0,
          //   boxShadow: "-2px 0 6px rgba(0,0,0,0.05)",
          //   zIndex: 5,
          //   paddingTop: "80px",
          // }}
          style={{
            overflow: "auto", // Enables scroll, but we'll hide the scrollbars
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE/Edge
            borderLeft: `1px solid ${defaultAntdBorderColor}`,
            backgroundColor: defaultAntdSurface,
            display: "flex",
            flexDirection: "column",
            transition: "width 0.3s ease-in-out",
            width: showRightPanel ? siderWidth : 0,
            boxShadow: "-2px 0 6px rgba(0,0,0,0.05)",
            zIndex: 5,
            paddingTop: "80px",
          }}
        >
          {showRightPanel && (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                boxSizing: "border-box",
              }}
            >
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <PRDSummaryColumn
                  prdFileName={prdFileName}
                  prdSummaryData={prdSummaryData}
                  prdDownloadableSummary={prdDownloadableSummary}
                  handleDownloadFile={handleDownloadFileForColumns}
                  activePanel={activeRightPanelSection}
                  setActivePanel={setActiveRightPanelSection}
                />
                <FeedbackAnalyticsColumn
                  feedbackFileName={feedbackFileName}
                  feedbackAnalyticsData={feedbackAnalyticsData}
                  feedbackDownloadableSummary={feedbackDownloadableSummary}
                  handleDownloadFile={handleDownloadFileForColumns}
                  activePanel={activeRightPanelSection}
                  setActivePanel={setActiveRightPanelSection}
                />
              </Space>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainAppLayout;
