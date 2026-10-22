/**
 * Shared pieces for the customer account routes: guards, safe loading, cursors and address validation.
 * Pure helpers with no secrets, so route modules can import them freely.
 */
import {captureError} from '~/lib/monitoring';
import {PRIVATE_ROBOTS_META} from '~/lib/private-route';

export const ACCOUNT_PAGE_SIZE = 10;

/** Title and description for a private account page, with the robots entry child routes must repeat. */
export function accountMeta(title: string, description?: string) {
  return [
    {title: `${title} | LEGENDARY BRANDING`},
    ...(description ? [{name: 'description', content: description}] : []),
    PRIVATE_ROBOTS_META,
  ];
}

export type LoadResult<T> = {ok: true; data: T} | {ok: false};

/**
 * Runs a Customer Account API read and never lets a malformed or failed response become a thrown 500.
 * Redirect Responses (an expired session sends the visitor to log in) pass through untouched; anything
 * else, including GraphQL `errors` and a missing `data`, is reported and returned as `{ok: false}`.
 */
export async function loadAccount<T>(
  label: string,
  run: () => Promise<{data?: T | null; errors?: unknown}>,
): Promise<LoadResult<T>> {
  try {
    const result = await run();
    if (!result || result.data == null || (Array.isArray(result.errors) && result.errors.length > 0)) {
      captureError(new Error(`${label}: Customer Account API returned no usable data`), {route: label});
      return {ok: false};
    }
    return {ok: true, data: result.data};
  } catch (error) {
    if (error instanceof Response) throw error;
    captureError(error, {route: label});
    return {ok: false};
  }
}

/** Forward-only cursor from `?after=`. Anything that does not look like an opaque cursor is ignored. */
export function parseAfterCursor(url: URL): string | null {
  const value = url.searchParams.get('after');
  if (!value || value.length > 512 || !/^[A-Za-z0-9+/=_-]+$/.test(value)) return null;
  return value;
}

const ADDRESS_ID = /^gid:\/\/shopify\/CustomerAddress\/[A-Za-z0-9_-]+(\?[A-Za-z0-9_=&%-]*)?$/;

export function isAddressId(value: string): boolean {
  return ADDRESS_ID.test(value);
}

// ---- address input ---------------------------------------------------------------------------------------

type Zone = {code: string; name: string};

const US_ZONES: Zone[] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'],
  ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'],
  ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'],
  ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'],
  ['WY', 'Wyoming'], ['AS', 'American Samoa'], ['GU', 'Guam'], ['MP', 'Northern Mariana Islands'],
  ['PR', 'Puerto Rico'], ['VI', 'U.S. Virgin Islands'], ['AA', 'Armed Forces Americas'],
  ['AE', 'Armed Forces Europe'], ['AP', 'Armed Forces Pacific'],
].map(([code, name]) => ({code, name}));

const CA_ZONES: Zone[] = [
  ['AB', 'Alberta'], ['BC', 'British Columbia'], ['MB', 'Manitoba'], ['NB', 'New Brunswick'],
  ['NL', 'Newfoundland and Labrador'], ['NS', 'Nova Scotia'], ['NT', 'Northwest Territories'], ['NU', 'Nunavut'],
  ['ON', 'Ontario'], ['PE', 'Prince Edward Island'], ['QC', 'Quebec'], ['SK', 'Saskatchewan'], ['YT', 'Yukon'],
].map(([code, name]) => ({code, name}));

const AU_ZONES: Zone[] = [
  ['ACT', 'Australian Capital Territory'], ['NSW', 'New South Wales'], ['NT', 'Northern Territory'],
  ['QLD', 'Queensland'], ['SA', 'South Australia'], ['TAS', 'Tasmania'], ['VIC', 'Victoria'],
  ['WA', 'Western Australia'],
].map(([code, name]) => ({code, name}));

/**
 * Countries whose state/province is a fixed list we can offer and require. Every other country takes an
 * optional free-text ISO 3166-2 subdivision code; Shopify validates it and its message is shown.
 */
export const ADDRESS_ZONES: Record<string, Zone[]> = {US: US_ZONES, CA: CA_ZONES, AU: AU_ZONES};

export type AddressInput = {
  firstName: string;
  lastName: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  zoneCode: string | null;
  zip: string;
  territoryCode: string;
  phoneNumber: string | null;
};

const LIMITS = {name: 100, company: 100, line: 200, city: 100, zip: 20, phone: 40, zone: 3} as const;

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  // NOTE: control characters are stripped; every other character (accents, CJK, RTL) is kept as typed.
  return typeof value === 'string' ? value.replace(/\p{Cc}/gu, ' ').trim() : '';
}

/** Validates the submitted address. Returns the input for the API, or user-facing errors. */
export function parseAddressForm(formData: FormData): {ok: true; input: AddressInput} | {ok: false; errors: string[]} {
  const errors: string[] = [];
  const territoryCode = field(formData, 'country').toUpperCase();
  const zoneRaw = field(formData, 'province').toUpperCase();

  const firstName = field(formData, 'firstName');
  const lastName = field(formData, 'lastName');
  const address1 = field(formData, 'address1');
  const city = field(formData, 'city');
  const zip = field(formData, 'zip');
  const address2 = field(formData, 'address2');
  const company = field(formData, 'company');
  const phone = field(formData, 'phoneNumber');

  if (!firstName) errors.push('First name is required.');
  if (!lastName) errors.push('Last name is required.');
  if (!address1) errors.push('Address is required.');
  if (!city) errors.push('City is required.');
  if (!zip) errors.push('ZIP / postal code is required.');
  if (!/^[A-Z]{2}$/.test(territoryCode)) errors.push('Choose a country.');

  const tooLong =
    firstName.length > LIMITS.name ||
    lastName.length > LIMITS.name ||
    company.length > LIMITS.company ||
    address1.length > LIMITS.line ||
    address2.length > LIMITS.line ||
    city.length > LIMITS.city ||
    zip.length > LIMITS.zip ||
    phone.length > LIMITS.phone;
  if (tooLong) errors.push('One of the fields is too long.');

  let zoneCode: string | null = null;
  const zones = ADDRESS_ZONES[territoryCode];
  if (zones) {
    if (!zones.some((zone) => zone.code === zoneRaw)) errors.push('Choose a state or province.');
    else zoneCode = zoneRaw;
  } else if (zoneRaw) {
    if (!/^[A-Z0-9]{1,3}$/.test(zoneRaw)) errors.push('Enter the region as its short code (for example "BY").');
    else zoneCode = zoneRaw;
  }

  if (errors.length > 0) return {ok: false, errors};
  return {
    ok: true,
    input: {
      firstName,
      lastName,
      company: company || null,
      address1,
      address2: address2 || null,
      city,
      zoneCode,
      zip,
      territoryCode,
      phoneNumber: phone || null,
    },
  };
}

type UserError = {message?: string | null};

/** Messages from a mutation's `userErrors`, or a generic one when the response is unusable. */
export function mutationErrors(
  label: string,
  result: {errors?: unknown} | undefined,
  payload: {userErrors?: UserError[] | null} | null | undefined,
): string[] | null {
  if (!payload || (Array.isArray(result?.errors) && result!.errors.length > 0)) {
    captureError(new Error(`${label}: Customer Account API mutation returned no usable payload`), {route: label});
    return ["We couldn't save that right now. Please try again."];
  }
  const messages = (payload.userErrors ?? []).map((e) => e.message).filter((m): m is string => Boolean(m));
  return messages.length > 0 ? messages : null;
}
