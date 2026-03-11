import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CapacityConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (hoursAvailable: number, hoursPerProject: number) => void;
    initialAvailable: number;
    initialPerProject: number;
    activeProjects: number;
}

export const CapacityConfigModal = ({
    isOpen,
    onClose,
    onSave,
    initialAvailable,
    initialPerProject,
    activeProjects
}: CapacityConfigModalProps) => {
    const [hoursAvailable, setHoursAvailable] = useState(initialAvailable);
    const [hoursPerProject, setHoursPerProject] = useState(initialPerProject);

    useEffect(() => {
        if (isOpen) {
            setHoursAvailable(initialAvailable);
            setHoursPerProject(initialPerProject);
        }
    }, [isOpen, initialAvailable, initialPerProject]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        className="relative bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-display font-semibold text-foreground">Configurar Capacidad</h3>
                            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Horas disponibles por semana</label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={168}
                                    value={hoursAvailable}
                                    onChange={e => setHoursAvailable(Math.max(1, parseInt(e.target.value) || 40))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Horas promedio por proyecto activo</label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={hoursPerProject}
                                    onChange={e => setHoursPerProject(Math.max(1, parseInt(e.target.value) || 10))}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Estimado comprometido: {activeProjects} proyectos × {hoursPerProject}h = <strong>{activeProjects * hoursPerProject}h</strong>
                            </p>
                            <Button onClick={() => onSave(hoursAvailable, hoursPerProject)} className="w-full">Guardar</Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
