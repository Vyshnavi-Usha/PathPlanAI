import React, { useState } from "react";
import {
  Download,
  ChevronRight,
  FileText,
  Star,
  BarChart,
  Code,
} from "lucide-react";

const PRDSummaryColumn = ({
  prdFileName,
  prdSummaryData,
  prdDownloadableSummary,
  handleDownloadFile,
  activePanel,
  setActivePanel,
}) => {
  const renderButton = ({
    children,
    onClick,
    className = "",
    icon: Icon,
    disabled,
    type = "default",
  }) => {
    let baseClasses =
      "px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-75 flex items-center justify-center gap-2";
    let typeClasses = "";

    switch (type) {
      case "primary":
        typeClasses =
          "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500";
        break;
      case "dashed":
        typeClasses =
          "bg-white border border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 focus:ring-blue-500";
        break;
      default:
        typeClasses =
          "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400";
    }
    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${typeClasses} ${className} ${disabledClasses}`}
        disabled={disabled}
      >
        {Icon && <Icon size={16} />}
        {children}
      </button>
    );
  };

  const CollapsiblePanel = ({
    header,
    children,
    panelKey,
    className = "",
    defaultOpen = false,
    controlledActivePanel,
    setControlledActivePanel,
  }) => {
    const isControlled =
      controlledActivePanel !== undefined &&
      setControlledActivePanel !== undefined;
    const [isOpenInternal, setIsOpenInternal] = useState(defaultOpen);

    const togglePanel = () => {
      if (isControlled) {
        setControlledActivePanel(
          controlledActivePanel === panelKey ? null : panelKey
        );
      } else {
        setIsOpenInternal(!isOpenInternal);
      }
    };

    const isOpen = isControlled
      ? controlledActivePanel === panelKey
      : isOpenInternal;

    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
      >
        <button
          className="flex justify-between items-center w-full px-4 py-3 text-left font-semibold text-gray-700 hover:bg-gray-50 rounded-t-lg"
          onClick={togglePanel}
        >
          <div className="flex items-center gap-2">{header}</div>
          <ChevronRight
            className={`transition-transform duration-200 ${
              isOpen ? "rotate-90" : "rotate-0"
            }`}
            size={20}
          />
        </button>
        {isOpen && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            {children}
          </div>
        )}
      </div>
    );
  };

  const BulletPointList = ({ data, emptyMessage }) =>
    data && data.length > 0 ? (
      <ul className="list-none p-0 m-0">
        {data.map((item, index) => (
          <li
            key={index}
            className="py-1.5 flex items-start text-sm text-gray-800"
          >
            <span className="mr-2 text-blue-600 font-bold">•</span>
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-gray-500 italic">{emptyMessage}</p>
    );

  const [activeInnerPanel, setActiveInnerPanel] = useState(null);

  return (
    <div>
      <CollapsiblePanel
        header={
          <span className="flex items-center gap-2">
            <FileText className="text-blue-600" size={18} />
            <span className="text-lg font-semibold text-blue-600">
              PRD Summary
            </span>
          </span>
        }
        panelKey="prd"
        controlledActivePanel={activePanel}
        setControlledActivePanel={setActivePanel}
        className="mb-4"
        defaultOpen={activePanel === "prd"}
      >
        <div className="space-y-3">
          {renderButton({
            type: "dashed",
            icon: Download,
            onClick: () =>
              handleDownloadFile(
                prdDownloadableSummary,
                `PRD_Summary_${prdFileName || "document"}`,
                "txt"
              ),
            disabled: !prdDownloadableSummary,
            className: "w-full",
            children: "Download PRD Summary (.txt)",
          })}

          <CollapsiblePanel
            header={
              <span className="flex items-center gap-2">
                <FileText className="text-blue-600" size={16} />
                <span className="font-semibold text-sm">
                  Overview of Summary
                </span>
              </span>
            }
            panelKey="overview"
            controlledActivePanel={activeInnerPanel}
            setControlledActivePanel={setActiveInnerPanel}
          >
            <BulletPointList
              data={prdSummaryData?.bulletPoints}
              emptyMessage="No overview points available."
            />
          </CollapsiblePanel>

          <CollapsiblePanel
            header={
              <span className="flex items-center gap-2">
                <Star className="text-yellow-500" size={16} />
                <span className="font-semibold text-sm">Key Features</span>
              </span>
            }
            panelKey="features"
            controlledActivePanel={activeInnerPanel}
            setControlledActivePanel={setActiveInnerPanel}
          >
            <BulletPointList
              data={prdSummaryData?.keyFeatures}
              emptyMessage="No key features available."
            />
          </CollapsiblePanel>

          <CollapsiblePanel
            header={
              <span className="flex items-center gap-2">
                <BarChart className="text-green-500" size={16} />
                <span className="font-semibold text-sm">Success Metrics</span>
              </span>
            }
            panelKey="metrics"
            controlledActivePanel={activeInnerPanel}
            setControlledActivePanel={setActiveInnerPanel}
          >
            <BulletPointList
              data={prdSummaryData?.successMetrics}
              emptyMessage="No success metrics available."
            />
          </CollapsiblePanel>

          <CollapsiblePanel
            header={
              <span className="flex items-center gap-2">
                <Code className="text-purple-600" size={16} />
                <span className="font-semibold text-sm">
                  Technical Requirements
                </span>
              </span>
            }
            panelKey="tech"
            controlledActivePanel={activeInnerPanel}
            setControlledActivePanel={setActiveInnerPanel}
          >
            <BulletPointList
              data={prdSummaryData?.technicalRequirements}
              emptyMessage="No technical requirements available."
            />
          </CollapsiblePanel>
        </div>
      </CollapsiblePanel>
    </div>
  );
};

export default PRDSummaryColumn;
