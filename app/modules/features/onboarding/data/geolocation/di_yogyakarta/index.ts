export const name = "DI Yogyakarta";
export const cities = ["Kota Yogyakarta","Kabupaten Bantul","Kabupaten Gunungkidul","Kabupaten Kulon Progo","Kabupaten Sleman"];
export const districtsByCity: Record<string, string[]> = {
  "Kota Yogyakarta": ["Danurejan","Gedongtengen","Gondokusuman","Gondomanan","Jetis","Kotagede","Kraton","Mantrijeron","Mergangsan","Ngampilan","Pakualaman","Tegalrejo","Umbulharjo","Wirobrajan"],
  "Kabupaten Bantul": ["Bambanglipuro","Banguntapan","Bantul","Dlingo","Imogiri","Jetis","Kasihan","Kretek","Pajangan","Pandak","Piyungan","Pleret","Pundong","Sanden","Sedayu","Sewon","Srandakan"],
  "Kabupaten Gunungkidul": ["Gedangsari","Girisubo","Karangmojo","Ngawen","Nglipar","Paliyan","Panggang","Patuk","Playen","Ponjong","Purwosari","Rongkop","Saptosari","Semanu","Semin","Tanjungsari","Tepus","Wonosari"],
  "Kabupaten Kulon Progo": ["Galur","Girimulyo","Kalibawang","Kokap","Lendah","Nanggulan","Panjatan","Pengasih","Samigaluh","Sentolo","Temon","Wates"],
  "Kabupaten Sleman": ["Berbah","Cangkringan","Depok","Gamping","Godean","Kalasan","Minggir","Mlati","Moyudan","Ngaglik","Ngemplak","Pakem","Prambanan","Seyegan","Sleman","Tempel","Turi"],
};
export const postalCodesByCity: Record<string, string[]> = {
  "Kota Yogyakarta": ["55111","55112","55121","55122","55131","55132","55141","55142","55151","55161","55162","55163","55171","55172","55181","55182","55211","55212","55221","55222","55231","55232","55241","55242","55251","55252","55261","55262","55271","55272"],
  "Kabupaten Sleman": ["55511","55512","55513","55514","55515","55516","55517","55518","55519","55521","55522","55523","55524","55525","55526","55581","55582","55583","55584","55585","55586","55587","55588","55589"],
  "Kabupaten Bantul": ["55711","55712","55721","55722","55731","55732","55741","55742","55751","55752","55761","55762","55771","55772","55781","55782","55791","55792"],
  "Kabupaten Kulon Progo": ["55611","55612","55651","55652","55653","55654","55655","55656","55657","55658","55659","55661","55662","55663","55664","55665","55666","55671","55672","55673","55674","55675","55676","55677"],
  "Kabupaten Gunungkidul": ["55811","55812","55821","55822","55831","55832","55841","55842","55851","55852","55861","55862","55871","55872","55881","55882","55891","55892"],
};


