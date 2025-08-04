import { Card } from './ui';
import { useEntries } from '../hooks/useEntries';

export const SummaryStatsCard = () => {
  const { data, isLoading } = useEntries();

  if (isLoading) {
    return (
      <Card>
        <div className="grid grid-cols-2 gap-4 h-full">
          <div className="flex flex-col justify-center">
            <div className="skeleton h-8 w-12 mb-1" />
            <div className="skeleton h-3 w-16" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="skeleton h-8 w-12 mb-1" />
            <div className="skeleton h-3 w-16" />
          </div>
        </div>
      </Card>
    );
  }

  const entries = data?.entries || [];
  const totalEntries = entries.length;

  // Calculate days tracked (unique dates)
  const uniqueDates = new Set(
    entries.map(entry => entry.recorded_at.split('T')[0]),
  );
  const daysTracked = uniqueDates.size;

  return (
    <Card>
      <div className="grid grid-cols-2 gap-4 h-full">
        <div className="flex flex-col justify-center">
          <div className="text-2xl font-bold text-primary mb-1">
            {totalEntries}
          </div>
          <div className="text-xs text-base-content/70">Total Entries</div>
        </div>
        <div className="flex flex-col justify-center">
          <div className="text-2xl font-bold text-secondary mb-1">
            {daysTracked}
          </div>
          <div className="text-xs text-base-content/70">Days Tracked</div>
        </div>
      </div>
    </Card>
  );
};
