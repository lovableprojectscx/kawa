import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { MoreHorizontal, User, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { mainItems, vaultItems } from "@/lib/nav-items";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate("/login");
    setMoreOpen(false);
  };

  return (
    <>
      {/* Bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
        <div className="flex items-stretch h-16">
          {mainItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-display tracking-wide transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon
                  className={cn("w-5 h-5", isActive && "text-primary")}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span className="leading-none">{item.label}</span>
              </NavLink>
            );
          })}

          {/* Más button */}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-display tracking-wide text-muted-foreground"
          >
            <MoreHorizontal className="w-5 h-5" strokeWidth={1.5} />
            <span className="leading-none">Más</span>
          </button>
        </div>
      </nav>

      {/* "Más" sheet with vault items */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-safe bg-card border-border p-0">
          <div className="px-4 pt-3 pb-1">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
            <p className="text-[10px] font-display tracking-widest uppercase text-muted-foreground/60 mb-3 px-1">
              Áreas de Gestión
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {vaultItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-display transition-all",
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border/60"
                    )}
                  >
                    <item.icon className="w-5 h-5" strokeWidth={1.5} />
                    <span className="text-center leading-tight">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="flex items-center justify-between py-3 border-t border-border/50">
              <NavLink
                to="/settings"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-1"
              >
                <User className="w-4 h-4" />
                Ajustes
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors px-1"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
