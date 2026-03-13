import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Building2, Ban, Check, ShieldAlert, Zap, ArrowRight, ChevronLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
    onComplete: () => void;
}

export const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
    const [step, setStep] = useState(1);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [direction, setDirection] = useState(1);

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

    const handleSkip = () => {
        setOpen(false);
        onComplete();
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error: companyError } = await supabase
                .from("vault_companies")
                .insert({
                    user_id: user.id,
                    name: companyName.trim(),
                    vision: companyVision.trim() || null,
                    mision: companyMission.trim() || null,
                    anti_goals: antiGoals.length > 0 ? antiGoals : [],
                    color: "#6366f1",
                });

            if (companyError) throw companyError;

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

    const goNext = () => {
        setDirection(1);
        setStep(step + 1);
    };
    const goBack = () => {
        setDirection(-1);
        setStep(step - 1);
    };

    const stepConfig = [
        {
            icon: Building2,
            iconBg: "bg-primary/10 border-primary/20",
            iconColor: "text-primary",
            title: "Construye tu Visión",
            subtitle: "Ponle nombre al proyecto que vas a crear",
        },
        {
            icon: ShieldAlert,
            iconBg: "bg-rose-500/10 border-rose-500/20",
            iconColor: "text-rose-400",
            title: "Límites Sagrados",
            subtitle: "Define qué NO harás para proteger tu foco",
        },
        {
            icon: Zap,
            iconBg: "bg-amber-500/10 border-amber-500/20",
            iconColor: "text-amber-400",
            title: "Tu Estado de Inicio",
            subtitle: "Cuéntanos cómo estás llegando hoy",
        },
    ];

    const current = stepConfig[step - 1];
    const Icon = current.icon;

    const slideVariants = {
        enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
        center: { opacity: 1, x: 0 },
        exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="relative bg-[#0d0d0f] border border-white/[0.07] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden">

                    {/* Header gradient bar */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                    {/* Skip button — siempre visible en esquina */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors group"
                    >
                        <span className="hidden sm:block">Omitir</span>
                        <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                    </button>

                    {/* Progress bar */}
                    <div className="h-[2px] bg-white/[0.04] w-full">
                        <motion.div
                            className="h-full bg-primary/70"
                            initial={false}
                            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                        />
                    </div>

                    {/* Step header */}
                    <div className="pt-8 pb-2 px-6 text-center">
                        <div className="flex justify-center mb-4">
                            <motion.div
                                key={step}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                className={cn("p-3.5 rounded-2xl border", current.iconBg)}
                            >
                                <Icon className={cn("w-8 h-8", current.iconColor)} strokeWidth={1.5} />
                            </motion.div>
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step + "-header"}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h2 className="text-xl font-semibold text-white/90 tracking-tight">{current.title}</h2>
                                <p className="text-sm text-muted-foreground/60 mt-1 font-light">{current.subtitle}</p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Step content */}
                    <div className="px-6 py-5 min-h-[260px] overflow-hidden">
                        <AnimatePresence mode="wait" custom={direction}>
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-medium">
                                            Nombre del proyecto
                                        </Label>
                                        <Input
                                            placeholder="Ej. KAWA Corp, Mi Estudio..."
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="h-11 bg-white/[0.04] border-white/[0.08] focus:border-primary/50 rounded-xl text-white/90 placeholder:text-white/20 transition-all"
                                            autoFocus
                                        />
                                    </div>

                                    <AnimatePresence>
                                        {companyName.trim().length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-4 overflow-hidden"
                                            >
                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-medium">
                                                        Visión <span className="lowercase normal-case opacity-40">— opcional</span>
                                                    </Label>
                                                    <Textarea
                                                        placeholder="¿Dónde estará en 3 años?"
                                                        className="h-20 bg-white/[0.04] border-white/[0.06] focus:border-primary/40 rounded-xl text-white/80 placeholder:text-white/20 resize-none"
                                                        value={companyVision}
                                                        onChange={(e) => setCompanyVision(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-medium">
                                                        Misión <span className="lowercase normal-case opacity-40">— opcional</span>
                                                    </Label>
                                                    <Textarea
                                                        placeholder="¿Qué hace y para quién?"
                                                        className="h-20 bg-white/[0.04] border-white/[0.06] focus:border-primary/40 rounded-xl text-white/80 placeholder:text-white/20 resize-none"
                                                        value={companyMission}
                                                        onChange={(e) => setCompanyMission(e.target.value)}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {!companyName.trim() && (
                                        <p className="text-xs text-white/20 text-center font-light pt-8">
                                            Empieza escribiendo el nombre de tu proyecto.
                                        </p>
                                    )}
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="space-y-4"
                                >
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="No trabajar con clientes sin contrato..."
                                            value={currentAntiGoal}
                                            onChange={(e) => setCurrentAntiGoal(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && addAntiGoal()}
                                            className="h-11 bg-white/[0.04] border-white/[0.08] focus:border-rose-500/40 rounded-xl text-white/90 placeholder:text-white/20"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={addAntiGoal}
                                            className="h-11 rounded-xl px-4 border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white/70"
                                        >
                                            +
                                        </Button>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        <AnimatePresence initial={false}>
                                            {antiGoals.map((goal, i) => (
                                                <motion.div
                                                    key={goal + i}
                                                    initial={{ opacity: 0, y: -6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    className="flex items-center justify-between px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl group hover:border-rose-500/20 transition-colors"
                                                >
                                                    <span className="text-sm text-white/70 font-light flex-1 mr-2">{goal}</span>
                                                    <button
                                                        onClick={() => removeAntiGoal(i)}
                                                        className="text-white/20 hover:text-rose-400 transition-colors flex-shrink-0"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {antiGoals.length === 0 && (
                                            <div className="text-center py-8 border border-dashed border-white/[0.06] rounded-2xl text-xs text-white/20 font-light">
                                                Sin límites aún — puedes continuar sin definirlos.
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-3">
                                        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-medium text-center block">
                                            ¿Cómo está tu ánimo?
                                        </Label>
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
                                                        "flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-200",
                                                        mood === opt.value
                                                            ? "border-primary/60 bg-primary/10 scale-105"
                                                            : "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]"
                                                    )}
                                                >
                                                    <span className="text-xl">{opt.emoji}</span>
                                                    <span className="text-[9px] font-medium text-white/40 leading-tight">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground/50 font-medium text-center block">
                                            Energía física
                                        </Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {([
                                                { lvl: "high" as const, label: "Alta", emoji: "⚡", color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" },
                                                { lvl: "medium" as const, label: "Media", emoji: "🔋", color: "border-amber-500/50 bg-amber-500/10 text-amber-400" },
                                                { lvl: "low" as const, label: "Baja", emoji: "🪫", color: "border-rose-500/50 bg-rose-500/10 text-rose-400" },
                                            ]).map(({ lvl, label, emoji, color }) => (
                                                <button
                                                    key={lvl}
                                                    onClick={() => setEnergy(lvl)}
                                                    className={cn(
                                                        "flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-all duration-200",
                                                        energy === lvl
                                                            ? color
                                                            : "border-white/[0.06] text-white/30 hover:border-white/[0.12] hover:bg-white/[0.04]"
                                                    )}
                                                >
                                                    <span className="text-lg">{emoji}</span>
                                                    <span>{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-3 border-t border-white/[0.05]">
                        {/* Back or dots */}
                        <div className="flex items-center gap-2">
                            {step > 1 ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={goBack}
                                    disabled={loading}
                                    className="text-white/40 hover:text-white/70 hover:bg-transparent px-2 -ml-2 gap-1"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Atrás
                                </Button>
                            ) : (
                                <div className="flex gap-1.5 items-center pl-1">
                                    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{
                                                width: i + 1 === step ? 16 : 5,
                                                opacity: i + 1 <= step ? 1 : 0.3,
                                            }}
                                            className="h-[5px] rounded-full bg-primary"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Next / Finish */}
                        {step < TOTAL_STEPS ? (
                            <Button
                                size="sm"
                                onClick={goNext}
                                disabled={step === 1 && !canAdvanceStep1}
                                className="bg-primary hover:bg-primary/90 rounded-xl h-10 px-5 shadow-lg shadow-primary/20 gap-2 text-sm"
                            >
                                Siguiente <ArrowRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={handleFinish}
                                disabled={loading}
                                className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 rounded-xl h-10 px-6 font-semibold gap-2 text-sm"
                            >
                                {loading ? "Guardando..." : <><Check className="w-4 h-4" /> Empezar</>}
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
