import { useState, useEffect } from 'react';
import { Cookie, Shield, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

type ConsentState = 'pending' | 'accepted' | 'rejected';

import { initMetaPixel } from '../../services/metaPixel';

// Google Consent Mode v2 — required for EU/EEA since March 2024
function pushConsent(granted: boolean) {
  // @ts-ignore
  window.gtag = window.gtag || function(...args: any[]) {
    // @ts-ignore
    (window.dataLayer = window.dataLayer || []).push(args);
  };
  const status = granted ? 'granted' : 'denied';
  // @ts-ignore
  window.gtag('consent', 'update', {
    analytics_storage: status,
    ad_storage: status,
    ad_user_data: status,
    ad_personalization: status,
  });

  if (granted) {
    initMetaPixel();
    // @ts-ignore
    if (window.fbq) window.fbq('track', 'PageView');
  }
}

export function initConsentMode() {
  // @ts-ignore
  window.dataLayer = window.dataLayer || [];
  // @ts-ignore
  window.gtag = function(...args: any[]) { window.dataLayer.push(args); };
  // Default: everything denied until user chooses
  // @ts-ignore
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });
}

export function getStoredConsent(): ConsentState {
  const stored = localStorage.getItem('cookie_consent');
  if (stored === 'accepted') return 'accepted';
  if (stored === 'rejected') return 'rejected';
  return 'pending';
}

export default function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>(() => getStoredConsent());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Apply stored consent on mount
    if (consent === 'accepted') {
      pushConsent(true);
    } else if (consent === 'rejected') {
      pushConsent(false);
    } else {
      // Show banner after short delay to avoid layout shift
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  if (consent !== 'pending') return null;

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    pushConsent(true);
    setConsent('accepted');
  };

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    pushConsent(false);
    setConsent('rejected');
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[200] p-4 transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      <div className="max-w-4xl mx-auto bg-gray-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_-10px_60px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon + Text */}
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <Cookie className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-1">
                🍪 Usiamo i Cookie
              </p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Utilizziamo cookie analitici e pubblicitari per migliorare la tua esperienza e mostrare contenuti pertinenti.
                Puoi accettare tutti i cookie, rifiutare quelli non necessari o consultare la nostra{' '}
                <Link to="/cookie-policy" className="text-blue-400 hover:underline">Cookie Policy</Link>
                {' '}e{' '}
                <Link to="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Shield className="w-3 h-3 text-green-400" /> Tecnici (sempre attivi)
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                  <BarChart2 className="w-3 h-3 text-blue-400" /> Analitici (Google Analytics)
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleReject}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all"
            >
              Solo Necessari
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              Accetta Tutti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
