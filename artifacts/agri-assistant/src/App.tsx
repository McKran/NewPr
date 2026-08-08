import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocationProvider } from "@/hooks/use-location";
import { SettingsProvider, useSettings } from "@/hooks/use-settings";
import { Layout } from "@/components/layout";
import { Loader2 } from "lucide-react";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const Weather = lazy(() => import("@/pages/weather"));
const Crops = lazy(() => import("@/pages/crops"));
const Market = lazy(() => import("@/pages/market"));
const FarmingPlan = lazy(() => import("@/pages/farming-plan"));
const Chat = lazy(() => import("@/pages/chat"));
const Settings = lazy(() => import("@/pages/settings"));
const Onboarding = lazy(() => import("@/pages/onboarding"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/weather" component={Weather} />
        <Route path="/crops" component={Crops} />
        <Route path="/market" component={Market} />
        <Route path="/farming-plan" component={FarmingPlan} />
        <Route path="/chat" component={Chat} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppInner() {
  const { settings } = useSettings();

  if (!settings.onboardingCompleted) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Onboarding />
      </Suspense>
    );
  }

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Layout>
        <Router />
      </Layout>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SettingsProvider>
          <LocationProvider>
            <AppInner />
          </LocationProvider>
        </SettingsProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
