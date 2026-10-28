/**
 * API Barrel File
 *
 * CATATAN: File ini sekarang berfungsi sebagai jembatan untuk transisi ke arsitektur modular.
 * Disarankan untuk mengimpor langsung dari modul spesifik di lib/api/*.ts untuk kode baru.
 */

export * from "./client";
export * from "./session";
export * from "./api/auth";
export * from "./api/account";
export * from "./api/admin";
export * from "./api/company";
export * from "./api/notifications";
export * from "./api/catalogue";
export * from "./api/orders";
export * from "./api/communication";
export * from "./api/payment";
export * from "./api/ai";
export * from "./api/crm";
// End of barrel file

