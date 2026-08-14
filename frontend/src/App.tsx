import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProjectListPage } from './pages/projects/ProjectListPage';
import { ProjectSettingsPage } from './pages/projects/ProjectSettingsPage';
import { FeatureFlagListPage } from './pages/flags/FeatureFlagListPage';
import { EnvironmentListPage } from './pages/environments/EnvironmentListPage';
import { AuditLogListPage } from './pages/audit/AuditLogListPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardLayout activeTab="projects">
              <ProjectListPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects/:projectId/flags" 
        element={
          <ProtectedRoute>
            <DashboardLayout activeTab="flags">
              <FeatureFlagListPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects/:projectId/environments" 
        element={
          <ProtectedRoute>
            <DashboardLayout activeTab="environments">
              <EnvironmentListPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects/:projectId/audit-logs" 
        element={
          <ProtectedRoute>
            <DashboardLayout activeTab="audit">
              <AuditLogListPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects/:projectId/settings" 
        element={
          <ProtectedRoute>
            <DashboardLayout activeTab="settings">
              <ProjectSettingsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
