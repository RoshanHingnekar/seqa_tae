import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { EstimatorPage } from './pages/EstimatorPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { TestManagementPage } from './pages/TestManagementPage';
import { ReportsPage } from './pages/ReportsPage';
import { TeamPage } from './pages/TeamPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NewProjectModal } from './components/modals/NewProjectModal';

const MainApp: React.FC = () => {
  const { user, token, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [pageParams, setPageParams] = useState<any>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);

  // Handle navigation
  const handleNavigate = (page: string, data?: any) => {
    setCurrentPage(page);
    if (data) setPageParams(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading QAEstimator Pro...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!token || !user) {
    if (currentPage === 'signup') {
      return <SignUpPage onNavigate={handleNavigate} />;
    }
    return <LoginPage onNavigate={handleNavigate} />;
  }

  // Render current authenticated page inside AppShell
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            onOpenNewProject={() => setShowNewProjectModal(true)}
          />
        );
      case 'estimator':
        return <EstimatorPage onNavigate={handleNavigate} />;
      case 'projects':
        return (
          <ProjectsPage
            onNavigate={handleNavigate}
            onOpenNewProject={() => setShowNewProjectModal(true)}
          />
        );
      case 'project-details':
        return <ProjectDetailsPage projectId={pageParams?.projectId} onNavigate={handleNavigate} />;
      case 'test-management':
        return <TestManagementPage onNavigate={handleNavigate} />;
      case 'reports':
        return <ReportsPage />;
      case 'team':
        return <TeamPage />;
      case 'history':
        return <HistoryPage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            onOpenNewProject={() => setShowNewProjectModal(true)}
          />
        );
    }
  };

  return (
    <ProjectProvider>
      <AppShell
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenNewProject={() => setShowNewProjectModal(true)}
      >
        {renderCurrentPage()}
      </AppShell>

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreated={() => {
          handleNavigate('projects');
        }}
      />
    </ProjectProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
