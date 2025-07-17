import React from "react";
import { Card, Typography, Table, Alert, Tabs, Tooltip, Button } from "antd";
import { marked } from "marked";
import { format, parseISO } from "date-fns";

import { GanttChart } from "./GanttChart";
import { KanbanBoard } from "./KanbanBoard";
import { Timeline } from "./Timeline";

import "./MarkdownStyles.css";

const { Title, Paragraph, Text } = Typography;

const ReferencesList = ({ references, limit = 3 }) => {
  const [showAll, setShowAll] = React.useState(false);
  const displayRefs = showAll ? references : references.slice(0, limit);
  const hasMoreRefs = references.length > limit;

  if (!references || references.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "8px",
        fontSize: "12px",
        color: "#8c8c8c",
      }}
    >
      <Text strong>References:</Text>
      <ul
        style={{
          listStyleType: "disc",
          marginLeft: "16px",
          paddingLeft: 0,
          marginTop: "4px",
        }}
      >
        {displayRefs.map((ref, refIndex) => (
          <li key={refIndex}>
            <Tooltip title={ref.quote}>
              <Text style={{ cursor: "help", color: "#1890ff" }}>
                {" "}
                {/* Ant Design blue */}
                {ref.source}
              </Text>
            </Tooltip>
          </li>
        ))}
      </ul>
      {hasMoreRefs && (
        <Button
          type="link"
          onClick={() => setShowAll(!showAll)}
          style={{ paddingLeft: 0, marginTop: "4px", fontSize: "12px" }}
        >
          {showAll ? "Show Less" : `Show All (${references.length} items)`}
        </Button>
      )}
    </div>
  );
};

