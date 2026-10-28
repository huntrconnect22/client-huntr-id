export const name = "Papua Barat";

export const cities = [
  "Kota Sorong",
  "Kabupaten Fakfak", "Kabupaten Kaimana", "Kabupaten Manokwari", "Kabupaten Manokwari Selatan",
  "Kabupaten Maybrat", "Kabupaten Pegunungan Arfak", "Kabupaten Raja Ampat", "Kabupaten Sorong",
  "Kabupaten Sorong Selatan", "Kabupaten Tambrauw", "Kabupaten Teluk Bintuni", "Kabupaten Teluk Wondama",
];

export const districtsByCity: Record<string, string[]> = {
  "Kota Sorong": [
    "Klaurung", "Malaimsimsa", "Maladum Mes", "Sayosa", "Sorong", "Sorong Barat",
    "Sorong Kepulauan", "Sorong Manoi", "Sorong Timur", "Sorong Utara",
  ],
  "Kabupaten Manokwari": [
    "Manokwari Barat", "Manokwari Selatan", "Manokwari Timur", "Manokwari Utara",
    "Masni", "Prafi", "Sidey", "Tanah Rubuh", "Warmare",
  ],
  "Kabupaten Raja Ampat": [
    "Ayau", "Batanta Selatan", "Batanta Utara", "Kepulauan Ayau", "Kepulauan Sembilan",
    "Kofiau", "Kota Waisai", "Meos Mansar", "Misool", "Misool Barat", "Misool Selatan",
    "Misool Timur", "Salawati Barat", "Salawati Tengah", "Salawati Utara", "Supnin",
    "Teluk Mayalibit", "Tiplol Mayalibit", "Waigeo Barat", "Waigeo Barat Kepulauan",
    "Waigeo Selatan", "Waigeo Timur", "Waigeo Utara", "Warwabomi",
  ],
  // Add more districts as needed
};

export const postalCodesByCity: Record<string, string[]> = {
  "Kota Sorong": ["98411", "98412", "98413", "98414", "98415", "98416", "98417", "98418", "98419"],
  "Kabupaten Manokwari": ["98311", "98312", "98313", "98314", "98315", "98316", "98317", "98318", "98319"],
  "Kabupaten Raja Ampat": ["98481", "98482", "98483", "98484", "98485", "98486", "98487", "98488", "98489"],
  // Add more postal codes as needed
};

