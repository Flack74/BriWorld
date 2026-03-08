package game

import (
	"encoding/json"
	"fmt"
	"net/http"
	"unicode/utf8"
)

// 1️⃣ Food 🍜
// 2️⃣ Culture / Tradition 🎭
// 3️⃣ Famous Landmark / Monument 🗼
// 4️⃣ Nature / National Animal 🐅
// 5️⃣ Tourist Attraction / Landscape 🏝️
var EmojiMap = map[string]string{
	// ─────────────────────────────────────────
	// NORTH AMERICA
	// Food | Culture | Landmark | Nature/Animal | Landscape
	// ─────────────────────────────────────────

	// US  – Burger / Jazz / Statue of Liberty / Bald Eagle / Grand Canyon
	"US": "🍔🎷🗽🦅🏜️",
	// Canada – Poutine / Ice Hockey / CN Tower / Beaver / Rocky Mountains
	"CA": "🍟🏒🗼🦫🏔️",
	// Mexico – Taco / Mariachi / Chichen Itza / Axolotl / Cenote
	"MX": "🌮🎺🏛️🦎🌵",
	// Guatemala – Corn tamale / Mayan weaving / Tikal / Quetzal / Volcanoes
	"GT": "🫔🧵🏛️🦜🌋",
	// Belize – Fry jacks / Garifuna drumming / Caracol ruins / Jaguar / Blue Hole
	"BZ": "🥞🥁🏛️🐆🌀",
	// El Salvador – Pupusa / Carnival / Santa Ana volcano / Turquoise-browed motmot / Pacific coast
	"SV": "🫓🎪🌋🦜🌊",
	// Honduras – Baleada / Lenca pottery / Copán ruins / Scarlet macaw / Jungle
	"HN": "🫓🏺🏛️🦜🌿",
	// Nicaragua – Gallo pinto / Folk dance / Masaya volcano / Jaguar / Lake Nicaragua
	"NI": "🍚💃🌋🐆🏞️",
	// Costa Rica – Casado / Tico traditions / Arenal volcano / Sloth / Rainforest
	"CR": "🍽️☮️🌋🦥🌿",
	// Panama – Sancocho / Pollera dress / Panama Canal / Harpy eagle / Cloud forest
	"PA": "🍲👗🚢🦅☁️",
	// Cuba – Ropa vieja / Son music / El Morro castle / Cuban crocodile / Tobacco fields
	"CU": "🥘🎶🏰🐊🌿",
	// Jamaica – Jerk chicken / Reggae / Blue Mountain / Hummingbird / Beach
	"JM": "🍗🎵🏔️🐦🏖️",
	// Haiti – Griot / Vodou art / Citadelle Laferrière / Hispaniolan parrot / Mountains
	"HT": "🥩🎨🏯🦜🏔️",
	// Dominican Republic – Mangu / Merengue / Colonial Zone / Palmchat / Punta Cana
	"DO": "🍌💃🏰🐦🌴",

	// ─────────────────────────────────────────
	// SOUTH AMERICA
	// Food | Culture | Landmark | Nature/Animal | Landscape
	// ─────────────────────────────────────────

	// Brazil – Churrasco / Samba / Christ the Redeemer / Jaguar / Amazon
	"BR": "🥩💃🗿🐆🌿",
	// Argentina – Asado / Tango / Obelisk Buenos Aires / Puma / Patagonia glacier
	"AR": "🥩🕺🗼🦁🏔️",
	// Chile – Empanada / Cueca dance / Easter Island / Andean condor / Atacama
	"CL": "🥟💃🗿🦅🏜️",
	// Colombia – Bandeja paisa / Cumbia / Gold Museum / Andean condor / Coffee region
	"CO": "🍛🥁🏛️🦅☕",
	// Peru – Ceviche / Inti Raymi / Machu Picchu / Vicuña / Sacred Valley
	"PE": "🐟🎭🏔️🦙🌄",
	// Venezuela – Arepa / Joropo / Angel Falls / Giant anteater / Tepui
	"VE": "🫓🤠💧🐜🏔️",
	// Ecuador – Ceviche / Inti Raymi / Galápagos / Giant tortoise / Cloud forest
	"EC": "🦞🎭🌋🐢🌿",
	// Bolivia – Salteña / Carnival of Oruro / Tiwanaku / Llama / Salt flats
	"BO": "🥟🎪🏛️🦙🏳️",
	// Paraguay – Sopa soo / Arpeggio harp / Jesuit ruins / Giant anteater / Wetlands
	"PY": "🍲🪗🏛️🐜🌿",
	// Uruguay – Chivito / Candombe / Colonia del Sacramento / Rhea / Pampas
	"UY": "🥩🥁🏰🦤🌾",
	// Guyana – Pepperpot / Amerindian heritage / Kaieteur Falls / Jaguar / Rainforest
	"GY": "🍲🏹💧🐆🌿",
	// Suriname – Roti / Maroon art / Fort Zeelandia / Giant river otter / Jungle
	"SR": "🫓🎨🏰🦦🌿",

	// ─────────────────────────────────────────
	// EUROPE
	// Food | Culture | Landmark | Nature/Animal | Landscape
	// ─────────────────────────────────────────

	// UK – Fish & chips / Royalty / Big Ben / Lion / White cliffs
	"GB": "🐟👑🕰️🦁🌊",
	// France – Croissant / Cancan / Eiffel Tower / Rooster / Loire Valley
	"FR": "🥐💃🗼🐓🌾",
	// Germany – Bratwurst / Oktoberfest / Brandenburg Gate / Eagle / Black Forest
	"DE": "🌭🍺🚪🦅🌲",
	// Italy – Pizza / Opera / Colosseum / Wolf / Amalfi Coast
	"IT": "🍕🎭🏟️🐺🌊",
	// Spain – Paella / Flamenco / Sagrada Familia / Bull / Costa del Sol
	"ES": "🥘💃⛪🐂☀️",
	// Portugal – Bacalhau / Fado / Belém Tower / Iberian lynx / Algarve coast
	"PT": "🐟🎸🏰🐱🌊",
	// Netherlands – Stroopwafel / King's Day / Windmill / Frisian horse / Tulip fields
	"NL": "🧇👑🌬️🐎🌷",
	// Belgium – Waffle / Carnival / Manneken Pis / European bison / Ardennes
	"BE": "🧇🎪🗿🦬🌲",
	// Switzerland – Fondue / Yodeling / Matterhorn / Alpine ibex / Rhine Falls
	"CH": "🫕🎶🏔️🐐💧",
	// Austria – Wiener schnitzel / Waltz / Schönbrunn Palace / Edelweiss / Alps
	"AT": "🍗💃🏰🌸🏔️",
	// Sweden – Meatballs / Midsommar / Vasa Museum / Moose / Northern lights
	"SE": "🍝☀️⚓🫎🌌",
	// Norway – Salmon / Constitution Day / Geirangerfjord / Lemming / Northern lights
	"NO": "🐟🎺🏞️🐭🌌",
	// Denmark – Smørrebrød / Hygge / The Little Mermaid / White stork / Faroe cliffs
	"DK": "🥪🕯️🧜🐦🌊",
	// Finland – Salmon soup / Sauna / Helsinki Cathedral / Brown bear / Lapland
	"FI": "🐟🧖⛪🐻❄️",
	// Iceland – Skyr / Sagas / Geysir / Arctic fox / Aurora
	"IS": "🥛📖♨️🦊🌌",
	// Ireland – Irish stew / St Patrick / Cliffs of Moher / Red deer / Green hills
	"IE": "🍲☘️🪨🦌🌿",
	// Poland – Pierogi / Chopin / Wawel Castle / White-tailed eagle / Białowieża forest
	"PL": "🥟🎹🏰🦅🌲",
	// Czech Republic – Svíčková / Beer culture / Charles Bridge / Bohemian lion / Bohemian valleys
	"CZ": "🥩🍺🌉🦁🌄",
	// Slovakia – Bryndzové halušky / Folk embroidery / Spiš Castle / Tatra chamois / Tatra Mountains
	"SK": "🥔🧵🏰🐐🏔️",
	// Hungary – Goulash / Csárdás / Parliament / Puszta horse / Balaton
	"HU": "🥘💃🏛️🐎🌊",
	// Romania – Mămăligă / Dracula legend / Bran Castle / Lynx / Carpathians
	"RO": "🌽🧛🏰🐱🏔️",
	// Bulgaria – Banitsa / Rose Festival / Rila Monastery / Golden eagle / Rose Valley
	"BG": "🥐🌹⛪🦅🌸",
	// Greece – Moussaka / Orthodox Easter / Parthenon / Dolphin / Santorini
	"GR": "🥙🎉🏛️🐬🏝️",
	// Albania – Fërgesë / Iso-polyphony / Butrint ruins / Golden eagle / Albanian Riviera
	"AL": "🫕🎶🏛️🦅🌊",
	// North Macedonia – Tavče gravče / Folklore / Lake Ohrid / Lynx / Matka canyon
	"MK": "🫘🎵🏛️🐱🏞️",
	// Serbia – Ćevapčići / Slava tradition / Kalemegdan / White eagle / Danube gorge
	"RS": "🌭🕯️🏰🦅🏞️",
	// Bosnia – Ćevapi / Dervish ceremony / Stari Most bridge / Brown bear / Una River
	"BA": "🌭🕌🌉🐻🏞️",
	// Croatia – Peka / Klapa music / Diocletian's Palace / Griffon vulture / Plitvice
	"HR": "🥘🎶🏛️🦅💧",
	// Slovenia – Potica / Kurentovanje / Predjama Castle / Brown bear / Lake Bled
	"SI": "🥮🎭🏰🐻🌊",
	// Montenegro – Njeguški pršut / Kolo dance / Kotor old town / Golden eagle / Bay of Kotor
	"ME": "🥩💃🏰🦅🌊",
	// Ukraine – Borscht / Hopak / Saint Sophia / White stork / Carpathian meadows
	"UA": "🍲💃⛪🐦🌻",
	// Belarus – Draniki / Kupalle festival / Nesvizh Castle / European bison / Belavezhskaya forest
	"BY": "🥔🪷🏰🦬🌲",
	// Lithuania – Cepelinai / Midsummer / Trakai Castle / White stork / Curonian Spit
	"LT": "🥟🌊🏰🐦🏝️",
	// Latvia – Rye bread / Song Festival / Riga Old Town / White wagtail / Gauja valley
	"LV": "🍞🎶🏰🐦🌲",
	// Estonia – Verivorst / Song Festival / Tallinn Old Town / Barn swallow / Lahemaa
	"EE": "🌭🎶🏰🐦🌲",
	// Russia – Borscht / Ballet / Saint Basil's / Brown bear / Lake Baikal
	"RU": "🍲🩰⛪🐻🌊",
	// Moldova – Mămăligă / Wine festival / Orheiul Vechi / European ground squirrel / Vineyards
	"MD": "🌽🍷🏛️🐿️🌿",
	// Luxembourg – Bouneschlupp / Schueberfouer / Vianden Castle / White stork / Müllerthal
	"LU": "🫘🎡🏰🐦🌲",
	// Malta – Pastizzi / Carnival / Valletta / Blue rock thrush / Blue Lagoon
	"MT": "🥐🎪🏛️🐦🌊",
	// Cyprus – Halloumi / Aphrodite festival / Kourion / Mouflon / Cape Greko
	"CY": "🧀🎭🏛️🐏🌊",
	// Turkey – Kebab / Whirling dervish / Hagia Sophia / Wolf / Cappadocia
	"TR": "🍢🌀🕌🐺🏔️",

	// ─────────────────────────────────────────
	// ASIA
	// Food | Culture | Landmark | Nature/Animal | Landscape
	// ─────────────────────────────────────────

	// China – Dim sum / Dragon Festival / Great Wall / Giant panda / Karst hills
	"CN": "🥟🐉🧱🐼🏔️",
	// Japan – Sushi / Cherry blossom / Mount Fuji / Red-crowned crane / Bamboo forest
	"JP": "🍣🌸🗻🦢🎋",
	// South Korea – Bibimbap / K-pop / Gyeongbokgung / Siberian tiger / DMZ forest
	"KR": "🍚🎤🏯🐯🌸",
	// India – Biryani / Holi / Taj Mahal / Bengal tiger / Kerala backwaters
	"IN": "🍛🎨🕌🐯🌊",
	// Pakistan – Nihari / Truck art / Lahore Fort / Snow leopard / Karakoram
	"PK": "🍖🎨🏰🐆🏔️",
	// Bangladesh – Hilsa curry / Pohela Boishakh / Mosque of Bangladesh / Royal Bengal tiger / Sundarbans
	"BD": "🐟🎊🕌🐅🌿",
	// Sri Lanka – Rice & curry / Kandy Perahera / Sigiriya rock / Elephant / Highlands
	"LK": "🍛🐘🪨🐘☕",
	// Nepal – Dal bhat / Dashain / Boudhanath / Snow leopard / Himalayas
	"NP": "🍲🪔🕌🐆🏔️",
	// Bhutan – Ema datshi / Tshechu festival / Tiger's Nest / Takin / Himalayas
	"BT": "🌶️💃🏯🐐🏔️",
	// Myanmar – Mohinga / Thingyan water festival / Shwedagon Pagoda / Indochinese tiger / Bagan plains
	"MM": "🍜💦🕌🐯🏛️",
	// Thailand – Pad thai / Songkran / Wat Arun / Asian elephant / Phi Phi Islands
	"TH": "🍜💦⛩️🐘🏝️",
	// Laos – Laap / Bun Pi Mai / Pha That Luang / Asian elephant / Mekong river
	"LA": "🥗🎊🏛️🐘🌊",
	// Cambodia – Amok / Khmer New Year / Angkor Wat / Kouprey / Mekong delta
	"KH": "🍲🎊🏛️🐂🌊",
	// Vietnam – Pho / Tet festival / Ha Long Bay / Indochinese tiger / Rice terraces
	"VN": "🍜🎆🏞️🐯🌾",
	// Malaysia – Nasi lemak / Hari Raya / Petronas Towers / Proboscis monkey / Borneo rainforest
	"MY": "🍚🕌🏙️🐒🌿",
	// Singapore – Chilli crab / Deepavali / Marina Bay Sands / Merlion / Gardens by the Bay
	"SG": "🦀🪔🏙️🦁🌺",
	// Indonesia – Nasi goreng / Batik / Borobudur / Orangutan / Komodo volcano
	"ID": "🍳🎨🏛️🦧🌋",
	// Philippines – Adobo / Sinulog / Chocolate Hills / Philippine eagle / Palawan
	"PH": "🍖💃🏔️🦅🏝️",
	// Brunei – Ambuyat / Hari Raya / Sultan Omar Mosque / Proboscis monkey / Rainforest
	"BN": "🍢🕌🏛️🐒🌿",
	// Timor-Leste – Ikan sabuko / Tais weaving / Cristo Rei / Saltwater crocodile / Atauro island
	"TL": "🐟🧵🗿🐊🏝️",
	// Mongolia – Khorkhog / Naadam / Genghis Khan statue / Snow leopard / Gobi desert
	"MN": "🥩🏹🗿🐆🏜️",
	// Kazakhstan – Beshbarmak / Nauryz / Bayterek Tower / Snow leopard / Steppe
	"KZ": "🍖🌸🗼🐆🌾",
	// Kyrgyzstan – Beshbarmak / Manas epic / Burana Tower / Snow leopard / Song Kul lake
	"KG": "🍖📜🗼🐆🏔️",
	// Tajikistan – Osh pilaf / Navruz / Hissar Fort / Marco Polo sheep / Pamir mountains
	"TJ": "🍚🌸🏰🐑🏔️",
	// Uzbekistan – Plov / Silk Road / Registan / Saiga antelope / Kyzylkum desert
	"UZ": "🍚🐪🏛️🦌🏜️",
	// Turkmenistan – Çorba / Turkmenbashi / Neutrality Arch / Akhal-Teke horse / Darvaza gas crater
	"TM": "🍲🏛️🔥🐎🏜️",
	// Afghanistan – Kabuli pulao / Buzkashi / Band-e-Amir / Snow leopard / Hindu Kush
	"AF": "🍚🏇🏞️🐆🏔️",
	// Iran – Chelo kebab / Nowruz / Persepolis / Persian leopard / Dasht-e Kavir
	"IR": "🍢🌹🏛️🐆🏜️",
	// Iraq – Masgouf / Eid / Ziggurat of Ur / Mesopotamian fallow deer / Tigris marshes
	"IQ": "🐟🌙🏛️🦌🌊",
	// Syria – Kibbeh / Eid drumming / Krak des Chevaliers / Syrian brown bear / Dead Cities
	"SY": "🥙🥁🏰🐻🏛️",
	// Lebanon – Hummus / Dabke dance / Byblos / Cedar / Qadisha valley
	"LB": "🫘💃🏛️🌲🏔️",
	// Jordan – Mansaf / Bedouin hospitality / Petra / Arabian oryx / Wadi Rum
	"JO": "🍲🕌🏛️🦌🏜️",
	// Israel – Falafel / Shabbat / Western Wall / Hoopoe / Dead Sea
	"IL": "🧆🕯️🕌🐦🌊",
	// Palestine – Musakhan / Embroidery / Al-Aqsa Mosque / Mountain gazelle / West Bank hills
	"PS": "🍗🧵🕌🦌🏔️",
	// Saudi Arabia – Kabsa / Hajj / Masmak Fort / Arabian leopard / Rub al Khali
	"SA": "🍚🕌🏰🐆🏜️",
	// Yemen – Saltah / Zar ceremony / Old Sana'a / Arabian leopard / Socotra
	"YE": "🥘🥁🕌🐆🌴",
	// Oman – Shuwa / Khanjar tradition / Sultan Qaboos Mosque / Arabian oryx / Wahiba Sands
	"OM": "🍖🗡️🕌🦌🏜️",
	// UAE – Shawarma / Falconry / Burj Khalifa / Arabian oryx / Dubai skyline
	"AE": "🥙🦅🏙️🦌🌅",
	// Qatar – Machboos / Falconry / Pearl Monument / Oryx / Sand dunes
	"QA": "🍚🦅🏛️🐐🏜️",
	// Bahrain – Muhammar / Pearl diving / Al-Fateh Mosque / Arabian oryx / Hawar islands
	"BH": "🍚🤿🕌🦌🏝️",
	// Kuwait – Machboos / Diwaniya / Kuwait Towers / Dugong / Gulf coast
	"KW": "🍖🫖🗼🐬🌊",
	// Georgia – Khachapuri / Polyphonic singing / Svetitskhoveli / Caucasian leopard / Caucasus
	"GE": "🥐🎶⛪🐆🏔️",
	// Armenia – Dolma / Vardavar / Geghard Monastery / Golden eagle / Mount Ararat
	"AM": "🫑🎊⛪🦅🏔️",
	// Azerbaijan – Plov / Novruz / Flame Towers / Caucasian leopard / Caspian coast
	"AZ": "🍚🔥🏙️🐆🌊",

	// ─────────────────────────────────────────
	// AFRICA
	// Food | Culture | Landmark | Nature/Animal | Landscape
	// ─────────────────────────────────────────

	// Egypt – Kushari (pasta+lentil dish) / Crescent moon (Islam, Eid) / Pyramids of Giza / Egyptian mongoose / Nile delta
	"EG": "🍝🌙🔺🦡🌊",
	// Libya – Couscous / Ancient pottery (Amazigh Berber culture) / Leptis Magna Roman ruins / Barbary lion / Sahara desert
	"LY": "🍚🏺🏛️🦁🏜️",
	// Tunisia – Brik (pastry) / Evil eye charm (nazar, sold in every medina) / El Djem Roman amphitheatre / Barbary macaque / Chott el Djerid salt lake
	"TN": "🥐🧿🏟️🐒🏜️",
	// Algeria – Couscous / Fantasia horseback riding ceremony / Djémila Roman ruins / Fennec fox (national animal) / Sahara desert
	"DZ": "🍚🏇🏛️🦊🏜️",
	// Morocco – Tagine (slow-cooked stew) / Gnawa music tradition / Koutoubia Mosque Marrakech / Barbary macaque / Atlas Mountains
	"MA": "🍲🎵🕌🐒🏔️",
	// Sudan – Ful medames (fava beans) / Zar drum ceremony / Meroe Pyramids (more pyramids than Egypt) / African wild dog / Nile confluence at Khartoum
	"SD": "🫘🥁🔺🐕🌊",
	// South Sudan – Kisra flatbread / Dinka people dance / White Nile river / Shoebill stork (iconic bird) / Sudd swamp wetlands
	"SS": "🫓💃🌊🦤🌿",
	// Ethiopia – Injera sourdough flatbread / Timkat Epiphany festival / Lalibela rock-hewn churches / Gelada baboon (endemic) / Simien Mountains
	"ET": "🫓🎊⛪🐒🏔️",
	// Eritrea – Zigni meat stew / Tigrinya traditional dance / Asmara modernist cathedral / Nubian ibex / Red Sea coastline
	"ER": "🥘💃⛪🐐🌊",
	// Djibouti – Skoudehkaris spiced rice & lamb / Afar traditional dance / Hamoudi Mosque / Octopus (Gulf of Aden seafood) / Lake Assal volcanic crater
	"DJ": "🥩💃🕌🐙🌋",
	// Somalia – Canjeero (spongy flatbread) / Saar traditional ceremony / Mogadishu lighthouse / African wild ass / Laas Geel ancient cave paintings
	"SO": "🫓🎭🗼🫏🏛️",
	// Kenya – Ugali (maize porridge) / Maasai warrior culture / Mount Kenya / African lion / Maasai Mara savanna grasslands
	"KE": "🍚🏹🏔️🦁🌾",
	// Uganda – Matoke (steamed banana) / Buganda Kingdom royal tradition / Bwindi source of Nile / Mountain gorilla / Virunga rainforest
	"UG": "🍌👑🌊🦍🌿",
	// Tanzania – Pilau spiced rice / Zanzibar spice trade culture / Kilimanjaro / African elephant / Serengeti plains
	"TZ": "🍚🌶️🏔️🐘🌾",
	// Rwanda – Brochette grilled meat / Intore traditional dance / Kigali Memorial / Mountain gorilla / Thousand Hills landscape
	"RW": "🥩💃🏛️🦍🌿",
	// Burundi – Boko bean stew / Ingoma royal drum ceremony / Rusizi River delta / Hippopotamus / Lake Tanganyika
	"BI": "🍖🥁🌊🦛🌊",
	// DR Congo – Pondu cassava leaf stew / Sapeurs (famous dandies in suits) / Congo River / Bonobo (endemic great ape) / Virunga rainforest
	"CD": "🥬👔🌊🐒🌿",
	// Central African Republic – Gozo millet porridge / Yakoma traditional dance / Boali Falls / Forest elephant / Dzanga-Ndoki forest
	"CF": "🍖💃💧🐘🌿",
	// Cameroon – Ndolé bitterleaf stew / Ngondo water festival / Mount Cameroon (highest peak in West Africa) / Western lowland gorilla / Waza savanna
	"CM": "🥬🎊🌋🦍🌾",
	// Chad – Aiysh sorghum porridge / Gerewol Wodaabe beauty festival / Zakouma National Park / African painted dog / Ennedi plateau rock formations
	"TD": "🥣🎭🏜️🐕🗿",
	// Niger – Tuwo grain pudding / Cure Salée nomad festival / W National Park / Addax antelope (critically endangered) / Ténéré desert
	"NE": "🥣🐪🏜️🐐🌵",
	// Nigeria – Jollof rice (West Africa's most contested dish) / Egungun masquerade festival / Zuma Rock / African fish eagle / Niger River delta
	"NG": "🍛🎭🗿🦅🌊",
	// Benin – Akassa corn porridge / Vodoun (Voodoo) religion birthplace / Pendjari National Park / Forest buffalo / Pendjari valley
	"BJ": "🍚🥁🏞️🐃🌿",
	// Togo – Fufu pounded yam / Evala wrestling initiation ceremony / Koutammakou mud tower houses / Nile crocodile / Palm-lined coast
	"TG": "🍲🤼🏡🐊🌴",
	// Ghana – Fufu / Kente cloth weaving (national cultural symbol) / Cape Coast Castle (slave trade site) / African fish eagle / Kakum rainforest canopy walk
	"GH": "🍲🧵🏰🦅🌿",
	// Côte d'Ivoire – Attiéké (fermented cassava) / Mask dance ceremony / Grand Bassam colonial town / Forest elephant / Taï Forest (UNESCO)
	"CI": "🥥💃🏛️🐘🌿",
	// Liberia – Rice bread / Poro secret society tradition / Providence Island (founding site) / Pygmy hippopotamus (endemic) / Sapo rainforest
	"LR": "🍞🌿🏝️🦛🌿",
	// Sierra Leone – Cassava leaf stew / Bondo women's society / Bunce Island slave fort / Chimpanzee / Tacugama sanctuary forest
	"SL": "🥬🌿🏝️🐒🌿",
	// Guinea – Tigadegena peanut sauce / Balafon xylophone music / Conakry city / Chimpanzee / Fouta Djallon highlands
	"GN": "🍲🪘🏙️🐒🏔️",
	// Guinea-Bissau – Caldo de mancarra peanut stew / Carnival tradition / Bijagós sacred islands / Nile crocodile / Mangrove coast
	"GW": "🍲🎭🏝️🐊🌿",
	// Senegal – Thiéboudienne fish rice (national dish) / Sabar drumming & dance / Gorée Island slave house / Lion (on national coat of arms) / Sine-Saloum delta
	"SN": "🍛🥁🏝️🦁🌊",
	// Gambia – Benachin one-pot rice / Kora 21-string harp music / Kunta Kinteh Island slave trade site / Nile crocodile / Gambia River
	"GM": "🍚🎸🏝️🐊🌊",
	// Mali – Tô millet porridge / Djembe drum tradition / Djenné Mosque (world's largest mud building) / African wild dog / Niger River inland delta
	"ML": "🍚🪘🕌🐕🌊",
	// Burkina Faso – Tô / FESPACO (Africa's biggest film festival) / Tiébélé painted royal court / Elephant / Cascades waterfalls region
	"BF": "🍚🎬🏡🐘🌊",
	// Mauritania – Thiéboudienne / Griot praise singer tradition / Chinguetti Mosque (ancient Saharan city) / Addax antelope / Adrar plateau
	"MR": "🍛🎵🕌🐐🏜️",
	// Cape Verde – Cachupa slow-cooked stew (national dish) / Morna melancholic music (Cesária Évora) / São Filipe volcano / Loggerhead turtle / Volcanic island chain
	"CV": "🫘🎵🌋🐢🏝️",
	// South Africa – Braai (barbecue, national institution) / Rainbow Nation / Table Mountain Cape Town / Lion (Big Five) / Cape Winelands
	"ZA": "🥩🌈🏔️🦁🍷",
	// Namibia – Biltong dried meat / Himba people red ochre body art / Fish River Canyon (world's second largest) / Cheetah (highest population) / Namib dunes
	"NA": "🥩🏺🏞️🐆🏜️",
	// Botswana – Seswaa pounded meat / Tswana traditional dance / Tsodilo Hills rock art (UNESCO) / African wild dog / Okavango Delta
	"BW": "🥩💃🗿🐕🌊",
	// Zambia – Nshima maize porridge / Kuomboka royal barge ceremony / Victoria Falls / African wild dog / South Luangwa valley
	"ZM": "🍚🚣💧🐕🌿",
	// Zimbabwe – Sadza maize porridge / Mbira thumb piano music / Great Zimbabwe stone ruins / African elephant / Victoria Falls mist
	"ZW": "🍚🎵🏛️🐘💧",
	// Mozambique – Peri-peri prawn (world-famous) / Timbila xylophone music / Island of Mozambique Portuguese fort / Dugong / Bazaruto Archipelago
	"MZ": "🦐🪘🏛️🐬🏝️",
	// Malawi – Nsima maize porridge / Gule Wamkulu secret society dance / Cape Maclear lakeshore / African fish eagle (national bird) / Lake Malawi
	"MW": "🍚🥁🏖️🦅🌊",
	// Madagascar – Romazava meat & greens stew / Famadihana turning of the bones ceremony / Tsingy limestone forest / Ring-tailed lemur (endemic) / Avenue of Baobabs
	"MG": "🍲💃🌵🦝🌴",
	// Mauritius – Dholl puri flatbread / Cavadee Hindu fire-walking festival / Le Morne mountain / Pink pigeon (nearly extinct, endemic) / Blue Bay lagoon
	"MU": "🫓🎊🏔️🐦🌊",
	// Seychelles – Curry creole / Creole festival / Vallée de Mai palm forest (UNESCO) / Coco de mer (world's largest seed, endemic palm) / Anse Source d'Argent beach
	"SC": "🍛🌴🌴🌴🏖️",
	// Comoros – Langouste lobster / Maulida Prophet's birthday festival / Karthala active volcano / Coelacanth (living fossil fish, rediscovered here) / Mohéli lagoon
	"KM": "🦞🎶🌋🐟🏝️",
	// Angola – Moamba de galinha chicken stew / Carnival of Luanda / Kalandula Falls / Giant sable antelope (national animal, endemic) / Namib coast
	"AO": "🍗🎭💧🐂🏜️",
	// São Tomé & Príncipe – Calulu smoked fish stew / Ussua traditional dance / Pico de São Tomé peak / São Tomé sunbird (endemic) / Rainforest
	"ST": "🐟💃🏔️🐦🌿",
	// Equatorial Guinea – Pepper soup / Bubi people's ritual traditions / Monte Alen National Park / Western lowland gorilla / Bioko island
	"GQ": "🍲🌿🏔️🦍🏝️",
	// Gabon – Ntoba smoked fish / Bwiti spiritual ceremony (iboga plant ritual) / Crystal Mountains / Forest elephant / Lopé baobab savanna (UNESCO)
	"GA": "🍖🌿🏔️🐘🌿",
	// Congo (Republic) – Pondu cassava leaf / Bikutsi percussion music / Lesini gorge / Western lowland gorilla / Congo rainforest basin
	"CG": "🥬🥁🏞️🐒🌿",
	// Lesotho – Papa maize porridge / Mohobelo stepping dance / Sani Pass mountain road / Bearded vulture (national bird) / Drakensberg highlands
	"LS": "🍚💃🏔️🦅🌄",
	// Eswatini – Sishwala thick porridge / Incwala kingship ceremony (most sacred ritual) / Hlane Royal National Park / Lion / Ezulwini Valley (Valley of Heaven)
	"SZ": "🍚🛡️🏞️🦁🌿",

	// ─────────────────────────────────────────
	// OCEANIA
	// Food | Culture | Landmark | Nature/Animal | Landscape
	// ─────────────────────────────────────────

	// Australia – Vegemite spread / Didgeridoo (Aboriginal instrument) / Sydney Opera House / Kangaroo (national animal) / Great Barrier Reef
	"AU": "🍞🪘🏛️🦘🐠",
	// New Zealand – Hāngī earth oven feast / Haka war dance / Sky Tower Auckland / Kiwi bird (national animal) / Fiordland
	"NZ": "🍖💪🗼🥝🏔️",
	// Fiji – Kokoda raw fish in coconut cream / Meke traditional dance / Sigatoka Sand Dunes / Crested iguana (endemic) / Coral coast
	"FJ": "🐟💃🏜️🦎🌊",
	// Papua New Guinea – Mumu earth oven feast / Sing-sing tribal gathering / Kokoda Track WWII trail / Bird of paradise (national bird) / Highland forest
	"PG": "🍖🎭🌿🐦🌿",
	// Solomon Islands – Poi taro pudding / Custom dance ceremonies / Skull Island (WWII site) / Dugong / Marovo lagoon (world's largest saltwater lagoon)
	"SB": "🥥💃🏝️🐬🌊",
	// Vanuatu – Lap lap root vegetable pudding / Naghol land diving (original bungee jump ritual) / Mount Yasur accessible active volcano / Dugong / Blue Hole
	"VU": "🍠🤸🌋🐬💧",
	// New Caledonia – Bougna coconut & root vegetable dish / Pilou ceremonial dance / Heart of Voh (natural heart-shaped mangrove) / Kagu bird (endemic, flightless) / Grande Terre lagoon (UNESCO)
	"NC": "🍠💃🌿🐦🌊",
	// French Polynesia – Poisson cru raw fish in coconut lime / Heiva traditional games festival / Bora Bora / Manta ray / Overwater bungalow
	"PF": "🐟🎊🏝️🐟🌺",
	// Samoa – Oka raw fish salad / Ailao afi fire knife dance / Robert Louis Stevenson Museum / Flying fox bat / To Sua ocean trench
	"WS": "🐟🔥🏛️🦇🏊",
	// Tonga – Lu pulu corned beef in taro leaves / Lakalaka standing dance (UNESCO) / Haʻamonga trilithon stone arch / Flying fox bat / ʻEua island sea cliffs
	"TO": "🥥💃🗿🦇🌊",
	// Tuvalu – Pulaka swamp taro / Fatele group dance / Funafuti lagoon / Frigatebird / Coral atoll (threatened by rising seas)
	"TV": "🥥💃🏝️🐦🌊",
	// Nauru – Noddy tern seabird (once hunted for food) / Angam Day (population survival celebration) / Buada lagoon / Frigatebird / Phosphate plateau (island-wide mining scar)
	"NR": "🐦🎉🌊🐦💎",
	// Kiribati – Te bua coconut toddy drink / Dance festival tradition / Millennium Island (first place to see New Year) / Frigatebird / Phoenix Islands (UNESCO, largest marine protected area)
	"KI": "🐟🎊🏝️🐦🌊",
	// Marshall Islands – Breadfruit staple / Stick dance navigation tradition / Bikini Atoll nuclear test site (UNESCO) / Hawksbill turtle / Majuro lagoon
	"MH": "🍞💃🏝️🐢🌊",
	// Micronesia – Taro staple / Yap traditional dance with stone money / Nan Madol ancient island city (UNESCO) / Nautilus shell (symbol of the islands) / Rock islands
	"FM": "🥔💃🏛️🐚🌊",
	// Palau – Fruit bat soup (traditional delicacy) / Modekngei indigenous religion / Jellyfish Lake (swim with golden jellyfish) / Dugong / Rock Islands Southern Lagoon (UNESCO)
	"PW": "🦇🏛️🌊🐬🏝️",
}

