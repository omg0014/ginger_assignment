import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import VerifyImage from './pages/VerifyImage';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Architecture from './pages/Architecture';

const queryClient = new QueryClient();

function SidebarItem({ label, path }: { label: string, path: string }) {
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <Link
      to={path}
      className={`nav-item ${isActive ? 'active' : ''}`}
    >
      <div className="nav-dot" />
      <span>{label}</span>
    </Link>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-label">navigation</div>
        <SidebarItem label="dashboard" path="/" />
        <SidebarItem label="verify image" path="/verify-image" />
        <SidebarItem label="history" path="/history" />
        <SidebarItem label="analytics" path="/analytics" />
        <SidebarItem label="architecture" path="/architecture" />

        <div className="mt-auto pt-8 border-t border-gray-100">
          <div className="flex items-center gap-2 font-body text-[10px] text-muted uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            system: active
          </div>
          <div className="font-body text-[10px] text-muted uppercase mt-1">node: vs_alpha_01</div>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/verify-image" element={<VerifyImage />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/architecture" element={<Architecture />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
