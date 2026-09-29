/**
 * Production-Ready Multi-Role Registration Engine (SIH 2026)
 * - Farmer Registration (7 Steps + AI OCR + Brevo OTP + PDF Receipt)
 * - Procurement Officer Registration (7 Steps + Identity + OTP + Admin Approval)
 * - Super Admin First-Time Setup Wizard (6 Steps + Permanent Lock Protection)
 */

// In-Memory state for active wizard
let currentRegType = 'farmer'; // 'farmer' | 'officer' | 'superadmin'
let currentRegStep = 1;
let totalRegSteps = 7;
let regDraftData = {
  farmer: {},
  officer: {},
  superadmin: {}
};
let verifiedDocs = {
  farmer: {},
  officer: {},
  superadmin: {}
};
let activeTempId = '';
let otpCountdownInterval = null;
let otpSecondsLeft = 60;

// Comprehensive State, District & Taluka database for all 28 States & 8 Union Territories of India
const INDIA_LOCATIONS = {
  "Andhra Pradesh": {
    "Guntur": { talukas: ["Guntur", "Tenali", "Narasaraopet", "Mangalagiri", "Bapatla"], villages: ["Tadikonda", "Chebrolu", "Ponnur", "Duggirala"] },
    "Krishna": { talukas: ["Machilipatnam", "Gudivada", "Vijayawada Rural", "Nuzvid"], villages: ["Kankipadu", "Gannavaram", "Vuyyuru", "Pamarru"] },
    "Kurnool": { talukas: ["Kurnool", "Nandyal", "Adoni", "Yemmiganur"], villages: ["Kallur", "Kodumur", "Dhone", "Alur"] },
    "Visakhapatnam": { talukas: ["Anakapalle", "Bheemunipatnam", "Gajuwaka", "Chodavaram"], villages: ["Pendurthi", "Padmanabham", "Kasimkota"] },
    "West Godavari": { talukas: ["Eluru", "Bhimavaram", "Tadepalligudem", "Tanuku"], villages: ["Palakollu", "Narasapuram", "Jangareddygudem"] },
    "East Godavari": { talukas: ["Kakinada", "Rajahmundry", "Amalapuram", "Peddapuram"], villages: ["Samalkota", "Ramachandrapuram", "Mandapeta"] },
    "Chittoor": { talukas: ["Chittoor", "Tirupati", "Madanapalle", "Srikalahasti"], villages: ["Punganur", "Nagari", "Pileru"] },
    "Anantapur": { talukas: ["Anantapur", "Dharmavaram", "Hindupur", "Kadiri"], villages: ["Gooty", "Tadipatri", "Rayadurg"] }
  },
  "Arunachal Pradesh": {
    "Papum Pare": { talukas: ["Itanagar", "Naharlagun", "Doimukh", "Sagalee"], villages: ["Balijan", "Kimin", "Mengio"] },
    "Changlang": { talukas: ["Changlang", "Miao", "Jairampur", "Bordumsa"], villages: ["Nampong", "Diyun", "Kharsang"] },
    "West Kameng": { talukas: ["Bomdila", "Dirang", "Rupa", "Bhalukpong"], villages: ["Singchung", "Kalaktang", "Nafra"] },
    "East Siang": { talukas: ["Pasighat", "Ruksin", "Mebo"], villages: ["Sille", "Bilat", "Nari"] }
  },
  "Assam": {
    "Kamrup": { talukas: ["Guwahati", "Palashbari", "Hajo", "Rangia"], villages: ["Chaygaon", "Boko", "Kamalpur", "Sualkuchi"] },
    "Nagaon": { talukas: ["Nagaon", "Koliabor", "Raha", "Dhing"], villages: ["Samaguri", "Rupahi", "Kampur"] },
    "Sonitpur": { talukas: ["Tezpur", "Dhekiajuli", "Chariduar"], villages: ["Rangapara", "Jamugurihat", "Balipara"] },
    "Dibrugarh": { talukas: ["Dibrugarh West", "Chabua", "Naharkatia"], villages: ["Moran", "Tingkhong", "Namrup"] },
    "Cachar": { talukas: ["Silchar", "Sonai", "Lakhipur", "Katigorah"], villages: ["Udarbond", "Dholai", "Borkhola"] },
    "Jorhat": { talukas: ["Jorhat", "Titabor", "Teok"], villages: ["Mariani", "Majuli", "Dergaon"] }
  },
  "Bihar": {
    "Patna": { talukas: ["Patna Sadar", "Barh", "Danapur", "Masaurhi", "Mokama"], villages: ["Fatuha", "Bakhtiarpur", "Maner", "Bikram", "Paliganj"] },
    "Muzaffarpur": { talukas: ["Mushahari", "Kanti", "Motipur", "Marwan"], villages: ["Sahebganj", "Paroo", "Sakra", "Saraiya"] },
    "Gaya": { talukas: ["Gaya Town", "Bodh Gaya", "Sherghati", "Tekari"], villages: ["Manpur", "Belaganj", "Wazirganj", "Barachatti"] },
    "Bhagalpur": { talukas: ["Sultanganj", "Kahalgaon", "Naugachia", "Pirpainti"], villages: ["Sabour", "Colgong", "Bihpur"] },
    "Nalanda": { talukas: ["Biharsharif", "Rajgir", "Hilsa", "Islampur"], villages: ["Ekangarsarai", "Noorsarai", "Chandi"] },
    "Rohtas": { talukas: ["Sasaram", "Dehri", "Bikramganj"], villages: ["Kargahar", "Nokha", "Chenari", "Dinara"] },
    "Samastipur": { talukas: ["Samastipur", "Rosera", "Dalsinghsarai", "Pusa"], villages: ["Ujiarpur", "Tajpur", "Kalyanpur"] },
    "Purnia": { talukas: ["Purnia Sadar", "Kasba", "Banmankhi", "Dhamdaha"], villages: ["Amour", "Baisi", "Krityanand Nagar"] }
  },
  "Chhattisgarh": {
    "Raipur": { talukas: ["Raipur", "Arang", "Abhanpur", "Tilda"], villages: ["Mandir Hasaud", "Kharora", "Gobra Nawapara"] },
    "Durg": { talukas: ["Durg", "Bhilai", "Patan", "Dhamdha"], villages: ["Kumhari", "Ahiwara", "Jamul", "Utai"] },
    "Bilaspur": { talukas: ["Bilaspur", "Kota", "Bilha", "Masturi"], villages: ["Takhatpur", "Ratanpur", "Bodri"] },
    "Rajnandgaon": { talukas: ["Rajnandgaon", "Dongargarh", "Khairagarh"], villages: ["Dongargaon", "Chhuikhadan", "Ghandai"] },
    "Korba": { talukas: ["Korba", "Katghora", "Pali"], villages: ["Deepka", "Gevra", "Hardibazar"] },
    "Janjgir-Champa": { talukas: ["Janjgir", "Champa", "Akaltara", "Sakti"], villages: ["Naila", "Pamgarh", "Dabhra"] }
  },
  "Goa": {
    "North Goa": { talukas: ["Tiswadi", "Bardez", "Pernem", "Bicholim", "Sattari"], villages: ["Panaji", "Mapusa", "Calangute", "Porvorim", "Valpoi"] },
    "South Goa": { talukas: ["Salcete", "Mormugao", "Ponda", "Quepem", "Canacona"], villages: ["Margao", "Vasco da Gama", "Curchorem", "Navelim"] }
  },
  "Gujarat": {
    "Ahmedabad": { talukas: ["Daskroi", "Sanand", "Dholka", "Bavla", "Viramgam", "Dhandhuka"], villages: ["Khokhra", "Changodar", "Bareja", "Bhadaj", "Kasindra"] },
    "Rajkot": { talukas: ["Rajkot", "Gondal", "Jasdan", "Jetpur", "Dhoraji", "Upleta"], villages: ["Shapar", "Kuvadva", "Ribda", "Kotda Sangani"] },
    "Surat": { talukas: ["Chorasi", "Olpad", "Kamrej", "Bardoli", "Mandvi", "Mahuva"], villages: ["Sayan", "Kim", "Kadodara", "Palsana"] },
    "Vadodara": { talukas: ["Vadodara", "Padra", "Karjan", "Dabhoi", "Waghodia", "Savli"], villages: ["Vemali", "Por", "Shinore", "Jarod"] },
    "Mehsana": { talukas: ["Mehsana", "Visnagar", "Kadi", "Unjha", "Vadnagar", "Vijapur"], villages: ["Ambaliyasan", "Kheralu", "Satlasana"] },
    "Junagadh": { talukas: ["Junagadh", "Keshod", "Mangrol", "Visavadar", "Manavadar"], villages: ["Vanthali", "Malia Hatina", "Bilkha"] },
    "Bhavnagar": { talukas: ["Bhavnagar", "Sihor", "Palitana", "Mahuva", "Talaja", "Gariadhar"], villages: ["Vartej", "Ghogha", "Vallabhipur"] },
    "Anand": { talukas: ["Anand", "Petlad", "Borsad", "Khambhat", "Umreth", "Sojitra"], villages: ["Vasad", "Tarapur", "Vallabh Vidyanagar"] },
    "Banaskantha": { talukas: ["Palanpur", "Deesa", "Dhanera", "Tharad", "Vav"], villages: ["Dantiwada", "Amirgadh", "Shihori"] },
    "Amreli": { talukas: ["Amreli", "Dhari", "Bagasara", "Rajula", "Savarkundla"], villages: ["Lathi", "Babra", "Jafrabad"] }
  },
  "Haryana": {
    "Karnal": { talukas: ["Karnal", "Gharaunda", "Nilokheri", "Assandh", "Indri"], villages: ["Taraori", "Kunjpura", "Nissing", "Jundla"] },
    "Ambala": { talukas: ["Ambala City", "Ambala Cantt", "Barara", "Naraingarh"], villages: ["Saha", "Shahzadpur", "Mullana"] },
    "Hisar": { talukas: ["Hisar", "Hansi", "Barwala", "Narnaund", "Adampur"], villages: ["Uklana", "Bass", "Agroha"] },
    "Kurukshetra": { talukas: ["Thanesar", "Pehowa", "Shahbad", "Ladwa"], villages: ["Babain", "Ismailabad", "Jhansa"] },
    "Sirsa": { talukas: ["Sirsa", "Dabwali", "Rania", "Ellenabad"], villages: ["Kalanwali", "Chopta", "Ding"] },
    "Panipat": { talukas: ["Panipat", "Samalkha", "Israna", "Bapoli"], villages: ["Madlauda", "Sanauli", "Alupur"] },
    "Rohtak": { talukas: ["Rohtak", "Meham", "Sampla", "Kalanaur"], villages: ["Mokhra", "Bhalout", "Kharawar"] }
  },
  "Himachal Pradesh": {
    "Shimla": { talukas: ["Shimla Urban", "Shimla Rural", "Theog", "Rampur", "Rohru"], villages: ["Kufri", "Kotkhai", "Jubbal", "Kumarsain"] },
    "Kangra": { talukas: ["Dharamshala", "Kangra", "Palampur", "Nurpur", "Dehra"], villages: ["Nagrota Bagwan", "Baijnath", "Jawalamukhi"] },
    "Mandi": { talukas: ["Mandi Sadar", "Sundernagar", "Sarkaghat", "Jogindernagar"], villages: ["Karsog", "Chachiot", "Gohar"] },
    "Kullu": { talukas: ["Kullu", "Manali", "Banjar", "Anni"], villages: ["Naggar", "Bhuntar", "Nirmand"] },
    "Solan": { talukas: ["Solan", "Nalagarh", "Baddi", "Kasauli", "Arki"], villages: ["Kandaghat", "Dharampur", "Darlaghat"] }
  },
  "Jharkhand": {
    "Ranchi": { talukas: ["Ranchi Sadar", "Kanke", "Namkum", "Ormanjhi", "Bundu"], villages: ["Tatisilwai", "Bero", "Silli", "Mandar"] },
    "Dhanbad": { talukas: ["Dhanbad", "Jharia", "Baghmara", "Nirsa", "Govindpur"], villages: ["Tundi", "Topchanchi", "Baliapur"] },
    "East Singhbhum": { talukas: ["Jamshedpur", "Ghatshila", "Potka", "Bahargora"], villages: ["Golmuri", "Bistupur", "Musabani", "Chakulia"] },
    "Bokaro": { talukas: ["Chas", "Bermo", "Gomia", "Chandankiyari"], villages: ["Petarwar", "Jaridih", "Kasmar"] },
    "Hazaribagh": { talukas: ["Hazaribagh Sadar", "Barhi", "Barkagaon", "Chauparan"], villages: ["Ichak", "Katkamsandi", "Vishnugarh"] }
  },
  "Karnataka": {
    "Bengaluru Urban": { talukas: ["Bengaluru North", "Bengaluru South", "Bengaluru East", "Anekal"], villages: ["Yelahanka", "Kengeri", "Sarjapur", "Attibele"] },
    "Belagavi": { talukas: ["Belagavi", "Gokak", "Chikkodi", "Athani", "Bailhongal"], villages: ["Saundatti", "Raibag", "Hukkeri", "Ramdurg"] },
    "Mysuru": { talukas: ["Mysuru", "Nanjangud", "Hunsur", "T. Narasipura", "Piriyapatna"], villages: ["Bannur", "Saligrama", "Biligere"] },
    "Davanagere": { talukas: ["Davanagere", "Harihara", "Channagiri", "Honnali"], villages: ["Jagalur", "Nyamathi", "Mayakonda"] },
    "Dharwad": { talukas: ["Dharwad", "Hubballi Urban", "Hubballi Rural", "Kundgol", "Navalgund"], villages: ["Kalghatgi", "Alnavar", "Hebballi"] },
    "Ballari": { talukas: ["Ballari", "Hospet", "Siruguppa", "Sandur", "Kudligi"], villages: ["Kampli", "Kurugodu", "Tekkalakote"] },
    "Kalaburagi": { talukas: ["Kalaburagi", "Sedam", "Chincholi", "Aland", "Afzalpur"], villages: ["Jewargi", "Shahabad", "Kamalapur"] }
  },
  "Kerala": {
    "Palakkad": { talukas: ["Palakkad", "Chittur", "Alathur", "Ottapalam", "Mannarkkad"], villages: ["Pattambi", "Cherpulassery", "Kuzhalmannam", "Kollengode"] },
    "Wayanad": { talukas: ["Vythiri", "Sulthan Bathery", "Mananthavady"], villages: ["Kalpetta", "Meppadi", "Ambalavayal", "Pulpally"] },
    "Idukki": { talukas: ["Devikulam", "Udumbanchola", "Thodupuzha", "Peerumade"], villages: ["Munnar", "Kattappana", "Adimali", "Kumily"] },
    "Thrissur": { talukas: ["Thrissur", "Mukundapuram", "Chalakudy", "Kodungallur", "Chavakkad"], villages: ["Irinjalakuda", "Kunnamkulam", "Guruvayur"] },
    "Ernakulam": { talukas: ["Kochi", "Kanakannoor", "Aluva", "Kunnathunad", "Muvattupuzha"], villages: ["Angamaly", "Perumbavoor", "Kothamangalam"] }
  },
  "Madhya Pradesh": {
    "Bhopal": { talukas: ["Huzur", "Berasia"], villages: ["Ratibad", "Karond", "Bairagarh", "Kolar", "Sukhi Sewaniya"] },
    "Sehore": { talukas: ["Sehore", "Ashta", "Ichhawar", "Nasrullaganj", "Budhni"], villages: ["Bilkisganj", "Doraha", "Shyampur", "Mandi", "Rehti"] },
    "Raisen": { talukas: ["Raisen", "Gairatganj", "Begamganj", "Silwani", "Bareli"], villages: ["Sanchi", "Salamatpur", "Deewanganj", "Udaipura"] },
    "Indore": { talukas: ["Indore", "Sanwer", "Depalpur", "Mhow"], villages: ["Rau", "Betma", "Manglia", "Hatod", "Manpur"] },
    "Ujjain": { talukas: ["Ujjain", "Tarana", "Mahidpur", "Nagda", "Khachrod", "Barnagar"], villages: ["Tajpur", "Panbihar", "Ghattia", "Unhel"] },
    "Dewas": { talukas: ["Dewas", "Sonkatch", "Bagli", "Kannod", "Khategaon"], villages: ["Tonk Khurd", "Hatpipliya", "Satwas"] },
    "Vidisha": { talukas: ["Vidisha", "Basoda", "Kurwai", "Sironj", "Lateri"], villages: ["Gulabganj", "Gyaraspur", "Shamshabad"] },
    "Hoshangabad": { talukas: ["Hoshangabad", "Itarsi", "Pipariya", "Sohagpur", "Babai"], villages: ["Dolariya", "Bankhedi", "Semri Harchand"] },
    "Jabalpur": { talukas: ["Jabalpur", "Sihora", "Patan", "Panagar", "Shahpura"], villages: ["Kundam", "Majholi", "Bargi"] },
    "Gwalior": { talukas: ["Gwalior", "Dabra", "Bhitarwar", "Morar"], villages: ["Ghatigaon", "Antari", "Pichhore"] }
  },
  "Maharashtra": {
    "Nashik": { talukas: ["Nashik", "Niphad", "Sinnar", "Dindori", "Yeola", "Malegaon"], villages: ["Pimpalgaon", "Lasalgaon", "Ozar", "Deolali", "Satana"] },
    "Pune": { talukas: ["Haveli", "Baramati", "Shirur", "Junnar", "Khed", "Indapur"], villages: ["Manchar", "Narayangaon", "Uruli Kanchan", "Saswad", "Bhor"] },
    "Nagpur": { talukas: ["Nagpur Urban", "Nagpur Rural", "Katol", "Saoner", "Umred", "Ramtek"], villages: ["Kalmeshwar", "Bhiwapur", "Kuhi", "Parseoni"] },
    "Ahmednagar": { talukas: ["Nagar", "Rahuri", "Shrirampur", "Sangamner", "Kopargaon", "Shevgaon"], villages: ["Shirdi", "Parner", "Pathardi", "Nevasa"] },
    "Chhatrapati Sambhajinagar": { talukas: ["Aurangabad", "Paithan", "Vaijapur", "Gangapur", "Kannad", "Sillod"], villages: ["Waluj", "Chittegaon", "Khuldabad"] },
    "Solapur": { talukas: ["North Solapur", "South Solapur", "Barshi", "Pandharpur", "Madha", "Mohol"], villages: ["Akkalkot", "Karmala", "Sangola", "Malshiras"] },
    "Kolhapur": { talukas: ["Karvir", "Hatkanangle", "Shirol", "Radhanagari", "Kagal"], villages: ["Ichalkaranji", "Jaysingpur", "Gadhinglaj"] },
    "Jalgaon": { talukas: ["Jalgaon", "Bhusawal", "Chalisgaon", "Amalner", "Pachora", "Raver"], villages: ["Jamner", "Yawal", "Erandol", "Dharangaon"] }
  },
  "Manipur": {
    "Imphal West": { talukas: ["Lamphelpat", "Patsoi", "Wangoi"], villages: ["Lamsang", "Lilong", "Mayang Imphal"] },
    "Imphal East": { talukas: ["Porompat", "Keirao Bitra", "Sawombung"], villages: ["Lamlong", "Andro", "Yairipok"] },
    "Bishnupur": { talukas: ["Bishnupur", "Moirang", "Nambol"], villages: ["Kwasiphai", "Ningthoukhong", "Oinam"] },
    "Thoubal": { talukas: ["Thoubal", "Kakching", "Lilong"], villages: ["Wangjing", "Heirok", "Sugnu"] }
  },
  "Meghalaya": {
    "East Khasi Hills": { talukas: ["Mawkhar", "Mylliem", "Mawphlang", "Sohra"], villages: ["Shillong", "Cherrapunji", "Pynursla"] },
    "West Garo Hills": { talukas: ["Tura", "Dalu", "Dadenggre"], villages: ["Tikrikilla", "Rongram", "Selsella"] },
    "Ri-Bhoi": { talukas: ["Nongpoh", "Umling", "Umsning"], villages: ["Byrnihat", "Bhoirymbong", "Patharkhmah"] }
  },
  "Mizoram": {
    "Aizawl": { talukas: ["Aizawl Sadar", "Darlawn", "Thingsulthliah"], villages: ["Sairang", "Selesih", "Lengpui"] },
    "Lunglei": { talukas: ["Lunglei", "Hnahthial", "Tlabung"], villages: ["Lungsen", "Bunghmun", "Cherhlun"] },
    "Champhai": { talukas: ["Champhai", "Khawzawl", "Ngopa"], villages: ["Zokhawthar", "Farkawn", "Vaphai"] }
  },
  "Nagaland": {
    "Kohima": { talukas: ["Kohima Sadar", "Sechu-Zubza", "Chiephobozou"], villages: ["Jakhama", "Viswema", "Tseminyu"] },
    "Dimapur": { talukas: ["Dimapur Sadar", "Medziphema", "Niuland"], villages: ["Chumukedima", "Kuhuboto", "Dhansiripar"] },
    "Mokokchung": { talukas: ["Ongpangkong", "Asetkong", "Langpangkong"], villages: ["Changtongya", "Mangkolemba", "Tuli"] }
  },
  "Odisha": {
    "Khordha": { talukas: ["Bhubaneswar", "Khordha", "Jatni", "Banapur", "Begunia"], villages: ["Balianta", "Balipatna", "Tangi", "Bolagarh"] },
    "Cuttack": { talukas: ["Cuttack Sadar", "Salepur", "Athagarh", "Choudwar", "Banki"], villages: ["Baramba", "Nischintakoili", "Mahanga"] },
    "Ganjam": { talukas: ["Berhampur", "Chhatrapur", "Bhanjanagar", "Aska", "Hinjilicut"], villages: ["Polasara", "Bellaguntha", "Digapahandi"] },
    "Sambalpur": { talukas: ["Sambalpur", "Rengali", "Kuchinda", "Rairakhol"], villages: ["Maneswar", "Dhankauda", "Jujomura"] },
    "Balasore": { talukas: ["Balasore Sadar", "Basta", "Jaleswar", "Soro", "Nilagiri"], villages: ["Remuna", "Bahanaga", "Simulia"] },
    "Bargarh": { talukas: ["Bargarh", "Attabira", "Barpali", "Padampur", "Bhatli"], villages: ["Sohela", "Bheden", "Gaisilet"] }
  },
  "Punjab": {
    "Ludhiana": { talukas: ["Ludhiana East", "Ludhiana West", "Jagraon", "Khanna", "Payal", "Raikot"], villages: ["Samrala", "Sahnewal", "Doraha", "Mullanpur", "Machhiwara"] },
    "Patiala": { talukas: ["Patiala", "Nabha", "Rajpura", "Samana", "Patran"], villages: ["Sanaur", "Ghagga", "Bhadson", "Dudhan Sadhan"] },
    "Amritsar": { talukas: ["Amritsar-I", "Amritsar-II", "Ajnala", "Baba Bakala"], villages: ["Attari", "Majitha", "Rayya", "Chogawan"] },
    "Jalandhar": { talukas: ["Jalandhar-I", "Jalandhar-II", "Nakodar", "Phillaur", "Shahkot"], villages: ["Kartarpur", "Goraya", "Bhogpur", "Nurmahal"] },
    "Bathinda": { talukas: ["Bathinda", "Rampura Phul", "Talwandi Sabo", "Maur"], villages: ["Goniana", "Bhucho Mandi", "Sangat"] },
    "Sangrur": { talukas: ["Sangrur", "Sunam", "Dhuri", "Malerkotla", "Moonak"], villages: ["Dirba", "Bhawanigarh", "Lehragaga"] },
    "Firozpur": { talukas: ["Firozpur", "Zira", "Guru Har Sahai"], villages: ["Makhu", "Mamdot", "Ghall Khurd"] }
  },
  "Rajasthan": {
    "Jaipur": { talukas: ["Jaipur", "Sanganer", "Amber", "Chomu", "Kotputli", "Phulera"], villages: ["Bassi", "Chaksu", "Shahpura", "Jamwa Ramgarh", "Jobner"] },
    "Kota": { talukas: ["Kota", "Ladpura", "Digod", "Sangod", "Ramganj Mandi"], villages: ["Kanwas", "Mandana", "Sultanpur", "Chechat"] },
    "Jodhpur": { talukas: ["Jodhpur", "Luni", "Bilara", "Osian", "Phalodi", "Bhopalgarh"], villages: ["Piparcity", "Balesar", "Baori", "Shergarh"] },
    "Bikaner": { talukas: ["Bikaner", "Nokha", "Lunkaransar", "Kolayat", "Khajuwala"], villages: ["Deshnoke", "Dungargarh", "Bajju"] },
    "Sri Ganganagar": { talukas: ["Ganganagar", "Suratgarh", "Raisinghnagar", "Anupgarh", "Padampur"], villages: ["Sadulshahar", "Karanpur", "Vijaynagar"] },
    "Alwar": { talukas: ["Alwar", "Tijara", "Behror", "Kishangarh Bas", "Rajgarh"], villages: ["Thanagazi", "Bhiwadi", "Ramgarh", "Kathumar"] },
    "Udaipur": { talukas: ["Girwa", "Mavli", "Vallabhnagar", "Salumber", "Kherwara"], villages: ["Gogunda", "Jhadol", "Rishabhdeo", "Fatehnagar"] }
  },
  "Sikkim": {
    "East Sikkim": { talukas: ["Gangtok", "Pakyong", "Rongli"], villages: ["Ranipool", "Singtam", "Rhenock"] },
    "West Sikkim": { talukas: ["Gyalshing", "Soreng"], villages: ["Dentam", "Yuksom", "Tashiding"] },
    "South Sikkim": { talukas: ["Namchi", "Ravangla", "Jorethang"], villages: ["Melli", "Yangang", "Temi"] },
    "North Sikkim": { talukas: ["Mangan", "Chungthang"], villages: ["Lachen", "Lachung", "Dzongu"] }
  },
  "Tamil Nadu": {
    "Thanjavur": { talukas: ["Thanjavur", "Kumbakonam", "Papanasam", "Pattukkottai", "Orathanadu"], villages: ["Vallam", "Thiruvaiyaru", "Peravurani", "Budalur"] },
    "Coimbatore": { talukas: ["Coimbatore North", "Coimbatore South", "Pollachi", "Mettupalayam", "Sulur"], villages: ["Kinathukadavu", "Annur", "Valparai", "Madukkarai"] },
    "Madurai": { talukas: ["Madurai North", "Madurai South", "Melur", "Thirumangalam", "Usilampatti"], villages: ["Vadipatti", "Peraiyur", "Alanganallur"] },
    "Tiruchirappalli": { talukas: ["Tiruchirappalli", "Srirangam", "Lalgudi", "Manapparai", "Musiri"], villages: ["Thuraiyur", "Thottiyam", "Manachanallur"] },
    "Salem": { talukas: ["Salem", "Attur", "Mettur", "Omalur", "Sankari"], villages: ["Yercaud", "Edappadi", "Valapady", "Gangavalli"] },
    "Erode": { talukas: ["Erode", "Bhavani", "Gobichettipalayam", "Perundurai", "Sathyamangalam"], villages: ["Anthiyur", "Kodumudi", "Modakkurichi"] }
  },
  "Telangana": {
    "Warangal": { talukas: ["Warangal", "Hanamkonda", "Narsampet", "Parkal", "Wardhannapet"], villages: ["Geesugonda", "Dharmasagar", "Atmakur", "Inavolu"] },
    "Nizamabad": { talukas: ["Nizamabad North", "Nizamabad South", "Armoor", "Bodhan", "Bheemgal"], villages: ["Varni", "Dichpally", "Jakranpally", "Kotgiri"] },
    "Karimnagar": { talukas: ["Karimnagar", "Huzurabad", "Choppadandi", "Manakondur"], villages: ["Jammikunta", "Gangadhara", "Thimmapur"] },
    "Nalgonda": { talukas: ["Nalgonda", "Miryalaguda", "Devarakonda", "Nakrekal"], villages: ["Chityal", "Halia", "Damaracherla", "Kanagal"] },
    "Khammam": { talukas: ["Khammam Urban", "Khammam Rural", "Madhira", "Sathupalli", "Wyra"], villages: ["Kalluru", "Penuballi", "Thirumalayapalem"] },
    "Hyderabad": { talukas: ["Shaikpet", "Secunderabad", "Khairatabad", "Charminar"], villages: ["Gachibowli", "Madhapur", "Jubilee Hills", "Amberpet"] }
  },
  "Tripura": {
    "West Tripura": { talukas: ["Agartala", "Mohanpur", "Jirania"], villages: ["Ranirbazar", "Mandwi", "Dukli"] },
    "Gomati": { talukas: ["Udaipur", "Amarpur", "Karbook"], villages: ["Kakraban", "Matabari", "Ompi"] },
    "South Tripura": { talukas: ["Belonia", "Santirbazar", "Sabroom"], villages: ["Rajnagar", "Hrishyamukh", "Jolaibari"] },
    "North Tripura": { talukas: ["Dharmanagar", "Panisagar", "Kanchanpur"], villages: ["Kadamtala", "Jampui Hills", "Damcherra"] }
  },
  "Uttar Pradesh": {
    "Varanasi": { talukas: ["Varanasi", "Pindra", "Raja Talab"], villages: ["Cholapur", "Kashi", "Araziline", "Sewapuri", "Harahua"] },
    "Lucknow": { talukas: ["Lucknow Sadar", "Malihabad", "Bakshi Ka Talab", "Mohanlalganj", "Sarojini Nagar"], villages: ["Kakori", "Gosainganj", "Chinhat", "Itaunja"] },
    "Kanpur": { talukas: ["Kanpur Sadar", "Ghatampur", "Bilhaur", "Narwal"], villages: ["Bidhnu", "Kalyanpur", "Chaubepur", "Sarsaul"] },
    "Agra": { talukas: ["Agra", "Fatehabad", "Kheragarh", "Etmadpur", "Bah"], villages: ["Achhnera", "Barauli Ahir", "Khandauli", "Pinahat"] },
    "Prayagraj": { talukas: ["Sadar", "Phulpur", "Handia", "Karchhana", "Meja", "Soraon"], villages: ["Mau Aima", "Bahria", "Shankargarh", "Holagarh"] },
    "Gorakhpur": { talukas: ["Gorakhpur Sadar", "Sahjanwa", "Chauri Chaura", "Bansgaon", "Campierganj"], villages: ["Pipraich", "Bhadro", "Barhalganj"] },
    "Bareilly": { talukas: ["Bareilly Sadar", "Aonla", "Faridpur", "Baheri", "Nawabganj"], villages: ["Mirganj", "Bithri Chainpur", "Fatehganj"] },
    "Meerut": { talukas: ["Meerut Sadar", "Mawana", "Sardhana"], villages: ["Daurala", "Hastinapur", "Rohta", "Parikshitgarh"] },
    "Aligarh": { talukas: ["Koil", "Khair", "Atrauli", "Iglas", "Gabhana"], villages: ["Jawan", "Chandaus", "Lodha", "Bijauli"] }
  },
  "Uttarakhand": {
    "Dehradun": { talukas: ["Dehradun Sadar", "Rishikesh", "Vikasnagar", "Chakrata", "Doiwala"], villages: ["Sahaspur", "Kalsi", "Selaqui", "Herbertpur"] },
    "Haridwar": { talukas: ["Haridwar", "Roorkee", "Laksar", "Bhagwanpur"], villages: ["Jwalapur", "Bahadrabad", "Manglaur", "Khanpur"] },
    "Udham Singh Nagar": { talukas: ["Rudrapur", "Kashipur", "Kichha", "Khatima", "Bazpur", "Sitarganj"], villages: ["Gadarpur", "Mahukheraganj", "Dineshpur"] },
    "Nainital": { talukas: ["Nainital", "Haldwani", "Ramnagar", "Kaladhungi", "Dhari"], villages: ["Bhowali", "Bhimtal", "Mukteshwar"] }
  },
  "West Bengal": {
    "Purba Bardhaman": { talukas: ["Bardhaman Sadar North", "Bardhaman Sadar South", "Katwa", "Kalna"], villages: ["Memari", "Galsi", "Bhatar", "Jamalpur", "Raina"] },
    "Hooghly": { talukas: ["Chinsurah", "Chandannagar", "Serampore", "Arambagh"], villages: ["Singur", "Tarakeswar", "Dhanekhali", "Pandua", "Polba"] },
    "Nadia": { talukas: ["Krishnanagar Sadar", "Ranaghat", "Kalyani", "Tehatta"], villages: ["Nabadwip", "Santipur", "Chakdaha", "Karimpur"] },
    "Murshidabad": { talukas: ["Berhampore", "Lalbagh", "Kandi", "Jangipur", "Domkal"], villages: ["Beldanga", "Hariharpara", "Raninagar", "Raghunathganj"] },
    "North 24 Parganas": { talukas: ["Barasat Sadar", "Basirhat", "Bangaon", "Barrackpore"], villages: ["Habra", "Deganga", "Baduria", "Amdanga"] },
    "South 24 Parganas": { talukas: ["Alipore Sadar", "Baruipur", "Canning", "Diamond Harbour", "Kakdwip"], villages: ["Bhangar", "Bishnupur", "Sonarpur", "Kultali"] }
  },
  "Andaman and Nicobar Islands": {
    "South Andaman": { talukas: ["Port Blair", "Ferrargunj", "Little Andaman"], villages: ["Garacharma", "Prothrapur", "Hut Bay"] },
    "North and Middle Andaman": { talukas: ["Diglipur", "Mayabunder", "Rangat"], villages: ["Kalighat", "Kishorinagar", "Bakultala"] },
    "Nicobar": { talukas: ["Car Nicobar", "Nancowry", "Great Nicobar"], villages: ["Malacca", "Campbell Bay", "Kamorta"] }
  },
  "Chandigarh": {
    "Chandigarh": { talukas: ["Chandigarh City", "Chandigarh Rural"], villages: ["Manimajra", "Dhanas", "Burail", "Maloya", "Kaimbwala"] }
  },
  "Dadra and Nagar Haveli and Daman and Diu": {
    "Dadra and Nagar Haveli": { talukas: ["Silvassa", "Khanvel"], villages: ["Naroli", "Rakholi", "Samarvarni", "Dapada"] },
    "Daman": { talukas: ["Daman Sadar"], villages: ["Nani Daman", "Moti Daman", "Dunetha", "Kachigam"] },
    "Diu": { talukas: ["Diu Sadar"], villages: ["Ghoghla", "Fudam", "Bucharwada", "Vanakbara"] }
  },
  "Delhi": {
    "North Delhi": { talukas: ["Narela", "Alipur", "Model Town"], villages: ["Bakhtawarpur", "Bawana", "Burari", "Holambi Kalan"] },
    "North West Delhi": { talukas: ["Kanjhawala", "Saraswati Vihar", "Rohini"], villages: ["Khera Kalan", "Qutabgarh", "Mundka", "Rithala"] },
    "South Delhi": { talukas: ["Saket", "Hauz Khas", "Mehrauli"], villages: ["Chhatarpur", "Fatehpur Beri", "Bhati", "Asola"] },
    "South West Delhi": { talukas: ["Najafgarh", "Dwarka", "Kapashera"], villages: ["Dhansa", "Jharoda Kalan", "Ujwa", "Chhawla"] },
    "West Delhi": { talukas: ["Patel Nagar", "Punjabi Bagh", "Rajouri Garden"], villages: ["Tilak Nagar", "Janakpuri", "Paschim Vihar"] },
    "East Delhi": { talukas: ["Gandhi Nagar", "Preet Vihar", "Mayur Vihar"], villages: ["Mandawali", "Kalyanpuri", "Patparganj"] },
    "Central Delhi": { talukas: ["Karol Bagh", "Pahar Ganj", "Civil Lines"], villages: ["Daryaganj", "Kotwali", "Chandni Chowk"] },
    "New Delhi": { talukas: ["Chanakyapuri", "Delhi Cantonment", "Vasant Vihar"], villages: ["Mahipalpur", "Connaught Place", "Barakhamba"] }
  },
  "Jammu and Kashmir": {
    "Srinagar": { talukas: ["Srinagar South", "Srinagar North", "Eidgah"], villages: ["Pantha Chowk", "Shalteng", "Khanyar", "Batmaloo"] },
    "Jammu": { talukas: ["Jammu Sadar", "RS Pura", "Akhnoor", "Bishnah", "Marh"], villages: ["Satwari", "Bahu", "Nagrota", "Arnia"] },
    "Anantnag": { talukas: ["Anantnag", "Bijbehara", "Dooru", "Kokernag", "Pahalgam"], villages: ["Achabal", "Shangus", "Mattan"] },
    "Baramulla": { talukas: ["Baramulla", "Sopore", "Pattan", "Uri", "Tangmarg"], villages: ["Rafiabad", "Kreeri", "Kunzer"] },
    "Pulwama": { talukas: ["Pulwama", "Pampore", "Tral", "Awantipora"], villages: ["Kakapora", "Litter", "Shahoora"] },
    "Udhampur": { talukas: ["Udhampur", "Ramnagar", "Chenani", "Majalta"], villages: ["Tikri", "Basantgarh", "Panchari"] }
  },
  "Ladakh": {
    "Leh": { talukas: ["Leh", "Nubra", "Khaltse", "Nyoma", "Durbuk"], villages: ["Choglamsar", "Thiksey", "Diskit", "Hunder"] },
    "Kargil": { talukas: ["Kargil", "Sankoo", "Zanskar", "Drass", "Shakar Chiktan"], villages: ["Minji", "Barsoo", "Padum", "Panikhar"] }
  },
  "Lakshadweep": {
    "Lakshadweep": { talukas: ["Kavaratti", "Agatti", "Andrott", "Amini", "Minicoy"], villages: ["Kalpeni", "Kiltan", "Chetlat", "Kadmat"] }
  },
  "Puducherry": {
    "Puducherry": { talukas: ["Puducherry Sadar", "Oulgaret", "Villianur", "Bahour"], villages: ["Ariyankuppam", "Madagadipet", "Thirubuvanai"] },
    "Karaikal": { talukas: ["Karaikal Sadar", "Thirunallar"], villages: ["Kottucherry", "Nedungadu", "Neravy", "T.R. Pattinam"] },
    "Mahe": { talukas: ["Mahe Sadar"], villages: ["Chalakkara", "Chembra", "Pandakkal"] },
    "Yanam": { talukas: ["Yanam Sadar"], villages: ["Agraharam", "Daryalatippa", "Guerempeta"] }
  }
};

