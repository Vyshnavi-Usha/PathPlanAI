export const getQuarterDates = (quarterString) => {
  if (!quarterString) {
    return { startDate: null, endDate: null };
  }

  const match = quarterString.match(/Q(\d)\s*(\d{4})/i);
  if (!match) {
    return { startDate: null, endDate: null };
  }

  const quarterNum = parseInt(match[1]);
  const year = parseInt(match[2]);

  let startMonth;
  let endMonth;
  let endDay;

  switch (quarterNum) {
    case 1:
      startMonth = 0;
      endMonth = 2;
      endDay = 31;
      break;
    case 2:
      startMonth = 3;
      endMonth = 5;
      endDay = 30;
      break;
    case 3:
      startMonth = 6;
      endMonth = 8;
      endDay = 30;
      break;
    case 4:
      startMonth = 9;
      endMonth = 11;
      endDay = 31;
      break;
    default:
      return { startDate: null, endDate: null };
  }

  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, endMonth, endDay);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
};

export const getQuarterFromDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const month = date.getMonth();
  const year = date.getFullYear();

  let quarterNum;
  if (month >= 0 && month <= 2) quarterNum = 1;
  else if (month >= 3 && month <= 5) quarterNum = 2;
  else if (month >= 6 && month <= 8) quarterNum = 3;
  else if (month >= 9 && month <= 11) quarterNum = 4;
  else return "";

  return `Q${quarterNum} ${year}`;
};
