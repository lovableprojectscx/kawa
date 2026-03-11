import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, User, LogOut } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { mainItems, vaultItems } from "@/lib/nav-items";

export const MobileSidebar = () => {
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Sesión cerrada");
      navigate("/login");
      setOpen(false);
    } catch (error) {
      console.error("Error logging out", error);
      toast.error("Error al cerrar sesión");
    }
  };

  const userInitial = userEmail ? userEmail[0].toUpperCase() : "K";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5 text-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[80%] max-w-[300px] p-0 bg-card border-r border-border">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <img src="/kawa-logo.png" alt="KAWA Logo" className="h-8 w-auto filter brightness-110" />
          </div>

          {/* Nav */}
          <nav className="flex-1 py-6 px-4 overflow-y-auto">
            <div className="space-y-1">
              {mainItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-body transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="mt-8">
              <span className="px-3 text-[10px] font-display tracking-widest uppercase text-muted-foreground/60 mb-2 block">
                Áreas de Gestión
              </span>
              <div className="space-y-1">
                {vaultItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-body transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} strokeWidth={1.5} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/20 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-display font-bold">
                {userInitial}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-foreground font-medium truncate">Fundador</p>
                <p className="text-[10px] text-muted-foreground truncate">{userEmail || "Sesión Activa"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <NavLink
                to="/settings"
                onClick={() => setOpen(false)}
                className="p-2 rounded-md hover:bg-white/10 text-muted-foreground transition-colors"
              >
                <User className="w-4 h-4" />
              </NavLink>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
