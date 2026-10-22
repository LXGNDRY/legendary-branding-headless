/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends {[key: string]: unknown}> = {[K in keyof T]: T[K]};
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | {[P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never};
import type * as StorefrontAPI from '@shopify/hydrogen/storefront-api-types';

/** Card brand, such as Visa or Mastercard, which can be used for payments. */
export type CardBrand =
  /** American Express. */
  | 'AMERICAN_EXPRESS'
  /** Diners Club. */
  | 'DINERS_CLUB'
  /** Discover. */
  | 'DISCOVER'
  /** JCB. */
  | 'JCB'
  /** Mastercard. */
  | 'MASTERCARD'
  /** Visa. */
  | 'VISA';

/**
 * A filter used to view a subset of products in a collection matching a specific category value.
 *
 */
export type CategoryFilter = {
  /** The id of the category to filter on. */
  id: string;
};

/**
 * The code designating a country/region, which generally follows ISO 3166-1 alpha-2 guidelines.
 * If a territory doesn't have a country code value in the `CountryCode` enum, then it might be considered a subdivision
 * of another country. For example, the territories associated with Spain are represented by the country code `ES`,
 * and the territories associated with the United States of America are represented by the country code `US`.
 *
 */
export type CountryCode =
  /** Ascension Island. */
  | 'AC'
  /** Andorra. */
  | 'AD'
  /** United Arab Emirates. */
  | 'AE'
  /** Afghanistan. */
  | 'AF'
  /** Antigua & Barbuda. */
  | 'AG'
  /** Anguilla. */
  | 'AI'
  /** Albania. */
  | 'AL'
  /** Armenia. */
  | 'AM'
  /** Netherlands Antilles. */
  | 'AN'
  /** Angola. */
  | 'AO'
  /** Argentina. */
  | 'AR'
  /** Austria. */
  | 'AT'
  /** Australia. */
  | 'AU'
  /** Aruba. */
  | 'AW'
  /** Åland Islands. */
  | 'AX'
  /** Azerbaijan. */
  | 'AZ'
  /** Bosnia & Herzegovina. */
  | 'BA'
  /** Barbados. */
  | 'BB'
  /** Bangladesh. */
  | 'BD'
  /** Belgium. */
  | 'BE'
  /** Burkina Faso. */
  | 'BF'
  /** Bulgaria. */
  | 'BG'
  /** Bahrain. */
  | 'BH'
  /** Burundi. */
  | 'BI'
  /** Benin. */
  | 'BJ'
  /** St. Barthélemy. */
  | 'BL'
  /** Bermuda. */
  | 'BM'
  /** Brunei. */
  | 'BN'
  /** Bolivia. */
  | 'BO'
  /** Caribbean Netherlands. */
  | 'BQ'
  /** Brazil. */
  | 'BR'
  /** Bahamas. */
  | 'BS'
  /** Bhutan. */
  | 'BT'
  /** Bouvet Island. */
  | 'BV'
  /** Botswana. */
  | 'BW'
  /** Belarus. */
  | 'BY'
  /** Belize. */
  | 'BZ'
  /** Canada. */
  | 'CA'
  /** Cocos (Keeling) Islands. */
  | 'CC'
  /** Congo - Kinshasa. */
  | 'CD'
  /** Central African Republic. */
  | 'CF'
  /** Congo - Brazzaville. */
  | 'CG'
  /** Switzerland. */
  | 'CH'
  /** Côte d’Ivoire. */
  | 'CI'
  /** Cook Islands. */
  | 'CK'
  /** Chile. */
  | 'CL'
  /** Cameroon. */
  | 'CM'
  /** China. */
  | 'CN'
  /** Colombia. */
  | 'CO'
  /** Costa Rica. */
  | 'CR'
  /** Cuba. */
  | 'CU'
  /** Cape Verde. */
  | 'CV'
  /** Curaçao. */
  | 'CW'
  /** Christmas Island. */
  | 'CX'
  /** Cyprus. */
  | 'CY'
  /** Czechia. */
  | 'CZ'
  /** Germany. */
  | 'DE'
  /** Djibouti. */
  | 'DJ'
  /** Denmark. */
  | 'DK'
  /** Dominica. */
  | 'DM'
  /** Dominican Republic. */
  | 'DO'
  /** Algeria. */
  | 'DZ'
  /** Ecuador. */
  | 'EC'
  /** Estonia. */
  | 'EE'
  /** Egypt. */
  | 'EG'
  /** Western Sahara. */
  | 'EH'
  /** Eritrea. */
  | 'ER'
  /** Spain. */
  | 'ES'
  /** Ethiopia. */
  | 'ET'
  /** Finland. */
  | 'FI'
  /** Fiji. */
  | 'FJ'
  /** Falkland Islands. */
  | 'FK'
  /** Faroe Islands. */
  | 'FO'
  /** France. */
  | 'FR'
  /** Gabon. */
  | 'GA'
  /** United Kingdom. */
  | 'GB'
  /** Grenada. */
  | 'GD'
  /** Georgia. */
  | 'GE'
  /** French Guiana. */
  | 'GF'
  /** Guernsey. */
  | 'GG'
  /** Ghana. */
  | 'GH'
  /** Gibraltar. */
  | 'GI'
  /** Greenland. */
  | 'GL'
  /** Gambia. */
  | 'GM'
  /** Guinea. */
  | 'GN'
  /** Guadeloupe. */
  | 'GP'
  /** Equatorial Guinea. */
  | 'GQ'
  /** Greece. */
  | 'GR'
  /** South Georgia & South Sandwich Islands. */
  | 'GS'
  /** Guatemala. */
  | 'GT'
  /** Guinea-Bissau. */
  | 'GW'
  /** Guyana. */
  | 'GY'
  /** Hong Kong SAR. */
  | 'HK'
  /** Heard & McDonald Islands. */
  | 'HM'
  /** Honduras. */
  | 'HN'
  /** Croatia. */
  | 'HR'
  /** Haiti. */
  | 'HT'
  /** Hungary. */
  | 'HU'
  /** Indonesia. */
  | 'ID'
  /** Ireland. */
  | 'IE'
  /** Israel. */
  | 'IL'
  /** Isle of Man. */
  | 'IM'
  /** India. */
  | 'IN'
  /** British Indian Ocean Territory. */
  | 'IO'
  /** Iraq. */
  | 'IQ'
  /** Iran. */
  | 'IR'
  /** Iceland. */
  | 'IS'
  /** Italy. */
  | 'IT'
  /** Jersey. */
  | 'JE'
  /** Jamaica. */
  | 'JM'
  /** Jordan. */
  | 'JO'
  /** Japan. */
  | 'JP'
  /** Kenya. */
  | 'KE'
  /** Kyrgyzstan. */
  | 'KG'
  /** Cambodia. */
  | 'KH'
  /** Kiribati. */
  | 'KI'
  /** Comoros. */
  | 'KM'
  /** St. Kitts & Nevis. */
  | 'KN'
  /** North Korea. */
  | 'KP'
  /** South Korea. */
  | 'KR'
  /** Kuwait. */
  | 'KW'
  /** Cayman Islands. */
  | 'KY'
  /** Kazakhstan. */
  | 'KZ'
  /** Laos. */
  | 'LA'
  /** Lebanon. */
  | 'LB'
  /** St. Lucia. */
  | 'LC'
  /** Liechtenstein. */
  | 'LI'
  /** Sri Lanka. */
  | 'LK'
  /** Liberia. */
  | 'LR'
  /** Lesotho. */
  | 'LS'
  /** Lithuania. */
  | 'LT'
  /** Luxembourg. */
  | 'LU'
  /** Latvia. */
  | 'LV'
  /** Libya. */
  | 'LY'
  /** Morocco. */
  | 'MA'
  /** Monaco. */
  | 'MC'
  /** Moldova. */
  | 'MD'
  /** Montenegro. */
  | 'ME'
  /** St. Martin. */
  | 'MF'
  /** Madagascar. */
  | 'MG'
  /** North Macedonia. */
  | 'MK'
  /** Mali. */
  | 'ML'
  /** Myanmar (Burma). */
  | 'MM'
  /** Mongolia. */
  | 'MN'
  /** Macao SAR. */
  | 'MO'
  /** Martinique. */
  | 'MQ'
  /** Mauritania. */
  | 'MR'
  /** Montserrat. */
  | 'MS'
  /** Malta. */
  | 'MT'
  /** Mauritius. */
  | 'MU'
  /** Maldives. */
  | 'MV'
  /** Malawi. */
  | 'MW'
  /** Mexico. */
  | 'MX'
  /** Malaysia. */
  | 'MY'
  /** Mozambique. */
  | 'MZ'
  /** Namibia. */
  | 'NA'
  /** New Caledonia. */
  | 'NC'
  /** Niger. */
  | 'NE'
  /** Norfolk Island. */
  | 'NF'
  /** Nigeria. */
  | 'NG'
  /** Nicaragua. */
  | 'NI'
  /** Netherlands. */
  | 'NL'
  /** Norway. */
  | 'NO'
  /** Nepal. */
  | 'NP'
  /** Nauru. */
  | 'NR'
  /** Niue. */
  | 'NU'
  /** New Zealand. */
  | 'NZ'
  /** Oman. */
  | 'OM'
  /** Panama. */
  | 'PA'
  /** Peru. */
  | 'PE'
  /** French Polynesia. */
  | 'PF'
  /** Papua New Guinea. */
  | 'PG'
  /** Philippines. */
  | 'PH'
  /** Pakistan. */
  | 'PK'
  /** Poland. */
  | 'PL'
  /** St. Pierre & Miquelon. */
  | 'PM'
  /** Pitcairn Islands. */
  | 'PN'
  /** Palestinian Territories. */
  | 'PS'
  /** Portugal. */
  | 'PT'
  /** Paraguay. */
  | 'PY'
  /** Qatar. */
  | 'QA'
  /** Réunion. */
  | 'RE'
  /** Romania. */
  | 'RO'
  /** Serbia. */
  | 'RS'
  /** Russia. */
  | 'RU'
  /** Rwanda. */
  | 'RW'
  /** Saudi Arabia. */
  | 'SA'
  /** Solomon Islands. */
  | 'SB'
  /** Seychelles. */
  | 'SC'
  /** Sudan. */
  | 'SD'
  /** Sweden. */
  | 'SE'
  /** Singapore. */
  | 'SG'
  /** St. Helena. */
  | 'SH'
  /** Slovenia. */
  | 'SI'
  /** Svalbard & Jan Mayen. */
  | 'SJ'
  /** Slovakia. */
  | 'SK'
  /** Sierra Leone. */
  | 'SL'
  /** San Marino. */
  | 'SM'
  /** Senegal. */
  | 'SN'
  /** Somalia. */
  | 'SO'
  /** Suriname. */
  | 'SR'
  /** South Sudan. */
  | 'SS'
  /** São Tomé & Príncipe. */
  | 'ST'
  /** El Salvador. */
  | 'SV'
  /** Sint Maarten. */
  | 'SX'
  /** Syria. */
  | 'SY'
  /** Eswatini. */
  | 'SZ'
  /** Tristan da Cunha. */
  | 'TA'
  /** Turks & Caicos Islands. */
  | 'TC'
  /** Chad. */
  | 'TD'
  /** French Southern Territories. */
  | 'TF'
  /** Togo. */
  | 'TG'
  /** Thailand. */
  | 'TH'
  /** Tajikistan. */
  | 'TJ'
  /** Tokelau. */
  | 'TK'
  /** Timor-Leste. */
  | 'TL'
  /** Turkmenistan. */
  | 'TM'
  /** Tunisia. */
  | 'TN'
  /** Tonga. */
  | 'TO'
  /** Türkiye. */
  | 'TR'
  /** Trinidad & Tobago. */
  | 'TT'
  /** Tuvalu. */
  | 'TV'
  /** Taiwan. */
  | 'TW'
  /** Tanzania. */
  | 'TZ'
  /** Ukraine. */
  | 'UA'
  /** Uganda. */
  | 'UG'
  /** U.S. Outlying Islands. */
  | 'UM'
  /** United States. */
  | 'US'
  /** Uruguay. */
  | 'UY'
  /** Uzbekistan. */
  | 'UZ'
  /** Vatican City. */
  | 'VA'
  /** St. Vincent & Grenadines. */
  | 'VC'
  /** Venezuela. */
  | 'VE'
  /** British Virgin Islands. */
  | 'VG'
  /** Vietnam. */
  | 'VN'
  /** Vanuatu. */
  | 'VU'
  /** Wallis & Futuna. */
  | 'WF'
  /** Samoa. */
  | 'WS'
  /** Kosovo. */
  | 'XK'
  /** Yemen. */
  | 'YE'
  /** Mayotte. */
  | 'YT'
  /** South Africa. */
  | 'ZA'
  /** Zambia. */
  | 'ZM'
  /** Zimbabwe. */
  | 'ZW'
  /** Unknown Region. */
  | 'ZZ';

/**
 * The three-letter currency codes that represent the world currencies used in
 * stores. These include standard ISO 4217 codes, legacy codes,
 * and non-standard codes.
 *
 */
export type CurrencyCode =
  /** United Arab Emirates Dirham (AED). */
  | 'AED'
  /** Afghan Afghani (AFN). */
  | 'AFN'
  /** Albanian Lek (ALL). */
  | 'ALL'
  /** Armenian Dram (AMD). */
  | 'AMD'
  /** Netherlands Antillean Guilder. */
  | 'ANG'
  /** Angolan Kwanza (AOA). */
  | 'AOA'
  /** Argentine Pesos (ARS). */
  | 'ARS'
  /** Australian Dollars (AUD). */
  | 'AUD'
  /** Aruban Florin (AWG). */
  | 'AWG'
  /** Azerbaijani Manat (AZN). */
  | 'AZN'
  /** Bosnia and Herzegovina Convertible Mark (BAM). */
  | 'BAM'
  /** Barbadian Dollar (BBD). */
  | 'BBD'
  /** Bangladesh Taka (BDT). */
  | 'BDT'
  /** Bulgarian Lev (BGN). */
  | 'BGN'
  /** Bahraini Dinar (BHD). */
  | 'BHD'
  /** Burundian Franc (BIF). */
  | 'BIF'
  /** Bermudian Dollar (BMD). */
  | 'BMD'
  /** Brunei Dollar (BND). */
  | 'BND'
  /** Bolivian Boliviano (BOB). */
  | 'BOB'
  /** Brazilian Real (BRL). */
  | 'BRL'
  /** Bahamian Dollar (BSD). */
  | 'BSD'
  /** Bhutanese Ngultrum (BTN). */
  | 'BTN'
  /** Botswana Pula (BWP). */
  | 'BWP'
  /** Belarusian Ruble (BYN). */
  | 'BYN'
  /** Belarusian Ruble (BYR). */
  | 'BYR'
  /** Belize Dollar (BZD). */
  | 'BZD'
  /** Canadian Dollars (CAD). */
  | 'CAD'
  /** Congolese franc (CDF). */
  | 'CDF'
  /** Swiss Francs (CHF). */
  | 'CHF'
  /** Chilean Peso (CLP). */
  | 'CLP'
  /** Chinese Yuan Renminbi (CNY). */
  | 'CNY'
  /** Colombian Peso (COP). */
  | 'COP'
  /** Costa Rican Colones (CRC). */
  | 'CRC'
  /** Cape Verdean escudo (CVE). */
  | 'CVE'
  /** Czech Koruny (CZK). */
  | 'CZK'
  /** Djiboutian Franc (DJF). */
  | 'DJF'
  /** Danish Kroner (DKK). */
  | 'DKK'
  /** Dominican Peso (DOP). */
  | 'DOP'
  /** Algerian Dinar (DZD). */
  | 'DZD'
  /** Egyptian Pound (EGP). */
  | 'EGP'
  /** Eritrean Nakfa (ERN). */
  | 'ERN'
  /** Ethiopian Birr (ETB). */
  | 'ETB'
  /** Euro (EUR). */
  | 'EUR'
  /** Fijian Dollars (FJD). */
  | 'FJD'
  /** Falkland Islands Pounds (FKP). */
  | 'FKP'
  /** United Kingdom Pounds (GBP). */
  | 'GBP'
  /** Georgian Lari (GEL). */
  | 'GEL'
  /** Ghanaian Cedi (GHS). */
  | 'GHS'
  /** Gibraltar Pounds (GIP). */
  | 'GIP'
  /** Gambian Dalasi (GMD). */
  | 'GMD'
  /** Guinean Franc (GNF). */
  | 'GNF'
  /** Guatemalan Quetzal (GTQ). */
  | 'GTQ'
  /** Guyanese Dollar (GYD). */
  | 'GYD'
  /** Hong Kong Dollars (HKD). */
  | 'HKD'
  /** Honduran Lempira (HNL). */
  | 'HNL'
  /** Croatian Kuna (HRK). */
  | 'HRK'
  /** Haitian Gourde (HTG). */
  | 'HTG'
  /** Hungarian Forint (HUF). */
  | 'HUF'
  /** Indonesian Rupiah (IDR). */
  | 'IDR'
  /** Israeli New Shekel (NIS). */
  | 'ILS'
  /** Indian Rupees (INR). */
  | 'INR'
  /** Iraqi Dinar (IQD). */
  | 'IQD'
  /** Iranian Rial (IRR). */
  | 'IRR'
  /** Icelandic Kronur (ISK). */
  | 'ISK'
  /** Jersey Pound. */
  | 'JEP'
  /** Jamaican Dollars (JMD). */
  | 'JMD'
  /** Jordanian Dinar (JOD). */
  | 'JOD'
  /** Japanese Yen (JPY). */
  | 'JPY'
  /** Kenyan Shilling (KES). */
  | 'KES'
  /** Kyrgyzstani Som (KGS). */
  | 'KGS'
  /** Cambodian Riel. */
  | 'KHR'
  /** Kiribati Dollar (KID). */
  | 'KID'
  /** Comorian Franc (KMF). */
  | 'KMF'
  /** South Korean Won (KRW). */
  | 'KRW'
  /** Kuwaiti Dinar (KWD). */
  | 'KWD'
  /** Cayman Dollars (KYD). */
  | 'KYD'
  /** Kazakhstani Tenge (KZT). */
  | 'KZT'
  /** Laotian Kip (LAK). */
  | 'LAK'
  /** Lebanese Pounds (LBP). */
  | 'LBP'
  /** Sri Lankan Rupees (LKR). */
  | 'LKR'
  /** Liberian Dollar (LRD). */
  | 'LRD'
  /** Lesotho Loti (LSL). */
  | 'LSL'
  /** Lithuanian Litai (LTL). */
  | 'LTL'
  /** Latvian Lati (LVL). */
  | 'LVL'
  /** Libyan Dinar (LYD). */
  | 'LYD'
  /** Moroccan Dirham. */
  | 'MAD'
  /** Moldovan Leu (MDL). */
  | 'MDL'
  /** Malagasy Ariary (MGA). */
  | 'MGA'
  /** Macedonia Denar (MKD). */
  | 'MKD'
  /** Burmese Kyat (MMK). */
  | 'MMK'
  /** Mongolian Tugrik. */
  | 'MNT'
  /** Macanese Pataca (MOP). */
  | 'MOP'
  /** Mauritanian Ouguiya (MRU). */
  | 'MRU'
  /** Mauritian Rupee (MUR). */
  | 'MUR'
  /** Maldivian Rufiyaa (MVR). */
  | 'MVR'
  /** Malawian Kwacha (MWK). */
  | 'MWK'
  /** Mexican Pesos (MXN). */
  | 'MXN'
  /** Malaysian Ringgits (MYR). */
  | 'MYR'
  /** Mozambican Metical. */
  | 'MZN'
  /** Namibian Dollar. */
  | 'NAD'
  /** Nigerian Naira (NGN). */
  | 'NGN'
  /** Nicaraguan Córdoba (NIO). */
  | 'NIO'
  /** Norwegian Kroner (NOK). */
  | 'NOK'
  /** Nepalese Rupee (NPR). */
  | 'NPR'
  /** New Zealand Dollars (NZD). */
  | 'NZD'
  /** Omani Rial (OMR). */
  | 'OMR'
  /** Panamian Balboa (PAB). */
  | 'PAB'
  /** Peruvian Nuevo Sol (PEN). */
  | 'PEN'
  /** Papua New Guinean Kina (PGK). */
  | 'PGK'
  /** Philippine Peso (PHP). */
  | 'PHP'
  /** Pakistani Rupee (PKR). */
  | 'PKR'
  /** Polish Zlotych (PLN). */
  | 'PLN'
  /** Paraguayan Guarani (PYG). */
  | 'PYG'
  /** Qatari Rial (QAR). */
  | 'QAR'
  /** Romanian Lei (RON). */
  | 'RON'
  /** Serbian dinar (RSD). */
  | 'RSD'
  /** Russian Rubles (RUB). */
  | 'RUB'
  /** Rwandan Franc (RWF). */
  | 'RWF'
  /** Saudi Riyal (SAR). */
  | 'SAR'
  /** Solomon Islands Dollar (SBD). */
  | 'SBD'
  /** Seychellois Rupee (SCR). */
  | 'SCR'
  /** Sudanese Pound (SDG). */
  | 'SDG'
  /** Swedish Kronor (SEK). */
  | 'SEK'
  /** Singapore Dollars (SGD). */
  | 'SGD'
  /** Saint Helena Pounds (SHP). */
  | 'SHP'
  /** Sierra Leonean Leone (SLL). */
  | 'SLL'
  /** Somali Shilling (SOS). */
  | 'SOS'
  /** Surinamese Dollar (SRD). */
  | 'SRD'
  /** South Sudanese Pound (SSP). */
  | 'SSP'
  /** Sao Tome And Principe Dobra (STD). */
  | 'STD'
  /** Sao Tome And Principe Dobra (STN). */
  | 'STN'
  /** Syrian Pound (SYP). */
  | 'SYP'
  /** Swazi Lilangeni (SZL). */
  | 'SZL'
  /** Thai baht (THB). */
  | 'THB'
  /** Tajikistani Somoni (TJS). */
  | 'TJS'
  /** Turkmenistani Manat (TMT). */
  | 'TMT'
  /** Tunisian Dinar (TND). */
  | 'TND'
  /** Tongan Pa'anga (TOP). */
  | 'TOP'
  /** Turkish Lira (TRY). */
  | 'TRY'
  /** Trinidad and Tobago Dollars (TTD). */
  | 'TTD'
  /** Taiwan Dollars (TWD). */
  | 'TWD'
  /** Tanzanian Shilling (TZS). */
  | 'TZS'
  /** Ukrainian Hryvnia (UAH). */
  | 'UAH'
  /** Ugandan Shilling (UGX). */
  | 'UGX'
  /** United States Dollars (USD). */
  | 'USD'
  /** Uruguayan Pesos (UYU). */
  | 'UYU'
  /** Uzbekistan som (UZS). */
  | 'UZS'
  /** Venezuelan Bolivares (VED). */
  | 'VED'
  /** Venezuelan Bolivares (VEF). */
  | 'VEF'
  /** Venezuelan Bolivares Soberanos (VES). */
  | 'VES'
  /** Vietnamese đồng (VND). */
  | 'VND'
  /** Vanuatu Vatu (VUV). */
  | 'VUV'
  /** Samoan Tala (WST). */
  | 'WST'
  /** Central African CFA Franc (XAF). */
  | 'XAF'
  /** East Caribbean Dollar (XCD). */
  | 'XCD'
  /** West African CFA franc (XOF). */
  | 'XOF'
  /** CFP Franc (XPF). */
  | 'XPF'
  /** Unrecognized currency. */
  | 'XXX'
  /** Yemeni Rial (YER). */
  | 'YER'
  /** South African Rand (ZAR). */
  | 'ZAR'
  /** Zambian Kwacha (ZMW). */
  | 'ZMW';

/** Digital wallet, such as Apple Pay, which can be used for accelerated checkouts. */
export type DigitalWallet =
  /** Android Pay. */
  | 'ANDROID_PAY'
  /** Apple Pay. */
  | 'APPLE_PAY'
  /** Google Pay. */
  | 'GOOGLE_PAY'
  /** Shopify Pay. */
  | 'SHOPIFY_PAY';

/**
 * The type of data that the filter group represents.
 *
 * For more information, refer to [Filter products in a collection with the Storefront API]
 * (https://shopify.dev/custom-storefronts/products-collections/filter-products).
 *
 */
export type FilterType =
  /** A boolean value. */
  | 'BOOLEAN'
  /** A list of selectable values. */
  | 'LIST'
  /** A range of prices. */
  | 'PRICE_RANGE';

/**
 * Supported languages for retrieving translated storefront content. Pass a language code to the [`@inContext`](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/in-context) directive to return product titles, descriptions, and other translatable fields in that language.
 *
 * The [`Localization`](https://shopify.dev/docs/api/storefront/current/objects/Localization) object provides the list of available languages for the active country, and each [`Country`](https://shopify.dev/docs/api/storefront/current/objects/Country) in [`availableCountries`](https://shopify.dev/docs/api/storefront/current/objects/Localization#field-Localization.fields.availableCountries) includes its own available languages.
 *
 */
export type LanguageCode =
  /** Afrikaans. */
  | 'AF'
  /** Akan. */
  | 'AK'
  /** Amharic. */
  | 'AM'
  /** Arabic. */
  | 'AR'
  /** Assamese. */
  | 'AS'
  /** Azerbaijani. */
  | 'AZ'
  /** Belarusian. */
  | 'BE'
  /** Bulgarian. */
  | 'BG'
  /** Bambara. */
  | 'BM'
  /** Bangla. */
  | 'BN'
  /** Tibetan. */
  | 'BO'
  /** Breton. */
  | 'BR'
  /** Bosnian. */
  | 'BS'
  /** Catalan. */
  | 'CA'
  /** Chechen. */
  | 'CE'
  /** Central Kurdish. */
  | 'CKB'
  /** Czech. */
  | 'CS'
  /** Church Slavic. */
  | 'CU'
  /** Welsh. */
  | 'CY'
  /** Danish. */
  | 'DA'
  /** German. */
  | 'DE'
  /** Dzongkha. */
  | 'DZ'
  /** Ewe. */
  | 'EE'
  /** Greek. */
  | 'EL'
  /** English. */
  | 'EN'
  /** Esperanto. */
  | 'EO'
  /** Spanish. */
  | 'ES'
  /** Estonian. */
  | 'ET'
  /** Basque. */
  | 'EU'
  /** Persian. */
  | 'FA'
  /** Fulah. */
  | 'FF'
  /** Finnish. */
  | 'FI'
  /** Filipino. */
  | 'FIL'
  /** Faroese. */
  | 'FO'
  /** French. */
  | 'FR'
  /** Western Frisian. */
  | 'FY'
  /** Irish. */
  | 'GA'
  /** Scottish Gaelic. */
  | 'GD'
  /** Galician. */
  | 'GL'
  /** Gujarati. */
  | 'GU'
  /** Manx. */
  | 'GV'
  /** Hausa. */
  | 'HA'
  /** Hebrew. */
  | 'HE'
  /** Hindi. */
  | 'HI'
  /** Croatian. */
  | 'HR'
  /** Hungarian. */
  | 'HU'
  /** Armenian. */
  | 'HY'
  /** Interlingua. */
  | 'IA'
  /** Indonesian. */
  | 'ID'
  /** Igbo. */
  | 'IG'
  /** Sichuan Yi. */
  | 'II'
  /** Icelandic. */
  | 'IS'
  /** Italian. */
  | 'IT'
  /** Japanese. */
  | 'JA'
  /** Javanese. */
  | 'JV'
  /** Georgian. */
  | 'KA'
  /** Kikuyu. */
  | 'KI'
  /** Kazakh. */
  | 'KK'
  /** Kalaallisut. */
  | 'KL'
  /** Khmer. */
  | 'KM'
  /** Kannada. */
  | 'KN'
  /** Korean. */
  | 'KO'
  /** Kashmiri. */
  | 'KS'
  /** Kurdish. */
  | 'KU'
  /** Cornish. */
  | 'KW'
  /** Kyrgyz. */
  | 'KY'
  /** Latin. */
  | 'LA'
  /** Luxembourgish. */
  | 'LB'
  /** Ganda. */
  | 'LG'
  /** Lingala. */
  | 'LN'
  /** Lao. */
  | 'LO'
  /** Lithuanian. */
  | 'LT'
  /** Luba-Katanga. */
  | 'LU'
  /** Latvian. */
  | 'LV'
  /** Malagasy. */
  | 'MG'
  /** Māori. */
  | 'MI'
  /** Macedonian. */
  | 'MK'
  /** Malayalam. */
  | 'ML'
  /** Mongolian. */
  | 'MN'
  /** Moldavian. */
  | 'MO'
  /** Marathi. */
  | 'MR'
  /** Malay. */
  | 'MS'
  /** Maltese. */
  | 'MT'
  /** Burmese. */
  | 'MY'
  /** Norwegian (Bokmål). */
  | 'NB'
  /** North Ndebele. */
  | 'ND'
  /** Nepali. */
  | 'NE'
  /** Dutch. */
  | 'NL'
  /** Norwegian Nynorsk. */
  | 'NN'
  /** Norwegian. */
  | 'NO'
  /** Oromo. */
  | 'OM'
  /** Odia. */
  | 'OR'
  /** Ossetic. */
  | 'OS'
  /** Punjabi. */
  | 'PA'
  /** Polish. */
  | 'PL'
  /** Pashto. */
  | 'PS'
  /** Portuguese. */
  | 'PT'
  /** Portuguese (Brazil). */
  | 'PT_BR'
  /** Portuguese (Portugal). */
  | 'PT_PT'
  /** Quechua. */
  | 'QU'
  /** Romansh. */
  | 'RM'
  /** Rundi. */
  | 'RN'
  /** Romanian. */
  | 'RO'
  /** Russian. */
  | 'RU'
  /** Kinyarwanda. */
  | 'RW'
  /** Sanskrit. */
  | 'SA'
  /** Sardinian. */
  | 'SC'
  /** Sindhi. */
  | 'SD'
  /** Northern Sami. */
  | 'SE'
  /** Sango. */
  | 'SG'
  /** Serbo-Croatian. */
  | 'SH'
  /** Sinhala. */
  | 'SI'
  /** Slovak. */
  | 'SK'
  /** Slovenian. */
  | 'SL'
  /** Shona. */
  | 'SN'
  /** Somali. */
  | 'SO'
  /** Albanian. */
  | 'SQ'
  /** Serbian. */
  | 'SR'
  /** Sundanese. */
  | 'SU'
  /** Swedish. */
  | 'SV'
  /** Swahili. */
  | 'SW'
  /** Tamil. */
  | 'TA'
  /** Telugu. */
  | 'TE'
  /** Tajik. */
  | 'TG'
  /** Thai. */
  | 'TH'
  /** Tigrinya. */
  | 'TI'
  /** Turkmen. */
  | 'TK'
  /** Tongan. */
  | 'TO'
  /** Turkish. */
  | 'TR'
  /** Tatar. */
  | 'TT'
  /** Uyghur. */
  | 'UG'
  /** Ukrainian. */
  | 'UK'
  /** Urdu. */
  | 'UR'
  /** Uzbek. */
  | 'UZ'
  /** Vietnamese. */
  | 'VI'
  /** Volapük. */
  | 'VO'
  /** Wolof. */
  | 'WO'
  /** Xhosa. */
  | 'XH'
  /** Yiddish. */
  | 'YI'
  /** Yoruba. */
  | 'YO'
  /** Chinese. */
  | 'ZH'
  /** Chinese (Simplified). */
  | 'ZH_CN'
  /** Chinese (Traditional). */
  | 'ZH_TW'
  /** Zulu. */
  | 'ZU';

/** A menu item type. */
export type MenuItemType =
  /** An article link. */
  | 'ARTICLE'
  /** A blog link. */
  | 'BLOG'
  /** A catalog link. */
  | 'CATALOG'
  /** A collection link. */
  | 'COLLECTION'
  /** A collection link. */
  | 'COLLECTIONS'
  /** A customer account page link. */
  | 'CUSTOMER_ACCOUNT_PAGE'
  /** A frontpage link. */
  | 'FRONTPAGE'
  /** An http link. */
  | 'HTTP'
  /** A metaobject page link. */
  | 'METAOBJECT'
  /** A page link. */
  | 'PAGE'
  /** A product link. */
  | 'PRODUCT'
  /** A search link. */
  | 'SEARCH'
  /** A shop policy link. */
  | 'SHOP_POLICY';

/**
 * Filters products in a collection by matching a specific metafield value. Used by the [`ProductFilter`](https://shopify.dev/docs/api/storefront/current/input-objects/ProductFilter) input's `productMetafield` and `variantMetafield` fields.
 *
 * Supports the following metafield types: `number_integer`, `number_decimal`, `single_line_text_field`, and `boolean`.
 *
 */
export type MetafieldFilter = {
  /** The key of the metafield to filter on. */
  key: string;
  /** The namespace of the metafield to filter on. */
  namespace: string;
  /** The value of the metafield. */
  value: string;
};

/**
 * A price range for filtering products in a collection. Used by the [`ProductFilter`](https://shopify.dev/docs/api/storefront/current/input-objects/ProductFilter) input's [`price`](https://shopify.dev/docs/api/storefront/current/input-objects/ProductFilter#fields-price) field.
 *
 * > Note: Omitting the [maximum](https://shopify.dev/docs/api/storefront/currents/input-objects/PriceRangeFilter#fields-max) returns all products above the [minimum](https://shopify.dev/docs/api/storefront/current/input-objects/PriceRangeFilter#fields-min).
 *
 */
export type PriceRangeFilter = {
  /** The maximum price in the range. Empty indicates no max price. */
  max?: number | null | undefined;
  /** The minimum price in the range. Defaults to zero. */
  min?: number | null | undefined;
};

/**
 * Sort options for products within a [`Collection`](https://shopify.dev/docs/api/storefront/current/objects/Collection). Used by the [`products`](https://shopify.dev/docs/api/storefront/current/objects/Collection#field-Collection.fields.products) connection to order results by best-selling, price, title, creation date, or the collection's default and manual ordering.
 *
 * > Note: The [`RELEVANCE`](https://shopify.dev/docs/api/storefront/current/enums/ProductCollectionSortKeys#enums-RELEVANCE) key applies only when you specify a search query.
 *
 */
export type ProductCollectionSortKeys =
  /** Sort by the `best-selling` value. */
  | 'BEST_SELLING'
  /** Sort by the `collection-default` value. */
  | 'COLLECTION_DEFAULT'
  /** Sort by the `created` value. */
  | 'CREATED'
  /** Sort by the `id` value. */
  | 'ID'
  /** Sort by the `manual` value. */
  | 'MANUAL'
  /** Sort by the `price` value. */
  | 'PRICE'
  /**
   * Sort by relevance to the search terms when the `query` parameter is specified on the connection.
   * Don't use this sort key when no search query is specified.
   *
   */
  | 'RELEVANCE'
  /** Sort by the `title` value. */
  | 'TITLE';

/**
 * The input fields for a filter used to view a subset of products in a collection.
 * By default, the `available` and `price` filters are enabled. Filters are customized with the Shopify Search & Discovery app.
 * Learn more about [customizing storefront filtering](https://help.shopify.com/manual/online-store/themes/customizing-themes/storefront-filters).
 *
 */
export type ProductFilter = {
  /** Filter on if the product is available for sale. */
  available?: boolean | null | undefined;
  /** A product category to filter on. */
  category?: CategoryFilter | null | undefined;
  /** A range of prices to filter with-in. */
  price?: PriceRangeFilter | null | undefined;
  /** A product metafield to filter on. */
  productMetafield?: MetafieldFilter | null | undefined;
  /** The product type to filter on. */
  productType?: string | null | undefined;
  /** The product vendor to filter on. */
  productVendor?: string | null | undefined;
  /** A product tag to filter on. */
  tag?: string | null | undefined;
  /** A standard product attribute metafield to filter on. */
  taxonomyMetafield?: TaxonomyMetafieldFilter | null | undefined;
  /** A variant metafield to filter on. */
  variantMetafield?: MetafieldFilter | null | undefined;
  /** A variant option to filter on. */
  variantOption?: VariantOptionFilter | null | undefined;
};

/** The set of valid sort keys for the search query. */
export type SearchSortKeys =
  /** Sort by the `price` value. */
  | 'PRICE'
  /** Sort by relevance to the search terms. */
  | 'RELEVANCE';

/** The input fields required for a selected option. */
export type SelectedOptionInput = {
  /** The product option’s name. */
  name: string;
  /** The product option’s value. */
  value: string;
};

/**
 * A filter used to view a subset of products in a collection matching a specific taxonomy metafield value.
 *
 */
export type TaxonomyMetafieldFilter = {
  /** The key of the metafield to filter on. */
  key: string;
  /** The namespace of the metafield to filter on. */
  namespace: string;
  /** The value of the metafield. */
  value: string;
};

/** The input fields for a filter used to view a subset of products in a collection matching a specific variant option. */
export type VariantOptionFilter = {
  /** The name of the variant option to filter on. */
  name: string;
  /** The value of the variant option to filter on. */
  value: string;
};

export type ProductCardFragment = {
  id: string;
  title: string;
  handle: string;
  availableForSale: boolean;
  vendor: string;
  tags: Array<string>;
  featuredImage: {
    id: string | null;
    url: unknown;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
  images: {
    nodes: Array<{
      id: string | null;
      url: unknown;
      altText: string | null;
      width: number | null;
      height: number | null;
    }>;
  };
  priceRange: {
    minVariantPrice: {
      amount: unknown;
      currencyCode: StorefrontAPI.CurrencyCode;
    };
    maxVariantPrice: {
      amount: unknown;
      currencyCode: StorefrontAPI.CurrencyCode;
    };
  };
  compareAtPriceRange: {
    minVariantPrice: {
      amount: unknown;
      currencyCode: StorefrontAPI.CurrencyCode;
    };
  };
  selectedOrFirstAvailableVariant: {
    id: string;
    availableForSale: boolean;
    price: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
    compareAtPrice: {
      amount: unknown;
      currencyCode: StorefrontAPI.CurrencyCode;
    } | null;
  } | null;
  reviewBadge: {value: string} | null;
};

export type CartApiQueryFragment = {
  updatedAt: unknown;
  id: string;
  checkoutUrl: unknown;
  totalQuantity: number;
  note: string | null;
  buyerIdentity: {
    countryCode: StorefrontAPI.CountryCode | null;
    email: string | null;
    phone: string | null;
    customer: {
      id: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      displayName: string;
    } | null;
  };
  lines: {
    edges: Array<{
      node: {
        id: string;
        quantity: number;
        attributes: Array<{key: string; value: string | null}>;
        cost: {
          totalAmount: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
          amountPerQuantity: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
          compareAtAmountPerQuantity: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          } | null;
        };
        discountAllocations: Array<
          | {
              title: string;
              discountedAmount: {
                amount: unknown;
                currencyCode: StorefrontAPI.CurrencyCode;
              };
            }
          | {
              code: string;
              discountedAmount: {
                amount: unknown;
                currencyCode: StorefrontAPI.CurrencyCode;
              };
            }
        >;
        merchandise: {
          id: string;
          availableForSale: boolean;
          requiresShipping: boolean;
          title: string;
          compareAtPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          } | null;
          price: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
          image: {
            id: string | null;
            url: unknown;
            altText: string | null;
            width: number | null;
            height: number | null;
          } | null;
          product: {handle: string; title: string; id: string; vendor: string};
          selectedOptions: Array<{name: string; value: string}>;
        };
      };
    }>;
  };
  cost: {
    subtotalAmount: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
    totalAmount: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
    totalDutyAmount: {
      amount: unknown;
      currencyCode: StorefrontAPI.CurrencyCode;
    } | null;
    totalTaxAmount: {
      amount: unknown;
      currencyCode: StorefrontAPI.CurrencyCode;
    } | null;
  };
  attributes: Array<{key: string; value: string | null}>;
  discountCodes: Array<{applicable: boolean; code: string}>;
  discountAllocations: Array<
    | {
        title: string;
        discountedAmount: {
          amount: unknown;
          currencyCode: StorefrontAPI.CurrencyCode;
        };
      }
    | {
        code: string;
        discountedAmount: {
          amount: unknown;
          currencyCode: StorefrontAPI.CurrencyCode;
        };
      }
  >;
  appliedGiftCards: Array<{
    id: string;
    lastCharacters: string;
    amountUsed: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
  }>;
};

