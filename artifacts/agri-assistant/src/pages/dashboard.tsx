import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useLocationStore } from "@/hooks/use-location";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Cloud, Sprout, TrendingUp, AlertCircle, Lightbulb,
  MapPin, Wind, Droplets, ChevronRight, ClipboardList,
  MessageSquare, LayoutDashboard, CloudSun, Bot
} from "lucide-react";

const CATEGORY_CARDS = [
  {
    href: "/weather",
    icon: CloudSun,
    label: "Weather",
    description: "Live forecast & farming alerts",
    gradient: "from-sky-400 to-blue-500",
    shadow: "shadow-sky-200 dark:shadow-sky-900/40",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    iconBg: "bg-sky-400",
  },
  {
    href: "/crops",
    icon: Sprout,
    label: "Crops",
    description: "Philippine crop database",
    gradient: "from-emerald-400 to-green-600",
    shadow: "shadow-emerald-200 dark:shadow-emerald-900/40",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconBg: "bg-emerald-500",
  },
  {
    href: "/market",
    icon: TrendingUp,
    label: "Market",
    description: "Commodity prices & trends",
    gradient: "from-amber-400 to-orange-500",
    shadow: "shadow-amber-200 dark:shadow-amber-900/40",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    iconBg: "bg-amber-500",
  },
  {
    href: "/farming-plan",
    icon: ClipboardList,
    label: "Farm Planner",
    description: "GDD-based growing schedules",
    gradient: "from-violet-400 to-purple-600",
    shadow: "shadow-violet-200 dark:shadow-violet-900/40",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    iconBg: "bg-violet-500",
  },
  {
    href: "/chat",
    icon: Bot,
    label: "AI Chat",
    description: "Groq · DeepSeek R1 advisor",
    gradient: "from-rose-400 to-pink-600",
    shadow: "shadow-rose-200 dark:shadow-rose-900/40",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    iconBg: "bg-rose-500",
  },
];

export default function Dashboard() {
  const { location } = useLocationStore();
  const isMobile = useIsMobile();
  const { data: summary, isLoading, error } = useGetDashboardSummary(
    { location },
    { query: { queryKey: getGetDashboardSummaryQueryKey({ location }) } }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[220px] md:h-[260px] w-full rounded-3xl" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-3xl h-[60vh]">
        <AlertCircle className="h-12 w-12 mb-4 text-destructive/50" />
        <h2 className="text-xl font-semibold text-foreground">Failed to load dashboard</h2>
        <p className="mt-2 max-w-sm">Please check your connection and try again.</p>
      </div>
    );
  }

  if (isMobile) return <MobileDashboard summary={summary} location={location} />;
  return <DesktopDashboard summary={summary} location={location} />;
}

