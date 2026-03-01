import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Settings, ChevronLeft, ChevronRight, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { mainItems, vaultItems } from "@/lib/nav-items";

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Usuario");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      if (user.email) setUserEmail(user.email);
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
      if (fullName) {
        setUserName(fullName.split(" ")[0]);
      } else if (user.email) {
        setUserName(user.email.split("@")[0]);
      }
    });
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Sesión cerrada");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out", error);
      toast.error("Error al cerrar sesión");
    }
  };

  const userInitial = userEmail ? userEmail[0].toUpperCase() : "K";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border flex-col z-50 transition-all duration-300 hidden md:flex",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-border">
        {!collapsed && (
          <span className="font-display font-extrabold text-xl tracking-widest text-foreground neon-text-glow">
            KAWA
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2">
        <div className="space-y-1">
          {mainItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-body transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} strokeWidth={1.5} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Bóvedas group */}
        <div className="mt-6">
          {!collapsed && (
            <span className="px-3 text-[10px] font-display tracking-widest uppercase text-muted-foreground/60 mb-2 block">
              Herramientas
            </span>
          )}
          <div className="space-y-1">
            {vaultItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-body transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} strokeWidth={1.5} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-display font-bold">
              {userInitial}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-xs text-foreground font-medium truncate">{userName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{userEmail || "Cargando..."}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1">
              <NavLink to="/settings" title="Ajustes" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
                <User className="w-4 h-4" />
              </NavLink>
              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
