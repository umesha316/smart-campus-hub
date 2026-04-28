import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const AppLayout = () => {
  // Desktop: default open (true), Mobile: default closed (false)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  return (
    <div className={`app-layout${sidebarOpen ? ' sidebar-visible' : ' sidebar-hidden'}`}>
      {/* Mobile overlay - only shows on mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} sidebarOpen={sidebarOpen} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
