import { AppHeader } from '../components/AppHeader';
import { EntryList } from '../components/EntryList';

const Entries = () => {
  return (
    <div className="min-h-screen bg-base-100">
      <AppHeader showAddEntry />

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold">All Entries</h2>
        </div>

        {/* Full entry list without limit */}
        <EntryList />
      </div>
    </div>
  );
};

export default Entries;
export { Entries }; // Keep named export for compatibility
