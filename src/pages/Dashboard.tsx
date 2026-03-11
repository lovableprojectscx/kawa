import { motion } from "framer-motion";
import {
  ArrowRight, Target, Briefcase, Heart, Users, Zap,
  TrendingUp, CheckCircle2, Clock, MessageSquare, Calendar as CalendarIcon,
  Brain, Flame, Building2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { CreateCompanyDialog } from "@/components/operator/CreateCompanyDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnergyPoint { day: string; mood: number; energy: number; label: string; }
interface ProjectStat { name: string; value: number; color: string; }
interface ActivityItem { icon: string; text: string; time: string; type: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Buenos días";
  if (h >= 12 && h < 19) return "Buenas tardes";
  return "Buenas noches";
};

const dayLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { weekday: "short" }).slice(0, 3).toUpperCase();
};

const energyToNum = (e: string) => e === "high" ? 3 : e === "medium" ? 2 : 1;
const energyColor = (e: string) => e === "high" ? "#10b981" : e === "medium" ? "#f59e0b" : "#ef4444";
const STATUS_COLORS: Record<string, string> = {
  active: "#6366f1", in_progress: "#8b5cf6", completed: "#10b981",
  paused: "#f59e0b", backlog: "#64748b",
};
const STATUS_LABELS: Record<string, string> = {
  active: "Activo", in_progress: "En Progreso", completed: "Completado",
  paused: "Pausado", backlog: "Backlog",
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  // Core metrics
  const [activeProjects, setActiveProjects] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [companies, setCompanies] = useState<{ id: string, name: string, vision: string, mision: string, color: string }[]>([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [memoriesCount, setMemoriesCount] = useState(0);

  // Chart data
  const [energyData, setEnergyData] = useState<EnergyPoint[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStat[]>([]);
  const [latestEnergy, setLatestEnergy] = useState<{ level: string; mood: number; note?: string } | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [todayEvents, setTodayEvents] = useState<{ event_title: string; start_time: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "";
        setUserName(name.split(" ")[0]);

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const [
          { data: comps },
          { data: projects },
          { count: tasks },
          { count: contacts },
          { count: memories },
          { data: energyLogs },
          { data: events },
          { data: recentMems },
          { data: recentInsights },
          { data: recentEvents },
        ] = await Promise.all([
          supabase.from("vault_companies").select("*").eq("user_id", user.id).order("name"),
          supabase.from("vault_operator_projects").select("status, name").eq("user_id", user.id),
          supabase.from("vault_operator_tasks").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending"),
          supabase.from("vault_context_people").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("vault_memories").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("vault_founder_energy").select("energy_level, mood_score, checkin_date, notes").eq("user_id", user.id).gte("checkin_date", sevenDaysAgo.toISOString()).order("checkin_date", { ascending: true }),
          supabase.from("vault_operator_calendar_events").select("event_title, start_time").eq("user_id", user.id).gte("start_time", today.toISOString()).lt("start_time", tomorrow.toISOString()).order("start_time", { ascending: true }),
          supabase.from("vault_memories").select("content, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
          supabase.from("vault_insights").select("content, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(2),
          supabase.from("vault_operator_calendar_events").select("event_title, start_time").eq("user_id", user.id).order("start_time", { ascending: false }).limit(2),
        ]);

        // Metrics
        setCompanies(comps || []);
        setActiveProjects(projects?.filter(p => ["active", "in_progress"].includes(p.status)).length || 0);
        setPendingTasks(tasks || 0);
        setContactsCount(contacts || 0);
        setMemoriesCount(memories || 0);
        setTodayEvents(events || []);

        // Energy chart (last 7 days)
        if (energyLogs && energyLogs.length > 0) {
          const last = energyLogs[energyLogs.length - 1];
          setLatestEnergy({ level: last.energy_level, mood: last.mood_score, note: last.notes });
          setEnergyData(energyLogs.map(e => ({
            day: dayLabel(e.checkin_date),
            mood: e.mood_score,
            energy: energyToNum(e.energy_level),
            label: e.energy_level,
          })));
        }

        // Project status pie
        const statusMap: Record<string, number> = {};
        projects?.forEach(p => { statusMap[p.status] = (statusMap[p.status] || 0) + 1; });
        setProjectStats(Object.entries(statusMap).map(([k, v]) => ({
          name: STATUS_LABELS[k] || k,
          value: v,
          color: STATUS_COLORS[k] || "#64748b",
        })));

        // Activity feed
        const feed: ActivityItem[] = [];
        recentMems?.forEach(m => feed.push({ icon: "🧠", text: m.content.slice(0, 70) + (m.content.length > 70 ? "..." : ""), time: m.created_at, type: "memory" }));
        recentInsights?.forEach(i => feed.push({ icon: "💡", text: i.content.slice(0, 70) + (i.content.length > 70 ? "..." : ""), time: i.created_at, type: "insight" }));
        recentEvents?.forEach(e => feed.push({ icon: "📅", text: e.event_title, time: e.start_time, type: "event" }));
        feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setRecentActivity(feed.slice(0, 5));

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const alignmentScore = companies.length > 0
    ? Math.min(100, 40 + (companies.length * 10) + (activeProjects * 5))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-light text-foreground leading-tight">
                {getGreeting()}{userName ? `, ${userName}` : ""}.
              </h1>
              <p className="mt-0.5 text-muted-foreground font-light text-xs md:text-sm capitalize">
                {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              {companies.length > 0 && (
                <p className="mt-2 text-xs text-primary/70 border-l-2 border-primary/30 pl-3 font-light line-clamp-2 max-w-lg">
                  Empoderando {companies.length} {companies.length === 1 ? "empresa" : "empresas"} con IA estratégica.
                </p>
              )}
            </div>
            <button
              onClick={() => navigate("/chat")}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chat IA</span>
              <span className="sm:hidden">Chat</span>
            </button>
          </div>
        </motion.div>

        {/* ── KPI CARDS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { icon: Building2, label: "Empresas", value: companies.length || "—", sub: "unidades", color: "text-violet-400", href: "/vault/companies" },
              { icon: Target, label: "Alineación", value: companies.length > 0 ? `${alignmentScore}%` : "—", sub: "estratégica", color: "text-primary", href: "/vault/companies" },
              { icon: CheckCircle2, label: "Tareas", value: pendingTasks || "—", sub: "pendientes", color: "text-sky-400", href: "/vault/operator" },
              { icon: Heart, label: "Energía", value: latestEnergy ? `${latestEnergy.mood}/5` : "—", sub: latestEnergy ? (latestEnergy.level === "high" ? "⚡ Alta" : latestEnergy.level === "medium" ? "😐 Media" : "😴 Baja") : "sin registro", color: "text-rose-400", href: "/vault/founder" },
              { icon: Users, label: "Contactos", value: contactsCount || "—", sub: "en tu red", color: "text-amber-400", href: "/vault/contacts" },
            ].map((card, i) => (
              <button
                key={i}
                onClick={() => navigate(card.href)}
                className="flex flex-col items-start p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all text-left group"
              >
                <card.icon className={`w-4 h-4 ${card.color} mb-2`} strokeWidth={1.5} />
                <p className="text-xl font-semibold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground font-light">{card.label}</p>
                <p className="text-[10px] text-muted-foreground/50">{card.sub}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── CHARTS ROW ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Energy & Mood Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="md:col-span-2 bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" /> Estado de Ánimo y Energía
                </h2>
                <p className="text-xs text-muted-foreground font-light">Últimos 7 días</p>
              </div>
              {latestEnergy && (
                <span className="text-xs px-2 py-1 rounded-full border"
                  style={{ borderColor: energyColor(latestEnergy.level), color: energyColor(latestEnergy.level) }}>
                  Hoy: {latestEnergy.level === "high" ? "Alta" : latestEnergy.level === "medium" ? "Media" : "Baja"}
                </span>
              )}
            </div>
            {energyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={energyData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="mood" name="Ánimo" stroke="#6366f1" strokeWidth={2} fill="url(#moodGrad)" dot={{ fill: "#6366f1", r: 3 }} />
                  <Area type="monotone" dataKey="energy" name="Energía" stroke="#f59e0b" strokeWidth={2} fill="url(#energyGrad)" dot={{ fill: "#f59e0b", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex flex-col items-center justify-center text-center">
                <Heart className="w-8 h-8 text-muted-foreground/30 mb-2" strokeWidth={1} />
                <p className="text-sm text-muted-foreground/50 font-light">Sin check-ins de energía aún</p>
                <button onClick={() => navigate("/vault/founder")} className="mt-2 text-xs text-primary hover:underline">Registrar ahora →</button>
              </div>
            )}
          </motion.div>

          {/* Project Status Donut */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <h2 className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-indigo-400" /> Proyectos
            </h2>
            <p className="text-xs text-muted-foreground font-light mb-4">por estado</p>
            {projectStats.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={projectStats} cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                      dataKey="value" paddingAngle={3}>
                      {projectStats.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, n: string) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {projectStats.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-muted-foreground">{s.name}</span>
                      </div>
                      <span className="font-medium text-foreground">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[160px] flex flex-col items-center justify-center text-center">
                <Briefcase className="w-8 h-8 text-muted-foreground/30 mb-2" strokeWidth={1} />
                <p className="text-sm text-muted-foreground/50 font-light">Sin proyectos aún</p>
                <button onClick={() => navigate("/vault/operator")} className="mt-2 text-xs text-primary hover:underline">Crear proyecto →</button>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── BOTTOM ROW ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <h2 className="text-sm font-medium text-foreground flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-violet-400" /> Actividad Reciente del Cerebro
            </h2>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-base leading-none mt-0.5">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-foreground font-light leading-relaxed truncate">{item.text}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                        {new Date(item.time).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        {" · "}
                        <span className={item.type === "memory" ? "text-violet-400" : item.type === "insight" ? "text-amber-400" : "text-sky-400"}>
                          {item.type === "memory" ? "Memoria" : item.type === "insight" ? "Aprendizaje" : "Evento"}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[120px] flex flex-col items-center justify-center text-center">
                <Brain className="w-8 h-8 text-muted-foreground/30 mb-2" strokeWidth={1} />
                <p className="text-sm text-muted-foreground/50 font-light">Empieza a chatear para crear memorias</p>
              </div>
            )}
          </motion.div>

          {/* Today + Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="flex flex-col gap-4"
          >
            {/* Today's Events */}
            <div className="bg-card border border-border rounded-xl p-5 flex-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-sky-400" /> Hoy
                </h2>
                <button onClick={() => navigate("/calendar")} className="text-xs text-muted-foreground hover:text-primary transition-colors">Ver todo →</button>
              </div>
              {todayEvents.length > 0 ? (
                <div className="space-y-2">
                  {todayEvents.map((ev, i) => (
                    <div key={i} className="flex gap-3 items-center py-1.5 border-b border-border/30 last:border-0">
                      <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="text-xs text-primary font-medium w-10 shrink-0">
                        {new Date(ev.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </span>
                      <span className="text-xs text-foreground font-light truncate">{ev.event_title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/50 font-light italic">Sin eventos hoy. KAWA los crea automáticamente desde el chat.</p>
              )}
            </div>

            {/* Quick nav */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Proyectos", href: "/vault/operator", icon: Briefcase, color: "text-indigo-400" },
                { label: "Contexto", href: "/vault/context", icon: Brain, color: "text-violet-400" },
                { label: "Bienestar", href: "/vault/founder", icon: Heart, color: "text-rose-400" },
                { label: "Contactos", href: "/vault/contacts", icon: Users, color: "text-amber-400" },
              ].map((link, i) => (
                <button
                  key={i}
                  onClick={() => navigate(link.href)}
                  className="flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-all group text-left"
                >
                  <div className="flex items-center gap-2">
                    <link.icon className={`w-3.5 h-3.5 ${link.color}`} strokeWidth={1.5} />
                    <span className="text-xs text-foreground">{link.label}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── COMPANY VISION BAR ── */}
        {companies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-5 overflow-hidden relative group"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Visión Estratégica por Empresa
                </h2>
                <p className="text-[10px] text-muted-foreground font-light">Tus objetivos a largo plazo</p>
              </div>
              <TrendingUp className="w-4 h-4 text-primary/30 group-hover:text-primary transition-colors" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.slice(0, 3).map((comp, idx) => (
                <div key={comp.id} className="relative p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                  <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg" style={{ backgroundColor: comp.color }} />
                  <h3 className="text-[11px] font-bold text-foreground mb-1 truncate">{comp.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-light line-clamp-2 italic">"{comp.vision || "Sin visión..."}"</p>
                </div>
              ))}
              {companies.length > 3 && (
                <button
                  onClick={() => navigate("/vault/companies")}
                  className="p-3 rounded-lg border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
                >
                  Ver {companies.length - 3} más →
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── CTA si no hay empresas ── */}
        {companies.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <CreateCompanyDialog onCompanyCreated={() => window.location.reload()}>
              <button
                className="w-full text-left px-5 py-4 rounded-xl border border-dashed border-primary/30 text-sm text-muted-foreground hover:border-primary/60 hover:text-foreground transition-all flex items-center justify-between"
              >
                <span>🏢 Crea tu primera Empresa para definir su Visión y Misión estratégica</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </CreateCompanyDialog>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
