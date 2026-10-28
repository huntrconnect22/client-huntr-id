type CurrencyRate = {
  code: string;
  value: number;
};

type CurrencyApiResponse = {
  meta?: {
    last_updated_at?: string;
  };
  data?: Record<string, CurrencyRate>;
};

const CURRENCY_API_KEY =
  import.meta.env.VITE_CURRENCY_API_KEY ||
  import.meta.env.CURRENCY_API_KEY ||
  "";

const DEFAULT_CURRENCIES = ["USD", "EUR", "SGD", "MYR", "JPY"];

export async function fetchLatestCurrencyRates(baseCurrency = "IDR", currencies = DEFAULT_CURRENCIES) {
  if (!CURRENCY_API_KEY) {
    throw new Error("Currency API key is not configured.");
  }

  const url = new URL("https://api.currencyapi.com/v3/latest");
  url.searchParams.set("base_currency", baseCurrency);
  url.searchParams.set("currencies", currencies.join(","));

  const res = await fetch(url.toString(), {
    headers: {
      apikey: CURRENCY_API_KEY,
      Accept: "application/json",
    },
  });

  const data = (await res.json()) as CurrencyApiResponse & { message?: string; error?: { message?: string } };

  if (!res.ok) {
    const message = data?.error?.message || data?.message || "Failed to load currency data.";
    if (res.status === 401) {
      throw new Error("Currency API key tidak valid. Pastikan key berasal dari currencyapi.com dan masih aktif.");
    }
    throw new Error(message);
  }

  return {
    meta: data.meta ?? {},
    rates: data.data ?? {},
    baseCurrency,
  };
}


