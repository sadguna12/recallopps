import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { CreateIncidentPage } from './pages/CreateIncidentPage';
import { ActiveIncidentsPage } from './pages/ActiveIncidentsPage';
import { IncidentDetailsPage } from './pages/IncidentDetailsPage';
import { AIAnalysisPage } from './pages/AIAnalysisPage';
import { SimilarIncidentsPage } from './pages/SimilarIncidentsPage';
import { RunbooksPage } from './pages/RunbooksPage';
import { PostmortemsPage } from './pages/PostmortemsPage';
import { MemoryExplorerPage } from './pages/MemoryExplorerPage';
import { AgentActionsPage } from './pages/AgentActionsPage';
import { ExecutionHistoryPage } from './pages/ExecutionHistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { FailureInjectorModal } from './components/simulation/FailureInjectorModal';
import { ServiceItem, Incident } from './types';
import { simulationApi, incidentApi } from './services/api';

export function App() {
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isFailureInjectorOpen, setIsFailureInjectorOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGlobalState = async () => {
    setIsRefreshing(true);
    try {
      const [svcs, incs] = await Promise.all([
        simulationApi.listServices(),
        incidentApi.list(),
      ]);
      setServices(svcs);
      setIncidents(incs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGlobalState();
    const interval = setInterval(fetchGlobalState, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectIncident = (id: string) => {
    setSelectedIncidentId(id);
    setActivePage('incident-details');
  };

  const handleIncidentCreated = (id: string) => {
    setSelectedIncidentId(id);
    setActivePage('incident-details');
    fetchGlobalState();
  };

  const handleInjectFailure = async (payload: {
    service_name: string;
    failure_type: string;
    severity?: string;
    error_rate?: number;
    latency_ms?: number;
  }) => {
    await simulationApi.injectFailure(payload);
    await fetchGlobalState();
  };

  const activeCount = incidents.filter((i) => i.status !== 'RESOLVED').length;

  return (
    <div className="flex bg-sre-dark text-slate-100 min-h-screen">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={(page) => {
          setActivePage(page);
          if (page !== 'incident-details') {
            // Keep selected incident unless switching away intentionally
          }
        }}
        activeIncidentsCount={activeCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          services={services}
          onRefresh={fetchGlobalState}
          onOpenFailureInjector={() => setIsFailureInjectorOpen(true)}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              onSelectIncident={handleSelectIncident}
              onNavigate={setActivePage}
              onOpenFailureInjector={() => setIsFailureInjectorOpen(true)}
            />
          )}

          {activePage === 'create-incident' && (
            <CreateIncidentPage onIncidentCreated={handleIncidentCreated} />
          )}

          {activePage === 'active-incidents' && (
            <ActiveIncidentsPage onSelectIncident={handleSelectIncident} />
          )}

          {activePage === 'incident-details' && selectedIncidentId && (
            <IncidentDetailsPage
              incidentId={selectedIncidentId}
              onBack={() => setActivePage('active-incidents')}
            />
          )}

          {activePage === 'ai-analysis' && (
            <AIAnalysisPage onSelectIncident={handleSelectIncident} />
          )}

          {activePage === 'similar-incidents' && (
            <SimilarIncidentsPage onSelectIncident={handleSelectIncident} />
          )}

          {activePage === 'runbooks' && <RunbooksPage />}

          {activePage === 'postmortems' && <PostmortemsPage />}

          {activePage === 'memory-explorer' && <MemoryExplorerPage />}

          {activePage === 'agent-actions' && <AgentActionsPage />}

          {activePage === 'execution-history' && <ExecutionHistoryPage />}

          {activePage === 'analytics' && <AnalyticsPage />}

          {activePage === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Failure Injector Modal */}
      <FailureInjectorModal
        services={services}
        isOpen={isFailureInjectorOpen}
        onClose={() => setIsFailureInjectorOpen(false)}
        onInject={handleInjectFailure}
      />
    </div>
  );
}

export default App;
