import { Layout } from '../components/Layout';
import { EntryList } from '../components/EntryList';

const Entries = () => {
  return (
    <Layout showAddEntry>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold">All Entries</h2>
      </div>

      {/* Full entry list without limit */}
      <EntryList />
    </Layout>
  );
};

export default Entries;
export { Entries }; // Keep named export for compatibility
