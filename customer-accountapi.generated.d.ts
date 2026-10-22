/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends {[key: string]: unknown}> = {[K in keyof T]: T[K]};
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | {[P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never};
import type * as CustomerAccountAPI from '@shopify/hydrogen/customer-account-api-types';

/**
 * The code designating a country/region, which generally follows ISO 3166-1 alpha-2 guidelines.
 * If a territory doesn't have a country code value in the `CountryCode` enum, then it might be considered a subdivision
 * of another country. For example, the territories associated with Spain are represented by the country code `ES`,
 * and the territories associated with the United States of America are represented by the country code `US`.
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
 * The currency codes that represent the world currencies throughout the Admin API. Currency codes include
 * [standard ISO 4217 codes](https://en.wikipedia.org/wiki/ISO_4217), legacy codes, non-standard codes,
 * digital currency codes.
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
  /** United States Dollars Coin (USDC). */
  | 'USDC'
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

/** The input fields to create or update a mailing address. */
export type CustomerAddressInput = {
  /** The first line of the address. Typically the street address or PO Box number. */
  address1?: string | null | undefined;
  /** The second line of the address. Typically the apartment, suite, or unit number. */
  address2?: string | null | undefined;
  /** The name of the city, district, village, or town. */
  city?: string | null | undefined;
  /** The name of the customer's company or organization. */
  company?: string | null | undefined;
  /** The first name of the customer. */
  firstName?: string | null | undefined;
  /** The last name of the customer. */
  lastName?: string | null | undefined;
  /** The customer's unique phone number, formatted using E.164 standard. For example, _+16135551111_. */
  phoneNumber?: string | null | undefined;
  /**
   * The country code, in ISO 3166-1 format. Accepts either a two-letter [alpha-2 code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2),
   * a three-letter [alpha-3 code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3), or a three-digit [numeric code](https://en.wikipedia.org/wiki/ISO_3166-1_numeric).
   * For example, `US`,  `USA`, or `840` represents the United States.
   */
  territoryCode?: string | null | undefined;
  /** The zip or postal code of the address. */
  zip?: string | null | undefined;
  /**
   * The alphanumeric code for the region of the address, such as the province, state, or district.
   * For example, 'ON' for Ontario, Canada.
   */
  zoneCode?: string | null | undefined;
};

/** The input fields to update a customer's personal information. */
export type CustomerUpdateInput = {
  /** The customer's first name. */
  firstName?: string | null | undefined;
  /** The customer's last name. */
  lastName?: string | null | undefined;
};

/** The status of a fulfillment. */
export type FulfillmentStatus =
  /** The fulfillment was canceled. */
  | 'CANCELLED'
  /** There was an error with the fulfillment request. */
  | 'ERROR'
  /** The fulfillment request failed. */
  | 'FAILURE'
  /** The third-party fulfillment service has acknowledged the fulfillment and is processing it. */
  | 'OPEN'
  /** Shopify has created the fulfillment and is waiting for the third-party fulfillment service to transition it to `open` or `success`. */
  | 'PENDING'
  /** The fulfillment was completed successfully. */
  | 'SUCCESS';

/** The input fields for a metafield value to set. */
export type MetafieldsSetInput = {
  /** The `compareDigest` value obtained from a previous query. Provide this with updates to ensure the metafield is modified safely. */
  compareDigest?: string | null | undefined;
  /**
   * The unique identifier for a metafield within its namespace.
   * Must be 2-64 characters long and can contain alphanumeric, hyphen, and underscore characters.
   */
  key: string;
  /**
   * The container for a group of metafields that the metafield is or will be associated with. Used in tandem
   * with `key` to lookup a metafield on a resource, preventing conflicts with other metafields with the
   * same `key`.
   * Must be 3-255 characters long and can contain alphanumeric, hyphen, and underscore characters.
   */
  namespace: string;
  /** The unique ID of the resource that the metafield is attached to. */
  ownerId: string | number;
  /**
   * The type of data that is stored in the metafield.
   * The type must be one of the [supported types](https://shopify.dev/apps/metafields/types).
   * Required when there is no corresponding definition for the given `namespace`, `key`, and
   * owner resource type (derived from `ownerId`).
   */
  type?: string | null | undefined;
  /** The data stored in the metafield. Always stored as a string, regardless of the metafield's type. */
  value: string;
};

export type CustomerQueryVariables = Exact<{[key: string]: never}>;

export type CustomerQuery = {
  customer: {
    firstName: string | null;
    lastName: string | null;
    emailAddress: {emailAddress: string | null} | null;
  };
};

export type AddressesQueryVariables = Exact<{
  first: number;
  after?: string | null | undefined;
}>;

export type AddressesQuery = {
  customer: {
    id: string;
    defaultAddress: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      address1: string | null;
      address2: string | null;
      city: string | null;
      province: string | null;
      zip: string | null;
      country: string | null;
      territoryCode: CustomerAccountAPI.CountryCode | null;
      zoneCode: string | null;
      phoneNumber: string | null;
    } | null;
    addresses: {
      pageInfo: {hasNextPage: boolean; endCursor: string | null};
      nodes: Array<{
        id: string;
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        address1: string | null;
        address2: string | null;
        city: string | null;
        province: string | null;
        zip: string | null;
        country: string | null;
        territoryCode: CustomerAccountAPI.CountryCode | null;
        zoneCode: string | null;
        phoneNumber: string | null;
      }>;
    };
  };
};