export type CartApiMutationFragment = {
  updatedAt: unknown;
  id: string;
  checkoutUrl: unknown;
  totalQuantity: number;
  note: string | null;
  buyerIdentity: {
    countryCode: StorefrontAPI.CountryCode | null;
    email: string | null;
    phone: string | null;
    customer: {
      id: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      displayName: string;
    } | null;
  };
  lines: {
    edges: Array<{
      node: {
        id: string;
        quantity: number;
        attributes: Array<{key: string; value: string | null}>;
        cost: {
          totalAmount: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
          amountPerQuantity: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
          compareAtAmountPerQuantity: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          } | null;
        };
        discountAllocations: Array<
          | {
              title: string;
              discountedAmount: {
                amount: unknown;
                currencyCode: StorefrontAPI.CurrencyCode;
              };
            }
          | {
              code: string;
              discountedAmount: {
                amount: unknown;
                currencyCode: StorefrontAPI.CurrencyCode;
              };
            }
        >;
        merchandise: {
          id: string;
          availableForSale: boolean;
          requiresShipping: boolean;
          title: string;
          compareAtPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          } | null;
          price: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
          image: {
            id: string | null;
            url: unknown;
            altText: string | null;
            width: number | null;
            height: number | null;
          } | null;
          product: {handle: string; title: string; id: string; vendor: string};
          selectedOptions: Array<{name: string; value: string}>;
        };
      };
    }>;
  };
  cost: {
    subtotalAmount: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
    totalAmount: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
    totalDutyAmount: {
      amount: unknown;
      currencyCode: StorefrontAPI.CurrencyCode;
    } | null;
    totalTaxAmount: {
      amount: unknown;
      currencyCode: StorefrontAPI.CurrencyCode;
    } | null;
  };
  attributes: Array<{key: string; value: string | null}>;
  discountCodes: Array<{applicable: boolean; code: string}>;
  discountAllocations: Array<
    | {
        title: string;
        discountedAmount: {
          amount: unknown;
          currencyCode: StorefrontAPI.CurrencyCode;
        };
      }
    | {
        code: string;
        discountedAmount: {
          amount: unknown;
          currencyCode: StorefrontAPI.CurrencyCode;
        };
      }
  >;
  appliedGiftCards: Array<{
    id: string;
    lastCharacters: string;
    amountUsed: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
  }>;
};

