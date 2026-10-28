export const name = "DKI Jakarta";

export const cities = [
  "Jakarta Pusat",
  "Jakarta Utara",
  "Jakarta Barat",
  "Jakarta Selatan",
  "Jakarta Timur",
  "Kepulauan Seribu",
];

export const districtsByCity: Record<string, string[]> = {
  "Jakarta Pusat": [
    "Gambir", "Menteng", "Senen", "Johar Baru", "Cempaka Putih",
    "Kemayoran", "Sawah Besar", "Gambir",
  ],
  "Jakarta Utara": [
    "Penjaringan", "Pademangan", "Tanjung Priok", "Koja", "Kelapa Gading",
    "Cilincing",
  ],
  "Jakarta Barat": [
    "Cengkareng", "Kalideres", "Grogol Petamburan", "Tambora", "Taman Sari",
    "Palmerah", "Kebon Jeruk", "Kembangan",
  ],
  "Jakarta Selatan": [
    "Kebayoran Baru", "Kebayoran Lama", "Pesanggrahan", "Cilandak",
    "Pasar Minggu", "Jagakarsa", "Mampang Prapatan", "Pancoran",
    "Tebet", "Setiabudi",
  ],
  "Jakarta Timur": [
    "Matraman", "Pulogadung", "Jatinegara", "Duren Sawit", "Kramat Jati",
    "Makasar", "Pasar Rebo", "Ciracas", "Cipayung", "Cakung",
  ],
  "Kepulauan Seribu": [
    "Kepulauan Seribu Utara", "Kepulauan Seribu Selatan",
  ],
};

