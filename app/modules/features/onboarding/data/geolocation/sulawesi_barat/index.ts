export const name = "Sulawesi Barat";

export const cities = [
  "Kabupaten Majene", "Kabupaten Mamasa", "Kabupaten Mamuju", "Kabupaten Mamuju Tengah",
  "Kabupaten Pasangkayu", "Kabupaten Polewali Mandar",
];

export const districtsByCity: Record<string, string[]> = {
  "Kabupaten Mamuju": [
    "Bonehau", "Budong-Budong", "Kalukku", "Kalumpang", "Karossa", "Kep. Bala Balakang",
    "Mamuju", "Pangale", "Papalang", "Sampaga", "Simboro dan Kepulauan", "Tapalang",
    "Tapalang Barat", "Tobadak", "Tommo",
  ],
  "Kabupaten Polewali Mandar": [
    "Allu", "Anreapi", "Balanipa", "Binuang", "Bulo", "Campalagian", "Limboro",
    "Luyo", "Mapilli", "Matakali", "Matangnga", "Polewali", "Tapango", "Tinambung",
    "Tubbi Taramanu", "Wonomulyo",
  ],
  "Kabupaten Majene": [
    "Banggae", "Banggae Timur", "Malunda", "Pamboang", "Sendana", "Tammerodo Sendana",
    "Tubo Sendana", "Ulumanda",
  ],
  // Add more districts as needed
};

export const postalCodesByCity: Record<string, string[]> = {
  "Kabupaten Mamuju": ["91511", "91512", "91513", "91514", "91515", "91516", "91517", "91518", "91519"],
  "Kabupaten Polewali Mandar": ["91311", "91312", "91313", "91314", "91315", "91316", "91317", "91318", "91319"],
  "Kabupaten Majene": ["91411", "91412", "91413", "91414", "91415", "91416", "91417", "91418", "91419"],
  // Add more postal codes as needed
};

