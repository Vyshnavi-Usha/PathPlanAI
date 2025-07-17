import React from "react";
import { Card, Typography, Badge, Tooltip } from "antd";
import { format, differenceInDays, parseISO } from "date-fns";

const { Title, Text, Paragraph } = Typography;

const getStatusColor = (status, priority) => {
  const lowerCaseStatus = status.toLowerCase();
  const lowerCasePriority = priority.toLowerCase();

  if (lowerCaseStatus === "done") return "#4CAF50";

  switch (lowerCaseStatus) {
    case "in progress":
      if (lowerCasePriority === "highest" || lowerCasePriority === "high") {
        return "#FF1744";
      } else if (lowerCasePriority === "medium") {
        return "#FF9800";
      } else {
        return "#2196F3";
      }
    case "to do":
      return "#757575";
    case "review":
      return "#9C27B0";
    case "on hold":
      return "#FF5722";
    default:
      return "#9E9E9E";
  }
};

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

export function GanttChart({ initiatives }) {
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
    (task) =>
      task.startDate &&
      task.endDate &&
      !isNaN(task.startDate) &&
      !isNaN(task.endDate)
  );

  const sortedTasks = [...validTasks].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );

  if (sortedTasks.length === 0) {
    return (
      <Paragraph type="secondary">
        No features with valid dates found to render the Gantt chart.
      </Paragraph>
    );
  }

  const minDate = new Date(
    Math.min(...sortedTasks.map((t) => t.startDate.getTime()))
  );
  const maxDate = new Date(
    Math.max(...sortedTasks.map((t) => t.endDate.getTime()))
  );
  const totalDays = differenceInDays(maxDate, minDate) + 1;

  const getTaskPosition = (task) => {
    const startOffset = differenceInDays(task.startDate, minDate);
    const duration = differenceInDays(task.endDate, task.startDate) + 1;
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  const monthHeaders = [];
  let currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  while (currentDate <= maxDate) {
    monthHeaders.push(new Date(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return (
    <Card
      className="p-6"
      style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", borderRadius: "8px" }}
    >
      <div className="space-y-6">
        {/* Timeline Header */}
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
          <Title level={4} style={{ margin: 0, color: "#1976D2" }}>
            Gantt Chart View
          </Title>
          <Text style={{ color: "#673AB7", fontWeight: "500" }}>
            {format(minDate, "MMM dd")} - {format(maxDate, "MMM dd, yyyy")}
          </Text>
        </div>

        {/* Chart Container */}
        <div style={{ position: "relative" }}>
          {/* Month Headers */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #d9d9d9",
              height: "32px",
              marginBottom: "8px",
            }}
          >
            {monthHeaders.map((monthStart, i) => {
              const monthEnd = new Date(
                monthStart.getFullYear(),
                monthStart.getMonth() + 1,
                0
              );
              const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
              const widthPercentage = (daysInMonth / totalDays) * 100;
              return (
                <div
                  key={i}
                  style={{
                    flexShrink: 0,
                    width: `${widthPercentage}%`,
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#3F51B5",
                    padding: "0 8px",
                    boxSizing: "border-box",
                  }}
                >
                  {format(monthStart, "MMM yyyy")}
                </div>
              );
            })}
          </div>

          {/* Task Rows */}
          <div className="space-y-3">
            {sortedTasks.map((task) => (
              <div key={task.id} style={{ marginBottom: "20px" }}>
                {/* Task Info */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <Text
                      strong
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "#1565C0",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      {task.title}
                    </Text>
                    <Badge
                      status={getPriorityBadgeVariant(task.priority)}
                      text={task.priority}
                    />
                    <Text
                      style={{
                        fontSize: "14px",
                        color: "#E91E63",
                        fontWeight: "500",
                      }}
                    >
                      {task.assignee}
                    </Text>
                  </div>
                  <Text
                    style={{
                      fontSize: "14px",
                      color: "#4CAF50",
                      fontWeight: "600",
                    }}
                  >
                    {task.progress}%
                  </Text>
                </div>

                {/* Timeline Bar */}
                <div
                  style={{
                    position: "relative",
                    height: "32px",
                    backgroundColor: "#f0f2f5",
                    borderRadius: "4px",
                  }}
                >
                  <Tooltip
                    title={
                      <div>
                        <p style={{ margin: 0 }}>
                          <strong>{task.title}</strong>
                        </p>
                        <p style={{ margin: 0 }}>
                          {format(task.startDate, "MMM dd, yyyy")} -{" "}
                          {format(task.endDate, "MMM dd, yyyy")}
                        </p>
                        <p style={{ margin: 0 }}>Status: {task.status}</p>
                        <p style={{ margin: 0 }}>Progress: {task.progress}%</p>
                        <p style={{ margin: 0 }}>
                          Assigned To: {task.assignee}
                        </p>
                      </div>
                    }
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        bottom: "4px",
                        borderRadius: "2px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                        transition: "all 0.3s",
                        ...getTaskPosition(task),
                        backgroundColor: getStatusColor(
                          task.status,
                          task.priority
                        ),
                      }}
                    >
                      {/* Progress Indicator - Green overlay */}
                      <div
                        style={{
                          height: "100%",
                          backgroundColor: "#4CAF50",
                          borderRadius: "2px",
                          width: `${task.progress}%`,
                          opacity: 0.8,
                        }}
                      />

                      {/* Task Info Overlay */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "white",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            padding: "0 8px",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                          }}
                        >
                          {differenceInDays(task.endDate, task.startDate) + 1}d
                        </Text>
                      </div>
                    </div>
                  </Tooltip>

                  {/* Date Labels */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-20px",
                      left: 0,
                      fontSize: "12px",
                      color: "#795548",
                      fontWeight: "500",
                    }}
                  >
                    {format(task.startDate, "MMM dd")}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-20px",
                      right: 0,
                      fontSize: "12px",
                      color: "#795548",
                      fontWeight: "500",
                    }}
                  >
                    {format(task.endDate, "MMM dd")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default GanttChart;
