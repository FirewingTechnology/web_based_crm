import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { WebsiteNavbar } from './components/WebsiteNavbar';
import { WebsiteFooter } from './components/WebsiteFooter';
import { DemoModal } from './components/DemoModal';

import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { SolutionsPage } from './pages/SolutionsPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { IndustriesPage } from './pages/IndustriesPage';
import { PricingPage } from './pages/PricingPage';
import { BlogPage } from './pages/BlogPage';
import { FaqPage } from './pages/FaqPage';
import { ContactPage } from './pages/ContactPage';

export const App: React.FC = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const openDemo = () => setIsDemoModalOpen(true);

  return (
    <BrowserRouter>
      <div className="bg-[#050505] min-h-screen text-slate-100 flex flex-col justify-between selection:bg-[#C8A45D] selection:text-black">
        <WebsiteNavbar onOpenDemo={openDemo} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage onOpenDemo={openDemo} />} />
            <Route path="/about" element={<AboutPage onOpenDemo={openDemo} />} />
            <Route path="/solutions" element={<SolutionsPage onOpenDemo={openDemo} />} />
            <Route path="/features" element={<FeaturesPage onOpenDemo={openDemo} />} />
            <Route path="/industries" element={<IndustriesPage onOpenDemo={openDemo} />} />
            <Route path="/pricing" element={<PricingPage onOpenDemo={openDemo} />} />
            <Route path="/blog" element={<BlogPage onOpenDemo={openDemo} />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <WebsiteFooter />
        <AnimatePresence>
          {isDemoModalOpen && (
            <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
          )}
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
};

export default App;
