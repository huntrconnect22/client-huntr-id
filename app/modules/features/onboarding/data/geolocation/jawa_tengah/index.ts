export const name = "Jawa Tengah";

export const cities = [
  "Kota Semarang", "Kota Surakarta", "Kota Salatiga", "Kota Magelang",
  "Kota Pekalongan", "Kota Tegal",
  "Kabupaten Semarang", "Kabupaten Boyolali", "Kabupaten Klaten",
  "Kabupaten Sukoharjo", "Kabupaten Wonogiri", "Kabupaten Karanganyar",
  "Kabupaten Sragen", "Kabupaten Grobogan", "Kabupaten Blora",
  "Kabupaten Rembang", "Kabupaten Pati", "Kabupaten Kudus",
  "Kabupaten Jepara", "Kabupaten Demak", "Kabupaten Kendal",
  "Kabupaten Batang", "Kabupaten Pekalongan", "Kabupaten Pemalang",
  "Kabupaten Tegal", "Kabupaten Brebes", "Kabupaten Banyumas",
  "Kabupaten Cilacap", "Kabupaten Purbalingga", "Kabupaten Banjarnegara",
  "Kabupaten Kebumen", "Kabupaten Purworejo", "Kabupaten Wonosobo",
  "Kabupaten Magelang", "Kabupaten Temanggung",
];

export const districtsByCity: Record<string, string[]> = {
  "Kota Semarang": [
    "Banyumanik", "Candisari", "Gajahmungkur", "Gayamsari", "Genuk",
    "Gunungpati", "Mijen", "Ngaliyan", "Pedurungan", "Semarang Barat",
    "Semarang Selatan", "Semarang Tengah", "Semarang Timur", "Semarang Utara",
    "Tembalang", "Tugu",
  ],
  "Kota Surakarta": [
    "Banjarsari", "Jebres", "Laweyan", "Pasar Kliwon", "Serengan",
  ],
  "Kota Salatiga": [
    "Argomulyo", "Sidomukti", "Sidorejo", "Tingkir",
  ],
  "Kota Magelang": [
    "Magelang Selatan", "Magelang Tengah", "Magelang Utara",
  ],
  "Kota Pekalongan": [
    "Pekalongan Barat", "Pekalongan Timur", "Pekalongan Utara", "Pekalongan Selatan",
  ],
  "Kota Tegal": [
    "Margadana", "Tegal Barat", "Tegal Selatan", "Tegal Timur",
  ],
  "Kabupaten Semarang": [
    "Ambarawa", "Bancak", "Bandungan", "Bangu", "Banyubiru",
    "Bergas", "Bringin", "Getasan", "Jambu", "Kaliwungu",
    "Pabelan", "Pringapus", "Sumowono", "Suruh", "Susukan",
    "Tengaran", "Tuntang", "Ungaran Barat", "Ungaran Timur",
  ],
  "Kabupaten Klaten": [
    "Bayat", "Cawas", "Ceper", "Delanggu", "Gantiwarno",
    "Jatinom", "Jogonalan", "Juwiring", "Kalikotes", "Karanganom",
    "Karangdowo", "Karangnongko", "Kebonarum", "Kemalang", "Klaten Tengah",
    "Klaten Selatan", "Klaten Utara", "Manisrenggo", "Ngawen", "Pedan",
    "Polanharjo", "Prambanan", "Trucuk", "Tulung", "Wedi",
    "Wonosari",
  ],
  "Kabupaten Banyumas": [
    "Ajibarang", "Banyumas", "Baturraden", "Cilongok", "Gumelar",
    "Jatilawang", "Kalibagor", "Karanglewas", "Kebasen", "Kedungbanteng",
    "Kemranjen", "Kembaran", "Lumbir", "Patikraja", "Pekuncen",
    "Purwojati", "Purwokerto Barat", "Purwokerto Selatan", "Purwokerto Timur",
    "Purwokerto Utara", "Rawalo", "Sokaraja", "Somagede", "Sumbang",
    "Sumpiuh", "Tambak", "Wangon",
  ],
  "Kabupaten Cilacap": [
    "Adipala", "Binangun", "Bantarsari", "Cimanggu", "Cipari",
    "Cilacap Selatan", "Cilacap Tengah", "Cilacap Utara", "Dayeuhluhur",
    "Gandrungmangu", "Jeruklegi", "Kampung Laut", "Karangpucung",
    "Kesugihan", "Kroya", "Majenang", "Maos", "Nusawungu",
    "Patimuan", "Sampang", "Sidareja", "Wanareja",
  ],
  "Kabupaten Kudus": [
    "Bae", "Dawe", "Gebog", "Jati", "Jekulo",
    "Kaliwungu", "Kota", "Mejobo", "Undaan",
  ],
  "Kabupaten Jepara": [
    "Bangsri", "Batealit", "Donorojo", "Gepat", "Jepara",
    "Kalinyamatan", "Karimunjawa", "Kedung", "Keling", "Kembang",
    "Mayong", "Mlonggo", "Nalumsari", "Pakis Aji", "Pecangaan",
    "Tahunan", "Welahan",
  ],
  "Kabupaten Pati": [
    "Batangan", "Cluwak", "Dukuhseti", "Gabus", "Gembong",
    "Gunungwungkal", "Jakenan", "Jaken", "Juwana", "Kayen",
    "Margorejo", "Pati", "Pucakwangi", "Sukolilo", "Tayu",
    "Tlogowungu", "Trangkil", "Wedarijaksa", "Winong",
  ],
  "Kabupaten Brebes": [
    "Bantarkawung", "Banjarharjo", "Bulakamba", "Bumiayu", "Jatibarang",
    "Kersana", "Ketanggungan", "Larangan", "Losari", "Paguyangan",
    "Salem", "Sirampog", "Songgom", "Tanjung", "Tonjong",
    "Wanasari",
  ],
  "Kabupaten Kebumen": [
    "Adimulyo", "Alian", "Ambal", "Ayah", "Bonorowo",
    "Buayan", "Buluspesantren", "Gombong", "Karanganyar", "Karanggayam",
    "Karangsambung", "Kebumen", "Klirong", "Kutowinangun", "Kuwarasan",
    "Mirit", "Padureso", "Pejagoan", "Petanahan", "Poncowarno",
    "Prembun", "Puring", "Rowokele", "Sadang", "Sempor",
    "Sruweng",
  ],
};

