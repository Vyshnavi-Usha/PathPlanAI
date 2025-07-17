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

const getColumnColor = (statusId) => {
  switch (statusId) {
    case "to do":
      return "#9E9E9E";
    case "in progress":
      return "#03A9F4";
    case "review":
      return "#9C27B0";
    case "done":
      return "#4CAF50";
    case "on hold":
      return "#FF7043";
    default:
      return "#BDBDBD";
  }
};

export function KanbanBoard({ initiatives }) {
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

  const columns = [
    { id: "to do", title: "To Do" },
    { id: "in progress", title: "In Progress" },
    { id: "review", title: "Review" },
    { id: "done", title: "Done" },
    { id: "on hold", title: "On Hold" },
  ];

  const getTasksByStatus = (statusId) => {
    return tasks.filter((task) => task.status === statusId);
  };

  return (
    <Card
      style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", borderRadius: "8px" }}
    >
      <div style={{ padding: "24px" }}>
        {" "}
        {/* Mimic p-6 padding */}
        <div style={{ marginBottom: "24px" }}>
          {" "}
          {/* space-y-6 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #f0f0f0",
              paddingBottom: "16px",
              marginBottom: "16px",
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              Kanban Board View
            </Title>
            <Text type="secondary">{tasks.length} total tasks</Text>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "24px",
            }}
          >
            {" "}
            {/* grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 */}
            {columns.map((column) => {
              const columnTasks = getTasksByStatus(column.id);

              return (
                <div
                  key={column.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {" "}
                  {/* space-y-4 */}
                  {/* Column Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: "8px",
                      borderBottom: "1px dashed #e0e0e0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      {" "}
                      {/* flex items-center gap-3 */}
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: getColumnColor(column.id),
                        }}
                      ></div>
                      <Title level={5} style={{ margin: 0 }}>
                        {column.title}
                      </Title>
                    </div>
                    <Badge count={columnTasks.length} overflowCount={999} />{" "}
                    {/* Badge for task count */}
                  </div>
                  {/* Task Cards */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      minHeight: "200px",
                    }}
                  >
                    {" "}
                    {/* space-y-3 min-h-[200px] */}
                    {columnTasks.map((task) => (
                      <Card
                        key={task.id}
                        size="small"
                        style={{
                          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                          transition: "all 0.2s ease-in-out",
                          cursor: "grab",

                          borderLeft: `4px solid ${getColumnColor(
                            task.status
                          )}`,
                        }}
                        bodyStyle={{ padding: "16px" }}
                        className="hover-shadow"
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          {" "}
                          {/* space-y-3 */}
                          {/* Task Header */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {" "}
                            {/* space-y-2 */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                              }}
                            >
                              <Text
                                strong
                                style={{ fontSize: "14px", lineHeight: "1.2" }}
                              >
                                {task.title}
                              </Text>
                              <Badge
                                status={getPriorityBadgeVariant(task.priority)}
                                text={task.priority}
                                style={{ marginLeft: "8px" }}
                              />
                            </div>
                            {task.description && (
                              <Paragraph
                                ellipsis={{ rows: 2 }}
                                style={{
                                  fontSize: "12px",
                                  color: "#8c8c8c",
                                  margin: 0,
                                }}
                              >
                                {task.description}
                              </Paragraph>
                            )}
                          </div>
                          {/* Task Details */}
                          <Space
                            direction="vertical"
                            size={4}
                            style={{ width: "100%" }}
                          >
                            {" "}
                            {/* space-y-2 text-xs */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                color: "#8c8c8c",
                                fontSize: "12px",
                              }}
                            >
                              <UserOutlined />
                              <span>{task.assignee}</span>
                            </div>
                            {task.endDate && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  color: "#8c8c8c",
                                  fontSize: "12px",
                                }}
                              >
                                <CalendarOutlined />
                                <span>
                                  Due {format(task.endDate, "MMM dd")}
                                </span>
                              </div>
                            )}
                          </Space>
                          {/* Progress */}
                          {task.progress > 0 && (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                marginTop: "8px",
                              }}
                            >
                              {" "}
                              {/* space-y-1 */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  fontSize: "12px",
                                }}
                              >
                                <Text type="secondary">Progress</Text>
                                <Text strong>{task.progress}%</Text>
                              </div>
                              <Progress
                                percent={task.progress}
                                size="small"
                                showInfo={false}
                                strokeColor={getColumnColor(task.status)}
                                style={{ margin: 0 }}
                              />
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                    {columnTasks.length === 0 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "200px",
                          color: "#8c8c8c",
                          fontSize: "14px",
                          border: "2px dashed #e0e0e0",
                          borderRadius: "8px",
                          padding: "16px",
                          textAlign: "center",
                        }}
                      >
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default KanbanBoard;
