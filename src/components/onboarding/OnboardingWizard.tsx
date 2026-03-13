import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Building2, Ban, Heart, ArrowRight, Check, Sparkles, ShieldAlert, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

    const stepVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px] overflow-hidden bg-card/95 backdrop-blur-xl border-border/40 [&>button]:hidden shadow-2xl shadow-black/50">
                <DialogHeader>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            <DialogTitle className="text-2xl text-center font-display font-light text-foreground/90">
                                {step === 1 && "Construyamos tu Visión"}
                                {step === 2 && "Tus Límites Sagrados"}
                                {step === 3 && "Tu Estado de Inicio"}
                            </DialogTitle>
                        </motion.div>
                    </AnimatePresence>
                </DialogHeader>

                <div className="relative min-h-[360px] py-4">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="space-y-6"
                            >
                                <div className="flex justify-center mb-2">
                                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                                        <Building2 className="w-10 h-10 text-primary" strokeWidth={1.5} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground/70">Nombre del proyecto principal</Label>
                                    <Input
                                        placeholder="Ej. KAWA Corp, Freelance Studio..."
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="h-12 text-lg bg-background/50 border-border/40 focus:border-primary/50 transition-all rounded-xl"
                                        autoFocus
                                    />
                                </div>

                                <AnimatePresence>
                                    {companyName.trim().length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-5 overflow-hidden"
                                        >
                                            <div className="space-y-2">
                                                <Label className="text-xs uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                                                    Visión a futuro <span className="text-[10px] lowercase font-light opacity-50">(opcional)</span>
                                                </Label>
                                                <Textarea
                                                    placeholder="¿Dónde estará esta empresa en 3-5 años?"
                                                    className="h-20 bg-background/30 border-border/30 focus:border-primary/40 rounded-xl resize-none"
                                                    value={companyVision}
                                                    onChange={(e) => setCompanyVision(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                                                    Misión actual <span className="text-[10px] lowercase font-light opacity-50">(opcional)</span>
                                                </Label>
                                                <Textarea
                                                    placeholder="¿Qué hace la empresa hoy y para quién?"
                                                    className="h-20 bg-background/30 border-border/30 focus:border-primary/40 rounded-xl resize-none"
                                                    value={companyMission}
                                                    onChange={(e) => setCompanyMission(e.target.value)}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                {!companyName.trim() && (
                                    <p className="text-xs text-muted-foreground font-light text-center italic mt-12 animate-pulse">
                                        Empieza por el nombre para definir el alma de tu proyecto.
                                    </p>
                                )}
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="space-y-6"
                            >
                                <div className="flex justify-center mb-2">
                                    <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                                        <ShieldAlert className="w-10 h-10 text-rose-500" strokeWidth={1.5} />
                                    </div>
                                </div>
                                <div className="text-center space-y-1">
                                    <h3 className="font-medium text-foreground/90">¿Qué NO harás?</h3>
                                    <p className="text-xs text-muted-foreground font-light px-6">Establece límites claros (Anti-metas) para proteger tu foco y energía.</p>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="No aceptar proyectos de bajo presupuesto..."
                                            value={currentAntiGoal}
                                            onChange={(e) => setCurrentAntiGoal(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && addAntiGoal()}
                                            className="h-11 bg-background/50 border-border/40 rounded-xl"
                                        />
                                        <Button type="button" variant="secondary" onClick={addAntiGoal} className="h-11 rounded-xl px-4 border border-border/40">
                                            Añadir
                                        </Button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                        <AnimatePresence initial={false}>
                                            {antiGoals.map((goal, i) => (
                                                <motion.div
                                                    key={goal + i}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-xl group hover:border-rose-500/30 transition-colors"
                                                >
                                                    <span className="text-sm text-foreground/80 font-light">{goal}</span>
                                                    <button onClick={() => removeAntiGoal(i)} className="text-muted-foreground hover:text-rose-500 transition-colors p-1">
                                                        <Check className="w-4 h-4 opacity-50 group-hover:hidden" />
                                                        <Ban className="w-4 h-4 hidden group-hover:block" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {antiGoals.length === 0 && (
                                            <div className="text-center p-8 border-2 border-dashed border-border/20 rounded-2xl text-xs text-muted-foreground/50 italic font-light">
                                                Sin límites definidos aún.<br/>Puedes saltar este paso si prefieres.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                variants={stepVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="space-y-8"
                            >
                                <div className="flex justify-center mb-2">
                                    <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                                        <Zap className="w-10 h-10 text-amber-500" strokeWidth={1.5} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground/70 text-center block w-full">¿Cómo está tu ánimo ahora?</Label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {[
                                            { value: "5", emoji: "😁", label: "Brillante" },
                                            { value: "4", emoji: "🙂", label: "Bien" },
                                            { value: "3", emoji: "😐", label: "Neutro" },
                                            { value: "2", emoji: "😕", label: "Bajo" },
                                            { value: "1", emoji: "😫", label: "Drenado" },
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setMood(opt.value)}
                                                className={cn(
                                                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300",
                                                    mood === opt.value 
                                                        ? "border-primary/50 bg-primary/10 text-primary scale-105 shadow-lg shadow-primary/10" 
                                                        : "border-border/30 text-muted-foreground hover:border-border/60 hover:bg-white/5"
                                                )}
                                            >
                                                <span className="text-2xl filter drop-shadow-sm">{opt.emoji}</span>
                                                <span className="text-[10px] font-medium leading-tight opacity-70">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground/70 text-center block w-full">Batería física</Label>
                                    <div className="flex gap-3">
                                        {(["high", "medium", "low"] as const).map((lvl) => {
                                            const cfg = { 
                                                high: { label: "Alta ⚡", color: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 font-medium" }, 
                                                medium: { label: "Media 🔋", color: "bg-amber-500/20 border-amber-500/30 text-amber-400 font-medium" }, 
                                                low: { label: "Baja 🪫", color: "bg-rose-500/20 border-rose-500/30 text-rose-400 font-medium" } 
                                            };
                                            const active = energy === lvl;
                                            return (
                                                <Button
                                                    key={lvl}
                                                    variant="outline"
                                                    className={cn(
                                                        "flex-1 h-12 rounded-xl border-border/30 transition-all duration-300",
                                                        active ? cn(cfg[lvl].color, "border-transparent ring-1 ring-current/30") : "text-muted-foreground/60"
                                                    )}
                                                    onClick={() => setEnergy(lvl)}
                                                >
                                                    {cfg[lvl].label}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground/50 font-light text-center px-4 leading-relaxed">
                                    KAWA ajustará sus recomendaciones basándose en tu capacidad actual.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <DialogFooter className="px-6 py-4 mt-2">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex gap-2 items-center">
                            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                                <motion.div
                                    key={i}
                                    initial={false}
                                    animate={{ 
                                        width: i + 1 === step ? 24 : 6,
                                        backgroundColor: i + 1 <= step ? "var(--primary)" : "var(--muted)" 
                                    }}
                                    className="h-1.5 rounded-full"
                                />
                            ))}
                        </div>

                        <div className="flex gap-3 items-center">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-muted-foreground text-xs hover:text-foreground hover:bg-transparent" 
                                onClick={() => { setOpen(false); onComplete(); }}
                            >
                                Saltar
                            </Button>
                            
                            <div className="flex gap-2">
                                {step > 1 && (
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setStep(step - 1)} 
                                        disabled={loading}
                                        className="rounded-xl border-border/40 h-10 px-4"
                                    >
                                        Atrás
                                    </Button>
                                )}
                                {step < TOTAL_STEPS ? (
                                    <Button
                                        size="sm"
                                        onClick={() => setStep(step + 1)}
                                        disabled={step === 1 && !canAdvanceStep1}
                                        className="bg-primary hover:bg-primary/90 rounded-xl h-10 px-5 shadow-lg shadow-primary/20"
                                    >
                                        Siguiente <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                ) : (
                                    <Button 
                                        size="sm" 
                                        onClick={handleFinish} 
                                        disabled={loading} 
                                        className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 rounded-xl h-10 px-6 font-semibold"
                                    >
                                        {loading ? "Sincronizando..." : <><Check className="mr-2 w-4 h-4" /> ¡Empezar!</>}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
