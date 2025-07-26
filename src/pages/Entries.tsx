import { AppHeader } from '../components/AppHeader';
import { EntryList } from '../components/EntryList';

export const Entries = () => {
  return (
    <div className="min-h-screen bg-base-100">
      <AppHeader
        title="All Entries"
        showAddEntry
        showBackButton
        backTo="/"
        backText="Dashboard"
      />

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Full entry list without limit */}
        <EntryList />
      </div>
    </div>
  );
};
