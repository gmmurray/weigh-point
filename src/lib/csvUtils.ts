import type { Entry, Goal, Profile } from '../types';
import { formatDate } from './dateUtils';

/**
 * CSV export utilities for user data portability and backup.
 *
 * Business Context: Users need ability to export their weight tracking data
 * for backup, analysis in external tools, or migration to other platforms.
 * Critical for data ownership and preventing vendor lock-in.
 *
 * Technical Approach: Generate standard CSV format compatible with Excel
 * and other spreadsheet applications. Handle edge cases like commas in data.
 */

/**
 * Escapes CSV field values to handle commas, quotes, and newlines.
 *
 * @param value - Raw field value that may contain special characters
 * @returns Properly escaped CSV field value
 */
const escapeCsvField = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';

  const stringValue = String(value);

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * Converts array of objects to CSV string with proper headers and formatting.
 *
 * @param data - Array of objects to convert to CSV
 * @param headers - Column headers and field mappings
 * @returns CSV string ready for download
 */
const arrayToCsv = <T>(
  data: T[],
  headers: { label: string; key: keyof T | ((item: T) => string | number) }[],
): string => {
  // Create header row
  const headerRow = headers.map(h => escapeCsvField(h.label)).join(',');

  // Create data rows
  const dataRows = data.map(item => {
    return headers
      .map(header => {
        const value =
          typeof header.key === 'function'
            ? header.key(item)
            : item[header.key];
        return escapeCsvField(value as string | number | null | undefined);
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Generates CSV export for weight entries with user-friendly formatting.
 *
 * Business Context: Weight entries are the core data users want to backup.
 * Format is designed for easy import into fitness apps and spreadsheets.
 *
 * @param entries - User's weight entries to export
 * @param profile - User profile for unit preferences
 * @returns CSV string with weight entry data
 */
export const generateEntriesCsv = (
  entries: Entry[],
  profile: Profile,
): string => {
  const headers = [
    {
      label: 'Date',
      key: (entry: Entry) => formatDate.shortDate(entry.recorded_at),
    },
    {
      label: 'Time',
      key: (entry: Entry) => formatDate.timeOnly(entry.recorded_at),
    },
    {
      label: `Weight (${profile.preferred_unit})`,
      key: 'weight' as keyof Entry,
    },
    { label: 'Entry ID', key: 'id' as keyof Entry },
    {
      label: 'Created Date',
      key: (entry: Entry) => formatDate.shortDate(entry.created_at),
    },
  ];

  // Sort entries by date (oldest first) for chronological export
  const sortedEntries = [...entries].sort(
    (a, b) =>
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );

  return arrayToCsv(sortedEntries, headers);
};

/**
 * Generates CSV export for completed goals with achievement details.
 *
 * Business Context: Goal achievements represent major milestones in user's
 * fitness journey. Export preserves celebration timeline and progress metrics.
 *
 * @param goals - User's completed goals to export
 * @param profile - User profile for unit preferences
 * @returns CSV string with goal achievement data
 */
export const generateGoalsCsv = (goals: Goal[], profile: Profile): string => {
  const headers = [
    {
      label: 'Goal Created',
      key: (goal: Goal) => formatDate.shortDate(goal.created_at),
    },
    {
      label: 'Goal Completed',
      key: (goal: Goal) =>
        goal.completed_at
          ? formatDate.shortDate(goal.completed_at)
          : 'Not Completed',
    },
    {
      label: `Start Weight (${profile.preferred_unit})`,
      key: 'start_weight' as keyof Goal,
    },
    {
      label: `Target Weight (${profile.preferred_unit})`,
      key: 'target_weight' as keyof Goal,
    },
    {
      label: 'Target Date',
      key: (goal: Goal) =>
        goal.target_date
          ? formatDate.shortDate(goal.target_date)
          : 'No Target Date',
    },
    { label: 'Status', key: 'status' as keyof Goal },
    { label: 'Goal ID', key: 'id' as keyof Goal },
    {
      label: 'Progress Made',
      key: (goal: Goal) => {
        const progress = Math.abs(goal.target_weight - goal.start_weight);
        return `${progress.toFixed(1)} ${profile.preferred_unit}`;
      },
    },
    {
      label: 'Goal Type',
      key: (goal: Goal) =>
        goal.start_weight > goal.target_weight ? 'Weight Loss' : 'Weight Gain',
    },
  ];

  // Sort goals by completion date (most recent first) to show latest achievements
  const sortedGoals = [...goals].sort((a, b) => {
    if (!a.completed_at) return 1;
    if (!b.completed_at) return -1;
    return (
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
  });

  return arrayToCsv(sortedGoals, headers);
};

/**
 * Triggers browser download of CSV file with proper MIME type and filename.
 *
 * User Experience: Uses standard browser download API to save file to user's
 * default download location. Filename includes timestamp for organization.
 *
 * @param csvContent - CSV string content to download
 * @param filename - Base filename (timestamp will be added automatically)
 */
export const downloadCsv = (csvContent: string, filename: string): void => {
  // Add UTF-8 BOM for proper Excel compatibility with special characters
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  // Create download link with timestamp in filename
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const fullFilename = `${filename}_${timestamp}.csv`;

  // Trigger download using browser download API
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fullFilename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up object URL to prevent memory leaks
  URL.revokeObjectURL(url);
};
