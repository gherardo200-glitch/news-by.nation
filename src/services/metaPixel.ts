/**
 * Meta Pixel (Facebook Pixel) Utility
 * Manages initialization and event tracking with respect to user consent.
 */

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const initMetaPixel = () => {
  if (typeof window === 'undefined') return;
  if (window.fbq) return;
  if (!PIXEL_ID) return; // No pixel configured — skip initialization

  const n: any = window.fbq = function() {
    n.callMethod ? n.callMethod.apply(n, Array.from(arguments)) : n.queue.push(Array.from(arguments));
  };
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = !0;
  n.version = '2.0';
  n.queue = [];
  
  const s = document.createElement('script');
  s.async = !0;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  const t = document.getElementsByTagName('script')[0];
  t.parentNode?.insertBefore(s, t);

  window.fbq('init', PIXEL_ID);
};

export const trackPixelEvent = (event: string, params?: object) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params);
  }
};

export const trackCustomEvent = (event: string, params?: object) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', event, params);
  }
};
