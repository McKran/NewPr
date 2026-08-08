import { Router } from "express";

const router = Router();

const geoCache = new Map<string, { data: any[]; ts: number }>();
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000;

const COUNTRY_CITY_SEEDS: Record<string, string[]> = {
  KE: ["Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Kakamega","Nyeri","Meru"],
  NG: ["Lagos","Kano","Ibadan","Abuja","Port Harcourt","Benin City","Kaduna","Enugu","Onitsha"],
  GH: ["Accra","Kumasi","Tamale","Sekondi","Cape Coast","Sunyani","Koforidua"],
  ET: ["Addis Ababa","Dire Dawa","Gondar","Mek'ele","Hawassa","Bahir Dar","Jimma","Adama"],
  ZA: ["Johannesburg","Cape Town","Durban","Pretoria","Port Elizabeth","Bloemfontein","Polokwane"],
  TZ: ["Dar es Salaam","Mwanza","Arusha","Dodoma","Mbeya","Morogoro","Tanga","Zanzibar"],
  UG: ["Kampala","Gulu","Lira","Jinja","Mbarara","Mbale","Masaka","Fort Portal"],
  EG: ["Cairo","Alexandria","Giza","Luxor","Aswan","Port Said","Mansoura","Tanta"],
  MA: ["Casablanca","Rabat","Fez","Marrakesh","Agadir","Tangier","Meknes","Oujda"],
  IN: ["Mumbai","Delhi","Bangalore","Kolkata","Chennai","Hyderabad","Pune","Ahmedabad","Jaipur","Lucknow"],
  PK: ["Karachi","Lahore","Faisalabad","Rawalpindi","Islamabad","Multan","Peshawar","Quetta"],
  BD: ["Dhaka","Chittagong","Rajshahi","Khulna","Sylhet","Barisal","Rangpur","Comilla"],
  ID: ["Jakarta","Surabaya","Bandung","Medan","Makassar","Semarang","Palembang","Denpasar"],
  PH: ["Manila","Cebu","Davao","Quezon City","Zamboanga","General Santos","Cagayan de Oro","Iloilo"],
  TH: ["Bangkok","Chiang Mai","Pattaya","Nonthaburi","Nakhon Ratchasima","Hat Yai","Udon Thani"],
  VN: ["Ho Chi Minh City","Hanoi","Da Nang","Hai Phong","Can Tho","Bien Hoa","Nha Trang","Hue"],
  CN: ["Beijing","Shanghai","Guangzhou","Shenzhen","Chengdu","Wuhan","Chongqing","Tianjin","Xi'an"],
  BR: ["São Paulo","Rio de Janeiro","Belo Horizonte","Salvador","Fortaleza","Curitiba","Recife","Manaus"],
  AR: ["Buenos Aires","Córdoba","Rosario","Mendoza","Tucumán","La Plata","Mar del Plata","Salta"],
  MX: ["Mexico City","Guadalajara","Monterrey","Puebla","Tijuana","Juárez","León","Torreón","Culiacán"],
  CO: ["Bogotá","Medellín","Cali","Barranquilla","Cartagena","Cúcuta","Bucaramanga","Pereira"],
  US: ["Chicago","Houston","Phoenix","Los Angeles","Dallas","San Antonio","New York","Philadelphia","San Diego","Kansas City","Omaha","Fargo","Sioux Falls","Des Moines"],
  CA: ["Toronto","Montreal","Vancouver","Calgary","Edmonton","Ottawa","Winnipeg","Quebec City","Saskatoon","Regina"],
  AU: ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast","Canberra","Hobart","Darwin"],
  FR: ["Paris","Marseille","Lyon","Toulouse","Nice","Nantes","Strasbourg","Montpellier","Bordeaux","Lille"],
  DE: ["Berlin","Hamburg","Munich","Cologne","Frankfurt","Stuttgart","Düsseldorf","Leipzig","Dortmund","Nuremberg"],
  GB: ["London","Birmingham","Manchester","Leeds","Glasgow","Bristol","Sheffield","Edinburgh","Liverpool"],
  UA: ["Kyiv","Kharkiv","Odessa","Dnipro","Donetsk","Zaporizhzhia","Lviv","Vinnytsia","Poltava"],
  RU: ["Moscow","Saint Petersburg","Krasnodar","Novosibirsk","Yekaterinburg","Rostov","Volgograd","Stavropol"],
  TR: ["Istanbul","Ankara","Izmir","Adana","Bursa","Gaziantep","Konya","Mersin","Antalya"],
  IR: ["Tehran","Mashhad","Isfahan","Karaj","Tabriz","Shiraz","Ahvaz","Qom","Kermanshah"],
  SA: ["Riyadh","Jeddah","Mecca","Medina","Dammam","Tabuk","Abha","Buraidah"],
  PL: ["Warsaw","Kraków","Łódź","Wrocław","Poznań","Gdańsk","Szczecin","Bydgoszcz"],
  ZW: ["Harare","Bulawayo","Chitungwiza","Mutare","Gweru","Kwekwe","Kadoma","Masvingo"],
  RW: ["Kigali","Butare","Gitarama","Ruhengeri","Gisenyi","Byumba"],
  ZM: ["Lusaka","Ndola","Kitwe","Kabwe","Chipata","Livingstone","Mufulira"],
  MW: ["Lilongwe","Blantyre","Mzuzu","Zomba","Kasungu","Mangochi","Karonga"],
  MZ: ["Maputo","Beira","Nampula","Matola","Chimoio","Nacala","Quelimane"],
  AO: ["Luanda","Huambo","Lobito","Benguela","Kuito","Lubango","Malanje"],
  CM: ["Yaoundé","Douala","Bamenda","Maroua","Garoua","Bafoussam","Ngaoundéré"],
  CI: ["Abidjan","Bouaké","Daloa","Yamoussoukro","Korhogo","San-Pédro"],
  SN: ["Dakar","Touba","Thiès","Kaolack","Ziguinchor","Saint-Louis"],
  ML: ["Bamako","Sikasso","Ségou","Mopti","Koutiala","Kayes"],
  BF: ["Ouagadougou","Bobo-Dioulasso","Koudougou","Banfora","Ouahigouya"],
  SD: ["Khartoum","Omdurman","Kassala","Port Sudan","Nyala","El Obeid","Kosti"],
  SS: ["Juba","Wau","Malakal","Bentiu","Rumbek","Yambio"],
  MG: ["Antananarivo","Toamasina","Antsirabe","Fianarantsoa","Mahajanga","Toliara"],
  LK: ["Colombo","Kandy","Galle","Jaffna","Negombo","Anuradhapura","Ratnapura"],
  NP: ["Kathmandu","Pokhara","Lalitpur","Bharatpur","Biratnagar","Birganj","Dharan"],
  MM: ["Yangon","Mandalay","Naypyidaw","Bago","Mawlamyine","Taunggyi","Sittwe"],
  KH: ["Phnom Penh","Siem Reap","Battambang","Sihanoukville","Kampong Cham","Poipet"],
  KR: ["Seoul","Busan","Incheon","Daegu","Daejeon","Gwangju","Suwon","Ulsan"],
  JP: ["Tokyo","Osaka","Nagoya","Sapporo","Fukuoka","Kobe","Kyoto","Kawasaki"],
  IT: ["Rome","Milan","Naples","Turin","Palermo","Genoa","Bologna","Florence"],
  ES: ["Madrid","Barcelona","Valencia","Seville","Zaragoza","Málaga","Murcia","Bilbao"],
  NZ: ["Auckland","Wellington","Christchurch","Hamilton","Tauranga","Dunedin","Palmerston North"],
  PE: ["Lima","Arequipa","Trujillo","Chiclayo","Piura","Iquitos","Cusco","Huancayo"],
  EC: ["Guayaquil","Quito","Cuenca","Santo Domingo","Machala","Durán","Manta"],
  IQ: ["Baghdad","Basra","Mosul","Erbil","Kirkuk","Sulaymaniyah","Najaf"],
  YE: ["Sana'a","Aden","Taiz","Al Hudaydah","Ibb","Dhamar","Mukalla"],
};

