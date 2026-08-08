import { useState, memo, useCallback } from "react";
import { useLocationStore } from "@/hooks/use-location";
import { useSettings } from "@/hooks/use-settings";
import { convertFromTon, convertCurrency, getCurrencySymbol, WEIGHT_UNIT_SHORT } from "@/lib/country-data";
import {
  useGetMarketPrices, getGetMarketPricesQueryKey,
  useGetMarketTrends, getGetMarketTrendsQueryKey,
  useGetMarketInsight, getGetMarketInsightQueryKey,
} from "@workspace/api-client-react";
import type { MarketPrice, MarketInsight } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowUpRight, ArrowDownRight, Minus, TrendingUp, AlertCircle,
  BarChart3, Scale, ChevronRight, Globe, MapPin, Sparkles,
  TrendingDown, Activity, Calendar, Loader2, CheckCircle2,
  AlertTriangle, Info
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { COUNTRIES } from "@/lib/country-data";

function TrendBadge({ trend, percent }: { trend: string; percent: number }) {
  switch (trend.toLowerCase()) {
    case "rising":
      return (
        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-xs">
          <ArrowUpRight className="h-3.5 w-3.5" /> +{Math.abs(percent).toFixed(1)}%
        </span>
      );
    case "falling":
      return (
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
          <ArrowDownRight className="h-3.5 w-3.5" /> -{Math.abs(percent).toFixed(1)}%
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          <Minus className="h-3.5 w-3.5" /> {Math.abs(percent).toFixed(1)}%
        </span>
      );
  }
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  if (confidence === "high") return (
    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
      <CheckCircle2 className="h-3 w-3" /> High confidence
    </span>
  );
  if (confidence === "medium") return (
    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
      <AlertTriangle className="h-3 w-3" /> Medium confidence
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
      <Info className="h-3 w-3" /> Low confidence
    </span>
  );
}

