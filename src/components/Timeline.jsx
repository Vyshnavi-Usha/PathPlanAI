import React from "react";
import { Card, Typography, Badge, Progress, Space } from "antd";
import { format, parseISO } from "date-fns";
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const getPriorityBadgeVariant = (priority) => {
  switch (priority.toLowerCase()) {
    case "highest":
    case "high":
      return "error";
    case "medium":
      return "processing";
    case "low":
      return "default";
    default:
      return "default";
  }
};

const getStatusBorderColor = (status) => {
  const lowerCaseStatus = status.toLowerCase();
  switch (lowerCaseStatus) {
    case "to do":
      return "#757575";
    case "in progress":
      return "#2196F3";
    case "review":
      return "#9C27B0";
    case "done":
      return "#4CAF50";
    case "on hold":
      return "#FF5722";
    default:
      return "#9E9E9E";
  }
};

const getStatusBackgroundColor = (status) => {
  const lowerCaseStatus = status.toLowerCase();
  switch (lowerCaseStatus) {
    case "to do":
      return "rgba(117, 117, 117, 0.15)";
    case "in progress":
      return "rgba(33, 150, 243, 0.15)";
    case "review":
      return "rgba(156, 39, 176, 0.15)";
    case "done":
      return "rgba(76, 175, 80, 0.15)";
    case "on hold":
      return "rgba(255, 87, 34, 0.15)";
    default:
      return "rgba(158, 158, 158, 0.15)";
  }
};

export function Timeline({ initiatives }) {
  const tasks = initiatives.flatMap((initiative) =>
    initiative.features.map((feature) => ({
      id: `${initiative.name}-${feature.name}-${feature.startDate}`,
      title: feature.name,
      description: feature.justification,
      startDate: feature.startDate ? parseISO(feature.startDate) : null,
      endDate: feature.endDate ? parseISO(feature.endDate) : null,
      status: (feature.status || "To Do").toLowerCase(),
      priority: feature.priority || "Medium",
      assignee: feature.assignee || "Unassigned",
      progress: feature.progress || 0,
      references: feature.references || [],
      initiativeName: initiative.name,
    }))
  );

  const validTasks = tasks.filter(
    (task) => task.startDate && !isNaN(task.startDate)
  );

  const sortedTasks = [...validTasks].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );

  return (
    <Card
      style={{
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        borderRadius: "12px",
        border: "1px solid #E3F2FD",
      }}
    >
      <div style={{ padding: "24px" }}>
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "2px solid #E3F2FD",
              paddingBottom: "16px",
              marginBottom: "16px",
            }}
          >
            <Title
              level={4}
              style={{
                margin: 0,
                color: "#1976D2",
                fontWeight: "600",
              }}
            >
              Timeline View
            </Title>
            <Text
              style={{
                color: "#673AB7",
                fontWeight: "500",
                background: "linear-gradient(45deg, #673AB7, #9C27B0)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {sortedTasks.length} tasks
            </Text>
          </div>

          <div style={{ position: "relative" }}>
            {/* Timeline Line - Bright gradient */}
            <div
              style={{
                position: "absolute",
                left: "26px",
                top: "0",
                bottom: "0",
                width: "3px",
                background:
                  "linear-gradient(180deg, #2196F3, #9C27B0, #4CAF50)",
                borderRadius: "2px",
                zIndex: 0,
              }}
            ></div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    position: "relative",
                    display: "flex",
                    gap: "24px",
                    alignItems: "flex-start",
                  }}
                >
                  {/* Timeline Node - Enhanced */}
                  <div
                    style={{
                      position: "relative",
                      flexShrink: 0,
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      border: `4px solid ${getStatusBorderColor(task.status)}`,
                      backgroundColor: getStatusBackgroundColor(task.status),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 4px 12px ${getStatusBorderColor(
                        task.status
                      )}40`,
                      zIndex: 1,
                      top: "8px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        backgroundColor:
                          task.status === "done"
                            ? "#4CAF50"
                            : getStatusBorderColor(task.status),
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    ></div>
                  </div>

                  {/* Task Card - Enhanced */}
                  <Card
                    size="small"
                    style={{
                      flex: 1,
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                      transition: "all 0.3s ease-in-out",
                      marginTop: "0",
                      border: "1px solid #E8F5E8",
                      borderRadius: "12px",
                    }}
                    bodyStyle={{ padding: "20px" }}
                    hoverable
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <Title
                            level={5}
                            style={{
                              margin: 0,
                              color: "#1565C0",
                              fontWeight: "600",
                            }}
                          >
                            {task.title}
                          </Title>
                          {task.description && (
                            <Paragraph
                              style={{
                                margin: 0,
                                color: "#5E35B1",
                                fontWeight: "500",
                              }}
                            >
                              {task.description}
                            </Paragraph>
                          )}
                        </div>
                        <Badge
                          status={getPriorityBadgeVariant(task.priority)}
                          text={task.priority}
                          style={{ marginLeft: "16px" }}
                        />
                      </div>

                      {/* Details */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: "16px",
                        }}
                      >
                        <Space
                          size={8}
                          style={{ color: "#E91E63", fontWeight: "500" }}
                        >
                          <UserOutlined
                            style={{ fontSize: "16px", color: "#E91E63" }}
                          />
                          <span>{task.assignee}</span>
                        </Space>

                        {task.startDate && task.endDate && (
                          <Space
                            size={8}
                            style={{ color: "#FF9800", fontWeight: "500" }}
                          >
                            <CalendarOutlined
                              style={{ fontSize: "16px", color: "#FF9800" }}
                            />
                            <span>
                              {format(task.startDate, "MMM dd")} -{" "}
                              {format(task.endDate, "MMM dd")}
                            </span>
                          </Space>
                        )}

                        <Space
                          size={8}
                          style={{ color: "#795548", fontWeight: "500" }}
                        >
                          <ClockCircleOutlined
                            style={{
                              fontSize: "16px",
                              color: getStatusBorderColor(task.status),
                            }}
                          />
                          <span
                            style={{
                              textTransform: "capitalize",
                              color: getStatusBorderColor(task.status),
                              fontWeight: "600",
                            }}
                          >
                            {task.status.replace("-", " ")}
                          </span>
                        </Space>
                      </div>

                      {/* Progress */}
                      {task.progress > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text
                              style={{ color: "#7B1FA2", fontWeight: "500" }}
                            >
                              Progress
                            </Text>
                            <Text
                              strong
                              style={{
                                color: "#4CAF50",
                                fontWeight: "600",
                              }}
                            >
                              {task.progress}%
                            </Text>
                          </div>
                          <Progress
                            percent={task.progress}
                            size="small"
                            showInfo={false}
                            strokeColor="#4CAF50"
                            trailColor="#E8F5E8"
                            strokeWidth={6}
                            style={{ margin: 0 }}
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default Timeline;
