import {useEffect, useId} from 'react';
import {useFetcher} from 'react-router';
import type {MarketCountry} from '~/lib/market';

export default function MarketSelector({
  current,
  countries,
}: {
  current: MarketCountry;
  countries: MarketCountry[];
}) {
  const fetcher = useFetcher<{success?: boolean; error?: string}>();
  const busy = fetcher.state !== 'idle';
  const selectId = useId();
  const errorId = `${selectId}-error`;

  useEffect(() => {
    if (fetcher.data?.success) {
      // Root loader reads the selected country from the server session. A
      // document navigation makes every price and availability query use the
      // newly selected Shopify Market, rather than only updating this control.
      window.location.reload();
    }
  }, [fetcher.data?.success]);

  return (
    <fetcher.Form method="post" action="/api/market" className="flex items-center gap-2">
      <label htmlFor={selectId} className="sr-only">
        Shipping country and market
      </label>
      <select
        id={selectId}
        name="country"
        // Keyed by the current country so each instance (e.g. one in the
        // footer, one in the mobile menu drawer) remounts and picks up the
        // latest value when another instance changes it, instead of an
        // uncontrolled `defaultValue` silently going stale (Codex-caught).
        key={current.isoCode}
        defaultValue={current.isoCode}
        disabled={busy}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="max-w-[13rem] bg-transparent text-xs text-[var(--color-text-secondary)] border border-[var(--color-border-medium)] rounded-md px-3 py-2"
        aria-describedby={fetcher.data?.error ? errorId : undefined}
      >
        {countries.map((country) => (
          <option key={country.isoCode} value={country.isoCode}>
            {country.name} · {country.currency.isoCode}
          </option>
        ))}
      </select>
      {busy && <span className="text-xs text-[var(--color-text-tertiary)]">Updating…</span>}
      {fetcher.data?.error && (
        <span id={errorId} role="alert" className="text-xs text-[var(--color-error)]">
          {fetcher.data.error}
        </span>
      )}
    </fetcher.Form>
  );
}
