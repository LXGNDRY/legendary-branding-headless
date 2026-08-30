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

  return (
    <fetcher.Form method="post" action="/api/market" className="flex items-center gap-2">
      <label htmlFor="market-country" className="sr-only">
        Shipping country and market
      </label>
      <select
        id="market-country"
        name="country"
        defaultValue={current.isoCode}
        disabled={busy}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="max-w-[13rem] bg-transparent text-xs text-[var(--color-text-secondary)] border border-[var(--color-border-medium)] rounded-md px-3 py-2"
        aria-describedby={fetcher.data?.error ? 'market-country-error' : undefined}
      >
        {countries.map((country) => (
          <option key={country.isoCode} value={country.isoCode}>
            {country.name} · {country.currency.isoCode}
          </option>
        ))}
      </select>
      {busy && <span className="text-xs text-[var(--color-text-tertiary)]">Updating…</span>}
      {fetcher.data?.error && (
        <span id="market-country-error" role="alert" className="text-xs text-[var(--color-error)]">
          {fetcher.data.error}
        </span>
      )}
    </fetcher.Form>
  );
}
