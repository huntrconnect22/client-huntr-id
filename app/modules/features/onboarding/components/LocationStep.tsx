import React, { useState } from "react";
import { FormLabel } from "./OnboardingUI";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { Plus, X } from "lucide-react";
import {
  PROVINCES,                    // Array 38 nama provinsi
  getCitiesByProvince,          // Fungsi: provinsi → kota
  getDistrictsByCity,           // Fungsi: kota → kecamatan
  getPostalCodesByCity,         // Fungsi: kota → kode pos
  provinceDataMap               // Data lengkap semua provinsi
} from "../data/geolocation";


interface LocationStepProps {
  formData: any;
  updateField: (key: string, value: string) => void;
  updateHqAddress: (index: number, value: string) => void;
  addHqAddress: () => void;
  removeHqAddress: (index: number) => void;
}

interface GeoDetails {
  state?: string;
  city?: string;
  county?: string;
  postcode?: string;
}

const selectClass =
  "w-full px-4 py-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] outline-none text-sm appearance-none";

export const LocationStep: React.FC<LocationStepProps> = ({
  formData,
  updateField,
  updateHqAddress,
  addHqAddress,
  removeHqAddress,
}) => {
  const [geoDetails, setGeoDetails] = useState<GeoDetails>({});

  const citiesList = getCitiesByProvince(formData.provincy_country);
  const districtsList = getDistrictsByCity(formData.city);
  const postalCodesList = getPostalCodesByCity(formData.city);

  const handleProvinceChange = (province: string) => {
    updateField("provincy_country", province);
    updateField("city", "");
    updateField("regency", "");
    updateField("zip_code", "");
  };

  const handleCityChange = (city: string) => {
    updateField("city", city);
    updateField("regency", "");
    updateField("zip_code", "");
  };

  const handleAddressChange = (v: string, details?: any) => {
    updateField("address", v);
    if (details) {
      const geo: GeoDetails = {
        state: details.state,
        city: details.city || details.county,
        county: details.county,
        postcode: details.postcode,
      };
      setGeoDetails(geo);
      if (geo.state) updateField("provincy_country", geo.state);
      if (geo.city) updateField("city", geo.city);
      if (geo.county) updateField("regency", geo.county);
      if (geo.postcode) updateField("zip_code", geo.postcode);
    }
  };

  // Build option lists — Geoapify value is shown first if not already in the list
  const buildOptions = (list: string[], geoValue?: string) => {
    const opts = [...list];
    if (geoValue && !opts.includes(geoValue)) {
      opts.unshift(geoValue);
    }
    return opts;
  };

  const provinceOptions = buildOptions(PROVINCES, geoDetails.state);
  const cityOptions = buildOptions(citiesList, geoDetails.city);
  const districtOptions = buildOptions(districtsList, geoDetails.county);
  const postalOptions = buildOptions(postalCodesList, geoDetails.postcode);

  return (
    <div className="space-y-5">
      {/* Province */}
      <div className="flex flex-col gap-1.5">
        <FormLabel>Province *</FormLabel>
        <select
          value={formData.provincy_country}
          onChange={(e) => handleProvinceChange(e.target.value)}
          className={selectClass}
        >
          <option value="" className="bg-[var(--ui-bg-page)]">Select Province...</option>
          {provinceOptions.map((p) => (
            <option key={p} value={p} className="bg-[var(--ui-bg-page)]">
              {p}{geoDetails.state === p ? " ✓" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* City & District */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <FormLabel>City / Regency *</FormLabel>
          <select
            value={formData.city}
            onChange={(e) => handleCityChange(e.target.value)}
            disabled={!formData.provincy_country}
            className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="" className="bg-[var(--ui-bg-page)]">
              {formData.provincy_country ? "Select City..." : "Select Province First..."}
            </option>
            {cityOptions.map((c) => (
              <option key={c} value={c} className="bg-[var(--ui-bg-page)]">
                {c}{geoDetails.city === c ? " ✓" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <FormLabel>District / Kecamatan</FormLabel>
          <select
            value={formData.regency}
            onChange={(e) => updateField("regency", e.target.value)}
            disabled={!formData.city}
            className={`${selectClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="" className="bg-[var(--ui-bg-page)]">
              {formData.city ? "Select District..." : "Select City First..."}
            </option>
            {districtOptions.map((d) => (
              <option key={d} value={d} className="bg-[var(--ui-bg-page)]">
                {d}{geoDetails.county === d ? " ✓" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Postal Code */}
      <div className="flex flex-col gap-1.5">
        <FormLabel>Postal Code</FormLabel>
        {postalOptions.length > 0 ? (
          <select
            value={formData.zip_code}
            onChange={(e) => updateField("zip_code", e.target.value)}
            className={selectClass}
          >
            <option value="" className="bg-[var(--ui-bg-page)]">Select Postal Code...</option>
            {postalOptions.map((code) => (
              <option key={code} value={code} className="bg-[var(--ui-bg-page)]">
                {code}{geoDetails.postcode === code ? " ✓" : ""}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={formData.zip_code}
            onChange={(e) => updateField("zip_code", e.target.value)}
            placeholder="E.g.: 42213"
            className={selectClass}
          />
        )}
      </div>

      {/* Full Address — Geoapify Autocomplete */}
      <AddressAutocomplete value={formData.address} onChange={handleAddressChange} />

      {/* HQ Addresses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FormLabel>HQ/Office Addresses</FormLabel>
          <button
            type="button"
            onClick={addHqAddress}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-bold hover:bg-orange-500/20 transition-all"
          >
            <Plus size={16} /> Add Address
          </button>
        </div>
        {formData.hq_addresses?.map((addr: string, idx: number) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              value={addr}
              onChange={(e) => updateHqAddress(idx, e.target.value)}
              placeholder={`HQ Address ${idx + 1}`}
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] outline-none text-sm"
            />
            {formData.hq_addresses.length > 1 && (
              <button
                type="button"
                onClick={() => removeHqAddress(idx)}
                className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};


