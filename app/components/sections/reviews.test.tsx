// @vitest-environment jsdom
import {cleanup, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {afterEach, describe, expect, it, vi} from 'vitest';
import ProductReviewList from '~/components/sections/ProductReviewList';
import ReviewQuotes from '~/components/sections/ReviewQuotes';
import VerifiedReviews from '~/components/sections/VerifiedReviews';
import {LocaleProvider} from '~/lib/i18n';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const review = (n: number) => ({id: n, rating: 5, body: `Review ${n}`, reviewerName: 'Jordan A.'});

describe('ProductReviewList', () => {
  it('says how many written reviews are shown when the average covers more', () => {
    render(<ProductReviewList reviews={[review(1), review(2)]} aggregateRating={4.5} aggregateCount={10} />);
    expect(screen.getByText(/Based on 10 reviews/).textContent).toMatch(/Showing 2 written reviews/);
  });

  it('flags a truncated list even when the counts match', () => {
    render(<ProductReviewList reviews={[review(1)]} aggregateRating={5} aggregateCount={1} truncated />);
    expect(screen.getByText(/Based on 1 review/).textContent).toMatch(/Showing 1 written review$/);
  });

  it('adds nothing when the list is complete', () => {
    render(<ProductReviewList reviews={[review(1), review(2)]} aggregateRating={5} aggregateCount={2} />);
    expect(screen.getByText(/Based on 2 reviews/).textContent).not.toMatch(/Showing/);
  });

  it('still lists reviews, without an average row, when no aggregate is known', () => {
    render(<ProductReviewList reviews={[review(1)]} />);
    expect(screen.getByText(/Review 1/)).toBeTruthy();
    expect(screen.queryByText(/out of 5/)).toBeNull();
  });

  it('shows whatever attribution it is given and invents none', () => {
    render(<ProductReviewList reviews={[{...review(1), reviewerName: 'Anonymous'}]} />);
    expect(screen.getByText('Anonymous')).toBeTruthy();
  });
});

describe('VerifiedReviews', () => {
  it('describes the figure as an average of the products shown, not the store', () => {
    render(
      <MemoryRouter>
        <LocaleProvider language="EN">
          <VerifiedReviews
            aggregateRating={4.7}
            aggregateCount={35}
            products={[
              {id: 'a', handle: 'a', title: 'A', rating: 4.8, reviewCount: 20},
              {id: 'b', handle: 'b', title: 'B', rating: 4.6, reviewCount: 15},
            ]}
          />
        </LocaleProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText(/average of the 2 products below/).textContent).toMatch(/4\.7 out of 5/);
    expect(screen.getByText(/average of the 2 products below/).textContent).toMatch(/35 reviews/);
  });
});

describe('ReviewQuotes', () => {
  it('labels the quotes as a selection', () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    render(
      <MemoryRouter>
        <ReviewQuotes quotes={[{id: 1, rating: 5, body: 'Great', reviewerName: 'Madonna'}]} />
      </MemoryRouter>,
    );
    expect(screen.getByText('A selection of our 5-star reviews')).toBeTruthy();
    expect(screen.getByText('Madonna')).toBeTruthy();
  });
});
