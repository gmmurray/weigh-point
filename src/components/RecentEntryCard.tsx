import { Card } from './ui';
import { formatDate } from '../lib/dateUtils';
import { useAuth } from '../hooks/useAuth';
import { useEntries } from '../hooks/useEntries';

export const RecentEntryCard = () => {
  const { profile } = useAuth();
  const { data: entries, isLoading } = useEntries(1);

  const unit = profile?.preferred_unit || 'lbs';
  const latestEntry = entries?.[0];

  if (isLoading) {
    return (
      <Card>
        <div className="flex flex-col justify-center h-full">
          <div className="skeleton h-8 w-16 mb-1" />
          <div className="skeleton h-4 w-20" />
        </div>
      </Card>
    );
  }

  if (!latestEntry) {
    return (
      <Card>
        <div className="flex flex-col justify-center h-full">
          <div className="text-2xl font-bold text-base-content/50 mb-1">--</div>
          <div className="text-xs text-base-content/70">No entries yet</div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col justify-center h-full">
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-2xl font-bold text-primary">
            {latestEntry.weight}
          </span>
          <span className="text-sm text-base-content/70">{unit}</span>
        </div>
        <div className="text-xs text-base-content/70">Latest Entry</div>
        <div className="text-xs text-base-content/60 mt-1">
          {formatDate.mediumDate(latestEntry.recorded_at)}
        </div>
      </div>
    </Card>
  );
};
