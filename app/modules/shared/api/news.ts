import { apiGet } from "~/shared/services/http/client";

export type MainMenuNewsCategory = "all" | "economy" | "politics";

export interface MainMenuNewsArticle {
  category: Exclude<MainMenuNewsCategory, "all">;
  title: string;
  summary: string;
  url: string;
  image_url: string | null;
  source: string;
  published_at: string | null;
}

export interface MainMenuNewsResponse {
  articles: MainMenuNewsArticle[];
  updated_at: string;
  notice: string | null;
}

export const getMainMenuNews = () =>
  apiGet<MainMenuNewsResponse>("/api/news?category=all");
