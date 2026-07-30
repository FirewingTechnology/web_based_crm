import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { RoleGuard } from './RoleGuard';

// Official Website Layout & Pages
import { WebsiteLayout } from '../website/WebsiteLayout';
import { HomePage } from '../website/pages/HomePage';
import { AboutPage } from '../website/pages/AboutPage';
import { SolutionsPage } from '../website/pages/SolutionsPage';
import { FeaturesPage } from '../website/pages/FeaturesPage';
import { IndustriesPage } from '../website/pages/IndustriesPage';
import { PricingPage } from '../website/pages/PricingPage';
import { BlogPage } from '../website/pages/BlogPage';
import { FaqPage } from '../website/pages/FaqPage';
import { ContactPage } from '../website/pages/ContactPage';

// Layouts
import { AdminLayout } from '../components/layout/AdminLayout';
import { SalesLayout } from '../components/layout/SalesLayout';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { LeadManagement } from '../pages/admin/LeadManagement';
import { FollowupManagement } from '../pages/admin/FollowupManagement';
import { BuilderManagement } from '../pages/admin/BuilderManagement';
import { ProjectManagement } from '../pages/admin/ProjectManagement';
import { BrokerManagement } from '../pages/admin/BrokerManagement';
import { SalesManagement } from '../pages/admin/SalesManagement';
import { BookingManagement } from '../pages/admin/BookingManagement';
import { CommissionManagement } from '../pages/admin/CommissionManagement';
import { ReportManagement } from '../pages/admin/ReportManagement';
import { NotificationsPage } from '../pages/admin/NotificationsPage';
import { SettingsPage } from '../pages/admin/SettingsPage';

// Sales Portal Pages
import { SalesDashboard } from '../pages/sales/SalesDashboard';
import { MyLeads } from '../pages/sales/MyLeads';
import { MyFollowups } from '../pages/sales/MyFollowups';
import { MyBookings } from '../pages/sales/MyBookings';
import { ProjectsCatalog } from '../pages/sales/ProjectsCatalog';
import { BuildersCatalog } from '../pages/sales/BuildersCatalog';
import { MyCommission } from '../pages/sales/MyCommission';
import { MyProfile } from '../pages/sales/MyProfile';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Official Company Website Multi-Page Routes */}
        <Route path="/" element={<WebsiteLayout><HomePage onOpenDemo={() => {}} /></WebsiteLayout>} />
        <Route path="/about" element={<WebsiteLayout><AboutPage onOpenDemo={() => {}} /></WebsiteLayout>} />
        <Route path="/solutions" element={<WebsiteLayout><SolutionsPage onOpenDemo={() => {}} /></WebsiteLayout>} />
        <Route path="/features" element={<WebsiteLayout><FeaturesPage onOpenDemo={() => {}} /></WebsiteLayout>} />
        <Route path="/industries" element={<WebsiteLayout><IndustriesPage onOpenDemo={() => {}} /></WebsiteLayout>} />
        <Route path="/pricing" element={<WebsiteLayout><PricingPage onOpenDemo={() => {}} /></WebsiteLayout>} />
        <Route path="/blog" element={<WebsiteLayout><BlogPage onOpenDemo={() => {}} /></WebsiteLayout>} />
        <Route path="/faq" element={<WebsiteLayout><FaqPage /></WebsiteLayout>} />
        <Route path="/contact" element={<WebsiteLayout><ContactPage /></WebsiteLayout>} />

        <Route path="/login" element={<LoginPage />} />

        {/* Admin Portal Routes */}
        <Route element={<RoleGuard allowedRoles={['Admin', 'Manager']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/leads" element={<LeadManagement />} />
            <Route path="/admin/followups" element={<FollowupManagement />} />
            <Route path="/admin/bookings" element={<BookingManagement />} />
            <Route path="/admin/commissions" element={<CommissionManagement />} />
            <Route path="/admin/projects" element={<ProjectManagement />} />
            <Route path="/admin/builders" element={<BuilderManagement />} />
            <Route path="/admin/brokers" element={<BrokerManagement />} />
            <Route path="/admin/sales" element={<SalesManagement />} />
            <Route path="/admin/reports" element={<ReportManagement />} />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Sales Portal Routes */}
        <Route element={<RoleGuard allowedRoles={['Sales Executive', 'Broker', 'Manager', 'Admin']} />}>
          <Route element={<SalesLayout />}>
            <Route path="/sales/dashboard" element={<SalesDashboard />} />
            <Route path="/sales/leads" element={<MyLeads />} />
            <Route path="/sales/followups" element={<MyFollowups />} />
            <Route path="/sales/bookings" element={<MyBookings />} />
            <Route path="/sales/projects" element={<ProjectsCatalog />} />
            <Route path="/sales/builders" element={<BuildersCatalog />} />
            <Route path="/sales/commissions" element={<MyCommission />} />
            <Route path="/sales/profile" element={<MyProfile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
