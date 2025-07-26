import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { QueryProvider } from './providers/QueryProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { GuestStart } from './pages/GuestStart';

// Lazy load non-critical pages
const SignIn = lazy(() => import('./pages/SignIn'));
const SignUp = lazy(() => import('./pages/SignUp'));
const GoalHistory = lazy(() => import('./pages/GoalHistory'));
const Entries = lazy(() => import('./pages/Entries'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            <Route path="/guest" element={<GuestStart />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/goals"
              element={
                <ProtectedRoute>
                  <GoalHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/entries"
              element={
                <ProtectedRoute>
                  <Entries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            {/* Redirect old dashboard route */}
            <Route path="/app" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
