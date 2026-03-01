import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Telescope, Ban, Heart, ArrowRight, Check, Folder } from "lucide-react";

interface OnboardingWizardProps {
    onComplete: () => void;
}

export const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
    const [step, setStep] = useState(1);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Step 1 — Estrategia
    const [northStar, setNorthStar] = useState("");
    const [antiGoals, setAntiGoals] = useState<string[]>([]);
    const [currentAntiGoal, setCurrentAntiGoal] = useState("");

    // Step 2 — Primer Proyecto
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");

    // Step 3 — Primer Check-in
    const [mood, setMood] = useState("3");
    const [energy, setEnergy] = useState<"high" | "medium" | "low">("medium");

    useEffect(() => {
        checkIfOnboardingNeeded();
    }, []);

    const checkIfOnboardingNeeded = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("vault_vision")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (!data) setOpen(true);
    };

    const addAntiGoal = () => {
        if (currentAntiGoal.trim()) {
            setAntiGoals([...antiGoals, currentAntiGoal.trim()]);
            setCurrentAntiGoal("");
        }
    };

    const removeAntiGoal = (index: number) => {
        setAntiGoals(antiGoals.filter((_, i) => i !== index));
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Guardar Visión
            const { error: visionError } = await supabase
                .from("vault_vision")
                .upsert({
                    user_id: user.id,
                    north_star: northStar,
                    anti_goals: antiGoals.length > 0 ? antiGoals : [],
                    why_story: "",
                    updated_at: new Date().toISOString(),
                }, { onConflict: "user_id" });

            if (visionError) throw visionError;

            // 2. Guardar Primer Proyecto (si fue definido)
            if (projectName.trim()) {
                const { error: projectError } = await supabase
                    .from("vault_operator_projects")
                    .insert({
                        user_id: user.id,
                        name: projectName.trim(),
                        description: projectDescription.trim() || null,
                        status: "active",
                        priority: 4,
                    });
                if (projectError) throw projectError;
            }

            // 3. Guardar Primer Check-in de Energía
            const { error: energyError } = await supabase
                .from("vault_founder_energy")
                .insert({
                    user_id: user.id,
                    mood_score: parseInt(mood),
                    energy_level: energy,
                    notes: "Check-in inicial al empezar con KAWA.",
                    checkin_date: new Date().toISOString(),
                });

            if (energyError) throw energyError;

            toast.success("¡Bienvenido a KAWA! Tu base está lista 🚀");
            setOpen(false);
            onComplete();

        } catch (error) {
            console.error("Onboarding error:", error);
            toast.error("Error al guardar tu configuración inicial");
        } finally {
            setLoading(false);
        }
    };

    const TOTAL_STEPS = 3;

    const canAdvanceStep1 = northStar.trim().length > 0;
    const canAdvanceStep2 = projectName.trim().length > 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px] [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center font-display mb-2">
                        {step === 1 && "🎯 Definamos tu Norte"}
                        {step === 2 && "📁 Tu Primer Proyecto"}
                        {step === 3 && "⚡ ¿Cómo llegas hoy?"}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {/* Step 1 — North Star + Anti-Goals */}
                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-center">
                                <div className="p-4 bg-primary/10 rounded-full">
                                    <Telescope className="w-10 h-10 text-primary" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>¿Cuál es tu Gran Objetivo ahora mismo?</Label>
                                <Textarea
                                    placeholder="Ej. Lanzar mi MVP antes de julio y conseguir 10 clientes de pago..."
                                    className="h-24"
                                    value={northStar}
                                    onChange={(e) => setNorthStar(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground font-light">
                                    Esto guiará todas las decisiones que KAWA te ayude a tomar.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5">
                                    <Ban className="w-3.5 h-3.5 text-destructive" /> ¿Qué NO harás? (opcional)
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ej. No trabajar fines de semana..."
                                        value={currentAntiGoal}
                                        onChange={(e) => setCurrentAntiGoal(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && addAntiGoal()}
                                    />
                                    <Button type="button" variant="secondary" onClick={addAntiGoal}>Añadir</Button>
                                </div>
                                <div className="space-y-1.5 max-h-24 overflow-y-auto">
                                    {antiGoals.map((goal, i) => (
                                        <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-destructive/5 border border-destructive/20 rounded-md">
                                            <span className="text-sm text-muted-foreground truncate">{goal}</span>
                                            <button onClick={() => removeAntiGoal(i)} className="text-muted-foreground hover:text-destructive ml-2 shrink-0">
                                                <Ban className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2 — Primer Proyecto */}
                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-center">
                                <div className="p-4 bg-emerald-400/10 rounded-full">
                                    <Folder className="w-10 h-10 text-emerald-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>¿En qué estás trabajando ahora mismo?</Label>
                                <Input
                                    placeholder="Ej. Rediseño de landing page para cliente X"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción breve (opcional)</Label>
                                <Textarea
                                    placeholder="¿Cuál es el objetivo de este proyecto?"
                                    className="h-20 resize-none"
                                    value={projectDescription}
                                    onChange={(e) => setProjectDescription(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground font-light">
                                Luego podrás añadir tareas, deadlines y más proyectos desde la bóveda de Proyectos.
                            </p>
                        </div>
                    )}

                    {/* Step 3 — Check-in de Energía */}
                    {step === 3 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-center">
                                <div className="p-4 bg-rose-500/10 rounded-full">
                                    <Heart className="w-10 h-10 text-rose-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>¿Cómo está tu ánimo hoy?</Label>
                                <div className="grid grid-cols-5 gap-1">
                                    {[
                                        { value: "5", emoji: "😁", label: "Excelente" },
                                        { value: "4", emoji: "🙂", label: "Bien" },
                                        { value: "3", emoji: "😐", label: "Normal" },
                                        { value: "2", emoji: "😕", label: "Bajo" },
                                        { value: "1", emoji: "😫", label: "Agotado" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setMood(opt.value)}
                                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${mood === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-border/60"}`}
                                        >
                                            <span className="text-xl">{opt.emoji}</span>
                                            <span className="text-[10px] leading-tight text-center">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Nivel de energía física</Label>
                                <div className="flex gap-2">
                                    {(["high", "medium", "low"] as const).map((lvl) => {
                                        const map = { high: { label: "Alta ⚡", color: "bg-emerald-500 hover:bg-emerald-600" }, medium: { label: "Media 🔋", color: "bg-amber-500 hover:bg-amber-600" }, low: { label: "Baja 🪫", color: "bg-rose-500 hover:bg-rose-600" } };
                                        return (
                                            <Button
                                                key={lvl}
                                                variant={energy === lvl ? "default" : "outline"}
                                                className={`flex-1 ${energy === lvl ? map[lvl].color : ""}`}
                                                onClick={() => setEnergy(lvl)}
                                            >
                                                {map[lvl].label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground font-light">
                                KAWA usará esto para ajustar sus sugerencias de carga de trabajo.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between items-center">
                    <div className="flex gap-1 items-center">
                        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all ${i + 1 === step ? "w-6 bg-primary" : i + 1 < step ? "w-4 bg-primary/40" : "w-4 bg-muted"}`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-2">
                        {step > 1 && (
                            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={loading}>
                                Atrás
                            </Button>
                        )}
                        {step < TOTAL_STEPS ? (
                            <Button
                                onClick={() => setStep(step + 1)}
                                disabled={(step === 1 && !canAdvanceStep1) || (step === 2 && !canAdvanceStep2)}
                            >
                                Siguiente <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleFinish} disabled={loading}>
                                {loading ? "Guardando..." : <><Check className="mr-2 w-4 h-4" /> Comenzar con KAWA</>}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
