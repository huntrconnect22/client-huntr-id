export const PRODUCT_CATEGORIES = [
  "Hardware",
  "Software",
  "Furniture",
  "Office Supplies",
  "Services",
  "Spareparts",
  "Electronics",
  "Mechanical",
  "Chemicals",
  "Construction",
  "Stationery",
  "Pantry & F&B",
  "Logistics",
  "Marketing",
  "Other"
];

export interface CatalogueFormData {
  item_code: string;
  name: string;
  category: string;
  brand: string;
  specifications: string;
  keywords: string;
  uom: string;
}

export interface CatalogueItem {
  id: string | number;
  item_code: string;
  name: string;
  category?: string;
  brand?: string;
  specifications?: string;
  keywords?: string | string[];
  uom?: string;
  image_url?: string;
  image_path?: string;
  price?: number | string;
  [key: string]: any;
}
