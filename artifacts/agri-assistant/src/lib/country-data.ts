export type ClimateZone = "tropical" | "arid" | "temperate" | "continental" | "mediterranean";
export type WeightUnit = "gram" | "kilogram" | "metric_ton";
export type TargetMarket = "local" | "regional" | "international";

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  currencyName: string;
  usdRate: number;
  climate: ClimateZone;
  commonCrops: string[];
  region: string;
}

export interface RegionEntry {
  name: string;
  code: string;
}

export const COUNTRIES: Country[] = [
  { code: "KE", name: "Kenya", flag: "🇰🇪", currency: "KES", currencySymbol: "KSh", currencyName: "Kenyan Shilling", usdRate: 130, climate: "tropical", commonCrops: ["Maize", "Tea", "Coffee", "Beans", "Wheat"], region: "East Africa" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", currency: "NGN", currencySymbol: "₦", currencyName: "Nigerian Naira", usdRate: 1600, climate: "tropical", commonCrops: ["Cassava", "Maize", "Sorghum", "Yam", "Rice"], region: "West Africa" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", currency: "GHS", currencySymbol: "₵", currencyName: "Ghanaian Cedi", usdRate: 15, climate: "tropical", commonCrops: ["Cocoa", "Maize", "Cassava", "Plantain", "Rice"], region: "West Africa" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹", currency: "ETB", currencySymbol: "Br", currencyName: "Ethiopian Birr", usdRate: 115, climate: "tropical", commonCrops: ["Coffee", "Teff", "Wheat", "Maize", "Sorghum"], region: "East Africa" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", currency: "ZAR", currencySymbol: "R", currencyName: "South African Rand", usdRate: 19, climate: "temperate", commonCrops: ["Maize", "Wheat", "Sugarcane", "Citrus", "Grapes"], region: "Southern Africa" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿", currency: "TZS", currencySymbol: "TSh", currencyName: "Tanzanian Shilling", usdRate: 2600, climate: "tropical", commonCrops: ["Maize", "Rice", "Coffee", "Sisal", "Cotton"], region: "East Africa" },
  { code: "UG", name: "Uganda", flag: "🇺🇬", currency: "UGX", currencySymbol: "USh", currencyName: "Ugandan Shilling", usdRate: 3800, climate: "tropical", commonCrops: ["Coffee", "Bananas", "Maize", "Beans", "Tea"], region: "East Africa" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", currency: "EGP", currencySymbol: "E£", currencyName: "Egyptian Pound", usdRate: 50, climate: "arid", commonCrops: ["Wheat", "Cotton", "Rice", "Sugarcane", "Maize"], region: "North Africa" },
  { code: "MA", name: "Morocco", flag: "🇲🇦", currency: "MAD", currencySymbol: "د.م.", currencyName: "Moroccan Dirham", usdRate: 10, climate: "mediterranean", commonCrops: ["Wheat", "Barley", "Olives", "Citrus", "Tomatoes"], region: "North Africa" },
  { code: "IN", name: "India", flag: "🇮🇳", currency: "INR", currencySymbol: "₹", currencyName: "Indian Rupee", usdRate: 84, climate: "tropical", commonCrops: ["Rice", "Wheat", "Cotton", "Sugarcane", "Tea"], region: "South Asia" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", currency: "PKR", currencySymbol: "Rs", currencyName: "Pakistani Rupee", usdRate: 280, climate: "arid", commonCrops: ["Wheat", "Rice", "Cotton", "Sugarcane", "Maize"], region: "South Asia" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", currency: "BDT", currencySymbol: "৳", currencyName: "Bangladeshi Taka", usdRate: 110, climate: "tropical", commonCrops: ["Rice", "Jute", "Wheat", "Tea", "Potatoes"], region: "South Asia" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", currency: "LKR", currencySymbol: "Rs", currencyName: "Sri Lankan Rupee", usdRate: 320, climate: "tropical", commonCrops: ["Tea", "Coconut", "Rubber", "Rice", "Spices"], region: "South Asia" },
  { code: "NP", name: "Nepal", flag: "🇳🇵", currency: "NPR", currencySymbol: "Rs", currencyName: "Nepalese Rupee", usdRate: 133, climate: "temperate", commonCrops: ["Rice", "Maize", "Wheat", "Millet", "Potatoes"], region: "South Asia" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", currency: "IDR", currencySymbol: "Rp", currencyName: "Indonesian Rupiah", usdRate: 16000, climate: "tropical", commonCrops: ["Rice", "Palm Oil", "Rubber", "Coffee", "Cocoa"], region: "Southeast Asia" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", currency: "PHP", currencySymbol: "₱", currencyName: "Philippine Peso", usdRate: 58, climate: "tropical", commonCrops: ["Rice", "Coconut", "Sugarcane", "Corn", "Bananas"], region: "Southeast Asia" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", currency: "THB", currencySymbol: "฿", currencyName: "Thai Baht", usdRate: 35, climate: "tropical", commonCrops: ["Rice", "Rubber", "Cassava", "Sugarcane", "Maize"], region: "Southeast Asia" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", currency: "VND", currencySymbol: "₫", currencyName: "Vietnamese Dong", usdRate: 25000, climate: "tropical", commonCrops: ["Rice", "Coffee", "Tea", "Rubber", "Sugarcane"], region: "Southeast Asia" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲", currency: "MMK", currencySymbol: "K", currencyName: "Myanmar Kyat", usdRate: 2100, climate: "tropical", commonCrops: ["Rice", "Beans", "Sugarcane", "Maize", "Sesame"], region: "Southeast Asia" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭", currency: "KHR", currencySymbol: "៛", currencyName: "Cambodian Riel", usdRate: 4100, climate: "tropical", commonCrops: ["Rice", "Cassava", "Maize", "Soybeans", "Vegetables"], region: "Southeast Asia" },
  { code: "CN", name: "China", flag: "🇨🇳", currency: "CNY", currencySymbol: "¥", currencyName: "Chinese Yuan", usdRate: 7.3, climate: "temperate", commonCrops: ["Rice", "Wheat", "Maize", "Soybeans", "Cotton"], region: "East Asia" },
  { code: "JP", name: "Japan", flag: "🇯🇵", currency: "JPY", currencySymbol: "¥", currencyName: "Japanese Yen", usdRate: 155, climate: "temperate", commonCrops: ["Rice", "Vegetables", "Fruits", "Tea", "Soybeans"], region: "East Asia" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", currency: "KRW", currencySymbol: "₩", currencyName: "South Korean Won", usdRate: 1350, climate: "temperate", commonCrops: ["Rice", "Barley", "Soybeans", "Vegetables", "Fruits"], region: "East Asia" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", currency: "BRL", currencySymbol: "R$", currencyName: "Brazilian Real", usdRate: 5, climate: "tropical", commonCrops: ["Soybeans", "Sugarcane", "Maize", "Coffee", "Cotton"], region: "South America" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", currency: "ARS", currencySymbol: "AR$", currencyName: "Argentine Peso", usdRate: 1000, climate: "temperate", commonCrops: ["Soybeans", "Wheat", "Maize", "Sunflower", "Barley"], region: "South America" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", currency: "MXN", currencySymbol: "MX$", currencyName: "Mexican Peso", usdRate: 17, climate: "tropical", commonCrops: ["Maize", "Beans", "Sorghum", "Wheat", "Avocado"], region: "North America" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", currency: "COP", currencySymbol: "COP$", currencyName: "Colombian Peso", usdRate: 4000, climate: "tropical", commonCrops: ["Coffee", "Flowers", "Bananas", "Sugarcane", "Rice"], region: "South America" },
  { code: "PE", name: "Peru", flag: "🇵🇪", currency: "PEN", currencySymbol: "S/", currencyName: "Peruvian Sol", usdRate: 3.7, climate: "tropical", commonCrops: ["Potatoes", "Maize", "Rice", "Coffee", "Asparagus"], region: "South America" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", currency: "USD", currencySymbol: "$", currencyName: "US Dollar", usdRate: 1, climate: "tropical", commonCrops: ["Bananas", "Cocoa", "Coffee", "Shrimp", "Roses"], region: "South America" },
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD", currencySymbol: "$", currencyName: "US Dollar", usdRate: 1, climate: "temperate", commonCrops: ["Maize", "Soybeans", "Wheat", "Cotton", "Rice"], region: "North America" },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD", currencySymbol: "CA$", currencyName: "Canadian Dollar", usdRate: 1.37, climate: "continental", commonCrops: ["Wheat", "Canola", "Barley", "Soybeans", "Maize"], region: "North America" },
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD", currencySymbol: "A$", currencyName: "Australian Dollar", usdRate: 1.55, climate: "arid", commonCrops: ["Wheat", "Barley", "Sugarcane", "Cotton", "Canola"], region: "Oceania" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", currency: "NZD", currencySymbol: "NZ$", currencyName: "New Zealand Dollar", usdRate: 1.65, climate: "temperate", commonCrops: ["Dairy", "Lamb", "Kiwifruit", "Apples", "Wine Grapes"], region: "Oceania" },
  { code: "FR", name: "France", flag: "🇫🇷", currency: "EUR", currencySymbol: "€", currencyName: "Euro", usdRate: 0.92, climate: "temperate", commonCrops: ["Wheat", "Barley", "Sugar Beet", "Grapes", "Sunflower"], region: "Europe" },
  { code: "DE", name: "Germany", flag: "🇩🇪", currency: "EUR", currencySymbol: "€", currencyName: "Euro", usdRate: 0.92, climate: "temperate", commonCrops: ["Wheat", "Barley", "Sugar Beet", "Potatoes", "Rapeseed"], region: "Europe" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", currencySymbol: "£", currencyName: "British Pound", usdRate: 0.79, climate: "temperate", commonCrops: ["Wheat", "Barley", "Potatoes", "Oil Seed Rape", "Sugar Beet"], region: "Europe" },
  { code: "IT", name: "Italy", flag: "🇮🇹", currency: "EUR", currencySymbol: "€", currencyName: "Euro", usdRate: 0.92, climate: "mediterranean", commonCrops: ["Grapes", "Olives", "Wheat", "Tomatoes", "Citrus"], region: "Europe" },
  { code: "ES", name: "Spain", flag: "🇪🇸", currency: "EUR", currencySymbol: "€", currencyName: "Euro", usdRate: 0.92, climate: "mediterranean", commonCrops: ["Olives", "Grapes", "Citrus", "Wheat", "Vegetables"], region: "Europe" },
  { code: "PL", name: "Poland", flag: "🇵🇱", currency: "PLN", currencySymbol: "zł", currencyName: "Polish Złoty", usdRate: 4.0, climate: "continental", commonCrops: ["Wheat", "Rye", "Potatoes", "Sugar Beet", "Rapeseed"], region: "Europe" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦", currency: "UAH", currencySymbol: "₴", currencyName: "Ukrainian Hryvnia", usdRate: 42, climate: "continental", commonCrops: ["Wheat", "Maize", "Sunflower", "Soybeans", "Barley"], region: "Europe" },
  { code: "RU", name: "Russia", flag: "🇷🇺", currency: "RUB", currencySymbol: "₽", currencyName: "Russian Ruble", usdRate: 90, climate: "continental", commonCrops: ["Wheat", "Barley", "Sunflower", "Soybeans", "Sugar Beet"], region: "Europe" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", currency: "TRY", currencySymbol: "₺", currencyName: "Turkish Lira", usdRate: 33, climate: "mediterranean", commonCrops: ["Wheat", "Cotton", "Hazelnuts", "Tomatoes", "Grapes"], region: "Middle East" },
  { code: "IR", name: "Iran", flag: "🇮🇷", currency: "IRR", currencySymbol: "﷼", currencyName: "Iranian Rial", usdRate: 42000, climate: "arid", commonCrops: ["Wheat", "Rice", "Barley", "Pistachios", "Dates"], region: "Middle East" },
  { code: "IQ", name: "Iraq", flag: "🇮🇶", currency: "IQD", currencySymbol: "IQD", currencyName: "Iraqi Dinar", usdRate: 1310, climate: "arid", commonCrops: ["Wheat", "Barley", "Rice", "Dates", "Vegetables"], region: "Middle East" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", currency: "SAR", currencySymbol: "SAR", currencyName: "Saudi Riyal", usdRate: 3.75, climate: "arid", commonCrops: ["Dates", "Wheat", "Vegetables", "Alfalfa", "Fruits"], region: "Middle East" },
  { code: "YE", name: "Yemen", flag: "🇾🇪", currency: "YER", currencySymbol: "﷼", currencyName: "Yemeni Rial", usdRate: 530, climate: "arid", commonCrops: ["Sorghum", "Millet", "Cotton", "Coffee", "Grapes"], region: "Middle East" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", currency: "ZWL", currencySymbol: "Z$", currencyName: "Zimbabwean Dollar", usdRate: 360, climate: "tropical", commonCrops: ["Maize", "Tobacco", "Cotton", "Soybeans", "Wheat"], region: "Southern Africa" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼", currency: "RWF", currencySymbol: "RF", currencyName: "Rwandan Franc", usdRate: 1300, climate: "tropical", commonCrops: ["Coffee", "Tea", "Bananas", "Beans", "Sorghum"], region: "East Africa" },
  { code: "ZM", name: "Zambia", flag: "🇿🇲", currency: "ZMW", currencySymbol: "ZK", currencyName: "Zambian Kwacha", usdRate: 27, climate: "tropical", commonCrops: ["Maize", "Tobacco", "Cotton", "Soybeans", "Wheat"], region: "Southern Africa" },
  { code: "MW", name: "Malawi", flag: "🇲🇼", currency: "MWK", currencySymbol: "MK", currencyName: "Malawian Kwacha", usdRate: 1730, climate: "tropical", commonCrops: ["Maize", "Tobacco", "Tea", "Sugarcane", "Groundnuts"], region: "Southern Africa" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿", currency: "MZN", currencySymbol: "MT", currencyName: "Mozambican Metical", usdRate: 64, climate: "tropical", commonCrops: ["Maize", "Cassava", "Cotton", "Tobacco", "Cashews"], region: "Southern Africa" },
  { code: "AO", name: "Angola", flag: "🇦🇴", currency: "AOA", currencySymbol: "Kz", currencyName: "Angolan Kwanza", usdRate: 850, climate: "tropical", commonCrops: ["Coffee", "Cassava", "Maize", "Cotton", "Sugarcane"], region: "Central Africa" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲", currency: "XAF", currencySymbol: "FCFA", currencyName: "CFA Franc BEAC", usdRate: 608, climate: "tropical", commonCrops: ["Cocoa", "Coffee", "Cotton", "Banana", "Cassava"], region: "Central Africa" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", currencySymbol: "FCFA", currencyName: "CFA Franc BCEAO", usdRate: 608, climate: "tropical", commonCrops: ["Cocoa", "Coffee", "Palm Oil", "Rubber", "Cashew"], region: "West Africa" },
  { code: "SN", name: "Senegal", flag: "🇸🇳", currency: "XOF", currencySymbol: "FCFA", currencyName: "CFA Franc BCEAO", usdRate: 608, climate: "arid", commonCrops: ["Groundnuts", "Millet", "Sorghum", "Maize", "Rice"], region: "West Africa" },
  { code: "ML", name: "Mali", flag: "🇲🇱", currency: "XOF", currencySymbol: "FCFA", currencyName: "CFA Franc BCEAO", usdRate: 608, climate: "arid", commonCrops: ["Millet", "Sorghum", "Cotton", "Rice", "Groundnuts"], region: "West Africa" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "XOF", currencySymbol: "FCFA", currencyName: "CFA Franc BCEAO", usdRate: 608, climate: "arid", commonCrops: ["Sorghum", "Millet", "Maize", "Cotton", "Groundnuts"], region: "West Africa" },
  { code: "SD", name: "Sudan", flag: "🇸🇩", currency: "SDG", currencySymbol: "SDG", currencyName: "Sudanese Pound", usdRate: 600, climate: "arid", commonCrops: ["Sorghum", "Millet", "Groundnuts", "Cotton", "Sesame"], region: "East Africa" },
  { code: "SS", name: "South Sudan", flag: "🇸🇸", currency: "SSP", currencySymbol: "SSP", currencyName: "South Sudanese Pound", usdRate: 1300, climate: "tropical", commonCrops: ["Sorghum", "Maize", "Groundnuts", "Sesame", "Cassava"], region: "East Africa" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬", currency: "MGA", currencySymbol: "Ar", currencyName: "Malagasy Ariary", usdRate: 4500, climate: "tropical", commonCrops: ["Rice", "Vanilla", "Cloves", "Coffee", "Cassava"], region: "East Africa" },
];

export const COUNTRY_REGIONS: Record<string, RegionEntry[]> = {
  KE: [
    { name: "Nairobi", code: "NBI" }, { name: "Central (Kiambu/Muranga)", code: "CEN" },
    { name: "Rift Valley", code: "RVP" }, { name: "Western (Kakamega)", code: "WST" },
    { name: "Nyanza (Kisumu)", code: "NYZ" }, { name: "Eastern (Machakos/Meru)", code: "EST" },
    { name: "Coast (Mombasa)", code: "CST" }, { name: "North Eastern", code: "NEP" },
  ],
  NG: [
    { name: "Lagos", code: "LA" }, { name: "Kano", code: "KN" },
    { name: "Ogun", code: "OG" }, { name: "Rivers", code: "RI" },
    { name: "Kaduna", code: "KD" }, { name: "Anambra", code: "AN" },
    { name: "Borno", code: "BO" }, { name: "Delta", code: "DE" },
    { name: "Enugu", code: "EN" }, { name: "Oyo", code: "OY" },
  ],
  GH: [
    { name: "Greater Accra", code: "GA" }, { name: "Ashanti", code: "AH" },
    { name: "Northern", code: "NP" }, { name: "Western", code: "WP" },
    { name: "Eastern", code: "EP" }, { name: "Central", code: "CP" },
    { name: "Brong-Ahafo", code: "BA" }, { name: "Upper East", code: "UE" },
  ],
  ET: [
    { name: "Oromia", code: "OR" }, { name: "Amhara", code: "AM" },
    { name: "Addis Ababa", code: "AA" }, { name: "Tigray", code: "TI" },
    { name: "SNNP", code: "SN" }, { name: "Sidama", code: "SI" },
    { name: "Afar", code: "AF" }, { name: "Somali", code: "SO" },
  ],
  ZA: [
    { name: "Gauteng", code: "GP" }, { name: "KwaZulu-Natal", code: "KZN" },
    { name: "Western Cape", code: "WC" }, { name: "Eastern Cape", code: "EC" },
    { name: "Limpopo", code: "LP" }, { name: "Mpumalanga", code: "MP" },
    { name: "North West", code: "NW" }, { name: "Free State", code: "FS" },
    { name: "Northern Cape", code: "NC" },
  ],
  TZ: [
    { name: "Dar es Salaam", code: "DS" }, { name: "Arusha", code: "AR" },
    { name: "Mwanza", code: "MW" }, { name: "Dodoma", code: "DO" },
    { name: "Mbeya", code: "MB" }, { name: "Kilimanjaro", code: "KI" },
    { name: "Tanga", code: "TA" }, { name: "Morogoro", code: "MO" },
  ],
  UG: [
    { name: "Central Region (Kampala)", code: "C" }, { name: "Eastern Region (Jinja)", code: "E" },
    { name: "Northern Region (Gulu)", code: "N" }, { name: "Western Region (Mbarara)", code: "W" },
    { name: "Buganda", code: "BU" }, { name: "Busoga", code: "BS" },
  ],
  EG: [
    { name: "Cairo", code: "C" }, { name: "Alexandria", code: "ALX" },
    { name: "Giza", code: "GZ" }, { name: "Luxor", code: "LX" },
    { name: "Aswan", code: "ASN" }, { name: "Delta Region", code: "DLT" },
    { name: "Sinai", code: "SNI" }, { name: "Upper Egypt", code: "UPE" },
  ],
  MA: [
    { name: "Casablanca-Settat", code: "CS" }, { name: "Rabat-Salé-Kénitra", code: "RSK" },
    { name: "Fès-Meknès", code: "FM" }, { name: "Marrakech-Safi", code: "MS" },
    { name: "Souss-Massa", code: "SM" }, { name: "Oriental", code: "ORI" },
    { name: "Tanger-Tétouan-Al Hoceïma", code: "TTA" },
  ],
  IN: [
    { name: "Punjab", code: "PB" }, { name: "Uttar Pradesh", code: "UP" },
    { name: "Maharashtra", code: "MH" }, { name: "Madhya Pradesh", code: "MP" },
    { name: "Rajasthan", code: "RJ" }, { name: "Andhra Pradesh", code: "AP" },
    { name: "Karnataka", code: "KA" }, { name: "Haryana", code: "HR" },
    { name: "West Bengal", code: "WB" }, { name: "Tamil Nadu", code: "TN" },
    { name: "Gujarat", code: "GJ" }, { name: "Bihar", code: "BR" },
    { name: "Telangana", code: "TS" }, { name: "Odisha", code: "OD" },
    { name: "Assam", code: "AS" },
  ],
  PK: [
    { name: "Punjab", code: "PB" }, { name: "Sindh", code: "SD" },
    { name: "Khyber Pakhtunkhwa", code: "KP" }, { name: "Balochistan", code: "BA" },
    { name: "Islamabad Capital Territory", code: "IS" }, { name: "Gilgit-Baltistan", code: "GB" },
  ],
  BD: [
    { name: "Dhaka", code: "DH" }, { name: "Chittagong", code: "CTG" },
    { name: "Rajshahi", code: "RAJ" }, { name: "Khulna", code: "KHU" },
    { name: "Sylhet", code: "SYL" }, { name: "Barisal", code: "BAR" },
    { name: "Rangpur", code: "RNG" }, { name: "Mymensingh", code: "MYM" },
  ],
  ID: [
    { name: "Java (Jakarta/Surabaya)", code: "JV" }, { name: "Sumatra", code: "SM" },
    { name: "Kalimantan", code: "KL" }, { name: "Sulawesi", code: "SL" },
    { name: "Bali & Nusa Tenggara", code: "BL" }, { name: "Papua", code: "PP" },
    { name: "Maluku", code: "ML" },
  ],
  PH: [
    { name: "Metro Manila (NCR)", code: "NCR" }, { name: "Central Luzon", code: "III" },
    { name: "CALABARZON", code: "IVA" }, { name: "Western Visayas", code: "VI" },
    { name: "Central Visayas (Cebu)", code: "VII" }, { name: "Davao Region", code: "XI" },
    { name: "Northern Mindanao", code: "X" }, { name: "Ilocos Region", code: "I" },
    { name: "Bicol Region", code: "V" },
  ],
  TH: [
    { name: "Bangkok", code: "BKK" }, { name: "Central Thailand", code: "C" },
    { name: "Northern Thailand (Chiang Mai)", code: "N" }, { name: "Northeast (Isan)", code: "NE" },
    { name: "Eastern Thailand", code: "E" }, { name: "Southern Thailand", code: "S" },
    { name: "Western Thailand", code: "W" },
  ],
  VN: [
    { name: "Hanoi & Red River Delta", code: "RRD" }, { name: "Ho Chi Minh City", code: "HCM" },
    { name: "Mekong Delta", code: "MKD" }, { name: "Central Highlands", code: "CH" },
    { name: "North Central Coast", code: "NCC" }, { name: "South Central Coast", code: "SCC" },
    { name: "Northeast", code: "NE" }, { name: "Northwest", code: "NW" },
  ],
  CN: [
    { name: "Henan", code: "HEN" }, { name: "Heilongjiang", code: "HLJ" },
    { name: "Shandong", code: "SD" }, { name: "Jilin", code: "JL" },
    { name: "Hebei", code: "HEB" }, { name: "Hunan", code: "HUN" },
    { name: "Hubei", code: "HUB" }, { name: "Sichuan", code: "SC" },
    { name: "Inner Mongolia", code: "NMG" }, { name: "Guangdong", code: "GD" },
    { name: "Jiangsu", code: "JS" }, { name: "Anhui", code: "AH" },
    { name: "Xinjiang", code: "XJ" }, { name: "Yunnan", code: "YN" },
  ],
  BR: [
    { name: "Mato Grosso", code: "MT" }, { name: "Paraná", code: "PR" },
    { name: "São Paulo", code: "SP" }, { name: "Rio Grande do Sul", code: "RS" },
    { name: "Goiás", code: "GO" }, { name: "Minas Gerais", code: "MG" },
    { name: "Mato Grosso do Sul", code: "MS" }, { name: "Bahia", code: "BA" },
    { name: "Maranhão", code: "MA" }, { name: "Pará", code: "PA" },
  ],
  AR: [
    { name: "Buenos Aires Province", code: "BA" }, { name: "Santa Fe", code: "SF" },
    { name: "Córdoba", code: "CB" }, { name: "Entre Ríos", code: "ER" },
    { name: "Chaco", code: "CH" }, { name: "Salta", code: "SA" },
    { name: "Santiago del Estero", code: "SE" }, { name: "Tucumán", code: "TU" },
  ],
  MX: [
    { name: "Sinaloa", code: "SIN" }, { name: "Sonora", code: "SON" },
    { name: "Jalisco", code: "JAL" }, { name: "Guanajuato", code: "GTO" },
    { name: "Michoacán", code: "MIC" }, { name: "Veracruz", code: "VER" },
    { name: "Tamaulipas", code: "TAM" }, { name: "Chihuahua", code: "CHI" },
    { name: "Puebla", code: "PUE" }, { name: "Hidalgo", code: "HGO" },
  ],
  CO: [
    { name: "Cundinamarca (Bogotá)", code: "CUN" }, { name: "Antioquia (Medellín)", code: "ANT" },
    { name: "Valle del Cauca (Cali)", code: "VAC" }, { name: "Nariño", code: "NAR" },
    { name: "Tolima", code: "TOL" }, { name: "Huila", code: "HUI" },
    { name: "Cauca", code: "CAU" }, { name: "Boyacá", code: "BOY" },
    { name: "Santander", code: "SAN" },
  ],
  US: [
    { name: "Iowa", code: "IA" }, { name: "Illinois", code: "IL" },
    { name: "Nebraska", code: "NE" }, { name: "Minnesota", code: "MN" },
    { name: "Indiana", code: "IN" }, { name: "Kansas", code: "KS" },
    { name: "California", code: "CA" }, { name: "Texas", code: "TX" },
    { name: "North Dakota", code: "ND" }, { name: "Ohio", code: "OH" },
    { name: "South Dakota", code: "SD" }, { name: "Montana", code: "MT" },
    { name: "Missouri", code: "MO" }, { name: "Washington", code: "WA" },
    { name: "Wisconsin", code: "WI" },
  ],
  CA: [
    { name: "Saskatchewan", code: "SK" }, { name: "Alberta", code: "AB" },
    { name: "Manitoba", code: "MB" }, { name: "Ontario", code: "ON" },
    { name: "Quebec", code: "QC" }, { name: "British Columbia", code: "BC" },
  ],
  AU: [
    { name: "New South Wales", code: "NSW" }, { name: "Victoria", code: "VIC" },
    { name: "Queensland", code: "QLD" }, { name: "Western Australia", code: "WA" },
    { name: "South Australia", code: "SA" }, { name: "Tasmania", code: "TAS" },
    { name: "Northern Territory", code: "NT" },
  ],
  FR: [
    { name: "Île-de-France", code: "IDF" }, { name: "Occitanie", code: "OCC" },
    { name: "Nouvelle-Aquitaine", code: "NAQ" }, { name: "Auvergne-Rhône-Alpes", code: "ARA" },
    { name: "Grand Est", code: "GRE" }, { name: "Hauts-de-France", code: "HDF" },
    { name: "Normandy", code: "NOR" }, { name: "Brittany", code: "BRE" },
    { name: "Burgundy-Franche-Comté", code: "BFC" }, { name: "Centre-Val de Loire", code: "CVL" },
  ],
  DE: [
    { name: "Bavaria (Bayern)", code: "BY" }, { name: "Lower Saxony", code: "NI" },
    { name: "North Rhine-Westphalia", code: "NW" }, { name: "Brandenburg", code: "BB" },
    { name: "Saxony-Anhalt", code: "ST" }, { name: "Mecklenburg-Vorpommern", code: "MV" },
    { name: "Saxony", code: "SN" }, { name: "Thuringia", code: "TH" },
    { name: "Rhineland-Palatinate", code: "RP" },
  ],
  GB: [
    { name: "England - East Midlands", code: "EML" }, { name: "England - East of England", code: "EEG" },
    { name: "England - Yorkshire", code: "YH" }, { name: "England - South West", code: "SW" },
    { name: "England - South East", code: "SE" }, { name: "Scotland", code: "SCT" },
    { name: "Wales", code: "WLS" }, { name: "Northern Ireland", code: "NIR" },
  ],
  UA: [
    { name: "Donetsk", code: "DN" }, { name: "Zaporizhzhia", code: "ZP" },
    { name: "Kharkiv", code: "KK" }, { name: "Dnipropetrovsk", code: "DP" },
    { name: "Poltava", code: "PL" }, { name: "Vinnytsia", code: "VI" },
    { name: "Khmelnytskyi", code: "KM" }, { name: "Kyiv Oblast", code: "KV" },
    { name: "Lviv", code: "LV" }, { name: "Zhytomyr", code: "ZT" },
  ],
  RU: [
    { name: "Krasnodar Krai", code: "KDA" }, { name: "Stavropol Krai", code: "STA" },
    { name: "Rostov Oblast", code: "ROS" }, { name: "Volgograd Oblast", code: "VGG" },
    { name: "Saratov Oblast", code: "SAR" }, { name: "Belgorod Oblast", code: "BEL" },
    { name: "Voronezh Oblast", code: "VOR" }, { name: "Kursk Oblast", code: "KRS" },
    { name: "Tambov Oblast", code: "TAM" }, { name: "West Siberia", code: "WSI" },
  ],
  TR: [
    { name: "Central Anatolia (Konya)", code: "CA" }, { name: "Southeast Anatolia (Şanlıurfa)", code: "SEA" },
    { name: "Aegean (İzmir)", code: "AEG" }, { name: "Mediterranean (Adana)", code: "MED" },
    { name: "Marmara (Istanbul)", code: "MAR" }, { name: "Black Sea Region", code: "BS" },
    { name: "Eastern Anatolia", code: "EA" },
  ],
};

export const CROP_OPTIONS = [
  { name: "Palay (Rice)", emoji: "🌾", category: "PH Staple Crops" },
  { name: "Mais (Corn)", emoji: "🌽", category: "PH Staple Crops" },
  { name: "Coconut", emoji: "🥥", category: "PH Staple Crops" },
  { name: "Sugarcane", emoji: "🎋", category: "PH Staple Crops" },
  { name: "Banana (Cavendish)", emoji: "🍌", category: "PH Staple Crops" },
  { name: "Mango", emoji: "🥭", category: "PH Staple Crops" },
  { name: "Pineapple", emoji: "🍍", category: "PH Staple Crops" },
  { name: "Cacao", emoji: "🍫", category: "PH Staple Crops" },
  { name: "Ampalaya (Bitter Gourd)", emoji: "🥒", category: "PH Vegetables" },
  { name: "Sitaw (String Beans)", emoji: "🫘", category: "PH Vegetables" },
  { name: "Pechay (Bok Choy)", emoji: "🥬", category: "PH Vegetables" },
  { name: "Kamote (Sweet Potato)", emoji: "🍠", category: "PH Vegetables" },
  { name: "Eggplant (Talong)", emoji: "🍆", category: "PH Vegetables" },
  { name: "Tomatoes", emoji: "🍅", category: "PH Vegetables" },
  { name: "Onions", emoji: "🧅", category: "PH Vegetables" },
  { name: "Garlic", emoji: "🧄", category: "PH Vegetables" },
  { name: "Okra", emoji: "🌿", category: "PH Vegetables" },
  { name: "Malunggay (Moringa)", emoji: "🌿", category: "PH Vegetables" },
  { name: "Calamansi", emoji: "🍋", category: "PH Vegetables" },
  { name: "Munggo (Mung Bean)", emoji: "🫘", category: "PH Vegetables" },
  { name: "Cassava (Kamoteng Kahoy)", emoji: "🥔", category: "PH Vegetables" },
  { name: "Abaca", emoji: "🌿", category: "PH High-Value Crops" },
  { name: "Coffee (Liberica/Arabica)", emoji: "☕", category: "PH High-Value Crops" },
  { name: "Asparagus", emoji: "🌿", category: "PH High-Value Crops" },
  { name: "Papaya", emoji: "🍈", category: "PH High-Value Crops" },
  { name: "Guava", emoji: "🍈", category: "PH High-Value Crops" },
  { name: "Lanzones", emoji: "🟡", category: "PH High-Value Crops" },
  { name: "Durian", emoji: "🟤", category: "PH High-Value Crops" },
  { name: "Rambutan", emoji: "🔴", category: "PH High-Value Crops" },
  { name: "Jackfruit (Langka)", emoji: "🟡", category: "PH High-Value Crops" },
  { name: "Rubber", emoji: "🌳", category: "PH High-Value Crops" },
  { name: "Maize", emoji: "🌽", category: "Cereals" },
  { name: "Wheat", emoji: "🌾", category: "Cereals" },
  { name: "Rice", emoji: "🍚", category: "Cereals" },
  { name: "Sorghum", emoji: "🌾", category: "Cereals" },
  { name: "Cassava", emoji: "🥔", category: "Tubers & Roots" },
  { name: "Yam", emoji: "🍠", category: "Tubers & Roots" },
  { name: "Sweet Potato", emoji: "🍠", category: "Tubers & Roots" },
  { name: "Potatoes", emoji: "🥔", category: "Tubers & Roots" },
  { name: "Beans", emoji: "🫘", category: "Legumes" },
  { name: "Soybeans", emoji: "🫘", category: "Legumes" },
  { name: "Groundnuts", emoji: "🥜", category: "Legumes" },
  { name: "Cowpeas", emoji: "🫘", category: "Legumes" },
  { name: "Chickpeas", emoji: "🫘", category: "Legumes" },
  { name: "Lentils", emoji: "🫘", category: "Legumes" },
  { name: "Pigeon Peas", emoji: "🫘", category: "Legumes" },
  { name: "Tomatoes", emoji: "🍅", category: "Vegetables" },
  { name: "Onions", emoji: "🧅", category: "Vegetables" },
  { name: "Garlic", emoji: "🧄", category: "Vegetables" },
  { name: "Kale", emoji: "🥬", category: "Vegetables" },
  { name: "Cabbage", emoji: "🥬", category: "Vegetables" },
  { name: "Spinach", emoji: "🥬", category: "Vegetables" },
  { name: "Carrots", emoji: "🥕", category: "Vegetables" },
  { name: "Eggplant", emoji: "🍆", category: "Vegetables" },
  { name: "Bell Pepper", emoji: "🫑", category: "Vegetables" },
  { name: "Chili Pepper", emoji: "🌶️", category: "Vegetables" },
  { name: "Cucumber", emoji: "🥒", category: "Vegetables" },
  { name: "Pumpkin", emoji: "🎃", category: "Vegetables" },
  { name: "Lettuce", emoji: "🥬", category: "Vegetables" },
  { name: "Broccoli", emoji: "🥦", category: "Vegetables" },
  { name: "Cauliflower", emoji: "🥦", category: "Vegetables" },
  { name: "Zucchini", emoji: "🥒", category: "Vegetables" },
  { name: "Avocado", emoji: "🥑", category: "Fruits" },
  { name: "Bananas", emoji: "🍌", category: "Fruits" },
  { name: "Mangoes", emoji: "🥭", category: "Fruits" },
  { name: "Citrus", emoji: "🍊", category: "Fruits" },
  { name: "Pineapple", emoji: "🍍", category: "Fruits" },
  { name: "Watermelon", emoji: "🍉", category: "Fruits" },
  { name: "Papaya", emoji: "🍈", category: "Fruits" },
  { name: "Grapes", emoji: "🍇", category: "Fruits" },
  { name: "Apples", emoji: "🍎", category: "Fruits" },
  { name: "Strawberries", emoji: "🍓", category: "Fruits" },
  { name: "Coconut", emoji: "🥥", category: "Fruits" },
  { name: "Guava", emoji: "🍈", category: "Fruits" },
  { name: "Passion Fruit", emoji: "🍈", category: "Fruits" },
  { name: "Coffee", emoji: "☕", category: "Cash Crops" },
  { name: "Tea", emoji: "🍵", category: "Cash Crops" },
  { name: "Cotton", emoji: "🪤", category: "Cash Crops" },
  { name: "Sugarcane", emoji: "🎋", category: "Cash Crops" },
  { name: "Tobacco", emoji: "🌿", category: "Cash Crops" },
  { name: "Cocoa", emoji: "🍫", category: "Cash Crops" },
  { name: "Rubber", emoji: "🌳", category: "Cash Crops" },
  { name: "Sisal", emoji: "🌿", category: "Cash Crops" },
  { name: "Jute", emoji: "🌿", category: "Cash Crops" },
  { name: "Sunflower", emoji: "🌻", category: "Oil Crops" },
  { name: "Canola (Rapeseed)", emoji: "🌼", category: "Oil Crops" },
  { name: "Palm Oil", emoji: "🌴", category: "Oil Crops" },
  { name: "Sesame", emoji: "🌿", category: "Oil Crops" },
  { name: "Flaxseed", emoji: "🌿", category: "Oil Crops" },
  { name: "Cashew", emoji: "🥜", category: "Nuts & Spices" },
  { name: "Macadamia", emoji: "🥜", category: "Nuts & Spices" },
  { name: "Vanilla", emoji: "🌿", category: "Nuts & Spices" },
  { name: "Black Pepper", emoji: "🌿", category: "Nuts & Spices" },
  { name: "Cardamom", emoji: "🌿", category: "Nuts & Spices" },
  { name: "Ginger", emoji: "🫚", category: "Nuts & Spices" },
  { name: "Turmeric", emoji: "🌿", category: "Nuts & Spices" },
];

export const WEIGHT_UNIT_LABELS: Record<WeightUnit, string> = {
  gram: "per gram",
  kilogram: "per kg",
  metric_ton: "per metric ton",
};

export const WEIGHT_UNIT_SHORT: Record<WeightUnit, string> = {
  gram: "g",
  kilogram: "kg",
  metric_ton: "MT",
};

export function convertFromTon(pricePerTon: number, unit: WeightUnit): number {
  switch (unit) {
    case "gram": return pricePerTon / 1_000_000;
    case "kilogram": return pricePerTon / 1_000;
    case "metric_ton": return pricePerTon;
  }
}

export function convertCurrency(usdAmount: number, toCurrency: string): number {
  const country = COUNTRIES.find(c => c.currency === toCurrency);
  if (!country) return usdAmount;
  return usdAmount * country.usdRate;
}

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

export function getCurrencySymbol(currency: string): string {
  const country = COUNTRIES.find(c => c.currency === currency);
  return country?.currencySymbol ?? currency;
}

export function getRegionsForCountry(countryCode: string): RegionEntry[] {
  return COUNTRY_REGIONS[countryCode] ?? [];
}
