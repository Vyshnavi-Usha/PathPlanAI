import React, { useState } from "react";
import { Download, ChevronRight, Tag, Lightbulb } from "lucide-react";

const FEEDBACK_CATEGORIES = [
  "Features",
  "Usability",
  "Bugs",
  "Performance",
  "Support",
  "Praise",
  "Pricing",
  "Content",
  "Security",
  "Improvements",
  "Accessibility",
  "Stability",
  "Design",
  "Reliability",
];

const FeedbackAnalyticsColumn = ({
  feedbackFileName,
  feedbackAnalyticsData,
  feedbackDownloadableSummary,
  handleDownloadFile,
  activePanel,
  setActivePanel,
}) => {
  const total = feedbackAnalyticsData?.total || 0;
  const positive = feedbackAnalyticsData?.positive || 0;
  const negative = feedbackAnalyticsData?.negative || 0;
  const neutral = feedbackAnalyticsData?.neutral || 0;

  const calculatePercentage = (count, total) =>
    total > 0 ? Math.round((count / total) * 100) : 0;

  const positivePercentage = calculatePercentage(positive, total);
  const negativePercentage = calculatePercentage(negative, total);
  const neutralPercentage = calculatePercentage(neutral, total);

  const combinedSummaries = [];
  if (feedbackAnalyticsData?.summaries) {
    const {
      positive: pos,
      negative: neg,
      neutral: neu,
    } = feedbackAnalyticsData.summaries;
    if (Array.isArray(pos)) combinedSummaries.push(...pos);
    if (Array.isArray(neg)) combinedSummaries.push(...neg);
    if (Array.isArray(neu)) combinedSummaries.push(...neu);
  }

  const categoryCountsObj = feedbackAnalyticsData?.categoryCounts || {};
  const categoriesWithCounts = FEEDBACK_CATEGORIES.map((cat) => ({
    name: cat,
    count: categoryCountsObj[cat] || 0,
  })).filter(({ count }) => count > 0);

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

  const [activeInnerPanel, setActiveInnerPanel] = useState(null);

  return (
    <div>
      <CollapsiblePanel
        header={
          <span className="flex items-center gap-2">
            <Tag className="text-blue-600" size={18} />
            <span className="text-lg font-semibold text-blue-600">
              Feedback Analytics
            </span>
          </span>
        }
        panelKey="feedback"
        controlledActivePanel={activePanel}
        setControlledActivePanel={setActivePanel}
        defaultOpen={activePanel === "feedback"}
      >
        <div className="space-y-3">
          {renderButton({
            type: "dashed",
            icon: Download,
            onClick: () =>
              handleDownloadFile(
                feedbackDownloadableSummary,
                `Feedback_Summary_${feedbackFileName || "document"}`,
                "txt"
              ),
            disabled: !feedbackDownloadableSummary,
            className: "w-full",
            children: "Download Feedback Summary (.txt)",
          })}

          <div className="text-center bg-gray-50 p-4 rounded-md border border-gray-200">
            <h5 className="text-base font-semibold mb-1 text-gray-700">
              Total Feedbacks
            </h5>
            <h2 className="text-3xl font-bold text-blue-600 m-0">{total}</h2>
          </div>

          <CollapsiblePanel
            header={
              <span className="font-semibold text-sm">Sentiment Breakdown</span>
            }
            panelKey="sentiment"
            controlledActivePanel={activeInnerPanel}
            setControlledActivePanel={setActiveInnerPanel}
          >
            <div className="mb-4">
              <p className="font-semibold text-green-600 mb-1">
                Positive 👍 {positive} ({positivePercentage}%)
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{ width: `${positivePercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-semibold text-red-600 mb-1">
                Negative 👎 {negative} ({negativePercentage}%)
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                <div
                  className="bg-red-500 h-1.5 rounded-full"
                  style={{ width: `${negativePercentage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <p className="font-semibold text-orange-600 mb-1">
                Neutral 😐 {neutral} ({neutralPercentage}%)
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                <div
                  className="bg-orange-500 h-1.5 rounded-full"
                  style={{ width: `${neutralPercentage}%` }}
                ></div>
              </div>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel
            header={
              <span className="flex items-center gap-2">
                <Lightbulb className="text-blue-600" size={16} />
                <span className="font-semibold">Key Insights</span>
              </span>
            }
            panelKey="insights"
            controlledActivePanel={activeInnerPanel}
            setControlledActivePanel={setActiveInnerPanel}
          >
            {combinedSummaries.length > 0 ? (
              <ul className="list-none p-0 m-0">
                {combinedSummaries.map((item, index) => (
                  <li key={index} className="py-1.5 text-gray-800">
                    <span className="mr-2 text-blue-600 font-bold">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No insights available.
              </p>
            )}
          </CollapsiblePanel>

          <CollapsiblePanel
            header={
              <span className="flex items-center gap-2">
                <Tag className="text-blue-600" size={16} />
                <span className="font-semibold">Feedback Categories</span>
              </span>
            }
            panelKey="categories"
            controlledActivePanel={activeInnerPanel}
            setControlledActivePanel={setActiveInnerPanel}
          >
            {categoriesWithCounts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categoriesWithCounts.map(({ name, count }) => (
                  <div
                    key={name}
                    className="bg-gray-100 px-2.5 py-1 rounded-full text-sm text-gray-700 cursor-default select-none border border-gray-300"
                  >
                    {name} ({count})
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No categories available.
              </p>
            )}
          </CollapsiblePanel>
        </div>
      </CollapsiblePanel>
    </div>
  );
};

export default FeedbackAnalyticsColumn;
