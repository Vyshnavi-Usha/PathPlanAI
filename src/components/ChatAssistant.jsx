import React from "react";
import { Card, Space, Typography, Input, Button, Alert } from "antd";
import {
  SendOutlined,
  LoadingOutlined,
  DownloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { marked } from "marked";

import AiResponseRenderer from "./AiResponseRenderer";

const { Title, Text, Paragraph } = Typography;
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
      return "AI Response";
  }
};

const ChatAssistant = ({
  chatHistory,
  chatHistoryEndRef,
  prompt,
  setPrompt,
  generateRoadmap,
  loading,
  error,
  aiResponse,
  setAiResponse,
  handleDownloadOutput,
}) => {
  const commonCardStyle = {
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    width: "100%",
  };

  return (
    <Space
      direction="vertical"
      size="large"
      style={{ width: "100%", maxWidth: "960px", margin: "0 auto" }}
    >
      <Card
        title={
          <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
            Chat Assistant:
          </Title>
        }
        style={commonCardStyle}
      >
        <div
          style={{
            height: "60vh",
            overflowY: "auto",
            border: "1px solid #d9d9d9",
            borderRadius: "8px",
            padding: "16px",
            backgroundColor: "#fafafa",
            wordBreak: "break-word",
            marginBottom: "16px",
          }}
        >
          {chatHistory.length === 0 ? (
            <Paragraph type="secondary" italic>
              Start the conversation by asking a strategic question!
            </Paragraph>
          ) : (
            chatHistory.map((message, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  borderRadius: "8px",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  backgroundColor:
                    message.role === "user" ? "#e6f7ff" : "#f0f2f5",
                  marginLeft: message.role === "user" ? "auto" : "0",
                  marginRight: message.role === "user" ? "0" : "auto",
                  maxWidth: "100%",
                  textAlign: message.role === "user" ? "right" : "left",
                }}
              >
                <Text
                  strong
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    color: message.role === "user" ? "#1890ff" : "#595959",
                  }}
                >
                  {message.role === "user" ? "You" : "AI"}:
                </Text>
                {typeof message.content === "string" ? (
                  <div
                    className="ant-typography"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(message.content),
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <Text strong>
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
                        setAiResponse(message.content);
                      }}
                      style={{ paddingLeft: 0 }}
                    >
                      View Details
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={chatHistoryEndRef} />
        </div>

        {/* Detailed AI Output Renderer */}
        {aiResponse && (
          <Card
            title={
              <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
                Detailed AI Output:
              </Title>
            }
            style={{
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              width: "100%",
              marginTop: "24px",
            }}
          >
            <AiResponseRenderer content={aiResponse} />
            <Button
              type="dashed"
              size="large"
              block
              onClick={handleDownloadOutput}
              icon={<DownloadOutlined />}
              style={{ marginTop: "24px" }}
            >
              Download Current Output (.json)
            </Button>
          </Card>
        )}

        {/* Input Prompt & Submit */}
        <div style={{ marginTop: "16px" }}>
          <label
            htmlFor="prompt-input"
            style={{ display: "block", marginBottom: "8px" }}
          >
            <Text strong>Your Strategic Prompt:</Text>
          </label>
          <TextArea
            id="prompt-input"
            placeholder="e.g., 'Generate a roadmap for Q3...'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            autoSize={{ minRows: 4, maxRows: 6 }}
            style={{ marginBottom: "16px" }}
          />
          <Button
            type="primary"
            size="large"
            block
            onClick={generateRoadmap}
            loading={loading}
            icon={loading ? <LoadingOutlined /> : <SendOutlined />}
            disabled={!prompt.trim()}
          >
            {loading ? "Generating..." : "Generate Strategic Output"}
          </Button>
        </div>

        {error && (
          <Alert
            message="Oops! Something went wrong:"
            description={
              <>
                <Paragraph>{error}</Paragraph>
                <Paragraph type="secondary">
                  Please check your prompt and try again. If the issue persists,
                  ensure the Python backend is running and your Google Cloud
                  authentication is correct.
                </Paragraph>
              </>
            }
            type="error"
            showIcon
            style={{ marginTop: "24px" }}
          />
        )}
      </Card>
    </Space>
  );
};

export default ChatAssistant;
