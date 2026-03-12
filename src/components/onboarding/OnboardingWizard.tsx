import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Building2, Ban, Heart, ArrowRight, Check } from "lucide-react";

interface OnboardingWizardProps {
    onComplete: () => void;
}

export const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
    const [step, setStep] = useState(1);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Step 1 — Primera Empresa
    const [companyName, setCompanyName] = useState("");
    const [companyVision, setCompanyVision] = useState("");
    const [companyMission, setCompanyMission] = useState("");

    // Step 2 — Límites (Anti-goals)
    const [antiGoals, setAntiGoals] = useState<string[]>([]);
    const [currentAntiGoal, setCurrentAntiGoal] = useState("");

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
            .from("vault_companies")
            .select("id")
            .eq("user_id", user.id)
            .limit(1)
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

            // 1. Guardar Empresa
            const { error: companyError } = await supabase
                .from("vault_companies")
                .insert({
                    user_id: user.id,
                    name: companyName.trim(),
                    vision: companyVision.trim() || null,
                    mision: companyMission.trim() || null,
                    anti_goals: antiGoals.length > 0 ? antiGoals : [],
                    color: "#6366f1", // default color
                });

            if (companyError) throw companyError;

            // 2. Guardar Primer Check-in de Energía
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

            toast.success("¡Bienvenido a KAWA! Tu primera empresa está configurada 🚀");
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

    const canAdvanceStep1 = companyName.trim().length > 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px] [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center font-display mb-2">
                        {step === 1 && "🏢 Tu Primera Empresa"}
                        {step === 2 && "🛡️ Establece Límites"}
                        {step === 3 && "⚡ ¿Cómo llegas hoy?"}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {/* Step 1 — Primera Empresa */}
                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-center">
                                <div className="p-4 bg-primary/10 rounded-full">
                                    <Building2 className="w-10 h-10 text-primary" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Nombre de tu empresa / proyecto principal</Label>
                                <Input
                                    placeholder="Ej. KAWA Corp, Freelance Studio..."
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Visión a futuro (opcional)</Label>
                                <Textarea
                                    placeholder="¿Dónde estará esta empresa en 3-5 años?"
                                    className="h-20"
                                    value={companyVision}
                                    onChange={(e) => setCompanyVision(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Misión actual (opcional)</Label>
                                <Textarea
                                    placeholder="¿Qué hace la empresa hoy y para quién?"
                                    className="h-20"
                                    value={companyMission}
                                    onChange={(e) => setCompanyMission(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground font-light text-center">
                                Esta será tu base para organizar proyectos e interacciones.
                            </p>
                        </div>
                    )}

                    {/* Step 2 — Límites */}
                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-center">
                                <div className="p-4 bg-rose-500/10 rounded-full">
                                    <Ban className="w-10 h-10 text-rose-500" />
                                </div>
                            </div>
                            <div className="text-center space-y-1 mb-4">
                                <h3 className="font-medium text-foreground">Lo que tu empresa NO hará</h3>
                                <p className="text-xs text-muted-foreground">Establece límites para mantener el enfoque (Anti-metas).</p>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ej. No aceptar proyectos por menos de 500$..."
                                        value={currentAntiGoal}
                                        onChange={(e) => setCurrentAntiGoal(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && addAntiGoal()}
                                    />
                                    <Button type="button" variant="secondary" onClick={addAntiGoal}>Añadir</Button>
                                </div>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto mt-4">
                                    {antiGoals.map((goal, i) => (
                                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-destructive/5 border border-destructive/20 rounded-md">
                                            <span className="text-sm text-muted-foreground">{goal}</span>
                                            <button onClick={() => removeAntiGoal(i)} className="text-muted-foreground hover:text-destructive ml-2 shrink-0">
                                                <Ban className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {antiGoals.length === 0 && (
                                        <div className="text-center p-4 border border-dashed rounded-lg text-xs text-muted-foreground/60 italic">
                                            Sin límites definidos aún. Puedes dejarlos para más adelante.
                                        </div>
                                    )}
                                </div>
                            </div>
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
                                        const map = { high: { label: "Alta ⚡", color: "bg-emerald-500 hover:bg-emerald-600 font-medium" }, medium: { label: "Media 🔋", color: "bg-amber-500 hover:bg-amber-600 font-medium" }, low: { label: "Baja 🪫", color: "bg-rose-500 hover:bg-rose-600 font-medium" } };
                                        return (
                                            <Button
                                                key={lvl}
                                                variant={energy === lvl ? "default" : "outline"}
                                                className={`flex-1 ${energy === lvl ? map[lvl].color : "text-muted-foreground"}`}
                                                onClick={() => setEnergy(lvl)}
                                            >
                                                {map[lvl].label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground font-light text-center">
                                KAWA usará esto para ajustar sus sugerencias de carga de trabajo y estilo de comunicación desde el primer día.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between items-center mt-2 w-full">
                    <div className="flex gap-4 items-center w-full justify-between">
                        <div className="flex gap-1.5 items-center">
                            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all ${i + 1 === step ? "w-6 bg-primary" : i + 1 < step ? "w-4 bg-primary/40" : "w-4 bg-muted"}`}
                                />
                            ))}
                        </div>

                        <div className="flex gap-2 items-center">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-muted-foreground text-xs hover:text-foreground hidden sm:flex" 
                                onClick={() => { setOpen(false); onComplete(); }}
                            >
                                Saltar
                            </Button>
                            {step > 1 && (
                                <Button variant="outline" size="sm" onClick={() => setStep(step - 1)} disabled={loading}>
                                    Atrás
                                </Button>
                            )}
                            {step < TOTAL_STEPS ? (
                                <Button
                                    size="sm"
                                    onClick={() => setStep(step + 1)}
                                    disabled={step === 1 && !canAdvanceStep1}
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    Siguiente <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            ) : (
                                <Button size="sm" onClick={handleFinish} disabled={loading} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                    {loading ? "Guardando..." : <><Check className="mr-2 w-4 h-4" /> Comenzar</>}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
