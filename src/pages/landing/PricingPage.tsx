import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  X,
  Zap,
  ArrowRight,
  Shield,
  Sparkles,
  Users,
  Brain,
  HelpCircle,
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

// ─── Pricing data ─────────────────────────────────────────────────────────────
const plans = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Para empezar a clarificar",
    price: { monthly: 0, yearly: 0 },
    priceLabel: "Gratis para siempre",
    cta: "Empezar gratis",
    ctaStyle: "border border-white/[0.12] hover:border-white/[0.25] text-white",
    highlighted: false,
    features: [
      { text: "1 proyecto activo", included: true },
      { text: "Check-ins de energía", included: true },
      { text: "Norte Estrella básico", included: true },
      { text: "Chat IA (50 mensajes/mes)", included: true },
      { text: "Bóveda de Contexto (5 contactos)", included: true },
      { text: "RAG documental", included: false },
      { text: "Smart Router IA", included: false },
      { text: "Proyectos ilimitados", included: false },
      { text: "Análisis de burnout", included: false },
      { text: "Acceso prioritario a nuevas features", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Para fundadores en modo construcción",
    price: { monthly: 29, yearly: 22 },
    priceLabel: null,
    cta: "Empezar con Pro",
    ctaStyle: "bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20",
    highlighted: true,
    badge: "Más popular",
    features: [
      { text: "Proyectos ilimitados", included: true },
      { text: "Check-ins de energía avanzados", included: true },
      { text: "Norte Estrella + OKRs + Anti-metas", included: true },
      { text: "Chat IA ilimitado", included: true },
      { text: "Bóveda de Contexto ilimitada", included: true },
      { text: "RAG documental (50 docs)", included: true },
      { text: "Smart Router IA", included: true },
      { text: "Análisis de burnout", included: true },
      { text: "Exportación de datos", included: true },
      { text: "Acceso prioritario a nuevas features", included: false },
    ],
  },
  {
    id: "team",
    name: "Team",
    tagline: "Para co-fundadores y equipos pequeños",
    price: { monthly: 79, yearly: 59 },
    priceLabel: null,
    cta: "Hablar con ventas",
    ctaStyle: "border border-white/[0.12] hover:border-white/[0.25] text-white",
    highlighted: false,
    features: [
      { text: "Todo lo de Pro", included: true },
      { text: "Hasta 5 miembros del equipo", included: true },
      { text: "Proyectos compartidos", included: true },
      { text: "Chat IA ilimitado por miembro", included: true },
      { text: "RAG documental compartido (200 docs)", included: true },
      { text: "Dashboard de equipo", included: true },
      { text: "Análisis de burnout grupal", included: true },
      { text: "Integraciones avanzadas", included: true },
      { text: "Soporte prioritario", included: true },
      { text: "Acceso prioritario a nuevas features", included: true },
    ],
  },
];

// ─── Comparison table ─────────────────────────────────────────────────────────
const comparisonRows = [
  { label: "Proyectos activos", starter: "1", pro: "Ilimitados", team: "Ilimitados" },
  { label: "Chat IA", starter: "50/mes", pro: "Ilimitado", team: "Ilimitado" },
  { label: "Documentos RAG", starter: "—", pro: "50", team: "200" },
  { label: "Contactos en Contexto", starter: "5", pro: "Ilimitados", team: "Ilimitados" },
  { label: "Smart Router", starter: false, pro: true, team: true },
  { label: "Análisis de burnout", starter: false, pro: true, team: true },
  { label: "Miembros del equipo", starter: "1", pro: "1", team: "Hasta 5" },
  { label: "Soporte", starter: "Comunidad", pro: "Email", team: "Prioritario" },
];

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí. Sin contratos ni penalizaciones. Cancelas desde ajustes y tu plan se mantiene activo hasta el final del período pagado.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Absolutamente. Usamos Supabase con cifrado en reposo y en tránsito. Tus datos nunca se usan para entrenar modelos de IA de terceros.",
  },
  {
    q: "¿Qué pasa cuando excedo el límite de documentos RAG?",
    a: "KAWA te avisa antes de llegar al límite. Los documentos existentes siguen funcionando; solo necesitas actualizar el plan para añadir más.",
  },
  {
    q: "¿El plan gratuito tiene límite de tiempo?",
    a: "No. El plan Starter es gratis permanentemente, no es un trial. Puedes usarlo indefinidamente.",
  },
  {
    q: "¿Hay descuento para startups en etapas tempranas?",
    a: "Sí. Si tu startup tiene menos de 12 meses y menos de $10k MRR, escríbenos para acceder a nuestro programa de fundadores con 50% de descuento.",
  },
  {
    q: "¿KAWA funciona en móvil?",
    a: "Sí. KAWA tiene una app Android nativa (iOS próximamente) y una web app completamente responsive.",
  },
];

