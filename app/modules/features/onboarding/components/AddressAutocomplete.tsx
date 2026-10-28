import React, { useState, useRef, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { FormLabel } from "./OnboardingUI";

interface AddressOption {
  address: string;
  lat: number;
  lon: number;
  state?: string;
  county?: string;
  city?: string;
  postcode?: string;
  country?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, details?: AddressOption) => void;
}

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || "";

export const AddressAutocomplete = ({ value, onChange }: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<AddressOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const searchCache = useRef<Record<string, AddressOption[]>>({});

  /**
   * Fetch address suggestions from Geoapify
   */
  const fetchAddressSuggestions = async (searchText: string) => {
    if (searchText.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    if (searchCache.current[searchText]) {
      setSuggestions(searchCache.current[searchText]);
      setShowSuggestions(searchCache.current[searchText].length > 0);
      return;
    }

    setIsLoading(true);
    try {
      const encodedText = encodeURIComponent(searchText);
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodedText}&apiKey=${GEOAPIFY_API_KEY}`,
        { method: "GET" }
      );

      if (!response.ok) throw new Error("Failed to fetch suggestions");

      const data = await response.json();
      const results: AddressOption[] = (data.results || [])
        .slice(0, 10)
        .map((result: any) => ({
          address: result.formatted || result.address_line1 || "",
          lat: result.lat,
          lon: result.lon,
          state: result.state,
          county: result.county || result.district,
          city: result.city || result.municipality || result.county,
          postcode: result.postcode,
          country: result.country_code ? result.country_code.toUpperCase() : result.country
        }))
        .filter((r: AddressOption) => r.address.trim().length > 0);

      searchCache.current[searchText] = results;
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (text.trim().length >= 3) {
      debounceTimer.current = setTimeout(() => {
        fetchAddressSuggestions(text);
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  /**
   * Handle suggestion click
   */
  const handleSelectSuggestion = (suggestion: AddressOption) => {
    onChange(suggestion.address, suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  /**
   * Close suggestions on click outside
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        suggestionsRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-2 relative">
      <FormLabel>
        <div className="flex items-center gap-2">
          <MapPin size={16} />
          Full Address *
        </div>
      </FormLabel>
      
      <div className="relative">
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.trim().length >= 3 && setShowSuggestions(true)}
          placeholder="E.g.: Jl. Kalidosok Raya No. 21 - Start typing to see suggestions"
          className="w-full px-4 py-3 rounded-xl bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] outline-none text-sm h-24 resize-none transition-all focus:border-orange-500/50"
        />

        {isLoading && (
          <div className="absolute right-3 top-3 text-orange-500">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-[var(--ui-bg-card)] border border-[var(--ui-border-input)] rounded-xl shadow-lg z-10 overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-[var(--ui-bg-input)] border-b border-[var(--ui-border-subtle)] last:border-b-0 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--ui-text-primary)] truncate">
                        {suggestion.address}
                      </div>
                      <div className="text-xs text-[var(--ui-text-muted)] mt-0.5">
                        {suggestion.lat.toFixed(4)}, {suggestion.lon.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {showSuggestions && !isLoading && suggestions.length === 0 && value.trim().length >= 3 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-[var(--ui-bg-card)] border border-[var(--ui-border-input)] rounded-xl shadow-lg z-10 p-4 text-center"
          >
            <p className="text-sm text-[var(--ui-text-muted)]">No suggestions found</p>
          </div>
        )}
      </div>

      <p className="text-xs text-[var(--ui-text-muted)]">
        💡 Start typing your address to see suggestions powered by Geoapify
      </p>
    </div>
  );
};