// CountryNames maps ISO codes to English country names (what the player types)
var CountryNames = map[string]string{
	"US": "United States", "CA": "Canada", "MX": "Mexico",
	"GT": "Guatemala", "BZ": "Belize", "SV": "El Salvador",
	"HN": "Honduras", "NI": "Nicaragua", "CR": "Costa Rica",
	"PA": "Panama", "CU": "Cuba", "JM": "Jamaica",
	"HT": "Haiti", "DO": "Dominican Republic",
	"BR": "Brazil", "AR": "Argentina", "CL": "Chile",
	"CO": "Colombia", "PE": "Peru", "VE": "Venezuela",
	"EC": "Ecuador", "BO": "Bolivia", "PY": "Paraguay",
	"UY": "Uruguay", "GY": "Guyana", "SR": "Suriname",
	"GB": "United Kingdom", "FR": "France", "DE": "Germany",
	"IT": "Italy", "ES": "Spain", "PT": "Portugal",
	"NL": "Netherlands", "BE": "Belgium", "CH": "Switzerland",
	"AT": "Austria", "SE": "Sweden", "NO": "Norway",
	"DK": "Denmark", "FI": "Finland", "IS": "Iceland",
	"IE": "Ireland", "PL": "Poland", "CZ": "Czech Republic",
	"SK": "Slovakia", "HU": "Hungary", "RO": "Romania",
	"BG": "Bulgaria", "GR": "Greece", "AL": "Albania",
	"MK": "North Macedonia", "RS": "Serbia", "BA": "Bosnia and Herzegovina",
	"HR": "Croatia", "SI": "Slovenia", "ME": "Montenegro",
	"UA": "Ukraine", "BY": "Belarus", "LT": "Lithuania",
	"LV": "Latvia", "EE": "Estonia", "RU": "Russia",
	"MD": "Moldova", "LU": "Luxembourg", "MT": "Malta",
	"CY": "Cyprus", "TR": "Turkey",
	"CN": "China", "JP": "Japan", "KR": "South Korea",
	"IN": "India", "PK": "Pakistan", "BD": "Bangladesh",
	"LK": "Sri Lanka", "NP": "Nepal", "BT": "Bhutan",
	"MM": "Myanmar", "TH": "Thailand", "LA": "Laos",
	"KH": "Cambodia", "VN": "Vietnam", "MY": "Malaysia",
	"SG": "Singapore", "ID": "Indonesia", "PH": "Philippines",
	"BN": "Brunei", "TL": "Timor-Leste", "MN": "Mongolia",
	"KZ": "Kazakhstan", "KG": "Kyrgyzstan", "TJ": "Tajikistan",
	"UZ": "Uzbekistan", "TM": "Turkmenistan", "AF": "Afghanistan",
	"IR": "Iran", "IQ": "Iraq", "SY": "Syria",
	"LB": "Lebanon", "JO": "Jordan", "IL": "Israel",
	"PS": "Palestine", "SA": "Saudi Arabia", "YE": "Yemen",
	"OM": "Oman", "AE": "United Arab Emirates", "QA": "Qatar",
	"BH": "Bahrain", "KW": "Kuwait", "GE": "Georgia",
	"AM": "Armenia", "AZ": "Azerbaijan",
	"EG": "Egypt", "LY": "Libya", "TN": "Tunisia",
	"DZ": "Algeria", "MA": "Morocco", "SD": "Sudan",
	"SS": "South Sudan", "ET": "Ethiopia", "ER": "Eritrea",
	"DJ": "Djibouti", "SO": "Somalia", "KE": "Kenya",
	"UG": "Uganda", "TZ": "Tanzania", "RW": "Rwanda",
	"BI": "Burundi", "CD": "DR Congo", "CF": "Central African Republic",
	"CM": "Cameroon", "TD": "Chad", "NE": "Niger",
	"NG": "Nigeria", "BJ": "Benin", "TG": "Togo",
	"GH": "Ghana", "CI": "Ivory Coast", "LR": "Liberia",
	"SL": "Sierra Leone", "GN": "Guinea", "GW": "Guinea-Bissau",
	"SN": "Senegal", "GM": "Gambia", "ML": "Mali",
	"BF": "Burkina Faso", "MR": "Mauritania", "CV": "Cape Verde",
	"ZA": "South Africa", "NA": "Namibia", "BW": "Botswana",
	"ZM": "Zambia", "ZW": "Zimbabwe", "MZ": "Mozambique",
	"MW": "Malawi", "MG": "Madagascar", "MU": "Mauritius",
	"SC": "Seychelles", "KM": "Comoros", "AO": "Angola",
	"ST": "Sao Tome and Principe", "GQ": "Equatorial Guinea",
	"GA": "Gabon", "CG": "Congo", "LS": "Lesotho", "SZ": "Eswatini",
	"AU": "Australia", "NZ": "New Zealand", "FJ": "Fiji",
	"PG": "Papua New Guinea", "SB": "Solomon Islands", "VU": "Vanuatu",
	"NC": "New Caledonia", "PF": "French Polynesia", "WS": "Samoa",
	"TO": "Tonga", "TV": "Tuvalu", "NR": "Nauru",
	"KI": "Kiribati", "MH": "Marshall Islands", "FM": "Micronesia",
	"PW": "Palau",
}

