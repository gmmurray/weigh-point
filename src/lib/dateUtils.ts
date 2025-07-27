// Native date formatting utilities to replace date-fns
// Saves ~20kb from bundle size

export const formatDate = {
  // MMM d (e.g., "Jan 5")
  shortDate: (date: string | Date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),

  // MMM d, yyyy (e.g., "Jan 5, 2024")
  mediumDate: (date: string | Date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),

  // MMM d, yyyy h:mm a (e.g., "Jan 5, 2024 2:30 PM")
  dateTime: (date: string | Date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),

  // yyyy-MM-dd (e.g., "2024-01-05") for form inputs
  inputDate: (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // h:mm a (e.g., "2:30 PM") for time-only display
  timeOnly: (date: string | Date) =>
    new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
};

// Calculate difference in days between two dates
export const getDaysDifference = (
  startDate: string | Date,
  endDate: string | Date,
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
