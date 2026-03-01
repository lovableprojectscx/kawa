import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Briefcase, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AddPersonDialogProps {
    onPersonAdded: () => void;
    children: React.ReactNode;
}

export const AddPersonDialog = ({ onPersonAdded, children }: AddPersonDialogProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [role, setRole] = useState("Socia"); // Default
    const [summary, setSummary] = useState("");
    const [factsInput, setFactsInput] = useState(""); // Comma separated

    const handleSave = async () => {
        if (!name.trim()) return toast.error("El nombre es obligatorio");

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            // Process facts (split by comma and trim)
            // Note: in the real schema we might store this as text or array. 
            // The schema says personal_facts VECTOR(1536) but also we likely want a readable field.
            // Wait, looking at schema_design.sql:
            // personal_facts VECTOR(1536) -- This is for embeddings. 
            // We probably need a field for storing the raw text facts too to display them?
            // checking schema again...
            // "personal_facts VECTOR(1536)" is strictly vector.
            // "last_interaction_summary TEXT" exists.
            // We might need to store facts in a JSONB or text field if we want to read them back directly without search.
            // The schema in schema_design.sql is: 
            /*
            CREATE TABLE IF NOT EXISTS public.vault_context_people (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
                name TEXT NOT NULL,
                role TEXT, 
                linked_project_id UUID REFERENCES public.vault_operator_projects(id),
                personal_facts VECTOR(1536), 
                last_interaction_summary TEXT,
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now()
            );
            */
            // Ideally we should have a `facts` text/json column. 
            // For now, I will start by storing facts in `last_interaction_summary` or just assume we modify schema later?
            // Actually, let's just use `role` and `name` and `last_interaction_summary` for now since that matches the current schema best.
            // Or I can add a `facts` JSONB column if I want to match the UI perfectly.
            // Given the user constraint "fix things", I should probably stick to existing schema or slightly adapt.
            // Let's check if I can insert into a nonexistent column? No.
            // I'll put facts into `last_interaction_summary` for now as a workaround or just ignore facts for the DB insert if columns missing.
            // Wait, I can see `vault_context_people` has `last_interaction_summary`.
            // I'll put the "Facts" into `last_interaction_summary` for simplicity in V1 for now, or append them.

            const { error } = await supabase
                .from('vault_context_people')
                .insert({
                    user_id: user.id,
                    name: name,
                    role: role,
                    last_interaction_summary: summary + (factsInput ? `\n\nDatos clave: ${factsInput}` : "")
                });

            if (error) throw error;

            toast.success("Contacto guardado");
            setOpen(false);

            // Reset
            setName("");
            setSummary("");
            setFactsInput("");
            onPersonAdded();

        } catch (error) {
            console.error("Error adding person:", error);
            toast.error("Error al guardar contacto");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-sky-400" />
                        Agregar al Network
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Nombre</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Ej. Ana Torres"
                                    className="pl-9"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Rol / Relación</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Socia">Socia/o</SelectItem>
                                    <SelectItem value="Cliente">Cliente</SelectItem>
                                    <SelectItem value="Proveedor">Proveedor</SelectItem>
                                    <SelectItem value="Mentora">Mentora/or</SelectItem>
                                    <SelectItem value="Equipo">Equipo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Resumen / Contexto</Label>
                        <Textarea
                            placeholder="¿En qué están trabajando? ¿Cuál fue la última interacción?"
                            className="h-20 resize-none"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Datos Clave (separar por comas)</Label>
                        <Input
                            placeholder="Ej. Vegano, Cumpleaños 15 Marzo, Hincha de Alianza"
                            value={factsInput}
                            onChange={(e) => setFactsInput(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Estos datos ayudarán a KAWA a darte contexto personalizado. (Vector search coming soon)
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSave} disabled={loading} className="w-full bg-sky-500 hover:bg-sky-600">
                        {loading ? "Guardando..." : "Guardar Contacto"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