export type CustomerAddressCreateMutationVariables = Exact<{
  address: CustomerAccountAPI.CustomerAddressInput;
}>;

export type CustomerAddressCreateMutation = {
  customerAddressCreate: {
    customerAddress: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      address1: string | null;
      address2: string | null;
      city: string | null;
      province: string | null;
      zip: string | null;
      country: string | null;
      territoryCode: CustomerAccountAPI.CountryCode | null;
      zoneCode: string | null;
      phoneNumber: string | null;
    } | null;
    userErrors: Array<{field: Array<string> | null; message: string}>;
  } | null;
};

export type CustomerAddressUpdateMutationVariables = Exact<{
  addressId: string | number;
  address: CustomerAccountAPI.CustomerAddressInput;
}>;

export type CustomerAddressUpdateMutation = {
  customerAddressUpdate: {
    customerAddress: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      address1: string | null;
      address2: string | null;
      city: string | null;
      province: string | null;
      zip: string | null;
      country: string | null;
      territoryCode: CustomerAccountAPI.CountryCode | null;
      zoneCode: string | null;
      phoneNumber: string | null;
    } | null;
    userErrors: Array<{field: Array<string> | null; message: string}>;
  } | null;
};

export type CustomerAddressDeleteMutationVariables = Exact<{
  addressId: string | number;
}>;

export type CustomerAddressDeleteMutation = {
  customerAddressDelete: {
    deletedAddressId: string | null;
    userErrors: Array<{field: Array<string> | null; message: string}>;
  } | null;
};

export type CustomerUpdateMutationVariables = Exact<{
  input: CustomerAccountAPI.CustomerUpdateInput;
}>;

export type CustomerUpdateMutation = {
  customerUpdate: {
    customer: {
      firstName: string | null;
      lastName: string | null;
      emailAddress: {emailAddress: string | null} | null;
    } | null;
    userErrors: Array<{field: Array<string> | null; message: string}>;
  } | null;
};

export type OrdersQueryVariables = Exact<{
  first: number;
  after?: string | null | undefined;
}>;

export type OrdersQuery = {
  customer: {
    orders: {
      nodes: Array<{
        id: string;
        name: string;
        number: number;
        processedAt: unknown;
        statusPageUrl: unknown;
        totalPrice: {
          amount: unknown;
          currencyCode: CustomerAccountAPI.CurrencyCode;
        };
        lineItems: {
          nodes: Array<{
            title: string;
            variantTitle: string | null;
            quantity: number;
            image: {
              url: unknown;
              altText: string | null;
              width: number | null;
              height: number | null;
            } | null;
          }>;
        };
        fulfillments: {
          nodes: Array<{
            status: CustomerAccountAPI.FulfillmentStatus | null;
            trackingInformation: Array<{
              company: string | null;
              number: string | null;
            }>;
          }>;
        };
      }>;
      pageInfo: {hasNextPage: boolean; endCursor: string | null};
    };
  };
};

export type CustomerWishlistQueryVariables = Exact<{[key: string]: never}>;

export type CustomerWishlistQuery = {
  customer: {id: string; wishlistMetafield: {value: string} | null};
};

export type CustomerWishlistSetMutationVariables = Exact<{
  metafields:
    | Array<CustomerAccountAPI.MetafieldsSetInput>
    | CustomerAccountAPI.MetafieldsSetInput;
}>;

export type CustomerWishlistSetMutation = {
  metafieldsSet: {
    metafields: Array<{
      id: string;
      key: string;
      namespace: string;
      value: string;
    }> | null;
    userErrors: Array<{field: Array<string> | null; message: string}>;
  } | null;
};

