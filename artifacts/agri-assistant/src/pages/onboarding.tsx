import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sprout, MapPin, Building2, Wheat, Check,
  ArrowLeft, Search, Loader2, AlertCircle, TreePine, Banana,
  ChevronRight, Grid3x3, List, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-settings";
import { useLocationStore } from "@/hooks/use-location";

interface PSGCRegion {
  code: string;
  name: string;
  regionName: string;
  islandGroup: string;
}

interface PSGCProvince {
  code: string;
  name: string;
  regionCode: string;
}

interface PSGCCity {
  code: string;
  name: string;
  isCity: boolean;
  isMunicipality: boolean;
  isCapital: boolean;
  provinceCode: string | null;
}

interface PhCrop {
  id: number;
  cropName: string;
  localName: string | null;
  category: string;
  subCategory: string | null;
  emoji: string;
  growthDurationDays: string;
  waterRequirementLevel: string;
  notes: string | null;
}

const ISLAND_GROUP_LABELS: Record<string, string> = {
  luzon: "Luzon",
  visayas: "Visayas",
  mindanao: "Mindanao",
};
const ISLAND_GROUP_ORDER = ["Luzon", "Visayas", "Mindanao", "Other"];

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

const STEPS = [
  { id: 1, label: "Region", icon: MapPin },
  { id: 2, label: "Province", icon: MapPin },
  { id: 3, label: "City", icon: Building2 },
  { id: 4, label: "Crops", icon: Wheat },
];