export type StorefrontLocalizationQueryVariables = Exact<{
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
}>;

export type StorefrontLocalizationQuery = {
  localization: {
    language: {
      isoCode: StorefrontAPI.LanguageCode;
      name: string;
      endonymName: string;
    };
    country: {
      isoCode: StorefrontAPI.CountryCode;
      name: string;
      currency: {isoCode: StorefrontAPI.CurrencyCode; symbol: string};
    };
    availableCountries: Array<{
      isoCode: StorefrontAPI.CountryCode;
      name: string;
      currency: {isoCode: StorefrontAPI.CurrencyCode; symbol: string};
    }>;
    availableLanguages: Array<{
      isoCode: StorefrontAPI.LanguageCode;
      name: string;
      endonymName: string;
    }>;
  };
};

export type MainMenuQueryVariables = Exact<{
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
}>;

export type MainMenuQuery = {
  menu: {
    items: Array<{
      id: string;
      title: string;
      type: StorefrontAPI.MenuItemType;
      url: unknown;
      resourceId: string | null;
    }>;
  } | null;
};

export type NavCollectionsQueryVariables = Exact<{
  ids: Array<string | number> | string | number;
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
}>;

export type NavCollectionsQuery = {
  nodes: Array<{
    id: string;
    title: string;
    handle: string;
    image: {
      url: unknown;
      altText: string | null;
      width: number | null;
      height: number | null;
    } | null;
  } | null>;
};

