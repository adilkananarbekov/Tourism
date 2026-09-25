export type CountryOption = {
  code: string;
  name: string;
  value: string;
};

const fallbackCountryCodes = [
  'AF', 'AL', 'DZ', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BH', 'BD', 'BY', 'BE', 'BR', 'BG', 'CA', 'CL',
  'CN', 'CO', 'HR', 'CY', 'CZ', 'DK', 'EG', 'EE', 'FI', 'FR', 'GE', 'DE', 'GR', 'HU', 'IN', 'ID',
  'IE', 'IL', 'IT', 'JP', 'JO', 'KZ', 'KG', 'KR', 'KW', 'LV', 'LT', 'MY', 'MX', 'MD', 'MN', 'ME',
  'MA', 'NL', 'NZ', 'NO', 'PK', 'PH', 'PL', 'PT', 'QA', 'RO', 'RU', 'SA', 'RS', 'SG', 'SK', 'SI',
  'ZA', 'ES', 'SE', 'CH', 'TH', 'TR', 'UA', 'AE', 'GB', 'US', 'UZ', 'VN',
];

type IntlWithSupportedRegions = typeof Intl & {
  supportedValuesOf?: (key: string) => string[];
};

function getRegionCodes(): string[] {
  try {
    const supportedValuesOf = (Intl as IntlWithSupportedRegions).supportedValuesOf;
    const regionCodes = supportedValuesOf?.('region');

    if (Array.isArray(regionCodes)) {
      return regionCodes.filter((code) => /^[A-Z]{2}$/.test(code));
    }
  } catch {
    // Some browsers expose supportedValuesOf but do not support the "region" key yet.
  }

  return fallbackCountryCodes;
}

export function getCountryOptions(locale: string): CountryOption[] {
  const regionCodes = getRegionCodes();
  const names = new Intl.DisplayNames([locale], { type: 'region' });

  return [...new Set(regionCodes)]
    .map((code) => {
      const name = names.of(code) || code;
      return { code, name, value: `${name} (${code})` };
    })
    .sort((left, right) => left.name.localeCompare(right.name, locale));
}
