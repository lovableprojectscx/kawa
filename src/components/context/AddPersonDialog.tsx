import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Briefcase, User, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/gemini";
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

            // Build the text to embed as personal_facts
            // Combines role, company hints and the user-entered key facts
            const factsText = [
                role ? `Rol: ${role}` : null,
                factsInput.trim() ? `Datos clave: ${factsInput}` : null,
            ].filter(Boolean).join(". ");

            // Generate vector embedding for semantic search
            // If no facts were entered, personal_facts stays null
            const personalFactsVector = factsText ? await generateEmbedding(factsText) : null;

            const { error } = await supabase
                .from('vault_context_people')
                .insert({
                    user_id: user.id,
                    name: name.trim(),
                    role: role,
                    last_interaction_summary: summary.trim() || null,
                    personal_facts: personalFactsVector,   // VECTOR column — properly embedded
                });

            if (error) throw error;

            toast.success("Contacto guardado");
            setOpen(false);

            // Reset form
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