export type NavAllCollectionsQueryVariables = Exact<{
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
  first: number;
  after?: string | null | undefined;
}>;

export type NavAllCollectionsQuery = {
  collections: {
    pageInfo: {hasNextPage: boolean; endCursor: string | null};
    nodes: Array<{
      id: string;
      title: string;
      handle: string;
      image: {
        url: unknown;
        altText: string | null;
        width: number | null;
        height: number | null;
      } | null;
      products: {nodes: Array<{id: string}>};
    }>;
  };
};

export type StoreTrustQueryVariables = Exact<{
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
}>;

export type StoreTrustQuery = {
  shop: {
    refundPolicy: {body: string; url: unknown} | null;
    paymentSettings: {
      acceptedCardBrands: Array<StorefrontAPI.CardBrand>;
      supportedDigitalWallets: Array<StorefrontAPI.DigitalWallet>;
    };
    brand: {logo: {image: {url: unknown} | null} | null} | null;
  };
};

export type SitemapProductsQueryVariables = Exact<{
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
  first: number;
  after?: string | null | undefined;
}>;

export type SitemapProductsQuery = {
  products: {
    nodes: Array<{handle: string; updatedAt: unknown}>;
    pageInfo: {hasNextPage: boolean; endCursor: string | null};
  };
};

