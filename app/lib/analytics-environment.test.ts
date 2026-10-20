import {describe, it, expect} from 'vitest';
import {analyticsEnvironment} from './analytics-environment';

describe('analyticsEnvironment', () => {
  describe('development hosts', () => {
    it('refuses the dev server that actually polluted the shop', () => {
      // ~2,100 sessions in one 90-day window landed on these URLs, making a
      // developer's laptop the largest single landing page in the store.
      const env = analyticsEnvironment('http://127.0.0.1:3000/products/legendary-world-round-t-shirt?Color=Black&Size=S');
      expect(env.reportToShop).toBe(false);
      expect(env.reason).toContain('127.0.0.1');
    });

    it('refuses every form of a local host', () => {
      for (const url of [
        'http://localhost:3000/',
        'http://localhost:3000/collections/all-products',
        'http://0.0.0.0:3000/cart',
        'http://192.168.1.14:3000/search',
        'http://10.0.0.5:3000/journal',
        'http://172.20.0.3/',
        'http://macbook.local:3000/',
      ]) {
        expect(analyticsEnvironment(url).reportToShop, url).toBe(false);
      }
    });

    it('refuses Hydrogen\'s local HTTPS host', () => {
      // `local.tryhydrogen.dev` looks like a public domain but resolves to the
      // developer's own machine. vite.config.ts allows `.tryhydrogen.dev`, so
      // it is in active use here - without this it reads as the live
      // storefront and keeps leaking.
      const env = analyticsEnvironment('https://local.tryhydrogen.dev:3000/products/goat-hoodie-440gsm');
      expect(env.reportToShop).toBe(false);
      expect(env.reason).toContain('local development host');
    });

    it('refuses a production build served on loopback', () => {
      // `shopify hydrogen preview` runs a production bundle locally, so build
      // mode is not a safe signal - the host is.
      expect(analyticsEnvironment('http://localhost:3000/').reportToShop).toBe(false);
    });
  });

  describe('preview hosts', () => {
    it('refuses an Oxygen preview deployment', () => {
      // This one is in the shop's data too, at smaller volume.
      const env = analyticsEnvironment('https://legendary-branding-8be84d3c845879dcdcf0.o2.myshopify.dev/');
      expect(env.reportToShop).toBe(false);
      expect(env.reason).toContain('preview host');
    });

    it('refuses a Shopify theme preview', () => {
      expect(analyticsEnvironment('https://abc123-49013915801.shopifypreview.com/?cb=x').reportToShop).toBe(false);
    });
  });

  describe('the live storefront', () => {
    it('reports from the real domain', () => {
      for (const url of [
        'https://legendary-branding.com/',
        'https://www.legendary-branding.com/products/heavyweight-oversized-hoodie-460gsm',
        'https://legendary-branding.com/id/products/mini-goat-oversized-t-shirt',
      ]) {
        expect(analyticsEnvironment(url).reportToShop, url).toBe(true);
      }
    });

    it('reports from the myshopify.com domain', () => {
      // The live backend domain is a real customer surface; only .myshopify.dev
      // is the development one.
      expect(analyticsEnvironment('https://lngndny.myshopify.com/').reportToShop).toBe(true);
    });
  });

  describe('failure handling', () => {
    it('fails closed on an unparseable URL', () => {
      // Losing a few events costs nothing. Polluting the shop's reporting
      // costs every decision made from it afterwards.
      for (const url of ['', 'not-a-url', '///']) {
        expect(analyticsEnvironment(url).reportToShop, url).toBe(false);
      }
    });

    it('always explains itself', () => {
      for (const url of ['http://localhost:3000/', 'https://legendary-branding.com/', 'nonsense']) {
        expect(analyticsEnvironment(url).reason.length).toBeGreaterThan(0);
      }
    });
  });
});
