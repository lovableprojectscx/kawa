import { motion } from "framer-motion";
import { Telescope, Briefcase, Heart, Globe, TrendingUp, Calendar, Zap, AlertTriangle, ArrowUp, Bot, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { chatService } from "@/lib/chatService";
import ReactMarkdown from "react-markdown";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Fundador");

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Buenos días";
    if (h >= 12 && h < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  // Chat widget state
  const [chatInput, setChatInput] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleQuickChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const message = chatInput;
    setChatInput("");
    setChatLoading(true);
    setChatReply("");
    try {
      const reply = await chatService.sendMessage(message);
      setChatReply(reply);
    } catch {
      toast.error("Error al conectar con KAWA");
    } finally {
      setChatLoading(false);
    }
  };
  const [data, setData] = useState({
    vision: { status: "Offline", detail: "Sin datos" },
    operator: { status: "0 Proyectos", detail: "Sin actividad" },
    founder: { status: "Sin datos", detail: "Sin registros hoy", energyHistory: [] as number[] },
    context: { status: "0 Contactos", detail: "Sin reuniones" },
    agenda: [] as any[],
    alerts: [] as any[]
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // User display name
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
      if (fullName) {
        setUserName(fullName.split(" ")[0]);
      } else if (user.email) {
        setUserName(user.email.split("@")[0]);
      }

      // 1. Vision
      const { data: vision } = await supabase.from('vault_vision').select('*').eq('user_id', user.id).maybeSingle();

      // 2. Operator
      const { data: projects } = await supabase.from('vault_operator_projects').select('*').eq('user_id', user.id);
      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;

      // 3. Founder
      const { data: energyLogs } = await supabase
        .from('vault_founder_energy')
        .select('*')
        .eq('user_id', user.id)
        .order('checkin_date', { ascending: false })
        .limit(7);

      const latestEnergy = energyLogs?.[0];
      const energyHistory = energyLogs?.slice().reverse().map(l => {
        if (l.energy_level === 'high') return 5;
        if (l.energy_level === 'medium') return 3;
        return 1;
      }) || [];

      // 4. Context
      const { data: contacts } = await supabase.from('vault_context_people').select('id').eq('user_id', user.id);

      // 5. Agenda
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: events } = await supabase
        .from('vault_operator_calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true });

      // 6. Alerts (Dynamic)
      const newAlerts = [];
      if (latestEnergy && (latestEnergy.energy_level === 'low')) {
        newAlerts.push({ icon: AlertTriangle, text: "Energía baja detectada", level: "warn" });
      }

      const { count: pendingTasks } = await supabase
        .from('vault_operator_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (pendingTasks && pendingTasks > 0) {
        newAlerts.push({ icon: Zap, text: `Tienes ${pendingTasks} tareas pendientes`, level: "info" });
      }

      setData({
        vision: {
          status: vision ? "Alineado" : "Pendiente",
          detail: vision ? (vision.north_star ? "North Star definido" : "Falta North Star") : "Configura tu visión"
        },
        operator: {
          status: `${projects?.length || 0} Proyectos`,
          detail: `${activeProjects} activos actualmente`
        },
        founder: {
          status: latestEnergy ? `Estado: ${latestEnergy.mood_score}/5` : "Sin datos",
          detail: latestEnergy ? `Última energía: ${latestEnergy.energy_level}` : "Realiza tu check-in",
          energyHistory
        },
        context: {
          status: `${contacts?.length || 0} Contactos`,
          detail: contacts?.length ? "Red activa" : "Sin red documentada"
        },
        agenda: events || [],
        alerts: newAlerts
      });

    } catch (error) {
      console.error("Dashboard error:", error);
      toast.error("Error al cargar datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  const vaultSummaries = [
    {
      icon: Telescope,
      title: "Visión",
      value: data.vision.status,
      detail: data.vision.detail,
      color: "text-primary",
      bg: "bg-primary/10",
      to: "/vault/vision",
    },
    {
      icon: Briefcase,
      title: "Proyectos",
      value: data.operator.status,
      detail: data.operator.detail,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      to: "/vault/operator",
    },
    {
      icon: Heart,
      title: "Fundador",
      value: data.founder.status,
      detail: data.founder.detail,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      to: "/vault/founder",
    },
    {
      icon: Globe,
      title: "Contexto",
      value: data.context.status,
      detail: data.context.detail,
      color: "text-sky-400",
      bg: "bg-sky-400/10",
      to: "/vault/context",
    },
  ];

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="text-3xl md:text-4xl text-foreground">{getGreeting()}, {userName}</h1>
        <p className="mt-2 text-muted-foreground font-light">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} · Tu panorama del día.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {vaultSummaries.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            onClick={() => navigate(v.to)}
            className="bg-card border border-border rounded-lg p-5 cursor-pointer transition-all duration-300 hover:border-primary/30 hover:neon-glow group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-md ${v.bg}`}>
                <v.icon className={`w-5 h-5 ${v.color}`} strokeWidth={1.5} />
              </div>
              <span className="text-xs text-muted-foreground font-display tracking-wider uppercase">
                {v.title}
              </span>
            </div>
            <p className="text-lg text-foreground font-display font-semibold">{v.value}</p>
            <p className="text-xs text-muted-foreground mt-1 font-light">{v.detail}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Chat Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8 bg-card border border-border rounded-lg p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <h2 className="text-lg font-display text-foreground">KAWA</h2>
          <span className="flex items-center gap-1.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-muted-foreground">Activo</span>
          </span>
          <button
            onClick={() => navigate("/chat")}
            className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Chat completo <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {chatReply && (
          <div className="mb-4 px-4 py-3 bg-muted/40 border border-border/50 rounded-xl text-sm text-foreground/90 font-light leading-relaxed prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{chatReply}</ReactMarkdown>
          </div>
        )}

        <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-2.5 focus-within:border-primary/40 transition-all">
          <input
            type="text"
            placeholder={chatLoading ? "KAWA está pensando..." : "Pregunta algo a KAWA..."}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickChat()}
            disabled={chatLoading}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-light"
          />
          <button
            onClick={handleQuickChat}
            disabled={chatLoading || !chatInput.trim()}
            className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" strokeWidth={2} />}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <h2 className="text-lg font-display text-foreground">Agenda de Hoy</h2>
          </div>
          <div className="space-y-3">
            {data.agenda.length > 0 ? (
              data.agenda.map((event, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3 rounded-md bg-muted/50 border border-border/50"
                >
                  <span className="text-sm text-primary font-display font-semibold w-14">
                    {formatTime(event.start_time)}
                  </span>
                  <span className="text-sm text-foreground font-light flex-1">{event.event_title}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-display tracking-wider uppercase ${event.type === "meeting"
                        ? "bg-sky-400/10 text-sky-400"
                        : event.type === "block"
                          ? "bg-amber-400/10 text-amber-400"
                          : "bg-primary/10 text-primary"
                      }`}
                  >
                    {event.type}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm italic">
                No hay eventos programados para hoy.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <h2 className="text-lg font-display text-foreground">Alertas</h2>
          </div>
          <div className="space-y-3">
            {data.alerts.length > 0 ? (
              data.alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 px-4 py-3 rounded-md border ${alert.level === "warn"
                      ? "bg-amber-400/5 border-amber-400/20"
                      : "bg-primary/5 border-primary/20"
                    }`}
                >
                  <alert.icon
                    className={`w-4 h-4 mt-0.5 shrink-0 ${alert.level === "warn" ? "text-amber-400" : "text-primary"
                      }`}
                    strokeWidth={1.5}
                  />
                  <span className="text-sm text-foreground font-light">{alert.text}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-xs uppercase tracking-widest opacity-50">
                Sin alertas activas
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-xs text-muted-foreground font-display tracking-wider uppercase">
                Energía últimos días
              </span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {data.founder.energyHistory.length > 0 ? (
                data.founder.energyHistory.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm transition-all"
                      style={{
                        height: `${(val / 5) * 100}%`,
                        backgroundColor:
                          val <= 1
                            ? "hsl(0 84% 60%)"
                            : val <= 3
                              ? "hsl(45 93% 58%)"
                              : "hsl(142 71% 45%)",
                      }}
                    />
                  </div>
                ))
              ) : (
                <div className="flex-1 text-[10px] text-muted-foreground italic text-center">Sin historial</div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