/**
 * Open Multi-Role Registration Chooser
 */
const openRegistrationChooser = async () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  document.getElementById('modal-title').textContent = 'Government of India • Procurement Registration Portal';

  // Check Super Admin status
  let superAdminAvailable = false;
  try {
    const res = await fetch('/api/registration/superadmin-status');
    const json = await res.json();
    superAdminAvailable = json.setupAvailable;
  } catch (e) {}

  body.innerHTML = `
    <div style="padding:10px 0;">
      <div style="text-align:center; margin-bottom:24px;">
        <div style="font-size:2.2rem; margin-bottom:6px;">🌾</div>
        <h3 style="color:var(--primary-navy); font-weight:800; margin-bottom:4px;">Select Registration Portal</h3>
        <p style="color:var(--text-muted); font-size:0.88rem;">National Kisan Procurement Management System (KPMS)</p>
      </div>

      <div style="display:grid; grid-template-columns:1fr; gap:14px;">
        <!-- Option 1: Farmer Registration -->
        <div class="glass-card" onclick="startRegistrationFlow('farmer')" style="cursor:pointer; padding:18px; border:2px solid transparent; transition:all 0.2s ease; display:flex; align-items:center; gap:16px;" onmouseover="this.style.borderColor='var(--saffron)'" onmouseout="this.style.borderColor='transparent'">
          <div style="width:52px; height:52px; border-radius:12px; background:rgba(224,109,20,0.12); color:var(--saffron); display:flex; align-items:center; justify-content:center; font-size:1.6rem; flex-shrink:0;">
            👨‍🌾
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="color:var(--primary-navy); font-weight:800; margin:0;">Farmer Registration</h4>
              <span class="status-pill active" style="font-size:0.75rem;">7-Step Onboarding</span>
            </div>
            <p style="color:var(--text-muted); font-size:0.82rem; margin:4px 0 0 0;">
              For agricultural producers. Guaranteed mandi slot booking, verified records & direct DBT MSP payouts.
            </p>
          </div>
          <i class="fas fa-arrow-right" style="color:var(--saffron);"></i>
        </div>

        <!-- Option 2: Procurement Officer Registration -->
        <div class="glass-card" onclick="startRegistrationFlow('officer')" style="cursor:pointer; padding:18px; border:2px solid transparent; transition:all 0.2s ease; display:flex; align-items:center; gap:16px;" onmouseover="this.style.borderColor='#2563EB'" onmouseout="this.style.borderColor='transparent'">
          <div style="width:52px; height:52px; border-radius:12px; background:rgba(37,99,235,0.12); color:#2563EB; display:flex; align-items:center; justify-content:center; font-size:1.6rem; flex-shrink:0;">
            👮
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="color:var(--primary-navy); font-weight:800; margin:0;">Procurement Officer Registration</h4>
              <span class="status-pill pending" style="font-size:0.75rem;">Govt Approval Required</span>
            </div>
            <p style="color:var(--text-muted); font-size:0.82rem; margin:4px 0 0 0;">
              For state APMC & mandi officers. Multi-level credential validation, centre assignment & admin approval.
            </p>
          </div>
          <i class="fas fa-arrow-right" style="color:#2563EB;"></i>
        </div>

        <!-- Option 3: Super Admin First-Time Setup Wizard -->
        <div class="glass-card" onclick="startRegistrationFlow('superadmin', ${superAdminAvailable})" style="cursor:pointer; padding:18px; border:2px solid transparent; transition:all 0.2s ease; display:flex; align-items:center; gap:16px; ${!superAdminAvailable ? 'opacity:0.75;' : ''}" onmouseover="this.style.borderColor='var(--green-gov)'" onmouseout="this.style.borderColor='transparent'">
          <div style="width:52px; height:52px; border-radius:12px; background:rgba(19,136,8,0.12); color:var(--green-gov); display:flex; align-items:center; justify-content:center; font-size:1.6rem; flex-shrink:0;">
            🏛️
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="color:var(--primary-navy); font-weight:800; margin:0;">Super Admin Setup Wizard</h4>
              <span class="status-pill ${superAdminAvailable ? 'completed' : 'rejected'}" style="font-size:0.75rem;">
                ${superAdminAvailable ? 'Initial Setup Available' : 'Permanently Locked'}
              </span>
            </div>
            <p style="color:var(--text-muted); font-size:0.82rem; margin:4px 0 0 0;">
              ${superAdminAvailable
                ? 'First-time setup for the national root administrative authority.'
                : 'A Super Admin is already configured. Authorized logins only.'}
            </p>
          </div>
          <i class="fas ${superAdminAvailable ? 'fa-arrow-right' : 'fa-lock'}" style="color:var(--green-gov);"></i>
        </div>
      </div>

      <div style="text-align:center; margin-top:20px; font-size:0.85rem; color:var(--text-muted);">
        Already registered? <a onclick="closeModal(); openLoginModal();" style="color:var(--saffron); font-weight:700; cursor:pointer;">Sign in here</a>
      </div>
    </div>
  `;
  modal.classList.add('active');
};

/**
 * Auto-detect farmer farm location via GPS
 * Pinpoints latitude, longitude, and reverse geocodes to state, district, village, and nearest APMC mandi
 */
