
// utils/dateFormatter.ts
export const formatStandupDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    weekday: 'long'
  };
  // Example output: 7/1/2026 Wednesday
  return date.toLocaleDateString('en-US', options);
};