const AiResponseRenderer = ({ content }) => {
  const [activeRoadmapView, setActiveRoadmapView] = React.useState("overview");

  if (!content) {
    return <Paragraph type="secondary">No content to display.</Paragraph>;
  }

  if (typeof content === "string") {
    return (
      <div
        className="ant-typography"
        dangerouslySetInnerHTML={{ __html: marked.parse(content || "") }}
        style={{ wordBreak: "break-word" }}
      />
    );
  }

  if (content.type === "orchestrated_response") {
    return (
      <div>
        {/* Show overall summary */}
        {content.overview_text && (
          <Card title="Summary" style={{ marginBottom: 16 }}>
            <div
              className="ant-typography markdown-content"
              dangerouslySetInnerHTML={{
                __html: marked.parse(content.overview_text),
              }}
              style={{ wordBreak: "break-word" }}
            />
          </Card>
        )}

        {/* Render each part */}
        {content.parts &&
          content.parts.map((part, index) => (
            <div key={index}>
              <AiResponseRenderer content={part.data} />
            </div>
          ))}
      </div>
    );
  }
  const overviewText =
    content.overview_text || content.answer || content.summary || "";

  switch (content.type) {
    case "roadmap": {
      if (!content.initiatives) {
        return (
          <Alert
            message="Invalid Roadmap Format"
            description={
              <>
                <Paragraph>
                  The roadmap object is missing the 'initiatives' array.
                </Paragraph>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "12px",
                    wordBreak: "break-word",
                  }}
                >
                  {JSON.stringify(content, null, 2)}
                </pre>
              </>
            }
            type="error"
            showIcon
          />
        );
      }

      const tableData = content.initiatives.flatMap((initiative) =>
        initiative.features.map((feature) => ({
          key: `${initiative.name}-${feature.name}`,
          initiativeName: initiative.name,
          ...feature,
        }))
      );

      const priorities = { Highest: 4, High: 3, Medium: 2, Low: 1 };
      const tableColumns = [
        {
          title: "Feature/Task",
          dataIndex: "name",
          key: "name",
          render: (text, record) => (
            <>
              <Text strong>{text}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                ({record.initiativeName})
              </Text>
            </>
          ),
        },
        {
          title: "Priority",
          dataIndex: "priority",
          key: "priority",
          sorter: (a, b) =>
            (priorities[a.priority] || 0) - (priorities[b.priority] || 0),
        },
        {
          title: "Quarter",
          dataIndex: "quarter",
          key: "quarter",
          sorter: (a, b) => a.quarter.localeCompare(b.quarter),
        },
        {
          title: "Assignee",
          dataIndex: "assignee",
          key: "assignee",
        },
        {
          title: "Dates",
          key: "dates",
          render: (text, record) => (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.startDate && record.endDate
                ? `${format(parseISO(record.startDate), "MMM dd")} - ${format(
                    parseISO(record.endDate),
                    "MMM dd, yyyy"
                  )}`
                : "N/A"}
            </Text>
          ),
        },
        {
          title: "Justification",
          dataIndex: "justification",
          key: "justification",
          render: (text, record) => (
            <>
              <Paragraph style={{ margin: 0 }}>{text}</Paragraph>
              <ReferencesList references={record.references} />
            </>
          ),
        },
      ];

      const tabItems = [
        {
          label: "Overview",
          key: "overview",
          children: (
            <div
              className="ant-typography markdown-content" // Added markdown-content class here
              dangerouslySetInnerHTML={{ __html: marked.parse(overviewText) }}
              style={{
                wordBreak: "break-word",
                padding: "12px",
                lineHeight: "1.6",
              }}
            />
          ),
        },
        {
          label: "Table View",
          key: "table",
          children: (
            <div style={{ marginBottom: "16px", padding: "12px" }}>
              {" "}
              <Title level={4}>Initiatives & Features Table:</Title>
              <Table
                dataSource={tableData}
                columns={tableColumns}
                pagination={false}
                bordered
                size="small"
              />
            </div>
          ),
        },
        {
          label: "Gantt Chart",
          key: "gantt",
          disabled: !content.initiatives || content.initiatives.length === 0,
          children: (
            <GanttChart
              initiatives={content.initiatives}
              style={{
                marginBottom: "16px",
                padding: "12px",
                border: "1px solid #e8e8e8",
                borderRadius: "8px",
                backgroundColor: "#fff",
                overflowX: "auto",
              }}
            />
          ),
        },
        {
          label: "Kanban Board",
          key: "kanban",
          disabled: !content.initiatives || content.initiatives.length === 0,
          children: (
            <KanbanBoard
              initiatives={content.initiatives}
              style={{
                marginBottom: "16px",
                padding: "12px",
                border: "1px solid #e8e8e8",
                borderRadius: "8px",
                backgroundColor: "#fff",
                overflowX: "auto",
              }}
            />
          ),
        },
        {
          label: "Timeline Chart",
          key: "timeline",
          disabled: !content.initiatives || content.initiatives.length === 0,
          children: (
            <Timeline
              initiatives={content.initiatives}
              style={{
                marginBottom: "16px",
                padding: "12px",
                border: "1px solid #e8e8e8",
                borderRadius: "8px",
                backgroundColor: "#fff",
                overflowX: "auto",
              }}
            />
          ),
        },
      ];

      return (
        <Card title="Product Roadmap" style={{ marginBottom: 24 }}>
          <Tabs
            activeKey={activeRoadmapView}
            onChange={(key) => setActiveRoadmapView(key)}
            items={tabItems}
          />
        </Card>
      );
    }

    case "feature_brief": {
      return (
        <Card title="Feature Brief" style={{ marginBottom: 24 }}>
          <div
            className="ant-typography"
            dangerouslySetInnerHTML={{ __html: marked.parse(overviewText) }}
            style={{ wordBreak: "break-word", paddingBottom: "16px" }}
          />
          <Title level={5}>Problem Statement:</Title>
          <Paragraph>{content.problem_statement}</Paragraph>
          <Title level={5}>User Stories:</Title>
          <ul>
            {content.user_stories &&
              content.user_stories.map((story, i) => <li key={i}>{story}</li>)}
          </ul>
          <ReferencesList references={content.references} />
        </Card>
      );
    }

    case "bug_list": {
      return (
        <Card title="Bug List" style={{ marginBottom: 24 }}>
          <div
            className="ant-typography"
            dangerouslySetInnerHTML={{ __html: marked.parse(overviewText) }}
            style={{ wordBreak: "break-word", paddingBottom: "16px" }}
          />
          {content.bugs && content.bugs.length > 0 ? (
            <Table
              dataSource={content.bugs.map((bug, i) => ({ ...bug, key: i }))}
              columns={[
                {
                  title: "Description",
                  dataIndex: "description",
                  key: "description",
                },
                { title: "Impact", dataIndex: "impact", key: "impact" },
                {
                  title: "Frequency",
                  dataIndex: "frequency",
                  key: "frequency",
                },
                {
                  title: "References",
                  dataIndex: "references",
                  key: "references",
                  render: (refs) => <ReferencesList references={refs} />,
                },
              ]}
              pagination={false}
              bordered
              size="small"
            />
          ) : (
            <Paragraph type="secondary">No bugs found.</Paragraph>
          )}
        </Card>
      );
    }

    case "strategic_summary": {
      return (
        <Card title="Strategic Summary" style={{ marginBottom: 24 }}>
          <div
            className="ant-typography"
            dangerouslySetInnerHTML={{ __html: marked.parse(overviewText) }}
            style={{ wordBreak: "break-word" }}
          />
        </Card>
      );
    }

    case "qa_response": {
      const evidence = content.evidence || [];
      return (
        <Card title="AI Answer" style={{ marginBottom: 24 }}>
          <div
            className="ant-typography"
            dangerouslySetInnerHTML={{ __html: marked.parse(overviewText) }}
            style={{ wordBreak: "break-word", paddingBottom: "16px" }}
          />
          <ReferencesList references={evidence} limit={5} />
          {content.recommendation && (
            <div style={{ marginTop: "16px" }}>
              <Title level={5}>Recommendation:</Title>
              <Paragraph>{content.recommendation}</Paragraph>
            </div>
          )}
        </Card>
      );
    }

    default: {
      return (
        <Alert
          message="Unknown Response Type"
          description={`The AI returned an unsupported response type: ${
            content.type || "unknown"
          }. Please check the AI's output.`}
          type="warning"
          showIcon
        />
      );
    }
  }
};

export default AiResponseRenderer;