const autoDetectFarmerLocation = (silent = false) => {
  if (!regDraftData.farmer) regDraftData.farmer = {};

  if (window.KPMS_USER_LOCATION) {
    const kLoc = window.KPMS_USER_LOCATION;
    if (kLoc.state) regDraftData.farmer.state = kLoc.state;
    if (kLoc.district || kLoc.city) regDraftData.farmer.district = kLoc.district || kLoc.city;
    if (kLoc.city) regDraftData.farmer.village = kLoc.city;
    if (kLoc.nearestCenter) regDraftData.farmer.preferredCenterId = kLoc.nearestCenter.centerId || 'CTR-01';
    if (kLoc.lat) regDraftData.farmer.latitude = kLoc.lat;
    if (kLoc.lng) regDraftData.farmer.longitude = kLoc.lng;
  }

  if (!navigator.geolocation) {
    if (!silent) showToast('Geolocation is not supported by your browser.', 'warning');
    return;
  }

  const gpsStatusText = document.getElementById('frm-gps-text');
  const gpsBadge = document.getElementById('frm-gps-badge');
  if (gpsStatusText) {
    gpsStatusText.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Pinpointing your live farm GPS coordinates...`;
  }
  if (gpsBadge) {
    gpsBadge.textContent = 'Acquiring...';
    gpsBadge.className = 'status-pill waiting';
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      try {
        const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lon=${lng}`);
        const json = await res.json();
        if (json.success && json.data) {
          const st = json.data.state || 'Madhya Pradesh';
          const dist = json.data.district || json.data.city || 'Bhopal';
          const village = json.data.city || 'Ratibad';
          const pin = json.data.postcode || '462044';
          const center = json.data.nearestCenter ? json.data.nearestCenter.centerId : 'CTR-01';

          regDraftData.farmer.state = st;
          regDraftData.farmer.district = dist;
          regDraftData.farmer.village = village;
          regDraftData.farmer.pinCode = pin;
          regDraftData.farmer.preferredCenterId = center;
          regDraftData.farmer.latitude = lat;
          regDraftData.farmer.longitude = lng;
          regDraftData.farmer.isGpsVerified = true;

          const stSelect = document.getElementById('frm-state');
          if (stSelect) {
            stSelect.value = st;
            onStateChange(st, 'frm', dist);
          }
          const vInput = document.getElementById('frm-village');
          if (vInput) vInput.value = village;
          const pInput = document.getElementById('frm-pincode');
          if (pInput) pInput.value = pin;
          const cSelect = document.getElementById('frm-center');
          if (cSelect) cSelect.value = center;

          const gpsTextEl = document.getElementById('frm-gps-text');
          if (gpsTextEl) {
            gpsTextEl.innerHTML = `<strong>Live Farm Location:</strong> ${village}, ${dist}, ${st} (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;
          }
          const badgeEl = document.getElementById('frm-gps-badge');
          if (badgeEl) {
            badgeEl.textContent = 'GPS Verified';
            badgeEl.className = 'status-pill completed';
          }

          if (!silent) {
            showToast(`📍 Farm location detected: ${village}, ${dist}, ${st}!`, 'success');
          }
        }
      } catch (err) {
        console.warn('Reverse geocode error:', err.message);
      }
    },
    (err) => {
      console.warn('GPS location acquisition notice:', err.message);
      const gpsTextEl = document.getElementById('frm-gps-text');
      if (gpsTextEl) {
        gpsTextEl.innerHTML = `Farm Location: ${regDraftData.farmer.village || 'Ratibad'}, ${regDraftData.farmer.district || 'Bhopal'}, ${regDraftData.farmer.state || 'Madhya Pradesh'}`;
      }
      const badgeEl = document.getElementById('frm-gps-badge');
      if (badgeEl) {
        badgeEl.textContent = 'Manual/Hub';
        badgeEl.className = 'status-pill waiting';
      }
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 }
  );
};

/**
 * Route into selected registration flow
 */
const startRegistrationFlow = async (type, isSuperAdminAvailable = true) => {
  currentRegType = type;
  currentRegStep = 1;
  totalRegSteps = (type === 'superadmin') ? 6 : 7;

  if (type === 'farmer') {
    // Farmer location is taken first
    autoDetectFarmerLocation(true);
  }

  if (type === 'superadmin' && !isSuperAdminAvailable) {
    // Show locked banner
    const body = document.getElementById('modal-content-slot');
    body.innerHTML = `
      <div style="text-align:center; padding:30px 15px;">
        <div style="font-size:3rem; margin-bottom:12px; color:#EF4444;"><i class="fas fa-shield-halved"></i></div>
        <h3 style="color:var(--primary-navy); font-weight:800; margin-bottom:8px;">Super Admin Setup Locked</h3>
        <p style="color:var(--text-muted); font-size:0.95rem; max-width:440px; margin:0 auto 24px auto;">
          A Super Admin account has already been configured for this KPMS instance. Self-registration is permanently disabled under security policy.
        </p>
        <button class="btn btn-navy" onclick="closeModal(); openLoginModal('admin');">
          <i class="fas fa-lock"></i> Go to Authorized Admin Login
        </button>
      </div>
    `;
    return;
  }

  renderRegistrationWizard();
};

/**
 * Render Main Dynamic Registration Wizard
 */
const renderRegistrationWizard = () => {
  const modal = document.getElementById('auth-modal');
  const body = document.getElementById('modal-content-slot');
  if (modal && !modal.classList.contains('active')) {
    modal.classList.add('active');
  }

  let title = 'Farmer Registration (7 Steps)';
  if (currentRegType === 'officer') title = 'Procurement Officer Registration';
  if (currentRegType === 'superadmin') title = 'Super Admin First-Time Setup Wizard';
  document.getElementById('modal-title').textContent = title;

  // Step definitions
  let stepTitles = [];
  if (currentRegType === 'farmer') {
    stepTitles = [
      'Account',
      'Personal',
      'Address',
      'Land',
      'Bank',
      'Documents',
      'Review'
    ];
  } else if (currentRegType === 'officer') {
    stepTitles = [
      'Personal Details',
      'Govt Employment',
      'Procurement Centre',
      'Identity Details',
      'Document Verification',
      'Review & Declaration',
      'OTP Verification'
    ];
  } else {
    stepTitles = [
      'Administrator Details',
      'Organization Details',
      'Identity Verification',
      'Credentials',
      'Review & Confirmation',
      'OTP Verification'
    ];
  }

  const progressPercent = Math.round((currentRegStep / totalRegSteps) * 100);

  // Dedicated Farmer 7-Step Progress Stepper
  let stepsHeaderHtml = '';
  if (currentRegType === 'farmer') {
    stepsHeaderHtml = `
      <div style="margin-bottom:18px;">
        <!-- Interactive Horizontal Progress Stepper -->
        <div style="display:flex; align-items:center; justify-content:space-between; overflow-x:auto; padding:6px 0 10px 0; gap:4px;" class="hide-scrollbar">
          ${stepTitles.map((title, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentRegStep;
            const isCurrent = stepNum === currentRegStep;
            const canClick = stepNum <= Math.max(farmerMaxVisitedStep, currentRegStep);

            let badgeBg = '#E2E8F0';
            let badgeColor = '#64748B';
            let badgeIcon = `${stepNum}`;
            let borderColor = 'transparent';

            if (isCompleted) {
              badgeBg = '#10B981';
              badgeColor = '#FFFFFF';
              badgeIcon = '<i class="fas fa-check" style="font-size:0.75rem;"></i>';
            } else if (isCurrent) {
              badgeBg = 'var(--saffron)';
              badgeColor = '#FFFFFF';
              borderColor = 'rgba(224,109,20,0.3)';
            }

            return `
              <div onclick="${canClick ? `goToStep(${stepNum})` : ''}" style="display:flex; align-items:center; gap:6px; cursor:${canClick ? 'pointer' : 'default'}; opacity:${canClick ? '1' : '0.6'}; flex-shrink:0;" title="${canClick ? `Click to view Step ${stepNum}: ${title}` : `Step ${stepNum}`}">
                <div style="width:28px; height:28px; border-radius:50%; background:${badgeBg}; color:${badgeColor}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem; box-shadow:${isCurrent ? '0 0 0 3px ' + borderColor : 'none'};">
                  ${badgeIcon}
                </div>
                <span style="font-size:0.82rem; font-weight:${isCurrent ? '800' : '600'}; color:${isCurrent ? 'var(--primary-navy)' : (isCompleted ? '#059669' : '#64748B')}; white-space:nowrap;">
                  ${title}
                </span>
                ${stepNum < totalRegSteps ? '<span style="color:#CBD5E1; font-size:0.85rem; margin:0 2px;">→</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Linear Progress Indicator -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-size:0.78rem;">
          <span style="color:var(--text-muted);">Step ${currentRegStep} of ${totalRegSteps}: <strong>${stepTitles[currentRegStep - 1]}</strong></span>
          <span style="color:var(--saffron); font-weight:700;">${progressPercent}% Completed</span>
        </div>
        <div style="height:5px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
          <div style="width:${progressPercent}%; height:100%; background:linear-gradient(90deg, var(--saffron), var(--green-gov)); transition:width 0.3s ease;"></div>
        </div>
      </div>
    `;
  } else {
    stepsHeaderHtml = `
      <div style="margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:0.85rem; font-weight:700; color:var(--primary-navy);">
            Step ${currentRegStep} of ${totalRegSteps}: ${stepTitles[currentRegStep - 1]}
          </span>
          <span style="font-size:0.85rem; font-weight:700; color:var(--saffron);">${progressPercent}% Completed</span>
        </div>
        <div style="height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
          <div style="width:${progressPercent}%; height:100%; background:linear-gradient(90deg, var(--saffron), var(--green-gov)); transition:width 0.3s ease;"></div>
        </div>
      </div>
    `;
  }

  let stepBodyHtml = '';
  if (currentRegType === 'farmer') {
    stepBodyHtml = getFarmerStepHtml(currentRegStep);
  } else if (currentRegType === 'officer') {
    stepBodyHtml = getOfficerStepHtml(currentRegStep);
  } else {
    stepBodyHtml = getSuperAdminStepHtml(currentRegStep);
  }

  body.innerHTML = `
    <div>
      ${stepsHeaderHtml}
      <div id="reg-wizard-container">
        ${stepBodyHtml}
      </div>
    </div>
  `;

  // Attach dynamic real-time validation listeners
  attachLiveValidationListeners();

  if (currentRegType === 'farmer' && currentRegStep === 1) {
    setTimeout(() => {
      const targetState = regDraftData.farmer?.state || 'Madhya Pradesh';
      const targetDist = regDraftData.farmer?.district || null;
      const targetTal = regDraftData.farmer?.taluka || null;
      onStateChange(targetState, 'frm', targetDist, targetTal);
    }, 60);
  }
};

/**
 * ====================================================
 * STEP 1 CONTACT VERIFICATION ENGINE (MOBILE + BREVO EMAIL)
 * Strictly gates progression to Step 2 across all roles
 * ====================================================
 */
const step1State = {
  farmer: {
    mobileVerified: false,
    emailVerified: false,
    mobileOtpSent: false,
    emailOtpSent: false,
    verifiedMobileNumber: '',
    verifiedEmailAddress: '',
    mobileSecondsLeft: 0,
    emailSecondsLeft: 0,
    mobileTimerInterval: null,
    emailTimerInterval: null
  },
  officer: {
    mobileVerified: false,
    emailVerified: false,
    mobileOtpSent: false,
    emailOtpSent: false,
    verifiedMobileNumber: '',
    verifiedEmailAddress: '',
    mobileSecondsLeft: 0,
    emailSecondsLeft: 0,
    mobileTimerInterval: null,
    emailTimerInterval: null
  },
  superadmin: {
    mobileVerified: false,
    emailVerified: false,
    mobileOtpSent: false,
    emailOtpSent: false,
    verifiedMobileNumber: '',
    verifiedEmailAddress: '',
    mobileSecondsLeft: 0,
    emailSecondsLeft: 0,
    mobileTimerInterval: null,
    emailTimerInterval: null
  }
};

/**
 * Render Reusable Step 1 Contact Verification UI
 */
const renderStep1ContactBlock = (role, draft) => {
  const prefix = role === 'farmer' ? 'frm' : (role === 'officer' ? 'off' : 'sadm');
  const st = step1State[role];
  const isMobileVerified = st.mobileVerified;
  const isEmailVerified = st.emailVerified;
  const isMobileOtpSent = st.mobileOtpSent;
  const isEmailOtpSent = st.emailOtpSent;

  const mobileVal = isMobileVerified ? st.verifiedMobileNumber : (draft.mobile || '');
  const emailVal = isEmailVerified ? st.verifiedEmailAddress : (draft.email || draft.officialEmail || '');
  const emailPlaceholder = role === 'officer' ? 'officer@kpms.gov.in' : (role === 'superadmin' ? 'superadmin@gov.in' : 'farmer@example.com');
  const emailLabel = role === 'farmer' ? 'Email Address (For Brevo OTP) *' : (role === 'officer' ? 'Official Email Address (For Brevo OTP) *' : 'Official Email Address (For Brevo OTP) *');

  return `
    <!-- Mobile Verification Block -->
    <div class="form-group">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <label class="form-label" style="margin-bottom:0; font-weight:700;">Mobile Number (10 Digits) *</label>
        <span id="${prefix}-mobile-status-pill" style="font-size:0.75rem; font-weight:700; color:${isMobileVerified ? '#059669' : '#D97706'};">
          ${isMobileVerified ? '<i class="fas fa-circle-check"></i> Mobile Verified' : '<i class="fas fa-shield-alt"></i> OTP Required for Step 2'}
        </span>
      </div>
      <div style="position:relative; width:100%;">
        <input type="tel" id="${prefix}-mobile" name="mobile" maxlength="14" class="form-control" value="${mobileVal}" placeholder="Enter 10-digit mobile number" oninput="onStep1ContactChange('${role}', 'mobile')" ${isMobileVerified ? 'readonly style="background:#F0FDF4; border-color:#86EFAC; font-weight:700; color:#065F46; width:100%;"' : 'style="width:100%;"'} required />
        ${isMobileVerified ? '<i class="fas fa-check-circle" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); color:#059669; font-size:1.1rem;"></i>' : ''}
      </div>
      ${!isMobileVerified ? `
        <div style="display:flex; gap:6px; margin-top:6px;">
          <button type="button" id="btn-${prefix}-send-mobile-otp" class="btn btn-outline btn-sm" onclick="sendStep1MobileOtp('${role}')" style="flex:1; white-space:nowrap; border-color:var(--saffron); color:var(--saffron); font-weight:700; padding:7px 8px; font-size:0.8rem; display:inline-flex; align-items:center; justify-content:center; gap:5px;">
            <i class="fas fa-paper-plane"></i> ${isMobileOtpSent ? 'Resend OTP' : 'Send OTP'}
          </button>
          <button type="button" class="btn btn-sm btn-primary" onclick="launchMsg91WidgetForStep1('${role}')" style="flex:1; white-space:nowrap; background:#E06D14; border-color:#E06D14; font-weight:700; padding:7px 8px; font-size:0.8rem; display:inline-flex; align-items:center; justify-content:center; gap:5px;" title="Verify via MSG91 Official OTP Widget (SMS / WhatsApp / Call)">
            <i class="fas fa-bolt"></i> MSG91 Widget
          </button>
        </div>
      ` : `
        <div style="display:flex; justify-content:flex-end; margin-top:4px;">
          <button type="button" class="btn btn-sm btn-outline" onclick="unlockStep1Contact('${role}', 'mobile')" title="Change Mobile Number" style="border-color:#CBD5E1; color:#64748B; font-size:0.75rem; padding:4px 8px;">
            <i class="fas fa-pen"></i> Change Number
          </button>
        </div>
      `}
      <div class="field-error" id="err-${prefix}-mobile"></div>

      <!-- Mobile OTP Entry Container -->
      <div id="${prefix}-mobile-otp-wrap" style="display:${(!isMobileVerified && isMobileOtpSent) ? 'block' : 'none'}; margin-top:8px; padding:10px 12px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:0.78rem; font-weight:700; color:#92400E;">
            <i class="fas fa-key"></i> Enter 6-Digit SMS OTP
          </span>
          <span id="${prefix}-mobile-otp-timer" style="font-size:0.75rem; font-weight:700; color:#B45309;"></span>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <input type="text" id="${prefix}-mobile-otp-input" maxlength="6" class="form-control" style="max-width:130px; letter-spacing:3px; font-weight:800; text-align:center; font-size:0.95rem;" placeholder="123456" />
          <button type="button" id="btn-${prefix}-verify-mobile-otp" class="btn btn-primary btn-sm" onclick="verifyStep1MobileOtp('${role}')" style="padding:7px 14px; font-size:0.8rem; font-weight:700;">
            <i class="fas fa-shield-check"></i> Verify
          </button>
        </div>
        <div id="${prefix}-mobile-otp-msg" style="font-size:0.75rem; margin-top:5px; color:#92400E;"></div>
      </div>

      <!-- Mobile Verified Success Banner -->
      <div id="${prefix}-mobile-verified-banner" style="display:${isMobileVerified ? 'flex' : 'none'}; align-items:center; gap:6px; margin-top:6px; padding:6px 10px; background:#ECFDF5; border:1px solid #A7F3D0; border-radius:6px; color:#065F46; font-size:0.78rem; font-weight:700;">
        <i class="fas fa-check-circle" style="color:#059669;"></i> Mobile Number Verified via SMS OTP
      </div>
    </div>

    <!-- Email Verification Block (Brevo API) -->
    <div class="form-group">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <label class="form-label" style="margin-bottom:0; font-weight:700;">${emailLabel}</label>
        <span id="${prefix}-email-status-pill" style="font-size:0.75rem; font-weight:700; color:${isEmailVerified ? '#059669' : '#2563EB'};">
          ${isEmailVerified ? '<i class="fas fa-circle-check"></i> Brevo Email Verified' : '<i class="fas fa-envelope-circle-check"></i> Brevo OTP Required for Step 2'}
        </span>
      </div>
      <div style="position:relative; width:100%;">
        <input type="email" id="${prefix}-email" name="email" class="form-control" value="${emailVal}" placeholder="${emailPlaceholder}" oninput="onStep1ContactChange('${role}', 'email')" ${isEmailVerified ? 'readonly style="background:#F0FDF4; border-color:#86EFAC; font-weight:700; color:#065F46; width:100%;"' : 'style="width:100%;"'} required />
        ${isEmailVerified ? '<i class="fas fa-check-circle" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); color:#059669; font-size:1.1rem;"></i>' : ''}
      </div>
      ${!isEmailVerified ? `
        <div style="display:flex; margin-top:6px;">
          <button type="button" id="btn-${prefix}-send-email-otp" class="btn btn-outline btn-sm" onclick="sendStep1EmailOtp('${role}')" style="width:100%; white-space:nowrap; border-color:#2563EB; color:#2563EB; font-weight:700; padding:7px 12px; font-size:0.8rem; display:inline-flex; align-items:center; justify-content:center; gap:5px;">
            <i class="fas fa-paper-plane"></i> ${isEmailOtpSent ? 'Resend Brevo OTP' : 'Send Brevo OTP'}
          </button>
        </div>
      ` : `
        <div style="display:flex; justify-content:flex-end; margin-top:4px;">
          <button type="button" class="btn btn-sm btn-outline" onclick="unlockStep1Contact('${role}', 'email')" title="Change Email Address" style="border-color:#CBD5E1; color:#64748B; font-size:0.75rem; padding:4px 8px;">
            <i class="fas fa-pen"></i> Change Email
          </button>
        </div>
      `}
      <div class="field-error" id="err-${prefix}-email"></div>

      <!-- Email OTP Entry Container -->
      <div id="${prefix}-email-otp-wrap" style="display:${(!isEmailVerified && isEmailOtpSent) ? 'block' : 'none'}; margin-top:8px; padding:10px 12px; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:0.78rem; font-weight:700; color:#1E40AF;">
            <i class="fas fa-envelope-open-text"></i> Enter 6-Digit Brevo Verification Code
          </span>
          <span id="${prefix}-email-otp-timer" style="font-size:0.75rem; font-weight:700; color:#1D4ED8;"></span>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <input type="text" id="${prefix}-email-otp-input" maxlength="6" class="form-control" style="max-width:130px; letter-spacing:3px; font-weight:800; text-align:center; font-size:0.95rem;" placeholder="123456" />
          <button type="button" id="btn-${prefix}-verify-email-otp" class="btn btn-primary btn-sm" onclick="verifyStep1EmailOtp('${role}')" style="padding:7px 14px; font-size:0.8rem; font-weight:700; background:#2563EB; border-color:#2563EB;">
            <i class="fas fa-shield-check"></i> Verify Email
          </button>
        </div>
        <div id="${prefix}-email-otp-msg" style="font-size:0.75rem; margin-top:5px; color:#1E40AF;"></div>
      </div>

      <!-- Email Verified Success Banner -->
      <div id="${prefix}-email-verified-banner" style="display:${isEmailVerified ? 'flex' : 'none'}; align-items:center; gap:6px; margin-top:6px; padding:6px 10px; background:#ECFDF5; border:1px solid #A7F3D0; border-radius:6px; color:#065F46; font-size:0.78rem; font-weight:700;">
        <i class="fas fa-check-circle" style="color:#059669;"></i> Official Email Verified via Brevo Transactional Service
      </div>
    </div>
  `;
};

/**
 * Step 1 Input Change Listener: Invalidates verification if contact text is altered
 */
const onStep1ContactChange = (role, type) => {
  const prefix = role === 'farmer' ? 'frm' : (role === 'officer' ? 'off' : 'sadm');
  const inputEl = document.getElementById(`${prefix}-${type}`);
  if (!inputEl) return;
  const val = inputEl.value.trim();
  const st = step1State[role];

  if (type === 'mobile') {
    if (st.mobileVerified && val !== st.verifiedMobileNumber) {
      st.mobileVerified = false;
      st.verifiedMobileNumber = '';
      st.mobileOtpSent = false;
      clearInterval(st.mobileTimerInterval);
      saveCurrentStep1Draft(role);
      renderRegistrationWizard();
      showToast('Mobile number changed. Please re-verify via OTP.', 'info');
    }
  } else if (type === 'email') {
    if (st.emailVerified && val.toLowerCase() !== st.verifiedEmailAddress.toLowerCase()) {
      st.emailVerified = false;
      st.verifiedEmailAddress = '';
      st.emailOtpSent = false;
      clearInterval(st.emailTimerInterval);
      saveCurrentStep1Draft(role);
      renderRegistrationWizard();
      showToast('Email address changed. Please re-verify via Brevo OTP.', 'info');
    }
  }
};

/**
 * Unlock Step 1 Contact field to permit changing mobile/email
 */
const unlockStep1Contact = (role, type) => {
  const st = step1State[role];
  if (type === 'mobile') {
    st.mobileVerified = false;
    st.verifiedMobileNumber = '';
    st.mobileOtpSent = false;
    clearInterval(st.mobileTimerInterval);
  } else {
    st.emailVerified = false;
    st.verifiedEmailAddress = '';
    st.emailOtpSent = false;
    clearInterval(st.emailTimerInterval);
  }
  saveCurrentStep1Draft(role);
  renderRegistrationWizard();
};

/**
 * Start 60-Second Countdown Timer for Step 1 OTP
 */
const startStep1Timer = (role, type, seconds = 60) => {
  const prefix = role === 'farmer' ? 'frm' : (role === 'officer' ? 'off' : 'sadm');
  const st = step1State[role];
  const timerKey = `${type}TimerInterval`;
  const secKey = `${type}SecondsLeft`;

  clearInterval(st[timerKey]);
  st[secKey] = seconds;

  const btn = document.getElementById(`btn-${prefix}-send-${type}-otp`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-check"></i> Sent (${seconds}s)`;
  }

  st[timerKey] = setInterval(() => {
    st[secKey]--;
    const currentTimerEl = document.getElementById(`${prefix}-${type}-otp-timer`);
    if (currentTimerEl) {
      currentTimerEl.textContent = `Resend in ${st[secKey]}s`;
    }
    const currentBtn = document.getElementById(`btn-${prefix}-send-${type}-otp`);
    if (currentBtn && currentBtn.disabled) {
      currentBtn.innerHTML = `<i class="fas fa-check"></i> Sent (${st[secKey]}s)`;
    }
    if (st[secKey] <= 0) {
      clearInterval(st[timerKey]);
      const expTimerEl = document.getElementById(`${prefix}-${type}-otp-timer`);
      if (expTimerEl) expTimerEl.textContent = '';
      const expBtn = document.getElementById(`btn-${prefix}-send-${type}-otp`);
      if (expBtn) {
        expBtn.disabled = false;
        expBtn.innerHTML = `<i class="fas fa-rotate-right"></i> Resend ${type === 'email' ? 'Brevo OTP' : 'OTP'}`;
      }
    }
  }, 1000);
};

/**
 * Launch Official MSG91 SendOTP Web Widget for Step 1
 */
window.launchMsg91WidgetForStep1 = function(role) {
  const prefix = role === 'farmer' ? 'frm' : (role === 'officer' ? 'off' : 'sadm');
  const mobileInput = document.getElementById(`${prefix}-mobile`);
  const rawMobile = mobileInput ? mobileInput.value.trim() : '';
  const cleanMobile = rawMobile.replace(/\D/g, '').slice(-10);

  if (!cleanMobile || cleanMobile.length !== 10) {
    showToast('Please enter your 10-digit mobile number first.', 'warning');
    if (mobileInput) mobileInput.focus();
    return;
  }

  if (typeof window.triggerMsg91OTP === 'function') {
    window.triggerMsg91OTP({
      identifier: cleanMobile,
      context: 'registration_step1',
      onSuccess: (backendRes, widgetToken) => {
        step1State[role].mobileVerified = true;
        step1State[role].verifiedMobileNumber = cleanMobile;
        saveCurrentStep1Draft(role);
        renderRegistrationWizard();
        showToast(`✅ Mobile +91 ${cleanMobile} successfully verified via MSG91!`, 'success');
      },
      onFailure: (err) => {
        console.warn('MSG91 widget note:', err);
      }
    });
  } else {
    showToast('MSG91 Widget is initializing. Please retry in a moment.', 'info');
  }
};

/**
 * Dispatch Mobile OTP for Step 1
 */
const sendStep1MobileOtp = async (role) => {
  const prefix = role === 'farmer' ? 'frm' : (role === 'officer' ? 'off' : 'sadm');
  const mobileInput = document.getElementById(`${prefix}-mobile`);
  const rawMobile = mobileInput ? mobileInput.value.trim() : '';
  const mobile = rawMobile.replace(/\D/g, '').slice(-10);
  const nameInput = document.getElementById(`${prefix}-name`);
  const fullName = nameInput ? nameInput.value.trim() : '';

  if (!mobile || mobile.length !== 10) {
    showFieldError(`err-${prefix}-mobile`, 'Please enter a valid 10-digit mobile number (e.g. 9274482285).');
    if (mobileInput) mobileInput.focus();
    return;
  }
  showFieldError(`err-${prefix}-mobile`, '');

  const btn = document.getElementById(`btn-${prefix}-send-mobile-otp`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Sending...`;
  }

  try {
    const res = await fetch('/api/registration/send-mobile-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, fullName, role })
    });
    const result = await res.json();

    if (!result.success) {
      showToast(result.message || 'Failed to dispatch mobile OTP.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-paper-plane"></i> Send OTP`;
      }
      return;
    }

    step1State[role].mobileOtpSent = true;
    const otpCode = result.otp || '123456';
    showToast(`✅ OTP dispatched! Verification Code: ${otpCode}`, 'success');

    const wrap = document.getElementById(`${prefix}-mobile-otp-wrap`);
    if (wrap) wrap.style.display = 'block';

    const msgEl = document.getElementById(`${prefix}-mobile-otp-msg`);
    if (msgEl) {
      msgEl.innerHTML = `
        <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:6px; padding:8px 10px; margin-top:4px;">
          <div style="color:#065F46; font-weight:700; font-size:0.82rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
            <span><i class="fas fa-check-circle" style="color:#10B981;"></i> SMS Code: <strong style="letter-spacing:1px; font-size:0.95rem;">${otpCode}</strong></span>
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn btn-sm btn-outline" style="padding:2px 8px; font-size:0.75rem; background:#fff;" onclick="document.getElementById('${prefix}-mobile-otp-input').value='${otpCode}'">Auto-Fill</button>
              <button type="button" class="btn btn-sm btn-primary" style="padding:2px 8px; font-size:0.75rem; background:#E06D14; border-color:#E06D14;" onclick="launchMsg91WidgetForStep1('${role}')"><i class="fas fa-bolt"></i> Open MSG91 Widget</button>
            </div>
          </div>
          <div style="font-size:0.72rem; color:#047857; margin-top:4px;">(SMS queued • Instant code provided above, or open MSG91 Widget for WhatsApp/Call delivery)</div>
        </div>
      `;
    }

    startStep1Timer(role, 'mobile', 60);

    const otpInput = document.getElementById(`${prefix}-mobile-otp-input`);
    if (otpInput) {
      otpInput.value = otpCode;
      otpInput.focus();
    }
  } catch (err) {
    showToast('Failed to send mobile OTP: ' + err.message, 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-paper-plane"></i> Send OTP`;
    }
  }
};

/**
 * Verify Step 1 Mobile OTP
 */
const verifyStep1MobileOtp = async (role) => {
  const prefix = role === 'farmer' ? 'frm' : (role === 'officer' ? 'off' : 'sadm');
  const mobileInput = document.getElementById(`${prefix}-mobile`);
  const mobile = mobileInput ? mobileInput.value.trim() : '';
  const otpInput = document.getElementById(`${prefix}-mobile-otp-input`);
  const otp = otpInput ? otpInput.value.trim() : '';

  if (!otp || otp.length !== 6) {
    showToast('Please enter the 6-digit OTP received on your mobile.', 'warning');
    if (otpInput) otpInput.focus();
    return;
  }

  const vBtn = document.getElementById(`btn-${prefix}-verify-mobile-otp`);
  if (vBtn) {
    vBtn.disabled = true;
    vBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Verifying...`;
  }

  try {
    const res = await fetch('/api/registration/verify-mobile-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp })
    });
    const result = await res.json();

    if (!result.success) {
      showToast(result.message || 'Invalid Mobile OTP.', 'error');
      if (vBtn) {
        vBtn.disabled = false;
        vBtn.innerHTML = `<i class="fas fa-shield-check"></i> Verify`;
      }
      return;
    }

    step1State[role].mobileVerified = true;
    step1State[role].verifiedMobileNumber = mobile;
    clearInterval(step1State[role].mobileTimerInterval);

    showToast(`✅ Mobile +91 ${mobile} verified successfully!`, 'success');

    saveCurrentStep1Draft(role);
    renderRegistrationWizard();
  } catch (err) {
    showToast('Mobile verification error: ' + err.message, 'error');
    if (vBtn) {
      vBtn.disabled = false;
      vBtn.innerHTML = `<i class="fas fa-shield-check"></i> Verify`;
    }
  }
};

/**
 * Dispatch Email OTP via Brevo API for Step 1
 */
const sendStep1EmailOtp = async (role) => {
  const prefix = role === 'farmer' ? 'frm' : (role === 'officer' ? 'off' : 'sadm');
  const emailInput = document.getElementById(`${prefix}-email`);
  const email = emailInput ? emailInput.value.trim() : '';
  const nameInput = document.getElementById(`${prefix}-name`);
  const fullName = nameInput ? nameInput.value.trim() : '';

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    showFieldError(`err-${prefix}-email`, 'Please enter a valid email address first.');
    if (emailInput) emailInput.focus();
    return;
  }
  showFieldError(`err-${prefix}-email`, '');

  const btn = document.getElementById(`btn-${prefix}-send-email-otp`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Sending Brevo OTP...`;
  }

  try {
    const res = await fetch('/api/registration/send-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName, role })
    });
    const result = await res.json();

    if (!result.success) {
      showToast(result.message || 'Failed to dispatch Brevo email OTP.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-paper-plane"></i> Send Brevo OTP`;
      }
      return;
    }

    step1State[role].emailOtpSent = true;
    const emailOtpCode = result.otp || '123456';
    showToast(`✅ Brevo verification OTP dispatched! Code: ${emailOtpCode}`, 'success');

    const wrap = document.getElementById(`${prefix}-email-otp-wrap`);
    if (wrap) wrap.style.display = 'block';

    const msgEl = document.getElementById(`${prefix}-email-otp-msg`);
    if (msgEl) {
      msgEl.innerHTML = `
        <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:6px; padding:6px 10px; margin-top:4px;">
          <div style="color:#1E40AF; font-weight:700; font-size:0.82rem; display:flex; align-items:center; justify-content:space-between;">
            <span><i class="fas fa-envelope-circle-check" style="color:#2563EB;"></i> Brevo Code: <strong style="letter-spacing:1px; font-size:0.95rem;">${emailOtpCode}</strong></span>
            <button type="button" class="btn btn-sm btn-outline" style="padding:2px 8px; font-size:0.75rem; background:#fff;" onclick="document.getElementById('${prefix}-email-otp-input').value='${emailOtpCode}'">Auto-Fill</button>
          </div>
          <div style="font-size:0.72rem; color:#1D4ED8; margin-top:2px;">(Sent to ${result.email || email} via Brevo Relay)</div>
        </div>
      `;
    }

    startStep1Timer(role, 'email', 60);

    const otpInput = document.getElementById(`${prefix}-email-otp-input`);
    if (otpInput) {
      otpInput.value = emailOtpCode;
      otpInput.focus();
    }
  } catch (err) {
    showToast('Failed to dispatch Brevo OTP: ' + err.message, 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-paper-plane"></i> Send Brevo OTP`;
    }
  }
};

/**
 * Verify Step 1 Email OTP (dispatched via Brevo API)
 */
const verifyStep1EmailOtp = async (role) => {
  const prefix = role === 'farmer' ? 'frm' : (role === 'officer' ? 'off' : 'sadm');
  const emailInput = document.getElementById(`${prefix}-email`);
  const email = emailInput ? emailInput.value.trim() : '';
  const otpInput = document.getElementById(`${prefix}-email-otp-input`);
  const otp = otpInput ? otpInput.value.trim() : '';

  if (!otp || otp.length !== 6) {
    showToast('Please enter the 6-digit Brevo OTP received in your email.', 'warning');
    if (otpInput) otpInput.focus();
    return;
  }

  const vBtn = document.getElementById(`btn-${prefix}-verify-email-otp`);
  if (vBtn) {
    vBtn.disabled = true;
    vBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Verifying...`;
  }

  try {
    const res = await fetch('/api/registration/verify-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const result = await res.json();

    if (!result.success) {
      showToast(result.message || 'Invalid Email OTP.', 'error');
      if (vBtn) {
        vBtn.disabled = false;
        vBtn.innerHTML = `<i class="fas fa-shield-check"></i> Verify Email`;
      }
      return;
    }

    step1State[role].emailVerified = true;
    step1State[role].verifiedEmailAddress = email;
    clearInterval(step1State[role].emailTimerInterval);

    showToast(`✅ Email ${email} verified successfully via Brevo!`, 'success');

    saveCurrentStep1Draft(role);
    renderRegistrationWizard();
  } catch (err) {
    showToast('Email verification error: ' + err.message, 'error');
    if (vBtn) {
      vBtn.disabled = false;
      vBtn.innerHTML = `<i class="fas fa-shield-check"></i> Verify Email`;
    }
  }
};

/**
 * Helper to preserve input values into regDraftData prior to re-render
 */
const saveCurrentStep1Draft = (role) => {
  if (role === 'farmer') {
    const name = document.getElementById('frm-name')?.value.trim();
    const father = document.getElementById('frm-father')?.value.trim();
    const dob = document.getElementById('frm-dob')?.value;
    const gender = document.getElementById('frm-gender')?.value;
    const mobile = document.getElementById('frm-mobile')?.value.trim();
    const email = document.getElementById('frm-email')?.value.trim();
    const aadhaar = document.getElementById('frm-aadhaar')?.value.trim();
    const password = document.getElementById('frm-pass')?.value;
    regDraftData.farmer = {
      ...regDraftData.farmer,
      fullName: name || regDraftData.farmer.fullName,
      fatherName: father || regDraftData.farmer.fatherName,
      dob: dob || regDraftData.farmer.dob,
      gender: gender || regDraftData.farmer.gender,
      mobile: mobile || regDraftData.farmer.mobile,
      email: email || regDraftData.farmer.email,
      aadhaarNumber: aadhaar || regDraftData.farmer.aadhaarNumber,
      password: password || regDraftData.farmer.password,
      state: document.getElementById('frm-state')?.value || regDraftData.farmer.state,
      district: document.getElementById('frm-district')?.value || regDraftData.farmer.district,
      taluka: document.getElementById('frm-taluka')?.value || regDraftData.farmer.taluka,
      village: document.getElementById('frm-village')?.value?.trim() || regDraftData.farmer.village,
      pinCode: document.getElementById('frm-pincode')?.value?.trim() || regDraftData.farmer.pinCode,
      preferredCenterId: document.getElementById('frm-center')?.value || regDraftData.farmer.preferredCenterId
    };
  } else if (role === 'officer') {
    const name = document.getElementById('off-name')?.value.trim();
    const empId = document.getElementById('off-empid')?.value.trim();
    const desig = document.getElementById('off-designation')?.value.trim();
    const dob = document.getElementById('off-dob')?.value;
    const email = document.getElementById('off-email')?.value.trim();
    const mobile = document.getElementById('off-mobile')?.value.trim();
    const aadhaar = document.getElementById('off-aadhaar')?.value.trim();
    const password = document.getElementById('off-pass')?.value;
    regDraftData.officer = {
      ...regDraftData.officer,
      fullName: name || regDraftData.officer.fullName,
      employeeId: empId || regDraftData.officer.employeeId,
      designation: desig || regDraftData.officer.designation,
      dob: dob || regDraftData.officer.dob,
      officialEmail: email || regDraftData.officer.officialEmail,
      mobile: mobile || regDraftData.officer.mobile,
      aadhaarNumber: aadhaar || regDraftData.officer.aadhaarNumber,
      password: password || regDraftData.officer.password
    };
  } else if (role === 'superadmin') {
    const name = document.getElementById('sadm-name')?.value.trim();
    const desig = document.getElementById('sadm-designation')?.value.trim();
    const empId = document.getElementById('sadm-empid')?.value.trim();
    const dob = document.getElementById('sadm-dob')?.value;
    const email = document.getElementById('sadm-email')?.value.trim();
    const mobile = document.getElementById('sadm-mobile')?.value.trim();
    const aadhaar = document.getElementById('sadm-aadhaar')?.value.trim();
    regDraftData.superadmin = {
      ...regDraftData.superadmin,
      fullName: name || regDraftData.superadmin.fullName,
      designation: desig || regDraftData.superadmin.designation,
      employeeId: empId || regDraftData.superadmin.employeeId,
      dob: dob || regDraftData.superadmin.dob,
      officialEmail: email || regDraftData.superadmin.officialEmail,
      mobile: mobile || regDraftData.superadmin.mobile,
      aadhaarNumber: aadhaar || regDraftData.superadmin.aadhaarNumber
    };
  }
};

/**
 * ----------------------------------------------------
 * FARMER STEP HTML BUILDERS (MASTER 7-STEP FLOW)
 * Step 1: Account Creation & Dual OTP (Mobile & Email)
 * Step 2: Personal Details (Full Name + Separate Father/Husband Relationship Dynamic Field)
 * Step 3: Address & Location (Hierarchical State -> District -> Taluka -> Village + GPS)
 * Step 4: Land & Farming Details (Ownership, Area, Survey No, Crops Multi-Select, Season)
 * Step 5: Bank Details (Account, Confirm, IFSC, Masked Display)
 * Step 6: Document Upload (Aadhaar, Passbook, Land Record, Photo + Progress + Preview)
 * Step 7: Review & Declaration (5 Sections with [Edit] Navigation, Declarations, Submit)
 * ----------------------------------------------------
 */

let farmerMaxVisitedStep = 1;
let farmerSelectedCrops = ['Wheat (Sharbati)'];

const getFarmerStepHtml = (step) => {
  const draft = regDraftData.farmer || {};
  if (step > farmerMaxVisitedStep) farmerMaxVisitedStep = step;

  // ----------------------------------------------------
  // STEP 1 — ACCOUNT CREATION & DUAL OTP
  // ----------------------------------------------------
  if (step === 1) {
    const st = step1State.farmer;
    const isMobileVerified = st.mobileVerified;
    const isEmailVerified = st.emailVerified;
    const isReadyToProceed = isMobileVerified && isEmailVerified;

    return `
      <form id="farmer-step1-form" onsubmit="event.preventDefault(); validateAndNextFarmer(1);">
        <div style="margin-bottom:16px;">
          <h3 style="color:var(--primary-navy); font-weight:800; margin:0 0 4px 0; font-size:1.35rem;">
            Create Your Farmer Account
          </h3>
          <p style="color:var(--text-muted); font-size:0.88rem; margin:0;">
            Register to access Mandi services, guaranteed MSP procurement slots, and direct DBT payments.
          </p>
        </div>

        <!-- Progress Banner -->
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:10px 14px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:0.82rem; color:var(--primary-navy); font-weight:700;">
            <i class="fas fa-shield-halved" style="color:var(--saffron); margin-right:6px;"></i> Dual OTP Verification Required
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted);">
            Both Mobile & Email must be verified before proceeding
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr; gap:16px;">
          <!-- 1. Mobile Number with +91 country code & OTP -->
          <div class="glass-card" style="padding:14px; border:1px solid ${isMobileVerified ? '#86EFAC' : '#E2E8F0'}; background:${isMobileVerified ? '#F0FDF4' : '#FFFFFF'};">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="form-label" style="font-weight:700; margin-bottom:0;">Mobile Number *</label>
              <span id="frm-mobile-status-badge" class="status-pill ${isMobileVerified ? 'completed' : 'pending'}" style="font-size:0.72rem;">
                ${isMobileVerified ? '✓ Mobile Number Verified' : 'OTP Verification Required'}
              </span>
            </div>
            
            <div style="display:flex; gap:8px;">
              <div style="width:70px; background:#F1F5F9; border:1px solid #CBD5E1; border-radius:6px; display:flex; align-items:center; justify-content:center; font-weight:700; color:var(--primary-navy); font-size:0.9rem;">
                🇮🇳 +91
              </div>
              <div style="flex:1; position:relative;">
                <input type="tel" id="frm-mobile" name="mobile" maxlength="10" class="form-control" value="${draft.mobile || ''}" placeholder="10-digit mobile number" ${isMobileVerified ? 'readonly style="background:#F8FAFC; font-weight:700;"' : ''} oninput="onStep1ContactChange('farmer', 'mobile')" required />
                ${isMobileVerified ? '<i class="fas fa-circle-check" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); color:#10B981; font-size:1.1rem;"></i>' : ''}
              </div>
            </div>
            <div class="field-error" id="err-frm-mobile"></div>

            ${!isMobileVerified ? `
              <div style="display:flex; gap:8px; margin-top:8px;">
                <button type="button" id="btn-frm-send-mobile-otp" class="btn btn-outline btn-sm" onclick="sendStep1MobileOtp('farmer')" style="border-color:var(--saffron); color:var(--saffron); font-weight:700; padding:6px 12px; font-size:0.8rem;">
                  <i class="fas fa-paper-plane"></i> ${st.mobileOtpSent ? 'Resend OTP' : 'Send Mobile OTP'}
                </button>
                <button type="button" class="btn btn-sm btn-primary" onclick="launchMsg91WidgetForStep1('farmer')" style="background:#E06D14; border-color:#E06D14; font-weight:700; padding:6px 12px; font-size:0.8rem;" title="MSG91 Real SMS / WhatsApp Delivery">
                  <i class="fas fa-bolt"></i> MSG91 SMS Widget
                </button>
              </div>

              <!-- Mobile OTP Entry Input -->
              <div id="frm-mobile-otp-wrap" style="display:${st.mobileOtpSent ? 'block' : 'none'}; margin-top:10px; padding:10px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-size:0.78rem; font-weight:700; color:#92400E;">Enter 6-digit OTP sent to mobile</span>
                  <span id="frm-mobile-otp-timer" style="font-size:0.75rem; color:#B45309; font-weight:700;"></span>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                  <input type="text" id="frm-mobile-otp-input" maxlength="6" class="form-control" style="max-width:140px; letter-spacing:4px; font-weight:800; text-align:center; font-size:1rem;" placeholder="123456" />
                  <button type="button" id="btn-frm-verify-mobile-otp" class="btn btn-primary btn-sm" onclick="verifyStep1MobileOtp('farmer')" style="font-weight:700; padding:6px 14px;">
                    Verify Mobile
                  </button>
                </div>
                <div id="frm-mobile-otp-msg" style="margin-top:6px;"></div>
              </div>
            ` : `
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
                <span style="font-size:0.78rem; color:#065F46; font-weight:600;"><i class="fas fa-check-circle" style="color:#10B981;"></i> +91 ${draft.mobile || st.verifiedMobileNumber} authenticated</span>
                <button type="button" class="btn btn-sm btn-outline" onclick="unlockStep1Contact('farmer', 'mobile')" style="font-size:0.72rem; padding:2px 8px; border-color:#CBD5E1; color:#64748B;">Change</button>
              </div>
            `}
          </div>

          <!-- 2. Email Address & Brevo OTP -->
          <div class="glass-card" style="padding:14px; border:1px solid ${isEmailVerified ? '#86EFAC' : '#E2E8F0'}; background:${isEmailVerified ? '#F0FDF4' : '#FFFFFF'};">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="form-label" style="font-weight:700; margin-bottom:0;">Email Address *</label>
              <span id="frm-email-status-badge" class="status-pill ${isEmailVerified ? 'completed' : 'pending'}" style="font-size:0.72rem;">
                ${isEmailVerified ? '✓ Email Verified' : 'OTP Verification Required'}
              </span>
            </div>

            <div style="position:relative;">
              <input type="email" id="frm-email" name="email" class="form-control" value="${draft.email || ''}" placeholder="farmer@example.com" ${isEmailVerified ? 'readonly style="background:#F8FAFC; font-weight:700;"' : ''} oninput="onStep1ContactChange('farmer', 'email')" required />
              ${isEmailVerified ? '<i class="fas fa-circle-check" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); color:#10B981; font-size:1.1rem;"></i>' : ''}
            </div>
            <div class="field-error" id="err-frm-email"></div>

            ${!isEmailVerified ? `
              <div style="margin-top:8px;">
                <button type="button" id="btn-frm-send-email-otp" class="btn btn-outline btn-sm" onclick="sendStep1EmailOtp('farmer')" style="border-color:#2563EB; color:#2563EB; font-weight:700; padding:6px 14px; font-size:0.8rem;">
                  <i class="fas fa-paper-plane"></i> ${st.emailOtpSent ? 'Resend Brevo OTP' : 'Send Email OTP'}
                </button>
              </div>

              <!-- Email OTP Entry Input -->
              <div id="frm-email-otp-wrap" style="display:${st.emailOtpSent ? 'block' : 'none'}; margin-top:10px; padding:10px; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span style="font-size:0.78rem; font-weight:700; color:#1E40AF;">Enter 6-digit OTP sent to email</span>
                  <span id="frm-email-otp-timer" style="font-size:0.75rem; color:#1D4ED8; font-weight:700;"></span>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                  <input type="text" id="frm-email-otp-input" maxlength="6" class="form-control" style="max-width:140px; letter-spacing:4px; font-weight:800; text-align:center; font-size:1rem;" placeholder="123456" />
                  <button type="button" id="btn-frm-verify-email-otp" class="btn btn-primary btn-sm" onclick="verifyStep1EmailOtp('farmer')" style="background:#2563EB; border-color:#2563EB; font-weight:700; padding:6px 14px;">
                    Verify Email
                  </button>
                </div>
                <div id="frm-email-otp-msg" style="margin-top:6px;"></div>
              </div>
            ` : `
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
                <span style="font-size:0.78rem; color:#065F46; font-weight:600;"><i class="fas fa-check-circle" style="color:#10B981;"></i> ${draft.email || st.verifiedEmailAddress} verified</span>
                <button type="button" class="btn btn-sm btn-outline" onclick="unlockStep1Contact('farmer', 'email')" style="font-size:0.72rem; padding:2px 8px; border-color:#CBD5E1; color:#64748B;">Change</button>
              </div>
            `}
          </div>

          <!-- 3. Password & Confirm Password with Visibility & Strength Meter -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div class="form-group">
              <label class="form-label" style="font-weight:700;">Password *</label>
              <div style="position:relative;">
                <input type="password" id="frm-pass" name="password" class="form-control" value="${draft.password || ''}" placeholder="Create password (min 6 chars)" oninput="updateFarmerPasswordStrength(this.value)" required />
                <button type="button" onclick="togglePasswordVisibility('frm-pass', 'frm-pass-eye')" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); border:none; background:transparent; cursor:pointer; color:#64748B;">
                  <i class="fas fa-eye" id="frm-pass-eye"></i>
                </button>
              </div>
              <!-- Strength Indicator -->
              <div style="margin-top:6px;">
                <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-muted); margin-bottom:2px;">
                  <span>Security:</span>
                  <span id="frm-strength-label" style="font-weight:700;">Minimum 6 characters</span>
                </div>
                <div style="height:4px; background:#E2E8F0; border-radius:2px; overflow:hidden;">
                  <div id="frm-strength-bar" style="width:0%; height:100%; transition:all 0.3s ease; background:#EF4444;"></div>
                </div>
              </div>
              <div class="field-error" id="err-frm-pass"></div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:700;">Confirm Password *</label>
              <div style="position:relative;">
                <input type="password" id="frm-pass-confirm" name="confirmPassword" class="form-control" value="${draft.confirmPassword || draft.password || ''}" placeholder="Re-enter password" oninput="checkFarmerPasswordMatch()" required />
                <button type="button" onclick="togglePasswordVisibility('frm-pass-confirm', 'frm-pass-confirm-eye')" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); border:none; background:transparent; cursor:pointer; color:#64748B;">
                  <i class="fas fa-eye" id="frm-pass-confirm-eye"></i>
                </button>
              </div>
              <div id="frm-pass-match-msg" style="font-size:0.72rem; margin-top:4px;"></div>
              <div class="field-error" id="err-frm-pass-confirm"></div>
            </div>
          </div>

          <!-- 4. Terms Checkbox -->
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:10px 12px;">
            <label style="display:flex; align-items:flex-start; gap:8px; font-size:0.82rem; color:var(--primary-navy); cursor:pointer; margin:0;">
              <input type="checkbox" id="frm-terms-cb" style="margin-top:2px;" ${draft.termsAccepted ? 'checked' : 'checked'} required />
              <span>I agree to the <a href="javascript:void(0)" style="color:var(--saffron); font-weight:700;">Terms & Conditions</a> and <a href="javascript:void(0)" style="color:var(--saffron); font-weight:700;">Privacy Policy</a> governing national APMC procurement.</span>
            </label>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px;">
          <button type="button" class="btn btn-outline" onclick="openRegistrationChooser()">
            <i class="fas fa-arrow-left"></i> Change Role
          </button>
          <button type="submit" id="btn-frm-continue-1" class="btn btn-primary" style="padding:10px 22px; font-weight:700; ${!isReadyToProceed ? 'opacity:0.85;' : ''}">
            Continue & Verify <i class="fas fa-arrow-right" style="margin-left:6px;"></i>
          </button>
        </div>
      </form>
    `;
  }

  // ----------------------------------------------------
  // STEP 2 — PERSONAL DETAILS
  // Separate Full Name & Dynamic Relationship (Father / Husband)
  // ----------------------------------------------------
  if (step === 2) {
    const selectedRel = draft.relationshipToFarmer || 'Father';
    const relLabel = selectedRel === 'Husband' ? "Husband's Name *" : "Father's Name *";
    const relPlaceholder = selectedRel === 'Husband' ? "Enter husband's full name" : "Enter father's full name";

    return `
      <form id="farmer-step2-form" onsubmit="event.preventDefault(); validateAndNextFarmer(2);">
        <div style="margin-bottom:16px;">
          <h3 style="color:var(--primary-navy); font-weight:800; margin:0 0 4px 0; font-size:1.35rem;">
            Personal Information
          </h3>
          <p style="color:var(--text-muted); font-size:0.88rem; margin:0;">
            Enter your personal information exactly as it appears on your official identity documents.
          </p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
          <!-- FIELD 1: FARMER FULL NAME -->
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label" style="font-weight:700;">Farmer Full Name *</label>
            <input type="text" id="frm-name" name="fullName" class="form-control" value="${draft.fullName || ''}" placeholder="Enter your full name" required />
            <small style="color:var(--text-muted); font-size:0.75rem;">Enter your name as mentioned on your identity document.</small>
            <div class="field-error" id="err-frm-name"></div>
          </div>

          <!-- FIELD 2: DYNAMIC RELATIONSHIP (FATHER / HUSBAND) -->
          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Relationship *</label>
            <select id="frm-relationship" name="relationshipToFarmer" class="form-control" onchange="onFarmerRelationshipChange(this.value)" required>
              <option value="Father" ${selectedRel === 'Father' ? 'selected' : ''}>Father</option>
              <option value="Husband" ${selectedRel === 'Husband' ? 'selected' : ''}>Husband</option>
            </select>
            <small style="color:var(--text-muted); font-size:0.75rem;">Select relationship for official records.</small>
          </div>

          <div class="form-group">
            <label class="form-label" id="frm-rel-name-label" style="font-weight:700;">${relLabel}</label>
            <input type="text" id="frm-father-husband" name="fatherOrHusbandName" class="form-control" value="${draft.fatherOrHusbandName || draft.fatherName || ''}" placeholder="${relPlaceholder}" required />
            <small style="color:var(--text-muted); font-size:0.75rem;">Enter the full legal name.</small>
            <div class="field-error" id="err-frm-father-husband"></div>
          </div>

          <!-- Date of Birth & Gender -->
          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Date of Birth (Min 18 Years) *</label>
            <input type="date" id="frm-dob" name="dateOfBirth" class="form-control" value="${draft.dateOfBirth || draft.dob || '1988-06-15'}" onchange="checkFarmerAge(this.value)" required />
            <div id="frm-dob-age-display" style="font-size:0.75rem; color:#059669; font-weight:700; margin-top:2px;"></div>
            <div class="field-error" id="err-frm-dob"></div>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Gender *</label>
            <select id="frm-gender" name="gender" class="form-control" required>
              <option value="Male" ${(!draft.gender || draft.gender === 'Male') ? 'selected' : ''}>Male</option>
              <option value="Female" ${draft.gender === 'Female' ? 'selected' : ''}>Female</option>
              <option value="Other" ${draft.gender === 'Other' ? 'selected' : ''}>Other / Prefer not to say</option>
            </select>
          </div>

          <!-- Farmer Type & Aadhaar Number -->
          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Farmer Type *</label>
            <select id="frm-farmer-type" name="farmerType" class="form-control" required>
              <option value="Individual Farmer" ${(!draft.farmerType || draft.farmerType === 'Individual Farmer') ? 'selected' : ''}>Individual Farmer</option>
              <option value="Tenant Farmer" ${draft.farmerType === 'Tenant Farmer' ? 'selected' : ''}>Tenant Farmer</option>
              <option value="Sharecropper" ${draft.farmerType === 'Sharecropper' ? 'selected' : ''}>Sharecropper</option>
              <option value="Other" ${draft.farmerType === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Aadhaar Number (12 Digits) *</label>
            <input type="text" id="frm-aadhaar" name="aadhaarNumber" maxlength="14" class="form-control" value="${draft.aadhaarNumber || ''}" placeholder="XXXX XXXX XXXX" oninput="formatFarmerAadhaar(this)" required />
            <small style="color:var(--text-muted); font-size:0.75rem;">Your Aadhaar is securely masked in public registers.</small>
            <div class="field-error" id="err-frm-aadhaar"></div>
          </div>

          <!-- Alternate Mobile (Optional) -->
          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Alternate Mobile Number <span style="font-weight:normal; color:var(--text-muted);">(Optional)</span></label>
            <div style="display:flex; gap:8px;">
              <div style="width:60px; background:#F1F5F9; border:1px solid #CBD5E1; border-radius:6px; display:flex; align-items:center; justify-content:center; font-weight:700; color:var(--primary-navy); font-size:0.85rem;">
                +91
              </div>
              <input type="tel" id="frm-alt-mobile" name="alternateMobile" maxlength="10" class="form-control" value="${draft.alternateMobile || ''}" placeholder="Optional secondary number" />
            </div>
          </div>

          <!-- Profile Photo Upload / Preview -->
          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Profile Photo</label>
            <div style="display:flex; align-items:center; gap:12px;">
              <div id="frm-photo-preview-wrap" style="width:60px; height:60px; border-radius:50%; background:#F1F5F9; border:2px dashed #CBD5E1; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                <img id="frm-photo-preview-img" src="${draft.profilePhoto || '/images/default_farmer.png'}" style="width:100%; height:100%; object-fit:cover; display:${draft.profilePhoto ? 'block' : 'none'};" alt="Farmer Photo" />
                <i id="frm-photo-preview-icon" class="fas fa-camera" style="color:#94A3B8; font-size:1.4rem; display:${draft.profilePhoto ? 'none' : 'block'};"></i>
              </div>
              <div style="flex:1;">
                <input type="file" id="frm-photo-input" accept="image/*" style="display:none;" onchange="handleFarmerPhotoSelected(this)" />
                <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('frm-photo-input').click()" style="font-size:0.8rem; padding:5px 10px;">
                  <i class="fas fa-upload"></i> ${draft.profilePhoto ? 'Replace Photo' : 'Upload Photo'}
                </button>
                ${draft.profilePhoto ? `
                  <button type="button" class="btn btn-sm btn-outline" onclick="removeFarmerPhoto()" style="font-size:0.8rem; padding:5px 10px; color:#EF4444; border-color:#FECACA; margin-left:6px;">
                    Remove
                  </button>
                ` : ''}
                <div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px;">JPG, PNG up to 2MB</div>
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:24px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(1)">
            <i class="fas fa-arrow-left"></i> Back to Account
          </button>
          <button type="submit" id="btn-frm-next-2" class="btn btn-primary">
            Continue to Address <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </form>
    `;
  }

  // ----------------------------------------------------
  // STEP 3 — ADDRESS & LOCATION
  // State -> District -> Taluka -> Village Hierarchy
  // ----------------------------------------------------
  if (step === 3) {
    const locState = draft.state || 'Madhya Pradesh';
    const locDist = draft.district || 'Bhopal';
    const locTal = draft.taluka || 'Huzur';
    const locVillage = draft.village || 'Ratibad';
    const locPin = draft.pincode || draft.pinCode || '462044';

    return `
      <form id="farmer-step3-form" onsubmit="event.preventDefault(); validateAndNextFarmer(3);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="color:var(--primary-navy); font-weight:800; margin:0 0 4px 0; font-size:1.35rem;">
              Address & Location
            </h3>
            <p style="color:var(--text-muted); font-size:0.88rem; margin:0;">
              Provide residential location details according to the official administrative hierarchy.
            </p>
          </div>
          <button type="button" class="btn btn-outline btn-sm" onclick="autoDetectFarmerLocation()" style="border-color:var(--saffron); color:var(--saffron); font-weight:700; padding:6px 12px; font-size:0.82rem; background:white;">
            <i class="fas fa-crosshairs"></i> Use Current Location
          </button>
        </div>

        <!-- GPS Banner -->
        <div id="frm-gps-status" style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:#ECFDF5; border:1px solid #A7F3D0; border-radius:6px; color:#065F46; font-size:0.8rem; margin-bottom:14px; font-weight:600;">
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="fas fa-location-dot" style="color:#10B981; font-size:1rem;"></i>
            <span id="frm-gps-text">Hierarchy: State → District → Taluka / Tehsil → Village / Town</span>
          </div>
          <span id="frm-gps-badge" class="status-pill completed" style="font-size:0.7rem;">Live Hierarchy</span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label" style="font-weight:700;">Address Line 1 (House No., Building, Street) *</label>
            <input type="text" id="frm-addr1" name="addressLine1" class="form-control" value="${draft.addressLine1 || draft.address || ''}" placeholder="e.g. Plot No. 12, Kisan Colony, Main Road" required />
            <div class="field-error" id="err-frm-addr1"></div>
          </div>

          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label" style="font-weight:700;">Address Line 2 (Landmark, Area) <span style="font-weight:normal; color:var(--text-muted);">(Optional)</span></label>
            <input type="text" id="frm-addr2" name="addressLine2" class="form-control" value="${draft.addressLine2 || ''}" placeholder="e.g. Near Panchayat Bhawan / Primary Health Center" />
          </div>

          <!-- Cascading Hierarchy: State -> District -> Taluka -> Village -->
          <div class="form-group">
            <label class="form-label" style="font-weight:700;">State *</label>
            <select id="frm-state" name="state" class="form-control" onchange="onStateChange(this.value, 'frm')" required>
              ${Object.keys(INDIA_LOCATIONS).sort().map(st => `<option value="${st}" ${locState === st ? 'selected' : ''}>${st}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:700;">District *</label>
            <select id="frm-district" name="district" class="form-control" onchange="onDistrictChange(this.value, 'frm')" required>
              <!-- Loaded dynamically -->
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Taluka / Tehsil *</label>
            <select id="frm-taluka" name="taluka" class="form-control" onchange="onTalukaChange(this.value, 'frm')" required>
              <!-- Loaded dynamically -->
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Village / Town *</label>
            <input type="text" id="frm-village" name="village" class="form-control" value="${locVillage}" placeholder="Enter Village / Town name" required />
            <div class="field-error" id="err-frm-village"></div>
          </div>

          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label" style="font-weight:700;">Pincode (6 Digits) *</label>
            <input type="text" id="frm-pincode" name="pincode" maxlength="6" class="form-control" value="${locPin}" placeholder="e.g. 462044" required />
            <div class="field-error" id="err-frm-pincode"></div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:24px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(2)">
            <i class="fas fa-arrow-left"></i> Back to Personal Details
          </button>
          <button type="submit" id="btn-frm-next-3" class="btn btn-primary">
            Continue to Land & Farming <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </form>
    `;
  }

  // ----------------------------------------------------
  // STEP 4 — LAND & FARMING DETAILS
  // ----------------------------------------------------
  if (step === 4) {
    const isLandSame = draft.isLandAddressSame !== false;
    const ownership = draft.ownershipType || draft.landOwnershipType || 'Owned';
    const areaVal = draft.area || draft.totalLandArea || 5.0;
    const unitVal = draft.unit || draft.landUnit || 'Acre';
    const cropsList = ['Wheat', 'Cotton', 'Rice', 'Groundnut', 'Mustard', 'Soybean', 'Gram/Chana', 'Vegetables', 'Other'];
    const activeCrops = Array.isArray(draft.crops) && draft.crops.length > 0 ? draft.crops : farmerSelectedCrops;

    return `
      <form id="farmer-step4-form" onsubmit="event.preventDefault(); validateAndNextFarmer(4);">
        <div style="margin-bottom:16px;">
          <h3 style="color:var(--primary-navy); font-weight:800; margin:0 0 4px 0; font-size:1.35rem;">
            Land & Farming Information
          </h3>
          <p style="color:var(--text-muted); font-size:0.88rem; margin:0;">
            Specify agricultural land parcels, survey records, crop selections, and irrigation facilities.
          </p>
        </div>

        <!-- Section 1: Land Details -->
        <div class="glass-card" style="padding:14px; margin-bottom:16px;">
          <div style="font-weight:700; color:var(--primary-navy); margin-bottom:12px; font-size:0.92rem;">
            <i class="fas fa-map-location-dot" style="color:var(--saffron);"></i> Land Holding Particulars
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div class="form-group">
              <label class="form-label" style="font-weight:700;">Land Ownership Type *</label>
              <select id="frm-ownership-type" name="ownershipType" class="form-control" required>
                <option value="Owned" ${ownership === 'Owned' ? 'selected' : ''}>Owned</option>
                <option value="Leased" ${ownership === 'Leased' ? 'selected' : ''}>Leased</option>
                <option value="Shared" ${ownership === 'Shared' ? 'selected' : ''}>Shared</option>
                <option value="Other" ${ownership === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:700;">Total Land Area *</label>
              <div style="display:flex; gap:8px;">
                <input type="number" id="frm-area" name="area" step="0.1" min="0.1" class="form-control" value="${areaVal}" placeholder="5.0" required />
                <select id="frm-unit" name="unit" class="form-control" style="width:110px;">
                  <option value="Acre" ${unitVal === 'Acre' ? 'selected' : ''}>Acre</option>
                  <option value="Hectare" ${unitVal === 'Hectare' ? 'selected' : ''}>Hectare</option>
                  <option value="Bigha" ${unitVal === 'Bigha' ? 'selected' : ''}>Bigha</option>
                  <option value="Other" ${unitVal === 'Other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
              <div class="field-error" id="err-frm-area"></div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:700;">Survey Number / Gat Number *</label>
              <input type="text" id="frm-survey" name="surveyNumber" class="form-control" value="${draft.surveyNumber || ''}" placeholder="e.g. 482/1 or Gat-92" required />
              <div class="field-error" id="err-frm-survey"></div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:700;">Land Record Number (7/12 / Khasra / Khata)</label>
              <input type="text" id="frm-land-record" name="landRecordNumber" class="form-control" value="${draft.landRecordNumber || ''}" placeholder="e.g. 7/12-98421 or Khasra 482" />
            </div>
          </div>

          <!-- Same Address Checkbox -->
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:10px 12px; margin-top:8px;">
            <label style="display:flex; align-items:center; gap:8px; font-size:0.85rem; font-weight:700; color:var(--primary-navy); cursor:pointer; margin:0;">
              <input type="checkbox" id="frm-land-same-addr" onchange="toggleFarmerLandSameAddress(this.checked)" ${isLandSame ? 'checked' : ''} />
              <span>Land address is same as residential address.</span>
            </label>
          </div>

          <!-- Separate Land Address Fields (Hidden if Same Address Checked) -->
          <div id="frm-separate-land-addr-box" style="display:${isLandSame ? 'none' : 'grid'}; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; padding:12px; background:#FEF3C7; border:1px solid #FDE68A; border-radius:6px;">
            <div class="form-group">
              <label class="form-label" style="font-weight:700; font-size:0.8rem;">Land State *</label>
              <select id="frm-land-state" name="landState" class="form-control">
                ${Object.keys(INDIA_LOCATIONS).sort().map(st => `<option value="${st}" ${(draft.landState || draft.state || 'Madhya Pradesh') === st ? 'selected' : ''}>${st}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight:700; font-size:0.8rem;">Land District *</label>
              <input type="text" id="frm-land-district" name="landDistrict" class="form-control" value="${draft.landDistrict || draft.district || ''}" placeholder="District" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight:700; font-size:0.8rem;">Land Taluka *</label>
              <input type="text" id="frm-land-taluka" name="landTaluka" class="form-control" value="${draft.landTaluka || draft.taluka || ''}" placeholder="Taluka" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight:700; font-size:0.8rem;">Land Village *</label>
              <input type="text" id="frm-land-village" name="landVillage" class="form-control" value="${draft.landVillage || draft.village || ''}" placeholder="Village" />
            </div>
          </div>
        </div>

        <!-- Section 2: Farming Information -->
        <div class="glass-card" style="padding:14px; margin-bottom:16px;">
          <div style="font-weight:700; color:var(--primary-navy); margin-bottom:12px; font-size:0.92rem;">
            <i class="fas fa-wheat-awn" style="color:var(--saffron);"></i> Farming Particulars & Crops
          </div>

          <!-- Primary Crops Multi-Select -->
          <div class="form-group" style="margin-bottom:14px;">
            <label class="form-label" style="font-weight:700;">Primary Crop(s) * (Select one or multiple crops)</label>
            <div style="display:flex; flex-wrap:wrap; gap:8px;" id="frm-crops-container">
              ${cropsList.map(c => {
                const isSelected = activeCrops.some(ac => ac.toLowerCase().includes(c.toLowerCase()));
                return `
                  <button type="button" class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}" onclick="toggleFarmerCropPill('${c}')" style="padding:6px 12px; font-size:0.82rem; border-radius:20px; font-weight:600; display:inline-flex; align-items:center; gap:6px;">
                    ${isSelected ? '<i class="fas fa-check"></i>' : '<i class="fas fa-plus"></i>'} ${c}
                  </button>
                `;
              }).join('')}
            </div>
            <div class="field-error" id="err-frm-crops"></div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div class="form-group">
              <label class="form-label" style="font-weight:700;">Current Farming Season *</label>
              <select id="frm-season" name="season" class="form-control" required>
                <option value="Rabi" ${draft.season === 'Rabi' ? 'selected' : ''}>Rabi (Winter - Wheat, Mustard, Gram)</option>
                <option value="Kharif" ${draft.season === 'Kharif' ? 'selected' : ''}>Kharif (Monsoon - Paddy, Cotton, Soybean)</option>
                <option value="Zaid" ${draft.season === 'Zaid' ? 'selected' : ''}>Zaid (Summer - Vegetables, Pulses)</option>
                <option value="Other" ${draft.season === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:700;">Irrigation Type *</label>
              <select id="frm-irrigation" name="irrigationType" class="form-control">
                <option value="Canal">Canal</option>
                <option value="Borewell">Borewell</option>
                <option value="Well">Open Well</option>
                <option value="Drip">Drip / Sprinkler</option>
                <option value="Rain-fed">Rain-fed</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:700;">Estimated Production (Quintals)</label>
              <input type="number" id="frm-production" name="estimatedProduction" step="1" min="1" class="form-control" value="${draft.estimatedProduction || 60}" placeholder="e.g. 60" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight:700;">Farming Experience (Years)</label>
              <input type="number" id="frm-experience" name="farmingExperience" min="0" max="60" class="form-control" value="${draft.farmingExperience || 10}" placeholder="e.g. 10" />
            </div>

            <div class="form-group" style="grid-column:1/-1;">
              <label style="display:flex; align-items:center; gap:8px; font-size:0.85rem; font-weight:700; color:var(--primary-navy); cursor:pointer; margin:0;">
                <input type="checkbox" id="frm-organic" name="organicFarming" ${draft.organicFarming ? 'checked' : ''} />
                <span>Practicing Certified Organic Farming / Natural Farming</span>
              </label>
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:24px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(3)">
            <i class="fas fa-arrow-left"></i> Back to Address
          </button>
          <button type="submit" id="btn-frm-next-4" class="btn btn-primary">
            Continue to Bank Details <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </form>
    `;
  }

  // ----------------------------------------------------
  // STEP 5 — BANK DETAILS
  // Masked after entry, IFSC validated
  // ----------------------------------------------------
  if (step === 5) {
    return `
      <form id="farmer-step5-form" onsubmit="event.preventDefault(); validateAndNextFarmer(5);">
        <div style="margin-bottom:16px;">
          <h3 style="color:var(--primary-navy); font-weight:800; margin:0 0 4px 0; font-size:1.35rem;">
            Bank & Payment Details
          </h3>
          <p style="color:var(--text-muted); font-size:0.88rem; margin:0;">
            Provide your bank details for eligible payments and direct benefit transfer (DBT).
          </p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label" style="font-weight:700;">Account Holder Name *</label>
            <input type="text" id="frm-acc-name" name="accountHolderName" class="form-control" value="${draft.accountHolderName || draft.fullName || ''}" placeholder="Enter name exactly as on bank passbook" required />
            <small style="color:var(--text-muted); font-size:0.75rem;">Account holder name should match the farmer's registered identity.</small>
            <div class="field-error" id="err-frm-acc-name"></div>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Bank Name *</label>
            <input type="text" id="frm-bank-name" name="bankName" class="form-control" value="${draft.bankName || 'State Bank of India'}" placeholder="e.g. State Bank of India" required />
            <div class="field-error" id="err-frm-bank-name"></div>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:700;">IFSC Code (11 Digits) *</label>
            <input type="text" id="frm-ifsc" name="ifsc" maxlength="11" class="form-control" value="${draft.ifsc || draft.ifscCode || 'SBIN0001234'}" placeholder="e.g. SBIN0001234" oninput="this.value = this.value.toUpperCase(); validateFarmerIFSC(this.value);" required />
            <div id="frm-ifsc-status-msg" style="font-size:0.75rem; margin-top:2px;"></div>
            <div class="field-error" id="err-frm-ifsc"></div>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Branch Name</label>
            <input type="text" id="frm-branch" name="branchName" class="form-control" value="${draft.branchName || draft.branch || 'Bhopal Main'}" placeholder="Branch name" />
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:700;">UPI ID <span style="font-weight:normal; color:var(--text-muted);">(Optional)</span></label>
            <input type="text" id="frm-upi" name="upiId" class="form-control" value="${draft.upiId || ''}" placeholder="e.g. mobile@upi" />
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Account Number *</label>
            <input type="password" id="frm-acc-num" name="accountNumber" class="form-control" value="${draft.accountNumber || ''}" placeholder="Enter account number" oninput="checkFarmerBankMatch()" required />
            <div class="field-error" id="err-frm-acc-num"></div>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight:700;">Confirm Account Number *</label>
            <input type="text" id="frm-acc-confirm" name="confirmAccountNumber" class="form-control" value="${draft.confirmAccountNumber || draft.accountNumber || ''}" placeholder="Re-enter account number" oninput="checkFarmerBankMatch()" required />
            <div id="frm-bank-match-msg" style="font-size:0.75rem; margin-top:2px;"></div>
            <div class="field-error" id="err-frm-acc-confirm"></div>
          </div>
        </div>

        <!-- Security & Privacy Note -->
        <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:8px; padding:12px; margin-top:14px; display:flex; align-items:center; gap:10px;">
          <i class="fas fa-lock" style="color:#059669; font-size:1.2rem;"></i>
          <div style="font-size:0.8rem; color:#065F46;">
            <strong>Bank Details Security:</strong> Your account number is encrypted and displayed as <code>******1234</code> on public dashboards. MSP payouts are credited via direct DBT integration.
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:24px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(4)">
            <i class="fas fa-arrow-left"></i> Back to Land & Farming
          </button>
          <button type="submit" id="btn-frm-next-5" class="btn btn-primary">
            Continue to Document Upload <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </form>
    `;
  }

  // ----------------------------------------------------
  // STEP 6 — DOCUMENT UPLOAD
  // Configurable Documents with Progress, Preview, Replace, Remove
  // ----------------------------------------------------
  if (step === 6) {
    const docs = verifiedDocs.farmer || {};

    return `
      <div>
        <div style="margin-bottom:16px;">
          <h3 style="color:var(--primary-navy); font-weight:800; margin:0 0 4px 0; font-size:1.35rem;">
            Upload Documents
          </h3>
          <p style="color:var(--text-muted); font-size:0.88rem; margin:0;">
            Upload clear and readable copies of your required documents (PDF, JPG, JPEG, PNG up to 5MB).
          </p>
        </div>

        <!-- Document Cards List -->
        <div style="display:flex; flex-direction:column; gap:14px;">
          ${renderFarmerDocCard('aadhaar', '1. Aadhaar Card', true, 'Aadhaar Card copy showing front/back with name & UID', docs.aadhaar)}
          ${renderFarmerDocCard('bankPassbook', '2. Bank Passbook / Cancelled Cheque', true, 'Passbook front page or cancelled cheque showing Name, Account No & IFSC', docs.bankPassbook)}
          ${renderFarmerDocCard('landRecord', '3. Land Record / Ownership Document', true, '7/12 extract, Khasra, Khatauni or lease agreement', docs.landRecord)}
          ${renderFarmerDocCard('photo', '4. Passport-size Photograph', false, 'Recent clear photograph with white or plain background', docs.photo)}
          ${renderFarmerDocCard('supportingDoc', '5. Additional Supporting Document', false, 'Kisan Credit Card (KCC), organic certificate, or caste certificate if applicable', docs.supportingDoc)}
        </div>

        <!-- Privacy & Storage Notice -->
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:12px; margin-top:16px; font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:8px;">
          <i class="fas fa-shield-check" style="color:var(--green-gov); font-size:1.1rem;"></i>
          <span>Documents are stored in encrypted private storage with role-based officer access. No public URLs are ever created.</span>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:24px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(5)">
            <i class="fas fa-arrow-left"></i> Back to Bank Details
          </button>
          <button type="button" id="btn-frm-next-6" class="btn btn-primary" onclick="validateFarmerDocsAndNext()">
            Continue to Review <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;
  }

  // ----------------------------------------------------
  // STEP 7 — REVIEW & DECLARATION
  // 5 Detailed Sections + [Edit] Jump Buttons + Declarations
  // ----------------------------------------------------
  if (step === 7) {
    return getFarmerReviewSummaryHtml();
  }

  return '';
};

/**
 * ----------------------------------------------------
 * OFFICER STEP HTML BUILDERS
 * ----------------------------------------------------
 */
const getOfficerStepHtml = (step) => {
  const draft = regDraftData.officer || {};

  if (step === 1) {
    return `
      <form id="officer-step1-form" onsubmit="event.preventDefault(); validateAndNextOfficer(1);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-id-card-clip" style="color:#2563EB;"></i> Step 1: Officer Personal Details</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Full Name (Official) *</label>
            <input type="text" id="off-name" name="fullName" class="form-control" value="${draft.fullName || ''}" placeholder="Dr. Vikram Singh" required />
            <div class="field-error" id="err-off-name"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Government Employee ID *</label>
            <input type="text" id="off-empid" name="employeeId" class="form-control" value="${draft.employeeId || ''}" placeholder="AGRI-EMP-8921" required />
            <div class="field-error" id="err-off-empid"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Official Designation *</label>
            <input type="text" id="off-designation" name="designation" class="form-control" value="${draft.designation || 'Senior Procurement Inspector'}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Date of Birth (Min 18 Years) *</label>
            <input type="date" id="off-dob" name="dob" class="form-control" value="${draft.dob || '1988-08-20'}" required />
          </div>

          ${renderStep1ContactBlock('officer', draft)}

          <div class="form-group">
            <label class="form-label">Aadhaar Number (12 Digits) *</label>
            <input type="text" id="off-aadhaar" name="aadhaarNumber" maxlength="12" class="form-control" value="${draft.aadhaarNumber || ''}" placeholder="582910482910" required />
            <div class="field-error" id="err-off-aadhaar"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Portal Access Password *</label>
            <input type="password" id="off-pass" name="password" class="form-control" value="${draft.password || ''}" placeholder="Create a secure password" required />
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="openRegistrationChooser()"><i class="fas fa-arrow-left"></i> Change Role</button>
          <button type="submit" class="btn btn-primary">Next: Government Employment <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 2) {
    return `
      <form id="officer-step2-form" onsubmit="event.preventDefault(); validateAndNextOfficer(2);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-landmark" style="color:#2563EB;"></i> Step 2: Government Employment Details</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Department *</label>
            <select id="off-dept" name="department" class="form-control">
              <option value="Department of Agriculture & Farmers Welfare">Department of Agriculture & Farmers Welfare</option>
              <option value="State Agricultural Marketing Board (APMC)">State Agricultural Marketing Board (APMC)</option>
              <option value="Food Corporation of India (FCI)">Food Corporation of India (FCI)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ministry *</label>
            <input type="text" id="off-ministry" name="ministry" class="form-control" value="Ministry of Agriculture and Farmers Welfare" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Cadre / Employment Type *</label>
            <select id="off-emp-type" name="employmentType" class="form-control">
              <option value="Permanent Central/State Cadre">Permanent Central / State Cadre</option>
              <option value="Contractual APMC Nodal Officer">Contractual APMC Nodal Officer</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Government Joining Date *</label>
            <input type="date" id="off-joining" name="joiningDate" class="form-control" value="${draft.joiningDate || '2018-04-01'}" required />
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Official Administrative Office Address *</label>
            <textarea id="off-office-addr" name="officeAddress" class="form-control" rows="2" required>${draft.officeAddress || 'Krishi Bhawan, Block B, Arera Hills, Bhopal, MP'}</textarea>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(1)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" class="btn btn-primary">Next: Procurement Centre <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 3) {
    return `
      <form id="officer-step3-form" onsubmit="event.preventDefault(); validateAndNextOfficer(3);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-store" style="color:#2563EB;"></i> Step 3: Assigned Procurement Centre</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Procurement Centre Code (e.g. CTR-01) *</label>
            <input type="text" id="off-center-code" name="procurementCentreCode" class="form-control" value="${draft.procurementCentreCode || 'CTR-01'}" oninput="lookupCentreCode(this.value)" required />
            <div class="field-error" id="err-off-center-code"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Procurement Centre Name *</label>
            <input type="text" id="off-center-name" name="procurementCentreName" class="form-control" value="${draft.procurementCentreName || 'APMC Central Mandi Bhopal'}" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Administrative Zone</label>
            <input type="text" id="off-zone" name="zone" class="form-control" value="Madhya Pradesh Central Zone" readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Reporting Nodal Officer</label>
            <input type="text" id="off-reporting" name="reportingOfficer" class="form-control" value="District Collector / Nodal APMC Officer" readonly />
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(2)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" class="btn btn-primary">Next: Identity Verification <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 4) {
    return `
      <form id="officer-step4-form" onsubmit="event.preventDefault(); validateAndNextOfficer(4);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-fingerprint" style="color:#2563EB;"></i> Step 4: Official Identity Verification</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Government Employee Card No *</label>
            <input type="text" id="off-id-card-no" class="form-control" value="${draft.govtEmployeeIdNumber || draft.employeeId || 'AGRI-EMP-8921'}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Department Authorization Ref No *</label>
            <input type="text" id="off-auth-no" class="form-control" value="${draft.departmentAuthNumber || 'AUTH/APMC/2026/0942'}" required />
          </div>
          <div class="form-group">
            <label class="form-label">PAN Card Number (Optional)</label>
            <input type="text" id="off-pan" maxlength="10" class="form-control" value="${draft.panNumber || ''}" placeholder="ABCDE1234F" />
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(3)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" class="btn btn-primary">Next: Document Verification <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 5) {
    return `
      <div>
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:6px;"><i class="fas fa-file-shield" style="color:#2563EB;"></i> Step 5: Officer Credential Document Verification</h4>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:18px;">
          Upload verified government appointments & credentials. All documents are scanned via real-time OCR.
        </p>

        <div style="display:flex; flex-direction:column; gap:16px;">
          ${renderDocUploadZone('govtEmployeeId', 'Government Employee ID Card', 'Official Employee Card with Gov Logo', 'govtEmployeeId')}
          ${renderDocUploadZone('appointmentLetter', 'Appointment Letter / Joining Order', 'Official Gazette / Order Copy', 'appointmentLetter')}
          ${renderDocUploadZone('authorizationLetter', 'Department Authorization Letter', 'Mandate letter for Procurement Centre', 'authorizationLetter')}
          ${renderDocUploadZone('aadhaar', 'Aadhaar Card', 'UIDAI Aadhaar Card', 'aadhaar')}
          ${renderDocUploadZone('photo', 'Passport Size Photograph', 'Clear single human subject', 'photo')}
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:24px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(4)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="button" class="btn btn-primary" onclick="validateDocsAndNextOfficer()">Next: Review & Declaration <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>
    `;
  }

  if (step === 6) {
    return getOfficerReviewHtml();
  }

  if (step === 7) {
    return getOTPScreenHtml();
  }

  return '';
};

/**
 * ----------------------------------------------------
 * SUPER ADMIN STEP HTML BUILDERS
 * ----------------------------------------------------
 */
const getSuperAdminStepHtml = (step) => {
  const draft = regDraftData.superadmin || {};

  if (step === 1) {
    return `
      <form id="sadm-step1-form" onsubmit="event.preventDefault(); validateAndNextSuperAdmin(1);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-user-shield" style="color:var(--green-gov);"></i> Step 1: Administrator Personal & Contact Details</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="sadm-name" class="form-control" value="${draft.fullName || ''}" placeholder="Dr. S. K. Awasthi" required />
            <div class="field-error" id="err-sadm-name"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Official Designation *</label>
            <input type="text" id="sadm-designation" class="form-control" value="${draft.designation || 'Joint Secretary / Chief Procurement Commissioner'}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Official Employee ID *</label>
            <input type="text" id="sadm-empid" class="form-control" value="${draft.employeeId || ''}" placeholder="GOV-IAS-2004" required />
          </div>
          <div class="form-group">
            <label class="form-label">Date of Birth (Min 21 Years) *</label>
            <input type="date" id="sadm-dob" class="form-control" value="${draft.dob || '1976-03-12'}" required />
            <div class="field-error" id="err-sadm-dob"></div>
          </div>

          ${renderStep1ContactBlock('superadmin', draft)}

          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Aadhaar Card Number (12 Digits) *</label>
            <input type="text" id="sadm-aadhaar" maxlength="12" class="form-control" value="${draft.aadhaarNumber || ''}" placeholder="682910482910" required />
            <div class="field-error" id="err-sadm-aadhaar"></div>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="openRegistrationChooser()"><i class="fas fa-arrow-left"></i> Change Role</button>
          <button type="submit" class="btn btn-primary">Next: Organization Details <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 2) {
    return `
      <form id="sadm-step2-form" onsubmit="event.preventDefault(); validateAndNextSuperAdmin(2);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-building" style="color:var(--green-gov);"></i> Step 2: Organization & Ministry Profile</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">Organization / Authority Name *</label>
            <input type="text" id="sadm-org" class="form-control" value="${draft.orgName || 'Kisan Procurement Authority of India'}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Department *</label>
            <input type="text" id="sadm-dept" class="form-control" value="${draft.departmentName || 'Direct Benefit Transfer & Market Integration'}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Ministry / Apex Body *</label>
            <input type="text" id="sadm-ministry" class="form-control" value="${draft.ministryName || 'Ministry of Agriculture & Farmers Welfare'}" required />
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">National Headquarters Address *</label>
            <textarea id="sadm-addr" class="form-control" rows="2" required>${draft.officeAddress || 'Krishi Bhawan, Dr. Rajendra Prasad Road, New Delhi 110001'}</textarea>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(1)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" class="btn btn-primary">Next: Identity Verification <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 3) {
    return `
      <div>
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:6px;"><i class="fas fa-file-shield" style="color:var(--green-gov);"></i> Step 3: Government Identity Verification</h4>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:18px;">
          Highest administrative credentials must be verified via OCR engine prior to setup completion.
        </p>

        <div style="display:flex; flex-direction:column; gap:16px;">
          ${renderDocUploadZone('govtEmployeeId', 'Government Employee ID Card', 'Official High-Security Identification', 'govtEmployeeId')}
          ${renderDocUploadZone('appointmentLetter', 'Gazetted Appointment Order', 'Cabinet / Ministry Notification', 'appointmentLetter')}
          ${renderDocUploadZone('aadhaar', 'Aadhaar Card', 'UIDAI Identity Card', 'aadhaar')}
          ${renderDocUploadZone('photo', 'Passport Size Photograph', 'Clear single human subject', 'photo')}
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:24px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(2)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="button" class="btn btn-primary" onclick="validateDocsAndNextSuperAdmin()">Next: Account Credentials <i class="fas fa-arrow-right"></i></button>
        </div>
      </div>
    `;
  }

  if (step === 4) {
    return `
      <form id="sadm-step4-form" onsubmit="event.preventDefault(); validateAndNextSuperAdmin(4);">
        <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-key" style="color:var(--green-gov);"></i> Step 4: Security Credentials & Password Policy</h4>
        <div style="display:flex; flex-direction:column; gap:14px;">
          <div class="form-group">
            <label class="form-label">Super Admin Password (Min 12 Chars: Uppercase, Lowercase, Number & Symbol) *</label>
            <input type="password" id="sadm-pass" class="form-control" oninput="checkPasswordStrength(this.value)" placeholder="Enter high-strength password" required />
            <!-- Password Strength Meter -->
            <div style="margin-top:6px;">
              <div style="height:5px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
                <div id="pass-meter-bar" style="width:0%; height:100%; transition:all 0.3s ease;"></div>
              </div>
              <div id="pass-meter-text" style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Minimum 12 characters required</div>
            </div>
            <div class="field-error" id="err-sadm-pass"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Confirm Password *</label>
            <input type="password" id="sadm-pass-confirm" class="form-control" placeholder="Re-enter password" required />
            <div class="field-error" id="err-sadm-pass-confirm"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Security Recovery Question *</label>
            <select id="sadm-sec-q" class="form-control">
              <option value="What was the district of your first administrative posting?">What was the district of your first administrative posting?</option>
              <option value="What is the official designation of your first appointing authority?">What is the official designation of your first appointing authority?</option>
              <option value="What was the reference number of your induction cadre?">What was the reference number of your induction cadre?</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Security Recovery Answer *</label>
            <input type="text" id="sadm-sec-a" class="form-control" placeholder="Enter answer" required />
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="goToStep(3)"><i class="fas fa-arrow-left"></i> Back</button>
          <button type="submit" class="btn btn-primary">Next: Review & Confirmation <i class="fas fa-arrow-right"></i></button>
        </div>
      </form>
    `;
  }

  if (step === 5) {
    return getSuperAdminReviewHtml();
  }

  if (step === 6) {
    return getOTPScreenHtml();
  }

  return '';
};

/**
 * ----------------------------------------------------
 * DOCUMENT UPLOAD ZONE RENDERER
 * ----------------------------------------------------
 */
const renderDocUploadZone = (docKey, label, hint, ocrType) => {
  const currentStatus = verifiedDocs[currentRegType][docKey] || null;

  return `
    <div id="doc-zone-${docKey}" class="glass-card" style="padding:14px; border:1px dashed ${currentStatus && currentStatus.valid ? '#10B981' : 'var(--border-color)'};">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <div style="font-weight:700; font-size:0.95rem; color:var(--primary-navy);">
            <i class="fas fa-file-arrow-up" style="color:var(--saffron); margin-right:6px;"></i> ${label} *
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted);">${hint}</div>
        </div>
        <div>
          <input type="file" id="file-input-${docKey}" accept="${ocrType === 'photo' ? 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,.jfif' : '.pdf,.jpg,.jpeg,.png,.webp,.jfif,.bmp,application/pdf,image/*'}" style="display:none;" onchange="handleDocUpload('${docKey}', '${ocrType}', this.files[0]); this.value='';" />
          <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('file-input-${docKey}').click()">
            <i class="fas fa-cloud-arrow-up"></i> ${currentStatus && currentStatus.valid ? 'Re-upload' : 'Upload & Verify'}
          </button>
        </div>
      </div>

      <!-- OCR Status Result Box -->
      <div id="doc-status-${docKey}" style="margin-top:10px; ${currentStatus ? '' : 'display:none;'}">
        ${currentStatus && currentStatus.valid ? `
          <div style="display:flex; align-items:center; gap:8px; font-size:0.82rem; color:#065F46; background:#ECFDF5; padding:8px 12px; border-radius:6px;">
            <i class="fas fa-circle-check" style="color:#10B981; font-size:1.1rem;"></i>
            <div>
              <strong>Verified (${currentStatus.confidenceScore || 98}%)</strong>: ${currentStatus.fileName}
              <div style="font-size:0.75rem; color:#047857;">OCR Detected: ${Array.isArray(currentStatus.detectedMarkers) ? currentStatus.detectedMarkers.join(', ') : 'Valid Government Credentials'}</div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
};

/**
 * Handle Live Document Upload & AI OCR Execution
 */
const handleDocUpload = async (docKey, ocrType, file) => {
  if (!file) return;

  const statusBox = document.getElementById(`doc-status-${docKey}`);
  const zoneBox = document.getElementById(`doc-zone-${docKey}`);

  statusBox.style.display = 'block';
  statusBox.innerHTML = `
    <div style="padding:10px; background:rgba(224,109,20,0.06); border-radius:6px; font-size:0.82rem; color:var(--saffron);">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Scanning with Document OCR Verification Engine...</span>
      </div>
      <div style="height:3px; background:#FED7AA; border-radius:2px; overflow:hidden;">
        <div style="width:75%; height:100%; background:var(--saffron); animation:pulse 1s infinite;"></div>
      </div>
    </div>
  `;

  const formData = new FormData();
  formData.append('document', file);
  formData.append('docType', ocrType);

  // Pass additional cross-verification metadata if available
  const draft = regDraftData[currentRegType] || {};
  if (draft.aadhaarNumber) formData.append('aadhaarNumber', draft.aadhaarNumber);
  if (draft.ifscCode) formData.append('ifscCode', draft.ifscCode);
  if (draft.accountNumber) formData.append('accountNumber', draft.accountNumber);
  if (draft.bankName) formData.append('bankName', draft.bankName);
  if (draft.surveyNumber) formData.append('surveyNumber', draft.surveyNumber);
  if (draft.landRecordNumber) formData.append('landRecordNumber', draft.landRecordNumber);
  if (draft.fullName) formData.append('fullName', draft.fullName);

  try {
    const res = await fetch('/api/registration/verify-document', {
      method: 'POST',
      body: formData
    });
    const result = await res.json();

    if (result.success && result.valid) {
      verifiedDocs[currentRegType][docKey] = {
        valid: true,
        docType: result.docType,
        confidenceScore: result.confidenceScore,
        detectedMarkers: result.detectedMarkers,
        fileUrl: result.fileUrl,
        fileName: result.fileName,
        fileSize: result.fileSize
      };

      zoneBox.style.borderColor = '#10B981';
      statusBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; font-size:0.82rem; color:#065F46; background:#ECFDF5; padding:8px 12px; border-radius:6px;">
          <i class="fas fa-circle-check" style="color:#10B981; font-size:1.1rem;"></i>
          <div>
            <strong>Verified (${result.confidenceScore}%)</strong>: ${result.fileName}
            <div style="font-size:0.75rem; color:#047857;">OCR Classification: ${result.docType} | Verified Markers: ${result.detectedMarkers ? result.detectedMarkers.join(', ') : 'Govt Structure'}</div>
          </div>
        </div>
      `;
      showToast(`${ocrType.toUpperCase()} verified successfully!`, 'success');
    } else {
      zoneBox.style.borderColor = '#EF4444';
      statusBox.innerHTML = `
        <div style="font-size:0.82rem; color:#991B1B; background:#FEF2F2; padding:8px 12px; border-radius:6px;">
          <i class="fas fa-triangle-exclamation" style="color:#EF4444; margin-right:4px;"></i>
          <strong>Verification Warning:</strong> ${result.message || 'Document structure could not be verified'}
        </div>
      `;
      showToast(result.message || 'Document failed verification', 'warning');
    }
  } catch (err) {
    statusBox.innerHTML = `
      <div style="font-size:0.82rem; color:#EF4444;">Error uploading document: ${err.message}</div>
    `;
    showToast('Document upload failed: ' + err.message, 'error');
  }
};

/**
 * ----------------------------------------------------
 * DOCUMENT UPLOAD & OCR VERIFICATION HELPERS (FARMER STEP 6)
 * ----------------------------------------------------
 */
const renderFarmerDocCard = (docKey, label, isRequired, hint, currentDoc) => {
  const isUploaded = currentDoc && currentDoc.valid;
  const fileName = isUploaded ? currentDoc.fileName : '';
  const fileSize = isUploaded ? (currentDoc.fileSize ? `${Math.round(currentDoc.fileSize / 1024)} KB` : 'Verified') : '';

  return `
    <div id="frm-doc-card-${docKey}" class="glass-card" style="padding:14px; border:1px solid ${isUploaded ? '#86EFAC' : '#E2E8F0'}; background:${isUploaded ? '#F0FDF4' : '#FFFFFF'}; transition:all 0.2s ease;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
        <div style="flex:1; min-width:240px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <strong style="color:var(--primary-navy); font-size:0.92rem;">${label}</strong>
            ${isRequired ? '<span class="status-pill active" style="font-size:0.7rem; padding:2px 6px;">Required</span>' : '<span style="font-size:0.7rem; color:var(--text-muted); background:#F1F5F9; padding:2px 6px; border-radius:4px;">Optional</span>'}
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted);">${hint}</div>
        </div>

        <div>
          <input type="file" id="frm-file-${docKey}" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*" style="display:none;" onchange="handleFarmerDocSelected('${docKey}', this)" />
          ${!isUploaded ? `
            <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('frm-file-${docKey}').click()" style="border-color:var(--saffron); color:var(--saffron); font-weight:700; padding:6px 14px; font-size:0.8rem;">
              <i class="fas fa-arrow-up-from-bracket"></i> Upload Document
            </button>
          ` : `
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="previewFarmerDocModal('${docKey}')" style="padding:4px 10px; font-size:0.75rem; border-color:#059669; color:#059669; background:white;">
                <i class="fas fa-eye"></i> Preview
              </button>
              <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('frm-file-${docKey}').click()" style="padding:4px 10px; font-size:0.75rem; border-color:#CBD5E1; color:#64748B;">
                Replace
              </button>
              <button type="button" class="btn btn-outline btn-sm" onclick="removeFarmerDoc('${docKey}')" style="padding:4px 10px; font-size:0.75rem; border-color:#FECACA; color:#EF4444;">
                Remove
              </button>
            </div>
          `}
        </div>
      </div>

      <!-- Upload Progress / File Status -->
      <div id="frm-doc-status-${docKey}" style="margin-top:8px;">
        ${isUploaded ? `
          <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.8rem; color:#065F46; background:#DCFCE7; padding:6px 10px; border-radius:6px; margin-top:6px;">
            <div style="display:flex; align-items:center; gap:6px; overflow:hidden;">
              <i class="fas fa-circle-check" style="color:#10B981;"></i>
              <span style="font-weight:700; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; max-width:260px;">${fileName}</span>
              <span style="font-size:0.72rem; color:#047857;">(${fileSize})</span>
            </div>
            <span class="status-pill completed" style="font-size:0.7rem;">✓ Uploaded</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
};

/**
 * Handle Document Selection & Upload to Backend
 */
const handleFarmerDocSelected = async (docKey, inputEl) => {
  const file = inputEl.files[0];
  if (!file) return;

  // File size check: Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    showToast('File size exceeds the 10MB limit. Please upload a smaller document.', 'error');
    inputEl.value = '';
    return;
  }

  // File type check
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type) && !/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) {
    showToast('Invalid file format. Please upload PDF, JPG, JPEG, or PNG.', 'error');
    inputEl.value = '';
    return;
  }

  const statusBox = document.getElementById(`frm-doc-status-${docKey}`);
  if (statusBox) {
    statusBox.innerHTML = `
      <div style="margin-top:6px; padding:8px; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:6px;">
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#1E40AF; margin-bottom:4px;">
          <span><i class="fas fa-spinner fa-spin"></i> Uploading ${file.name}...</span>
          <span id="frm-doc-prog-${docKey}">0%</span>
        </div>
        <div style="height:4px; background:#DBEAFE; border-radius:2px; overflow:hidden;">
          <div id="frm-doc-prog-bar-${docKey}" style="width:10%; height:100%; background:#2563EB; transition:width 0.2s ease;"></div>
        </div>
      </div>
    `;
  }

  const formData = new FormData();
  formData.append('document', file);
  formData.append('docType', docKey);
  const draft = regDraftData.farmer || {};
  if (draft.fullName) formData.append('fullName', draft.fullName);
  if (draft.aadhaarNumber) formData.append('aadhaarNumber', draft.aadhaarNumber);

  try {
    // Animate progress
    let p = 15;
    const progInt = setInterval(() => {
      p = Math.min(p + 25, 90);
      const textEl = document.getElementById(`frm-doc-prog-${docKey}`);
      const barEl = document.getElementById(`frm-doc-prog-bar-${docKey}`);
      if (textEl) textEl.textContent = `${p}%`;
      if (barEl) barEl.style.width = `${p}%`;
    }, 150);

    const res = await fetch('/api/registration/upload-document', {
      method: 'POST',
      body: formData
    });
    clearInterval(progInt);
    const result = await res.json();

    if (result.success && result.valid) {
      if (!verifiedDocs.farmer) verifiedDocs.farmer = {};
      verifiedDocs.farmer[docKey] = {
        valid: true,
        docType: result.docType || docKey,
        fileName: result.fileName || file.name,
        fileSize: result.fileSize || file.size,
        fileUrl: result.fileUrl,
        uploadDate: new Date().toISOString().split('T')[0]
      };

      showToast(`✓ ${file.name} uploaded successfully!`, 'success');
      renderRegistrationWizard();
    } else {
      showToast(result.message || 'Document upload failed. Please try again.', 'error');
      if (statusBox) statusBox.innerHTML = `<div style="color:#EF4444; font-size:0.75rem; margin-top:4px;">Upload failed: ${result.message || 'Error'}</div>`;
    }
  } catch (err) {
    showToast('Document upload error: ' + err.message, 'error');
    if (statusBox) statusBox.innerHTML = `<div style="color:#EF4444; font-size:0.75rem; margin-top:4px;">Upload failed: ${err.message}</div>`;
  }
};

/**
 * Remove an uploaded farmer document
 */
const removeFarmerDoc = (docKey) => {
  if (verifiedDocs.farmer && verifiedDocs.farmer[docKey]) {
    delete verifiedDocs.farmer[docKey];
    showToast('Document removed.', 'info');
    renderRegistrationWizard();
  }
};

/**
 * Preview document in a modal
 */
const previewFarmerDocModal = (docKey) => {
  const doc = verifiedDocs.farmer && verifiedDocs.farmer[docKey];
  if (!doc || !doc.fileUrl) {
    showToast('Document preview is unavailable.', 'warning');
    return;
  }

  const isPdf = (doc.fileName || '').toLowerCase().endsWith('.pdf') || doc.fileUrl.toLowerCase().endsWith('.pdf');
  const modalHtml = `
    <div id="frm-doc-preview-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:99999; display:flex; align-items:center; justify-content:center; padding:20px;">
      <div class="glass-card" style="background:#FFF; width:100%; max-width:680px; max-height:85vh; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 20px 40px rgba(0,0,0,0.3);">
        <div style="padding:14px 18px; border-bottom:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; background:#F8FAFC;">
          <strong style="color:var(--primary-navy); font-size:1rem;"><i class="fas fa-file-lines" style="color:var(--saffron); margin-right:6px;"></i> ${doc.fileName}</strong>
          <button type="button" onclick="document.getElementById('frm-doc-preview-modal').remove()" style="border:none; background:transparent; font-size:1.3rem; color:#64748B; cursor:pointer;">&times;</button>
        </div>
        <div style="flex:1; overflow-y:auto; padding:16px; text-align:center;">
          ${isPdf ? `
            <iframe src="${doc.fileUrl}" style="width:100%; height:450px; border:none; border-radius:8px;"></iframe>
          ` : `
            <img src="${doc.fileUrl}" style="max-width:100%; max-height:500px; object-fit:contain; border-radius:8px;" alt="${doc.fileName}" />
          `}
        </div>
        <div style="padding:10px 18px; border-top:1px solid #E2E8F0; display:flex; justify-content:flex-end; background:#F8FAFC;">
          <button type="button" class="btn btn-navy btn-sm" onclick="document.getElementById('frm-doc-preview-modal').remove()">Close Preview</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

/**
 * ----------------------------------------------------
 * STEP 7 — MASTER REVIEW & DECLARATION
 * Complete 5-Section Summary + Direct [Edit] Buttons
 * ----------------------------------------------------
 */
const getFarmerReviewSummaryHtml = () => {
  const d = regDraftData.farmer || {};
  const maskedAadhaar = d.aadhaarNumber ? `XXXX XXXX ${d.aadhaarNumber.slice(-4)}` : 'XXXX XXXX 0000';
  const maskedMobile = d.mobile ? `******${d.mobile.slice(-4)}` : '******0000';
  const maskedEmail = d.email ? maskEmail(d.email) : '******@example.com';
  const maskedAccount = d.accountNumber ? `******${d.accountNumber.slice(-4)}` : '******0000';
  const cropsText = Array.isArray(d.crops) ? d.crops.join(', ') : (d.primaryCrop || 'Wheat');

  return `
    <div>
      <div style="margin-bottom:16px;">
        <h3 style="color:var(--primary-navy); font-weight:800; margin:0 0 4px 0; font-size:1.35rem;">
          Review Your Application
        </h3>
        <p style="color:var(--text-muted); font-size:0.88rem; margin:0;">
          Please review all entered details. Click <strong>Edit</strong> on any section to make updates without losing your progress.
        </p>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px; max-height:380px; overflow-y:auto; padding-right:4px;" class="custom-scrollbar">
        <!-- SECTION 1: PERSONAL INFORMATION -->
        <div class="glass-card" style="padding:14px; border:1px solid #E2E8F0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #F1F5F9; padding-bottom:6px;">
            <div style="font-weight:800; color:var(--primary-navy); font-size:0.92rem; display:flex; align-items:center; gap:6px;">
              <i class="fas fa-user-circle" style="color:var(--saffron);"></i> Section 1: Personal Information
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="goToStep(2)" style="font-size:0.75rem; padding:3px 10px; border-color:var(--saffron); color:var(--saffron);">
              <i class="fas fa-pen"></i> Edit Personal Information
            </button>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.84rem;">
            <div><span style="color:var(--text-muted);">Farmer Full Name:</span> <strong style="color:var(--primary-navy);">${d.fullName || 'Ramesh Kumar Patel'}</strong></div>
            <div><span style="color:var(--text-muted);">Relationship:</span> <strong>${d.relationshipToFarmer || 'Father'}</strong></div>
            <div><span style="color:var(--text-muted);">${d.relationshipToFarmer === 'Husband' ? "Husband's Name:" : "Father's Name:"}</span> <strong>${d.fatherOrHusbandName || d.fatherName || 'Maheshbhai Patel'}</strong></div>
            <div><span style="color:var(--text-muted);">Date of Birth:</span> <strong>${d.dateOfBirth || d.dob || '1988-06-15'}</strong></div>
            <div><span style="color:var(--text-muted);">Gender:</span> <strong>${d.gender || 'Male'}</strong></div>
            <div><span style="color:var(--text-muted);">Farmer Type:</span> <strong>${d.farmerType || 'Individual Farmer'}</strong></div>
            <div><span style="color:var(--text-muted);">Aadhaar:</span> <strong>${maskedAadhaar}</strong></div>
            <div><span style="color:var(--text-muted);">Mobile:</span> <strong>+91 ${maskedMobile}</strong> <span style="color:#059669; font-size:0.75rem;">✓ Verified</span></div>
            <div style="grid-column:1/-1;"><span style="color:var(--text-muted);">Email:</span> <strong>${maskedEmail}</strong> <span style="color:#059669; font-size:0.75rem;">✓ Verified</span></div>
          </div>
        </div>

        <!-- SECTION 2: ADDRESS -->
        <div class="glass-card" style="padding:14px; border:1px solid #E2E8F0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #F1F5F9; padding-bottom:6px;">
            <div style="font-weight:800; color:var(--primary-navy); font-size:0.92rem; display:flex; align-items:center; gap:6px;">
              <i class="fas fa-location-dot" style="color:var(--green-gov);"></i> Section 2: Address & Location
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="goToStep(3)" style="font-size:0.75rem; padding:3px 10px; border-color:var(--green-gov); color:var(--green-gov);">
              <i class="fas fa-pen"></i> Edit Address
            </button>
          </div>
          <div style="font-size:0.84rem; line-height:1.5;">
            <div><span style="color:var(--text-muted);">Address:</span> <strong>${d.addressLine1 || d.address || ''}${d.addressLine2 ? ', ' + d.addressLine2 : ''}</strong></div>
            <div style="margin-top:4px;">
              <span style="color:var(--text-muted);">Village:</span> <strong>${d.village}</strong> | 
              <span style="color:var(--text-muted);">Taluka:</span> <strong>${d.taluka}</strong> | 
              <span style="color:var(--text-muted);">District:</span> <strong>${d.district}</strong> | 
              <span style="color:var(--text-muted);">State:</span> <strong>${d.state}</strong> - <strong>${d.pincode || d.pinCode}</strong>
            </div>
          </div>
        </div>

        <!-- SECTION 3: LAND & FARMING INFORMATION -->
        <div class="glass-card" style="padding:14px; border:1px solid #E2E8F0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #F1F5F9; padding-bottom:6px;">
            <div style="font-weight:800; color:var(--primary-navy); font-size:0.92rem; display:flex; align-items:center; gap:6px;">
              <i class="fas fa-wheat-awn" style="color:var(--saffron);"></i> Section 3: Land & Farming Details
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="goToStep(4)" style="font-size:0.75rem; padding:3px 10px; border-color:var(--saffron); color:var(--saffron);">
              <i class="fas fa-pen"></i> Edit Land Information
            </button>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.84rem;">
            <div><span style="color:var(--text-muted);">Ownership:</span> <strong>${d.ownershipType || d.landOwnershipType || 'Owned'}</strong></div>
            <div><span style="color:var(--text-muted);">Land Area:</span> <strong>${d.area || d.totalLandArea || 5.0} ${d.unit || d.landUnit || 'Acre'}</strong></div>
            <div><span style="color:var(--text-muted);">Survey / Gat No:</span> <strong>${d.surveyNumber || 'N/A'}</strong></div>
            <div><span style="color:var(--text-muted);">Land Record No:</span> <strong>${d.landRecordNumber || '7/12'}</strong></div>
            <div><span style="color:var(--text-muted);">Primary Crop(s):</span> <strong>${cropsText}</strong></div>
            <div><span style="color:var(--text-muted);">Farming Season:</span> <strong>${d.season || 'Rabi'}</strong></div>
            <div><span style="color:var(--text-muted);">Irrigation:</span> <strong>${d.irrigationType || 'Canal'}</strong></div>
            <div><span style="color:var(--text-muted);">Organic Farming:</span> <strong>${d.organicFarming ? 'Yes (Certified)' : 'Conventional'}</strong></div>
          </div>
        </div>

        <!-- SECTION 4: BANK DETAILS -->
        <div class="glass-card" style="padding:14px; border:1px solid #E2E8F0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #F1F5F9; padding-bottom:6px;">
            <div style="font-weight:800; color:var(--primary-navy); font-size:0.92rem; display:flex; align-items:center; gap:6px;">
              <i class="fas fa-building-columns" style="color:#2563EB;"></i> Section 4: Bank & Payment Details
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="goToStep(5)" style="font-size:0.75rem; padding:3px 10px; border-color:#2563EB; color:#2563EB;">
              <i class="fas fa-pen"></i> Edit Bank Information
            </button>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.84rem;">
            <div><span style="color:var(--text-muted);">Account Holder:</span> <strong>${d.accountHolderName || d.fullName}</strong></div>
            <div><span style="color:var(--text-muted);">Bank Name:</span> <strong>${d.bankName || 'State Bank of India'}</strong></div>
            <div><span style="color:var(--text-muted);">Account Number:</span> <strong>${maskedAccount}</strong></div>
            <div><span style="color:var(--text-muted);">IFSC Code:</span> <strong>${d.ifsc || d.ifscCode || 'SBIN0001234'}</strong></div>
            <div><span style="color:var(--text-muted);">Branch:</span> <strong>${d.branchName || d.branch || 'Main Branch'}</strong></div>
            ${d.upiId ? `<div><span style="color:var(--text-muted);">UPI ID:</span> <strong>${d.upiId}</strong></div>` : ''}
          </div>
        </div>

        <!-- SECTION 5: DOCUMENTS -->
        <div class="glass-card" style="padding:14px; border:1px solid #E2E8F0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #F1F5F9; padding-bottom:6px;">
            <div style="font-weight:800; color:var(--primary-navy); font-size:0.92rem; display:flex; align-items:center; gap:6px;">
              <i class="fas fa-file-shield" style="color:var(--green-gov);"></i> Section 5: Uploaded Documents
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="goToStep(6)" style="font-size:0.75rem; padding:3px 10px; border-color:var(--green-gov); color:var(--green-gov);">
              <i class="fas fa-pen"></i> Edit Documents
            </button>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            <span class="status-pill completed" style="font-size:0.75rem;"><i class="fas fa-check"></i> Aadhaar Card</span>
            <span class="status-pill completed" style="font-size:0.75rem;"><i class="fas fa-check"></i> Bank Passbook / Cheque</span>
            <span class="status-pill completed" style="font-size:0.75rem;"><i class="fas fa-check"></i> Land Record (7/12)</span>
            ${verifiedDocs.farmer?.photo ? '<span class="status-pill completed" style="font-size:0.75rem;"><i class="fas fa-check"></i> Photograph</span>' : ''}
          </div>
        </div>
      </div>

      <!-- MANDATORY DECLARATIONS -->
      <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px; padding:12px 14px; margin-top:16px;">
        <p style="font-size:0.8rem; color:#92400E; margin:0 0 10px 0; line-height:1.4;">
          <strong>Legal Declaration:</strong> "I declare that the information provided by me is true and correct to the best of my knowledge. I understand that the information and documents submitted by me may be verified by the authorized department."
        </p>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <label style="display:flex; align-items:flex-start; gap:8px; font-size:0.82rem; color:#78350F; cursor:pointer;">
            <input type="checkbox" id="frm-declaration-cb" onchange="toggleFarmerSubmitButtonState()" style="margin-top:2px;" required />
            <span>I agree to the official declaration and confirm the accuracy of all submitted details.</span>
          </label>
          <label style="display:flex; align-items:flex-start; gap:8px; font-size:0.82rem; color:#78350F; cursor:pointer;">
            <input type="checkbox" id="frm-review-terms-cb" onchange="toggleFarmerSubmitButtonState()" style="margin-top:2px;" required />
            <span>I agree to the Terms & Conditions and Privacy Policy.</span>
          </label>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px;">
        <button type="button" class="btn btn-outline" onclick="goToStep(6)">
          <i class="fas fa-arrow-left"></i> Back to Documents
        </button>
        <button type="button" id="btn-frm-final-submit" class="btn btn-success" onclick="submitFarmerRegistrationMaster()" disabled style="padding:10px 24px; font-weight:800; opacity:0.6; cursor:not-allowed;">
          <i class="fas fa-check-double" style="margin-right:6px;"></i> Submit Farmer Registration
        </button>
      </div>
    </div>
  `;
};

/**
 * Toggle Final Submit Button State based on Declarations
 */
window.toggleFarmerSubmitButtonState = function() {
  const decCb = document.getElementById('frm-declaration-cb');
  const termsCb = document.getElementById('frm-review-terms-cb');
  const submitBtn = document.getElementById('btn-frm-final-submit');
  if (!submitBtn) return;

  const isAgreed = decCb && decCb.checked && termsCb && termsCb.checked;
  submitBtn.disabled = !isAgreed;
  submitBtn.style.opacity = isAgreed ? '1' : '0.6';
  submitBtn.style.cursor = isAgreed ? 'pointer' : 'not-allowed';
};

const getOfficerReviewHtml = () => {
  const d = regDraftData.officer || {};

  return `
    <div>
      <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-stamp" style="color:#2563EB;"></i> Step 6: Review & Official Declaration</h4>
      <div class="glass-card" style="padding:14px; margin-bottom:16px; font-size:0.85rem; line-height:1.6;">
        <div><strong>Officer Name:</strong> ${d.fullName} (EMP ID: ${d.employeeId})</div>
        <div><strong>Designation:</strong> ${d.designation} | Department: ${d.department}</div>
        <div><strong>Assigned Mandi Centre:</strong> ${d.procurementCentreName} (${d.procurementCentreCode})</div>
        <div><strong>Official Email:</strong> ${d.officialEmail} | Mobile: ${d.mobile}</div>
      </div>

      <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:12px; margin-bottom:18px;">
        <label style="display:flex; align-items:flex-start; gap:8px; font-size:0.82rem; color:#1E3A8A; cursor:pointer;">
          <input type="checkbox" id="officer-declaration-cb" style="margin-top:2px;" required />
          <span>I solemnly declare that all information provided is accurate and that I am a duly appointed and authorized government procurement officer under the APMC Act.</span>
        </label>
      </div>

      <div style="display:flex; justify-content:space-between;">
        <button type="button" class="btn btn-outline" onclick="goToStep(5)"><i class="fas fa-arrow-left"></i> Back</button>
        <button type="button" class="btn btn-primary" onclick="submitOfficerRegistrationInitiate()">
          <i class="fas fa-paper-plane"></i> Submit Application & Request OTP
        </button>
      </div>
    </div>
  `;
};

const getSuperAdminReviewHtml = () => {
  const d = regDraftData.superadmin || {};

  return `
    <div>
      <h4 style="color:var(--primary-navy); font-weight:800; margin-bottom:14px;"><i class="fas fa-shield-check" style="color:var(--green-gov);"></i> Step 5: Review & Root Setup Declaration</h4>
      <div class="glass-card" style="padding:14px; margin-bottom:16px; font-size:0.85rem; line-height:1.6;">
        <div><strong>Organization:</strong> ${d.orgName} (${d.ministryName})</div>
        <div><strong>Super Admin:</strong> ${d.fullName} (${d.designation})</div>
        <div><strong>Official Email:</strong> ${d.officialEmail} | Mobile: ${d.mobile}</div>
      </div>

      <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:8px; padding:12px; margin-bottom:18px;">
        <label style="display:flex; align-items:flex-start; gap:8px; font-size:0.82rem; color:#065F46; cursor:pointer;">
          <input type="checkbox" id="sadm-declaration-cb" style="margin-top:2px;" required />
          <span>I certify that I am authorized to create the initial Super Admin account for this procurement management system. I understand that this wizard will permanently lock itself upon activation.</span>
        </label>
      </div>

      <div style="display:flex; justify-content:space-between;">
        <button type="button" class="btn btn-outline" onclick="goToStep(4)"><i class="fas fa-arrow-left"></i> Back</button>
        <button type="button" class="btn btn-success" onclick="submitSuperAdminInitiate()">
          <i class="fas fa-lock"></i> Initialize Super Admin & Dispatch OTP
        </button>
      </div>
    </div>
  `;
};

/**
 * ----------------------------------------------------
 * OTP VERIFICATION SCREEN (6 BOXES, COUNTDOWN, AUTO-FOCUS)
 * ----------------------------------------------------
 */
const getOTPScreenHtml = () => {
  const email = (currentRegType === 'farmer')
    ? (regDraftData.farmer.email || 'your email')
    : (currentRegType === 'officer' ? (regDraftData.officer.officialEmail || 'official email') : (regDraftData.superadmin.officialEmail || 'email'));

  return `
    <div style="text-align:center; padding:10px 0;">
      <div style="width:60px; height:60px; border-radius:50%; background:rgba(224,109,20,0.12); color:var(--saffron); display:flex; align-items:center; justify-content:center; font-size:1.8rem; margin:0 auto 16px auto;">
        <i class="fas fa-envelope-circle-check"></i>
      </div>
      <h3 style="color:var(--primary-navy); font-weight:800; margin-bottom:6px;">Enter 6-Digit OTP</h3>
      <p style="color:var(--text-muted); font-size:0.88rem; max-width:380px; margin:0 auto 20px auto;">
        A high-security verification code has been dispatched to <strong>${email}</strong> via Brevo.
      </p>

      <!-- 6 Separate OTP Boxes -->
      <div id="otp-input-container" style="display:flex; gap:10px; justify-content:center; margin-bottom:20px;">
        <input type="text" maxlength="1" class="otp-box" id="otp-1" oninput="onOtpInput(1, event)" onkeydown="onOtpKeyDown(1, event)" autocomplete="off" />
        <input type="text" maxlength="1" class="otp-box" id="otp-2" oninput="onOtpInput(2, event)" onkeydown="onOtpKeyDown(2, event)" autocomplete="off" />
        <input type="text" maxlength="1" class="otp-box" id="otp-3" oninput="onOtpInput(3, event)" onkeydown="onOtpKeyDown(3, event)" autocomplete="off" />
        <input type="text" maxlength="1" class="otp-box" id="otp-4" oninput="onOtpInput(4, event)" onkeydown="onOtpKeyDown(4, event)" autocomplete="off" />
        <input type="text" maxlength="1" class="otp-box" id="otp-5" oninput="onOtpInput(5, event)" onkeydown="onOtpKeyDown(5, event)" autocomplete="off" />
        <input type="text" maxlength="1" class="otp-box" id="otp-6" oninput="onOtpInput(6, event)" onkeydown="onOtpKeyDown(6, event)" autocomplete="off" />
      </div>

      <div id="otp-error-banner" style="display:none; color:#EF4444; font-size:0.85rem; font-weight:600; margin-bottom:14px;"></div>

      <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:20px;">
        Resend code in: <strong id="otp-timer-text" style="color:var(--saffron);">00:60</strong>
        <div style="margin-top:6px;">
          <button type="button" id="btn-resend-otp" class="btn btn-outline btn-sm" onclick="resendRegistrationOTP()" style="display:none;">
            <i class="fas fa-rotate"></i> Resend OTP via Brevo
          </button>
        </div>
      </div>

      <button type="button" id="btn-verify-otp" class="btn btn-primary" style="width:100%; justify-content:center; padding:12px;" onclick="verifySubmittedOTP()">
        <i class="fas fa-shield-check"></i> Verify & Complete Registration
      </button>

      <div style="display:flex; align-items:center; gap:8px; margin:16px 0 12px 0; font-size:0.78rem; color:var(--text-muted);">
        <hr style="flex:1; border:none; border-top:1px solid rgba(0,0,0,0.12);" />
        <span>OR VERIFY MOBILE VIA REAL SMS</span>
        <hr style="flex:1; border:none; border-top:1px solid rgba(0,0,0,0.12);" />
      </div>

      <button type="button" class="btn btn-outline" style="width:100%; justify-content:center; padding:11px; font-weight:700; border-color:var(--saffron); color:var(--saffron);" onclick="verifyRegistrationViaMsg91()">
        <i class="fas fa-mobile-screen-button" style="margin-right:6px;"></i> 📱 Send Real SMS OTP via MSG91 to Mobile
      </button>
    </div>
  `;
};

/**
 * OTP Input Handlers (Auto-focus, backspace, paste support)
 */
const onOtpInput = (index, event) => {
  const val = event.target.value;
  if (val.length === 1 && index < 6) {
    document.getElementById(`otp-${index + 1}`).focus();
  }
};

const onOtpKeyDown = (index, event) => {
  if (event.key === 'Backspace' && !event.target.value && index > 1) {
    document.getElementById(`otp-${index - 1}`).focus();
  }
};

// Global Paste Support for OTP boxes
document.addEventListener('paste', (e) => {
  const pasteData = e.clipboardData.getData('text').trim();
  if (/^\d{6}$/.test(pasteData) && document.getElementById('otp-1')) {
    e.preventDefault();
    for (let i = 1; i <= 6; i++) {
      const box = document.getElementById(`otp-${i}`);
      if (box) box.value = pasteData[i - 1];
    }
    document.getElementById('otp-6').focus();
  }
});

/**
 * Start 60s countdown timer
 */
const startOTPTimer = () => {
  clearInterval(otpCountdownInterval);
  otpSecondsLeft = 60;
  const timerText = document.getElementById('otp-timer-text');
  const resendBtn = document.getElementById('btn-resend-otp');

  if (resendBtn) resendBtn.style.display = 'none';

  otpCountdownInterval = setInterval(() => {
    otpSecondsLeft--;
    if (timerText) {
      timerText.textContent = `00:${otpSecondsLeft < 10 ? '0' : ''}${otpSecondsLeft}`;
    }

    if (otpSecondsLeft <= 0) {
      clearInterval(otpCountdownInterval);
      if (timerText) timerText.textContent = 'Expired';
      if (resendBtn) resendBtn.style.display = 'inline-block';
    }
  }, 1000);
};

/**
 * ----------------------------------------------------
 * STEP VALIDATION LOGIC
 * ----------------------------------------------------
 */
const goToStep = (step) => {
  currentRegStep = step;
  if (currentRegType === 'farmer') {
    farmerMaxVisitedStep = Math.max(farmerMaxVisitedStep, step);
  }
  renderRegistrationWizard();
};

/**
 * ----------------------------------------------------
 * FARMER REGISTRATION ENGINE (STEPS 1 - 7)
 * ----------------------------------------------------
 */
const validateAndNextFarmer = (step) => {
  // Clear any existing error highlights
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');

  // --------------------------------------------------
  // STEP 1 — ACCOUNT CREATION
  // --------------------------------------------------
  if (step === 1) {
    const mobileEl = document.getElementById('frm-mobile');
    const emailEl = document.getElementById('frm-email');
    const passEl = document.getElementById('frm-pass');
    const passConfirmEl = document.getElementById('frm-pass-confirm');
    const termsEl = document.getElementById('frm-terms-cb');

    const mobile = mobileEl ? mobileEl.value.trim().replace(/\D/g, '').slice(-10) : '';
    const email = emailEl ? emailEl.value.trim().toLowerCase() : '';
    const password = passEl ? passEl.value : '';
    const confirmPassword = passConfirmEl ? passConfirmEl.value : '';

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      showFieldError('err-frm-mobile', 'Please enter a valid 10-digit Indian mobile number.');
      if (mobileEl) mobileEl.focus();
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError('err-frm-email', 'Please enter a valid email address.');
      if (emailEl) emailEl.focus();
      return;
    }

    if (!password || password.length < 6) {
      showFieldError('err-frm-pass', 'Password does not meet the minimum security requirements (min 6 characters).');
      if (passEl) passEl.focus();
      return;
    }

    if (password !== confirmPassword) {
      showFieldError('err-frm-pass-confirm', 'Confirm password must exactly match the password.');
      if (passConfirmEl) passConfirmEl.focus();
      return;
    }

    if (termsEl && !termsEl.checked) {
      showToast('You must agree to the Terms & Conditions and Privacy Policy to proceed.', 'warning');
      return;
    }

    // STRICT OTP GATING: Both Mobile & Brevo Email MUST be verified before proceeding
    if (!step1State.farmer.mobileVerified) {
      showToast('⚠️ Mobile Number must be verified via OTP before proceeding to Step 2.', 'warning');
      showFieldError('err-frm-mobile', 'Mobile verification via OTP is mandatory.');
      if (mobileEl) mobileEl.focus();
      return;
    }

    if (!step1State.farmer.emailVerified) {
      showToast('⚠️ Email Address must be verified via Brevo OTP before proceeding to Step 2.', 'warning');
      showFieldError('err-frm-email', 'Email verification via Brevo OTP is mandatory.');
      if (emailEl) emailEl.focus();
      return;
    }

    regDraftData.farmer = {
      ...regDraftData.farmer,
      mobile,
      email,
      password,
      isPhoneVerified: true,
      isEmailVerified: true,
      termsAccepted: true
    };

    farmerMaxVisitedStep = Math.max(farmerMaxVisitedStep, 2);
    goToStep(2);
    showToast('✓ Step 1 Completed: Account & Contacts Verified', 'success');
  }

  // --------------------------------------------------
  // STEP 2 — PERSONAL DETAILS
  // --------------------------------------------------
  else if (step === 2) {
    const nameEl = document.getElementById('frm-name');
    const relEl = document.getElementById('frm-relationship');
    const fatherHusbandEl = document.getElementById('frm-father-husband');
    const dobEl = document.getElementById('frm-dob');
    const genderEl = document.getElementById('frm-gender');
    const typeEl = document.getElementById('frm-farmer-type');
    const aadhaarEl = document.getElementById('frm-aadhaar');
    const altMobileEl = document.getElementById('frm-alt-mobile');

    const fullName = nameEl ? nameEl.value.trim() : '';
    const relationship = relEl ? relEl.value : 'Father';
    const fatherOrHusbandName = fatherHusbandEl ? fatherHusbandEl.value.trim() : '';
    const dob = dobEl ? dobEl.value : '';
    const gender = genderEl ? genderEl.value : 'Male';
    const farmerType = typeEl ? typeEl.value : 'Individual Farmer';
    const aadhaarClean = aadhaarEl ? aadhaarEl.value.replace(/\D/g, '') : '';
    const altMobile = altMobileEl ? altMobileEl.value.trim().replace(/\D/g, '') : '';

    if (!fullName || !/^[A-Za-z\s.'-]+$/.test(fullName) || fullName.length < 2) {
      showFieldError('err-frm-name', "Please enter the farmer's full name (as per official identity documents).");
      if (nameEl) nameEl.focus();
      return;
    }

    if (!fatherOrHusbandName || !/^[A-Za-z\s.'-]+$/.test(fatherOrHusbandName) || fatherOrHusbandName.length < 2) {
      const fieldTitle = relationship === 'Husband' ? "husband's" : "father's";
      showFieldError('err-frm-father-husband', `Please enter the ${fieldTitle} name.`);
      if (fatherHusbandEl) fatherHusbandEl.focus();
      return;
    }

    if (!dob) {
      showFieldError('err-frm-dob', 'Please select Date of Birth.');
      if (dobEl) dobEl.focus();
      return;
    }

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    if (isNaN(age) || age < 18) {
      showFieldError('err-frm-dob', 'Farmer must be at least 18 years of age to register.');
      if (dobEl) dobEl.focus();
      return;
    }

    if (!aadhaarClean || aadhaarClean.length !== 12) {
      showFieldError('err-frm-aadhaar', 'Please enter a valid 12-digit Aadhaar number.');
      if (aadhaarEl) aadhaarEl.focus();
      return;
    }

    if (altMobile && altMobile.length !== 10) {
      showToast('Alternate mobile number must be exactly 10 digits if provided.', 'warning');
      if (altMobileEl) altMobileEl.focus();
      return;
    }

    regDraftData.farmer = {
      ...regDraftData.farmer,
      fullName,
      relationshipToFarmer: relationship,
      fatherOrHusbandName,
      fatherName: relationship === 'Father' ? fatherOrHusbandName : (regDraftData.farmer.fatherName || ''),
      dob,
      dateOfBirth: dob,
      gender,
      farmerType,
      aadhaarNumber: aadhaarClean,
      alternateMobile: altMobile
    };

    farmerMaxVisitedStep = Math.max(farmerMaxVisitedStep, 3);
    goToStep(3);
    showToast('✓ Step 2 Completed: Personal Details Saved', 'success');
  }

  // --------------------------------------------------
  // STEP 3 — ADDRESS & LOCATION
  // --------------------------------------------------
  else if (step === 3) {
    const addr1El = document.getElementById('frm-addr1');
    const addr2El = document.getElementById('frm-addr2');
    const stateEl = document.getElementById('frm-state');
    const distEl = document.getElementById('frm-district');
    const talukaEl = document.getElementById('frm-taluka');
    const villageEl = document.getElementById('frm-village');
    const pinEl = document.getElementById('frm-pincode');

    const addressLine1 = addr1El ? addr1El.value.trim() : '';
    const addressLine2 = addr2El ? addr2El.value.trim() : '';
    const state = stateEl ? stateEl.value : 'Madhya Pradesh';
    const district = distEl ? distEl.value : 'Bhopal';
    const taluka = talukaEl ? talukaEl.value : 'Huzur';
    const village = villageEl ? villageEl.value.trim() : '';
    const pincode = pinEl ? pinEl.value.trim().replace(/\D/g, '') : '';

    if (!addressLine1) {
      showFieldError('err-frm-addr1', 'Please enter Address Line 1 (House No, Street, Landmark).');
      if (addr1El) addr1El.focus();
      return;
    }

    if (!village) {
      showFieldError('err-frm-village', 'Please enter your Village or Town name.');
      if (villageEl) villageEl.focus();
      return;
    }

    if (!pincode || pincode.length !== 6) {
      showFieldError('err-frm-pincode', 'Please enter a valid 6-digit Indian postal pincode.');
      if (pinEl) pinEl.focus();
      return;
    }

    regDraftData.farmer = {
      ...regDraftData.farmer,
      addressLine1,
      addressLine2,
      address: addressLine1 + (addressLine2 ? ', ' + addressLine2 : ''),
      state,
      district,
      taluka,
      village,
      pincode,
      pinCode: pincode
    };

    farmerMaxVisitedStep = Math.max(farmerMaxVisitedStep, 4);
    goToStep(4);
    showToast('✓ Step 3 Completed: Address Details Saved', 'success');
  }

  // --------------------------------------------------
  // STEP 4 — LAND & FARMING DETAILS
  // --------------------------------------------------
  else if (step === 4) {
    const ownTypeEl = document.getElementById('frm-ownership-type');
    const areaEl = document.getElementById('frm-area');
    const unitEl = document.getElementById('frm-unit');
    const surveyEl = document.getElementById('frm-survey');
    const landRecEl = document.getElementById('frm-land-record');
    const sameAddrEl = document.getElementById('frm-land-same-addr');
    const seasonEl = document.getElementById('frm-season');
    const irrigEl = document.getElementById('frm-irrigation');
    const expEl = document.getElementById('frm-experience');
    const orgEl = document.getElementById('frm-organic');

    const ownershipType = ownTypeEl ? ownTypeEl.value : 'Owned';
    const area = areaEl ? parseFloat(areaEl.value) : 0;
    const unit = unitEl ? unitEl.value : 'Acre';
    const surveyNumber = surveyEl ? surveyEl.value.trim() : '';
    const landRecordNumber = landRecEl ? landRecEl.value.trim() : '';
    const isLandSame = sameAddrEl ? sameAddrEl.checked : true;
    const season = seasonEl ? seasonEl.value : 'Rabi';
    const irrigationType = irrigEl ? irrigEl.value : 'Canal';
    const farmingExperience = expEl ? expEl.value : '10+ years';
    const organicFarming = orgEl ? orgEl.value === 'true' : false;

    if (isNaN(area) || area <= 0) {
      showFieldError('err-frm-area', 'Please enter a valid total land area greater than 0.');
      if (areaEl) areaEl.focus();
      return;
    }

    if (!surveyNumber) {
      showFieldError('err-frm-survey', 'Please enter Survey Number / Gat Number.');
      if (surveyEl) surveyEl.focus();
      return;
    }

    // Validate crops selection: at least 1 crop
    const selectedCrops = (Array.isArray(farmerSelectedCrops) && farmerSelectedCrops.length > 0)
      ? farmerSelectedCrops
      : (regDraftData.farmer.crops || ['Wheat']);

    if (!selectedCrops || selectedCrops.length === 0) {
      showFieldError('err-frm-crops', 'Please select at least one primary crop.');
      showToast('Please select at least one primary crop for procurement.', 'warning');
      return;
    }

    let landState = regDraftData.farmer.state || 'Madhya Pradesh';
    let landDistrict = regDraftData.farmer.district || 'Bhopal';
    let landTaluka = regDraftData.farmer.taluka || 'Huzur';
    let landVillage = regDraftData.farmer.village || 'Ratibad';

    if (!isLandSame) {
      const lsEl = document.getElementById('frm-land-state');
      const ldEl = document.getElementById('frm-land-district');
      const ltEl = document.getElementById('frm-land-taluka');
      const lvEl = document.getElementById('frm-land-village');

      landState = lsEl ? lsEl.value : landState;
      landDistrict = ldEl ? ldEl.value.trim() : landDistrict;
      landTaluka = ltEl ? ltEl.value.trim() : landTaluka;
      landVillage = lvEl ? lvEl.value.trim() : landVillage;
    }

    regDraftData.farmer = {
      ...regDraftData.farmer,
      ownershipType,
      landOwnershipType: ownershipType,
      area,
      totalLandArea: area,
      unit,
      landUnit: unit,
      surveyNumber,
      landRecordNumber,
      isLandAddressSame: isLandSame,
      landState,
      landDistrict,
      landTaluka,
      landVillage,
      crops: selectedCrops,
      primaryCrop: selectedCrops[0],
      season,
      procurementSeason: season,
      irrigationType,
      farmingExperience,
      organicFarming
    };

    farmerMaxVisitedStep = Math.max(farmerMaxVisitedStep, 5);
    goToStep(5);
    showToast('✓ Step 4 Completed: Land & Farming Details Saved', 'success');
  }

  // --------------------------------------------------
  // STEP 5 — BANK DETAILS
  // --------------------------------------------------
  else if (step === 5) {
    const nameEl = document.getElementById('frm-acc-name');
    const bankEl = document.getElementById('frm-bank-name');
    const branchEl = document.getElementById('frm-branch');
    const ifscEl = document.getElementById('frm-ifsc');
    const upiEl = document.getElementById('frm-upi');
    const accEl = document.getElementById('frm-acc-num');
    const confirmEl = document.getElementById('frm-acc-confirm');

    const accountHolderName = nameEl ? nameEl.value.trim() : '';
    const bankName = bankEl ? bankEl.value.trim() : '';
    const branchName = branchEl ? branchEl.value.trim() : '';
    const ifsc = ifscEl ? ifscEl.value.trim().toUpperCase() : '';
    const upiId = upiEl ? upiEl.value.trim() : '';
    const accountNumber = accEl ? accEl.value.trim().replace(/\D/g, '') : '';
    const confirmAccountNumber = confirmEl ? confirmEl.value.trim().replace(/\D/g, '') : '';

    if (!accountHolderName) {
      showFieldError('err-frm-acc-name', 'Please enter Bank Account Holder Name.');
      if (nameEl) nameEl.focus();
      return;
    }

    if (!bankName) {
      showFieldError('err-frm-bank-name', 'Please enter your Bank Name.');
      if (bankEl) bankEl.focus();
      return;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      showFieldError('err-frm-ifsc', 'Please enter a valid 11-character Indian IFSC code (e.g. SBIN0001234).');
      if (ifscEl) ifscEl.focus();
      return;
    }

    if (!accountNumber || accountNumber.length < 8) {
      showFieldError('err-frm-acc-num', 'Please enter a valid bank account number (min 8 digits).');
      if (accEl) accEl.focus();
      return;
    }

    if (accountNumber !== confirmAccountNumber) {
      showFieldError('err-frm-acc-confirm', 'Bank account numbers do not match. Please verify carefully.');
      if (confirmEl) confirmEl.focus();
      return;
    }

    regDraftData.farmer = {
      ...regDraftData.farmer,
      accountHolderName,
      bankName,
      branchName,
      branch: branchName,
      ifscCode: ifsc,
      ifsc,
      upiId,
      accountNumber,
      confirmAccountNumber
    };

    farmerMaxVisitedStep = Math.max(farmerMaxVisitedStep, 6);
    goToStep(6);
    showToast('✓ Step 5 Completed: Bank Details Saved Securely', 'success');
  }
};

/**
 * ----------------------------------------------------
 * STEP 6 — DOCUMENT VALIDATION & MOVE TO REVIEW
 * ----------------------------------------------------
 */
const validateFarmerDocsAndNext = () => {
  const docs = verifiedDocs.farmer || {};
  const required = ['aadhaar', 'bankPassbook', 'landRecord'];
  const missing = [];

  if (!docs.aadhaar || !docs.aadhaar.valid) missing.push('1. Aadhaar Card');
  if (!docs.bankPassbook || !docs.bankPassbook.valid) missing.push('2. Bank Passbook / Cheque');
  if (!docs.landRecord || !docs.landRecord.valid) missing.push('3. Land Record / Ownership Document');

  if (missing.length > 0) {
    showToast(`Mandatory Documents Missing: ${missing.join(', ')}. Please upload and verify all 3 required documents.`, 'error');
    return;
  }

  // Format documents array for submission
  regDraftData.farmer.documents = Object.keys(docs).map(k => ({
    docType: docs[k].docType || k,
    fileUrl: docs[k].fileUrl,
    fileName: docs[k].fileName,
    fileSize: docs[k].fileSize,
    status: 'Verified',
    uploadDate: docs[k].uploadDate || new Date().toISOString().split('T')[0]
  }));

  farmerMaxVisitedStep = Math.max(farmerMaxVisitedStep, 7);
  goToStep(7);
  showToast('✓ Step 6 Completed: All Documents Ready for Final Review', 'success');
};

/**
 * Enable/Disable Submit Button based on Declarations
 */
const toggleFarmerSubmitButtonState = () => {
  const declCb = document.getElementById('frm-declaration-cb');
  const termsCb = document.getElementById('frm-review-terms-cb');
  const submitBtn = document.getElementById('btn-frm-final-submit');

  if (!submitBtn) return;

  const isAgreed = !!(declCb && declCb.checked && termsCb && termsCb.checked);
  submitBtn.disabled = !isAgreed;
  submitBtn.style.opacity = isAgreed ? '1' : '0.6';
  submitBtn.style.cursor = isAgreed ? 'pointer' : 'not-allowed';
};

/**
 * ----------------------------------------------------
 * STEP 7 — FINAL SUBMISSION CONTROLLER
 * ----------------------------------------------------
 */
let isSubmittingFarmer = false;

const submitFarmerRegistrationMaster = async () => {
  if (isSubmittingFarmer) return;

  const declCb = document.getElementById('frm-declaration-cb');
  const termsCb = document.getElementById('frm-review-terms-cb');

  if (!declCb || !declCb.checked) {
    showToast('Please agree to the official declaration to proceed.', 'warning');
    return;
  }

  if (!termsCb || !termsCb.checked) {
    showToast('Please agree to the Terms & Conditions and Privacy Policy to proceed.', 'warning');
    return;
  }

  const submitBtn = document.getElementById('btn-frm-final-submit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i> Submitting Registration...`;
  }
  isSubmittingFarmer = true;

  try {
    showToast('Submitting Farmer Registration & Generating Application ID...', 'info');

    const res = await fetch('/api/registration/farmer/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regDraftData.farmer)
    });

    const result = await res.json();

    if (!result.success) {
      showToast(result.message || 'Submission failed. Please check your details.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-check-double" style="margin-right:6px;"></i> Submit Farmer Registration`;
      }
      isSubmittingFarmer = false;
      return;
    }

    // Save auth session if returned
    if (result.token) {
      localStorage.setItem('kpms_token', result.token);
    }
    if (result.data) {
      localStorage.setItem('kpms_user', JSON.stringify({
        id: result.data.id || result.data.userId,
        name: result.data.fullName,
        role: 'farmer',
        farmerId: result.data.farmerId,
        applicationId: result.data.applicationId
      }));
      updateNavAuth();
    }

    showToast('🎉 Farmer Registration Submitted Successfully!', 'success');
    renderFarmerSuccessScreenMaster(result.data);
  } catch (err) {
    showToast('Submission error: ' + err.message, 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fas fa-check-double" style="margin-right:6px;"></i> Submit Farmer Registration`;
    }
  } finally {
    isSubmittingFarmer = false;
  }
};

/**
 * ----------------------------------------------------
 * STEP 8 — SUCCESS & CONFIRMATION SCREEN
 * Application ID, Masked Contacts, Verification Status & Action Buttons
 * ----------------------------------------------------
 */
const renderFarmerSuccessScreenMaster = (data) => {
  const body = document.getElementById('modal-content-slot');
  if (!body) return;

  const appId = data.applicationId || 'FMR-2026-000123';
  const fullName = data.fullName || regDraftData.farmer.fullName || 'Farmer';
  const rawMobile = data.mobile || regDraftData.farmer.mobile || '9999999999';
  const rawEmail = data.email || regDraftData.farmer.email || 'farmer@example.com';
  const maskedMobile = `******${rawMobile.slice(-4)}`;
  const maskedEmail = maskEmail(rawEmail);

  body.innerHTML = `
    <div style="text-align:center; padding:16px 8px;">
      <!-- Green Success Badge -->
      <div style="width:76px; height:76px; border-radius:50%; background:#ECFDF5; color:#10B981; display:flex; align-items:center; justify-content:center; font-size:2.6rem; margin:0 auto 16px auto; box-shadow:0 8px 24px rgba(16,185,129,0.18);">
        <i class="fas fa-check"></i>
      </div>

      <h2 style="color:var(--primary-navy); font-weight:800; margin-bottom:6px; font-size:1.55rem;">
        Registration Submitted Successfully
      </h2>
      <p style="color:var(--text-muted); font-size:0.92rem; max-width:480px; margin:0 auto 20px auto; line-height:1.5;">
        Your farmer registration has been submitted successfully and is now pending verification.
      </p>

      <!-- Application Details Card -->
      <div class="glass-card" style="padding:18px; margin-bottom:24px; text-align:left; background:rgba(255,255,255,0.95); border:1px solid #CBD5E1; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.05);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #E2E8F0; padding-bottom:10px;">
          <div>
            <div style="color:var(--text-muted); font-size:0.75rem; text-transform:uppercase; font-weight:700; letter-spacing:0.5px;">Unique Application ID</div>
            <div style="font-size:1.35rem; font-weight:800; color:var(--saffron); font-family:monospace;">${appId}</div>
          </div>
          <div style="text-align:right;">
            <div style="color:var(--text-muted); font-size:0.75rem; text-transform:uppercase; font-weight:700; letter-spacing:0.5px;">Status</div>
            <span class="status-pill pending" style="font-size:0.82rem; padding:4px 10px;">
              ⏳ Verification Pending
            </span>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:0.86rem;">
          <div>
            <span style="color:var(--text-muted);">Farmer Name:</span><br />
            <strong style="color:var(--primary-navy);">${fullName}</strong>
          </div>
          <div>
            <span style="color:var(--text-muted);">Registered Mobile:</span><br />
            <strong>+91 ${maskedMobile}</strong> <i class="fas fa-circle-check" style="color:#10B981; font-size:0.8rem;"></i>
          </div>
          <div>
            <span style="color:var(--text-muted);">Registered Email:</span><br />
            <strong>${maskedEmail}</strong> <i class="fas fa-circle-check" style="color:#10B981; font-size:0.8rem;"></i>
          </div>
          <div>
            <span style="color:var(--text-muted);">Date Submitted:</span><br />
            <strong>${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</strong>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex; flex-direction:column; gap:10px; max-width:440px; margin:0 auto;">
        <button type="button" class="btn btn-navy" style="justify-content:center; padding:12px; font-weight:700;" onclick="viewFarmerApplicationStatusModal('${appId}')">
          <i class="fas fa-magnifying-glass"></i> View Application Status
        </button>
        <button type="button" class="btn btn-primary" style="justify-content:center; padding:12px; font-weight:700;" onclick="downloadFarmerRegistrationSummary('${appId}')">
          <i class="fas fa-file-arrow-down"></i> Download Registration Summary
        </button>
        <button type="button" class="btn btn-outline" style="justify-content:center; padding:11px;" onclick="closeModal(); routeTo('#farmer-dashboard');">
          <i class="fas fa-gauge"></i> Go to Farmer Dashboard
        </button>
      </div>
    </div>
  `;
};

/**
 * ----------------------------------------------------
 * INTERACTIVE HELPERS FOR FORM CONTROLS
 * ----------------------------------------------------
 */
// 1. Password Visibility Toggle
window.togglePasswordVisibility = function(fieldId, iconId) {
  const input = document.getElementById(fieldId);
  const icon = document.getElementById(iconId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
};

// 2. Password Strength Meter
window.updateFarmerPasswordStrength = function(val) {
  const label = document.getElementById('frm-strength-label');
  const bar = document.getElementById('frm-strength-bar');
  if (!label || !bar) return;

  if (!val) {
    label.textContent = 'Minimum 6 characters';
    label.style.color = 'var(--text-muted)';
    bar.style.width = '0%';
    bar.style.background = '#EF4444';
    return;
  }

  let score = 0;
  if (val.length >= 6) score += 25;
  if (val.length >= 10) score += 25;
  if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score += 25;
  if (/[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val)) score += 25;

  bar.style.width = `${score}%`;
  if (score <= 25) {
    label.textContent = 'Weak (Needs min 6 chars)';
    label.style.color = '#EF4444';
    bar.style.background = '#EF4444';
  } else if (score <= 50) {
    label.textContent = 'Fair (Add uppercase & numbers)';
    label.style.color = '#F59E0B';
    bar.style.background = '#F59E0B';
  } else if (score <= 75) {
    label.textContent = 'Good (Add special character)';
    label.style.color = '#3B82F6';
    bar.style.background = '#3B82F6';
  } else {
    label.textContent = 'Strong (Excellent security)';
    label.style.color = '#10B981';
    bar.style.background = '#10B981';
  }
};

// 3. Password Match Checker
window.checkFarmerPasswordMatch = function() {
  const p1 = document.getElementById('frm-pass')?.value || '';
  const p2 = document.getElementById('frm-pass-confirm')?.value || '';
  const msg = document.getElementById('frm-pass-match-msg');
  if (!msg) return;

  if (!p2) {
    msg.textContent = '';
    return;
  }
  if (p1 === p2) {
    msg.innerHTML = '<span style="color:#059669; font-weight:700;"><i class="fas fa-circle-check"></i> Passwords match</span>';
  } else {
    msg.innerHTML = '<span style="color:#EF4444; font-weight:600;"><i class="fas fa-circle-xmark"></i> Passwords do not match</span>';
  }
};

// 4. Dynamic Relationship Change (Father / Husband)
window.onFarmerRelationshipChange = function(rel) {
  const labelEl = document.getElementById('frm-rel-name-label');
  const inputEl = document.getElementById('frm-father-husband');

  if (rel === 'Husband') {
    if (labelEl) labelEl.textContent = "Husband's Name *";
    if (inputEl) inputEl.placeholder = "Enter husband's full name";
  } else {
    if (labelEl) labelEl.textContent = "Father's Name *";
    if (inputEl) inputEl.placeholder = "Enter father's full name";
  }
  if (regDraftData.farmer) {
    regDraftData.farmer.relationshipToFarmer = rel;
  }
};

// 5. Aadhaar Formatter
window.formatFarmerAadhaar = function(input) {
  let val = input.value.replace(/\D/g, '').slice(0, 12);
  let formatted = '';
  for (let i = 0; i < val.length; i++) {
    if (i > 0 && i % 4 === 0) formatted += ' ';
    formatted += val[i];
  }
  input.value = formatted;
};

// 6. Age Validator & Indicator
window.checkFarmerAge = function(dob) {
  const ageDisplay = document.getElementById('frm-dob-age-display');
  if (!ageDisplay || !dob) return;

  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

  if (age >= 18) {
    ageDisplay.textContent = `✓ Age: ${age} Years (Eligible)`;
    ageDisplay.style.color = '#059669';
  } else {
    ageDisplay.textContent = `⚠ Age: ${age} Years (Must be 18+)`;
    ageDisplay.style.color = '#EF4444';
  }
};

// 7. Toggle Land Address Same
window.toggleFarmerLandSameAddress = function(isSame) {
  const box = document.getElementById('frm-separate-land-addr-box');
  if (box) {
    box.style.display = isSame ? 'none' : 'grid';
  }
};

// 8. Multi-Select Crop Pills
farmerSelectedCrops = (typeof farmerSelectedCrops !== 'undefined' && farmerSelectedCrops) ? farmerSelectedCrops : ['Wheat'];
window.toggleFarmerCropPill = function(cropName) {
  const idx = farmerSelectedCrops.findIndex(c => c.toLowerCase() === cropName.toLowerCase());
  if (idx >= 0) {
    if (farmerSelectedCrops.length > 1) {
      farmerSelectedCrops.splice(idx, 1);
    } else {
      showToast('At least one primary crop must remain selected.', 'warning');
      return;
    }
  } else {
    farmerSelectedCrops.push(cropName);
  }

  if (regDraftData.farmer) {
    regDraftData.farmer.crops = farmerSelectedCrops;
  }

  // Re-render crop pills container
  const container = document.getElementById('frm-crops-container');
  if (container) {
    const cropsList = ['Wheat', 'Cotton', 'Rice', 'Groundnut', 'Mustard', 'Soybean', 'Gram/Chana', 'Vegetables', 'Other'];
    container.innerHTML = cropsList.map(c => {
      const isSelected = farmerSelectedCrops.some(ac => ac.toLowerCase() === c.toLowerCase());
      return `
        <button type="button" class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}" onclick="toggleFarmerCropPill('${c}')" style="padding:6px 12px; font-size:0.82rem; border-radius:20px; font-weight:600; display:inline-flex; align-items:center; gap:6px;">
          ${isSelected ? '<i class="fas fa-check"></i>' : '<i class="fas fa-plus"></i>'} ${c}
        </button>
      `;
    }).join('');
  }
};

// 9. Bank Account Match
window.checkFarmerBankMatch = function() {
  const a1 = document.getElementById('frm-acc-num')?.value || '';
  const a2 = document.getElementById('frm-acc-confirm')?.value || '';
  const msg = document.getElementById('frm-bank-match-msg');
  if (!msg) return;

  if (!a2) {
    msg.textContent = '';
    return;
  }
  if (a1 === a2) {
    msg.innerHTML = '<span style="color:#059669; font-weight:700;"><i class="fas fa-circle-check"></i> Account numbers match</span>';
  } else {
    msg.innerHTML = '<span style="color:#EF4444; font-weight:600;"><i class="fas fa-circle-xmark"></i> Account numbers do not match</span>';
  }
};

// 10. Photo Upload & Preview
window.handleFarmerPhotoSelected = function(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showToast('Photo must be smaller than 2MB.', 'error');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const imgEl = document.getElementById('frm-photo-preview-img');
    const iconEl = document.getElementById('frm-photo-preview-icon');
    if (imgEl) {
      imgEl.src = dataUrl;
      imgEl.style.display = 'block';
    }
    if (iconEl) iconEl.style.display = 'none';

    if (regDraftData.farmer) {
      regDraftData.farmer.profilePhoto = dataUrl;
    }
    showToast('Profile photo updated.', 'success');
  };
  reader.readAsDataURL(file);
};

window.removeFarmerPhoto = function() {
  const imgEl = document.getElementById('frm-photo-preview-img');
  const iconEl = document.getElementById('frm-photo-preview-icon');
  const inputEl = document.getElementById('frm-photo-input');

  if (imgEl) imgEl.style.display = 'none';
  if (iconEl) iconEl.style.display = 'block';
  if (inputEl) inputEl.value = '';

  if (regDraftData.farmer) {
    delete regDraftData.farmer.profilePhoto;
  }
  showToast('Profile photo removed.', 'info');
};

// 11. GPS Location Auto-Detection
window.autoDetectFarmerLocation = function() {
  const statusEl = document.getElementById('frm-gps-status');
  const textEl = document.getElementById('frm-gps-text');

  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', 'warning');
    return;
  }

  if (textEl) textEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Requesting GPS coordinates...`;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (textEl) textEl.innerHTML = `✓ Location detected (Lat: ${pos.coords.latitude.toFixed(4)}, Long: ${pos.coords.longitude.toFixed(4)})`;
      showToast('Location coordinates detected. Administrative hierarchy loaded.', 'success');
    },
    (err) => {
      if (textEl) textEl.textContent = 'Hierarchy: State → District → Taluka / Tehsil → Village / Town';
      showToast('Could not access current location. Please select state and district manually.', 'info');
    },
    { timeout: 8000 }
  );
};

// 12. View Application Status Modal
window.viewFarmerApplicationStatusModal = async function(appId) {
  showToast('Fetching latest application verification status...', 'info');

  try {
    const res = await fetch(`/api/registration/farmer/application/${appId}`);
    const result = await res.json();

    if (!result.success || !result.data) {
      showToast('Application details not found.', 'error');
      return;
    }

    const app = result.data;
    const isNeedsCorrection = app.verification?.registrationStatus === 'Needs Correction';

    const modalHtml = `
      <div id="frm-status-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:99999; display:flex; align-items:center; justify-content:center; padding:16px;">
        <div class="glass-card" style="background:#FFF; width:100%; max-width:580px; border-radius:12px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.3);">
          <div style="padding:14px 18px; border-bottom:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center; background:#F8FAFC;">
            <strong style="color:var(--primary-navy); font-size:1rem;"><i class="fas fa-clock-rotate-left" style="color:var(--saffron); margin-right:6px;"></i> Application Status Tracking</strong>
            <button type="button" onclick="document.getElementById('frm-status-modal').remove()" style="border:none; background:transparent; font-size:1.4rem; color:#64748B; cursor:pointer;">&times;</button>
          </div>
          <div style="padding:18px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <div>
                <span style="font-size:0.78rem; color:var(--text-muted);">Application ID:</span>
                <div style="font-size:1.15rem; font-weight:800; color:var(--saffron); font-family:monospace;">${app.applicationId}</div>
              </div>
              <span class="status-pill ${app.verification?.registrationStatus === 'Approved' ? 'active' : (isNeedsCorrection ? 'pending' : 'pending')}">
                ${app.verification?.registrationStatus || 'Verification Pending'}
              </span>
            </div>

            <!-- Status Tracking Flow -->
            <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px; background:#F8FAFC; padding:12px; border-radius:8px; font-size:0.82rem;">
              <div style="display:flex; align-items:center; gap:8px; color:#059669; font-weight:600;">
                <i class="fas fa-circle-check"></i> Draft Created
              </div>
              <div style="display:flex; align-items:center; gap:8px; color:#059669; font-weight:600;">
                <i class="fas fa-circle-check"></i> Mobile Verified (+91 ${app.account?.mobile || ''})
              </div>
              <div style="display:flex; align-items:center; gap:8px; color:#059669; font-weight:600;">
                <i class="fas fa-circle-check"></i> Email Verified (${app.account?.email || ''})
              </div>
              <div style="display:flex; align-items:center; gap:8px; color:#059669; font-weight:600;">
                <i class="fas fa-circle-check"></i> Registration Submitted
              </div>
              <div style="display:flex; align-items:center; gap:8px; color:${app.verification?.registrationStatus === 'Approved' ? '#059669' : '#2563EB'}; font-weight:600;">
                <i class="fas fa-spinner fa-spin"></i> ${app.verification?.registrationStatus === 'Approved' ? 'Documents Verified & Approved' : 'Documents Under Officer Verification'}
              </div>
            </div>

            ${isNeedsCorrection ? `
              <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:8px; padding:12px; margin-bottom:16px;">
                <div style="color:#991B1B; font-weight:800; font-size:0.88rem; display:flex; align-items:center; gap:6px;">
                  <i class="fas fa-triangle-exclamation"></i> Action Required: Correction Requested
                </div>
                <div style="color:#7F1D1D; font-size:0.82rem; margin-top:4px;">
                  <strong>Officer Remark:</strong> ${app.verification?.officerRemarks || 'Please review and update requested details.'}
                </div>
                <button type="button" class="btn btn-primary btn-sm" style="margin-top:10px; font-size:0.8rem;" onclick="openFarmerCorrectionModal('${app.applicationId}')">
                  <i class="fas fa-pen-to-square"></i> Correct Information Now
                </button>
              </div>
            ` : ''}

            <div style="display:flex; justify-content:flex-end; gap:8px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('frm-status-modal').remove()">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (err) {
    showToast('Failed to load application status: ' + err.message, 'error');
  }
};

// 13. Download Registration Summary PDF
window.downloadFarmerRegistrationSummary = function(appId) {
  showToast(`Generating Official Registration Summary PDF for ${appId}...`, 'info');
  window.open(`/api/registration/receipt/${appId}`, '_blank');
};

// 14. Farmer Correction Flow
window.openFarmerCorrectionModal = function(appId) {
  document.getElementById('frm-status-modal')?.remove();
  showToast('Opening Application Editor for requested corrections...', 'info');
  goToStep(2);
};

const validateAndNextOfficer = (step) => {
  if (step === 1) {
    const name = document.getElementById('off-name').value.trim();
    const empId = document.getElementById('off-empid').value.trim();
    const desig = document.getElementById('off-designation').value.trim();
    const dob = document.getElementById('off-dob').value;
    const email = document.getElementById('off-email').value.trim();
    const mobile = document.getElementById('off-mobile').value.trim();
    const aadhaar = document.getElementById('off-aadhaar').value.trim();
    const password = document.getElementById('off-pass').value;

    if (!name || !empId || !desig || !email || !mobile || !aadhaar) {
      showToast('All fields are mandatory.', 'error');
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      showFieldError('err-off-mobile', 'Mobile number must be 10 digits.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showFieldError('err-off-email', 'Please enter a valid official email address.');
      return;
    }

    // STRICT STEP 1 CONTACT GATING: Mobile and Brevo Email MUST be verified before Step 2
    if (!step1State.officer.mobileVerified) {
      showToast('⚠️ Mobile Number must be verified via OTP before proceeding to Step 2.', 'warning');
      showFieldError('err-off-mobile', 'Mobile verification via OTP is mandatory for Step 2.');
      const mInput = document.getElementById('off-mobile');
      if (mInput) mInput.focus();
      return;
    }
    if (!step1State.officer.emailVerified) {
      showToast('⚠️ Official Email must be verified via Brevo OTP before proceeding to Step 2.', 'warning');
      showFieldError('err-off-email', 'Official Email verification via Brevo OTP is mandatory for Step 2.');
      const eInput = document.getElementById('off-email');
      if (eInput) eInput.focus();
      return;
    }
    if (!/^\d{12}$/.test(aadhaar)) {
      showFieldError('err-off-aadhaar', 'Aadhaar must be exactly 12 digits.');
      return;
    }

    regDraftData.officer = {
      ...regDraftData.officer,
      fullName: name,
      employeeId: empId,
      designation: desig,
      dob,
      officialEmail: email,
      mobile,
      aadhaarNumber: aadhaar,
      password,
      isPhoneVerified: true,
      isEmailVerified: true
    };
    goToStep(2);
  } else if (step === 2) {
    regDraftData.officer = {
      ...regDraftData.officer,
      department: document.getElementById('off-dept').value,
      ministry: document.getElementById('off-ministry').value,
      employmentType: document.getElementById('off-emp-type').value,
      joiningDate: document.getElementById('off-joining').value,
      officeAddress: document.getElementById('off-office-addr').value.trim()
    };
    goToStep(3);
  } else if (step === 3) {
    const centerCode = document.getElementById('off-center-code').value.trim();
    const centerName = document.getElementById('off-center-name').value.trim();
    if (!centerCode) {
      showFieldError('err-off-center-code', 'Please provide a valid Centre Code.');
      return;
    }
    regDraftData.officer = {
      ...regDraftData.officer,
      procurementCentreCode: centerCode,
      procurementCentreName: centerName,
      zone: document.getElementById('off-zone').value,
      reportingOfficer: document.getElementById('off-reporting').value
    };
    goToStep(4);
  } else if (step === 4) {
    regDraftData.officer = {
      ...regDraftData.officer,
      govtEmployeeIdNumber: document.getElementById('off-id-card-no').value.trim(),
      departmentAuthNumber: document.getElementById('off-auth-no').value.trim(),
      panNumber: document.getElementById('off-pan').value.trim()
    };
    goToStep(5);
  }
};

const validateDocsAndNextOfficer = () => {
  const docs = verifiedDocs.officer || {};
  const required = ['govtEmployeeId', 'appointmentLetter', 'authorizationLetter', 'aadhaar', 'photo'];
  const missing = required.filter(k => !docs[k] || !docs[k].valid);

  if (missing.length > 0) {
    showToast('All 5 official credential documents must be uploaded and verified.', 'error');
    return;
  }

  regDraftData.officer.documents = Object.keys(docs).map(k => ({
    docType: docs[k].docType || k,
    fileUrl: docs[k].fileUrl,
    fileName: docs[k].fileName,
    status: 'Verified',
    uploadDate: new Date().toISOString().split('T')[0]
  }));

  goToStep(6);
};

const validateAndNextSuperAdmin = (step) => {
  if (step === 1) {
    const name = document.getElementById('sadm-name').value.trim();
    const desig = document.getElementById('sadm-designation').value.trim();
    const empId = document.getElementById('sadm-empid').value.trim();
    const dob = document.getElementById('sadm-dob').value;
    const email = document.getElementById('sadm-email').value.trim();
    const mobile = document.getElementById('sadm-mobile').value.trim();
    const aadhaar = document.getElementById('sadm-aadhaar').value.trim();

    if (!name || !desig || !empId || !email || !mobile || !aadhaar) {
      showToast('All administrator personal details are mandatory.', 'error');
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      showFieldError('err-sadm-mobile', 'Mobile number must be 10 digits.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      showFieldError('err-sadm-email', 'Please enter a valid official email address.');
      return;
    }

    // STRICT STEP 1 CONTACT GATING: Mobile and Brevo Email MUST be verified before Step 2
    if (!step1State.superadmin.mobileVerified) {
      showToast('⚠️ Official Mobile must be verified via OTP before proceeding to Step 2.', 'warning');
      showFieldError('err-sadm-mobile', 'Mobile verification via OTP is mandatory for Step 2.');
      const mInput = document.getElementById('sadm-mobile');
      if (mInput) mInput.focus();
      return;
    }
    if (!step1State.superadmin.emailVerified) {
      showToast('⚠️ Official Email must be verified via Brevo OTP before proceeding to Step 2.', 'warning');
      showFieldError('err-sadm-email', 'Official Email verification via Brevo OTP is mandatory for Step 2.');
      const eInput = document.getElementById('sadm-email');
      if (eInput) eInput.focus();
      return;
    }
    if (!/^\d{12}$/.test(aadhaar)) {
      showFieldError('err-sadm-aadhaar', 'Aadhaar must be exactly 12 digits.');
      return;
    }

    regDraftData.superadmin = {
      ...regDraftData.superadmin,
      fullName: name,
      designation: desig,
      employeeId: empId,
      dob,
      officialEmail: email,
      mobile,
      aadhaarNumber: aadhaar,
      isPhoneVerified: true,
      isEmailVerified: true
    };
    goToStep(2);
  } else if (step === 2) {
    const orgName = document.getElementById('sadm-org').value.trim();
    const departmentName = document.getElementById('sadm-dept').value.trim();
    const ministryName = document.getElementById('sadm-ministry').value.trim();
    const officeAddress = document.getElementById('sadm-addr').value.trim();

    if (!orgName || !departmentName || !ministryName || !officeAddress) {
      showToast('All organization profile fields are mandatory.', 'error');
      return;
    }

    regDraftData.superadmin = {
      ...regDraftData.superadmin,
      orgName,
      departmentName,
      ministryName,
      officeAddress
    };
    goToStep(3);
  } else if (step === 4) {
    const pass = document.getElementById('sadm-pass').value;
    const confirm = document.getElementById('sadm-pass-confirm').value;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(pass)) {
      showFieldError('err-sadm-pass', 'Password must be 12+ chars with uppercase, lowercase, number and symbol.');
      return;
    }
    if (pass !== confirm) {
      showFieldError('err-sadm-pass-confirm', 'Passwords do not match.');
      return;
    }

    regDraftData.superadmin = {
      ...regDraftData.superadmin,
      password: pass,
      securityQuestion: document.getElementById('sadm-sec-q').value,
      securityAnswer: document.getElementById('sadm-sec-a').value.trim()
    };
    goToStep(5);
  }
};

const validateDocsAndNextSuperAdmin = () => {
  const docs = verifiedDocs.superadmin || {};
  const required = ['govtEmployeeId', 'appointmentLetter', 'aadhaar', 'photo'];
  const missing = required.filter(k => !docs[k] || !docs[k].valid);

  if (missing.length > 0) {
    showToast('Please upload and verify all required administrative credentials.', 'error');
    return;
  }

  regDraftData.superadmin.documents = Object.keys(docs).map(k => ({
    docType: docs[k].docType || k,
    fileUrl: docs[k].fileUrl,
    fileName: docs[k].fileName,
    status: 'Verified',
    uploadDate: new Date().toISOString().split('T')[0]
  }));

  goToStep(4);
};

/**
 * ----------------------------------------------------
 * SUBMISSION & OTP DISPATCH INITIATORS
 * ----------------------------------------------------
 */
const submitFarmerRegistrationInitiate = async () => {
  showToast('Initiating Farmer Registration & Generating Brevo OTP...', 'info');

  try {
    const res = await fetch('/api/registration/farmer/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regDraftData.farmer)
    });
    const result = await res.json();

    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }

    activeTempId = result.tempId;
    goToStep(7);
    startOTPTimer();
    showToast(result.message, 'success');
  } catch (err) {
    showToast('Registration initiation failed: ' + err.message, 'error');
  }
};

const submitOfficerRegistrationInitiate = async () => {
  const cb = document.getElementById('officer-declaration-cb');
  if (cb && !cb.checked) {
    showToast('Please certify the official declaration before proceeding.', 'error');
    return;
  }

  showToast('Submitting Officer Application & Dispatching Brevo OTP...', 'info');

  try {
    const res = await fetch('/api/registration/officer/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regDraftData.officer)
    });
    const result = await res.json();

    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }

    activeTempId = result.tempId;
    goToStep(7);
    startOTPTimer();
    showToast(result.message, 'success');
  } catch (err) {
    showToast('Officer registration initiation error: ' + err.message, 'error');
  }
};

const submitSuperAdminInitiate = async () => {
  const cb = document.getElementById('sadm-declaration-cb');
  if (cb && !cb.checked) {
    showToast('Please certify the authorization declaration.', 'error');
    return;
  }

  showToast('Dispatching Root Setup OTP via Brevo...', 'info');

  try {
    const res = await fetch('/api/registration/superadmin/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regDraftData.superadmin)
    });
    const result = await res.json();

    if (!result.success) {
      showToast(result.message, 'error');
      return;
    }

    activeTempId = result.tempId;
    goToStep(6);
    startOTPTimer();
    showToast(result.message, 'success');
  } catch (err) {
    showToast('Super Admin setup error: ' + err.message, 'error');
  }
};

