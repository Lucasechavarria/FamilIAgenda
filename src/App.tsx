import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import CreateFamilyPage from './pages/CreateFamilyPage';
import JoinFamilyPage from './pages/JoinFamilyPage';
import UserSettingsPage from './pages/UserSettingsPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-family"
              element={
                <ProtectedRoute>
                  <CreateFamilyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/join-family"
              element={
                <ProtectedRoute>
                  <JoinFamilyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-settings"
              element={
                <ProtectedRoute>
                  <UserSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;