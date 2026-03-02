import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Shield, LogOut, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SupabaseUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setProfile(user);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-display font-bold text-foreground">Ajustes</h1>
        <p className="text-muted-foreground font-light mt-1">Gestiona tu cuenta.</p>
      </motion.div>

      <div className="space-y-6">
        {/* Profile */}
        <section className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <User className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <h2 className="text-lg font-display text-foreground">Perfil</h2>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Email</p>
            <p className="text-sm text-foreground font-light">{profile?.email ?? "—"}</p>
          </div>
        </section>

        {/* Strategic config → redirect */}
        <section
          className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:border-primary/30 transition-colors group"
          onClick={() => navigate("/vault/vision")}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display text-foreground mb-1">Configuración Estratégica</h2>
              <p className="text-sm text-muted-foreground font-light">North Star, anti-metas y OKRs</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </section>

        {/* Logout */}
        <section className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-destructive" strokeWidth={1.5} />
            <h2 className="text-lg font-display text-foreground">Sesión</h2>
          </div>
          <Button variant="destructive" className="gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </Button>
        </section>
      </div>
    </div>
  );
};

export default Settings;