// ─── PricingCard component ────────────────────────────────────────────────────
function PricingCard({ plan, yearly, delay }: { plan: typeof plans[0]; yearly: boolean; delay: number }) {
  const price = yearly ? plan.price.yearly : plan.price.monthly;
  const isHighlighted = plan.highlighted;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      custom={delay}
      variants={fadeUp}
      className={`relative flex flex-col rounded-2xl p-6 border transition-all duration-300 ${
        isHighlighted
          ? "bg-[#0e0a0c] border-primary/30 shadow-2xl shadow-primary/10"
          : "bg-[#0a0a0a] border-white/[0.08] hover:border-white/[0.14]"
      }`}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className="bg-primary text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-primary/30">
            <Sparkles className="w-3 h-3" />
            {plan.badge}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-white font-display font-bold text-xl mb-1">{plan.name}</h3>
        <p className="text-white/40 text-sm">{plan.tagline}</p>
      </div>

      <div className="mb-6">
        {plan.priceLabel ? (
          <p className="text-white font-display font-black text-3xl">{plan.priceLabel}</p>
        ) : (
          <div>
            <div className="flex items-end gap-1">
              <span className="text-white/50 text-xl font-semibold">$</span>
              <span className="text-white font-display font-black text-4xl leading-none">{price}</span>
              <span className="text-white/40 text-sm mb-1">/mes</span>
            </div>
            {yearly && plan.price.monthly > 0 && (
              <p className="text-emerald-400 text-xs mt-1 font-medium">
                Ahorras ${(plan.price.monthly - plan.price.yearly) * 12}/año
              </p>
            )}
          </div>
        )}
      </div>

      <Link
        to="/login"
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 mb-6 ${plan.ctaStyle}`}
      >
        {isHighlighted && <Zap className="w-3.5 h-3.5" />}
        {plan.cta}
      </Link>

      <div className="space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <div key={f.text} className="flex items-center gap-2.5">
            {f.included ? (
              <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isHighlighted ? "text-primary" : "text-white/50"}`} />
            ) : (
              <X className="w-4 h-4 flex-shrink-0 text-white/20" />
            )}
            <span className={`text-sm ${f.included ? "text-white/70" : "text-white/25"}`}>{f.text}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <LandingNav />

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/[0.06] blur-[100px] rounded-full pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-4">Precios</p>
            <h1 className="text-5xl md:text-6xl font-display font-black mb-4 leading-tight">
              Simple y{" "}
              <span className="bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent">
                transparente
              </span>
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              Sin sorpresas. Sin funciones escondidas detrás de paywalls confusos. El plan Starter es gratis para siempre.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-full p-1">
              <button
                onClick={() => setYearly(false)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !yearly ? "bg-white text-black" : "text-white/50 hover:text-white"
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  yearly ? "bg-white text-black" : "text-white/50 hover:text-white"
                }`}
              >
                Anual
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${yearly ? "bg-emerald-500/20 text-emerald-600" : "bg-emerald-500/15 text-emerald-400"}`}>
                  -25%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} yearly={yearly} delay={i * 0.1} />
          ))}
        </div>

        {/* Trust bar */}
        <div className="max-w-5xl mx-auto mt-12 flex flex-wrap items-center justify-center gap-8">
          {[
            { icon: Shield, text: "Sin tarjeta para empezar" },
            { icon: Zap, text: "Activo en 2 minutos" },
            { icon: Users, text: "Cancela cuando quieras" },
            { icon: Brain, text: "Datos siempre tuyos" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-white/35 text-sm">
              <Icon className="w-4 h-4" />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 px-6 bg-[#030303] border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-black mb-4">
              Comparación completa
            </h2>
            <p className="text-white/40">Todo en una tabla para que decidas sin duda.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="overflow-x-auto"
          >
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-white/40 text-sm font-medium pb-4 pr-8 w-1/2">Función</th>
                  {["Starter", "Pro", "Team"].map((p, i) => (
                    <th key={p} className={`text-center text-sm font-semibold pb-4 px-4 ${i === 1 ? "text-primary" : "text-white/60"}`}>
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, ri) => (
                  <tr
                    key={row.label}
                    className={`border-t border-white/[0.05] ${ri % 2 === 0 ? "" : "bg-white/[0.01]"}`}
                  >
                    <td className="text-white/60 text-sm py-3 pr-8">{row.label}</td>
                    {[row.starter, row.pro, row.team].map((val, vi) => (
                      <td key={vi} className="text-center py-3 px-4">
                        {typeof val === "boolean" ? (
                          val ? (
                            <CheckCircle2 className={`w-4 h-4 mx-auto ${vi === 1 ? "text-primary" : "text-white/50"}`} />
                          ) : (
                            <X className="w-4 h-4 mx-auto text-white/15" />
                          )
                        ) : (
                          <span className={`text-sm ${vi === 1 ? "text-primary font-semibold" : "text-white/50"}`}>
                            {val}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-black mb-4">
              Preguntas frecuentes
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-5 hover:border-white/[0.14] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold text-sm mb-2">{faq.q}</p>
                    <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center border-t border-white/[0.04] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/[0.07] blur-[100px] rounded-full pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-black mb-4">
              Empieza hoy, gratis
            </h2>
            <p className="text-white/50 mb-8">
              Sin tarjeta de crédito. Sin compromiso. Si ves el valor, ya sabes dónde encontrarnos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-primary/20"
              >
                <Zap className="w-4 h-4" />
                Crear cuenta gratis
              </Link>
              <Link
                to="/features"
                className="inline-flex items-center gap-2 text-white/50 hover:text-white font-medium px-6 py-3 rounded-xl border border-white/[0.10] hover:border-white/[0.20] transition-all duration-200"
              >
                Ver todas las funciones
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
