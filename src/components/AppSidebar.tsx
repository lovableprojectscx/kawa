import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { navItems } from "@/lib/nav-items";

const AppSidebar = () => {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      if (user.email) setUserEmail(user.email);
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
      setUserName(fullName ? fullName.split(" ")[0] : user.email?.split("@")[0] || "");
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  const initial = userName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || "K";

  return (
    <aside className="fixed left-0 top-0 h-screen w-52 bg-background border-r border-border/50 flex flex-col z-50 hidden md:flex">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center border-b border-border/50">
        <img src="/kawa-logo.png" alt="KAWA Logo" className="h-8 w-auto filter brightness-110" />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              isActive
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
            {initial}
          </div>
          <span className="text-xs text-muted-foreground truncate">{userName || userEmail}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <NavLink to="/settings" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <User className="w-3.5 h-3.5" />
          </NavLink>
          <button onClick={handleLogout} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
