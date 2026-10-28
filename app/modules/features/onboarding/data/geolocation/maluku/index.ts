export const name = "Maluku";

export const cities = [
  "Kota Ambon", "Kota Tual",
  "Kabupaten Buru", "Kabupaten Buru Selatan", "Kabupaten Kepulauan Aru", 
  "Kabupaten Maluku Barat Daya", "Kabupaten Maluku Tengah", "Kabupaten Maluku Tenggara",
  "Kabupaten Maluku Tenggara Barat", "Kabupaten Seram Bagian Barat", "Kabupaten Seram Bagian Timur",
];

export const districtsByCity: Record<string, string[]> = {
  "Kota Ambon": [
    "Nusaniwe", "Sirimau", "Teluk Ambon Baguala", "Teluk Ambon",
  ],
  "Kota Tual": [
    "Kur Selatan", "Pulau Dullah Selatan", "Pulau Dullah Utara", "Tayando Tam",
  ],
  "Kabupaten Maluku Tengah": [
    "Amahai", "Banda", "Leihitu", "Leihitu Barat", "Nusalaut", "Saparua", 
    "Saparua Timur", "Seram Utara", "Seram Utara Barat", "Seram Utara Timur Kobi",
    "Seram Utara Timur Seti", "Tehoru", "Teluk Elpaputih", "Telutih", "Teon Nila Serua",
  ],
  // Add more districts as needed
};

export const postalCodesByCity: Record<string, string[]> = {
  "Kota Ambon": ["97111", "97112", "97113", "97114", "97115", "97116", "97117", "97118", "97119"],
  "Kota Tual": ["97611", "97612", "97613"],
  "Kabupaten Maluku Tengah": ["97511", "97512", "97513", "97514", "97515", "97516", "97517", "97518", "97519"],
  // Add more postal codes as needed
};

