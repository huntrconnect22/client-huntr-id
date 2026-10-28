export const name = "Banten";

export const cities = [
  "Kabupaten Pandeglang",
  "Kabupaten Lebak",
  "Kabupaten Tangerang",
  "Kabupaten Serang",
  "Kota Tangerang",
  "Kota Cilegon",
  "Kota Serang",
  "Kota Tangerang Selatan",
];

export const districtsByCity: Record<string, string[]> = {
  "Kabupaten Pandeglang": [
    "Angsana", "Banjar", "Bojava", "Bojong", "Cadasari", "Carita", "Cibaliung", "Cibitung",
    "Cigeulis", "Cikedal", "Cikeusik", "Cimanggu", "Cimanuk", "Cipeucang", "Cisata", "Garayan",
    "Jiput", "Kaduhejo", "Karang Tanjung", "Koroncong", "Labuan", "Majasari", "Mandalawangi",
    "Mekarjaya", "Menes", "Munjul", "Pagelaran", "Pandeglang", "Panimbang", "Patia", "Picung",
    "Pulosari", "Saketi", "Sindangresmi", "Sobang", "Sukaresmi", "Sumur"
  ],
  "Kabupaten Lebak": [
    "Banjarsari", "Bayah", "Bojongmanik", "Cibadak", "Cibeber", "Cigemblong", "Cihara", "Cijaku",
    "Cikulur", "Cileles", "Cilograng", "Cimarga", "Cipanas", "Cirinten", "Curugbitung", "Gunung Kencana",
    "Kalanganyar", "Lebakgedong", "Leuwidamar", "Maja", "Malingping", "Muncang", "Panggarangan",
    "Rangkasbitung", "Sajira", "Sajira", "Sobang", "Wanasalam", "Warunggunung"
  ],
  "Kabupaten Tangerang": [
    "Balaraja", "Cikupa", "Cisauk", "Cisoka", "Curug", "Gunung Kaler", "Jambe", "Jayanti", 
    "Kelapa Dua", "Kemiri", "Kosambi", "Kresek", "Kronjo", "Legok", "Mauk", "Pagedangan", 
    "Pakuhaji", "Panongan", "Pasarkemis", "Rajeg", "Sepatan", "Sepatan Timur", "Sindang Jaya", 
    "Solear", "Sukadiri", "Sukamulya", "Teluknaga", "Tigaraksa"
  ],
  "Kabupaten Serang": [
    "Anyar", "Baros", "Binuang", "Bojonegara", "Carenang", "Cikande", "Cikeusal", "Cinangka", 
    "Ciomas", "Ciruas", "Jawilan", "Kibin", "Kopo", "Kragilan", "Kramatwatu", "Lebak Wangi", 
    "Mancak", "Pabuaran", "Padarincang", "Pamarayan", "Petir", "Pontang", "Pulo Ampel", 
    "Tanara", "Tirtayasa", "Tunjung Teja", "Waringinkurung"
  ],
  "Kota Tangerang": [
    "Batuceper", "Benda", "Cibodas", "Ciledug", "Cipondoh", "Jatiuwung", "Karangtengah", 
    "Karawaci", "Larangan", "Neglasari", "Periuk", "Pinang", "Tangerang"
  ],
  "Kota Cilegon": [
    "Cibeber", "Cilegon", "Citangkil", "Ciwandan", "Grogol", "Jombang", "Pulomerak", "Purwakarta"
  ],
  "Kota Serang": [
    "Cipocok Jaya", "Curug", "Kasemen", "Serang", "Taktakan", "Walantaka"
  ],
  "Kota Tangerang Selatan": [
    "Ciputat", "Ciputat Timur", "Pamulang", "Pondok Aren", "Serpong", "Serpong Utara", "Setu"
  ],
};

