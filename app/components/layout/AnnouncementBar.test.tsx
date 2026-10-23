// @vitest-environment jsdom
import {cleanup, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import '@testing-library/jest-dom/vitest';
import {afterEach, describe, expect, it} from 'vitest';
import AnnouncementBar from './AnnouncementBar';

afterEach(cleanup);

const wrap = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('AnnouncementBar', () => {
  it('renders nothing when there is no live Shopify discount (no static marketing copy)', () => {
    const {container} = wrap(<AnnouncementBar />);
    expect(container).toBeEmptyDOMElement();
    const {container: empty} = wrap(<AnnouncementBar discounts={[]} />);
    expect(empty).toBeEmptyDOMElement();
  });

  it('announces live discounts using Shopify\'s own summary text', () => {
    wrap(
      <AnnouncementBar
        discounts={[
          {id: '1', title: 'Welcome', summary: '10% off your order', kind: 'code', code: 'WELCOME10'},
          {id: '2', title: 'Auto', summary: 'Buy 2 get 1', kind: 'automatic'},
        ]}
      />,
    );
    expect(screen.getAllByText(/10% off your order — use code WELCOME10/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Buy 2 get 1').length).toBeGreaterThan(0);
  });
});
