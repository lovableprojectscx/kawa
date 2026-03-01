import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Contact {
    id: string;
    name: string;
    role: string;
    last_interaction_summary: string;
}

interface EditPersonDialogProps {
    contact: Contact | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPersonUpdated: () => void;
}

export const EditPersonDialog = ({ contact, open, onOpenChange, onPersonUpdated }: EditPersonDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [role, setRole] = useState("Socia");
    const [summary, setSummary] = useState("");

    useEffect(() => {
        if (contact) {
            setName(contact.name);
            setRole(contact.role || "Socia");
            setSummary(contact.last_interaction_summary || "");
        }
    }, [contact]);

    const handleSave = async () => {
        if (!contact || !name.trim()) return toast.error("El nombre es obligatorio");
        setLoading(true);
        try {
            const { error } = await supabase
                .from("vault_context_people")
                .update({ name, role, last_interaction_summary: summary })
                .eq("id", contact.id);

            if (error) throw error;
            toast.success("Contacto actualizado");
            onOpenChange(false);
            onPersonUpdated();
        } catch {
            toast.error("Error al actualizar contacto");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!contact) return;
        if (!confirm(`¿Eliminar a ${contact.name}? Esta acción no se puede deshacer.`)) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from("vault_context_people")
                .delete()
                .eq("id", contact.id);

            if (error) throw error;
            toast.success("Contacto eliminado");
            onOpenChange(false);
            onPersonUpdated();
        } catch {
            toast.error("Error al eliminar contacto");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-sky-400" />
                        Editar Contacto
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Nombre</Label>
                            <Input
                                placeholder="Ej. Ana Torres"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
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
                            className="h-24 resize-none"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="flex justify-between">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-sky-500 hover:bg-sky-600">
                        {loading ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
