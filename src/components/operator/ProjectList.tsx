import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Folder, Clock, CheckCircle2, AlertCircle, ListTodo } from "lucide-react";
import { ProjectDetailsDialog } from "@/components/operator/ProjectDetailsDialog";
import { toast } from "sonner";

interface Project {
    id: string;
    name: string;
    description?: string;
    status: "active" | "backlog" | "done";
    priority: string;
    deadline?: string;
}

interface Task {
    id: string;
    project_id: string;
    status: "pending" | "done";
}

type KanbanStatus = "backlog" | "active" | "done";

const COLUMNS: { id: KanbanStatus; label: string; color: string; dot: string }[] = [
    { id: "backlog", label: "Backlog", color: "border-amber-400/30 bg-amber-400/5", dot: "bg-amber-400" },
    { id: "active",  label: "Activos",  color: "border-primary/30 bg-primary/5",   dot: "bg-primary animate-pulse" },
    { id: "done",    label: "Terminados", color: "border-emerald-400/30 bg-emerald-400/5", dot: "bg-emerald-400" },
];

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
    "5": { label: "Crítica", color: "bg-red-500/20 text-red-400" },
    "4": { label: "Alta",    color: "bg-orange-500/20 text-orange-400" },
    "3": { label: "Media",   color: "bg-amber-500/20 text-amber-400" },
    "2": { label: "Normal",  color: "bg-sky-500/20 text-sky-400" },
    "1": { label: "Baja",    color: "bg-muted text-muted-foreground" },
    "high":   { label: "Alta",   color: "bg-orange-500/20 text-orange-400" },
    "medium": { label: "Media",  color: "bg-amber-500/20 text-amber-400" },
    "low":    { label: "Baja",   color: "bg-muted text-muted-foreground" },
};

const isOverdue = (deadline?: string) =>
    deadline ? new Date(deadline) < new Date() : false;

// ─── Kanban Card ──────────────────────────────────────────────────────────────

const KanbanCard = ({
    project,
    tasks,
    onCardClick,
    onDragStart,
}: {
    project: Project;
    tasks: Task[];
    onCardClick: (p: Project) => void;
    onDragStart: (id: string) => void;
}) => {
    const projectTasks = tasks.filter((t) => t.project_id === project.id);
    const doneTasks   = projectTasks.filter((t) => t.status === "done").length;
    const totalTasks  = projectTasks.length;
    const priority    = PRIORITY_LABELS[project.priority] ?? PRIORITY_LABELS["2"];
    const overdue     = isOverdue(project.deadline);

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                onDragStart(project.id);
            }}
            onClick={() => onCardClick(project)}
            className="bg-card border border-white/8 rounded-lg p-4 cursor-pointer hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 active:opacity-70 transition-all select-none group"
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium text-foreground leading-snug flex-1">{project.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-display tracking-wider uppercase shrink-0 ${priority.color}`}>
                    {priority.label}
                </span>
            </div>

            {project.description && (
                <p className="text-xs text-muted-foreground font-light line-clamp-2 mb-3">{project.description}</p>
            )}

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
                {totalTasks > 0 ? (
                    <div className="flex items-center gap-1.5">
                        <ListTodo className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">
                            {doneTasks}/{totalTasks} tareas
                        </span>
                        {totalTasks > 0 && (
                            <div className="w-12 h-1 bg-muted rounded-full overflow-hidden ml-1">
                                <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${(doneTasks / totalTasks) * 100}%` }}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-[11px] text-muted-foreground/50 italic">Sin tareas</span>
                )}

                {project.deadline && (
                    <div className={`flex items-center gap-1 text-[11px] ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                        {overdue
                            ? <AlertCircle className="w-3 h-3" />
                            : <Clock className="w-3 h-3" />
                        }
                        {new Date(project.deadline).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Kanban Column ────────────────────────────────────────────────────────────

const KanbanColumn = ({
    column,
    projects,
    tasks,
    onCardClick,
    onDragStart,
    onDrop,
}: {
    column: typeof COLUMNS[number];
    projects: Project[];
    tasks: Task[];
    onCardClick: (p: Project) => void;
    onDragStart: (id: string) => void;
    onDrop: (status: KanbanStatus) => void;
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={() => { setIsDragOver(false); onDrop(column.id); }}
            className={`flex flex-col rounded-xl border transition-all duration-200 ${column.color} ${isDragOver ? "ring-2 ring-primary/40 scale-[1.01]" : ""}`}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${column.dot}`} />
                    <span className="text-sm font-display font-semibold text-foreground">{column.label}</span>
                </div>
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                    {projects.length}
                </span>
            </div>

            {/* Cards */}
            <div className="flex-1 p-3 space-y-3 min-h-[200px]">
                {projects.length === 0 ? (
                    <div className={`flex items-center justify-center h-24 rounded-lg border-2 border-dashed border-white/10 text-xs text-muted-foreground/40 transition-colors ${isDragOver ? "border-primary/30 text-primary/50" : ""}`}>
                        {isDragOver ? "Soltar aquí" : "Sin proyectos"}
                    </div>
                ) : (
                    projects.map((p) => (
                        <KanbanCard
                            key={p.id}
                            project={p}
                            tasks={tasks}
                            onCardClick={onCardClick}
                            onDragStart={onDragStart}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ProjectList = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks]       = useState<Task[]>([]);
    const [loading, setLoading]   = useState(true);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [detailsOpen, setDetailsOpen]         = useState(false);
    const draggedId = useRef<string | null>(null);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [{ data: projectsData }, { data: tasksData }] = await Promise.all([
                supabase
                    .from("vault_operator_projects")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false }),
                supabase
                    .from("vault_operator_tasks")
                    .select("id, project_id, status")
                    .eq("user_id", user.id),
            ]);

            setProjects(projectsData || []);
            setTasks(tasksData || []);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = async (targetStatus: KanbanStatus) => {
        const id = draggedId.current;
        if (!id) return;

        const project = projects.find((p) => p.id === id);
        if (!project || project.status === targetStatus) return;

        // Optimistic update
        setProjects((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: targetStatus } : p))
        );

        try {
            const { error } = await supabase
                .from("vault_operator_projects")
                .update({ status: targetStatus })
                .eq("id", id);

            if (error) throw error;
        } catch {
            // Revert
            setProjects((prev) =>
                prev.map((p) => (p.id === id ? { ...p, status: project.status } : p))
            );
            toast.error("Error al mover el proyecto");
        } finally {
            draggedId.current = null;
        }
    };

    const handleCardClick = (project: Project) => {
        setSelectedProject(project);
        setDetailsOpen(true);
    };

    const handleProjectUpdated = () => {
        fetchAll();
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-primary" />
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center p-12 border border-dashed border-white/10 rounded-xl bg-card/20">
                <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">Sin proyectos activos</h3>
                <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
                    La Bóveda está vacía. Crea tu primer proyecto para empezar a trackear tu ejecución.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="-mx-4 md:mx-0 px-4 md:px-0 overflow-x-auto pb-2">
            <div className="grid grid-cols-3 gap-4 min-w-[720px] md:min-w-0">
                {COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        column={col}
                        projects={projects.filter((p) => p.status === col.id)}
                        tasks={tasks}
                        onCardClick={handleCardClick}
                        onDragStart={(id) => { draggedId.current = id; }}
                        onDrop={handleDrop}
                    />
                ))}
            </div>
            </div>

            <ProjectDetailsDialog
                project={selectedProject}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                onProjectUpdated={handleProjectUpdated}
            />
        </>
    );
};

export default ProjectList;