export const postalCodesByCity: Record<string, string[]> = {
  "Kota Semarang": ["50111","50112","50113","50114","50115","50116","50117","50118","50119","50121","50122","50123","50124","50125","50131","50132","50133","50134","50135","50136","50137","50138","50139","50141","50142","50143","50144","50145","50146","50147","50148","50149","50151","50152","50153","50154","50155","50156","50157","50158","50159","50161","50162","50163","50164","50165","50166","50167","50168","50169","50171","50172","50173","50174","50175","50176","50177","50178","50179","50181","50182","50183","50184","50185","50186","50187","50188","50189","50191","50192","50193","50194","50195","50196","50197","50198","50199","50211","50212","50213","50214","50215","50216","50217","50218","50219","50221","50222","50223","50224","50225","50226","50227","50228","50229","50231","50232","50233","50234","50235","50236","50237","50238","50239","50241","50242","50243","50244","50245","50246","50247","50248","50249","50251","50252","50253","50254","50255","50256","50257","50258","50259","50261","50262","50263","50264","50265","50266","50267","50268","50269","50271","50272","50273","50274","50275","50276"],
  "Kota Surakarta": ["57111","57112","57113","57114","57115","57116","57117","57118","57119","57121","57122","57123","57124","57125","57126","57127","57128","57129","57131","57132","57133","57134","57135","57136","57137","57138","57139","57141","57142","57143","57144","57145","57146","57147","57148","57149","57151","57152","57153","57154","57155","57156","57157","57158","57159","57161","57162","57163","57164","57165","57166","57167","57168","57169"],
  "Kabupaten Banyumas": ["53111","53112","53113","53114","53115","53116","53117","53118","53119","53121","53122","53123","53124","53125","53126","53127","53128","53129","53131","53132","53133","53134","53135","53136","53137","53138","53139","53141","53142","53143","53144","53145","53146","53147","53148","53149","53151","53152","53153","53154","53155","53156","53157","53158","53159","53161","53162","53163","53164","53165","53166","53167","53168","53169","53171","53172","53173","53174","53175","53176","53177","53178","53179","53181","53182","53183","53184","53185","53186","53187","53188","53189","53191","53192","53193","53194","53195","53196","53197","53198","53199"],
};


