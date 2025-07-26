import { Button } from '../components/ui';
import { EntryList } from '../components/EntryList';
import { Link } from 'react-router-dom';

export const Entries = () => {
  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header with navigation */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-base-content">
              All Entries
            </h1>
            <p className="text-base-content/70 mt-1">
              Your complete weight tracking history
            </p>
          </div>
          <Link to="/">
            <Button variant="ghost" size="sm">
              ← Dashboard
            </Button>
          </Link>
        </div>

        {/* Full entry list without limit */}
        <EntryList />
      </div>
    </div>
  );
};
