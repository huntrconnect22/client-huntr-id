export const name = "Papua Tengah";

export const cities = [
  "Kabupaten Deiyai", "Kabupaten Dogiyai", "Kabupaten Intan Jaya", "Kabupaten Mimika",
  "Kabupaten Nabire", "Kabupaten Paniai", "Kabupaten Puncak", "Kabupaten Puncak Jaya",
];

export const districtsByCity: Record<string, string[]> = {
  "Kabupaten Mimika": [
    "Agimuga", "Alama", "Amar", "Hoya", "Iwaka", "Jila", "Jita", "Kuala Kencana",
    "Kwamki Narama", "Mimika Barat", "Mimika Barat Jauh", "Mimika Barat Tengah",
    "Mimika Baru", "Mimika Tengah", "Mimika Timur", "Mimika Timur Jauh", "Tembagapura",
    "Wania",
  ],
  "Kabupaten Nabire": [
    "Dipa", "Makimi", "Menou", "Moora", "Nabire", "Nabire Barat", "Napan", "Siriwo",
    "Teluk Kimi", "Teluk Umar", "Uwapa", "Wanggar", "Wapoga", "Yaro", "Yaur",
  ],
  "Kabupaten Paniai": [
    "Aradide", "Bibida", "Bogabaida", "Dumadama", "Ekadide", "Kebo", "Paniai Barat",
    "Paniai Timur", "Siriwo", "Yatamo",
  ],
  // Add more districts as needed
};

export const postalCodesByCity: Record<string, string[]> = {
  "Kabupaten Mimika": ["99911", "99912", "99913", "99914", "99915", "99916", "99917", "99918", "99919"],
  "Kabupaten Nabire": ["98811", "98812", "98813", "98814", "98815", "98816", "98817", "98818", "98819"],
  "Kabupaten Paniai": ["98711", "98712", "98713", "98714", "98715", "98716", "98717", "98718", "98719"],
  // Add more postal codes as needed
};

