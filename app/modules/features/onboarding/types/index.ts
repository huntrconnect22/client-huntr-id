export interface CompanyFormData {
  company_name: string;
  tax_id: string;
  country: string;
  email: string;
  phone: string;
  type: string;
  industry_type: string;
  about: string;
  keywords: string;
  region: string;
  provincy_country: string;
  regency: string;
  city: string;
  zip_code: string;
  address: string;
  bank_name: string;
  bank_account: string;
  bank_account_name: string;
  hq_addresses: string[];
}

export interface UploadedDoc {
  name: string;
  type: string;
  file_path: string;
  url: string;
  localName: string;
}

export interface NpwpVerifiedData {
  npwp: string;
  nama: string;
  alamat: string;
  statusWp: string;
  statusSpt: string;
  // Field tambahan untuk auto-fill
  city?: string;
  regency?: string;
  zip_code?: string;
  provincy_country?: string;
  bank_name?: string;
  bank_account?: string;
  bank_account_name?: string;
  industry_type?: string;
  phone?: string;
  email?: string;
}


