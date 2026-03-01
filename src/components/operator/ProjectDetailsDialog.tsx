import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Save, Trash2, X, Plus, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Project {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'backlog' | 'done';
    priority: string;
    deadline?: string;
}

interface Task {
    id: string;
    name: string;
    status: 'pending' | 'done';
    project_id: string;
}

interface ProjectDetailsDialogProps {
    project: Project | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProjectUpdated: () => void;
}

export function ProjectDetailsDialog({ project, open, onOpenChange, onProjectUpdated }: ProjectDetailsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<string>("active");
    const [priority, setPriority] = useState<string>("3");
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);

    // Task State
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskName, setNewTaskName] = useState("");
    const [loadingTasks, setLoadingTasks] = useState(false);

    // Load project data when it opens or changes
    useEffect(() => {
        if (project) {
            setName(project.name);
            setDescription(project.description || "");
            setStatus(project.status);
            setPriority(project.priority.toString()); // Ensure string for Select
            setDeadline(project.deadline ? new Date(project.deadline) : undefined);
            fetchTasks();
        }
    }, [project, open]);

    const fetchTasks = async () => {
        if (!project) return;
        setLoadingTasks(true);
        try {
            const { data, error } = await supabase
                .from('vault_operator_tasks')
                .select('*')
                .eq('project_id', project.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setTasks(data || []);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoadingTasks(false);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskName.trim() || !project) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('vault_operator_tasks')
                .insert({
                    project_id: project.id,
                    user_id: user.id,
                    name: newTaskName,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            setTasks([...tasks, data]);
            setNewTaskName("");
            toast.success("Tarea agregada");
        } catch (error: any) {
            toast.error("Error al crear tarea");
        }
    };

    const toggleTask = async (task: Task) => {
        const newStatus = task.status === 'pending' ? 'done' : 'pending';
        // Optimistic update
        setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

        try {
            const { error } = await supabase
                .from('vault_operator_tasks')
                .update({ status: newStatus })
                .eq('id', task.id);

            if (error) throw error;
        } catch (error) {
            // Revert on error
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: task.status } : t));
            toast.error("Error al actualizar tarea");
        }
    };

    const deleteTask = async (taskId: string) => {
        try {
            const { error } = await supabase
                .from('vault_operator_tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            setTasks(tasks.filter(t => t.id !== taskId));
            toast.success("Tarea eliminada");
        } catch (error) {
            toast.error("Error al eliminar tarea");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project || !name) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('vault_operator_projects')
                .update({
                    name,
                    description,
                    status,
                    priority: parseInt(priority),
                    deadline: deadline ? deadline.toISOString() : null
                })
                .eq('id', project.id);

            if (error) throw error;

            toast.success("Proyecto actualizado");
            onProjectUpdated();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error("Error al actualizar: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!project) return;
        if (!confirm("¿Estás seguro de querer eliminar este proyecto? Esta acción no se puede deshacer.")) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('vault_operator_projects')
                .delete()
                .eq('id', project.id);

            if (error) throw error;

            toast.success("Proyecto eliminado");
            onProjectUpdated();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error("Error al eliminar: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!project) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <DialogTitle className="text-xl font-bold">Detalles del Proyecto</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Left Column: Project Settings */}
                    <form onSubmit={handleUpdate} className="space-y-4 border-r border-white/10 pr-6">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nombre</Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Descripción</Label>
                            <Textarea
                                id="edit-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Estado</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Activo</SelectItem>
                                        <SelectItem value="backlog">Backlog</SelectItem>
                                        <SelectItem value="done">Terminado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Prioridad</Label>
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
                                            <span>Sin fecha límite</span>
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

                        <div className="pt-4 flex justify-between">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                            </Button>

                            <Button type="submit" disabled={loading} className="neon-glow-sm">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>

                    {/* Right Column: Tasks */}
                    <div className="space-y-4 flex flex-col h-full">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-primary" /> Tareas
                            </h3>
                            <span className="text-xs text-muted-foreground">
                                {tasks.filter(t => t.status === 'done').length}/{tasks.length} completadas
                            </span>
                        </div>

                        {/* Task List */}
                        <div className="flex-1 bg-muted/20 rounded-lg p-4 border border-white/10 overflow-y-auto max-h-[400px] space-y-2">
                            {tasks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <p className="text-sm">No hay tareas aún.</p>
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <div key={task.id} className="group flex items-center gap-3 p-2 hover:bg-white/5 rounded-md transition-colors">
                                        <button
                                            type="button"
                                            onClick={() => toggleTask(task)}
                                            className={`flex-shrink-0 transition-colors ${task.status === 'done' ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {task.status === 'done' ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                        </button>
                                        <span className={`flex-1 text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                            {task.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => deleteTask(task.id)}
                                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Task Form */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nueva tarea..."
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                className="flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTask(e);
                                    }
                                }}
                            />
                            <Button type="button" onClick={handleAddTask} size="icon" disabled={!newTaskName.trim()}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
