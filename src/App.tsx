import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import CookieBanner, { initConsentMode } from './components/marketing/CookieBanner';

// Initialize Consent Mode v2 BEFORE any other tag fires (required by Google EU policy)
initConsentMode();

// Code splitting: every route loads its own chunk
const MarketingLanding = lazy(() => import('./components/marketing/MarketingLanding'));
const AuthPage = lazy(() => import('./components/auth/AuthPage'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const PublicNewsHub = lazy(() => import('./pages/PublicNewsHub'));

function Spinner() {
  return (
    <div className="w-screen h-[100dvh] bg-[#050B14] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const isGuest = new URLSearchParams(location.search).get('guest') === 'true';
  
  if (loading) return <Spinner />;
  return (currentUser || isGuest) ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<MarketingLanding />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/app" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/news/:countryId" element={<PublicNewsHub />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>

      {/* Cookie Banner — shown globally, above all routes */}
      <CookieBanner />
    </BrowserRouter>
  );
}
