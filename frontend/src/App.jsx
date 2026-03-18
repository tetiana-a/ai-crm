import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { LanguageProvider } from './context/LanguageContext';
import AppShell from './layout/AppShell';
import AiAssistantPage from './pages/AiAssistantPage';
import AppointmentsPage from './pages/AppointmentsPage';
import ClientsPage from './pages/ClientsPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import PaymentsPage from './pages/PaymentsPage';
import RegisterPage from './pages/RegisterPage';
import "./auth.css";

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><AppShell><ClientsPage /></AppShell></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute><AppShell><AppointmentsPage /></AppShell></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><AppShell><PaymentsPage /></AppShell></ProtectedRoute>} />
          <Route path="/ai-assistant" element={<ProtectedRoute><AppShell><AiAssistantPage /></AppShell></ProtectedRoute>} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