// --- DATA BARU: Kelurahan berdasarkan Kecamatan ---
export const subDistrictsByDistrict: Record<string, string[]> = {
  // JAKARTA PUSAT
  "Gambir": ["Gambir", "Kebon Kelapa", "Petojo Utara", "Duri Pulo", "Cideng", "Petojo Selatan"],
  "Menteng": ["Menteng", "Pegangsaan", "Cikini", "Gondangdia", "Kebon Sirih"],
  "Senen": ["Senen", "Kwitang", "Kenari", "Paseban", "Kramat", "Bungur"],
  "Johar Baru": ["Johar Baru", "Kampung Rawa", "Galur", "Tanah Tinggi"],
  "Cempaka Putih": ["Cempaka Putih Timur", "Cempaka Putih Barat", "Rawasari"],
  "Kemayoran": ["Gunung Sahari Selatan", "Kemayoran", "Kebon Kosong", "Harapan Mulya", "Cempaka Baru", "Utan Panjang", "Sumur Batu", "Serdang"],
  "Sawah Besar": ["Pasar Baru", "Gunung Sahari Utara", "Mangga Dua Selatan", "Karang Anyar", "Kartini"],
  "Tanah Abang": ["Bendungan Hilir", "Karet Tengsin", "Kebon Melati", "Kebon Kacang", "Kampung Bali", "Petamburan", "Gelora"],

  // JAKARTA UTARA
  "Penjaringan": ["Penjaringan", "Pluit", "Pejagalan", "Kapuk Muara", "Kamal Muara"],
  "Pademangan": ["Pademangan Timur", "Pademangan Barat", "Ancol"],
  "Tanjung Priok": ["Tanjung Priok", "Kebon Bawang", "Sungai Bambu", "Papanggo", "Sunter Agung", "Sunter Jaya", "Warakas"],
  "Koja": ["Koja Utara", "Koja Selatan", "Rawa Badak Utara", "Rawa Badak Selatan", "Tugu Utara", "Tugu Selatan", "Lagoa"],
  "Kelapa Gading": ["Kelapa Gading Timur", "Kelapa Gading Barat", "Pegangsaan Dua"],
  "Cilincing": ["Cilincing", "Sukapura", "Marunda", "Semper Timur", "Semper Barat", "Rorotan", "Kalibaru"],

  // JAKARTA BARAT
  "Cengkareng": ["Cengkareng Barat", "Cengkareng Timur", "Duri Kosambi", "Kapuk", "Kedaung Kali Angke", "Rawa Buaya"],
  "Kalideres": ["Kalideres", "Kamal", "Pegadungan", "Semanan", "Tegal Alur"],
  "Grogol Petamburan": ["Grogol", "Jelambar", "Jelambar Baru", "Tanjung Duren Selatan", "Tanjung Duren Utara", "Tomang", "Wijaya Kusuma"],
  "Tambora": ["Angke", "Duri Selatan", "Duri Utara", "Jembatan Besi", "Jembatan Lima", "Kali Anyar", "Krendang", "Pekojan", "Roa Malaka", "Tambora", "Tanah Sereal"],
  "Taman Sari": ["Glodok", "Keagungan", "Krukut", "Mangga Besar", "Maphar", "Pinangsia", "Taman Sari", "Tangki"],
  "Palmerah": ["Jatipulo", "Kemanggisan", "Kota Bambu Selatan", "Kota Bambu Utara", "Palmerah", "Slipi"],
  "Kebon Jeruk": ["Duri Kepa", "Kebon Jeruk", "Kedoya Selatan", "Kedoya Utara", "Kelapa Dua", "Sukabumi Selatan", "Sukabumi Utara"],
  "Kembangan": ["Joglo", "Kembangan Selatan", "Kembangan Utara", "Meruya Selatan", "Meruya Utara", "Srengseng"],

  // JAKARTA SELATAN
  "Kebayoran Baru": ["Selong", "Gunung", "Kramat Pela", "Gandaria Utara", "Cipete Utara", "Pulo", "Melawai", "Petogogan", "Rawa Barat", "Senayan"],
  "Kebayoran Lama": ["Grogol Utara", "Grogol Selatan", "Cipulir", "Kebayoran Lama Utara", "Kebayoran Lama Selatan", "Pondok Pinang"],
  "Pesanggrahan": ["Ulujami", "Petukangan Utara", "Petukangan Selatan", "Pesanggrahan", "Bintaro"],
  "Cilandak": ["Cipete Selatan", "Gandaria Selatan", "Cilandak Barat", "Lebak Bulus", "Pondok Labu"],
  "Pasar Minggu": ["Pejaten Barat", "Pejaten Timur", "Pasar Minggu", "Kebagusan", "Jati Padang", "Ragunan", "Cilandak Timur"],
  "Jagakarsa": ["Tanjung Barat", "Lenteng Agung", "Jagakarsa", "Ciganjur", "Srengseng Sawah", "Cipedak"],
  "Mampang Prapatan": ["Kuningan Barat", "Pela Mampang", "Bangka", "Tegal Parang", "Mampang Prapatan"],
  "Pancoran": ["Kalibata", "Rawajati", "Duren Tiga", "Cikoko", "Pengadegan", "Pancoran"],
  "Tebet": ["Tebet Barat", "Tebet Timur", "Kebon Baru", "Bukit Duri", "Manggarai", "Manggarai Selatan", "Menteng Dalam"],
  "Setiabudi": ["Setiabudi", "Karet", "Karet Semanggi", "Karet Kuningan", "Kuningan Timur", "Menteng Atas", "Pasar Manggis", "Guntur"],

  // JAKARTA TIMUR
  "Matraman": ["Pisangan Baru", "Utan Kayu Selatan", "Utan Kayu Utara", "Kayu Manis", "Pal Meriam", "Kebon Manggis"],
  "Pulogadung": ["Kayu Putih", "Jati", "Rawamangun", "Pisangan Timur", "Cipinang", "Jatinegara Kaum", "Pulo Gadung"],
  "Jatinegara": ["Bali Mester", "Kampung Melayu", "Bidara Cina", "Cipinang Cempedak", "Rawa Bunga", "Cipinang Besar Utara", "Cipinang Besar Selatan", "Cipinang Muara"],
  "Duren Sawit": ["Pondok Bambu", "Duren Sawit", "Pondok Kelapa", "Pondok Kopi", "Malaka Jaya", "Malaka Sari", "Klender"],
  "Kramat Jati": ["Kramat Jati", "Dukuh", "Batu Ampar", "Balekambang", "Kampung Tengah", "Cawang", "Cilitan"],
  "Makasar": ["Pinang Ranti", "Makasar", "Halim Perdanakusuma", "Cipinang Melayu", "Kebon Pala"],
  "Pasar Rebo": ["Pekayon", "Kampung Gedong", "Cijantung", "Kampung Baru", "Kalisari"],
  "Ciracas": ["Cibubur", "Kelapa Dua Wetan", "Ciracas", "Susukan", "Rambutan"],
  "Cipayung": ["Lubang Buaya", "Ceger", "Cipayung", "Munjul", "Pondok Ranggon", "Cilangkap", "Setu", "Bambu Apus"],
  "Cakung": ["Cakung Barat", "Cakung Timur", "Rawa Terate", "Jatinegara", "Penggilingan", "Pulogebang", "Ujung Menteng"],

  // KEPULAUAN SERIBU
  "Kepulauan Seribu Utara": ["Pulau Kelapa", "Pulau Harapan", "Pulau Panggang"],
  "Kepulauan Seribu Selatan": ["Pulau Tidung", "Pulau Pari", "Pulau Untung Jawa"],
};