export type SitemapCollectionsQueryVariables = Exact<{
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
  first: number;
  after?: string | null | undefined;
}>;

export type SitemapCollectionsQuery = {
  collections: {
    nodes: Array<{handle: string; updatedAt: unknown}>;
    pageInfo: {hasNextPage: boolean; endCursor: string | null};
  };
};

export type SitemapPagesQueryVariables = Exact<{
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
  first: number;
  after?: string | null | undefined;
}>;

export type SitemapPagesQuery = {
  pages: {
    nodes: Array<{handle: string; updatedAt: unknown}>;
    pageInfo: {hasNextPage: boolean; endCursor: string | null};
  };
};

export type SitemapArticlesQueryVariables = Exact<{
  blogHandle: string;
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
  first: number;
  after?: string | null | undefined;
}>;

export type SitemapArticlesQuery = {
  blog: {
    articles: {
      nodes: Array<{handle: string; updatedAt: unknown}>;
      pageInfo: {hasNextPage: boolean; endCursor: string | null};
    };
  } | null;
};

export type HomepageQueryVariables = Exact<{
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
}>;

export type HomepageQuery = {
  newDrops: {
    products: {
      nodes: Array<{
        id: string;
        title: string;
        handle: string;
        availableForSale: boolean;
        vendor: string;
        tags: Array<string>;
        featuredImage: {
          id: string | null;
          url: unknown;
          altText: string | null;
          width: number | null;
          height: number | null;
        } | null;
        images: {
          nodes: Array<{
            id: string | null;
            url: unknown;
            altText: string | null;
            width: number | null;
            height: number | null;
          }>;
        };
        priceRange: {
          minVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
          maxVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
        };
        compareAtPriceRange: {
          minVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
        };
        selectedOrFirstAvailableVariant: {
          id: string;
          availableForSale: boolean;
          price: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
          compareAtPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          } | null;
        } | null;
        reviewBadge: {value: string} | null;
      }>;
    };
  } | null;
  recentlyAdded: {
    products: {
      nodes: Array<{
        id: string;
        title: string;
        handle: string;
        availableForSale: boolean;
        vendor: string;
        tags: Array<string>;
        featuredImage: {
          id: string | null;
          url: unknown;
          altText: string | null;
          width: number | null;
          height: number | null;
        } | null;
        images: {
          nodes: Array<{
            id: string | null;
            url: unknown;
            altText: string | null;
            width: number | null;
            height: number | null;
          }>;
        };
        priceRange: {
          minVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
          maxVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
        };
        compareAtPriceRange: {
          minVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
        };
        selectedOrFirstAvailableVariant: {
          id: string;
          availableForSale: boolean;
          price: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
          compareAtPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          } | null;
        } | null;
        reviewBadge: {value: string} | null;
      }>;
    };
  } | null;
  marqueLegendaire: {
    title: string;
    products: {
      nodes: Array<{
        id: string;
        title: string;
        handle: string;
        availableForSale: boolean;
        vendor: string;
        tags: Array<string>;
        featuredImage: {
          id: string | null;
          url: unknown;
          altText: string | null;
          width: number | null;
          height: number | null;
        } | null;
        images: {
          nodes: Array<{
            id: string | null;
            url: unknown;
            altText: string | null;
            width: number | null;
            height: number | null;
          }>;
        };
        priceRange: {
          minVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
          maxVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
        };
        compareAtPriceRange: {
          minVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
        };
        selectedOrFirstAvailableVariant: {
          id: string;
          availableForSale: boolean;
          price: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
          compareAtPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          } | null;
        } | null;
        reviewBadge: {value: string} | null;
      }>;
    };
  } | null;
};

