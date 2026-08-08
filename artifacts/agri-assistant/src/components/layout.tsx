import { memo } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, CloudSun, Sprout, TrendingUp, ClipboardList, MapPin, Settings, Menu, X, MessageSquare } from "lucide-react";
import { useLocationStore } from "@/hooks/use-location";
import { useSettings } from "@/hooks/use-settings";
import { COUNTRIES } from "@/lib/country-data";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/weather", icon: CloudSun, label: "Weather" },
  { href: "/crops", icon: Sprout, label: "Crops" },
  { href: "/market", icon: TrendingUp, label: "Market" },
  { href: "/farming-plan", icon: ClipboardList, label: "Farming Plan" },
  { href: "/chat", icon: MessageSquare, label: "AI Chat" },
  { href: "/settings", icon: Settings, label: "Settings" },
] as const;

const NavLink = memo(function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: typeof NAV_ITEMS[number];
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "opacity-100" : "opacity-60"}`} />
      {item.label}
    </Link>
  );
});

function SidebarInner({
  location,
  setLocation,
  selectedCountry,
  locationPath,
  onNavClick,
}: {
  location: string;
  setLocation: (v: string) => void;
  selectedCountry: typeof COUNTRIES[number] | undefined;
  locationPath: string;
  onNavClick?: () => void;
}) {
  return (
    <>
      <div className="p-6 border-b border-border/40">
        <div className="flex items-center gap-3 font-bold text-xl text-primary">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sprout className="h-5 w-5 text-primary" />
          </div>
          <span>AgriAssist</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">Smart farming command centre</p>
      </div>

      <div className="px-4 py-3 border-b border-border/40">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-8 bg-muted/50 border-transparent focus-visible:ring-primary focus-visible:bg-background h-9 rounded-xl text-sm"
            placeholder="Your location..."
          />
        </div>
        {selectedCountry && (
          <div className="flex items-center gap-1.5 mt-2 px-1 text-xs text-muted-foreground">
            <span>{selectedCountry.flag}</span>
            <span>{selectedCountry.name}</span>
            <span className="ml-auto font-mono text-primary/80">{selectedCountry.currencySymbol}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={locationPath === item.href}
            onClick={onNavClick}
          />
        ))}
      </nav>
    </>
  );
}

const BottomTabItem = memo(function BottomTabItem({
  item,
  isActive,
}: {
  item: typeof NAV_ITEMS[number];
  isActive: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl min-w-[56px] ${
        isActive ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <div className={`h-7 w-7 flex items-center justify-center rounded-xl ${isActive ? "bg-primary/10" : ""}`}>
        <item.icon className={`h-5 w-5 ${isActive ? "fill-primary/20" : ""}`} />
      </div>
      <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
        {item.label}
      </span>
    </Link>
  );
});

export function Layout({ children }: { children: React.ReactNode }) {
  const [locationPath] = useLocation();
  const { location, setLocation } = useLocationStore();
  const { settings, fullLocationLabel } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const selectedCountry = COUNTRIES.find(c => c.code === settings.countryCode);
  const displayLocation = fullLocationLabel || location || selectedCountry?.name || "Location";

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const marketModeLabel =
    settings.targetMarket === "international" ? "Int'l Market" :
    settings.targetMarket === "regional" ? "Regional Market" :
    "Local Market";

  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-60 lg:w-72 flex-col border-r bg-card h-full shrink-0">
        <SidebarInner
          location={location}
          setLocation={setLocation}
          selectedCountry={selectedCountry}
          locationPath={locationPath}
        />
      </aside>

      {/* Mobile Slide-over */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          <aside className="relative w-72 max-w-[85vw] bg-card h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={closeMobileMenu}
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarInner
              location={location}
              setLocation={setLocation}
              selectedCountry={selectedCountry}
              locationPath={locationPath}
              onNavClick={closeMobileMenu}
            />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile Header */}
        <header className="md:hidden flex-none flex items-center justify-between px-4 py-3 border-b bg-card z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2 font-bold text-base text-primary">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sprout className="h-4 w-4 text-primary" />
              </div>
              AgriAssist
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedCountry && (
              <span className="text-lg" title={selectedCountry.name}>{selectedCountry.flag}</span>
            )}
            <div className="relative w-32">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-8 pl-7 text-xs bg-muted/50 border-transparent rounded-lg"
                placeholder="Location..."
              />
            </div>
          </div>
        </header>

        {/* Desktop Top Bar */}
        <div className="hidden md:flex items-center justify-between px-5 py-2 border-b bg-card/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {selectedCountry && (
              <>
                <span>{selectedCountry.flag} {selectedCountry.name}</span>
                <span>·</span>
                <span className="font-mono text-primary/80">{selectedCountry.currencySymbol} {settings.currency}</span>
                <span>·</span>
              </>
            )}
            <span className="capitalize">{settings.weightUnit.replace("_", " ")} pricing</span>
            <span>·</span>
            <span className={`font-medium ${
              settings.targetMarket === "international" ? "text-blue-600 dark:text-blue-400" :
              settings.targetMarket === "regional" ? "text-amber-600 dark:text-amber-400" :
              "text-green-600 dark:text-green-400"
            }`}>
              {marketModeLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-primary/8 border border-primary/20 rounded-full px-3 py-1 text-xs font-medium text-primary/90">
            <MapPin className="h-3 w-3 text-primary shrink-0" />
            <span className="max-w-[220px] truncate" title={displayLocation}>{displayLocation}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative pb-20 md:pb-0">
          <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full min-h-full">
            {children}
          </div>
        </div>

        {/* Bottom Tab Bar — Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur-md z-40 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
          <div className="flex justify-around px-1 pt-2 pb-safe pb-2">
            {NAV_ITEMS.slice(0, 5).map((item) => (
              <BottomTabItem
                key={item.href}
                item={item}
                isActive={locationPath === item.href}
              />
            ))}
          </div>
        </nav>
      </main>
    </div>
  );
}