// CountryHints are shown when the player requests a hint
var CountryHints = map[string]string{
	"US": "Land of the free, home of the brave",
	"CA": "World's second largest country by area",
	"MX": "Home of the ancient Aztec Empire",
	"GT": "Heart of the ancient Maya civilization",
	"BZ": "Only Central American country where English is official",
	"SV": "Smallest and most densely populated country in Central America",
	"HN": "Named after the deep waters off its northern coast",
	"NI": "Largest country in Central America",
	"CR": "Means 'Rich Coast' in Spanish",
	"PA": "Connects two oceans with a famous waterway",
	"CU": "Largest island in the Caribbean",
	"JM": "Birthplace of reggae music",
	"HT": "First Black republic in the world",
	"DO": "Shares an island with Haiti",
	"BR": "Largest country in South America",
	"AR": "Home of tango and the Pampas",
	"CL": "World's longest north-to-south country",
	"CO": "Only South American country with coasts on two oceans",
	"PE": "Home of the ancient Inca Empire",
	"VE": "Has the world's highest waterfall",
	"EC": "Named after the equator that runs through it",
	"BO": "Has two capital cities",
	"PY": "Landlocked country in the heart of South America",
	"UY": "Smallest Spanish-speaking country in South America",
	"GY": "Only English-speaking country in South America",
	"SR": "Smallest country in South America",
	"GB": "Island nation that once ruled a quarter of the world",
	"FR": "Most visited country in the world",
	"DE": "Famous for its autobahn and engineering",
	"IT": "Shaped like a boot on the map",
	"ES": "Home of flamenco and bullfighting",
	"PT": "Westernmost country in mainland Europe",
	"NL": "Famous for windmills and tulips",
	"BE": "Capital is considered the de facto capital of the EU",
	"CH": "Neutral country famous for watches and chocolate",
	"AT": "Birthplace of Mozart",
	"SE": "Home of IKEA and ABBA",
	"NO": "Famous for its fjords and Northern Lights",
	"DK": "World's happiest country, home of Lego",
	"FI": "Has more lakes than any other country",
	"IS": "Land of Fire and Ice",
	"IE": "The Emerald Isle",
	"PL": "Largest country in Eastern Europe",
	"CZ": "Famous for its medieval architecture and beer",
	"SK": "Home of Spiš Castle, one of Europe's largest castle ruins",
	"HU": "Budapest straddles a famous European river",
	"RO": "Inspired the Dracula legend",
	"BG": "World's largest rose oil producer",
	"GR": "Birthplace of democracy and the Olympics",
	"AL": "Land of the Eagles",
	"MK": "Home of Lake Ohrid, one of Europe's oldest lakes",
	"RS": "Birthplace of Nikola Tesla",
	"BA": "Famous for the Stari Most bridge",
	"HR": "Known for its stunning Dalmatian coastline",
	"SI": "Home of the stunning Lake Bled",
	"ME": "One of the world's newest countries",
	"UA": "Largest country entirely within Europe",
	"BY": "Known as the lungs of Europe for its vast forests",
	"LT": "Southernmost of the three Baltic states",
	"LV": "Middle Baltic state with a famous song festival",
	"EE": "Most digitally advanced country in the world",
	"RU": "Largest country in the world",
	"MD": "One of Europe's least visited countries",
	"LU": "One of the world's wealthiest countries per capita",
	"MT": "Smallest EU member state",
	"CY": "Island divided between two communities",
	"TR": "Country that spans two continents",
	"CN": "Most populous country in the world",
	"JP": "Land of the Rising Sun",
	"KR": "Land of morning calm",
	"IN": "World's largest democracy",
	"PK": "Home to K2, the world's second highest peak",
	"BD": "Most densely populated large country in the world",
	"LK": "Teardrop-shaped island south of India",
	"NP": "Home of Mount Everest",
	"BT": "The last Himalayan kingdom",
	"MM": "Home of thousands of ancient pagodas",
	"TH": "Land of Smiles",
	"LA": "The only landlocked country in Southeast Asia",
	"KH": "Home of the largest religious monument in the world",
	"VN": "S-shaped country stretching along the South China Sea",
	"MY": "Famous for its twin towers",
	"SG": "City-state and one of Asia's four tiger economies",
	"ID": "World's largest archipelago nation",
	"PH": "Archipelago of over 7,000 islands",
	"BN": "Tiny oil-rich sultanate on Borneo",
	"TL": "Asia's youngest nation",
	"MN": "Land of the eternal blue sky",
	"KZ": "World's largest landlocked country",
	"KG": "Land of the Heavenly Mountains",
	"TJ": "Home to the Pamir Mountains, the Roof of the World",
	"UZ": "Heart of the ancient Silk Road",
	"TM": "Has a gas crater that has been burning since 1971",
	"AF": "The graveyard of empires",
	"IR": "Home of one of the world's oldest civilizations",
	"IQ": "Cradle of civilization, between the Tigris and Euphrates",
	"SY": "Home of Damascus, one of the world's oldest cities",
	"LB": "Paris of the Middle East",
	"JO": "Home of the Rose-Red city of Petra",
	"IL": "Holy land for three major religions",
	"PS": "Ancient land at the heart of the Middle East",
	"SA": "Birthplace of Islam",
	"YE": "Home of the ancient city of Sana'a",
	"OM": "Oldest independent state in the Arab world",
	"AE": "Home of the world's tallest building",
	"QA": "Hosted the 2022 FIFA World Cup",
	"BH": "Ancient pearl-diving civilization",
	"KW": "One of the world's wealthiest countries per capita",
	"GE": "Where Europe meets Asia in the Caucasus",
	"AM": "First country to adopt Christianity as a state religion",
	"AZ": "Land of Fire",
	"EG": "Land of the Pharaohs",
	"LY": "Largest country in Africa by area",
	"TN": "Northernmost country in Africa",
	"DZ": "Largest country in Africa",
	"MA": "Gateway between Europe and Africa",
	"SD": "Home of more ancient pyramids than Egypt",
	"SS": "World's newest country",
	"ET": "Only African country never colonized by Europeans",
	"ER": "One of Africa's newest countries",
	"DJ": "Smallest country in mainland Africa",
	"SO": "Has the longest coastline in mainland Africa",
	"KE": "Home of the Great Rift Valley",
	"UG": "Source of the mighty Nile River",
	"TZ": "Home of Africa's highest peak",
	"RW": "Land of a thousand hills",
	"BI": "One of Africa's most densely populated countries",
	"CD": "Home of the Congo rainforest, world's second largest",
	"CF": "Geographic heart of Africa",
	"CM": "Africa in miniature",
	"TD": "Home of Lake Chad, which is rapidly shrinking",
	"NE": "Over 80% of its territory is covered by the Sahara",
	"NG": "Most populous country in Africa",
	"BJ": "Birthplace of the Vodoun religion",
	"TG": "One of Africa's narrowest countries",
	"GH": "First sub-Saharan African country to gain independence",
	"CI": "World's largest cocoa producer",
	"LR": "Africa's oldest republic",
	"SL": "Famous for blood diamonds",
	"GN": "Has some of West Africa's highest peaks",
	"GW": "Famous for its Bijagós archipelago",
	"SN": "Westernmost country in mainland Africa",
	"GM": "Smallest country on the African mainland",
	"ML": "Home of the ancient city of Timbuktu",
	"BF": "Means Land of Incorruptible People",
	"MR": "Bridge between North and sub-Saharan Africa",
	"CV": "Archipelago off the northwest coast of Africa",
	"ZA": "Rainbow Nation with 11 official languages",
	"NA": "Home of the world's oldest desert",
	"BW": "Home of the Okavango Delta",
	"ZM": "Home of Victoria Falls",
	"ZW": "Home of the ancient Great Zimbabwe ruins",
	"MZ": "Coastline stretches over 2,500 km",
	"MW": "The warm heart of Africa",
	"MG": "90% of its wildlife is found nowhere else on Earth",
	"MU": "Where the dodo bird once lived",
	"SC": "Archipelago with giant tortoises",
	"KM": "Perfume islands of the Indian Ocean",
	"AO": "One of Africa's top oil producers",
	"ST": "Smallest African country after Seychelles",
	"GQ": "Only Spanish-speaking country in Africa",
	"GA": "80% covered by rainforest",
	"CG": "Named after the Congo River",
	"LS": "Entirely surrounded by South Africa",
	"SZ": "One of the world's last absolute monarchies",
	"AU": "The land Down Under",
	"NZ": "First country to give women the right to vote",
	"FJ": "More than 300 islands in the South Pacific",
	"PG": "Home to over 800 languages",
	"SB": "Site of fierce World War II battles",
	"VU": "Has one of the world's most accessible active volcanoes",
	"NC": "French territory famous for its lagoon",
	"PF": "French territory with the world's most beautiful islands",
	"WS": "The Cradle of Polynesia",
	"TO": "The last kingdom in the Pacific",
	"TV": "Its internet domain .tv earns most of its income",
	"NR": "World's smallest island nation",
	"KI": "Straddles the equator and the international date line",
	"MH": "Site of nuclear weapons testing after WWII",
	"FM": "Federated island nation in the western Pacific",
	"PW": "Famous for its jellyfish lake",
}

