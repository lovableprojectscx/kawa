import { motion } from "framer-motion";
import { Heart, Smile, Frown, Meh, Battery, ShieldAlert, TrendingDown, Plus, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { EnergyCheckinDialog } from "@/components/founder/EnergyCheckinDialog";
import { Button } from "@/components/ui/button";

interface EnergyLog {
  id: string;
  checkin_date: string;
  mood_score: number;
  energy_level: "high" | "medium" | "low";
  notes: string;
  stress_triggers: string[];
}

const moodIcon = (score: number) => {
  if (score >= 4) return <Smile className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />;
  if (score >= 3) return <Meh className="w-5 h-5 text-amber-400" strokeWidth={1.5} />;
  return <Frown className="w-5 h-5 text-destructive" strokeWidth={1.5} />;
};

const energyColor = { high: "text-emerald-400 bg-emerald-400/10", medium: "text-amber-400 bg-amber-400/10", low: "text-destructive bg-destructive/10" };

const VaultFounder = () => {
  const [logs, setLogs] = useState<EnergyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("vault_founder_energy")
        .select("*")
        .eq("user_id", user.id)
        .order("checkin_date", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const avgMood = logs.length > 0
    ? (logs.reduce((a, e) => a + e.mood_score, 0) / logs.length).toFixed(1)
    : "0.0";

  // Calculate trend (last 3 entries vs previous 3)
  const calculateTrend = () => {
    if (logs.length < 6) return "Estable";
    const recent = logs.slice(0, 3).reduce((a, b) => a + b.mood_score, 0) / 3;
    const previous = logs.slice(3, 6).reduce((a, b) => a + b.mood_score, 0) / 3;
    return recent > previous ? "Ascendente" : (recent < previous ? "Descendente" : "Estable");
  };

  const trend = calculateTrend();

  const burnoutDetected = logs.slice(0, 3).filter((e) => e.energy_level === "low").length >= 2;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-rose-500/10">
              <Heart className="w-6 h-6 text-rose-500" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl text-foreground">Mi Bienestar</h1>
          </div>
          <p className="text-muted-foreground font-light">Energía · Balance · Salud Mental</p>
        </div>

        <EnergyCheckinDialog onCheckinComplete={fetchLogs}>
          <Button className="gap-2 bg-rose-500 hover:bg-rose-600">
            <Plus className="w-4 h-4" /> Nuevo Check-in
          </Button>
        </EnergyCheckinDialog>
      </motion.div>

      {/* Burnout Alert */}
      {burnoutDetected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-destructive/5 border border-destructive/30 rounded-lg p-5 flex items-start gap-4"
        >
          <ShieldAlert className="w-6 h-6 text-destructive shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <h3 className="font-display text-foreground font-semibold mb-1">⚠️ Alerta de Descanso Necesario</h3>
            <p className="text-sm text-muted-foreground font-light">
              Se detectaron 2+ días consecutivos de energía baja. Recomendamos: cancelar reuniones no esenciales,
              bloquear 2h de descanso hoy y hacer una sesión de reflexión.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stats */}
        {[
          { label: "Mi Ánimo", value: avgMood + "/5", icon: Smile, color: "text-amber-400" },
          {
            label: "Tendencia",
            value: trend,
            icon: trend === "Ascendente" ? TrendingUp : (trend === "Descendente" ? TrendingDown : Meh),
            color: trend === "Ascendente" ? "text-emerald-400" : (trend === "Descendente" ? "text-destructive" : "text-muted-foreground")
          },
          {
            label: "Energía Hoy",
            value: logs[0]?.energy_level.toUpperCase() || "N/A",
            icon: Battery,
            color: logs[0] ? energyColor[logs[0].energy_level].split(" ")[0] : "text-muted-foreground"
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="bg-card border border-border rounded-lg p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} strokeWidth={1.5} />
              <span className="text-xs text-muted-foreground font-display tracking-wider uppercase">{stat.label}</span>
            </div>
            <p className="text-2xl text-foreground font-display font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Energy Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <h2 className="font-display text-foreground text-lg mb-5">Registro de Energía</h2>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground font-light">
            <p>No hay registros aún.</p>
            <p className="text-sm opacity-50 mt-1">Realiza tu primer check-in para empezar a medir tu bienestar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-start gap-4 px-4 py-4 rounded-md bg-muted/30 border border-border/50"
              >
                <span className="text-xs text-muted-foreground font-display w-14 pt-0.5">{formatDate(entry.checkin_date)}</span>
                <div className="pt-0.5">{moodIcon(entry.mood_score)}</div>
                <div className="flex-1">
                  <p className="text-sm text-foreground font-light">{entry.notes || "Sin notas"}</p>
                  {/* Triggers could be parsed from JSON if we implemented them fully, for now straightforward */}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-display tracking-wider uppercase ${energyColor[entry.energy_level]}`}>
                  {entry.energy_level}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VaultFounder;
