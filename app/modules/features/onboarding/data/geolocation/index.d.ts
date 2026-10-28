// Type declarations for geolocation module

export const PROVINCES: string[];

export function getCitiesByProvince(province: string): string[];
export function getDistrictsByCity(city: string): string[];
export function getPostalCodesByCity(city: string): string[];

export const provinceDataMap: Record<string, {
  name: string;
  cities: string[];
  districtsByCity: Record<string, string[]>;
  postalCodesByCity: Record<string, string[]>;
}>;

// Default export
declare const _default: {
  PROVINCES: string[];
  getCitiesByProvince: (province: string) => string[];
  getDistrictsByCity: (city: string) => string[];
  getPostalCodesByCity: (city: string) => string[];
  provinceDataMap: Record<string, any>;
};
export default _default;