export default function Onboarding() {
  const { completeOnboarding } = useSettings();
  const { setLocation } = useLocationStore();

  const [step, setStep] = useState(1);
  const [regionSearch, setRegionSearch] = useState("");
  const [provinceSearch, setProvinceSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [cropSearch, setCropSearch] = useState("");
  const [cropCategory, setCropCategory] = useState("all");
  const [cropView, setCropView] = useState<"grid" | "list">("grid");

  const [selectedRegion, setSelectedRegion] = useState<PSGCRegion | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<PSGCProvince | null>(null);
  const [selectedCity, setSelectedCity] = useState<(PSGCCity & { lat: number | null; lon: number | null }) | null>(null);
  const [selectedCrops, setSelectedCrops] = useState<PhCrop[]>([]);
  const [isGeocodingCity, setIsGeocodingCity] = useState(false);

  const { data: regions = [], isLoading: regionsLoading, error: regionsError } =
    useQuery<PSGCRegion[]>({
      queryKey: ["psgc-regions"],
      queryFn: () => fetchJSON("/api/psgc/regions"),
      staleTime: 7 * 24 * 60 * 60 * 1000,
    });

  const { data: provinces = [], isLoading: provincesLoading, error: provincesError } =
    useQuery<PSGCProvince[]>({
      queryKey: ["psgc-provinces", selectedRegion?.code],
      queryFn: () => fetchJSON(`/api/psgc/provinces?region_code=${selectedRegion!.code}`),
      enabled: !!selectedRegion && step === 2,
      staleTime: 7 * 24 * 60 * 60 * 1000,
    });

  const { data: cities = [], isLoading: citiesLoading, error: citiesError } =
    useQuery<PSGCCity[]>({
      queryKey: ["psgc-cities", selectedProvince?.code],
      queryFn: () => fetchJSON(`/api/psgc/cities?province_code=${selectedProvince!.code}`),
      enabled: !!selectedProvince && step === 3,
      staleTime: 7 * 24 * 60 * 60 * 1000,
    });

  const { data: allCrops = [], isLoading: cropsLoading } =
    useQuery<PhCrop[]>({
      queryKey: ["ph-crops"],
      queryFn: () => fetchJSON("/api/ph-crops"),
      staleTime: 24 * 60 * 60 * 1000,
    });

  const groupedRegions = useMemo(() => {
    const filtered = regions.filter(r =>
      r.name.toLowerCase().includes(regionSearch.toLowerCase()) ||
      r.regionName.toLowerCase().includes(regionSearch.toLowerCase())
    );
    const groups: Record<string, PSGCRegion[]> = {};
    for (const r of filtered) {
      const group = ISLAND_GROUP_LABELS[r.islandGroup] ?? "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(r);
    }
    return ISLAND_GROUP_ORDER
      .filter(g => groups[g])
      .reduce((acc, g) => { acc[g] = groups[g]; return acc; }, {} as Record<string, PSGCRegion[]>);
  }, [regions, regionSearch]);

  const filteredProvinces = useMemo(() =>
    provinces.filter(p => p.name.toLowerCase().includes(provinceSearch.toLowerCase())),
    [provinces, provinceSearch]
  );

  const filteredCities = useMemo(() =>
    cities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase())),
    [cities, citySearch]
  );

  const cropCategories = useMemo(() =>
    ["all", ...new Set(allCrops.map(c => c.category))],
    [allCrops]
  );

  const filteredCrops = useMemo(() => {
    let list = allCrops;
    if (cropCategory !== "all") list = list.filter(c => c.category === cropCategory);
    if (cropSearch) {
      const q = cropSearch.toLowerCase();
      list = list.filter(c =>
        c.cropName.toLowerCase().includes(q) ||
        (c.localName ?? "").toLowerCase().includes(q) ||
        (c.subCategory ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allCrops, cropCategory, cropSearch]);

  const handleRegionSelect = (region: PSGCRegion) => {
    setSelectedRegion(region);
    setSelectedProvince(null);
    setSelectedCity(null);
    setProvinceSearch("");
    setCitySearch("");
  };

  const handleProvinceSelect = (province: PSGCProvince) => {
    setSelectedProvince(province);
    setSelectedCity(null);
    setCitySearch("");
  };

  const handleCitySelect = useCallback(async (city: PSGCCity) => {
    setIsGeocodingCity(true);
    try {
      const res = await fetch(`/api/psgc/geocode?city=${encodeURIComponent(city.name)}`);
      const coords = res.ok ? await res.json() : null;
      setSelectedCity({ ...city, lat: coords?.lat ?? null, lon: coords?.lon ?? null });
    } catch {
      setSelectedCity({ ...city, lat: null, lon: null });
    }
    setIsGeocodingCity(false);
  }, []);

  const toggleCrop = (crop: PhCrop) => {
    setSelectedCrops(prev =>
      prev.find(c => c.id === crop.id)
        ? prev.filter(c => c.id !== crop.id)
        : [...prev, crop]
    );
  };

  const removeCrop = (id: number) => {
    setSelectedCrops(prev => prev.filter(c => c.id !== id));
  };

  const handleFinish = () => {
    const cityName = selectedCity?.name ?? "";
    const provinceName = selectedProvince?.name ?? "";
    const regionName = selectedRegion?.regionName ?? selectedRegion?.name ?? "";
    const locationParts = [cityName, provinceName, "Philippines"].filter(Boolean);
    const fullLocation = locationParts.join(", ");
    if (fullLocation) setLocation(fullLocation);

    completeOnboarding({
      countryCode: "PH",
      regionCode: selectedRegion?.code ?? "",
      regionName,
      provinceCode: selectedProvince?.code ?? "",
      provinceName,
      cityCode: selectedCity?.code ?? "",
      cityName,
      cityLat: selectedCity?.lat ?? null,
      cityLon: selectedCity?.lon ?? null,
      currency: "PHP",
      weightUnit: "kilogram",
      preferredCrops: selectedCrops.map(c => c.cropName),
      preferredCropIds: selectedCrops.map(c => c.id),
      targetMarket: "local",
    });
  };

  const canProceed =
    step === 1 ? !!selectedRegion :
    step === 2 ? !!selectedProvince :
    step === 3 ? true :
    selectedCrops.length > 0;

  const goNext = () => setStep(s => s + 1);
  const goBack = () => setStep(s => s - 1);

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-green-50 via-background to-emerald-50/50 dark:from-green-950/20 dark:via-background dark:to-emerald-950/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sprout className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-primary">AgriAssist</div>
              <div className="text-xs text-muted-foreground font-medium tracking-wide">Smart Farming Platform</div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
            <span className="text-base">🇵🇭</span>
            <span>Philippines · ₱ PHP · Official PSGC Data</span>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-1 mb-6">
          {STEPS.map((s, i) => {
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-1">
                <button
                  onClick={() => isDone ? setStep(s.id) : undefined}
                  disabled={!isDone}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive ? "bg-primary text-primary-foreground shadow-sm" :
                    isDone ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30" :
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-px transition-colors ${step > s.id ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-card border rounded-3xl shadow-xl overflow-hidden">

          {/* ─── STEP 1: REGION ─── */}
          {step === 1 && (
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl font-bold mb-1">Saang rehiyon ang iyong bukid?</h1>
              <p className="text-muted-foreground mb-5 text-sm">
                Select your region — sourced from the official PSGC (Philippine Standard Geographic Code) dataset.
              </p>

              {regionsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm">Loading regions from PSGC…</p>
                </div>
              ) : regionsError ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                  <p className="text-sm text-muted-foreground">Could not load PSGC regions. Check your connection.</p>
                </div>
              ) : (
                <>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text" placeholder="Search regions…"
                      value={regionSearch} onChange={e => setRegionSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background"
                      autoFocus
                    />
                  </div>
                  <div className="h-72 overflow-y-auto space-y-3 pr-1">
                    {Object.entries(groupedRegions).map(([group, groupRegions]) => (
                      <div key={group}>
                        <div className="flex items-center gap-2 mb-2 ml-1">
                          {group === "Luzon" && <TreePine className="h-3.5 w-3.5 text-green-600" />}
                          {group === "Visayas" && <span className="text-sm">🌊</span>}
                          {group === "Mindanao" && <Banana className="h-3.5 w-3.5 text-yellow-600" />}
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{group}</span>
                        </div>
                        <div className="space-y-1">
                          {groupRegions.map(r => {
                            const isSelected = selectedRegion?.code === r.code;
                            return (
                              <button key={r.code} onClick={() => handleRegionSelect(r)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all border ${
                                  isSelected ? "bg-primary/10 border-primary/30 text-primary" : "hover:bg-muted/60 border-transparent"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                    <MapPin className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm">{r.name}</div>
                                    {r.regionName !== r.name && <div className="text-xs text-muted-foreground">{r.regionName}</div>}
                                  </div>
                                </div>
                                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {Object.keys(groupedRegions).length === 0 && regionSearch && (
                      <p className="text-center text-muted-foreground text-sm py-8">No regions match "{regionSearch}"</p>
                    )}
                  </div>
                </>
              )}

              {selectedRegion && (
                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{selectedRegion.name}</div>
                    {selectedRegion.regionName !== selectedRegion.name && (
                      <div className="text-xs text-muted-foreground">{selectedRegion.regionName}</div>
                    )}
                  </div>
                  <Check className="h-4 w-4 text-primary shrink-0" />
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 2: PROVINCE ─── */}
          {step === 2 && (
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl font-bold mb-1">Select your province</h1>
              <p className="text-muted-foreground mb-5 text-sm">
                Official PSGC province data for <span className="font-medium text-foreground">{selectedRegion?.regionName ?? selectedRegion?.name}</span>.
              </p>

              {provincesLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm">Loading provinces for {selectedRegion?.name}…</p>
                </div>
              ) : provincesError || provinces.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                  <p className="text-sm text-muted-foreground">
                    {provinces.length === 0 && !provincesLoading
                      ? "This region has no separate provinces (e.g. NCR). You can skip to city selection."
                      : "Could not load provinces. You can skip this step."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text" placeholder={`Search ${provinces.length} provinces…`}
                      value={provinceSearch} onChange={e => setProvinceSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background"
                      autoFocus
                    />
                  </div>
                  <div className="h-72 overflow-y-auto space-y-1 pr-1">
                    {filteredProvinces.map(p => {
                      const isSelected = selectedProvince?.code === p.code;
                      return (
                        <button key={p.code} onClick={() => handleProvinceSelect(p)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all border ${
                            isSelected ? "bg-primary/10 border-primary/30 text-primary" : "hover:bg-muted/60 border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                              <MapPin className="h-4 w-4" />
                            </div>
                            <div className="font-medium text-sm">{p.name}</div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                    {filteredProvinces.length === 0 && provinceSearch && (
                      <p className="text-center text-muted-foreground text-sm py-8">No provinces match "{provinceSearch}"</p>
                    )}
                  </div>
                </>
              )}

              {selectedProvince && (
                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 text-sm font-semibold">{selectedProvince.name}</div>
                  <Check className="h-4 w-4 text-primary shrink-0" />
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 3: CITY / MUNICIPALITY ─── */}
          {step === 3 && (
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl font-bold mb-1">Select your city or municipality</h1>
              <p className="text-muted-foreground mb-5 text-sm">
                PSGC data for <span className="font-medium text-foreground">{selectedProvince?.name ?? selectedRegion?.name}</span>. Coordinates verified for weather accuracy.
              </p>

              {citiesLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm">Loading cities…</p>
                </div>
              ) : citiesError || cities.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                  <p className="text-sm text-muted-foreground">Could not load cities. You can skip — region data will be used.</p>
                </div>
              ) : (
                <>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text" placeholder={`Search ${cities.length} cities & municipalities…`}
                      value={citySearch} onChange={e => setCitySearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background"
                      autoFocus
                    />
                  </div>
                  <div className="h-72 overflow-y-auto space-y-1 pr-1">
                    {filteredCities.map(city => {
                      const isSelected = selectedCity?.code === city.code;
                      const isGeocoding = isGeocodingCity && isSelected;
                      return (
                        <button key={city.code} onClick={() => handleCitySelect(city)}
                          disabled={isGeocodingCity}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all border ${
                            isSelected ? "bg-primary/10 border-primary/30 text-primary" : "hover:bg-muted/60 border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                              {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{city.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {city.isCapital ? "Provincial Capital · " : ""}
                                {city.isCity ? "City" : "Municipality"}
                              </div>
                            </div>
                          </div>
                          {isSelected && !isGeocoding && (
                            <div className="flex items-center gap-1.5">
                              {selectedCity?.lat != null && (
                                <span className="text-xs text-primary/60 hidden sm:inline">GPS ✓</span>
                              )}
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {filteredCities.length === 0 && citySearch && (
                      <p className="text-center text-muted-foreground text-sm py-8">No cities match "{citySearch}"</p>
                    )}
                  </div>
                </>
              )}

              {selectedCity ? (
                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{selectedCity.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedProvince?.name} · {selectedRegion?.regionName ?? selectedRegion?.name} · Philippines
                      {selectedCity.lat != null && <span className="ml-2 text-primary/60">· GPS verified</span>}
                    </div>
                  </div>
                  <Check className="h-4 w-4 text-primary ml-auto shrink-0" />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  City selection is optional — province-level data will be used if skipped.
                </p>
              )}
            </div>
          )}

          {/* ─── STEP 4: CROPS ─── */}
          {step === 4 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between mb-1 gap-2">
                <h1 className="text-2xl font-bold">Anong mga pananim mo?</h1>
                <button
                  onClick={() => setCropView(v => v === "grid" ? "list" : "grid")}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0 mt-1"
                >
                  {cropView === "grid" ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-muted-foreground mb-4 text-sm">
                Choose the crops you farm from the Philippine crop database. Select at least one to personalize your experience.
              </p>

              {/* Selected crops chips */}
              {selectedCrops.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4 p-3 bg-primary/5 rounded-xl border border-primary/20">
                  {selectedCrops.map(c => (
                    <span key={c.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/15 text-primary text-xs font-medium">
                      {c.emoji} {c.cropName}
                      <button onClick={() => removeCrop(c.id)} className="ml-0.5 hover:text-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search + category filter */}
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text" placeholder="Search crops…"
                    value={cropSearch} onChange={e => setCropSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Category tabs */}
              <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
                {cropCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCropCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      cropCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {cat === "all" ? "All Crops" : cat}
                  </button>
                ))}
              </div>

              {cropsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className={`h-64 overflow-y-auto pr-1 ${cropView === "grid" ? "grid grid-cols-2 sm:grid-cols-3 gap-2 content-start" : "space-y-1"}`}>
                  {filteredCrops.map(crop => {
                    const isSelected = selectedCrops.some(c => c.id === crop.id);
                    if (cropView === "grid") {
                      return (
                        <button
                          key={crop.id}
                          onClick={() => toggleCrop(crop)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-all border ${
                            isSelected
                              ? "bg-primary/10 border-primary/40 text-primary font-medium"
                              : "bg-muted/30 border-transparent hover:bg-muted/60"
                          }`}
                        >
                          <span className="text-lg leading-none">{crop.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-xs font-medium">{crop.cropName}</div>
                            {crop.localName && <div className="truncate text-[10px] text-muted-foreground">{crop.localName}</div>}
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                        </button>
                      );
                    }
                    return (
                      <button
                        key={crop.id}
                        onClick={() => toggleCrop(crop)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border ${
                          isSelected
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "hover:bg-muted/60 border-transparent"
                        }`}
                      >
                        <span className="text-xl leading-none">{crop.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{crop.cropName}</div>
                          <div className="text-xs text-muted-foreground">
                            {crop.localName && <span>{crop.localName} · </span>}
                            {crop.growthDurationDays} days
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                  {filteredCrops.length === 0 && (
                    <p className="col-span-3 text-center text-muted-foreground text-sm py-8">
                      {cropSearch ? `No crops match "${cropSearch}"` : "No crops in this category"}
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-3 text-center">
                {selectedCrops.length === 0
                  ? "Select at least 1 crop to continue"
                  : `${selectedCrops.length} crop${selectedCrops.length !== 1 ? "s" : ""} selected · ${allCrops.length} total in database`}
              </p>
            </div>
          )}

          {/* Footer Nav */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button variant="outline" onClick={goBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < STEPS.length ? (
              <Button onClick={goNext} disabled={!canProceed} className="gap-2 ml-auto">
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={selectedCrops.length === 0}
                className="gap-2 ml-auto bg-green-600 hover:bg-green-700 text-white"
              >
                <Sprout className="h-4 w-4" />
                Start Farming
              </Button>
            )}
          </div>
        </div>

        {/* Location summary pill shown from step 2+ */}
        {step >= 2 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-full bg-muted/60">🇵🇭 Philippines (fixed)</span>
            {selectedRegion && (
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                <Check className="h-2.5 w-2.5" /> {selectedRegion.name}
              </span>
            )}
            {selectedProvince && step >= 3 && (
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                <Check className="h-2.5 w-2.5" /> {selectedProvince.name}
              </span>
            )}
            {selectedCity && step >= 4 && (
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                <Check className="h-2.5 w-2.5" /> {selectedCity.name}
              </span>
            )}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground/60 mt-4">
          Location data sourced from PSA PSGC · Crop data from DA Philippines
        </p>
      </div>
    </div>
  );
}
