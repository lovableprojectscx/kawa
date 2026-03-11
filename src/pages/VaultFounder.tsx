import { motion } from "framer-motion";
import {
  Heart, Smile, Frown, Meh, Battery, ShieldAlert, TrendingDown, Plus,
  TrendingUp, Flame, BookOpen, CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { EnergyCheckinDialog } from "@/components/founder/EnergyCheckinDialog";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface EnergyLog {
  id: string;
  checkin_date: string;
  mood_score: number;
  energy_level: "high" | "medium" | "low";
  notes: string;
  stress_triggers?: string[];
}

const moodIcon = (score: number) => {
  if (score >= 4) return <Smile className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />;
  if (score >= 3) return <Meh className="w-5 h-5 text-amber-400" strokeWidth={1.5} />;
  return <Frown className="w-5 h-5 text-rose-400" strokeWidth={1.5} />;
};

const moodEmoji = (score: number) => {
  if (score >= 5) return "😁";
  if (score >= 4) return "😊";
  if (score >= 3) return "😐";
  if (score >= 2) return "😕";
  return "😫";
};

const energyConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  high:   { label: "Alta ⚡",   color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  medium: { label: "Media 🔋",  color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/20" },
  low:    { label: "Baja 🪫",   color: "text-rose-400",    bg: "bg-rose-400/10",    border: "border-rose-400/20" },
};

// Custom tooltip for the chart
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-foreground font-semibold">
        {moodEmoji(d.mood)} Ánimo: {d.mood}/5
      </p>
      <p className={`${energyConfig[d.energy]?.color || "text-muted-foreground"} font-medium`}>
        Energía: {energyConfig[d.energy]?.label || d.energy}
      </p>
      {d.notes && <p className="text-muted-foreground mt-1 max-w-[160px] truncate italic">"{d.notes}"</p>}
    </div>
  );
};

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

  useEffect(() => { fetchLogs(); }, []);

  // ── Stats ──
  const avgMood = logs.length > 0
    ? (logs.reduce((a, e) => a + e.mood_score, 0) / logs.length).toFixed(1)
    : null;

  const calculateTrend = () => {
    if (logs.length < 4) return null;
    const recent = logs.slice(0, 3).reduce((a, b) => a + b.mood_score, 0) / 3;
    const previous = logs.slice(3, 6).reduce((a, b) => a + b.mood_score, 0) / (Math.min(logs.length - 3, 3));
    if (recent > previous + 0.2) return "up";
    if (recent < previous - 0.2) return "down";
    return "stable";
  };

  const trend = calculateTrend();

  const burnoutDetected =
    logs.slice(0, 5).filter((e) => e.energy_level === "low").length >= 3;

  const burnoutWarning =
    !burnoutDetected && logs.slice(0, 3).filter((e) => e.energy_level === "low").length >= 2;

  // ── Chart data (last 14, oldest first) ──
  const chartData = logs
    .slice(0, 14)
    .reverse()
    .map((l) => {
      const d = new Date(l.checkin_date);
      return {
        label: d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
        mood: l.mood_score,
        energy: l.energy_level,
        notes: l.notes,
      };
    });

  const latestEnergy = logs[0];

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      time: d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-rose-500/10">
              <Heart className="w-6 h-6 text-rose-500" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl text-foreground">Mi Bienestar</h1>
          </div>
          <p className="text-muted-foreground font-light">
            Tu energía es un activo estratégico — KAWA lo mide para ayudarte mejor.
          </p>
        </div>
        <EnergyCheckinDialog onCheckinComplete={fetchLogs}>
          <Button className="gap-2 bg-rose-500 hover:bg-rose-600">
            <Plus className="w-4 h-4" /> Nuevo Check-in
          </Button>
        </EnergyCheckinDialog>
      </motion.div>

      {/* Burnout alerts */}
      {burnoutDetected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-rose-500/5 border border-rose-500/30 rounded-xl p-5 flex items-start gap-4"
        >
          <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <h3 className="font-display font-semibold text-foreground mb-1">
              🚨 Alerta de Burnout — Acción Necesaria
            </h3>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              3 o más días de energía baja esta semana. Es momento de parar y recuperar.
              Recomendación: cancela reuniones no esenciales hoy, bloquea 2h de descanso y
              habla con KAWA sobre qué está generando este patrón.
            </p>
          </div>
        </motion.div>
      )}

      {burnoutWarning && !burnoutDetected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 flex items-start gap-3"
        >
          <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground font-light">
            <span className="text-amber-400 font-semibold">Tendencia preocupante — </span>
            Detectamos 2 días seguidos de energía baja. Considera ajustar tu carga de trabajo antes de que escale.
          </p>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Ánimo promedio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Smile className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground font-display tracking-wider uppercase">Ánimo Promedio</span>
          </div>
          {avgMood ? (
            <>
              <p className="text-3xl font-display font-bold text-foreground">{avgMood}<span className="text-lg text-muted-foreground">/5</span></p>
              <p className="text-xs text-muted-foreground mt-1">Basado en {logs.length} registros</p>
            </>
          ) : (
            <p className="text-2xl font-display font-bold text-muted-foreground">—</p>
          )}
        </motion.div>

        {/* Tendencia */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            {trend === "up" ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
            ) : trend === "down" ? (
              <TrendingDown className="w-4 h-4 text-rose-400" strokeWidth={1.5} />
            ) : (
              <Meh className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            )}
            <span className="text-xs text-muted-foreground font-display tracking-wider uppercase">Tendencia</span>
          </div>
          <p className={`text-2xl font-display font-bold ${
            trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-muted-foreground"
          }`}>
            {trend === "up" ? "Ascendente" : trend === "down" ? "Descendente" : trend === "stable" ? "Estable" : "Sin datos"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Últimos 6 registros</p>
        </motion.div>

        {/* Energía hoy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Battery className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground font-display tracking-wider uppercase">Energía Hoy</span>
          </div>
          {latestEnergy ? (
            <>
              <p className={`text-2xl font-display font-bold ${energyConfig[latestEnergy.energy_level]?.color}`}>
                {energyConfig[latestEnergy.energy_level]?.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ánimo {moodEmoji(latestEnergy.mood_score)} {latestEnergy.mood_score}/5
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-display font-bold text-muted-foreground">Sin registro</p>
              <p className="text-xs text-muted-foreground mt-1">Haz tu check-in de hoy</p>
            </>
          )}
        </motion.div>
      </div>

      {/* Energy trend chart */}
      {chartData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <h2 className="font-display text-foreground text-base">Evolución de Ánimo</h2>
            <span className="text-xs text-muted-foreground ml-1">— últimos {chartData.length} registros</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(345 100% 56%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(345 100% 56%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "hsl(0 0% 50%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fill: "hsl(0 0% 50%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="mood"
                stroke="hsl(345 100% 56%)"
                strokeWidth={2}
                fill="url(#moodGrad)"
                dot={{ r: 3, fill: "hsl(345 100% 56%)", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "hsl(345 100% 56%)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-1">
            {[
              { level: 5, label: "Excelente 😁" },
              { level: 4, label: "Bien 😊" },
              { level: 3, label: "Normal 😐" },
              { level: 2, label: "Difícil 😕" },
              { level: 1, label: "Muy bajo 😫" },
            ].map((m) => (
              <span key={m.level} className="text-[9px] text-muted-foreground/50">{m.level}: {m.label}</span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Energy log list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <h2 className="font-display text-foreground text-base">Registro de Energía</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Heart className="w-10 h-10 text-muted-foreground/20 mx-auto" strokeWidth={1} />
            <p className="text-muted-foreground font-light">Sin registros aún.</p>
            <p className="text-sm text-muted-foreground/50">
              Tu primer check-in tarda 10 segundos y le da a KAWA contexto sobre cómo adaptar sus sugerencias.
            </p>
            <EnergyCheckinDialog onCheckinComplete={fetchLogs}>
              <Button variant="outline" size="sm" className="gap-2 mt-2">
                <Plus className="w-4 h-4" /> Hacer mi primer check-in
              </Button>
            </EnergyCheckinDialog>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((entry, i) => {
              const { date, time } = formatDate(entry.checkin_date);
              const ec = energyConfig[entry.energy_level];
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-4 px-4 py-4 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors"
                >
                  {/* Date */}
                  <div className="flex flex-col w-14 shrink-0 pt-0.5 text-center">
                    <span className="text-xs font-display text-foreground">{date}</span>
                    <span className="text-[10px] text-muted-foreground/50 font-mono">{time}</span>
                  </div>

                  {/* Mood icon */}
                  <div className="pt-0.5 shrink-0">{moodIcon(entry.mood_score)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {moodEmoji(entry.mood_score)} Ánimo {entry.mood_score}/5
                      </span>
                    </div>
                    {entry.notes ? (
                      <p className="text-sm text-muted-foreground font-light leading-snug">{entry.notes}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground/40 italic">Sin notas</p>
                    )}
                    {entry.stress_triggers && entry.stress_triggers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.stress_triggers.map((t) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-400/10 text-rose-400 border border-rose-400/20">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Energy badge */}
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-display tracking-wider uppercase border shrink-0 ${ec?.color} ${ec?.bg} ${ec?.border}`}>
                    {ec?.label.split(" ")[0] || entry.energy_level}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VaultFounder;
