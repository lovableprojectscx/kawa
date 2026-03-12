import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Ban, MessageSquare, Clock, Trash2,
  Users, Heart, ArrowRight, User, ChevronRight, Building2,
  TrendingUp, Star
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Company {
  id: string;
  name: string;
  vision: string;
  mision: string;
  anti_goals: string[];
  color: string;
}

const TABS = [
  { id: "foco", label: "Foco", icon: Target },
  { id: "memorias", label: "Memorias", icon: MessageSquare },
  { id: "contactos", label: "Red", icon: Users },
  { id: "bienestar", label: "Bienestar", icon: Heart },
] as const;
type TabId = typeof TABS[number]["id"];

// ─── Helpers ────────────────────────────────────────────────────────────────
const energyLabel: Record<string, string> = {
  high: "Alta ⚡", medium: "Media 🔋", low: "Baja 🪫",
};
const energyColor: Record<string, string> = {
  high: "text-emerald-400", medium: "text-amber-400", low: "text-rose-400",
};

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function VaultContext() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("foco");
  const [loading, setLoading] = useState(true);

  // Stats / State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [contactsCount, setContactsCount] = useState(0);
  const [contactsPreview, setContactsPreview] = useState<any[]>([]);
  const [latestEnergy, setLatestEnergy] = useState<any>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [
      { data: cData },
      { data: mData },
      { data: iData },
      { data: contacts, count: cCount },
      { data: eData },
    ] = await Promise.all([
      supabase.from("vault_companies").select("*").eq("user_id", user.id).order("name"),
      supabase.from("vault_memories").select("*").eq("user_id", user.id).order("memory_date", { ascending: false }).limit(10),
      supabase.from("vault_insights").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("vault_context_people").select("id, name, role, last_interaction_summary", { count: "exact" }).eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
      supabase.from("vault_founder_energy").select("*").eq("user_id", user.id).order("checkin_date", { ascending: false }).limit(1).maybeSingle(),
    ]);

    setCompanies(cData || []);

    const combined = [
      ...(mData || []).map(m => ({ ...m, _type: "memory", _date: m.memory_date || m.created_at })),
      ...(iData || []).map(i => ({ ...i, _type: "insight", _date: i.created_at })),
    ].sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime());
    setMemories(combined);

    setContactsPreview(contacts || []);
    setContactsCount(cCount || 0);
    setLatestEnergy(eData);
    setLoading(false);
  };

  const handleDeleteMemory = async (id: string, type: string) => {
    const table = type === "insight" ? "vault_insights" : "vault_memories";
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { toast.error("Error al borrar"); return; }
    setMemories(prev => prev.filter(m => m.id !== id));
    toast.success("Memoria eliminada");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-display font-semibold text-foreground">Contexto</h1>
        <p className="text-sm text-muted-foreground mt-1 font-light">Estrategia y conocimiento acumulado</p>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl mb-8 border border-border/50">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-display transition-all ${active
                ? "bg-card shadow-sm text-foreground border border-border/50"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? "text-primary" : ""}`} strokeWidth={active ? 2 : 1.5} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
        >
          {/* ─── FOCO (Companies) ─── */}
          {tab === "foco" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-display tracking-widest uppercase text-muted-foreground">Estrategia por Empresa</h2>
                <button onClick={() => navigate("/vault/companies")} className="text-xs text-primary hover:underline">Gestionar Empresas →</button>
              </div>

              {companies.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border/50 rounded-xl bg-card/30">
                  <Building2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground font-light">No tienes empresas registradas</p>
                  <Button variant="outline" size="sm" className="mt-4 h-8" onClick={() => navigate("/vault/companies")}>Crear primera empresa</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {companies.map(comp => (
                    <div key={comp.id} className="bg-card border border-border rounded-xl p-6 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: comp.color }} />

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <h3 className="text-base font-semibold text-foreground">{comp.name}</h3>
                        </div>
                        <TrendingUp className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">Visión</span>
                          </div>
                          <p className="text-sm text-foreground font-light leading-relaxed">
                            {comp.vision || "Sin visión definida"}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">Misión</span>
                          </div>
                          <p className="text-sm text-foreground font-light leading-relaxed">
                            {comp.mision || "Sin misión definida"}
                          </p>
                        </div>
                      </div>

                      {comp.anti_goals && comp.anti_goals.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-border/50">
                          <div className="flex items-center gap-2 mb-3">
                            <Ban className="w-3 h-3 text-rose-400" />
                            <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">Anti-Goals (Límites)</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {comp.anti_goals.map((g, i) => (
                              <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-rose-400/5 text-rose-400 border border-rose-400/10">
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── MEMORIAS ─── */}
          {tab === "memorias" && (
            <div className="space-y-3">
              {memories.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border/50 rounded-xl">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground font-light">Sin memorias aún</p>
                  <p className="text-xs text-muted-foreground/40 mt-1">Cuéntale contexto a KAWA en el chat y se guardarán aquí</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memories.map((m, i) => (
                    <motion.div
                      key={`${m._type}-${m.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group flex items-start gap-4 p-4 rounded-xl bg-card border border-border/60 hover:border-border transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-display tracking-widest uppercase border ${m._type === "insight"
                            ? "bg-amber-400/10 text-amber-400 border-amber-400/20"
                            : "bg-primary/10 text-primary border-primary/20"
                            }`}>
                            {m._type === "insight" ? "Insight" : "Memoria"}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(m._date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground font-light leading-relaxed line-clamp-3">{m.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteMemory(m.id, m._type)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-400 transition-all p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── CONTACTOS ─── */}
          {tab === "contactos" && (
            <div className="space-y-4">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-display font-bold text-foreground">{contactsCount}</span>
                <span className="text-muted-foreground text-sm font-light">personas en tu red</span>
              </div>

              <div className="space-y-2">
                {contactsPreview.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/60 hover:border-border transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400/20 to-violet-400/20 border border-white/10 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground font-light">{c.role}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => navigate("/vault/contacts")}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-sky-400/20 bg-sky-400/5 text-sm text-sky-400 hover:bg-sky-400/10 transition-colors group"
              >
                <span>Ver toda la red →</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* ─── BIENESTAR ─── */}
          {tab === "bienestar" && (
            <div className="space-y-4">
              {latestEnergy ? (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-display tracking-widest uppercase text-muted-foreground">Último check-in</span>
                    <span className="text-[10px] text-muted-foreground/40">
                      {new Date(latestEnergy.checkin_date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })}
                    </span>
                  </div>

                  <div className="flex items-end gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ánimo</p>
                      <p className="text-4xl font-display font-bold text-foreground">
                        {latestEnergy.mood_score}<span className="text-lg text-muted-foreground font-light">/5</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Energía</p>
                      <p className={`text-lg font-display font-semibold ${energyColor[latestEnergy.energy_level]}`}>
                        {energyLabel[latestEnergy.energy_level]}
                      </p>
                    </div>
                  </div>

                  {latestEnergy.notes && (
                    <p className="text-sm text-muted-foreground font-light border-l-2 border-border pl-3 italic">
                      "{latestEnergy.notes}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-border/50 rounded-xl">
                  <Heart className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground font-light">Sin check-ins registrados</p>
                </div>
              )}

              <button
                onClick={() => navigate("/vault/founder")}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-rose-400/20 bg-rose-400/5 text-sm text-rose-400 hover:bg-rose-400/10 transition-colors group"
              >
                <span>Ver registro completo de bienestar</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
