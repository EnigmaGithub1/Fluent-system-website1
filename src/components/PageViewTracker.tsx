'use client';
// src/components/PageViewTracker.tsx
import { useEffect } from 'react';
import { trackEvent, type AnalyticsEvent } from '@/lib/analytics';

export default function PageViewTracker({ event }: { event: AnalyticsEvent }) {
  useEffect(() => {
    trackEvent(event);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
