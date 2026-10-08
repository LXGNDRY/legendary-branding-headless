import {useEffect, useMemo, useState} from 'react';
import {createPortal} from 'react-dom';
import {Link, useFetcher} from 'react-router';
import {CartForm, Image, Money} from '@shopify/hydrogen';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import {useFocusTrap} from '~/hooks/useFocusTrap';
import {useBodyScrollLock} from '~/hooks/useBodyScrollLock';
import {useTranslation} from '~/lib/i18n';
import {
  findSelectedVariant,
  initialSelection,
  isOptionValueAvailable,
  isOptionValueInStock,
  selectOptionValue,
  type OptionSelection,
} from '~/lib/variant-selection';

type MoneyV2 = {amount: string; currencyCode: CurrencyCode};
type ImageData = {url: string; altText?: string | null; width?: number | null; height?: number | null};

export interface QuickAddProduct {
  id: string;
  title: string;
  handle: string;
  featuredImage?: ImageData | null;
  options: Array<{
    name: string;
    optionValues: Array<{
      name: string;
      swatch?: {color?: string | null; image?: {previewImage?: {url?: string | null} | null} | null} | null;
    }>;
  }>;
  variants: {
    nodes: Array<{
      id: string;
      availableForSale: boolean;
      selectedOptions: Array<{name: string; value: string}>;
      price: MoneyV2;
      compareAtPrice?: MoneyV2 | null;
      image?: ImageData | null;
    }>;
  };
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 4l12 12M16 4L4 16" />
    </svg>
  );
}

/**
 * Product-card quick add: fetches the product's options on open and asks the
 * customer to choose color/size exactly as on the PDP, instead of silently
 * adding the first available variant. Adding submits a normal CartForm
 * LinesAdd, which the root layout already treats as "open the cart drawer".
 * Mount it only while open, so each opening starts with fresh fetcher state.
 */
