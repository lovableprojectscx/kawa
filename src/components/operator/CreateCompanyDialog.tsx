import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Company {
    id: string;
    name: string;
    vision: string;
    mision: string;
    anti_goals: string[];
    color: string;
}

interface CreateCompanyDialogProps {
    onCompanyCreated: () => void;
    editingCompany?: Company | null;
    children?: React.ReactNode;
}

export function CreateCompanyDialog({ onCompanyCreated, editingCompany, children }: CreateCompanyDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [vision, setVision] = useState("");
    const [mision, setMision] = useState("");
    const [color, setColor] = useState("#6366f1");
    const [antiGoals, setAntiGoals] = useState<string[]>([]);

    useEffect(() => {
        if (editingCompany && open) {
            setName(editingCompany.name);
            setVision(editingCompany.vision || "");
            setMision(editingCompany.mision || "");
            setColor(editingCompany.color || "#6366f1");
            setAntiGoals(editingCompany.anti_goals || []);
        } else if (open) {
            resetForm();
        }
    }, [editingCompany, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No authenticated user");

            const payload = {
                user_id: user.id,
                name,
                vision,
                mision,
                color,
                anti_goals: antiGoals,
            };

            if (editingCompany) {
                const { error } = await supabase
                    .from('vault_companies')
                    .update(payload)
                    .eq('id', editingCompany.id);
                if (error) throw error;
                toast.success("Empresa actualizada correctamente");
            } else {
                const { error } = await supabase
                    .from('vault_companies')
                    .insert(payload);
                if (error) throw error;
                toast.success("Empresa creada correctamente");
            }

            setOpen(false);
            resetForm();
            onCompanyCreated();
        } catch (error: any) {
            console.error(error);
            toast.error("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName("");
        setVision("");
        setMision("");
        setColor("#6366f1");
        setAntiGoals([]);
    };

    const addAntiGoal = () => setAntiGoals([...antiGoals, ""]);
    const updateAntiGoal = (i: number, v: string) => {
        const next = [...antiGoals];
        next[i] = v;
        setAntiGoals(next);
    };
    const removeAntiGoal = (i: number) => setAntiGoals(antiGoals.filter((_, idx) => idx !== i));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? (
                    <span>{children}</span>
                ) : (
                    <Button className="gap-2 neon-glow">
                        <Plus className="h-4 w-4" /> Nueva Empresa
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingCompany ? "Editar Empresa" : "Crear Nueva Empresa"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 space-y-2">
                            <Label htmlFor="comp-name">Nombre de la Empresa</Label>
                            <Input
                                id="comp-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: KAWA Corp"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="comp-color">Color</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="comp-color"
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-full h-10 p-1 bg-background border border-border rounded-md cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vision">Visión (3-5 años)</Label>
                        <Textarea
                            id="vision"
                            value={vision}
                            onChange={(e) => setVision(e.target.value)}
                            placeholder="¿Dónde estará la empresa en el futuro?"
                            className="h-20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mision">Misión (Propósito)</Label>
                        <Textarea
                            id="mision"
                            value={mision}
                            onChange={(e) => setMision(e.target.value)}
                            placeholder="¿Qué hace la empresa hoy y para quién?"
                            className="h-20"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Límites (Anti-metas)</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={addAntiGoal} className="h-7 text-[10px] uppercase tracking-wider">
                                + Añadir
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {antiGoals.map((goal, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input
                                        value={goal}
                                        onChange={(e) => updateAntiGoal(i, e.target.value)}
                                        placeholder="Ej: No aceptar proyectos de menos de $X"
                                        className="flex-1"
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAntiGoal(i)} className="shrink-0 text-muted-foreground hover:text-rose-400">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {antiGoals.length === 0 && (
                                <p className="text-[10px] text-muted-foreground italic px-1">No hay límites definidos.</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingCompany ? "Guardar Cambios" : "Crear Empresa"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
