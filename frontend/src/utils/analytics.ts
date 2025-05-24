'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Mendefinisikan interface untuk analytics provider
export interface AnalyticsProvider {
  initialize: () => void;
  pageView: (url: string, title?: string) => void;
  event: (eventName: string, params?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  reset: () => void;
}

// Google Analytics implementation
export class GoogleAnalyticsProvider implements AnalyticsProvider {
  private enabled = false;
  private GA_TRACKING_ID = process.env.NEXT_PUBLIC_ANALYTICS_ID || '';

  initialize(): void {
    if (!this.GA_TRACKING_ID || typeof window === 'undefined') {
      console.warn('GoogleAnalytics: Tracking ID not set or running in server environment');
      return;
    }

    // Load Google Analytics script
    if (!this.isLoaded()) {
      this.loadScript();
    }
    
    this.enabled = true;
  }

  pageView(url: string, title?: string): void {
    if (!this.enabled || !this.isLoaded()) return;

    window.gtag('config', this.GA_TRACKING_ID, {
      page_path: url,
      page_title: title,
    });
  }

  event(eventName: string, params?: Record<string, any>): void {
    if (!this.enabled || !this.isLoaded()) return;

    window.gtag('event', eventName, params);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.enabled || !this.isLoaded()) return;

    window.gtag('set', 'user_properties', {
      user_id: userId,
      ...traits,
    });
  }

  reset(): void {
    if (!this.enabled || !this.isLoaded()) return;
    
    // Clear user data
    window.gtag('config', this.GA_TRACKING_ID, {
      user_id: undefined,
    });
  }

  private isLoaded(): boolean {
    return typeof window !== 'undefined' && typeof window.gtag !== 'undefined';
  }

  private loadScript(): void {
    // Add global gtag function
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', this.GA_TRACKING_ID, { send_page_view: false });

    // Add script tag
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.GA_TRACKING_ID}`;
    document.head.appendChild(script);
  }
}

// Mixpanel implementation
export class MixpanelProvider implements AnalyticsProvider {
  private enabled = false;
  private MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '';

  initialize(): void {
    if (!this.MIXPANEL_TOKEN || typeof window === 'undefined') {
      console.warn('Mixpanel: Token not set or running in server environment');
      return;
    }

    // Load Mixpanel script if needed
    if (!this.isLoaded()) {
      this.loadScript();
    }
    
    this.enabled = true;
  }

  pageView(url: string, title?: string): void {
    if (!this.enabled || !this.isLoaded()) return;

    window.mixpanel.track('Page View', {
      url,
      title,
    });
  }

  event(eventName: string, params?: Record<string, any>): void {
    if (!this.enabled || !this.isLoaded()) return;

    window.mixpanel.track(eventName, params);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.enabled || !this.isLoaded()) return;

    window.mixpanel.identify(userId);
    if (traits) {
      window.mixpanel.people.set(traits);
    }
  }

  reset(): void {
    if (!this.enabled || !this.isLoaded()) return;
    
    window.mixpanel.reset();
  }

  private isLoaded(): boolean {
    return typeof window !== 'undefined' && typeof window.mixpanel !== 'undefined';
  }

  private loadScript(): void {
    // Add Mixpanel script
    (function(f, b) {
      if (!b.__SV) {
        let e, g, i, h; window.mixpanel = b; b._i = []; b.init = function(e, f, c) {
          function g(a, d) { var b = d.split('.'); 2 == b.length && (a = a[b[0]], d = b[1]); a[d] = function() { a.push([d].concat(Array.prototype.slice.call(arguments, 0))); }; }
          var a = b; 'undefined' !== typeof c ? a = b[c] = [] : c = 'mixpanel'; a.people = a.people || []; a.toString = function(a) { var d = 'mixpanel'; 'mixpanel' !== c && (d += '.' + c); a || (d += ' (stub)'); return d; };
          a.people.toString = function() { return a.toString(1) + '.people (stub)'; }; i = 'disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove'.split(' ');
          for (h = 0; h < i.length; h++) g(a, i[h]); b._i.push([e, f, c]);
        }; b.__SV = 1.2; e = f.createElement('script'); e.type = 'text/javascript'; e.async = true; e.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js'; g = f.getElementsByTagName('script')[0]; g.parentNode.insertBefore(e, g);
      }
    })(document, window.mixpanel || []);
    
    window.mixpanel.init(this.MIXPANEL_TOKEN);
  }
}

// Custom analytics class yang menggunakan provider sesuai konfigurasi
export class Analytics {
  private static instance: Analytics;
  private provider: AnalyticsProvider;
  
  private constructor() {
    // Tentukan provider berdasarkan environment variable
    const providerType = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER || 'google';
    
    if (providerType === 'mixpanel') {
      this.provider = new MixpanelProvider();
    } else {
      // Default to Google Analytics
      this.provider = new GoogleAnalyticsProvider();
    }
    
    // Initialize provider
    this.provider.initialize();
  }
  
  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }
  
  pageView(url: string, title?: string): void {
    this.provider.pageView(url, title);
    
    // Jika ingin debug di development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Analytics - Page View: ${url}${title ? ` (${title})` : ''}`);
    }
  }
  
  event(eventName: string, params?: Record<string, any>): void {
    this.provider.event(eventName, params);
    
    // Jika ingin debug di development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Analytics - Event: ${eventName}`, params);
    }
  }
  
  identify(userId: string, traits?: Record<string, any>): void {
    this.provider.identify(userId, traits);
    
    // Jika ingin debug di development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Analytics - Identify: ${userId}`, traits);
    }
  }
  
  reset(): void {
    this.provider.reset();
    
    // Jika ingin debug di development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics - Reset');
    }
  }
}

// Hook untuk menggunakan analytics dalam components
export function useAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize analytics on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAnalytics(Analytics.getInstance());
    }
  }, []);
  
  // Track page views
  useEffect(() => {
    if (!analytics) return;
    
    // Construct full URL
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    // Send page view
    analytics.pageView(url);
  }, [analytics, pathname, searchParams]);
  
  return {
    event: (eventName: string, params?: Record<string, any>) => {
      analytics?.event(eventName, params);
    },
    identify: (userId: string, traits?: Record<string, any>) => {
      analytics?.identify(userId, traits);
    },
    reset: () => {
      analytics?.reset();
    }
  };
}

// Declare global variables for typings
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    mixpanel: any;
  }
}

export default Analytics.getInstance();
