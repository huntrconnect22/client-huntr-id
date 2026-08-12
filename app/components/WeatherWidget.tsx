import React, { useEffect, useMemo, useState } from "react";
import { Cloud, MapPin, RefreshCw, ThermometerSun, Wind } from "lucide-react";
import { fetchCurrentWeather } from "../lib/api/weather";

const WEATHER_LOCATIONS = [
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Semarang",
  "Yogyakarta",
  "Medan",
  "Makassar",
  "Denpasar",
  "Balikpapan",
  "Palembang",
  "Custom",
];

const STORAGE_KEY = "huntr_weather_location";

export default function WeatherWidget({ embedded = false }: { embedded?: boolean }) {
  const [location, setLocation] = useState("Jakarta");
  const [customLocation, setCustomLocation] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setLocation(stored);
      if (!WEATHER_LOCATIONS.includes(stored)) {
        setCustomLocation(stored);
      }
    }
  }, []);

  const resolvedLocation = useMemo(() => {
    if (location === "Custom") {
      return customLocation.trim();
    }
    return location;
  }, [location, customLocation]);

  useEffect(() => {
    if (!resolvedLocation) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const weather = await fetchCurrentWeather(resolvedLocation);
        if (cancelled) return;
        setData(weather);
        setUpdatedAt(Date.now());
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load weather.");
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    localStorage.setItem(STORAGE_KEY, resolvedLocation);

    return () => {
      cancelled = true;
    };
  }, [resolvedLocation]);

  return (
    <div style={{
      margin: embedded ? 0 : "0 10px 14px",
      padding: 14,
      borderRadius: 4,
      border: "1px solid var(--ui-border)",
      background: "var(--ui-bg-card)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 4, background: "rgba(249,115,22,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", flexShrink: 0 }}>
            <Cloud size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ui-text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Weather</div>
            <div style={{ fontSize: 10, color: "var(--ui-text-muted)" }}>Lokasi bisa dipilih</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => resolvedLocation && void fetchCurrentWeather(resolvedLocation).then((weather) => {
            setData(weather);
            setUpdatedAt(Date.now());
            setError(null);
          }).catch((err: any) => setError(err?.message || "Failed to load weather."))}
          style={{
            width: 30,
            height: 30,
            borderRadius: 4,
            border: "1px solid var(--ui-border)",
            background: "var(--ui-bg-card)",
            color: "var(--ui-text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Refresh weather"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--ui-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Choose location
        </label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 4,
            border: "1px solid var(--ui-border)",
            background: "var(--ui-bg-card)",
            color: "var(--ui-text-primary)",
            fontWeight: 600,
            outline: "none",
          }}
        >
          {WEATHER_LOCATIONS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      {location === "Custom" && (
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--ui-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Custom location
          </label>
          <input
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            placeholder="e.g. Tangerang"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 4,
              border: "1px solid var(--ui-border)",
              background: "var(--ui-bg-card)",
              color: "var(--ui-text-primary)",
              outline: "none",
              fontWeight: 600,
            }}
          />
        </div>
      )}

      {loading && (
        <div style={{ fontSize: 12, color: "var(--ui-text-muted)", padding: "8px 0" }}>
          Loading weather...
        </div>
      )}

      {!loading && error && (
        <div style={{ fontSize: 12, color: "#f87171", lineHeight: 1.4, padding: "8px 0" }}>
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "var(--ui-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={12} /> {data.name}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--ui-text-primary)", lineHeight: 1.1 }}>
                {Math.round(data.main.temp)}°C
              </div>
              <div style={{ fontSize: 12, color: "var(--ui-text-secondary)" }}>
                Feels like {Math.round(data.main.feels_like)}°C
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {data.weather?.[0]?.icon && (
                <img
                  src={`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`}
                  alt={data.weather[0].description}
                  style={{ width: 46, height: 46 }}
                />
              )}
              <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, textTransform: "capitalize" }}>
                {data.weather?.[0]?.description || "Weather update"}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Metric label="Humidity" value={`${data.main.humidity}%`} />
            <Metric label="Wind" value={`${Math.round((data.wind?.speed || 0) * 3.6)} km/h`} />
          </div>

          <div style={{ fontSize: 10, color: "var(--ui-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <ThermometerSun size={12} /> Updated {updatedAt ? new Date(updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : new Date((data.dt || 0) * 1000).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: 10,
      borderRadius: 4,
      background: "var(--ui-bg-card)",
      border: "1px solid var(--ui-border)",
    }}>
      <div style={{ fontSize: 10, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ui-text-primary)", marginTop: 3 }}>
        {value}
      </div>
    </div>
  );
}
