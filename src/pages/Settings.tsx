import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Shield, Target, Ban, Save, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface VisionSettings {
  north_star: string;
  anti_goals: string[];
}

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<SupabaseUser | null>(null);
  const [vision, setVision] = useState<VisionSettings>({ north_star: "", anti_goals: [] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setProfile(user);

      const { data: visionData } = await supabase
        .from("vault_vision")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setVision(visionData ? { north_star: visionData.north_star ?? "", anti_goals: visionData.anti_goals ?? [] } : { north_star: "", anti_goals: [] });
    } catch (error) {
      console.error("Error fetching settings data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVision = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("vault_vision")
        .upsert({
          user_id: user.id,
          north_star: vision.north_star,
          anti_goals: vision.anti_goals,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;
      toast.success("Configuración estratégica guardada");
    } catch (error) {
      console.error("Error saving vision:", error);
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const updateAntiGoal = (idx: number, value: string) => {
    const newGoals = [...vision.anti_goals];
    newGoals[idx] = value;
    setVision({ ...vision, anti_goals: newGoals });
  };

  const removeAntiGoal = (idx: number) => {
    setVision({ ...vision, anti_goals: vision.anti_goals.filter((_, i) => i !== idx) });
  };

  const addAntiGoal = () => {
    setVision({ ...vision, anti_goals: [...vision.anti_goals, ""] });
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-display font-bold text-foreground">Ajustes</h1>
        <p className="text-muted-foreground font-light mt-1">Gestiona tu perfil y tu configuración estratégica.</p>
      </motion.div>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <h2 className="text-lg font-display text-foreground">Perfil de Fundador</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-widest">Email</label>
              <Input value={profile?.email ?? ""} disabled className="bg-muted/50 border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-widest">ID de Usuario</label>
              <Input value={profile?.id ?? ""} disabled className="bg-muted/50 border-border truncate" />
            </div>
          </div>
        </section>

        {/* Strategic Setup */}
        <section className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <h2 className="text-lg font-display text-foreground">Configuración Estratégica</h2>
              </div>
              <Button size="sm" onClick={handleSaveVision} disabled={saving} className="gap-2">
                <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-3 h-3" /> Estrella del Norte (North Star)
                </label>
                <Textarea
                  value={vision.north_star}
                  onChange={(e) => setVision({ ...vision, north_star: e.target.value })}
                  placeholder="Tu gran objetivo..."
                  className="min-h-[100px] border-border bg-background/50 focus:border-primary/50 transition-all font-light"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Ban className="w-3 h-3 text-destructive" /> Límites (Anti-Metas)
                </label>
                <div className="space-y-2">
                  {vision.anti_goals.map((goal, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={goal}
                        onChange={(e) => updateAntiGoal(idx, e.target.value)}
                        className="bg-background/50 border-border h-9"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => removeAntiGoal(idx)}
                      >
                        <Ban className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full border-dashed border-border hover:bg-muted font-light text-xs"
                    onClick={addAntiGoal}
                  >
                    + Añadir Límite
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-destructive/5 border border-destructive/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6 font-display">
            <Shield className="w-5 h-5 text-destructive" strokeWidth={1.5} />
            <h2 className="text-lg text-foreground">Zona de Seguridad</h2>
          </div>
          <p className="text-sm text-muted-foreground font-light mb-6">Gestiona el acceso a tu cuenta.</p>
          <Button variant="destructive" className="gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </Button>
        </section>
      </div>
    </div>
  );
};

export default Settings;