export default function QuickAddModal({
  handle,
  title,
  onClose,
}: {
  handle: string;
  title: string;
  onClose: () => void;
}) {
  const t = useTranslation();
  const {containerRef} = useFocusTrap(true, onClose);
  useBodyScrollLock(true);

  const productFetcher = useFetcher<{product: QuickAddProduct | null}>();
  const cartFetcher = useFetcher<{errors?: Array<{message?: string}>}>();
  // NOTE: only what the customer picked. Single-value defaults are derived below, never written by an effect, so a data reload can't wipe a pick.
  const [choices, setChoices] = useState<OptionSelection>({});

  const product = productFetcher.data?.product ?? null;
  const loadFailed = productFetcher.state === 'idle' && productFetcher.data !== undefined && !product;

  useEffect(() => {
    if (productFetcher.state === 'idle' && productFetcher.data === undefined) {
      productFetcher.load(`/api/quick-add?handle=${encodeURIComponent(handle)}`);
    }
  }, [handle, productFetcher]);

  // The cart drawer opens as soon as the add lands (fetcher `loading`), so
  // close then rather than at `idle` -- two modal focus traps must never be
  // active at once.
  const added = cartFetcher.state !== 'submitting' && cartFetcher.data != null && !cartFetcher.data.errors?.length;
  useEffect(() => {
    if (added) onClose();
  }, [added, onClose]);

  const defaults = useMemo(() => (product ? initialSelection(product.options) : {}), [product]);
  const selection = useMemo(() => ({...defaults, ...choices}), [defaults, choices]);
  const optionNames = useMemo(() => product?.options.map((o) => o.name) ?? [], [product]);
  const variants = product?.variants.nodes ?? [];
  const selectedVariant = findSelectedVariant(variants, optionNames, selection);
  const previewVariant =
    selectedVariant ??
    variants.find((variant) =>
      variant.selectedOptions.every((o) => !selection[o.name] || selection[o.name] === o.value),
    );
  const image = previewVariant?.image ?? product?.featuredImage;
  const price = previewVariant?.price ?? variants[0]?.price;
  const compareAt = previewVariant?.compareAtPrice;
  const isAdding = cartFetcher.state !== 'idle';
  const cartError = cartFetcher.state === 'idle' ? cartFetcher.data?.errors?.[0]?.message : undefined;

  function handleAdd() {
    if (!selectedVariant?.availableForSale || isAdding) return;
    cartFetcher.submit(
      {
        [CartForm.INPUT_NAME]: JSON.stringify({
          action: CartForm.ACTIONS.LinesAdd,
          inputs: {lines: [{merchandiseId: selectedVariant.id, quantity: 1}]},
        }),
      },
      {method: 'post', action: '/cart'},
    );
  }

  const headingId = `quick-add-${handle}-title`;

  // NOTE: portaled to <body> because product cards sit inside transformed,
  // overflow-hidden containers that would clip a `fixed` overlay, and
  // propagation is stopped so modal clicks never reach a card-level <Link>.
  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close" tabIndex={-1} />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-t-lg border border-[var(--color-border-muted)] bg-[var(--color-bg-level-0)] shadow-xl sm:rounded-lg"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-level-2)] hover:text-[var(--color-text-primary)]"
        >
          <CloseIcon />
        </button>

        <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
          <div className="aspect-[3/4] overflow-hidden rounded-md bg-[var(--color-bg-level-2)]">
            {image && (
              <Image
                data={image}
                alt={image.altText || title}
                width={480}
                height={640}
                sizes="(max-width: 640px) 90vw, 320px"
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="pr-8">
              <h2 id={headingId} className="font-serif text-xl text-[var(--color-text-primary)]">
                {product?.title ?? title}
              </h2>
              {price && (
                <div className="mt-2 flex items-baseline gap-2.5">
                  <Money data={price} className="font-serif text-lg text-[var(--color-text-primary)]" />
                  {compareAt && Number(compareAt.amount) > Number(price.amount) && (
                    <Money data={compareAt} className="text-sm text-[var(--color-text-tertiary)] line-through" />
                  )}
                </div>
              )}
            </div>

            {!product && !loadFailed && (
              <p role="status" className="text-sm text-[var(--color-text-secondary)]">
                {t('status.updating')}
              </p>
            )}

            {loadFailed && (
              <p role="alert" className="text-sm text-[var(--color-text-secondary)]">
                We couldn&apos;t load the options for this product. Please choose them on the product page.
              </p>
            )}

            {product?.options
              .filter((option) => option.optionValues.length > 1)
              .map((option) => {
                const isColor = ['color', 'colour'].includes(option.name.toLowerCase());
                return (
                  <fieldset key={option.name}>
                    <legend className="mb-2 text-[0.7rem] font-semibold tracking-[0.1em] uppercase text-[var(--color-text-primary)]">
                      {option.name}
                      {selection[option.name] && (
                        <span className="ml-2 font-normal normal-case tracking-normal text-[var(--color-text-secondary)]">
                          {selection[option.name]}
                        </span>
                      )}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {option.optionValues.map(({name: value, swatch}) => {
                        const isActive = selection[option.name] === value;
                        // Out of stock with the current choices: styled as unavailable,
                        // but still selectable if some other combination has it.
                        const isAvailable = isOptionValueAvailable(variants, option.name, value, selection);
                        const isSelectable = isOptionValueInStock(variants, option.name, value);
                        const swatchImageUrl = swatch?.image?.previewImage?.url;
                        const swatchStyle = swatchImageUrl
                          ? {backgroundImage: `url(${swatchImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center'}
                          : swatch?.color
                            ? {backgroundColor: swatch.color}
                            : undefined;
                        const select = () => setChoices((current) => selectOptionValue(variants, {...defaults, ...current}, option.name, value));
                        const label = `${option.name}: ${value}${isAvailable ? '' : ' (unavailable)'}`;

                        if (isColor && swatchStyle) {
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={select}
                              disabled={!isSelectable}
                              aria-pressed={isActive}
                              aria-label={label}
                              title={value}
                              style={swatchStyle}
                              className={`relative h-11 w-11 shrink-0 rounded-full border-2 transition-all duration-150 ${
                                isActive
                                  ? 'border-[var(--color-text-primary)] ring-2 ring-[var(--color-text-primary)] ring-offset-2'
                                  : isAvailable
                                    ? 'border-[var(--color-border-medium)] hover:border-[var(--color-text-primary)]'
                                    : `border-[var(--color-border-muted)] opacity-40 ${isSelectable ? '' : 'cursor-not-allowed'}`
                              }`}
                            />
                          );
                        }

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={select}
                            disabled={!isSelectable}
                            aria-pressed={isActive}
                            aria-label={label}
                            className={`flex h-11 min-w-[3rem] items-center justify-center rounded-md border px-4 text-[0.7rem] font-semibold tracking-[0.1em] uppercase transition-all duration-150 ${
                              isActive
                                ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-bg-level-0)]'
                                : isAvailable
                                  ? 'border-[var(--color-border-medium)] text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)] hover:bg-[var(--color-bg-level-2)]'
                                  : `border-[var(--color-border-muted)] text-[var(--color-text-tertiary)] line-through opacity-50 ${isSelectable ? '' : 'cursor-not-allowed'}`
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}

            {product && (
              <button
                type="button"
                onClick={handleAdd}
                disabled={!selectedVariant?.availableForSale || isAdding}
                data-testid="quick-add-submit"
                className="h-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAdding
                  ? t('status.updating')
                  : !selectedVariant
                    ? t('action.chooseOption')
                    : selectedVariant.availableForSale
                      ? t('action.addToBag')
                      : 'Sold Out'}
              </button>
            )}

            {cartError && (
              <p role="alert" className="text-sm text-[var(--color-text-secondary)]">
                {cartError}
              </p>
            )}

            <Link
              to={`/products/${handle}`}
              onClick={onClose}
              prefetch="intent"
              className="text-center text-xs tracking-[0.1em] uppercase text-[var(--color-text-secondary)] underline-offset-4 hover:text-[var(--color-text-primary)] hover:underline"
            >
              View full details
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
