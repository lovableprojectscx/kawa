import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Telescope, Target, Ban, Pencil, Plus, Trash2, Save, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface VisionData {
  id?: string;
  north_star: string;
  anti_goals: string[];
}

// ─── Empty state (no vision set) ─────────────────────────────────────────────
function EmptyVisionState({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
        <Telescope className="w-8 h-8 text-primary" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-display font-bold text-foreground mb-3">
        Aún no has definido tu enfoque
      </h2>
      <p className="text-muted-foreground font-light leading-relaxed mb-8">
        Sin un objetivo claro, KAWA no puede ayudarte a tomar decisiones alineadas.
        Define tu Foco Actual y tus Límites (lo que NO harás) en menos de 1 minuto.
      </p>
      <Button onClick={onStart} className="gap-2 bg-primary hover:bg-primary/90">
        <Target className="w-4 h-4" />
        Definir mi enfoque ahora
      </Button>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const VaultVision = () => {
  const [data, setData] = useState<VisionData | null>(null);
  const [hasRealData, setHasRealData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<VisionData>({
    north_star: "",
    anti_goals: [],
  });

  useEffect(() => { fetchVision(); }, []);

  const fetchVision = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data: visionData, error } = await supabase
        .from("vault_vision")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();
      if (error) throw error;

      if (visionData) {
        const parsed = {
          ...visionData,
          anti_goals: Array.isArray(visionData.anti_goals) ? visionData.anti_goals : [],
        };
        // Only consider it "real data" if north_star is a non-default value
        const isReal = !!(parsed.north_star && parsed.north_star !== "Define tu Estrella del Norte...");
        setHasRealData(isReal);
        setData(parsed);
        setEditForm(parsed);
      } else {
        setHasRealData(false);
        setData(null);
        setEditForm({ north_star: "", anti_goals: [] });
      }
    } catch (error) {
      console.error("Error fetching vision:", error);
      toast.error("Error cargando la visión");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editForm.north_star.trim()) {
      toast.error("El Norte Estrella no puede estar vacío");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Debes iniciar sesión"); return; }

      const updates = {
        user_id: user.id,
        north_star: editForm.north_star,
        anti_goals: editForm.anti_goals.filter(g => g.trim()),
        updated_at: new Date().toISOString(),
      };

      let error;
      if (data?.id) {
        ({ error } = await supabase.from("vault_vision").update(updates).eq("id", data.id));
      } else {
        ({ error } = await supabase.from("vault_vision").insert([updates]));
      }
      if (error) throw error;

      toast.success("Estrategia guardada");
      setIsEditing(false);
      fetchVision();
    } catch (error) {
      console.error("Error saving vision:", error);
      toast.error("Error guardando los cambios");
    }
  };

  const startEditing = () => {
    if (!hasRealData) {
      setEditForm({ north_star: "", anti_goals: [] });
    }
    setIsEditing(true);
  };

  const addAntiGoal = () => setEditForm(p => ({ ...p, anti_goals: [...p.anti_goals, ""] }));
  const removeAntiGoal = (i: number) => setEditForm(p => ({ ...p, anti_goals: p.anti_goals.filter((_, j) => j !== i) }));
  const updateAntiGoal = (i: number, v: string) => {
    const a = [...editForm.anti_goals]; a[i] = v;
    setEditForm(p => ({ ...p, anti_goals: a }));
  };



  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  // Show empty state if no real data and not editing
  if (!hasRealData && !isEditing) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Telescope className="w-6 h-6 text-primary" strokeWidth={1.5} /></div>
          <div>
            <h1 className="text-3xl text-foreground">Enfoque</h1>
            <p className="text-muted-foreground font-light">Tu Foco Actual · Límites Clave</p>
          </div>
        </motion.div>
        <EmptyVisionState onStart={startEditing} />
      </div>
    );
  }

  const viewData = data;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Telescope className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl text-foreground">Enfoque</h1>
            <p className="text-muted-foreground font-light">Tu Foco Actual · Límites Clave</p>
          </div>
          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditForm(viewData || editForm); }}>
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} className="bg-primary hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" /> Guardar
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={startEditing}>
                <Pencil className="w-4 h-4 mr-2" /> Editar Enfoque
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* North Star */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
          style={{ boxShadow: "inset 0 0 40px hsl(345 100% 56% / 0.04)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <h2 className="font-display text-foreground text-lg">Foco Actual</h2>
            {!isEditing && viewData?.north_star && (
              <span className="ml-auto text-[10px] text-primary font-semibold tracking-widest uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                Activo
              </span>
            )}
          </div>
          {isEditing ? (
            <>
              <Textarea
                value={editForm.north_star}
                onChange={e => setEditForm({ ...editForm, north_star: e.target.value })}
                className="text-base min-h-[120px] resize-none"
                placeholder="¿En qué estás enfocado actualmente? (Recomendado enfocar a 1-2 semanas)"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Tip: "Generar 5 ventas esta semana en Idenza usando referidos" es mejor que "Crecer mi empresa".
              </p>
            </>
          ) : (
            <div className="border-l-2 border-primary pl-4">
              <p className="text-foreground font-light text-base leading-relaxed">
                {viewData?.north_star || "—"}
              </p>
            </div>
          )}
        </motion.div>

        {/* Anti-Goals */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Ban className="w-5 h-5 text-rose-400" strokeWidth={1.5} />
            <h2 className="font-display text-foreground text-lg">Lo que NO haré</h2>
            {!isEditing && (
              <span className="ml-auto text-xs text-muted-foreground">
                {viewData?.anti_goals?.filter(g => g.trim()).length || 0} límites
              </span>
            )}
          </div>

          {!isEditing ? (
            viewData?.anti_goals?.filter(g => g.trim()).length ? (
              <ul className="space-y-2.5">
                {viewData.anti_goals.filter(g => g.trim()).map((goal, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground font-light">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                    {goal}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-center">
                <p className="text-xs text-muted-foreground/50 italic">Sin anti-metas definidas.</p>
                <p className="text-xs text-muted-foreground/40 mt-1">Las anti-metas te protegen de las distracciones.</p>
              </div>
            )
          ) : (
            <>
              <ul className="space-y-2 mb-3">
                {editForm.anti_goals.map((goal, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    <Input
                      value={goal}
                      onChange={e => updateAntiGoal(i, e.target.value)}
                      className="h-8 text-sm flex-1"
                      placeholder="No haré..."
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 shrink-0" onClick={() => removeAntiGoal(i)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button variant="ghost" size="sm" className="w-full border border-dashed border-border" onClick={addAntiGoal}>
                <Plus className="w-4 h-4 mr-2" /> Agregar límite
              </Button>
            </>
          )}
        </motion.div>


      </div>
    </div>
  );
};

export default VaultVision;
