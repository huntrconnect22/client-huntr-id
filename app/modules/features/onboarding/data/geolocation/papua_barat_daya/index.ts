export const name = "Papua Barat Daya";

export const cities = [
  "Kabupaten Maybrat", "Kabupaten Raja Ampat", "Kabupaten Sorong", "Kabupaten Sorong Selatan",
  "Kabupaten Tambrauw",
];

export const districtsByCity: Record<string, string[]> = {
  "Kabupaten Sorong": [
    "Aimas", "Beraur", "Klabot", "Klamono", "Klaso", "Klawak", "Klayili", "Makbon",
    "Mariat", "Maudus", "Mayamuk", "Moisegen", "Salawati", "Salawati Selatan",
    "Sayosa", "Seget", "Segun",
  ],
  "Kabupaten Maybrat": [
    "Aifat", "Aifat Selatan", "Aifat Timur", "Aifat Timur Jauh", "Aifat Timur Selatan",
    "Aifat Timur Tengah", "Aifat Utara", "Aitinyo", "Aitinyo Barat", "Aitinyo Raya",
    "Aitinyo Tengah", "Aitinyo Utara", "Ayamaru", "Ayamaru Barat", "Ayamaru Jaya",
    "Ayamaru Selatan", "Ayamaru Selatan Jaya", "Ayamaru Tengah", "Ayamaru Timur",
    "Ayamaru Timur Selatan", "Ayamaru Utara", "Mare", "Mare Selatan",
  ],
  // Add more districts as needed
};

export const postalCodesByCity: Record<string, string[]> = {
  "Kabupaten Sorong": ["98451", "98452", "98453", "98454", "98455", "98456", "98457", "98458", "98459"],
  "Kabupaten Maybrrat": ["98471", "98472", "98473", "98474", "98475", "98476", "98477", "98478", "98479"],
  // Add more postal codes as needed
};

