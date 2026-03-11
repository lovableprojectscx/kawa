import { Outlet, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AppSidebar from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { OnboardingWizard } from "./onboarding/OnboardingWizard";
import { DailyCheckinManager } from "./founder/DailyCheckinManager";
import { navItems } from "@/lib/nav-items";

const allNavItems = navItems;

const usePageTitle = () => {
  const location = useLocation();
  const match = allNavItems.find((item) => item.to === location.pathname);
  return match?.label ?? "KAWA";
};

const AppLayout = () => {
  const queryClient = useQueryClient();
  const pageTitle = usePageTitle();

  const handleOnboardingComplete = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <AppSidebar />
      <main className="flex-1 min-h-screen md:ml-52 w-full relative">
        <div className="andean-pattern absolute inset-0 opacity-[var(--pattern-opacity)] pointer-events-none -z-10" />

        {/* Mobile Header */}
        <div className="md:hidden h-14 border-b border-border/40 flex items-center justify-between px-4 sticky top-0 bg-background/90 backdrop-blur-xl z-40">
          <span className="font-display font-bold text-lg text-foreground neon-text-glow tracking-tight">KAWA</span>
          <span className="text-xs text-muted-foreground font-display tracking-widest uppercase">{pageTitle}</span>
        </div>

        {/* Content — extra bottom padding for floating pill nav */}
        <div className="pb-28 md:pb-0">
          <Outlet />
        </div>

        {/* Global Guardians */}
        <OnboardingWizard onComplete={handleOnboardingComplete} />
        <DailyCheckinManager />
      </main>

      <BottomNav />
    </div>
  );
};

export default AppLayout;
