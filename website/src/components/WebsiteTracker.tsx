import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1:8001/api/v1'
  : 'https://web-based-crm.onrender.com/api/v1';

function getOrSetVisitorId(): string {
  try {
    let vid = localStorage.getItem('realvion_visitor_id');
    if (!vid) {
      vid = 'vid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem('realvion_visitor_id', vid);
    }
    return vid;
  } catch {
    return 'vid_' + Math.random().toString(36).substring(2, 11);
  }
}

function getOrSetSessionId(): string {
  try {
    let sid = sessionStorage.getItem('realvion_session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      sessionStorage.setItem('realvion_session_id', sid);
    }
    return sid;
  } catch {
    return 'sid_' + Math.random().toString(36).substring(2, 11);
  }
}

function detectDevice(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua) || (width >= 768 && width <= 1024)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android.*mobile|blackberry|phone/i.test(ua) || width < 768) {
    return 'mobile';
  }
  return 'desktop';
}

function detectBrowser(): string {
  if (typeof window === 'undefined') return 'Chrome';
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('MSIE') || ua.includes('Trident/')) return 'IE';
  return 'Other';
}

function detectOS(): string {
  if (typeof window === 'undefined') return 'Windows';
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Macintosh') || ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Linux')) return 'Linux';
  return 'Other';
}

export const WebsiteTracker: React.FC = () => {
  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);
  const lastTrackedTime = useRef<number>(0);

  useEffect(() => {
    const currentPath = location.pathname;
    const now = Date.now();

    // Prevent immediate duplicate fires for the same path within 2 seconds
    if (lastTrackedPath.current === currentPath && (now - lastTrackedTime.current) < 2000) {
      return;
    }

    lastTrackedPath.current = currentPath;
    lastTrackedTime.current = now;

    const visitorId = getOrSetVisitorId();
    const sessionId = getOrSetSessionId();
    const deviceType = detectDevice();
    const browser = detectBrowser();
    const os = detectOS();

    const payload = {
      visitor_id: visitorId,
      session_id: sessionId,
      page_path: currentPath,
      page_title: typeof document !== 'undefined' ? document.title : undefined,
      referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : undefined,
      device_type: deviceType,
      browser: browser,
      os: os,
    };

    fetch(`${API_BASE}/saas/track-visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Fire-and-forget; suppress logging to avoid noise in client console
    });
  }, [location.pathname]);

  return null;
};