function CategoryCards() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {CATEGORY_CARDS.map(card => (
        <Link key={card.href} href={card.href} className="block group">
          <div className={`relative overflow-hidden rounded-2xl border p-4 h-full flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] ${card.bg}`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br ${card.gradient} shadow-sm`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm leading-tight">{card.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{card.description}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function DesktopDashboard({ summary, location }: { summary: any; location: string }) {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Weather Hero */}
      <Link href="/weather" className="block relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1595878715977-2e8f8df18ea8?q=80&w=2000&auto=format&fit=crop')] opacity-20 bg-cover bg-center mix-blend-overlay group-hover:scale-105 transition-transform duration-1000" />
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-100 font-medium text-sm">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
            <div>
              <div className="text-7xl font-light tracking-tighter mb-1">{summary.weather.temperature}°</div>
              <div className="text-2xl font-medium capitalize">{summary.weather.condition}</div>
              <div className="text-blue-100 mt-1 text-sm">Feels like {summary.weather.feelsLike}°</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 flex items-center gap-8 border border-white/20">
            <div className="flex flex-col items-center gap-1">
              <Wind className="h-5 w-5 text-blue-100" />
              <div className="text-xl font-bold">{summary.weather.windSpeed}</div>
              <div className="text-xs text-blue-200">km/h</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex flex-col items-center gap-1">
              <Droplets className="h-5 w-5 text-blue-100" />
              <div className="text-xl font-bold">{summary.weather.humidity}%</div>
              <div className="text-xs text-blue-200">Humidity</div>
            </div>
          </div>
        </div>
      </Link>

      {/* Category navigation cards */}
      <CategoryCards />

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard href="/crops" color="primary" icon={Sprout} label="Top Recommendation" value={summary.topCropRecommendation} />
        <StatCard href="/market" color="amber" icon={TrendingUp} label="Market Alert" value={summary.marketAlert} />
        <StatCard href="/farming-plan" color="plan" icon={ClipboardList} label="Farm Planner" value="Create Plan" />
      </div>

      {/* Agronomist tip */}
      <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-6 sm:p-8 flex items-start gap-5">
        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
          <Lightbulb className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-primary mb-1.5">Agronomist Tip</h3>
          <p className="text-muted-foreground leading-relaxed">{summary.farmingTip}</p>
        </div>
      </div>
    </div>
  );
}

function MobileDashboard({ summary, location }: { summary: any; location: string }) {
  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-400 pb-4">
      {/* Compact weather hero */}
      <Link href="/weather" className="block relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md active:scale-[0.98] transition-transform">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1595878715977-2e8f8df18ea8?q=80&w=800&auto=format&fit=crop')] opacity-20 bg-cover bg-center" />
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-1.5 text-blue-100 text-xs font-medium mb-3">
            <MapPin className="h-3.5 w-3.5" /> {location}
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-6xl font-light tracking-tight leading-none">{summary.weather.temperature}°</div>
              <div className="text-lg font-medium capitalize mt-1">{summary.weather.condition}</div>
              <div className="text-blue-100 text-sm mt-0.5">Feels like {summary.weather.feelsLike}°</div>
            </div>
            <div className="flex flex-col items-end gap-2.5 text-right">
              <div>
                <div className="text-lg font-bold">{summary.weather.windSpeed} <span className="text-xs font-normal text-blue-200">km/h</span></div>
                <div className="text-xs text-blue-200 flex items-center gap-1 justify-end"><Wind className="h-3 w-3" /> Wind</div>
              </div>
              <div>
                <div className="text-lg font-bold">{summary.weather.humidity}% <span className="text-xs font-normal text-blue-200">RH</span></div>
                <div className="text-xs text-blue-200 flex items-center gap-1 justify-end"><Droplets className="h-3 w-3" /> Humidity</div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Mobile category cards — 2-col grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {CATEGORY_CARDS.map(card => (
          <Link key={card.href} href={card.href} className="block active:scale-[0.96] transition-transform">
            <div className={`rounded-2xl border p-3.5 flex flex-col gap-2.5 ${card.bg}`}>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${card.gradient} shadow-sm`}>
                <card.icon className="h-4.5 w-4.5" style={{ height: "1.125rem", width: "1.125rem" }} />
              </div>
              <div>
                <div className="font-bold text-sm">{card.label}</div>
                <div className="text-[10px] text-muted-foreground leading-snug mt-0.5">{card.description}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <Link href="/crops" className="block">
        <MobileStatRow icon={Sprout} iconBg="bg-primary/10" iconColor="text-primary" label="Top Recommendation" value={summary.topCropRecommendation} />
      </Link>
      <Link href="/market" className="block">
        <MobileStatRow icon={TrendingUp} iconBg="bg-amber-500/10" iconColor="text-amber-500" label="Market Alert" value={summary.marketAlert} />
      </Link>
      <Link href="/farming-plan" className="block">
        <div className="bg-card border rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-transform">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground font-medium">Farming Plan</div>
            <div className="font-bold text-base truncate text-primary">Create Plan</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </Link>

      {/* Tip */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-primary mb-1">Agronomist Tip</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{summary.farmingTip}</p>
        </div>
      </div>
    </div>
  );
}

function MobileStatRow({ icon: Icon, iconBg, iconColor, label, value }: {
  icon: React.ElementType; iconBg: string; iconColor: string; label: string; value: string;
}) {
  return (
    <div className="bg-card border rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-[0.98] transition-transform">
      <div className={`h-11 w-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
        <div className="font-bold text-base truncate">{value}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function StatCard({ href, color, icon: Icon, label, value }: {
  href: string; color: "primary" | "amber" | "plan"; icon: React.ElementType; label: string; value: string;
}) {
  const colorMap = {
    primary: { bg: "bg-primary/10", icon: "text-primary", ghost: "text-primary" },
    amber: { bg: "bg-amber-500/10", icon: "text-amber-500", ghost: "text-amber-500" },
    plan: { bg: "bg-primary/10", icon: "text-primary", ghost: "text-primary" },
  };
  const c = colorMap[color];
  return (
    <Link href={href} className="block">
      <div className="bg-card rounded-[2rem] p-6 shadow-sm border hover:shadow-md transition-all h-full flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
          <Icon className={`h-20 w-20 ${c.ghost}`} />
        </div>
        <div className={`h-11 w-11 rounded-2xl ${c.bg} flex items-center justify-center ${c.icon} mb-5 z-10`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-auto z-10">
          <h3 className="text-xs font-semibold text-muted-foreground mb-1">{label}</h3>
          <div className="text-xl font-bold truncate pr-8">{value}</div>
        </div>
      </div>
    </Link>
  );
}
