export const name = "Papua";

export const cities = [
  "Kota Jayapura",
  "Kabupaten Biak Numfor", "Kabupaten Jayapura", "Kabupaten Keerom", "Kabupaten Kepulauan Yapen",
  "Kabupaten Mamberamo Raya", "Kabupaten Sarmi", "Kabupaten Supiori", "Kabupaten Waropen",
];

export const districtsByCity: Record<string, string[]> = {
  "Kota Jayapura": [
    "Abepura", "Heram", "Jayapura Selatan", "Jayapura Utara", "Muara Tami",
  ],
  "Kabupaten Jayapura": [
    "Airu", "Demta", "Depapre", "Ebungfao", "Gresi Selatan", "Kaureh", "Kemtuk",
    "Kemtuk Gresi", "Namblong", "Nimbokrang", "Nimboran", "Ravenirara", "Sentani",
    "Sentani Barat", "Sentani Timur", "Unurum Guay", "Waibu", "Yapsi", "Yokari",
  ],
  "Kabupaten Biak Numfor": [
    "Aimando Padaido", "Andey", "Biak Barat", "Biak Kota", "Biak Timur", "Biak Utara",
    "Bondifuar", "Bruyadori", "Numfor Barat", "Numfor Timur", "Oridek", "Orkeri",
    "Padaido", "Poiru", "Samofa", "Swandiwe", "Warsa", "Yawosi", "Yendidori",
  ],
  // Add more districts as needed
};

export const postalCodesByCity: Record<string, string[]> = {
  "Kota Jayapura": ["99111", "99112", "99113", "99114", "99115", "99116", "99117", "99118", "99119"],
  "Kabupaten Jayapura": ["99351", "99352", "99353", "99354", "99355", "99356", "99357", "99358", "99359"],
  "Kabupaten Biak Numfor": ["98111", "98112", "98113", "98114", "98115", "98116", "98117", "98118", "98119"],
  // Add more postal codes as needed
};

