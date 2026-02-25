
// utils/dateFormatter.ts
export const formatStandupDate = (date: Date): string => {
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  };
  const weekdayOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long'
  };

  const dateStr = date.toLocaleDateString('en-US', dateOptions);
  const weekday = date.toLocaleDateString('en-US', weekdayOptions);

  // Example output: 7/1/2026 Wednesday
  return `${dateStr} ${weekday}`;
};