export type ChatProductSearchQueryVariables = Exact<{
  query: string;
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
}>;

export type ChatProductSearchQuery = {
  products: {
    nodes: Array<{
      title: string;
      handle: string;
      availableForSale: boolean;
      priceRange: {
        minVariantPrice: {
          amount: unknown;
          currencyCode: StorefrontAPI.CurrencyCode;
        };
      };
    }>;
  };
};

export type QuickAddProductQueryVariables = Exact<{
  handle: string;
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
}>;

export type QuickAddProductQuery = {
  product: {
    id: string;
    title: string;
    handle: string;
    featuredImage: {
      url: unknown;
      altText: string | null;
      width: number | null;
      height: number | null;
    } | null;
    options: Array<{
      name: string;
      optionValues: Array<{
        name: string;
        swatch: {
          color: unknown;
          image: {previewImage: {url: unknown} | null} | null;
        } | null;
      }>;
    }>;
    variants: {
      nodes: Array<{
        id: string;
        availableForSale: boolean;
        selectedOptions: Array<{name: string; value: string}>;
        price: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
        compareAtPrice: {
          amount: unknown;
          currencyCode: StorefrontAPI.CurrencyCode;
        } | null;
        image: {
          url: unknown;
          altText: string | null;
          width: number | null;
          height: number | null;
        } | null;
      }>;
    };
  } | null;
};

export type PredictiveSearchQueryVariables = Exact<{
  query: string;
  limit?: number | null | undefined;
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
}>;

export type PredictiveSearchQuery = {
  predictiveSearch: {
    products: Array<{
      id: string;
      title: string;
      handle: string;
      vendor: string;
      featuredImage: {
        url: unknown;
        altText: string | null;
        width: number | null;
        height: number | null;
      } | null;
      priceRange: {
        minVariantPrice: {
          amount: unknown;
          currencyCode: StorefrontAPI.CurrencyCode;
        };
      };
      reviewBadge: {value: string} | null;
    }>;
    collections: Array<{
      id: string;
      title: string;
      handle: string;
      image: {
        url: unknown;
        altText: string | null;
        width: number | null;
        height: number | null;
      } | null;
    }>;
    queries: Array<{text: string}>;
  } | null;
};

export type CollectionQueryVariables = Exact<{
  handle: string;
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
  first?: number | null | undefined;
  last?: number | null | undefined;
  startCursor?: string | null | undefined;
  endCursor?: string | null | undefined;
  sortKey?: StorefrontAPI.ProductCollectionSortKeys | null | undefined;
  reverse?: boolean | null | undefined;
  filters?:
    | Array<StorefrontAPI.ProductFilter>
    | StorefrontAPI.ProductFilter
    | null
    | undefined;
}>;

export type CollectionQuery = {
  collection: {
    id: string;
    title: string;
    description: string;
    handle: string;
    image: {
      url: unknown;
      altText: string | null;
      width: number | null;
      height: number | null;
    } | null;
    products: {
      nodes: Array<{
        id: string;
        title: string;
        handle: string;
        availableForSale: boolean;
        vendor: string;
        tags: Array<string>;
        featuredImage: {
          id: string | null;
          url: unknown;
          altText: string | null;
          width: number | null;
          height: number | null;
        } | null;
        images: {
          nodes: Array<{
            id: string | null;
            url: unknown;
            altText: string | null;
            width: number | null;
            height: number | null;
          }>;
        };
        priceRange: {
          minVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
          maxVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
        };
        compareAtPriceRange: {
          minVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
        };
        selectedOrFirstAvailableVariant: {
          id: string;
          availableForSale: boolean;
          price: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
          compareAtPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          } | null;
        } | null;
        reviewBadge: {value: string} | null;
      }>;
      pageInfo: {
        hasPreviousPage: boolean;
        hasNextPage: boolean;
        startCursor: string | null;
        endCursor: string | null;
      };
      filters: Array<{
        id: string;
        label: string;
        type: StorefrontAPI.FilterType;
        values: Array<{
          count: number;
          id: string;
          label: string;
          input: unknown;
        }>;
      }>;
    };
  } | null;
};

export type CollectionsQueryVariables = Exact<{
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
  first: number;
  after?: string | null | undefined;
}>;

export type CollectionsQuery = {
  collections: {
    pageInfo: {hasNextPage: boolean; endCursor: string | null};
    nodes: Array<{
      id: string;
      title: string;
      handle: string;
      description: string;
      image: {
        url: unknown;
        altText: string | null;
        width: number | null;
        height: number | null;
      } | null;
      products: {nodes: Array<{id: string}>};
    }>;
  };
};

export type ArticleQueryVariables = Exact<{
  blogHandle: string;
  articleHandle: string;
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
}>;

export type ArticleQuery = {
  blog: {
    articleByHandle: {
      id: string;
      title: string;
      handle: string;
      publishedAt: unknown;
      contentHtml: unknown;
      excerpt: string | null;
      tags: Array<string>;
      image: {
        url: unknown;
        altText: string | null;
        width: number | null;
        height: number | null;
      } | null;
      author: {name: string; bio: string | null} | null;
      blog: {title: string; handle: string};
    } | null;
  } | null;
};

export type BlogQueryVariables = Exact<{
  blogHandle: string;
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
  first: number;
}>;

export type BlogQuery = {
  blog: {
    title: string;
    articles: {
      nodes: Array<{
        id: string;
        title: string;
        handle: string;
        publishedAt: unknown;
        excerpt: string | null;
        image: {
          url: unknown;
          altText: string | null;
          width: number | null;
          height: number | null;
        } | null;
        author: {name: string} | null;
      }>;
    };
  } | null;
};

export type PageQueryVariables = Exact<{
  handle: string;
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
}>;

export type PageQuery = {
  page: {
    id: string;
    title: string;
    body: unknown;
    metafield: {value: string} | null;
  } | null;
};

export type PolicyQueryVariables = Exact<{
  handle: string;
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
}>;

export type PolicyQuery = {
  page: {id: string; title: string; body: unknown} | null;
  shop: {
    refundPolicy: {title: string; body: string; url: unknown} | null;
    termsOfService: {title: string; body: string; url: unknown} | null;
    shippingPolicy: {title: string; body: string; url: unknown} | null;
    privacyPolicy: {title: string; body: string; url: unknown} | null;
  };
};

export type ProductVariantFragment = {
  id: string;
  sku: string | null;
  availableForSale: boolean;
  quantityAvailable: number | null;
  selectedOptions: Array<{name: string; value: string}>;
  price: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
  compareAtPrice: {
    amount: unknown;
    currencyCode: StorefrontAPI.CurrencyCode;
  } | null;
  image: {
    url: unknown;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
};

export type ProductQueryVariables = Exact<{
  handle: string;
  selectedOptions:
    | Array<StorefrontAPI.SelectedOptionInput>
    | StorefrontAPI.SelectedOptionInput;
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
}>;

export type ProductQuery = {
  product: {
    id: string;
    title: string;
    handle: string;
    descriptionHtml: unknown;
    tags: Array<string>;
    vendor: string;
    productType: string;
    metafields: Array<{
      key: string;
      value: string;
      type: string;
      reference: {
        image: {
          url: unknown;
          altText: string | null;
          width: number | null;
          height: number | null;
        } | null;
      } | null;
    } | null>;
    images: {
      nodes: Array<{
        id: string | null;
        url: unknown;
        altText: string | null;
        width: number | null;
        height: number | null;
      }>;
    };
    options: Array<{
      id: string;
      name: string;
      optionValues: Array<{
        name: string;
        swatch: {
          color: unknown;
          image: {previewImage: {url: unknown} | null} | null;
        } | null;
      }>;
    }>;
    selectedVariant: {
      id: string;
      sku: string | null;
      availableForSale: boolean;
      quantityAvailable: number | null;
      selectedOptions: Array<{name: string; value: string}>;
      price: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
      compareAtPrice: {
        amount: unknown;
        currencyCode: StorefrontAPI.CurrencyCode;
      } | null;
      image: {
        url: unknown;
        altText: string | null;
        width: number | null;
        height: number | null;
      } | null;
    } | null;
    variants: {
      nodes: Array<{
        id: string;
        sku: string | null;
        availableForSale: boolean;
        quantityAvailable: number | null;
        selectedOptions: Array<{name: string; value: string}>;
        price: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
        compareAtPrice: {
          amount: unknown;
          currencyCode: StorefrontAPI.CurrencyCode;
        } | null;
        image: {
          url: unknown;
          altText: string | null;
          width: number | null;
          height: number | null;
        } | null;
      }>;
    };
  } | null;
  relatedProducts: {
    products: {
      nodes: Array<{
        id: string;
        title: string;
        handle: string;
        availableForSale: boolean;
        vendor: string;
        tags: Array<string>;
        featuredImage: {
          id: string | null;
          url: unknown;
          altText: string | null;
          width: number | null;
          height: number | null;
        } | null;
        images: {
          nodes: Array<{
            id: string | null;
            url: unknown;
            altText: string | null;
            width: number | null;
            height: number | null;
          }>;
        };
        priceRange: {
          minVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
          maxVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
        };
        compareAtPriceRange: {
          minVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
        };
        selectedOrFirstAvailableVariant: {
          id: string;
          availableForSale: boolean;
          price: {amount: unknown; currencyCode: StorefrontAPI.CurrencyCode};
          compareAtPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          } | null;
        } | null;
        reviewBadge: {value: string} | null;
      }>;
    };
  } | null;
};

