import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Target,
  Briefcase,
  Heart,
  Users,
  Brain,
  FileSearch,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Zap,
  BarChart3,
  Calendar,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Upload,
  Clock,
} from "lucide-react";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay },
  }),
};

// ─── Feature detail section ───────────────────────────────────────────────────
interface FeatureSectionProps {
  badge: string;
  icon: React.ElementType;
  title: string;
  description: string;
  features: { icon: React.ElementType; title: string; desc: string }[];
  visual: React.ReactNode;
  reverse?: boolean;
  color: string;
  bg: string;
}

function FeatureSection({
  badge, icon: Icon, title, description, features, visual, reverse, color, bg,
}: FeatureSectionProps) {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className={`grid lg:grid-cols-2 gap-16 items-center ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
          {/* Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className={`inline-flex items-center gap-2 ${bg} border ${color.replace("text-", "border-").replace("400", "500/20").replace("primary", "primary/20")} rounded-full px-3 py-1.5 mb-6`}>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className={`text-xs font-semibold ${color}`}>{badge}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-black mb-4 leading-tight">
              {title}
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-8">{description}</p>
            <div className="space-y-5">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <f.icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{f.title}</p>
                    <p className="text-white/45 text-sm leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.15}
            variants={fadeUp}
          >
            {visual}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Vision visual ─────────────────────────────────────────────────────────────
function VisionVisual() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-3xl pointer-events-none" />
      <div className="relative bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-white font-semibold text-sm">Bóveda de Visión</span>
        </div>
        {/* North Star */}
        <div className="bg-primary/[0.08] border border-primary/20 rounded-xl p-4">
          <p className="text-primary text-[10px] font-semibold tracking-widest uppercase mb-1">Norte Estrella</p>
          <p className="text-white text-sm font-semibold">Llegar a $1M ARR con un equipo de 5 personas</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full w-[68%] bg-gradient-to-r from-primary to-rose-500 rounded-full" />
            </div>
            <span className="text-primary text-xs font-bold">68%</span>
          </div>
        </div>
        {/* Anti-goals */}
        <div>
          <p className="text-white/40 text-[10px] font-semibold tracking-widest uppercase mb-2">Anti-Metas</p>
          <div className="space-y-1.5">
            {["No levantar ronda antes de Q4", "No contratar +10 personas", "No pivotar el core product"].map((ag) => (
              <div key={ag} className="flex items-center gap-2 text-white/50 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500/60" />
                {ag}
              </div>
            ))}
          </div>
        </div>
        {/* Alignment score */}
        <div className="bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-400 text-xs font-semibold">Coherencia actual: 92%</p>
            <p className="text-white/40 text-[10px]">Tus últimas 5 decisiones están alineadas</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Operator visual ──────────────────────────────────────────────────────────
function OperatorVisual() {
  const columns = [
    { title: "Backlog", color: "text-white/40", count: 4 },
    { title: "Activos", color: "text-emerald-400", count: 3 },
    { title: "Terminados", color: "text-white/30", count: 6 },
  ];
  const cards = [
    { name: "App iOS v2.0", priority: "Alta", progress: 75, col: 1 },
    { name: "Campaña Q2", priority: "Media", progress: 40, col: 1 },
    { name: "API integraciones", priority: "Alta", progress: 90, col: 2 },
  ];
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-emerald-500/[0.06] blur-3xl rounded-3xl pointer-events-none" />
      <div className="relative bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-4 h-4 text-emerald-400" />
          <span className="text-white font-semibold text-sm">Kanban Operador</span>
          <div className="ml-auto flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
            <span className="text-emerald-400 text-[9px] font-medium">3 activos</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {columns.map((col, ci) => (
            <div key={col.title}>
              <div className="flex items-center gap-1.5 mb-2">
                <div className={`w-1.5 h-1.5 rounded-full ${ci === 1 ? "bg-emerald-400" : "bg-white/20"}`} />
                <span className={`text-[10px] font-semibold ${col.color}`}>{col.title}</span>
                <span className="text-white/20 text-[9px]">{col.count}</span>
              </div>
              <div className="space-y-2">
                {cards
                  .filter((c) => c.col === ci)
                  .map((card) => (
                    <div key={card.name} className="bg-white/[0.04] border border-white/[0.07] rounded-lg p-2">
                      <p className="text-white text-[9px] font-medium leading-tight mb-1.5">{card.name}</p>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[8px] ${card.priority === "Alta" ? "text-rose-400" : "text-amber-400"}`}>
                          {card.priority}
                        </span>
                        <span className="text-white/30 text-[8px]">{card.progress}%</span>
                      </div>
                      <div className="h-0.5 bg-white/[0.05] rounded-full">
                        <div
                          className="h-full bg-emerald-500/60 rounded-full"
                          style={{ width: `${card.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                {ci === 0 && (
                  <div className="border border-dashed border-white/[0.07] rounded-lg p-2 text-center">
                    <span className="text-white/20 text-[8px]">+ Añadir tarea</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Founder visual ───────────────────────────────────────────────────────────
function FounderVisual() {
  const bars = [3, 4, 2, 5, 4, 3, 4];
  const colors = ["bg-amber-500", "bg-emerald-500", "bg-rose-500", "bg-emerald-500", "bg-emerald-500", "bg-amber-500", "bg-emerald-500"];
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-rose-500/[0.06] blur-3xl rounded-3xl pointer-events-none" />
      <div className="relative bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-400" />
          <span className="text-white font-semibold text-sm">Bienestar del Fundador</span>
        </div>
        {/* Today */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-rose-500/[0.08] border border-rose-500/20 rounded-xl p-3 text-center">
            <p className="text-3xl mb-1">😊</p>
            <p className="text-white text-xs font-semibold">Estado hoy</p>
            <p className="text-white/40 text-[9px]">Bien · En flujo</p>
          </div>
          <div className="bg-amber-500/[0.08] border border-amber-500/20 rounded-xl p-3 text-center">
            <p className="text-amber-400 font-black text-2xl">4/5</p>
            <p className="text-white text-xs font-semibold">Energía</p>
            <p className="text-white/40 text-[9px]">⚡ Alta</p>
          </div>
        </div>
        {/* Weekly chart */}
        <div>
          <p className="text-white/40 text-[10px] font-semibold tracking-widest uppercase mb-3">Energía últimos 7 días</p>
          <div className="flex items-end gap-2 h-16">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-md ${colors[i]} opacity-70`}
                  style={{ height: `${(h / 5) * 52}px` }}
                />
                <span className="text-white/30" style={{ fontSize: "8px" }}>{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Alert */}
        <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-lg p-2.5 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-3 h-3 text-amber-400" />
          </div>
          <p className="text-amber-400/80 text-[9px]">
            Tu energía baja los miércoles — considera eliminar las reuniones ese día.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Context visual ───────────────────────────────────────────────────────────
function ContextVisual() {
  const contacts = [
    { name: "Carlos M.", role: "Investor", last: "Hace 3 días", tag: "Prioritario", tagColor: "text-primary bg-primary/10 border-primary/20" },
    { name: "Ana García", role: "CTO potencial", last: "Hace 1 semana", tag: "Seguimiento", tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { name: "Rodrigo V.", role: "Partner", last: "Hace 2 días", tag: "Activo", tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  ];
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-sky-500/[0.06] blur-3xl rounded-3xl pointer-events-none" />
      <div className="relative bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-sky-400" />
          <span className="text-white font-semibold text-sm">Red de Contexto</span>
          <span className="ml-auto text-white/30 text-[10px]">24 contactos</span>
        </div>
        {contacts.map((c) => (
          <div key={c.name} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold">{c.name}</p>
              <p className="text-white/40 text-[9px]">{c.role} · {c.last}</p>
            </div>
            <span className={`text-[9px] font-medium border rounded-full px-2 py-0.5 flex-shrink-0 ${c.tagColor}`}>
              {c.tag}
            </span>
          </div>
        ))}
        <div className="bg-sky-500/[0.07] border border-sky-500/20 rounded-lg p-2.5 flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
          <p className="text-sky-400/80 text-[9px]">
            Carlos mencionó interés en tu ronda Series A en la última llamada. Considera el seguimiento esta semana.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── AI visual ────────────────────────────────────────────────────────────────
function AiVisual() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-violet-500/[0.08] blur-3xl rounded-3xl pointer-events-none" />
      <div className="relative bg-[#0a0a0a] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#060606]">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-white font-semibold text-sm">KAWA Chat · RAG activo</span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[9px]">4 docs indexados</span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-end">
            <div className="bg-primary/15 border border-primary/20 rounded-xl px-3 py-2 max-w-[80%]">
              <p className="text-white/80 text-xs">Resume los puntos clave del pitch deck que subí</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 max-w-[90%] space-y-1.5">
              <div className="flex items-center gap-1.5 mb-2">
                <FileSearch className="w-3 h-3 text-primary" />
                <span className="text-primary text-[9px] font-semibold">Referenciando pitch_deck_v3.pdf</span>
              </div>
              <p className="text-white/60 text-xs leading-relaxed">
                Tu pitch deck tiene 3 puntos fuertes: TAM de $4B bien documentado, tracción de 180% YoY y equipo con exits previos.
              </p>
              <p className="text-white/60 text-xs leading-relaxed">
                Punto débil identificado: el modelo de monetización no está claro en la diapositiva 8 — los inversores pueden confundirse.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-primary/15 border border-primary/20 rounded-xl px-3 py-2 max-w-[80%]">
              <p className="text-white/80 text-xs">¿Cómo debería preparar la reunión con Carlos de mañana?</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-2 max-w-[90%]">
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="w-3 h-3 text-sky-400" />
                <span className="text-sky-400 text-[9px] font-semibold">Consultando Bóveda de Contexto</span>
              </div>
              <p className="text-white/60 text-xs leading-relaxed">
                Carlos preguntó por el CAC la última vez. Trae los números actualizados. También mencionó que le interesa el mercado de Lima — enfócate en eso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <LandingNav />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/[0.06] blur-[100px] rounded-full pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-4">Funciones</p>
            <h1 className="text-5xl md:text-6xl font-display font-black mb-6 leading-tight">
              Cada función diseñada{" "}
              <span className="bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent">
                para fundadores
              </span>
            </h1>
            <p className="text-white/50 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-8">
              No es un gestor de tareas genérico ni un CRM para equipos de ventas. KAWA
              fue construido específicamente para la complejidad de operar como fundador.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {["Bóveda de Visión", "Bóveda de Operador", "Bóveda del Fundador", "Bóveda de Contexto", "Chat IA", "RAG Documental"].map((tag) => (
                <span key={tag} className="text-white/50 text-sm bg-white/[0.05] border border-white/[0.08] rounded-full px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature sections */}
      <FeatureSection
        badge="Vault Vision"
        icon={Target}
        title="Tu Norte siempre en el horizonte"
        description="Define lo que importa, blinda lo que no harás, y deja que KAWA te avise cuando una decisión se desvía del camino que elegiste."
        features={[
          { icon: Target, title: "Norte Estrella con OKRs", desc: "Registra tu objetivo principal con indicadores clave y mide el avance semana a semana." },
          { icon: Shield, title: "Anti-metas como guardianes", desc: "Define lo que no harás. KAWA detecta cuando una oportunidad contradice tus límites estratégicos." },
          { icon: TrendingUp, title: "Score de coherencia", desc: "Un indicador vivo que calcula qué tan alineadas están tus últimas decisiones con tu Norte." },
          { icon: Sparkles, title: "Alertas de desalineación", desc: "Notificaciones proactivas cuando algo en tu operación parece ir contra tu estrategia." },
        ]}
        visual={<VisionVisual />}
        color="text-primary"
        bg="bg-primary/10"
      />

      <div className="border-t border-white/[0.04]" />

      <FeatureSection
        badge="Vault Operator"
        icon={Briefcase}
        title="Kanban inteligente adaptado a tu energía"
        description="Gestiona proyectos y tareas con un tablero visual que se adapta a tu capacidad real. La IA prioriza por ti cuando tienes poco foco."
        features={[
          { icon: Layers, title: "Kanban drag & drop", desc: "Tres columnas: Backlog, Activos y Terminados. Mueve tarjetas con fluidez." },
          { icon: BarChart3, title: "Gestión de capacidad", desc: "Configura cuántas horas puedes trabajar esta semana y KAWA ajusta las recomendaciones." },
          { icon: Clock, title: "Deadlines y prioridades", desc: "Etiquetas de prioridad (Alta / Media / Baja) y fechas límite con alertas automáticas." },
          { icon: Calendar, title: "Vista de agenda", desc: "Eventos del calendario integrados en la misma vista para planificar sin cambiar de app." },
        ]}
        visual={<OperatorVisual />}
        reverse
        color="text-emerald-400"
        bg="bg-emerald-500/10"
      />

      <div className="border-t border-white/[0.04]" />

      <FeatureSection
        badge="Vault Founder"
        icon={Heart}
        title="Tu bienestar es un dato estratégico"
        description="Los mejores fundadores entienden que su energía es un recurso escaso. KAWA lo mide, lo analiza y lo usa para protegerte de ti mismo."
        features={[
          { icon: Heart, title: "Check-in diario de energía", desc: "5 emojis de estado de ánimo + niveles de energía. Tarda 10 segundos, construye meses de contexto." },
          { icon: TrendingUp, title: "Historial y tendencias", desc: "Visualiza tu energía de los últimos 7, 30 o 90 días en gráficos claros." },
          { icon: Sparkles, title: "Detección de patrones de burnout", desc: "KAWA identifica semanas de baja energía recurrente y te sugiere ajustes antes de que sea crítico." },
          { icon: Brain, title: "Sugerencias contextuales", desc: "Cuando tu energía es baja, KAWA ajusta sus recomendaciones de prioridades automáticamente." },
        ]}
        visual={<FounderVisual />}
        color="text-rose-400"
        bg="bg-rose-500/10"
      />

      <div className="border-t border-white/[0.04]" />

      <FeatureSection
        badge="Vault Context"
        icon={Users}
        title="Tu red con memoria perfecta"
        description="Cada conversación importante, cada contacto clave, cada promesa hecha — todo indexado y buscable. Tu red trabaja para ti incluso cuando no la consultas."
        features={[
          { icon: Users, title: "Gestión de contactos clave", desc: "Añade personas con su rol, empresa y notas de contexto. No más post-its perdidos." },
          { icon: MessageSquare, title: "Resúmenes de interacciones", desc: "Registra qué se habló en cada reunión. La IA extrae los puntos accionables." },
          { icon: FileSearch, title: "Búsqueda semántica", desc: "Pregunta '¿quién me dijo algo sobre inversión Series A?' y KAWA encuentra la conversación exacta." },
          { icon: TrendingUp, title: "Red activa e inteligente", desc: "KAWA sugiere con quién hablar esta semana basándose en tus proyectos y objetivos actuales." },
        ]}
        visual={<ContextVisual />}
        reverse
        color="text-sky-400"
        bg="bg-sky-500/10"
      />

      <div className="border-t border-white/[0.04]" />

      <FeatureSection
        badge="IA Avanzada"
        icon={Brain}
        title="Un chat que sabe todo sobre tu negocio"
        description="No es ChatGPT con un wrapper. KAWA tiene acceso a tus 4 bóvedas, tus documentos y tu historial completo para respuestas que importan."
        features={[
          { icon: Brain, title: "Chat con contexto total", desc: "Cada respuesta tiene en cuenta tu visión, proyectos activos, energía del día y tu red de contactos." },
          { icon: Upload, title: "RAG sobre tus documentos", desc: "Sube PDFs, notas y contratos. El sistema los indexa con embeddings para respuestas precisas." },
          { icon: Sparkles, title: "Smart Router automático", desc: "KAWA detecta el tipo de consulta y actualiza las bóvedas relevantes sin que tengas que indicarlo." },
          { icon: MessageSquare, title: "Memoria persistente", desc: "Cada conversación enriquece tu contexto. KAWA se vuelve más preciso con cada semana que pasa." },
        ]}
        visual={<AiVisual />}
        color="text-violet-400"
        bg="bg-violet-500/10"
      />

      {/* Final CTA */}
      <section className="py-24 px-6 text-center border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-display font-black mb-4">
              ¿Listo para probarlo?
            </h2>
            <p className="text-white/50 mb-8">
              Empieza gratis hoy. Onboarding en 2 minutos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-primary/20"
              >
                <Zap className="w-4 h-4" />
                Empezar gratis
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 text-white/50 hover:text-white font-medium px-6 py-3 rounded-xl border border-white/[0.10] hover:border-white/[0.20] transition-all duration-200"
              >
                Ver precios
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