function InsightSection({ icon: Icon, title, children, accent }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  accent?: "local" | "global" | "future" | "season";
}) {
  const accentClass = accent === "local"
    ? "border-primary/30 bg-primary/5"
    : accent === "global"
    ? "border-blue-300/40 bg-blue-50/50 dark:bg-blue-950/20"
    : accent === "future"
    ? "border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20"
    : "border-muted";

  return (
    <div className={`rounded-xl border p-4 ${accentClass}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

function InsightDrawer({
  open,
  onClose,
  crop,
  location,
  country,
  currentLocalPrice,
  formatPrice,
  unitLabel,
  trend,
  changePercent,
}: {
  open: boolean;
  onClose: () => void;
  crop: string;
  location: string;
  country: string;
  currentLocalPrice: number;
  formatPrice: (p: number) => string;
  unitLabel: string;
  trend: string;
  changePercent: number;
}) {
  const { data: insight, isLoading, error } = useGetMarketInsight(
    { crop, location: location || undefined, country: country || undefined } as any,
    {
      query: {
        enabled: open && !!crop,
        queryKey: getGetMarketInsightQueryKey({ crop, location: location || undefined, country: country || undefined } as any),
        staleTime: 25 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
      }
    }
  );

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[520px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {crop} Market Insight
              </SheetTitle>
              {location && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {location}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-lg font-bold">{formatPrice(currentLocalPrice)}</div>
              <div className="text-xs text-muted-foreground">per {unitLabel}</div>
              <TrendBadge trend={trend} percent={changePercent} />
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-4">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-sm text-center">
                  <p className="font-medium text-foreground">Analyzing {crop} markets...</p>
                  <p className="text-xs mt-1">Checking local conditions, global trade data, and seasonal trends</p>
                </div>
              </div>
            )}

            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                <AlertCircle className="h-8 w-8 text-destructive/60" />
                <p className="text-sm">Failed to load market insight. Please try again.</p>
              </div>
            )}

            {insight && !isLoading && (
              <>
                {/* Price Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/60 p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">AI Estimated Price</div>
                    <div className="text-base font-bold">{formatPrice(insight.currentPrice ?? currentLocalPrice)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">per {unitLabel}</div>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">30-Day Change</div>
                    <div className={`text-base font-bold ${
                      (insight.changePercent ?? 0) > 0 ? "text-rose-600" :
                      (insight.changePercent ?? 0) < 0 ? "text-emerald-600" :
                      "text-muted-foreground"
                    }`}>
                      {(insight.changePercent ?? 0) > 0 ? "+" : ""}{(insight.changePercent ?? 0).toFixed(1)}%
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <ConfidenceBadge confidence={insight.confidence} />
                    </div>
                  </div>
                </div>

                {/* Key Drivers */}
                {insight.keyDrivers && insight.keyDrivers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Price Drivers</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {insight.keyDrivers.map((driver, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal px-2.5 py-1 rounded-full">
                          {driver}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Local Analysis — ALWAYS FIRST */}
                <InsightSection icon={MapPin} title={`${country || "Local"} Market Analysis`} accent="local">
                  {insight.localAnalysis}
                </InsightSection>

                {/* Seasonal Note */}
                {insight.seasonalNote && (
                  <InsightSection icon={Calendar} title="Seasonal Context" accent="season">
                    {insight.seasonalNote}
                  </InsightSection>
                )}

                {/* Global Analysis */}
                <InsightSection icon={Globe} title="Global Market Context" accent="global">
                  {insight.globalAnalysis}
                </InsightSection>

                {/* Future Outlook */}
                <InsightSection icon={TrendingUp} title="Price Outlook (4–8 Weeks)" accent="future">
                  {insight.futureOutlook}
                </InsightSection>

                <p className="text-[10px] text-muted-foreground text-center pb-2">
                  AI-generated analysis based on current agricultural market data. Generated {new Date(insight.generatedAt).toLocaleTimeString()}.
                  Always verify with local market sources before making financial decisions.
                </p>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

const PriceRow = memo(function PriceRow({
  item,
  formatPrice,
  unitShort,
  onInsight,
  primaryColumn,
}: {
  item: MarketPrice;
  formatPrice: (p: number) => string;
  unitShort: string;
  onInsight: (item: MarketPrice) => void;
  primaryColumn: "local" | "international";
}) {
  const primaryPrice = primaryColumn === "international" ? item.internationalPrice : item.localPrice;
  const secondaryPrice = primaryColumn === "international" ? item.localPrice : item.internationalPrice;
  const primaryLabel = primaryColumn === "international" ? "Int'l Price" : "Local Price";
  const secondaryLabel = primaryColumn === "international" ? "Local" : "Int'l";

  return (
    <tr className="hover:bg-muted/30 transition-colors group">
      <td className="px-4 py-3.5">
        <div className="font-semibold text-sm">{item.crop}</div>
        <div className="text-xs text-muted-foreground capitalize">{item.category}</div>
      </td>
      <td className="px-4 py-3.5">
        <div className="font-semibold text-sm">{formatPrice(primaryPrice)}</div>
        <div className="text-xs text-muted-foreground">{unitShort}</div>
      </td>
      <td className="px-4 py-3.5 text-muted-foreground text-sm">
        <div>{formatPrice(secondaryPrice)}</div>
        <div className="text-xs opacity-60">{secondaryLabel}</div>
      </td>
      <td className="px-4 py-3.5">
        <TrendBadge trend={item.trend} percent={item.changePercent} />
      </td>
      <td className="px-4 py-3.5 max-w-[200px] hidden lg:table-cell">
        <p className="text-xs text-muted-foreground line-clamp-2">{(item as any).aiInsight || "—"}</p>
      </td>
      <td className="px-4 py-3.5 text-right">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2.5 text-xs gap-1 text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onInsight(item)}
        >
          <Sparkles className="h-3 w-3" />
          Details
        </Button>
      </td>
    </tr>
  );
});

const MobilePriceCard = memo(function MobilePriceCard({
  item,
  formatPrice,
  unitShort,
  onInsight,
  primaryColumn,
}: {
  item: MarketPrice;
  formatPrice: (p: number) => string;
  unitShort: string;
  onInsight: (item: MarketPrice) => void;
  primaryColumn: "local" | "international";
}) {
  const primaryPrice = primaryColumn === "international" ? item.internationalPrice : item.localPrice;
  const secondaryPrice = primaryColumn === "international" ? item.localPrice : item.internationalPrice;
  const secondaryLabel = primaryColumn === "international" ? "Local" : "Int'l";

  return (
    <div className="bg-card border rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base">{item.crop}</div>
          <div className="text-xs text-muted-foreground capitalize mt-0.5">{item.category}</div>
          {(item as any).aiInsight && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {(item as any).aiInsight}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-lg">{formatPrice(primaryPrice)}</div>
          <div className="text-xs text-muted-foreground mb-0.5">{unitShort}</div>
          <div className="text-xs text-muted-foreground">{secondaryLabel}: {formatPrice(secondaryPrice)}</div>
          <TrendBadge trend={item.trend} percent={item.changePercent} />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t">
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
          onClick={() => onInsight(item)}
        >
          <Sparkles className="h-3.5 w-3.5" />
          View Market Insight
          <ChevronRight className="h-3.5 w-3.5 ml-auto" />
        </Button>
      </div>
    </div>
  );
});

export default function Market() {
  const { location } = useLocationStore();
  const { settings, unitLabel } = useSettings();
  const isMobile = useIsMobile();
  const [category, setCategory] = useState<string>("all");
  const [insightCrop, setInsightCrop] = useState<MarketPrice | null>(null);

  const locationStr = settings.cityName
    ? [settings.cityName, settings.regionName, settings.countryCode].filter(Boolean).join(", ")
    : location;

  const selectedCountry = COUNTRIES.find(c => c.code === settings.countryCode);

  const primaryColumn: "local" | "international" =
    settings.targetMarket === "international" ? "international" : "local";

  const priceParams = {
    ...(category !== "all" ? { category } : {}),
    ...(locationStr ? { location: locationStr } : {}),
  };

  const { data: prices, isLoading: isPricesLoading } = useGetMarketPrices(
    priceParams,
    { query: { queryKey: getGetMarketPricesQueryKey(priceParams), staleTime: 5 * 60 * 1000 } }
  );

  const { data: trends, isLoading: isTrendsLoading } = useGetMarketTrends(
    { query: { queryKey: getGetMarketTrendsQueryKey(), staleTime: 5 * 60 * 1000 } }
  );

  const currencySymbol = getCurrencySymbol(settings.currency);
  const unitShort = WEIGHT_UNIT_SHORT[settings.weightUnit];

  const formatPrice = useCallback((usdPerTon: number) => {
    const converted = convertCurrency(convertFromTon(usdPerTon, settings.weightUnit), settings.currency);
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: converted < 1 ? 4 : 0,
      maximumFractionDigits: converted < 1 ? 4 : 2,
    }).format(converted);
    return `${currencySymbol}${formatted}`;
  }, [settings.currency, settings.weightUnit, currencySymbol]);

  const handleInsight = useCallback((item: MarketPrice) => {
    setInsightCrop(item);
  }, []);

  const marketModeLabel =
    settings.targetMarket === "international"
      ? "International Commodities"
      : settings.targetMarket === "regional"
      ? "Regional Market"
      : "Local Market";

  const primaryColumnLabel =
    primaryColumn === "international" ? "Int'l Price" : "Local Price";
  const secondaryColumnLabel =
    primaryColumn === "international" ? "Local Price" : "Int'l Price";

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Prices</h1>
          <p className="text-muted-foreground mt-0.5 flex items-center gap-2 text-sm flex-wrap">
            AI-powered live price tracking
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
              <Scale className="h-3 w-3" /> {currencySymbol} / {unitShort}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              settings.targetMarket === "international"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                : settings.targetMarket === "regional"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            }`}>
              {settings.targetMarket === "international" ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
              {marketModeLabel}
            </span>
          </p>
        </div>
        <div className="w-full sm:w-52">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filter category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="cereals">Cereals & Grains</SelectItem>
              <SelectItem value="vegetables">Vegetables</SelectItem>
              <SelectItem value="fruits">Fruits</SelectItem>
              <SelectItem value="legumes">Legumes & Pulses</SelectItem>
              <SelectItem value="tubers">Tubers & Roots</SelectItem>
              <SelectItem value="cash">Cash Crops</SelectItem>
              <SelectItem value="oil">Oilseeds</SelectItem>
              <SelectItem value="nuts">Nuts & Spices</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Trend Summary Cards */}
      {(isTrendsLoading || trends) && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {isTrendsLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
          ) : trends ? (
            <>
              <Card className="bg-gradient-to-br from-card to-rose-50/30 dark:to-rose-950/10 border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-rose-500" /> Top Gainer
                  </div>
                  <div className="text-sm font-bold">{trends.topGainer}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-emerald-50/30 dark:to-emerald-950/10 border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                    <TrendingDown className="h-3.5 w-3.5 text-emerald-500" /> Top Loser
                  </div>
                  <div className="text-sm font-bold">{trends.topLoser}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-blue-50/30 dark:to-blue-950/10 border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-blue-500" /> Most Stable
                  </div>
                  <div className="text-sm font-bold">{trends.mostStable}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-amber-50/30 dark:to-amber-950/10 border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Sentiment
                  </div>
                  <div className="text-sm font-bold capitalize">{trends.marketSentiment}</div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* Price Table — Desktop */}
      {!isMobile && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Price Index</CardTitle>
              <CardDescription>
                {settings.currency}/{unitShort} · {marketModeLabel} · AI-adjusted for {locationStr || "your region"} · Click <Sparkles className="h-3 w-3 inline" /> Details for deep analysis
              </CardDescription>
            </div>
            {trends && (
              <div className="text-xs text-muted-foreground">
                Updated {new Date(trends.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {isPricesLoading ? (
              <div className="p-6 space-y-3">
                {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Crop</th>
                      <th className="px-4 py-3 font-medium">
                        <span className={primaryColumn === "international" ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}>
                          {primaryColumnLabel}
                        </span>
                      </th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{secondaryColumnLabel}</th>
                      <th className="px-4 py-3 font-medium">Trend</th>
                      <th className="px-4 py-3 font-medium hidden lg:table-cell">AI Insight</th>
                      <th className="px-4 py-3 font-medium text-right">Analysis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {prices?.map((item, i) => (
                      <PriceRow
                        key={`${item.crop}-${i}`}
                        item={item}
                        formatPrice={formatPrice}
                        unitShort={unitShort}
                        onInsight={handleInsight}
                        primaryColumn={primaryColumn}
                      />
                    ))}
                    {(!prices || prices.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                          No market data available for this category.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Price Cards — Mobile */}
      {isMobile && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Price Index</h2>
            {trends && (
              <span className="text-xs text-muted-foreground">
                {new Date(trends.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          {isPricesLoading ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
          ) : (
            <>
              {prices?.map((item, i) => (
                <MobilePriceCard
                  key={`${item.crop}-${i}`}
                  item={item}
                  formatPrice={formatPrice}
                  unitShort={unitShort}
                  onInsight={handleInsight}
                  primaryColumn={primaryColumn}
                />
              ))}
              {(!prices || prices.length === 0) && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No market data available for this category.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Market Insight Drawer */}
      <InsightDrawer
        open={!!insightCrop}
        onClose={() => setInsightCrop(null)}
        crop={insightCrop?.crop ?? ""}
        location={locationStr}
        country={selectedCountry?.name ?? ""}
        currentLocalPrice={
          primaryColumn === "international"
            ? (insightCrop?.internationalPrice ?? 0)
            : (insightCrop?.localPrice ?? 0)
        }
        formatPrice={formatPrice}
        unitLabel={unitLabel}
        trend={insightCrop?.trend ?? "stable"}
        changePercent={insightCrop?.changePercent ?? 0}
      />
    </div>
  );
}