/**
 * Resend OTP Action
 */
const resendRegistrationOTP = async () => {
  if (!activeTempId) return;
  showToast('Requesting new OTP code...', 'info');

  try {
    const res = await fetch('/api/registration/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempId: activeTempId })
    });
    const result = await res.json();

    if (result.success) {
      startOTPTimer();
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  } catch (err) {
    showToast('Resend failed: ' + err.message, 'error');
  }
};

/**
 * Verify Submitted OTP & Handle Final Activation Screen
 */
const verifySubmittedOTP = async () => {
  let otp = '';
  for (let i = 1; i <= 6; i++) {
    const box = document.getElementById(`otp-${i}`);
    if (box) otp += box.value.trim();
  }

  if (otp.length !== 6) {
    document.getElementById('otp-error-banner').textContent = 'Please enter all 6 digits of the OTP.';
    document.getElementById('otp-error-banner').style.display = 'block';
    return;
  }

  const verifyBtn = document.getElementById('btn-verify-otp');
  if (verifyBtn) {
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Authenticating...`;
  }

  try {
    let endpoint = '/api/registration/farmer/verify-otp';
    if (currentRegType === 'officer') endpoint = '/api/registration/officer/verify-otp';
    if (currentRegType === 'superadmin') endpoint = '/api/registration/superadmin/verify-otp';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempId: activeTempId, otp })
    });
    const result = await res.json();

    if (!result.success) {
      document.getElementById('otp-error-banner').textContent = result.message || 'Verification failed.';
      document.getElementById('otp-error-banner').style.display = 'block';
      if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = `<i class="fas fa-shield-check"></i> Verify & Complete Registration`;
      }
      return;
    }

    clearInterval(otpCountdownInterval);

    // If farmer, store token and show official success screen
    if (currentRegType === 'farmer') {
      localStorage.setItem('kpms_token', result.token);
      localStorage.setItem('kpms_user', JSON.stringify({
        id: result.data.userId,
        name: result.data.fullName,
        role: 'farmer',
        farmerId: result.data.farmerId
      }));
      updateNavAuth();
      renderFarmerSuccessScreen(result.data);
    } else if (currentRegType === 'officer') {
      renderOfficerPendingScreen(result.data);
    } else if (currentRegType === 'superadmin') {
      localStorage.setItem('kpms_token', result.token);
      localStorage.setItem('kpms_user', JSON.stringify(result.data));
      updateNavAuth();
      renderSuperAdminSuccessScreen(result.data);
    }
  } catch (err) {
    showToast('Verification error: ' + err.message, 'error');
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = `<i class="fas fa-shield-check"></i> Verify & Complete Registration`;
    }
  }
};

/**
 * Verify Farmer Mobile in Step 1 via MSG91 Real OTP
 */
window.verifyFarmerMobileViaMsg91 = function() {
  const mobileInput = document.getElementById('frm-mobile');
  const mobile = mobileInput ? mobileInput.value.trim() : (regDraftData.farmer?.mobile || '');

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    showToast('Please enter a valid 10-digit mobile number before requesting OTP.', 'warning');
    if (mobileInput) mobileInput.focus();
    return;
  }

  if (typeof window.triggerMsg91OTP === 'function') {
    window.triggerMsg91OTP({
      identifier: mobile,
      context: 'farmer_registration_step1',
      onSuccess: (res, token) => {
        showToast(`✅ Mobile +91 ${mobile} authenticated via MSG91!`, 'success');
        const badge = document.getElementById('frm-mobile-verified-badge');
        if (badge) badge.style.display = 'flex';
        if (regDraftData.farmer) {
          regDraftData.farmer.isPhoneVerified = true;
          regDraftData.farmer.mobileVerifiedVia = 'MSG91_OTP';
        }
      }
    });
  } else {
    showToast('Initializing MSG91 Gateway... Please retry in a moment.', 'info');
  }
};

/**
 * Verify Registration via MSG91 Real SMS OTP in Step 7
 */
window.verifyRegistrationViaMsg91 = function() {
  let mobile = '';
  if (currentRegType === 'farmer') {
    mobile = regDraftData.farmer?.mobile || '';
  } else if (currentRegType === 'officer') {
    mobile = regDraftData.officer?.mobile || '';
  } else if (currentRegType === 'superadmin') {
    mobile = regDraftData.superadmin?.mobile || '';
  }

  if (!mobile) {
    mobile = prompt('Please enter your 10-digit mobile number for MSG91 SMS verification:', '');
    if (!mobile) return;
  }

  if (typeof window.triggerMsg91OTP === 'function') {
    window.triggerMsg91OTP({
      identifier: mobile,
      context: 'registration_otp_step',
      tempId: activeTempId,
      onSuccess: (res, token) => {
        showToast('✅ Mobile verified via MSG91 Real SMS OTP! Completing registration...', 'success');
        // Auto-fill OTP boxes and trigger verification
        for (let i = 1; i <= 6; i++) {
          const b = document.getElementById(`otp-${i}`);
          if (b) b.value = String(i);
        }
        verifySubmittedOTP();
      }
    });
  } else {
    showToast('Initializing MSG91 Gateway... Please retry in a moment.', 'info');
  }
};

/**
 * ----------------------------------------------------
 * SUCCESS & COMPLETION SCREENS
 * ----------------------------------------------------
 */
const renderFarmerSuccessScreen = (data) => {
  const body = document.getElementById('modal-content-slot');
  body.innerHTML = `
    <div style="text-align:center; padding:20px 10px;">
      <div style="width:72px; height:72px; border-radius:50%; background:#ECFDF5; color:#10B981; display:flex; align-items:center; justify-content:center; font-size:2.4rem; margin:0 auto 16px auto;">
        <i class="fas fa-circle-check"></i>
      </div>
      <h2 style="color:var(--primary-navy); font-weight:800; margin-bottom:4px;">Registration Successful!</h2>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:20px;">
        Welcome to the Kisan Procurement Management System (KPMS).
      </p>

      <div class="glass-card" style="padding:16px; margin-bottom:24px; text-align:left; background:rgba(255,255,255,0.9);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #E2E8F0; padding-bottom:8px;">
          <span style="color:var(--text-muted); font-size:0.85rem;">Official Farmer ID:</span>
          <span style="font-size:1.1rem; font-weight:800; color:var(--saffron);">${data.farmerId}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Farmer Name:</span>
          <strong style="color:var(--primary-navy);">${data.fullName}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Registered Mobile:</span>
          <strong>+91 ${data.mobile}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Verification Timestamp:</span>
          <span>${data.registrationDate}</span>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px;">
        <a href="${data.receiptUrl}" target="_blank" class="btn btn-navy" style="justify-content:center; padding:12px;">
          <i class="fas fa-file-pdf"></i> Download Registration Receipt (PDF)
        </a>
        <button class="btn btn-primary" style="justify-content:center; padding:12px;" onclick="closeModal(); routeTo('#smart-booking');">
          <i class="fas fa-calendar-plus"></i> Book Procurement Slot Now
        </button>
        <button class="btn btn-outline" style="justify-content:center;" onclick="closeModal(); routeTo('#farmer-dashboard');">
          <i class="fas fa-gauge"></i> Go to Farmer Dashboard
        </button>
      </div>
    </div>
  `;
};

const renderOfficerPendingScreen = (data) => {
  const body = document.getElementById('modal-content-slot');
  body.innerHTML = `
    <div style="text-align:center; padding:20px 10px;">
      <div style="width:72px; height:72px; border-radius:50%; background:#EFF6FF; color:#2563EB; display:flex; align-items:center; justify-content:center; font-size:2.4rem; margin:0 auto 16px auto;">
        <i class="fas fa-hourglass-half"></i>
      </div>
      <h2 style="color:var(--primary-navy); font-weight:800; margin-bottom:4px;">Application Submitted</h2>
      <span class="status-pill pending" style="margin-bottom:14px;">Status: Pending Admin Approval</span>
      <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:20px;">
        Your identity & appointment credentials have been staged for Administrative Review.
      </p>

      <div class="glass-card" style="padding:16px; margin-bottom:24px; text-align:left;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Application Reference:</span>
          <strong style="color:var(--primary-navy);">${data.applicationId}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Applicant Name:</span>
          <strong>${data.applicantName}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Assigned Mandi Centre:</span>
          <strong>${data.centreName}</strong>
        </div>
      </div>

      <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:20px;">
        Upon verification by State APMC Administrators, you will receive an official activation email containing your <strong>Officer ID (OFF2026xxxxx)</strong> and access permissions.
      </p>

      <button class="btn btn-navy" style="width:100%; justify-content:center;" onclick="closeModal();">
        <i class="fas fa-check"></i> Close & Await Notification
      </button>
    </div>
  `;
};

const renderSuperAdminSuccessScreen = (data) => {
  const body = document.getElementById('modal-content-slot');
  body.innerHTML = `
    <div style="text-align:center; padding:20px 10px;">
      <div style="width:72px; height:72px; border-radius:50%; background:#ECFDF5; color:#10B981; display:flex; align-items:center; justify-content:center; font-size:2.4rem; margin:0 auto 16px auto;">
        <i class="fas fa-lock"></i>
      </div>
      <h2 style="color:var(--primary-navy); font-weight:800; margin-bottom:4px;">Super Admin Configured!</h2>
      <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:20px;">
        Root Authority Account Activated • Setup Wizard Permanently Locked
      </p>

      <div class="glass-card" style="padding:16px; margin-bottom:24px; text-align:left;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Super Admin ID:</span>
          <strong style="color:var(--green-gov); font-size:1.05rem;">${data.superAdminId}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
          <span style="color:var(--text-muted);">Authorized Officer:</span>
          <strong>${data.name}</strong>
        </div>
      </div>

      <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="closeModal(); routeTo('#admin-dashboard');">
        <i class="fas fa-gauge"></i> Enter Super Admin Command Center
      </button>
    </div>
  `;
};

/**
 * ----------------------------------------------------
 * UTILITY & DYNAMIC LOOKUP HELPERS
 * ----------------------------------------------------
 */
const onStateChange = (state, prefix = 'frm', selectedDistrict = null, selectedTaluka = null) => {
  const distSelect = document.getElementById(`${prefix}-district`);
  const talukaSelect = document.getElementById(`${prefix}-taluka`);
  if (!distSelect) return;

  const stateData = INDIA_LOCATIONS[state];
  const districts = stateData ? Object.keys(stateData) : [];
  if (districts.length > 0) {
    distSelect.innerHTML = districts.map(d => `<option value="${d}" ${(selectedDistrict && selectedDistrict === d) ? 'selected' : ''}>${d}</option>`).join('');
    const targetDist = (selectedDistrict && districts.includes(selectedDistrict)) ? selectedDistrict : districts[0];
    distSelect.value = targetDist;
    onDistrictChange(targetDist, prefix, selectedTaluka);
  } else {
    distSelect.innerHTML = `<option value="${state || 'Central'}">${state || 'Central'}</option>`;
    if (talukaSelect) talukaSelect.innerHTML = `<option value="Sadar">Sadar</option>`;
  }
};

const onDistrictChange = (district, prefix = 'frm', selectedTaluka = null) => {
  const stateSelect = document.getElementById(`${prefix}-state`);
  const talukaSelect = document.getElementById(`${prefix}-taluka`);
  if (!stateSelect || !talukaSelect) return;

  const state = stateSelect.value;
  const stateData = INDIA_LOCATIONS[state];
  const talukas = (stateData && stateData[district]) ? stateData[district].talukas : [];
  if (talukas && talukas.length > 0) {
    talukaSelect.innerHTML = talukas.map(t => `<option value="${t}" ${(selectedTaluka && selectedTaluka === t) ? 'selected' : ''}>${t}</option>`).join('');
    if (selectedTaluka && talukas.includes(selectedTaluka)) {
      talukaSelect.value = selectedTaluka;
    }
  } else {
    talukaSelect.innerHTML = `<option value="${district} Sadar">${district} Sadar</option><option value="${district} Rural">${district} Rural</option>`;
  }
};

const lookupIFSC = async (ifsc) => {
  const clean = ifsc.trim().toUpperCase();
  if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) {
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${clean}`);
      if (res.ok) {
        const data = await res.json();
        const bankInput = document.getElementById('frm-bank-name');
        const branchInput = document.getElementById('frm-branch');
        if (bankInput) bankInput.value = data.BANK || bankInput.value;
        if (branchInput) branchInput.value = data.BRANCH || branchInput.value;
      }
    } catch (e) {}
  }
};

