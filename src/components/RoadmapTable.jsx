import React from "react";
import { Table, Tag, Collapse, Typography } from "antd";

const { Panel } = Collapse;
const { Text, Paragraph } = Typography;

const RoadmapTable = ({ initiatives }) => {
  const columns = [
    {
      title: "Initiative",
      dataIndex: "name",
      key: "initiativeName",
      render: (text, record) => <Text strong>{record.name}</Text>,
    },
    {
      title: "Goal",
      dataIndex: "goal",
      key: "goal",
    },
    {
      title: "Features",
      key: "features",
      render: (_, record) => (
        <Collapse ghost expandIconPosition="right">
          {(record.features || []).map((feature, index) => (
            <Panel
              header={
                <Text>
                  {feature.name} (
                  <Tag
                    color={
                      feature.priority === "Highest"
                        ? "red"
                        : feature.priority === "High"
                        ? "orange"
                        : feature.priority === "Medium"
                        ? "blue"
                        : "default"
                    }
                  >
                    {feature.priority}
                  </Tag>
                  )
                </Text>
              }
              key={`${record.name}-feature-${index}`}
            >
              <Paragraph>
                {" "}
                {/* This is where the error was */}
                <Text strong>Quarter:</Text> {feature.quarter}
              </Paragraph>
              <Paragraph>
                {" "}
                {/* And here */}
                <Text strong>Justification:</Text> {feature.justification}
              </Paragraph>
              {feature.references && feature.references.length > 0 && (
                <Collapse ghost>
                  <Panel header="References" key={`feature-refs-${index}`}>
                    {feature.references.map((ref, refIndex) => (
                      <Paragraph key={refIndex}>
                        {" "}
                        {/* And here */}
                        <Text strong>Source:</Text> {ref.source}
                        <br />
                        <Text type="secondary" italic>
                          "{ref.quote}"
                        </Text>
                      </Paragraph>
                    ))}
                  </Panel>
                </Collapse>
              )}
            </Panel>
          ))}
        </Collapse>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={initiatives}
      rowKey="name"
      pagination={false}
      bordered
    />
  );
};

export default RoadmapTable;
