import { NavLink, useNavigate } from "react-router-dom";
import { MoreHorizontal, LogOut, Settings, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// 4 main items in bottom bar, rest in overflow sheet
const barItems = navItems.slice(0, 4);
const moreItems = navItems.slice(4);

export const BottomNav = () => {
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
      {/* ── Bottom Navigation Bar ──────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="mx-3 mb-3 bg-card/90 backdrop-blur-xl border border-border/60 rounded-2xl shadow-lg shadow-black/20">
          <div className="flex items-stretch h-16 px-1">
            {barItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200 my-1.5",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.5} />
                    <span className={`text-[9px] font-display tracking-wide ${isActive ? "font-semibold" : ""}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}

            {/* Más button */}
            <button
              onClick={() => setMoreOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground hover:text-foreground transition-all my-1.5 active:scale-95"
            >
              <MoreHorizontal className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-[9px] font-display tracking-wide">Más</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Overflow Sheet ─────────────────────────────────────── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-card border-t border-border rounded-t-2xl p-5 pb-8"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

              {/* Extra nav items */}
              {moreItems.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {moreItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border text-sm transition-colors",
                        isActive
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}

              {/* Settings + Logout */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <NavLink
                  to="/settings"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" /> Ajustes
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-rose-400 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Cerrar sesión
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
