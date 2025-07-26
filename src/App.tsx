import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { Dashboard } from './pages/Dashboard';
import { GoalHistory } from './pages/GoalHistory';
import { Entries } from './pages/Entries';

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/goals" element={<GoalHistory />} />
          <Route path="/entries" element={<Entries />} />
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
