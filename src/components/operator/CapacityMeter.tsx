import { motion } from "framer-motion";
import { Settings2 } from "lucide-react";
import { useState } from "react";

interface CapacityMeterProps {
    committed: number;
    available: number;
    onEdit: () => void;
}

const CapacityMeter = ({ committed, available, onEdit }: CapacityMeterProps) => {
    const percentage = Math.min((committed / available) * 100, 100);
    const isOverloaded = percentage > 85;

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-white/10 p-6 rounded-xl relative overflow-hidden group">
            <div className="flex justify-between items-end mb-4 relative z-10">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">Capacidad Semanal</p>
                        <button
                            onClick={onEdit}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all"
                            title="Configurar horas"
                        >
                            <Settings2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <h3 className="text-3xl font-bold mt-1">
                        {percentage.toFixed(0)}%
                        <span className="text-sm font-normal text-muted-foreground ml-2">ocupado</span>
                    </h3>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">{committed}h / {available}h</p>
                </div>
            </div>

            <div className="h-4 bg-secondary/30 rounded-full overflow-hidden relative z-10">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${isOverloaded ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-primary shadow-[0_0_15px_rgba(16,185,129,0.5)]'}`}
                />
            </div>

            {isOverloaded ? (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-xs mt-3 flex items-center font-semibold"
                >
                    ⚠️ ¡Cuidado! Estás cerca del límite.
                </motion.p>
            ) : (
                <p className="text-muted-foreground text-xs mt-3">
                    Ritmo saludable. Tienes espacio para imprevistos.
                </p>
            )}
        </div>
    );
};

export default CapacityMeter;
