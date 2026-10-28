// Province data imports
import * as aceh from "./aceh";
import * as bali from "./bali";
import * as bangkaBelitung from "./bangka_belitung";
import * as banten from "./banten";
import * as bengkulu from "./bengkulu";
import * as diYogyakarta from "./di_yogyakarta";
import * as dkiJakarta from "./dki_jakarta";
import * as gorontalo from "./gorontalo";
import * as jambi from "./jambi";
import * as jawaBarat from "./jawa_barat";
import * as jawaTengah from "./jawa_tengah";
import * as jawaTimur from "./jawa_timur";
import * as kalimantanBarat from "./kalimantan_barat";
import * as kalimantanSelatan from "./kalimantan_selatan";
import * as kalimantanTengah from "./kalimantan_tengah";
import * as kalimantanTimur from "./kalimantan_timur";
import * as kalimantanUtara from "./kalimantan_utara";
import * as kepulauanRiau from "./kepulauan_riau";
import * as lampung from "./lampung";
import * as nusaTenggaraBarat from "./nusa_tenggara_barat";
import * as nusaTenggaraTimur from "./nusa_tenggara_timur";
import * as riau from "./riau";
import * as sulawesiSelatan from "./sulawesi_selatan";
import * as sulawesiTengah from "./sulawesi_tengah";
import * as sulawesiTenggara from "./sulawesi_tenggara";
import * as sulawesiUtara from "./sulawesi_utara";
import * as sumateraBarat from "./sumatera_barat";
import * as sumateraSelatan from "./sumatera_selatan";
import * as sumateraUtara from "./sumatera_utara";

// Import new provinces
import * as maluku from "./maluku";
import * as malukuUtara from "./maluku_utara";
import * as papua from "./papua";
import * as papuaBarat from "./papua_barat";
import * as papuaBaratDaya from "./papua_barat_daya";
import * as papuaPegunungan from "./papua_pegunungan";
import * as papuaSelatan from "./papua_selatan";
import * as papuaTengah from "./papua_tengah";
import * as sulawesiBarat from "./sulawesi_barat";

// Province data mapping
const provinceData = {
  "Aceh": aceh,
  "Bali": bali,
  "Bangka Belitung": bangkaBelitung,
  "Banten": banten,
  "Bengkulu": bengkulu,
  "DI Yogyakarta": diYogyakarta,
  "DKI Jakarta": dkiJakarta,
  "Gorontalo": gorontalo,
  "Jambi": jambi,
  "Jawa Barat": jawaBarat,
  "Jawa Tengah": jawaTengah,
  "Jawa Timur": jawaTimur,
  "Kalimantan Barat": kalimantanBarat,
  "Kalimantan Selatan": kalimantanSelatan,
  "Kalimantan Tengah": kalimantanTengah,
  "Kalimantan Timur": kalimantanTimur,
  "Kalimantan Utara": kalimantanUtara,
  "Kepulauan Riau": kepulauanRiau,
  "Lampung": lampung,
  "Maluku": maluku,
  "Maluku Utara": malukuUtara,
  "Nusa Tenggara Barat": nusaTenggaraBarat,
  "Nusa Tenggara Timur": nusaTenggaraTimur,
  "Papua": papua,
  "Papua Barat": papuaBarat,
  "Papua Barat Daya": papuaBaratDaya,
  "Papua Pegunungan": papuaPegunungan,
  "Papua Selatan": papuaSelatan,
  "Papua Tengah": papuaTengah,
  "Riau": riau,
  "Sulawesi Barat": sulawesiBarat,
  "Sulawesi Selatan": sulawesiSelatan,
  "Sulawesi Tengah": sulawesiTengah,
  "Sulawesi Tenggara": sulawesiTenggara,
  "Sulawesi Utara": sulawesiUtara,
  "Sumatera Barat": sumateraBarat,
  "Sumatera Selatan": sumateraSelatan,
  "Sumatera Utara": sumateraUtara,
};

// List of all provinces
export const PROVINCES = Object.keys(provinceData);

// Helper functions
export function getCitiesByProvince(province: string): string[] {
  const data = provinceData[province as keyof typeof provinceData];
  return data ? data.cities : [];
}

export function getDistrictsByCity(city: string): string[] {
  for (const province in provinceData) {
    const data = provinceData[province as keyof typeof provinceData];
    if (data.districtsByCity && data.districtsByCity[city]) {
      return data.districtsByCity[city];
    }
  }
  return [];
}

export function getPostalCodesByCity(city: string): string[] {
  for (const province in provinceData) {
    const data = provinceData[province as keyof typeof provinceData];
    if (data.postalCodesByCity && data.postalCodesByCity[city]) {
      return data.postalCodesByCity[city];
    }
  }
  return [];
}

// Export all province data (for advanced usage)
export const provinceDataMap = provinceData;

// Export default
export default {
  PROVINCES,
  getCitiesByProvince,
  getDistrictsByCity,
  getPostalCodesByCity,
  provinceDataMap,
};

