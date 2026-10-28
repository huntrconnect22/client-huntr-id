export const name = "Papua Selatan";

export const cities = [
  "Kabupaten Asmat", "Kabupaten Boven Digoel", "Kabupaten Mappi", "Kabupaten Merauke",
];

export const districtsByCity: Record<string, string[]> = {
  "Kabupaten Merauke": [
    "Animha", "Elikobal", "Ilyawab", "Jagebob", "Kaptel", "Kimaam", "Kurik", "Malind",
    "Merauke", "Muting", "Naukenjerai", "Ngguti", "Okaba", "Semangga", "Sota", "Tabonji",
    "Tanah Miring", "Tubang", "Ulilin", "Waan",
  ],
  "Kabupaten Asmat": [
    "Agats", "Akat", "Atsy", "Ayip", "Betcbamu", "Der Koumur", "Fakfak", "Jetsy",
    "Joerat", "Kolf Braza", "Kopay", "Pantai Kasuari", "Pulau Tiga", "Safan", "Sawa Erma",
    "Sirets", "Suator", "Suru-suru", "Unir Sirau",
  ],
  "Kabupaten Boven Digoel": [
    "Ambatkwi", "Arimop", "Bomakia", "Firiwage", "Guning Bintang", "Kawagit", "Ki",
    "Kombay", "Kombut", "Kouh", "Mandobo", "Manggelum", "Mindiptana", "Ninati", "Sesnuk",
    "Subur", "Waropko", "Yaniruma",
  ],
  // Add more districts as needed
};

export const postalCodesByCity: Record<string, string[]> = {
  "Kabupaten Merauke": ["99611", "99612", "99613", "99614", "99615", "99616", "99617", "99618", "99619"],
  "Kabupaten Asmat": ["99771", "99772", "99773", "99774", "99775", "99776", "99777", "99778", "99779"],
  "Kabupaten Boven Digoel": ["99661", "99662", "99663", "99664", "99665", "99666", "99667", "99668", "99669"],
  // Add more postal codes as needed
};