function getSeedCities(countryCode: string, countryName: string): string[] {
  const known = COUNTRY_CITY_SEEDS[countryCode];
  if (known) return known;
  return [countryName];
}

interface OpenMeteoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code: string;
  country: string;
  admin1?: string;
  admin2?: string;
  population?: number;
}

async function fetchFromOpenMeteo(query: string, countryCode: string): Promise<OpenMeteoResult[]> {
  if (!query || query.length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=100&language=en&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data: any = await res.json();
    return (data.results ?? []).filter(
      (r: OpenMeteoResult) => r.country_code?.toUpperCase() === countryCode.toUpperCase()
    );
  } catch {
    return [];
  }
}

async function getRegionsForCountry(countryCode: string, countryName: string): Promise<{ name: string; code: string }[]> {
  const cacheKey = `regions_${countryCode}`.toLowerCase();
  const cached = geoCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < GEO_CACHE_TTL) return cached.data as any;

  const regionMap = new Map<string, number>();

  const addResults = (items: OpenMeteoResult[]) => {
    for (const item of items) {
      if (item.admin1) {
        regionMap.set(item.admin1, (regionMap.get(item.admin1) ?? 0) + (item.population ?? 0));
      }
    }
  };

  const seeds = getSeedCities(countryCode, countryName);
  const batchSize = 6;
  for (let i = 0; i < seeds.length; i += batchSize) {
    const batch = seeds.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(q => fetchFromOpenMeteo(q, countryCode)));
    results.forEach(addResults);
  }

  const regions = Array.from(regionMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name], i) => ({ name, code: name.slice(0, 3).toUpperCase() + i }));

  if (regions.length > 0) {
    geoCache.set(cacheKey, { data: regions, ts: Date.now() });
  }

  return regions;
}

