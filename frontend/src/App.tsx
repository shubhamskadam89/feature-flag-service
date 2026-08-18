import { useEffect } from 'react';
import { Routes, Route, useLocation, matchPath } from 'react-router-dom';
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
const pageTitles: { pattern: string; title: string }[] = [
  { pattern: "/",                              title: "Feature Flag Service - Deterministic Feature Toggles with Consent-Driven Targeting" },
  { pattern: "/login",                         title: "Login | Feature Flag Service" },
  { pattern: "/register",                      title: "Register | Feature Flag Service" },
  { pattern: "/dashboard",                     title: "Release Console | Feature Flag Service" },
  { pattern: "/projects/:projectId/flags",     title: "Feature Flags | Release Console | Feature Flag Service" },
  { pattern: "/projects/:projectId/environments", title: "Environments | Release Console | Feature Flag Service" },
  { pattern: "/projects/:projectId/audit-logs",   title: "Audit Logs | Release Console | Feature Flag Service" },
  { pattern: "/projects/:projectId/settings",     title: "Settings | Release Console | Feature Flag Service" },
];

function getTitleForPath(pathname: string): string {
  const match = pageTitles.find(({ pattern }) =>
    matchPath({ path: pattern, end: true }, pathname)
  );
  return match?.title ?? "Feature Flag Service";
}

export function App() {
  const location = useLocation();
  useEffect(() => {
    document.title = getTitleForPath(location.pathname);
  }, [location.pathname]);

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
