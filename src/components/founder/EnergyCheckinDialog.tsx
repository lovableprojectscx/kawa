import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Battery, Heart, Smile } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface EnergyCheckinDialogProps {
    children: React.ReactNode;
    onCheckinComplete?: () => void;
    openProp?: boolean;
    onOpenChangeProp?: (open: boolean) => void;
}

export const EnergyCheckinDialog = ({ children, onCheckinComplete, openProp, onOpenChangeProp }: EnergyCheckinDialogProps) => {
    const [internalOpen, setInternalOpen] = useState(false);

    // Controlled vs Uncontrolled logic
    const isControlled = openProp !== undefined;
    const open = isControlled ? openProp : internalOpen;
    const setOpen = isControlled ? onOpenChangeProp : setInternalOpen;

    const [loading, setLoading] = useState(false);

    // Form State
    const [mood, setMood] = useState("3");
    const [energy, setEnergy] = useState<"high" | "medium" | "low">("medium");
    const [notes, setNotes] = useState("");

    const handleCheckin = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const { error } = await supabase
                .from('vault_founder_energy')
                .insert({
                    user_id: user.id,
                    mood_score: parseInt(mood),
                    energy_level: energy,
                    notes: notes,
                    checkin_date: new Date().toISOString()
                });

            if (error) throw error;

            toast.success("Energía registrada correctamente");
            if (setOpen) setOpen(false);

            // Reset form
            setMood("3");
            setEnergy("medium");
            setNotes("");
            if (onCheckinComplete) onCheckinComplete();

        } catch (error) {
            console.error("Error logging energy:", error);
            toast.error("Error al registrar energía");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Battery className="w-5 h-5 text-emerald-400" />
                        Check-in de Energía
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>¿Cómo está tu ánimo hoy?</Label>
                        <Select value={mood} onValueChange={setMood}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">😁 Excelente</SelectItem>
                                <SelectItem value="4">🙂 Bien</SelectItem>
                                <SelectItem value="3">😐 Normal</SelectItem>
                                <SelectItem value="2">😕 Bajo</SelectItem>
                                <SelectItem value="1">😫 Agotado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Nivel de Energía</Label>
                        <div className="flex gap-2">
                            <Button
                                variant={energy === "high" ? "default" : "outline"}
                                className={`flex-1 ${energy === "high" ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
                                onClick={() => setEnergy("high")}
                            >
                                Alta ⚡
                            </Button>
                            <Button
                                variant={energy === "medium" ? "default" : "outline"}
                                className={`flex-1 ${energy === "medium" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                                onClick={() => setEnergy("medium")}
                            >
                                Media 🔋
                            </Button>
                            <Button
                                variant={energy === "low" ? "default" : "outline"}
                                className={`flex-1 ${energy === "low" ? "bg-rose-500 hover:bg-rose-600" : ""}`}
                                onClick={() => setEnergy("low")}
                            >
                                Baja 🪫
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Notas (Opcional)</Label>
                        <Textarea
                            placeholder="¿Qué te tiene así hoy?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleCheckin} disabled={loading}>
                        {loading ? "Guardando..." : "Guardar Check-in"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