// --- DATA BARU: Kode Pos Spesifik Tingkat Kelurahan ---
export const postalCodesBySubDistrict: Record<string, string> = {
  // Jakarta Pusat
  "Gambir": "10110", "Kebon Kelapa": "10120", "Petojo Utara": "10130", "Duri Pulo": "10140", "Cideng": "10150", "Petojo Selatan": "10130",
  "Menteng": "10310", "Pegangsaan": "10320", "Cikini": "10330", "Gondangdia": "10350", "Kebon Sirih": "10340",
  "Senen": "10410", "Kwitang": "10420", "Kenari": "10430", "Paseban": "10440", "Kramat": "10450", "Bungur": "10460",
  "Johar Baru": "10560", "Kampung Rawa": "10550", "Galur": "10530", "Tanah Tinggi": "10540",
  "Cempaka Putih Timur": "10510", "Cempaka Putih Barat": "10520", "Rawasari": "10570",
  "Gunung Sahari Selatan": "10610", "Kemayoran": "10620", "Kebon Kosong": "10630", "Harapan Mulya": "10640", "Cempaka Baru": "10640", "Utan Panjang": "10650", "Sumur Batu": "10660", "Serdang": "10670",
  "Pasar Baru": "10710", "Gunung Sahari Utara": "10720", "Mangga Dua Selatan": "10730", "Karang Anyar": "10740", "Kartini": "10750",
  "Bendungan Hilir": "10210", "Karet Tengsin": "10220", "Kebon Melati": "10230", "Kebon Kacang": "10240", "Kampung Bali": "10250", "Petamburan": "10260", "Gelora": "10270",

  // Jakarta Utara
  "Penjaringan": "14440", "Pluit": "14450", "Pejagalan": "14450", "Kapuk Muara": "14460", "Kamal Muara": "14470",
  "Pademangan Timur": "14410", "Pademangan Barat": "14420", "Ancol": "14430",
  "Tanjung Priok": "14310", "Kebon Bawang": "14320", "Sungai Bambu": "14330", "Papanggo": "14340", "Sunter Agung": "14350", "Sunter Jaya": "14360", "Warakas": "14370",
  "Koja Utara": "14210", "Koja Selatan": "14220", "Rawa Badak Utara": "14230", "Rawa Badak Selatan": "14230", "Tugu Utara": "14260", "Tugu Selatan": "14260", "Lagoa": "14270",
  "Kelapa Gading Timur": "14240", "Kelapa Gading Barat": "14240", "Pegangsaan Dua": "14250",
  "Cilincing": "14120", "Sukapura": "14140", "Marunda": "14150", "Semper Timur": "14130", "Semper Barat": "14130", "Rorotan": "14140", "Kalibaru": "14110",

  // Jakarta Barat
  "Cengkareng Barat": "11730", "Cengkareng Timur": "11730", "Duri Kosambi": "11750", "Kapuk": "11720", "Kedaung Kali Angke": "11710", "Rawa Buaya": "11740",
  "Kalideres": "11840", "Kamal": "11810", "Pegadungan": "11830", "Semanan": "11850", "Tegal Alur": "11820",
  "Grogol": "11450", "Jelambar": "11460", "Jelambar Baru": "11460", "Tanjung Duren Selatan": "11470", "Tanjung Duren Utara": "11470", "Tomang": "11440", "Wijaya Kusuma": "11460",
  "Angke": "11330", "Duri Selatan": "11270", "Duri Utara": "11270", "Jembatan Besi": "11320", "Jembatan Lima": "11250", "Kali Anyar": "11310", "Krendang": "11260", "Pekojan": "11240", "Roa Malaka": "11230", "Tambora": "11220", "Tanah Sereal": "11210",
  "Glodok": "11120", "Keagungan": "11130", "Krukut": "11140", "Mangga Besar": "11180", "Maphar": "11160", "Pinangsia": "11110", "Taman Sari": "11150", "Tangki": "11170",
  "Jatipulo": "11430", "Kemanggisan": "11480", "Kota Bambu Selatan": "11420", "Kota Bambu Utara": "11420", "Palmerah": "11480", "Slipi": "11410",
  "Duri Kepa": "11510", "Kebon Jeruk": "11530", "Kedoya Selatan": "11520", "Kedoya Utara": "11520", "Kelapa Dua": "11550", "Sukabumi Selatan": "11560", "Sukabumi Utara": "11540",
  "Joglo": "11640", "Kembangan Selatan": "11610", "Kembangan Utara": "11610", "Meruya Selatan": "11650", "Meruya Utara": "11620", "Srengseng": "11630",

  // Jakarta Selatan
  "Selong": "12110", "Gunung": "12120", "Kramat Pela": "12130", "Gandaria Utara": "12140", "Cipete Utara": "12150", "Pulo": "12160", "Melawai": "12160", "Petogogan": "12170", "Rawa Barat": "12180", "Senayan": "12190",
  "Grogol Utara": "12210", "Grogol Selatan": "12220", "Cipulir": "12230", "Kebayoran Lama Utara": "12240", "Kebayoran Lama Selatan": "12240", "Pondok Pinang": "12310",
  "Ulujami": "12250", "Petukangan Utara": "12260", "Petukangan Selatan": "12270", "Pesanggrahan": "12320", "Bintaro": "12330",
  "Cipete Selatan": "12410", "Gandaria Selatan": "12420", "Cilandak Barat": "12430", "Lebak Bulus": "12440", "Pondok Labu": "12450",
  "Pejaten Barat": "12510", "Pejaten Timur": "12510", "Pasar Minggu": "12520", "Kebagusan": "12520", "Jati Padang": "12540", "Ragunan": "12550", "Cilandak Timur": "12560",
  "Tanjung Barat": "12530", "Lenteng Agung": "12610", "Jagakarsa": "12620", "Ciganjur": "12630", "Srengseng Sawah": "12640", "Cipedak": "12630",
  "Kuningan Barat": "12710", "Pela Mampang": "12720", "Bangka": "12730", "Tegal Parang": "12790", "Mampang Prapatan": "12790",
  "Kalibata": "12740", "Rawajati": "12750", "Duren Tiga": "12760", "Cikoko": "12770", "Pengadegan": "12770", "Pancoran": "12780",
  "Tebet Barat": "12810", "Tebet Timur": "12820", "Kebon Baru": "12830", "Bukit Duri": "12840", "Manggarai": "12850", "Manggarai Selatan": "12860", "Menteng Dalam": "12870",
  "Setiabudi": "12910", "Karet": "12920", "Karet Semanggi": "12930", "Karet Kuningan": "12940", "Kuningan Timur": "12950", "Menteng Atas": "12960", "Pasar Manggis": "12970", "Guntur": "12980",

  // Jakarta Timur
  "Pisangan Baru": "13110", "Utan Kayu Selatan": "13120", "Utan Kayu Utara": "13120", "Kayu Manis": "13130", "Pal Meriam": "13140", "Kebon Manggis": "13150",
  "Kayu Putih": "13210", "Jati": "13220", "Rawamangun": "13220", "Pisangan Timur": "13230", "Cipinang": "13240", "Jatinegara Kaum": "13250", "Pulo Gadung": "13260",
  "Bali Mester": "13310", "Kampung Melayu": "13320", "Bidara Cina": "13330", "Cipinang Cempedak": "13340", "Rawa Bunga": "13350", "Cipinang Besar Utara": "13410", "Cipinang Besar Selatan": "13410", "Cipinang Muara": "13420",
  "Pondok Bambu": "13430", "Duren Sawit": "13440", "Pondok Kelapa": "13450", "Pondok Kopi": "13460", "Malaka Jaya": "13460", "Malaka Sari": "13460", "Klender": "13470",
  "Kramat Jati": "13510", "Dukuh": "13550", "Batu Ampar": "13520", "Balekambang": "13530", "Kampung Tengah": "13540", "Cawang": "13630", "Cilitan": "13640",
  "Pinang Ranti": "13560", "Makasar": "13570", "Halim Perdanakusuma": "13610", "Cipinang Melayu": "13620", "Kebon Pala": "13650",
  "Pekayon": "13710", "Kampung Gedong": "13760", "Cijantung": "13770", "Kampung Baru": "13780", "Kalisari": "13790",
  "Cibubur": "13720", "Kelapa Dua Wetan": "13730", "Ciracas": "13740", "Susukan": "13750", "Rambutan": "13830",
  "Lubang Buaya": "13810", "Ceger": "13820", "Cipayung": "13840", "Munjul": "13850", "Pondok Ranggon": "13860", "Cilangkap": "13870", "Setu": "13880", "Bambu Apus": "13890",
  "Cakung Barat": "13910", "Cakung Timur": "13910", "Rawa Terate": "13920", "Jatinegara": "13930", "Penggilingan": "13940", "Pulogebang": "13950", "Ujung Menteng": "13960",

  // Kepulauan Seribu
  "Pulau Kelapa": "14520", "Pulau Harapan": "14540", "Pulau Panggang": "14530",
  "Pulau Tidung": "14510", "Pulau Pari": "14520", "Pulau Untung Jawa": "14510",
};


// Add postalCodesByCity for compatibility
export const postalCodesByCity: Record<string, string[]> = {
  "Jakarta Pusat": ["10110", "10120", "10130", "10140", "10150"],
  "Jakarta Utara": ["14110", "14120", "14130", "14140", "14150"],
  "Jakarta Barat": ["11110", "11120", "11130", "11140", "11150", "11160", "11170", "11180", "11190"],
  "Jakarta Selatan": ["12110", "12120", "12130", "12140", "12150", "12160", "12170", "12180", "12190", "12210", "12220", "12230", "12240", "12250", "12260", "12270"],
  "Jakarta Timur": ["13110", "13120", "13130", "13140", "13150", "13210", "13220", "13230", "13240", "13250", "13260", "13310", "13320", "13330", "13340", "13350"],
  "Kepulauan Seribu": ["14510", "14520", "14530", "14540"],
};

