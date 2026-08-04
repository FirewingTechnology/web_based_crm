import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ReminderManager } from '../reminders/ReminderManager';
import { DemoBanner } from '../DemoBanner';

export const SalesLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <DemoBanner />
      <div className="flex flex-1">
        <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
        <div className="flex-1 md:ml-64 flex flex-col min-w-0">
          <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <main className="p-4 sm:p-6 flex-1 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <ReminderManager />
    </div>
  );
};