// CountryDifficulty — easy: globally iconic, medium: somewhat known, hard: obscure
var CountryDifficulty = map[string]string{
	"US": "easy", "CA": "easy", "MX": "easy", "BR": "easy",
	"AR": "easy", "FR": "easy", "DE": "easy", "IT": "easy",
	"ES": "easy", "GB": "easy", "JP": "easy", "CN": "easy",
	"IN": "easy", "AU": "easy", "RU": "easy", "EG": "easy",
	"ZA": "easy", "KR": "easy", "TR": "easy", "GR": "easy",
	"TH": "easy", "ID": "easy", "NG": "easy", "KE": "easy",
	"PE": "easy", "CO": "easy", "CL": "easy", "NL": "easy",
	"PT": "easy", "SE": "easy", "NO": "easy", "CH": "easy",
	"NZ": "easy", "SA": "easy", "AE": "easy", "MA": "easy",
	"VN": "easy", "PH": "easy", "PK": "easy", "IR": "easy",
	"SG": "easy", "CU": "easy", "JM": "easy",
	"PL": "medium", "CZ": "medium", "HU": "medium", "RO": "medium",
	"UA": "medium", "BE": "medium", "AT": "medium", "DK": "medium",
	"FI": "medium", "IE": "medium", "IS": "medium", "NP": "medium",
	"BD": "medium", "LK": "medium", "MM": "medium", "MY": "medium",
	"IQ": "medium", "JO": "medium", "IL": "medium", "ET": "medium",
	"TZ": "medium", "GH": "medium", "SN": "medium", "CM": "medium",
	"EC": "medium", "BO": "medium", "VE": "medium", "UY": "medium",
	"KZ": "medium", "UZ": "medium", "GE": "medium", "AM": "medium",
	"AZ": "medium", "HR": "medium", "RS": "medium", "BG": "medium",
	"SK": "medium", "LT": "medium", "LV": "medium", "EE": "medium",
	"TN": "medium", "DZ": "medium", "SD": "medium", "UG": "medium",
	"MG": "medium", "MZ": "medium", "AO": "medium", "FJ": "medium",
	"KH": "medium", "LA": "medium", "BT": "medium", "MN": "medium",
	"AF": "medium", "SY": "medium", "LB": "medium", "YE": "medium",
	"OM": "medium", "QA": "medium", "BH": "medium", "KW": "medium",
	"CI": "medium", "RW": "medium", "CD": "medium",
}

