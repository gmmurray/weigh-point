import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { Dashboard } from './pages/Dashboard';
import { GoalHistory } from './pages/GoalHistory';

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/goals" element={<GoalHistory />} />
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