interface GeneratedQueryTypes {
  '#graphql\n  query Customer {\n    customer {\n      firstName\n      lastName\n      emailAddress {\n        emailAddress\n      }\n    }\n  }\n': {
    return: CustomerQuery;
    variables: CustomerQueryVariables;
  };
  '#graphql\n  query Addresses($first: Int!, $after: String) {\n    customer {\n      id\n      defaultAddress {\n        id\n        firstName\n        lastName\n        company\n        address1\n        address2\n        city\n        province\n        zip\n        country\n        territoryCode\n        zoneCode\n        phoneNumber\n      }\n      addresses(first: $first, after: $after) {\n        pageInfo {\n          hasNextPage\n          endCursor\n        }\n        nodes {\n          id\n          firstName\n          lastName\n          company\n          address1\n          address2\n          city\n          province\n          zip\n          country\n          territoryCode\n          zoneCode\n          phoneNumber\n        }\n      }\n    }\n  }\n': {
    return: AddressesQuery;
    variables: AddressesQueryVariables;
  };
  '#graphql\n  query Orders($first: Int!, $after: String) {\n    customer {\n      orders(first: $first, after: $after, reverse: true) {\n        nodes {\n          id\n          name\n          number\n          processedAt\n          statusPageUrl\n          totalPrice {\n            amount\n            currencyCode\n          }\n          lineItems(first: 5) {\n            nodes {\n              image {\n                url\n                altText\n                width\n                height\n              }\n              title\n              variantTitle\n              quantity\n            }\n          }\n          fulfillments(first: 3) {\n            nodes {\n              status\n              trackingInformation {\n                company\n                number\n              }\n            }\n          }\n        }\n        pageInfo {\n          hasNextPage\n          endCursor\n        }\n      }\n    }\n  }\n': {
    return: OrdersQuery;
    variables: OrdersQueryVariables;
  };
  '#graphql\n  query CustomerWishlist {\n    customer {\n      id\n      wishlistMetafield: metafield(namespace: "custom", key: "wishlist") {\n        value\n      }\n    }\n  }\n': {
    return: CustomerWishlistQuery;
    variables: CustomerWishlistQueryVariables;
  };
}

interface GeneratedMutationTypes {
  '#graphql\n  mutation customerAddressCreate($address: CustomerAddressInput!) {\n    customerAddressCreate(address: $address) {\n      customerAddress {\n        id\n        firstName\n        lastName\n        company\n        address1\n        address2\n        city\n        province\n        zip\n        country\n        territoryCode\n        zoneCode\n        phoneNumber\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n': {
    return: CustomerAddressCreateMutation;
    variables: CustomerAddressCreateMutationVariables;
  };
  '#graphql\n  mutation customerAddressUpdate($addressId: ID!, $address: CustomerAddressInput!) {\n    customerAddressUpdate(addressId: $addressId, address: $address) {\n      customerAddress {\n        id\n        firstName\n        lastName\n        company\n        address1\n        address2\n        city\n        province\n        zip\n        country\n        territoryCode\n        zoneCode\n        phoneNumber\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n': {
    return: CustomerAddressUpdateMutation;
    variables: CustomerAddressUpdateMutationVariables;
  };
  '#graphql\n  mutation customerAddressDelete($addressId: ID!) {\n    customerAddressDelete(addressId: $addressId) {\n      deletedAddressId\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n': {
    return: CustomerAddressDeleteMutation;
    variables: CustomerAddressDeleteMutationVariables;
  };
  '#graphql\n  mutation customerUpdate($input: CustomerUpdateInput!) {\n    customerUpdate(input: $input) {\n      customer {\n        firstName\n        lastName\n        emailAddress {\n          emailAddress\n        }\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n': {
    return: CustomerUpdateMutation;
    variables: CustomerUpdateMutationVariables;
  };
  '#graphql\n  mutation customerWishlistSet($metafields: [MetafieldsSetInput!]!) {\n    metafieldsSet(metafields: $metafields) {\n      metafields {\n        id\n        key\n        namespace\n        value\n      }\n      userErrors {\n        field\n        message\n      }\n    }\n  }\n': {
    return: CustomerWishlistSetMutation;
    variables: CustomerWishlistSetMutationVariables;
  };
}

declare module '@shopify/hydrogen' {
  interface CustomerAccountQueries extends GeneratedQueryTypes {}
  interface CustomerAccountMutations extends GeneratedMutationTypes {}
}