// EmojiClue is the shape sent to the frontend
type EmojiClue struct {
	ID         string   `json:"id"`
	Country    string   `json:"country"`
	Code       string   `json:"code"`
	Emojis     []string `json:"emojis"`
	Difficulty string   `json:"difficulty"`
	Hint       string   `json:"hint"`
}

// splitEmojis splits a packed emoji string into individual emoji elements.
// Handles multi-codepoint emojis (variation selectors, ZWJ sequences, flags).
func splitEmojis(s string) []string {
	var result []string
	runes := []rune(s)
	i := 0
	for i < len(runes) {
		if !utf8.ValidRune(runes[i]) {
			i++
			continue
		}
		emoji := string(runes[i])
		i++
		// Consume any combining codepoints attached to this emoji
		for i < len(runes) {
			next := runes[i]
			switch {
			case next == 0xFE0F, // variation selector-16
				next == 0x20E3,                     // combining enclosing keycap
				next == 0x200D,                     // zero width joiner
				next >= 0x1F3FB && next <= 0x1F3FF, // skin tone modifiers
				next >= 0x1F1E0 && next <= 0x1F1FF, // regional indicator letters (flags)
				next >= 0xE0000 && next <= 0xE007F: // tags (flag sequences)
				emoji += string(next)
				i++
			default:
				goto done
			}
		}
	done:
		result = append(result, emoji)
	}
	return result
}

func difficultyFor(code string) string {
	if d, ok := CountryDifficulty[code]; ok {
		return d
	}
	return "hard"
}

// GetEmojiCluesHandler serves GET /api/emoji/clues
func GetEmojiCluesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	var clues []EmojiClue
	i := 1
	for code, emojiStr := range EmojiMap {
		name, ok := CountryNames[code]
		if !ok {
			continue
		}
		hint := CountryHints[code] // empty string is fine if missing
		clues = append(clues, EmojiClue{
			ID:         fmt.Sprintf("%d", i),
			Country:    name,
			Code:       code,
			Emojis:     splitEmojis(emojiStr),
			Difficulty: difficultyFor(code),
			Hint:       hint,
		})
		i++
	}

	json.NewEncoder(w).Encode(clues)
}

// GetEmojiForCountry returns the raw emoji string for a country code
func GetEmojiForCountry(countryCode string) string {
	if emoji, ok := EmojiMap[countryCode]; ok {
		return emoji
	}
	return "🌍🗺️🌎"
}
