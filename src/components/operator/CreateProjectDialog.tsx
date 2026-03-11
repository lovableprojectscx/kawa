import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateProjectDialogProps {
    onProjectCreated: () => void;
    defaultStatus?: "active" | "backlog" | "done";
    defaultWorkspace?: string;
    children?: React.ReactNode;
}

export function CreateProjectDialog({ onProjectCreated, defaultStatus, defaultWorkspace, children }: CreateProjectDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState(defaultStatus || "active");
    const [priority, setPriority] = useState("3");
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);

    useEffect(() => {
        fetchCompanies();
    }, [open]);

    const fetchCompanies = async () => {
        const { data } = await supabase.from('vault_companies').select('id, name').order('name');
        setCompanies(data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error("No authenticated user");

            const { error } = await supabase
                .from('vault_operator_projects')
                .insert({
                    user_id: user.id,
                    name,
                    company_id: companyId === "none" ? null : companyId,
                    description,
                    status,
                    priority: parseInt(priority),
                    deadline: deadline ? deadline.toISOString() : null
                });

            if (error) throw error;

            toast.success("Proyecto creado correctamente");
            setOpen(false);
            resetForm();
            onProjectCreated();
        } catch (error: any) {
            console.error(error);
            toast.error("Error al crear proyecto: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName("");
        setCompanyId(null);
        setDescription("");
        setStatus(defaultStatus || "active");
        setPriority("3");
        setDeadline(undefined);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? (
                    <span>{children}</span>
                ) : (
                    <Button className="gap-2 neon-glow">
                        <Plus className="h-4 w-4" /> Nuevo Proyecto
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Proyecto</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Lanzamiento Web"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Empresa</Label>
                            <Select value={companyId || "none"} onValueChange={setCompanyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Ninguna / Personal</SelectItem>
                                    {companies.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Breve descripción..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as "active" | "backlog" | "done")}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Activo</SelectItem>
                                    <SelectItem value="backlog">En Espera</SelectItem>
                                    <SelectItem value="done">Terminado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Prioridad (1-5)</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 - Baja</SelectItem>
                                    <SelectItem value="2">2 - Normal</SelectItem>
                                    <SelectItem value="3">3 - Media</SelectItem>
                                    <SelectItem value="4">4 - Alta</SelectItem>
                                    <SelectItem value="5">5 - Crítica</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2 flex flex-col">
                        <Label>Fecha Límite</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !deadline && "text-muted-foreground"
                                    )}
                                >
                                    {deadline ? (
                                        format(deadline, "PPP")
                                    ) : (
                                        <span>Seleccionar fecha</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={deadline}
                                    onSelect={setDeadline}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Proyecto
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
