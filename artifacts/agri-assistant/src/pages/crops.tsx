import { useLocationStore } from "@/hooks/use-location";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useGetCropRecommendations, getGetCropRecommendationsQueryKey,
  useGetCropCalendar, getGetCropCalendarQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Info, Sprout, TrendingUp, AlertTriangle, ChevronDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Crops() {
  const { location } = useLocationStore();
  const isMobile = useIsMobile();
  const currentMonth = new Date().getMonth() + 1;
  const currentSeason = currentMonth > 2 && currentMonth < 6 ? "Long Rains" : "Short Rains";

  const { data: recommendations, isLoading: isRecsLoading } = useGetCropRecommendations(
    { location, season: currentSeason },
    { query: { queryKey: getGetCropRecommendationsQueryKey({ location, season: currentSeason }) } }
  );

  const { data: calendar, isLoading: isCalendarLoading } = useGetCropCalendar(
    { month: currentMonth },
    { query: { queryKey: getGetCropCalendarQueryKey({ month: currentMonth }) } }
  );

  if (isRecsLoading || isCalendarLoading) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-xl mt-2" />
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
      </div>
    );
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "low": return "bg-primary/20 text-primary";
      case "medium": return "bg-amber-500/20 text-amber-700 dark:text-amber-400";
      case "high": return "bg-destructive/20 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "text-destructive";
      case "medium": return "text-amber-500";
      case "low": return "text-primary";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Crop Planning</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Recommendations for {location} · {currentSeason} Season
        </p>
      </div>

      {isMobile ? (
        /* ── Mobile: single column, calendar at bottom ── */
        <div className="space-y-5">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Sprout className="h-4 w-4" /> Recommended Crops
          </h2>

          <Accordion type="single" collapsible className="space-y-3" defaultValue="rec-0">
            {recommendations?.map((crop, i) => (
              <AccordionItem key={i} value={`rec-${i}`} className="border rounded-2xl bg-card overflow-hidden shadow-sm">
                <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/40 data-[state=open]:bg-muted/40 transition-colors [&>svg]:hidden">
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl shrink-0">
                      {crop.icon}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-semibold">{crop.cropName}</div>
                      <div className="text-xs text-muted-foreground">Suitability: {crop.suitability}</div>
                    </div>
                    <Badge variant="secondary" className={`${getRiskColor(crop.riskLevel)} text-xs shrink-0`}>
                      {crop.riskLevel}
                    </Badge>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0 ml-1" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0">
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="p-3 bg-background rounded-xl border">
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <TrendingUp className="h-3 w-3" /> Yield
                      </div>
                      <div className="text-sm font-semibold">{crop.estimatedYield}</div>
                    </div>
                    <div className="p-3 bg-background rounded-xl border">
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <CalendarIcon className="h-3 w-3" /> Plant window
                      </div>
                      <div className="text-sm font-semibold">{crop.plantingWindow}</div>
                    </div>
                    <div className="col-span-2 p-3 bg-background rounded-xl border">
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Info className="h-3 w-3" /> Notes
                      </div>
                      <p className="text-sm leading-relaxed">{crop.notes}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Calendar below on mobile */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" /> Upcoming Activities
            </h2>
            <Card className="rounded-2xl">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">Next 30 Days</CardTitle>
                <CardDescription className="text-xs">Scheduled farming tasks</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <CalendarList calendar={calendar} getPriorityColor={getPriorityColor} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ── Desktop: two-column layout ── */
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sprout className="h-5 w-5" /> Recommended Crops
            </h2>
            <Accordion type="single" collapsible className="space-y-4" defaultValue="rec-0">
              {recommendations?.map((crop, i) => (
                <AccordionItem key={i} value={`rec-${i}`} className="border rounded-xl bg-card overflow-hidden">
                  <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                          {crop.icon}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-lg">{crop.cropName}</div>
                          <div className="text-sm text-muted-foreground">Suitability: {crop.suitability}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className={getRiskColor(crop.riskLevel)}>
                        {crop.riskLevel} Risk
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2">
                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-1 p-3 bg-background rounded-lg border">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" /> Expected Yield
                        </div>
                        <div className="font-medium">{crop.estimatedYield}</div>
                      </div>
                      <div className="space-y-1 p-3 bg-background rounded-lg border">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CalendarIcon className="h-3.5 w-3.5" /> Planting Window
                        </div>
                        <div className="font-medium">{crop.plantingWindow}</div>
                      </div>
                      <div className="sm:col-span-2 space-y-2 p-3 bg-background rounded-lg border">
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5" /> Agronomist Notes
                        </div>
                        <p className="text-sm leading-relaxed">{crop.notes}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" /> Upcoming Activities
            </h2>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Next 30 Days</CardTitle>
                <CardDescription>Scheduled farming tasks</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <CalendarList calendar={calendar} getPriorityColor={getPriorityColor} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarList({
  calendar,
  getPriorityColor,
}: {
  calendar: any[] | undefined;
  getPriorityColor: (p: string) => string;
}) {
  if (!calendar || calendar.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        No upcoming activities scheduled.
      </div>
    );
  }
  return (
    <div className="divide-y">
      {calendar.map((event, i) => (
        <div key={i} className="p-4 flex gap-4 hover:bg-muted/40 transition-colors">
          <div className="w-12 text-center shrink-0">
            <div className="text-2xl font-bold text-primary">{event.daysFromNow}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Days</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">{event.crop}</span>
              <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${getPriorityColor(event.priority)}`} />
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{event.activity}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
