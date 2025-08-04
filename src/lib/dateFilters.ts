/**
 * Date filtering utilities for entries page.
 *
 * Provides preset time periods for simple, user-friendly filtering
 * without complex date range pickers.
 */

export type DateFilterOption = {
  label: string;
  value: string;
  dateFrom?: string;
  dateTo?: string;
};

/**
 * Generates date filter options with preset time periods.
 *
 * @returns Array of filter options with calculated date ranges
 */
export const getDateFilterOptions = (): DateFilterOption[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Helper to format date as ISO string for database queries
  const formatDate = (date: Date): string => {
    return date.toISOString();
  };

  return [
    {
      label: 'All Time',
      value: 'all',
      // No date filters - show all entries
    },
    {
      label: 'Last 7 Days',
      value: '7days',
      dateFrom: formatDate(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)),
      dateTo: formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)), // End of today
    },
    {
      label: 'Last 30 Days',
      value: '30days',
      dateFrom: formatDate(
        new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
      ),
      dateTo: formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)),
    },
    {
      label: 'Last 3 Months',
      value: '3months',
      dateFrom: formatDate(
        new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()),
      ),
      dateTo: formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)),
    },
    {
      label: 'This Year',
      value: 'year',
      dateFrom: formatDate(new Date(today.getFullYear(), 0, 1)), // January 1st
      dateTo: formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)),
    },
  ];
};

/**
 * Gets the default filter option (All Time).
 */
export const getDefaultDateFilter = (): DateFilterOption => {
  return getDateFilterOptions()[0]; // 'All Time'
};

/**
 * Finds a date filter option by its value.
 */
export const findDateFilterByValue = (
  value: string,
): DateFilterOption | undefined => {
  return getDateFilterOptions().find(option => option.value === value);
};
