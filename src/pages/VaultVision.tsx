import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Telescope, Target, Ban, BookOpen, Sparkles, Pencil, Plus, Trash2, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface OKR {
  objective: string;
  progress: number;
  keyResults: string[];
}

interface VisionData {
  id?: string;
  north_star: string;
  anti_goals: string[];
  current_okr: OKR[];
  why_story: string;
}

const VaultVision = () => {
  const [data, setData] = useState<VisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<VisionData>({
    north_star: "",
    anti_goals: [],
    current_okr: [],
    why_story: "",
  });

  useEffect(() => {
    fetchVision();
  }, []);

  const fetchVision = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // For MVP demo, if no user, we might want to prompt login or show mock?
      // But assumed auth is handled or we use a demo user. 
      // Let's assume user is logged in or we handle it gracefully.

      const { data: visionData, error } = await supabase
        .from("vault_vision")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (visionData) {
        // Ensure JSON fields are parsed correctly if they come as strings (Supabase client usually handles this)
        const parsedData = {
          ...visionData,
          anti_goals: Array.isArray(visionData.anti_goals) ? visionData.anti_goals : [],
          current_okr: Array.isArray(visionData.current_okr) ? visionData.current_okr : [],
        };
        setData(parsedData);
        setEditForm(parsedData);
      } else {
        // Initialize with default/empty if no record exists
        const defaultData = {
          north_star: "Define tu Estrella del Norte...",
          anti_goals: ["No trabajar fines de semana"],
          current_okr: [],
          why_story: "Escribe tu historia de origen...",
        };
        setData(defaultData);
        setEditForm(defaultData);
      }
    } catch (error) {
      console.error("Error fetching vision:", error);
      toast.error("Error cargando la visión");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión para guardar");
        return;
      }

      const updates = {
        user_id: user.id,
        north_star: editForm.north_star,
        anti_goals: editForm.anti_goals,
        current_okr: editForm.current_okr,
        why_story: editForm.why_story,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (data?.id) {
        const { error: updateError } = await supabase
          .from("vault_vision")
          .update(updates)
          .eq("id", data.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("vault_vision")
          .insert([updates]);
        error = insertError;
      }

      if (error) throw error;

      toast.success("Bóveda de Visión actualizada");
      setIsEditing(false);
      fetchVision();
    } catch (error) {
      console.error("Error saving vision:", error);
      toast.error("Error guardando los cambios");
    }
  };

  const addAntiGoal = () => {
    setEditForm(prev => ({ ...prev, anti_goals: [...prev.anti_goals, ""] }));
  };

  const removeAntiGoal = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      anti_goals: prev.anti_goals.filter((_, i) => i !== index)
    }));
  };

  const updateAntiGoal = (index: number, value: string) => {
    const newGoals = [...editForm.anti_goals];
    newGoals[index] = value;
    setEditForm(prev => ({ ...prev, anti_goals: newGoals }));
  };

  // Basic OKR management for MVP
  const addOKR = () => {
    setEditForm(prev => ({
      ...prev,
      current_okr: [...prev.current_okr, { objective: "Nuevo Objetivo", progress: 0, keyResults: [] }]
    }));
  };

  const updateOKR = (index: number, field: keyof OKR, value: any) => {
    const newOKRs = [...editForm.current_okr];
    newOKRs[index] = { ...newOKRs[index], [field]: value };
    setEditForm(prev => ({ ...prev, current_okr: newOKRs }));
  };

  const removeOKR = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      current_okr: prev.current_okr.filter((_, i) => i !== index)
    }));
  };


  if (loading) return <div className="p-8 text-center">Cargando Bóveda...</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-primary/10">
              <Telescope className="w-6 h-6 text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl text-foreground">Estrategia</h1>
          </div>
          <p className="text-muted-foreground font-light">Tu Plan Maestro · Dirección · Propósito</p>
        </div>
        <div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}><X className="w-4 h-4 mr-2" /> Cancelar</Button>
              <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Guardar</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}><Pencil className="w-4 h-4 mr-2" /> Editar Estrategia</Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* North Star */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-lg p-6 neon-glow"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <h2 className="font-display text-foreground text-lg">Gran Objetivo (North Star)</h2>
          </div>
          {isEditing ? (
            <Textarea
              value={editForm.north_star}
              onChange={e => setEditForm({ ...editForm, north_star: e.target.value })}
              className="text-lg min-h-[100px]"
            />
          ) : (
            <p className="text-foreground font-light text-lg leading-relaxed border-l-2 border-primary pl-4">
              {data?.north_star}
            </p>
          )}
        </motion.div>

        {/* Anti-Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Ban className="w-5 h-5 text-destructive" strokeWidth={1.5} />
            <h2 className="font-display text-foreground text-lg">Límites (Lo que NO haré)</h2>
          </div>
          <ul className="space-y-3">
            {(isEditing ? editForm.anti_goals : data?.anti_goals)?.map((goal, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground font-light">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                {isEditing ? (
                  <div className="flex gap-2 w-full">
                    <Input value={goal} onChange={e => updateAntiGoal(i, e.target.value)} className="h-8" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAntiGoal(i)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ) : (
                  goal
                )}
              </li>
            ))}
          </ul>
          {isEditing && (
            <Button variant="ghost" size="sm" className="mt-4 w-full" onClick={addAntiGoal}>
              <Plus className="w-4 h-4 mr-2" /> Agregar Anti-Meta
            </Button>
          )}
        </motion.div>

        {/* OKRs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <h2 className="font-display text-foreground text-lg">Metas del Trimestre</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(isEditing ? editForm.current_okr : data?.current_okr)?.map((okr, i) => (
              <div key={i} className="bg-muted/30 rounded-md p-5 border border-border/50 relative group">
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => removeOKR(i)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}

                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={okr.objective}
                      onChange={e => updateOKR(i, 'objective', e.target.value)}
                      placeholder="Objetivo"
                      className="font-semibold"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Progreso:</span>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={okr.progress}
                        onChange={e => updateOKR(i, 'progress', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-20 h-8"
                      />
                      <span className="text-xs">%</span>
                    </div>
                    {/* Key Results editable */}
                    <div className="space-y-2 pt-1">
                      <span className="text-xs text-muted-foreground font-display tracking-wider uppercase">Resultados Clave</span>
                      {(okr.keyResults || []).map((kr, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <Input
                            value={kr}
                            onChange={e => {
                              const newKRs = [...(okr.keyResults || [])];
                              newKRs[j] = e.target.value;
                              updateOKR(i, 'keyResults', newKRs);
                            }}
                            placeholder="Resultado clave..."
                            className="h-8 text-xs"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-destructive"
                            onClick={() => updateOKR(i, 'keyResults', (okr.keyResults || []).filter((_, k) => k !== j))}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs"
                        onClick={() => updateOKR(i, 'keyResults', [...(okr.keyResults || []), ""])}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Agregar KR
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-foreground font-display font-semibold mb-3">{okr.objective}</p>
                    <div className="w-full bg-muted rounded-full h-2 mb-4">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${okr.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-primary font-display mb-3">{okr.progress}% completado</p>
                  </>
                )}

                {!isEditing && (
                  <ul className="space-y-1.5 mt-3">
                    {okr.keyResults?.map((kr, j) => (
                      <li key={j} className="text-xs text-muted-foreground font-light flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        {kr}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {isEditing && (
              <div className="flex items-center justify-center min-h-[200px] border-2 border-dashed border-border rounded-md cursor-pointer hover:border-primary/50 transition-colors" onClick={addOKR}>
                <div className="text-center text-muted-foreground">
                  <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Agregar OKR</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Why Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <h2 className="font-display text-foreground text-lg">Mi Historia (Why)</h2>
          </div>
          {isEditing ? (
            <Textarea
              value={editForm.why_story}
              onChange={e => setEditForm({ ...editForm, why_story: e.target.value })}
              className="min-h-[150px]"
            />
          ) : (
            <p className="text-muted-foreground font-light leading-relaxed italic">
              "{data?.why_story}"
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default VaultVision;
