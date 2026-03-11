import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap,
  ArrowRight,
  Brain,
  Target,
  Briefcase,
  Heart,
  Users,
  MessageSquare,
  FileSearch,
  BarChart3,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Calendar,
  Shield,
  ChevronRight,
} from "lucide-react";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { supabase } from "@/lib/supabase";

// ─── Fade-in animation helper ────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay },
  }),
};

// ─── App mockup component ─────────────────────────────────────────────────────
function AppMockup() {
  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Ambient glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 right-1/4 w-48 h-48 bg-rose-500/10 blur-[60px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-10 left-1/4 w-48 h-48 bg-violet-500/10 blur-[60px] rounded-full pointer-events-none" />

      {/* Floating badge cards */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="absolute -left-8 top-20 z-10 hidden lg:flex items-center gap-2 bg-[#0f0f0f] border border-emerald-500/20 rounded-xl px-3 py-2 shadow-xl"
      >
        <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
          <Target className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div>
          <p className="text-white text-[10px] font-semibold leading-tight">Alineado al Norte</p>
          <p className="text-emerald-400 text-[9px]">92% coherencia</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute -right-8 top-28 z-10 hidden lg:flex items-center gap-2 bg-[#0f0f0f] border border-amber-500/20 rounded-xl px-3 py-2 shadow-xl"
      >
        <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <p className="text-white text-[10px] font-semibold leading-tight">Energía Alta</p>
          <p className="text-amber-400 text-[9px]">4/5 hoy · ⚡</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="absolute -right-6 bottom-20 z-10 hidden lg:flex items-center gap-2 bg-[#0f0f0f] border border-sky-500/20 rounded-xl px-3 py-2 shadow-xl"
      >
        <div className="w-6 h-6 rounded-lg bg-sky-500/15 flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <div>
          <p className="text-white text-[10px] font-semibold leading-tight">IA respondió</p>
          <p className="text-sky-400 text-[9px]">3 insights nuevos</p>
        </div>
      </motion.div>

      {/* Browser chrome */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
        className="relative bg-[#0a0a0a] border border-white/[0.10] rounded-2xl overflow-hidden shadow-2xl"
        style={{ boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)" }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-[#060606]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white/[0.05] rounded-md h-5 flex items-center gap-1.5 px-3 w-40">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-white/35 text-[9px]">app.kawa.ai/dashboard</span>
            </div>
          </div>
        </div>

        {/* App layout */}
        <div className="flex" style={{ height: 320 }}>
          {/* Sidebar */}
          <div className="w-44 border-r border-white/[0.06] bg-[#060606] p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-primary/[0.12] border border-primary/20 mb-2">
              <div className="w-5 h-5 bg-gradient-to-br from-primary to-rose-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black" style={{ fontSize: "9px" }}>K</span>
              </div>
              <div>
                <p className="text-white font-semibold" style={{ fontSize: "10px" }}>KAWA</p>
                <p className="text-white/40" style={{ fontSize: "8px" }}>Tu orquestador</p>
              </div>
            </div>
            {[
              { label: "Dashboard", active: true, dot: "bg-primary" },
              { label: "Chat IA", active: false, dot: "bg-white/20" },
              { label: "Proyectos", active: false, dot: "bg-white/20" },
              { label: "Empresas", active: false, dot: "bg-white/20" },
              { label: "Contexto", active: false, dot: "bg-white/20" },
              { label: "Fundador", active: false, dot: "bg-white/20" },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${item.active ? "bg-white/[0.08] text-white" : "text-white/35"
                  }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.dot}`} />
                <span style={{ fontSize: "10px" }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 overflow-hidden bg-[#070707]">
            {/* Header row */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white font-semibold" style={{ fontSize: "11px" }}>Buenos días, Fundador 👋</p>
                <p className="text-white/40" style={{ fontSize: "9px" }}>Martes · Todo bajo control</p>
              </div>
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400" style={{ fontSize: "8px" }}>KAWA activo</span>
              </div>
            </div>

            {/* 4 vault cards */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: "Empresas", metric: "2", sub: "entidades", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
                { label: "Proyectos", metric: "3", sub: "activos", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                { label: "Contexto", metric: "24", sub: "contactos clave", color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
                { label: "Fundador", metric: "4/5", sub: "energía hoy ⚡", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
              ].map((v) => (
                <div key={v.label} className={`${v.bg} border ${v.border} rounded-lg p-2.5`}>
                  <p className="text-white/40" style={{ fontSize: "8px" }}>{v.label}</p>
                  <p className={`${v.color} font-bold mt-0.5`} style={{ fontSize: "18px", lineHeight: 1 }}>{v.metric}</p>
                  <p className="text-white/40 mt-0.5" style={{ fontSize: "8px" }}>{v.sub}</p>
                </div>
              ))}
            </div>

            {/* AI chat widget */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Brain className="w-2.5 h-2.5 text-primary" />
                <p className="text-primary" style={{ fontSize: "8px", fontWeight: 600 }}>KAWA Chat</p>
              </div>
              <p className="text-white/50" style={{ fontSize: "9px" }}>¿Qué debo priorizar hoy?</p>
              <div className="mt-1.5 bg-white/[0.04] rounded p-1.5">
                <p className="text-white/35" style={{ fontSize: "8px", lineHeight: 1.4 }}>
                  Con tu energía alta y el deadline del proyecto B el viernes, te sugiero bloquear 3h esta mañana para cerrar el módulo de pagos...
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Vault card ───────────────────────────────────────────────────────────────
interface VaultCardProps {
  icon: React.ElementType;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  color: string;
  bg: string;
  border: string;
  delay: number;
}

function VaultCard({ icon: Icon, name, tagline, description, features, color, bg, border, delay }: VaultCardProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      custom={delay}
      variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative group p-6 rounded-2xl border ${border} ${bg} overflow-hidden cursor-default`}
    >
      {/* Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full -translate-y-8 translate-x-8 bg-current ${color}`} style={{ opacity: 0.05 }} />

      <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>

      <p className="text-white/40 text-xs font-medium tracking-widest uppercase mb-1">{tagline}</p>
      <h3 className="text-white font-display font-bold text-lg mb-2">{name}</h3>
      <p className="text-white/50 text-sm leading-relaxed mb-4">{description}</p>

      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-white/60 text-sm">
            <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${color}`} />
            {f}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function Stat({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={delay}
      variants={fadeUp}
      className="text-center"
    >
      <p className="text-4xl md:text-5xl font-display font-black text-white mb-1">{value}</p>
      <p className="text-white/40 text-sm">{label}</p>
    </motion.div>
  );
}

// ─── Testimonial card ─────────────────────────────────────────────────────────
function TestimonialCard({
  quote, name, role, avatar, delay,
}: {
  quote: string; name: string; role: string; avatar: string; delay: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      custom={delay}
      variants={fadeUp}
      className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.14] transition-colors"
    >
      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-white/70 text-sm leading-relaxed mb-5 italic">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-rose-600/40 flex items-center justify-center text-white font-bold text-xs border border-white/[0.10]">
          {avatar}
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-tight">{name}</p>
          <p className="text-white/40 text-xs">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  // If already logged in, go to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <LandingNav />

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {/* Top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/[0.08] blur-[120px] rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-primary/[0.10] border border-primary/25 rounded-full px-4 py-1.5 text-sm">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-white/80">Powered by</span>
              <span className="text-primary font-semibold">Gemini 2.5 Flash</span>
              <ChevronRight className="w-3 h-3 text-white/40" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center text-5xl md:text-6xl lg:text-7xl font-display font-black leading-[1.05] tracking-tight mb-6 max-w-5xl mx-auto"
          >
            Tu copiloto IA para{" "}
            <span className="bg-gradient-to-r from-primary via-rose-400 to-orange-400 bg-clip-text text-transparent">
              construir múltiples negocios sin quemarte
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center text-white/50 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
          >
            KAWA orquesta todas tus empresas, proyectos, bienestar y red de
            contactos en un solo lugar — dándote claridad estratégica
            cuando más la necesitas.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
          >
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-primary/20 active:scale-95 text-base"
            >
              <Zap className="w-4 h-4" />
              Empieza gratis hoy
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white font-medium px-6 py-3 rounded-xl border border-white/[0.10] hover:border-white/[0.20] transition-all duration-200 text-base"
            >
              Ver todas las funciones
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* App mockup */}
          <AppMockup />
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <Stat value="Early" label="Acceso beta" delay={0} />
          <Stat value="4" label="Bóvedas integradas" delay={0.1} />
          <Stat value="24/7" label="Memoria IA" delay={0.2} />
          <Stat value="∞" label="Focos de negocio" delay={0.3} />
        </div>
      </section>

      {/* ─── PROBLEM ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-4">El problema</p>
            <h2 className="text-4xl md:text-5xl font-display font-black mb-4">
              El caos que frena a los mejores fundadores
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Tienes la visión. Tienes el talento. Pero algo siempre se escapa.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart3,
                title: "Proyectos sin norte",
                desc: "Trabajas duro pero no sabes si estás moviendo las palancas correctas. Las tareas urgentes secuestran lo importante.",
                color: "text-rose-400",
                bg: "bg-rose-500/[0.08]",
                border: "border-rose-500/[0.15]",
                delay: 0,
              },
              {
                icon: Heart,
                title: "Burnout invisible",
                desc: "Tu energía se deteriora gradualmente. Para cuando lo notas, ya llevas semanas operando en modo de supervivencia.",
                color: "text-amber-400",
                bg: "bg-amber-500/[0.08]",
                border: "border-amber-500/[0.15]",
                delay: 0.1,
              },
              {
                icon: Users,
                title: "Contexto disperso",
                desc: "Cada reunión, cada conversación clave queda en notas dispersas. Tu red de contactos no trabaja para ti.",
                color: "text-sky-400",
                bg: "bg-sky-500/[0.08]",
                border: "border-sky-500/[0.15]",
                delay: 0.2,
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                custom={item.delay}
                variants={fadeUp}
                className={`p-6 rounded-2xl border ${item.border} ${item.bg}`}
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center mb-4`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOLUTION / 4 VAULTS ───────────────────────────────────────────── */}
      <section id="vaults" className="py-24 px-6 bg-[#030303]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-4">La solución</p>
            <h2 className="text-4xl md:text-5xl font-display font-black mb-4">
              Las 4 Bóvedas de KAWA
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Un sistema integral que conecta cada dimensión de tu vida como
              fundador. Todo sincronizado, todo inteligente.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <VaultCard
              icon={Target}
              name="Bóveda de Visión"
              tagline="Vault Vision"
              description="Define la visión, misión y límites de cada una de tus empresas. KAWA te ayuda a mantener el foco en lo que realmente mueve la aguja en cada entidad."
              features={["Visión y Misión por empresa", "Anti-metas (Lo que NO harás)", "Alineación estratégica", "Contexto por entidad"]}
              color="text-primary"
              bg="bg-primary/[0.07]"
              border="border-primary/[0.15]"
              delay={0}
            />
            <VaultCard
              icon={Briefcase}
              name="Bóveda de Operador"
              tagline="Vault Operator"
              description="Kanban inteligente para fundadores. Gestiona proyectos, tareas y deadlines. La IA optimiza tu carga de trabajo según tu energía real."
              features={["Kanban por proyectos", "Gestión de carga de trabajo", "Vinculación con empresas", "Priorización inteligente"]}
              color="text-emerald-400"
              bg="bg-emerald-500/[0.07]"
              border="border-emerald-500/[0.15]"
              delay={0.1}
            />
            <VaultCard
              icon={Heart}
              name="Bóveda del Fundador"
              tagline="Vault Founder"
              description="Tu bienestar es tu activo más valioso. Registra tu energía, estado de ánimo y detecta patrones de burnout antes de que te paralicen."
              features={["Check-in diario de energía", "Historial de bienestar", "Detección de burnout", "Sugerencias contextuales"]}
              color="text-rose-400"
              bg="bg-rose-500/[0.07]"
              border="border-rose-500/[0.15]"
              delay={0.2}
            />
            <VaultCard
              icon={Users}
              name="Bóveda de Contexto"
              tagline="Vault Context"
              description="Tu red de contactos con memoria IA. Registra cada conversación importante, mantén contexto de cada persona y nunca pierdas el hilo."
              features={["Gestión de contactos clave", "Resúmenes de interacciones", "Búsqueda semántica", "Red activa e inteligente"]}
              color="text-sky-400"
              bg="bg-sky-500/[0.07]"
              border="border-sky-500/[0.15]"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ─── AI FEATURES ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Chat mockup */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-3xl pointer-events-none" />
              <div className="relative bg-[#0a0a0a] border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#060606]">
                  <div className="w-5 h-5 bg-gradient-to-br from-primary to-rose-700 rounded-lg flex items-center justify-center">
                    <Brain className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white text-sm font-semibold">KAWA Chat</span>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-xs">Activo</span>
                  </div>
                </div>
                <div className="p-4 space-y-4" style={{ minHeight: 300 }}>
                  {[
                    {
                      role: "user",
                      text: "¿Cuánto tiempo debería dedicar al Proyecto Alpha esta semana?",
                    },
                    {
                      role: "ai",
                      text: "Basándome en tu energía de 4/5 hoy y el deadline del viernes, sugiero bloquear 3 horas mañana por la mañana. Tienes 2 tareas críticas pendientes en el módulo de pagos. Además, tu visión indica que este proyecto es prioritario en tu Norte Estrella actual.",
                    },
                    {
                      role: "user",
                      text: "¿Qué reunión no debería perderme esta semana?",
                    },
                    {
                      role: "ai",
                      text: "La reunión con Carlos el jueves — según tu historial, cada vez que hablan avanzan en la alianza estratégica que está directamente alineada con tu objetivo Q2.",
                    },
                  ].map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${msg.role === "user"
                            ? "bg-primary/20 border border-primary/20 text-white/90"
                            : "bg-white/[0.05] border border-white/[0.08] text-white/70"
                          }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
                    <input
                      readOnly
                      className="flex-1 bg-transparent text-sm text-white/30 placeholder:text-white/20 outline-none"
                      placeholder="Pregunta a KAWA sobre tu negocio, energía o estrategia..."
                    />
                    <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: feature list */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0.2}
              variants={fadeUp}
            >
              <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-4">
                IA de verdad
              </p>
              <h2 className="text-4xl md:text-5xl font-display font-black mb-4">
                Tu IA que te conoce de verdad
              </h2>
              <p className="text-white/50 text-lg leading-relaxed mb-8">
                No es un chatbot genérico. KAWA tiene acceso completo a tu
                contexto — proyectos, energía, contactos y documentos — para
                darte respuestas que realmente importan.
              </p>

              <div className="space-y-5">
                {[
                  {
                    icon: MessageSquare,
                    title: "Chat contextual completo",
                    desc: "Pregunta cualquier cosa sobre tu negocio. KAWA responde con tu contexto real, no con generalidades.",
                    color: "text-primary",
                    bg: "bg-primary/10",
                  },
                  {
                    icon: FileSearch,
                    title: "RAG sobre tus documentos",
                    desc: "Sube PDFs, notas y contratos. La IA los indexa y los usa para respuestas precisas.",
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                  },
                  {
                    icon: TrendingUp,
                    title: "Smart Memory",
                    desc: "Recuerda el contexto de tus proyectos y contactos para darte respuestas coherentes con tu realidad.",
                    color: "text-sky-400",
                    bg: "bg-sky-500/10",
                  },
                ].map((feat) => (
                  <div key={feat.title} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${feat.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <feat.icon className={`w-5 h-5 ${feat.color}`} />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">{feat.title}</h4>
                      <p className="text-white/50 text-sm leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-[#030303]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-4">Proceso</p>
            <h2 className="text-4xl md:text-5xl font-display font-black mb-4">
              Operativo en minutos
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Sin configuraciones complejas. En 3 pasos tienes tu sistema
              personalizado funcionando.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[33%] right-[33%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {[
              {
                step: "01",
                icon: Target,
                title: "Define tu Norte",
                desc: "En el onboarding de 2 minutos configuras tu Gran Objetivo, anti-metas y primer proyecto activo.",
                delay: 0,
              },
              {
                step: "02",
                icon: Brain,
                title: "KAWA aprende de ti",
                desc: "Cada check-in, cada conversación y cada documento enriquece tu contexto personal. La IA se vuelve más precisa con el tiempo.",
                delay: 0.15,
              },
              {
                step: "03",
                icon: Sparkles,
                title: "Decide con claridad",
                desc: "Chatea, revisa tu dashboard y recibe alertas proactivas. KAWA te da el contexto justo en el momento correcto.",
                delay: 0.3,
              },
            ].map((s) => (
              <motion.div
                key={s.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                custom={s.delay}
                variants={fadeUp}
                className="text-center"
              >
                <div className="relative inline-flex mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.10] flex items-center justify-center">
                    <s.icon className="w-7 h-7 text-white/60" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-[10px] font-black">{s.step}</span>
                  </div>
                </div>
                <h3 className="text-white font-display font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-4">Testimonios</p>
            <h2 className="text-4xl md:text-5xl font-display font-black mb-4">
              Fundadores que ya cambiaron su forma de operar
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="Por primera vez tengo claridad real sobre si lo que hago hoy me acerca a mi objetivo de largo plazo. KAWA me hace esa pregunta cada día."
              name="Daniela R."
              role="CEO · SaaS B2B, Lima"
              avatar="D"
              delay={0}
            />
            <TestimonialCard
              quote="El check-in de energía parece simple pero me ayudó a identificar que los lunes post-reunión de directivos era mi peor día. Reorganicé todo."
              name="Mateo V."
              role="Founder · Fintech, Bogotá"
              avatar="M"
              delay={0.1}
            />
            <TestimonialCard
              quote="El chat IA que sabe quiénes son mis contactos y qué proyectos tengo activos es como tener un COO personal disponible 24/7."
              name="Carolina B."
              role="Co-founder · EdTech, Ciudad de México"
              avatar="C"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.05] to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/[0.08] blur-[120px] rounded-full" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-rose-700 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-5xl md:text-6xl font-display font-black mb-6">
              Empieza a construir con{" "}
              <span className="bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent">
                claridad total
              </span>
            </h2>
            <p className="text-white/50 text-lg mb-10 leading-relaxed">
              Únete a los fundadores que ya tienen su copiloto IA. Sin tarjeta
              de crédito. Sin configuración compleja. Listo en 2 minutos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 hover:shadow-2xl hover:shadow-primary/25 active:scale-95 text-base"
              >
                <Zap className="w-4 h-4" />
                Crear cuenta gratis
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 text-white/50 hover:text-white font-medium px-6 py-3.5 text-base transition-colors"
              >
                Ver precios
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-white/25 text-sm mt-6 flex items-center justify-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Sin tarjeta · Cancela cuando quieras · GDPR compliant
            </p>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
