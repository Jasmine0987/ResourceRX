import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// --- COMPONENTS ---
import ClinicSideBar from './components/ClinicSideBar';
import LogisticsSideBar from './components/LogisticsSideBar';
import OwnerSideBar from './components/OwnerSideBar';
import TechnicianSideBar from './components/TechnicianSideBar';

// --- CONTEXT ---
import { ClinicProvider } from './context/ClinicContext';

// --- PAGES ---
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

import ClinicDashboard    from './pages/Clinic/ClinicDashboard';
import ClinicBooking      from './pages/Clinic/ClinicBooking';
import ClinicCompletion   from './pages/Clinic/ClinicCompletion';
import ClinicEmergency    from './pages/Clinic/ClinicEmergency';
import ClinicFeedback     from './pages/Clinic/ClinicFeedback';
import ClinicPayment      from './pages/Clinic/ClinicPayment';
import ClinicRegistration from './pages/Clinic/ClinicRegistration';
import ClinicSearch       from './pages/Clinic/ClinicSearch';
import ClinicTracking     from './pages/Clinic/ClinicTracking';

import LogisticsDashboard from './pages/Logistics/LogisticsDashboard';
import LogisticsActive    from './pages/Logistics/LogisticsActive';
import LogisticsIncident  from './pages/Logistics/LogisticsIncident';
import LogisticsLogs      from './pages/Logistics/LogisticsLogs';
import LogisticsMap       from './pages/Logistics/LogisticsMap';
import LogisticsSettings  from './pages/Logistics/LogisticsSettings';

import OwnerDashboard    from './pages/Owner/OwnerDashboard';
import OwnerAdd          from './pages/Owner/OwnerAdd';
import OwnerAnalytics    from './pages/Owner/OwnerAnalytics';
import OwnerDispatch     from './pages/Owner/OwnerDispatch';
import OwnerRequests     from './pages/Owner/OwnerRequests';
import OwnerSettlements  from './pages/Owner/OwnerSettlements';
import OwnerVault        from './pages/Owner/OwnerVault';
import OwnerYield        from './pages/Owner/OwnerYield';

import TechDashboard     from './pages/Technician/TechDashboard';
import TechCalibration   from './pages/Technician/TechCalibration';
import TechDiagnostics   from './pages/Technician/TechDiagnostics';
import TechIncidents     from './pages/Technician/TechIncidents';
import TechInventory     from './pages/Technician/TechInventory';
import TechLibrary       from './pages/Technician/TechLibrary';
import TechPrep          from './pages/Technician/TechPrep';
import TechServiceOrders from './pages/Technician/TechServiceOrders';

import './index.css';
import './App.css';

// ── Layout wrapper ────────────────────────────────────────────────────────────
const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  const isLanding = path === '/';
  const isAuth    = path === '/login' || path === '/clinic/register';

  const isClinic    = path.startsWith('/clinic');
  const isOwner     = path.startsWith('/owner');
  const isTech      = path.startsWith('/tech');
  const isLogistics = path.startsWith('/logistics');

  const noSidebar = isLanding || isAuth;

  return (
    <div className="relative min-h-screen flex text-primary overflow-x-hidden">
      <div className="bg-mesh" />

      {!noSidebar && (
        <div className="fixed h-screen z-50">
          {isClinic    && <ClinicSideBar />}
          {isOwner     && <OwnerSideBar />}
          {isTech      && <TechnicianSideBar />}
          {isLogistics && <LogisticsSideBar />}
        </div>
      )}

      <main className={`flex-1 transition-all duration-500 ${noSidebar ? 'w-full' : 'lg:pl-72'}`}>
        <div className={noSidebar ? '' : 'p-4 md:p-8 lg:p-12'}>
          {children}
        </div>
      </main>
    </div>
  );
};

// ── Routes ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/"      element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* ── CLINIC PORTAL ── */}
      <Route path="/clinic"            element={<ClinicDashboard />} />
      <Route path="/clinic/dashboard"  element={<ClinicDashboard />} />
      <Route path="/clinic/search"     element={<ClinicSearch />} />
      <Route path="/clinic/booking"    element={<ClinicBooking />} />
      <Route path="/clinic/tracking"   element={<ClinicTracking />} />
      <Route path="/clinic/payment"    element={<ClinicPayment />} />
      <Route path="/clinic/completion" element={<ClinicCompletion />} />
      <Route path="/clinic/emergency"  element={<ClinicEmergency />} />
      <Route path="/clinic/feedback"   element={<ClinicFeedback />} />
      <Route path="/clinic/register"   element={<ClinicRegistration />} />

      {/* ── OWNER PORTAL ── */}
      <Route path="/owner"             element={<OwnerDashboard />} />
      <Route path="/owner/dashboard"   element={<OwnerDashboard />} />
      <Route path="/owner/add"         element={<OwnerAdd />} />
      <Route path="/owner/analytics"   element={<OwnerAnalytics />} />
      <Route path="/owner/dispatch"    element={<OwnerDispatch />} />
      <Route path="/owner/requests"    element={<OwnerRequests />} />
      <Route path="/owner/settlements" element={<OwnerSettlements />} />
      <Route path="/owner/vault"       element={<OwnerVault />} />
      <Route path="/owner/yield"       element={<OwnerYield />} />

      {/* ── TECHNICIAN PORTAL ── */}
      <Route path="/tech/dashboard"               element={<TechDashboard />} />
      <Route path="/tech/service-orders" element={<TechServiceOrders />} />
      <Route path="/tech/calibration"   element={<TechCalibration />} />
      <Route path="/tech/diagnostics"   element={<TechDiagnostics />} />
      <Route path="/tech/incidents"     element={<TechIncidents />} />
      <Route path="/tech/inventory"     element={<TechInventory />} />
      <Route path="/tech/library"       element={<TechLibrary />} />
      <Route path="/tech/prep"          element={<TechPrep />} />

      {/* ── LOGISTICS PORTAL ── */}
      <Route path="/logistics"           element={<LogisticsDashboard />} />
      <Route path="/logistics/dashboard" element={<LogisticsDashboard />} />
      <Route path="/logistics/active"    element={<LogisticsActive />} />
      <Route path="/logistics/incident"  element={<LogisticsIncident />} />
      <Route path="/logistics/logs"      element={<LogisticsLogs />} />
      <Route path="/logistics/map"       element={<LogisticsMap />} />
      <Route path="/logistics/settings"   element={<LogisticsSettings />} />
    </Routes>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ClinicProvider>
      <LayoutWrapper>
        <AppRoutes />
      </LayoutWrapper>
    </ClinicProvider>
  );
}

export default App;