export type SearchQueryVariables = Exact<{
  query: string;
  first?: number | null | undefined;
  last?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
  sortKey?: StorefrontAPI.SearchSortKeys | null | undefined;
  reverse?: boolean | null | undefined;
  availableV2?: boolean | null | undefined;
  productType?: string | null | undefined;
  productVendor?: string | null | undefined;
  minPrice?: number | null | undefined;
  maxPrice?: number | null | undefined;
  country?: StorefrontAPI.CountryCode | null | undefined;
  language?: StorefrontAPI.LanguageCode | null | undefined;
}>;

export type SearchQuery = {
  search: {
    totalCount: number;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
    products: Array<{
      cursor: string;
      node: {
        id: string;
        title: string;
        handle: string;
        vendor: string;
        productType: string;
        availableForSale: boolean;
        tags: Array<string>;
        description: string;
        featuredImage: {
          id: string | null;
          url: unknown;
          altText: string | null;
          width: number | null;
          height: number | null;
        } | null;
        priceRange: {
          minVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
          maxVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
        };
        compareAtPriceRange: {
          minVariantPrice: {
            amount: unknown;
            currencyCode: StorefrontAPI.CurrencyCode;
          };
        };
        reviewBadge: {value: string} | null;
      };
    }>;
    productFilters: Array<{
      id: string;
      label: string;
      type: StorefrontAPI.FilterType;
      values: Array<{label: string; input: unknown; count: number}>;
    }>;
  };
};