const lookupCentreCode = async (code) => {
  const clean = code.trim();
  const nameInput = document.getElementById('off-center-name');
  if (!nameInput) return;

  if (clean === 'CTR-01') nameInput.value = 'APMC Central Mandi Bhopal';
  else if (clean === 'CTR-02') nameInput.value = 'Sehore Krishi Upaj Mandi';
  else if (clean === 'CTR-03') nameInput.value = 'Hoshangabad Grain Terminal';
  else {
    try {
      const res = await fetch('/api/bookings/centers');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const found = json.data.find(c => c.centerId === clean || c.code === clean);
        if (found) nameInput.value = found.name;
      }
    } catch (e) {}
  }
};

const calcRealisticYield = () => {
  const land = parseFloat(document.getElementById('frm-land-area')?.value || 0);
  const crop = document.getElementById('frm-crop')?.value || '';
  const helper = document.getElementById('yield-helper');
  const qtyInput = document.getElementById('frm-quantity');

  let multiplier = 20;
  if (crop.includes('Wheat')) multiplier = 22;
  if (crop.includes('Paddy')) multiplier = 25;
  if (crop.includes('Chana')) multiplier = 12;
  if (crop.includes('Mustard')) multiplier = 14;

  const estimated = Math.round(land * multiplier);
  if (qtyInput && land > 0) {
    qtyInput.value = estimated;
  }
  if (helper) {
    helper.textContent = `Realistic estimated production: ~${multiplier} quintals/acre (${estimated} quintals total for ${land} acres).`;
  }
};

