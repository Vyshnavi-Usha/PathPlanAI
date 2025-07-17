import React from "react";
import { Upload, Card, Button, Typography, message } from "antd";
import {
  UploadOutlined,
  FileTextOutlined,
  CommentOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

const InitialUploadScreen = ({
  setPrdFileName,
  setUploadedPrdContent,
  prdFileList,
  setPrdFileList,
  setFeedbackFileName,
  setUploadedFeedbackContent,
  feedbackFileList,
  setFeedbackFileList,
  handleFileUpload,
  uploadingFile,
  setUploadingFile,
  handleAnalyzeClick,
}) => {
  const isAnalyzeButtonDisabled =
    prdFileList.length === 0 || feedbackFileList.length === 0 || uploadingFile;

  const prdBoxBorder =
    prdFileList.length > 0 ? "1px solid #52c41a" : "1px solid #d9d9d9";

  const feedbackBoxBorder =
    feedbackFileList.length > 0 ? "1px solid #52c41a" : "1px solid #d9d9d9";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        marginTop: "100px",
      }}
    >
      {/* Wrapper for the two upload boxes */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "24px",
          flexWrap: "nowrap",
          width: "100%",
          maxWidth: "960px",
          marginBottom: "24px",
        }}
      >
        {/* PRD Upload Box */}
        <div
          style={{
            width: "48%",
            border: prdBoxBorder,
            borderRadius: "8px",
            padding: "24px",
            backgroundColor: "#fff",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            height: "320px",
            transition: "border-color 0.3s ease-in-out",
          }}
        >
          <div
            style={{
              marginBottom: "16px",
              textAlign: "center",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileTextOutlined
              style={{ fontSize: "20px", marginRight: "8px", color: "#1890ff" }}
            />
            <Text strong style={{ fontSize: "16px" }}>
              Product Requirements Document (PRD)
            </Text>
          </div>
          <Upload.Dragger
            accept=".pdf,.docx,.txt,.md"
            beforeUpload={() => false}
            onChange={(info) => {
              setPrdFileList(info.fileList);
              if (info.fileList.length > 0) {
                setPrdFileName(info.fileList[info.fileList.length - 1].name);
              } else {
                setPrdFileName("");
              }
              handleFileUpload(
                info,
                setUploadedPrdContent,
                setPrdFileName,
                setUploadingFile,
                "PRD"
              );
            }}
            maxCount={1}
            fileList={prdFileList}
            onRemove={() => {
              setUploadedPrdContent("");
              setPrdFileName("");
              setPrdFileList([]);
              message.info("PRD file removed.");
            }}
            style={{
              padding: "16px",
              border: "1px dashed #d9d9d9",
              borderRadius: "8px",
              backgroundColor: "#fafafa",
              width: "100%",
              flex: 1,
            }}
            loading={uploadingFile}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">
              Drop your file here or click to browse
            </p>
            <p className="ant-upload-hint">
              Supports PDF, DOCX, TXT, or Markdown files
            </p>
          </Upload.Dragger>
        </div>

        {/* Feedback Upload Box */}
        <div
          style={{
            width: "48%",
            border: feedbackBoxBorder,
            borderRadius: "8px",
            padding: "24px",
            backgroundColor: "#fff",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            height: "320px",
            transition: "border-color 0.3s ease-in-out",
          }}
        >
          <div
            style={{
              marginBottom: "16px",
              textAlign: "center",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CommentOutlined
              style={{ fontSize: "20px", marginRight: "8px", color: "#1890ff" }}
            />
            <Text strong style={{ fontSize: "16px" }}>
              User Feedback Data
            </Text>
          </div>
          <Upload.Dragger
            accept=".txt,.csv"
            beforeUpload={() => false}
            onChange={(info) => {
              setFeedbackFileList(info.fileList);
              if (info.fileList.length > 0) {
                setFeedbackFileName(
                  info.fileList[info.fileList.length - 1].name
                );
              } else {
                setFeedbackFileName("");
              }
              handleFileUpload(
                info,
                setUploadedFeedbackContent,
                setFeedbackFileName,
                setUploadingFile,
                "User Feedback"
              );
            }}
            maxCount={1}
            fileList={feedbackFileList}
            onRemove={() => {
              setUploadedFeedbackContent("");
              setFeedbackFileName("");
              setFeedbackFileList([]);
              message.info("User Feedback file removed.");
            }}
            style={{
              padding: "16px",
              border: "1px dashed #d9d9d9",
              borderRadius: "8px",
              backgroundColor: "#fafafa",
              width: "100%",
              flex: 1,
            }}
            loading={uploadingFile}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">
              Drop your file here or click to browse
            </p>
            <p className="ant-upload-hint">Supports TXT files</p>
          </Upload.Dragger>
        </div>
      </div>
      <Button
        type="primary"
        size="large"
        block
        style={{ maxWidth: "960px", width: "100%" }}
        onClick={handleAnalyzeClick}
        disabled={isAnalyzeButtonDisabled}
      >
        Analyze Documents
      </Button>
    </div>
  );
};

export default InitialUploadScreen;