interface GeneratedQueryTypes {
  '#graphql\n  query StorefrontLocalization($country: CountryCode, $language: LanguageCode)\n    @inContext(country: $country, language: $language) {\n    localization {\n      language {\n        isoCode\n        name\n        endonymName\n      }\n      country {\n        isoCode\n        name\n        currency {\n          isoCode\n          symbol\n        }\n      }\n      availableCountries {\n        isoCode\n        name\n        currency {\n          isoCode\n          symbol\n        }\n      }\n      availableLanguages {\n        isoCode\n        name\n        endonymName\n      }\n    }\n  }\n': {
    return: StorefrontLocalizationQuery;
    variables: StorefrontLocalizationQueryVariables;
  };
  '#graphql\n  query MainMenu($country: CountryCode, $language: LanguageCode)\n    @inContext(country: $country, language: $language) {\n    menu(handle: "main-menu") {\n      items {\n        id\n        title\n        type\n        url\n        resourceId\n      }\n    }\n  }\n': {
    return: MainMenuQuery;
    variables: MainMenuQueryVariables;
  };
  '#graphql\n  query NavCollections($ids: [ID!]!, $country: CountryCode, $language: LanguageCode)\n    @inContext(country: $country, language: $language) {\n    nodes(ids: $ids) {\n      ... on Collection {\n        id\n        title\n        handle\n        image {\n          url\n          altText\n          width\n          height\n        }\n      }\n    }\n  }\n': {
    return: NavCollectionsQuery;
    variables: NavCollectionsQueryVariables;
  };
  '#graphql\n  query NavAllCollections($country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)\n    @inContext(country: $country, language: $language) {\n    collections(first: $first, after: $after, sortKey: ID, reverse: true) {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      nodes {\n        id\n        title\n        handle\n        image {\n          url\n          altText\n          width\n          height\n        }\n        products(first: 1) {\n          nodes {\n            id\n          }\n        }\n      }\n    }\n  }\n': {
    return: NavAllCollectionsQuery;
    variables: NavAllCollectionsQueryVariables;
  };
  '#graphql\n  query StoreTrust($country: CountryCode, $language: LanguageCode)\n    @inContext(country: $country, language: $language) {\n    shop {\n      refundPolicy { body url }\n      paymentSettings { acceptedCardBrands supportedDigitalWallets }\n      brand { logo { image { url } } }\n    }\n  }\n': {
    return: StoreTrustQuery;
    variables: StoreTrustQueryVariables;
  };
  '#graphql\n  query SitemapProducts($country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)\n    @inContext(country: $country, language: $language) {\n    products(first: $first, after: $after) { nodes { handle updatedAt } pageInfo { hasNextPage endCursor } }\n  }\n': {
    return: SitemapProductsQuery;
    variables: SitemapProductsQueryVariables;
  };
  '#graphql\n  query SitemapCollections($country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)\n    @inContext(country: $country, language: $language) {\n    collections(first: $first, after: $after) { nodes { handle updatedAt } pageInfo { hasNextPage endCursor } }\n  }\n': {
    return: SitemapCollectionsQuery;
    variables: SitemapCollectionsQueryVariables;
  };
  '#graphql\n  query SitemapPages($country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)\n    @inContext(country: $country, language: $language) {\n    pages(first: $first, after: $after) { nodes { handle updatedAt } pageInfo { hasNextPage endCursor } }\n  }\n': {
    return: SitemapPagesQuery;
    variables: SitemapPagesQueryVariables;
  };
  '#graphql\n  query SitemapArticles($blogHandle: String!, $country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)\n    @inContext(country: $country, language: $language) {\n    blog(handle: $blogHandle) {\n      articles(first: $first, after: $after) { nodes { handle updatedAt: publishedAt } pageInfo { hasNextPage endCursor } }\n    }\n  }\n': {
    return: SitemapArticlesQuery;
    variables: SitemapArticlesQueryVariables;
  };
  '#graphql\n  #graphql\n  fragment ProductCard on Product {\n    id\n    title\n    handle\n    availableForSale\n    vendor\n    featuredImage {\n      id\n      url\n      altText\n      width\n      height\n    }\n    images(first: 2) {\n      nodes {\n        id\n        url\n        altText\n        width\n        height\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n      maxVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    tags\n    # Used by the product card\'s "Quick Add" button to add a variant to the\n    # cart without navigating to the PDP. Falls back to the first available\n    # variant when no options are pre-selected — correct for the common case\n    # of single-variant products or a "just add the default" quick action.\n    selectedOrFirstAvailableVariant(\n      selectedOptions: []\n      ignoreUnknownOptions: true\n      caseInsensitiveMatch: true\n    ) {\n      id\n      availableForSale\n      price {\n        amount\n        currencyCode\n      }\n      compareAtPrice {\n        amount\n        currencyCode\n      }\n    }\n    # Judge.me\'s synced rating/review-count badge -- real data, not\n    # fabricated. Absent until a product has its first review; the card\n    # simply omits the star row in that case (see StarRating).\n    reviewBadge: metafield(namespace: "judgeme", key: "badge") {\n      value\n    }\n  }\n\n  query Homepage($country: CountryCode, $language: LanguageCode)\n    @inContext(country: $country, language: $language) {\n    newDrops: collection(handle: "all-products") {\n      products(first: 8, sortKey: CREATED, reverse: true) {\n        nodes {\n          ...ProductCard\n        }\n      }\n    }\n    recentlyAdded: collection(handle: "all-products") {\n      products(first: 20, sortKey: CREATED, reverse: true) {\n        nodes {\n          ...ProductCard\n        }\n      }\n    }\n    marqueLegendaire: collection(handle: "marque-legendaire-luxury-streetwear") {\n      title\n      products(first: 4, sortKey: BEST_SELLING) {\n        nodes {\n          ...ProductCard\n        }\n      }\n    }\n  }\n': {
    return: HomepageQuery;
    variables: HomepageQueryVariables;
  };
  '#graphql\n  query ChatProductSearch($query: String!, $country: CountryCode, $language: LanguageCode)\n    @inContext(country: $country, language: $language) {\n    products(first: 5, query: $query) {\n      nodes {\n        title\n        handle\n        availableForSale\n        priceRange {\n          minVariantPrice { amount currencyCode }\n        }\n      }\n    }\n  }\n': {
    return: ChatProductSearchQuery;
    variables: ChatProductSearchQueryVariables;
  };
  '#graphql\n  query QuickAddProduct($handle: String!, $country: CountryCode, $language: LanguageCode)\n    @inContext(country: $country, language: $language) {\n    product(handle: $handle) {\n      id\n      title\n      handle\n      featuredImage { url altText width height }\n      options {\n        name\n        optionValues {\n          name\n          swatch {\n            color\n            image { previewImage { url } }\n          }\n        }\n      }\n      variants(first: 100) {\n        nodes {\n          id\n          availableForSale\n          selectedOptions { name value }\n          price { amount currencyCode }\n          compareAtPrice { amount currencyCode }\n          image { url altText width height }\n        }\n      }\n    }\n  }\n': {
    return: QuickAddProductQuery;
    variables: QuickAddProductQueryVariables;
  };
  '#graphql\n  query PredictiveSearch($query: String!, $limit: Int = 6, $country: CountryCode, $language: LanguageCode)\n    @inContext(country: $country, language: $language) {\n    predictiveSearch(query: $query, limit: $limit, unavailableProducts: HIDE) {\n      products {\n        id\n        title\n        handle\n        vendor\n        featuredImage { url altText width height }\n        priceRange {\n          minVariantPrice {\n            amount\n            currencyCode\n          }\n        }\n        reviewBadge: metafield(namespace: "judgeme", key: "badge") {\n          value\n        }\n      }\n      collections {\n        id\n        title\n        handle\n        image { url altText width height }\n      }\n      queries {\n        text\n      }\n    }\n  }\n': {
    return: PredictiveSearchQuery;
    variables: PredictiveSearchQueryVariables;
  };
  '#graphql\n  #graphql\n  fragment ProductCard on Product {\n    id\n    title\n    handle\n    availableForSale\n    vendor\n    featuredImage {\n      id\n      url\n      altText\n      width\n      height\n    }\n    images(first: 2) {\n      nodes {\n        id\n        url\n        altText\n        width\n        height\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n      maxVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    tags\n    # Used by the product card\'s "Quick Add" button to add a variant to the\n    # cart without navigating to the PDP. Falls back to the first available\n    # variant when no options are pre-selected — correct for the common case\n    # of single-variant products or a "just add the default" quick action.\n    selectedOrFirstAvailableVariant(\n      selectedOptions: []\n      ignoreUnknownOptions: true\n      caseInsensitiveMatch: true\n    ) {\n      id\n      availableForSale\n      price {\n        amount\n        currencyCode\n      }\n      compareAtPrice {\n        amount\n        currencyCode\n      }\n    }\n    # Judge.me\'s synced rating/review-count badge -- real data, not\n    # fabricated. Absent until a product has its first review; the card\n    # simply omits the star row in that case (see StarRating).\n    reviewBadge: metafield(namespace: "judgeme", key: "badge") {\n      value\n    }\n  }\n\n  query Collection(\n    $handle: String!\n    $country: CountryCode\n    $language: LanguageCode\n    $first: Int\n    $last: Int\n    $startCursor: String\n    $endCursor: String\n    $sortKey: ProductCollectionSortKeys\n    $reverse: Boolean\n    $filters: [ProductFilter!]\n  ) @inContext(country: $country, language: $language) {\n    collection(handle: $handle) {\n      id\n      title\n      description\n      handle\n      image {\n        url\n        altText\n        width\n        height\n      }\n      products(\n        first: $first\n        last: $last\n        before: $startCursor\n        after: $endCursor\n        sortKey: $sortKey\n        reverse: $reverse\n        filters: $filters\n      ) {\n        nodes {\n          ...ProductCard\n        }\n        pageInfo {\n          hasPreviousPage\n          hasNextPage\n          startCursor\n          endCursor\n        }\n        filters {\n          id\n          label\n          type\n          values {\n            count\n            id\n            label\n            input\n          }\n        }\n      }\n    }\n  }\n': {
    return: CollectionQuery;
    variables: CollectionQueryVariables;
  };
  '#graphql\n  query Collections($country: CountryCode, $language: LanguageCode, $first: Int!, $after: String)\n    @inContext(country: $country, language: $language) {\n    collections(first: $first, after: $after, sortKey: UPDATED_AT) {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      nodes {\n        id\n        title\n        handle\n        description\n        image {\n          url\n          altText\n          width\n          height\n        }\n        products(first: 1) {\n          nodes {\n            id\n          }\n        }\n      }\n    }\n  }\n': {
    return: CollectionsQuery;
    variables: CollectionsQueryVariables;
  };
  '#graphql\n  query Article(\n    $blogHandle: String!\n    $articleHandle: String!\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    blog(handle: $blogHandle) {\n      articleByHandle(handle: $articleHandle) {\n        id\n        title\n        handle\n        publishedAt\n        contentHtml\n        excerpt\n        tags\n        image { url altText width height }\n        author: authorV2 { name bio }\n        blog { title handle }\n      }\n    }\n  }\n': {
    return: ArticleQuery;
    variables: ArticleQueryVariables;
  };
  '#graphql\n  query Blog(\n    $blogHandle: String!\n    $country: CountryCode\n    $language: LanguageCode\n    $first: Int!\n  ) @inContext(country: $country, language: $language) {\n    blog(handle: $blogHandle) {\n      title\n      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {\n        nodes {\n          id\n          title\n          handle\n          publishedAt\n          excerpt\n          image { url altText width height }\n          author: authorV2 { name }\n        }\n      }\n    }\n  }\n': {
    return: BlogQuery;
    variables: BlogQueryVariables;
  };
  '#graphql\n  query Page($handle: String!, $country: CountryCode, $language: LanguageCode)\n    @inContext(country: $country, language: $language) {\n    page(handle: $handle) {\n      id\n      title\n      body\n      metafield(namespace: "custom", key: "content_blocks") {\n        value\n      }\n    }\n  }\n': {
    return: PageQuery;
    variables: PageQueryVariables;
  };
  '#graphql\n  query Policy(\n    $handle: String!\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    page(handle: $handle) {\n      id\n      title\n      body\n    }\n    shop {\n      refundPolicy { title body url }\n      termsOfService { title body url }\n      shippingPolicy { title body url }\n      privacyPolicy { title body url }\n    }\n  }\n': {
    return: PolicyQuery;
    variables: PolicyQueryVariables;
  };
  '#graphql\n  #graphql\n  fragment ProductVariant on ProductVariant {\n    id\n    sku\n    availableForSale\n    quantityAvailable\n    selectedOptions { name value }\n    price { amount currencyCode }\n    compareAtPrice { amount currencyCode }\n    image { url altText width height }\n  }\n\n  #graphql\n  fragment ProductCard on Product {\n    id\n    title\n    handle\n    availableForSale\n    vendor\n    featuredImage {\n      id\n      url\n      altText\n      width\n      height\n    }\n    images(first: 2) {\n      nodes {\n        id\n        url\n        altText\n        width\n        height\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n      maxVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        amount\n        currencyCode\n      }\n    }\n    tags\n    # Used by the product card\'s "Quick Add" button to add a variant to the\n    # cart without navigating to the PDP. Falls back to the first available\n    # variant when no options are pre-selected — correct for the common case\n    # of single-variant products or a "just add the default" quick action.\n    selectedOrFirstAvailableVariant(\n      selectedOptions: []\n      ignoreUnknownOptions: true\n      caseInsensitiveMatch: true\n    ) {\n      id\n      availableForSale\n      price {\n        amount\n        currencyCode\n      }\n      compareAtPrice {\n        amount\n        currencyCode\n      }\n    }\n    # Judge.me\'s synced rating/review-count badge -- real data, not\n    # fabricated. Absent until a product has its first review; the card\n    # simply omits the star row in that case (see StarRating).\n    reviewBadge: metafield(namespace: "judgeme", key: "badge") {\n      value\n    }\n  }\n\n  query Product(\n    $handle: String!\n    $selectedOptions: [SelectedOptionInput!]!\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    product(handle: $handle) {\n      id\n      title\n      handle\n      descriptionHtml\n      tags\n      vendor\n      productType\n      metafields(identifiers: [\n        {namespace: "custom", key: "material"}\n        {namespace: "custom", key: "fit"}\n        {namespace: "custom", key: "care"}\n        {namespace: "custom", key: "size_chart"}\n        {namespace: "judgeme", key: "badge"}\n        {namespace: "judgeme", key: "widget"}\n        {namespace: "reviews", key: "rating"}\n        {namespace: "reviews", key: "rating_count"}\n      ]) {\n        key\n        value\n        type\n        reference {\n          ... on MediaImage {\n            image { url altText width height }\n          }\n        }\n      }\n      images(first: 10) {\n        nodes { id url altText width height }\n      }\n      options {\n        id\n        name\n        optionValues {\n          name\n          swatch {\n            color\n            image {\n              previewImage {\n                url\n              }\n            }\n          }\n        }\n      }\n      selectedVariant: variantBySelectedOptions(\n        selectedOptions: $selectedOptions\n        ignoreUnknownOptions: true\n        caseInsensitiveMatch: true\n      ) {\n        ...ProductVariant\n      }\n      variants(first: 100) {\n        nodes { ...ProductVariant }\n      }\n    }\n    relatedProducts: collection(handle: "all-products") {\n      products(first: 4, sortKey: BEST_SELLING) {\n        nodes { ...ProductCard }\n      }\n    }\n  }\n': {
    return: ProductQuery;
    variables: ProductQueryVariables;
  };
  '#graphql\n  query Search(\n    $query: String!\n    $first: Int\n    $last: Int\n    $after: String\n    $before: String\n    $sortKey: SearchSortKeys\n    $reverse: Boolean\n    $availableV2: Boolean\n    $productType: String\n    $productVendor: String\n    $minPrice: Float\n    $maxPrice: Float\n    $country: CountryCode\n    $language: LanguageCode\n  ) @inContext(country: $country, language: $language) {\n    search(\n      query: $query\n      first: $first\n      last: $last\n      after: $after\n      before: $before\n      sortKey: $sortKey\n      reverse: $reverse\n      productFilters: [\n        {productVendor: $productVendor}\n        {productType: $productType}\n        {available: $availableV2}\n        {price: {min: $minPrice, max: $maxPrice}}\n      ]\n    ) {\n      totalCount\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n      products: edges {\n        cursor\n        node {\n          ... on Product {\n            id\n            title\n            handle\n            vendor\n            productType\n            availableForSale\n            tags\n            description\n            featuredImage {\n              id\n              url\n              altText\n              width\n              height\n            }\n            priceRange {\n              minVariantPrice {\n                amount\n                currencyCode\n              }\n              maxVariantPrice {\n                amount\n                currencyCode\n              }\n            }\n            compareAtPriceRange {\n              minVariantPrice {\n                amount\n                currencyCode\n              }\n            }\n            reviewBadge: metafield(namespace: "judgeme", key: "badge") {\n              value\n            }\n          }\n        }\n      }\n      productFilters {\n        id\n        label\n        type\n        values {\n          label\n          input\n          count\n        }\n      }\n    }\n  }\n': {
    return: SearchQuery;
    variables: SearchQueryVariables;
  };
}

interface GeneratedMutationTypes {}

declare module '@shopify/hydrogen' {
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