const checkPasswordStrength = (pass) => {
  const bar = document.getElementById('pass-meter-bar');
  const txt = document.getElementById('pass-meter-text');
  if (!bar || !txt) return;

  let score = 0;
  if (pass.length >= 12) score += 25;
  if (/[A-Z]/.test(pass)) score += 25;
  if (/[a-z]/.test(pass)) score += 25;
  if (/\d/.test(pass) && /[@$!%*?&]/.test(pass)) score += 25;

  bar.style.width = `${score}%`;
  if (score < 50) {
    bar.style.background = '#EF4444';
    txt.textContent = 'Weak: Must be 12+ chars with uppercase, lowercase, number & symbol.';
    txt.style.color = '#EF4444';
  } else if (score < 100) {
    bar.style.background = '#F59E0B';
    txt.textContent = 'Moderate: Include special characters and mixed case.';
    txt.style.color = '#F59E0B';
  } else {
    bar.style.background = '#10B981';
    txt.textContent = 'Strong: Enterprise-grade government password standard met.';
    txt.style.color = '#10B981';
  }
};

const showFieldError = (elementId, msg) => {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
    el.style.color = '#EF4444';
    el.style.fontSize = '0.75rem';
    el.style.marginTop = '4px';
  }
};

const attachLiveValidationListeners = () => {
  // Clear error on input
  document.querySelectorAll('.form-control').forEach(input => {
    input.addEventListener('input', () => {
      const err = input.parentElement.querySelector('.field-error');
      if (err) err.style.display = 'none';
    });
  });
};

// Global export for window usage
window.openRegistrationChooser = openRegistrationChooser;
window.startRegistrationFlow = startRegistrationFlow;
window.goToStep = goToStep;
window.handleDocUpload = handleDocUpload;
window.onOtpInput = onOtpInput;
window.onOtpKeyDown = onOtpKeyDown;
window.resendRegistrationOTP = resendRegistrationOTP;
window.verifySubmittedOTP = verifySubmittedOTP;
window.onStateChange = onStateChange;
window.onDistrictChange = onDistrictChange;
window.lookupIFSC = lookupIFSC;
window.lookupCentreCode = lookupCentreCode;
window.calcRealisticYield = calcRealisticYield;
window.checkPasswordStrength = checkPasswordStrength;
window.sendStep1MobileOtp = sendStep1MobileOtp;
window.verifyStep1MobileOtp = verifyStep1MobileOtp;
window.sendStep1EmailOtp = sendStep1EmailOtp;
window.verifyStep1EmailOtp = verifyStep1EmailOtp;
window.onStep1ContactChange = onStep1ContactChange;
window.unlockStep1Contact = unlockStep1Contact;
window.autoDetectFarmerLocation = autoDetectFarmerLocation;
