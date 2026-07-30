import React, { useState } from 'react';
import { WebsiteNavbar } from './components/WebsiteNavbar';
import { WebsiteFooter } from './components/WebsiteFooter';
import { DemoModal } from './components/DemoModal';

export const WebsiteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div className="bg-[#050505] min-h-screen text-slate-100 flex flex-col justify-between selection:bg-[#C8A45D] selection:text-black">
      <WebsiteNavbar onOpenDemo={() => setIsDemoModalOpen(true)} />
      <main className="flex-1">
        {React.cloneElement(children as React.ReactElement, { onOpenDemo: () => setIsDemoModalOpen(true) })}
      </main>
      <WebsiteFooter />
      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </div>
  );
};