async function searchCitiesInRegion(countryCode: string, region: string): Promise<any[]> {
  const cacheKey = `cities_${countryCode}_${region}`.toLowerCase();
  const cached = geoCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < GEO_CACHE_TTL) return cached.data;

  const results: Map<string, any> = new Map();

  const regionWords = region ? region.split(/\s+/).filter(w => w.length >= 3) : [];
  const seeds = getSeedCities(countryCode, countryCode);
  const seedPrefixes = seeds.slice(0, 8).map(s => s.slice(0, 4));
  const queries = region
    ? [...new Set([region, ...regionWords, ...seedPrefixes])]
    : seedPrefixes;

  const queryPromises = queries.map(q => fetchFromOpenMeteo(q, countryCode));
  const allResults = await Promise.all(queryPromises);

  for (const items of allResults) {
    for (const item of items) {
      if (region && item.admin1) {
        const regionLower = region.toLowerCase();
        const admin1Lower = item.admin1.toLowerCase();
        if (!admin1Lower.includes(regionLower) && !regionLower.includes(admin1Lower)) continue;
      }
      const key = item.name.toLowerCase();
      if (!results.has(key)) {
        results.set(key, {
          name: item.name,
          lat: item.latitude,
          lon: item.longitude,
          country_code: item.country_code,
          admin1: item.admin1 ?? region ?? "",
          population: item.population ?? 0,
        });
      }
    }
  }

  const sorted = Array.from(results.values()).sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
  const top = sorted.slice(0, 60);

  if (top.length > 0) {
    geoCache.set(cacheKey, { data: top, ts: Date.now() });
  }

  return top;
}

router.get("/geo/regions", async (req, res) => {
  const countryCode = (req.query.country_code as string ?? "").toUpperCase();
  const countryName = (req.query.country_name as string ?? "").trim();

  if (!countryCode) {
    res.status(400).json({ error: "country_code is required" });
    return;
  }

  try {
    const regions = await getRegionsForCountry(countryCode, countryName || countryCode);
    res.json(regions);
  } catch (err) {
    req.log.error({ err }, "Error fetching geo regions");
    res.json([]);
  }
});

router.get("/geo/cities", async (req, res) => {
  const countryCode = (req.query.country_code as string ?? "").toUpperCase();
  const region = (req.query.region as string ?? "").trim();

  if (!countryCode) {
    res.status(400).json({ error: "country_code is required" });
    return;
  }

  try {
    const cities = await searchCitiesInRegion(countryCode, region);

    if (cities.length > 0) {
      res.json(cities);
      return;
    }

    const fallbackItems = await fetchFromOpenMeteo(region || countryCode.slice(0, 2), countryCode);
    if (fallbackItems.length > 0) {
      const mapped = fallbackItems.map(r => ({
        name: r.name,
        lat: r.latitude,
        lon: r.longitude,
        country_code: r.country_code,
        admin1: r.admin1 ?? region,
        population: r.population ?? 0,
      }));
      res.json(mapped);
      return;
    }

    res.json([]);
  } catch (err) {
    req.log.error({ err }, "Error fetching geo cities");
    res.json([]);
  }
});

export default router;