// --- DATA KELURAHAN (Sampel Wilayah Kota / Urban Utama) ---
export const subDistrictsByDistrict: Record<string, string[]> = {
  // Kota Tangerang Selatan
  "Ciputat": ["Cipayung", "Ciputat", "Jombang", "Sawah Baru", "Sawah Lama", "Serua", "Serua Indah"],
  "Ciputat Timur": ["Cempaka Putih", "Cireundeu", "Pisangan", "Pondok Ranji", "Rempoa", "Rengas"],
  "Pamulang": ["Bambu Apus", "Benda Baru", "Kedaung", "Pamulang Barat", "Pamulang Timur", "Pondok Cabe Ilir", "Pondok Cabe Udik", "Pondok Benda"],
  "Pondok Aren": ["Jurang Mangu Barat", "Jurang Mangu Timur", "Pondok Kacang Barat", "Pondok Kacang Timur", "Perigi Baru", "Perigi Lama", "Pondok Aren", "Pondok Karya", "Pondok Jaya", "Pondok Betung", "Pondok Pucung"],
  "Serpong": ["Buaran", "Ciater", "Cilenggang", "Lengkong Gudang", "Lengkong Gudang Timur", "Lengkong Wetan", "Rawa Buntu", "Rawa Mekar Jaya", "Serpong"],
  "Serpong Utara": ["Lengkong Karya", "Pakualam", "Pakulonan", "Paku Jaya", "Pondok Jagung", "Pondok Jagung Timur"],
  "Setu": ["Babakan", "Bakti Jaya", "Kademangan", "Keranggan", "Muncul", "Setu"],

  // Kota Tangerang
  "Tangerang": ["Buaran Indah", "Cikokol", "Sukasari", "Babakan", "Sukabarang", "Tanah Tinggi"],
  "Karawaci": ["Boone", "Bugel", "Cimone", "Cimone Jaya", "Gerendeng", "Karawaci", "Karawaci Baru", "Koang Jaya", "Margasari", "Nambo Jaya", "Pabuaran", "Pabuaran Tumpeng", "Pasar Baru", "Sukatani", "Sumur Pacing"],
  "Cipondoh": ["Cipondoh", "Cipondoh Indah", "Cipondoh Makmur", "Gondrong", "Kenanga", "Ketapang", "Petir", "Poris Plawad", "Poris Plawad Indah", "Poris Plawad Utara"],
  "Ciledug": ["Bangunan Baru", "Ciledug Indah", "Paninggilan", "Paninggilan Utara", "Parung Serab", "Sudimara Barat", "Sudimara Jaya", "Sudimara Selatan", "Sudimara Timur"],

  // Kota Serang
  "Serang": ["Cimuncang", "Cipare", "Kotabaru", "Lontarbaru", "Lopang", "Kagungan", "Serang", "Sukawana", "Unyur", "Kaligandu", "Terondol"],
  "Cipocok Jaya": ["Banjaragung", "Banjarsari", "Cipocok Jaya", "Karundang", "Panancangan", "Tembong", "Dalung", "Gelam"],
};

// --- DATA KODE POS (Langsung Pemetaan ke Tingkat Kelurahan) ---
export const postalCodesBySubDistrict: Record<string, string> = {
  // Kota Tangerang Selatan
  "Cipayung": "15411", "Ciputat": "15411", "Jombang": "15414", "Sawah Baru": "15413", "Sawah Lama": "15413", "Serua": "15414", "Serua Indah": "15414",
  "Cempaka Putih": "15412", "Cireundeu": "15419", "Pisangan": "15419", "Pondok Ranji": "15412", "Rempoa": "15412", "Rengas": "15412",
  "Bambu Apus": "15415", "Benda Baru": "15418", "Kedaung": "15415", "Pamulang Barat": "15417", "Pamulang Timur": "15417", "Pondok Cabe Ilir": "15418", "Pondok Cabe Udik": "15418", "Pondok Benda": "15416",
  "Buaran": "15310", "Ciater": "15310", "Cilenggang": "15310", "Lengkong Gudang": "15321", "Lengkong Gudang Timur": "15321", "Lengkong Wetan": "15322", "Rawa Buntu": "15318", "Rawa Mekar Jaya": "15310", "Serpong": "15311",

  // Kota Tangerang
  "Buaran Indah": "15119", "Cikokol": "15117", "Sukasari": "15111", "Babakan": "15118", "Tanah Tinggi": "15121",
  "Cipondoh": "15148", "Cipondoh Indah": "15148", "Cipondoh Makmur": "15148", "Gondrong": "15146", "Kenanga": "15146", "Ketapang": "15147", "Petir": "15147",

  // Kota Serang
  "Cimuncang": "42111", "Cipare": "42117", "Kotabaru": "42112", "Lontarbaru": "42115", "Lopang": "42113", "Kagungan": "42114", "Serang": "42116",
  "Banjaragung": "42122", "Banjarsari": "42123", "Cipocok Jaya": "42121", "Karundang": "42125", "Panancangan": "42124",
};


// Add postalCodesByCity for compatibility
export const postalCodesByCity: Record<string, string[]> = {
  "Kabupaten Pandeglang": ["42211", "42212", "42213", "42214", "42215", "42216", "42217", "42218", "42219"],
  "Kabupaten Lebak": ["42311", "42312", "42313", "42314", "42315", "42316", "42317", "42318", "42319"],
  "Kabupaten Tangerang": ["15510", "15520", "15530", "15540", "15550", "15560", "15570", "15580", "15590"],
  "Kabupaten Serang": ["42111", "42112", "42113", "42114", "42115", "42116", "42117", "42118", "42119"],
  "Kota Tangerang": ["15110", "15111", "15112", "15113", "15114", "15115", "15116", "15117", "15118", "15119"],
  "Kota Cilegon": ["42411", "42412", "42413", "42414", "42415", "42416", "42417", "42418", "42419"],
  "Kota Serang": ["42121", "42122", "42123", "42124", "42125", "42126", "42127", "42128", "42129"],
  "Kota Tangerang Selatan": ["15310", "15311", "15312", "15313", "15314", "15315", "15316", "15317", "15318", "15319"],
};

