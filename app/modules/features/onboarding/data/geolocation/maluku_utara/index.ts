export const name = "Maluku Utara";

export const cities = [
  "Kota Ternate", "Kota Tidore Kepulauan",
  "Kabupaten Halmahera Barat", "Kabupaten Halmahera Tengah", "Kabupaten Halmahera Selatan",
  "Kabupaten Halmahera Timur", "Kabupaten Halmahera Utara", "Kabupaten Kepulauan Sula",
  "Kabupaten Pulau Morotai", "Kabupaten Pulau Taliabu",
];

export const districtsByCity: Record<string, string[]> = {
  "Kota Ternate": [
    "Moti", "Pulau Batang Dua", "Pulau Hiri", "Pulau Ternate", "Ternate Barat",
    "Ternate Selatan", "Ternate Tengah", "Ternate Utara",
  ],
  "Kota Tidore Kepulauan": [
    "Oba", "Oba Selatan", "Oba Tengah", "Oba Utara", "Tidore", "Tidore Selatan",
    "Tidore Timur", "Tidore Utara",
  ],
  "Kabupaten Halmahera Barat": [
    "Jailolo", "Jailolo Selatan", "Jailolo Timur", "Loloda", "Sahu", "Sahu Timur",
  ],
  // Add more districts as needed
};

export const postalCodesByCity: Record<string, string[]> = {
  "Kota Ternate": ["97711", "97712", "97713", "97714", "97715", "97716"],
  "Kota Tidore Kepulauan": ["97811", "97812", "97813", "97814"],
  "Kabupaten Halmahera Barat": ["97751", "97752", "97753", "97754", "97755", "97756"],
  // Add more postal codes as needed
};

