import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Folder, Clock, AlertCircle, ListTodo, Plus, ChevronRight } from "lucide-react";
import { ProjectDetailsDialog } from "@/components/operator/ProjectDetailsDialog";
import { CreateProjectDialog } from "@/components/operator/CreateProjectDialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "backlog" | "done";
  priority: string;
  deadline?: string;
  workspace?: string;
}

interface Task {
  id: string;
  project_id: string;
  status: "pending" | "done";
}

type KanbanStatus = "backlog" | "active" | "done";

const COLUMNS: {
  id: KanbanStatus;
  label: string;
  subLabel: string;
  headerColor: string;
  cardBorder: string;
  dot: string;
  emptyLabel: string;
}[] = [
    {
      id: "backlog",
      label: "Backlog",
      subLabel: "Por empezar",
      headerColor: "border-amber-400/20 bg-amber-400/[0.04]",
      cardBorder: "border-l-amber-400/50",
      dot: "bg-amber-400",
      emptyLabel: "Proyectos en espera",
    },
    {
      id: "active",
      label: "En Progreso",
      subLabel: "Activos ahora",
      headerColor: "border-primary/20 bg-primary/[0.04]",
      cardBorder: "border-l-primary/60",
      dot: "bg-primary",
      emptyLabel: "Arrastra proyectos aquí",
    },
    {
      id: "done",
      label: "Terminados",
      subLabel: "Completados",
      headerColor: "border-emerald-400/20 bg-emerald-400/[0.04]",
      cardBorder: "border-l-emerald-400/60",
      dot: "bg-emerald-400",
      emptyLabel: "Proyectos completados",
    },
  ];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bar: string }> = {
  "5": { label: "Crítica", color: "text-red-400 bg-red-500/15", bar: "bg-red-400" },
  "4": { label: "Alta", color: "text-orange-400 bg-orange-500/15", bar: "bg-orange-400" },
  "3": { label: "Media", color: "text-amber-400 bg-amber-500/15", bar: "bg-amber-400" },
  "2": { label: "Normal", color: "text-sky-400 bg-sky-500/15", bar: "bg-sky-400" },
  "1": { label: "Baja", color: "text-muted-foreground bg-muted", bar: "bg-muted-foreground" },
  high: { label: "Alta", color: "text-orange-400 bg-orange-500/15", bar: "bg-orange-400" },
  medium: { label: "Media", color: "text-amber-400 bg-amber-500/15", bar: "bg-amber-400" },
  low: { label: "Baja", color: "text-muted-foreground bg-muted", bar: "bg-muted-foreground" },
};

const priorityBorderColor: Record<string, string> = {
  "5": "border-l-red-400/70",
  "4": "border-l-orange-400/60",
  "3": "border-l-amber-400/60",
  "2": "border-l-sky-400/50",
  "1": "border-l-muted-foreground/30",
  high: "border-l-orange-400/60",
  medium: "border-l-amber-400/60",
  low: "border-l-muted-foreground/30",
};

const isOverdue = (deadline?: string) => deadline ? new Date(deadline) < new Date() : false;

// ─── Kanban Card ──────────────────────────────────────────────────────────────
const KanbanCard = ({
  project, tasks, onCardClick, onDragStart,
}: {
  project: Project;
  tasks: Task[];
  onCardClick: (p: Project) => void;
  onDragStart: (id: string) => void;
}) => {
  const projectTasks = tasks.filter(t => t.project_id === project.id);
  const doneTasks = projectTasks.filter(t => t.status === "done").length;
  const totalTasks = projectTasks.length;
  const pCfg = PRIORITY_CONFIG[project.priority] ?? PRIORITY_CONFIG["2"];
  const pBorder = priorityBorderColor[project.priority] ?? "border-l-sky-400/50";
  const overdue = isOverdue(project.deadline);
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      draggable
      onDragStart={(e: any) => { e.dataTransfer.effectAllowed = "move"; onDragStart(project.id); }}
      onClick={() => onCardClick(project)}
      className={`bg-card border border-l-4 ${pBorder} border-white/[0.07] rounded-lg p-4 cursor-pointer hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 active:opacity-70 transition-all select-none group`}
    >
      {/* Title + priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-foreground leading-snug flex-1 group-hover:text-primary transition-colors">
          {project.name}
        </p>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-display tracking-wider uppercase shrink-0 ${pCfg.color}`}>
          {pCfg.label}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-muted-foreground font-light line-clamp-2 mb-3 leading-relaxed">{project.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/30">
        {/* Task progress */}
        {totalTasks > 0 ? (
          <div className="flex items-center gap-2">
            <ListTodo className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-[11px] text-muted-foreground">{doneTasks}/{totalTasks}</span>
            <div className="w-10 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full ${pCfg.bar} rounded-full transition-all`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground/40 italic flex items-center gap-1">
            <Plus className="w-3 h-3" /> Agregar tareas
          </span>
        )}

        {/* Deadline */}
        {project.deadline && (
          <div className={`flex items-center gap-1 text-[11px] ${overdue ? "text-rose-400" : "text-muted-foreground"}`}>
            {overdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {new Date(project.deadline).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
          </div>
        )}
      </div>

      {/* Open arrow hint on hover */}
      <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          Abrir <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
};

// ─── Kanban Column ────────────────────────────────────────────────────────────
const KanbanColumn = ({
  column, projects, tasks, onCardClick, onDragStart, onDrop, onProjectCreated,
}: {
  column: typeof COLUMNS[number];
  projects: Project[];
  tasks: Task[];
  onCardClick: (p: Project) => void;
  onDragStart: (id: string) => void;
  onDrop: (status: KanbanStatus) => void;
  onProjectCreated: () => void;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={() => { setIsDragOver(false); onDrop(column.id); }}
      className={`flex flex-col rounded-xl border transition-all duration-200 ${column.headerColor} ${isDragOver ? "ring-2 ring-primary/30 scale-[1.01]" : ""
        }`}
      style={{ minHeight: 280 }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${column.dot} ${column.id === "active" ? "animate-pulse" : ""}`} />
          <div>
            <span className="text-sm font-display font-semibold text-foreground">{column.label}</span>
            <p className="text-[10px] text-muted-foreground/60">{column.subLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full min-w-[24px] text-center">
            {projects.length}
          </span>
          {/* Quick add project button in each column */}
          <CreateProjectDialog
            onProjectCreated={onProjectCreated}
            defaultStatus={column.id}
            defaultWorkspace={projects[0]?.workspace || "Principal"}
          >
            <button
              className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title={`Nuevo proyecto en ${column.label}`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </CreateProjectDialog>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2.5">
        <AnimatePresence>
          {projects.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed text-xs text-muted-foreground/40 transition-colors mt-2 ${isDragOver ? "border-primary/40 bg-primary/5 text-primary/60" : "border-white/[0.08]"
              }`}>
              {isDragOver ? (
                <p className="font-medium">Soltar aquí</p>
              ) : (
                <>
                  <Folder className="w-5 h-5 mb-1 opacity-30" />
                  <p>{column.emptyLabel}</p>
                </>
              )}
            </div>
          ) : (
            projects.map(p => (
              <KanbanCard
                key={p.id}
                project={p}
                tasks={tasks}
                onCardClick={onCardClick}
                onDragStart={onDragStart}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState("Principal");
  const draggedId = useRef<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: projectsData }, { data: tasksData }] = await Promise.all([
        supabase.from("vault_operator_projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("vault_operator_tasks").select("id, project_id, status").eq("user_id", user.id),
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
    const project = projects.find(p => p.id === id);
    if (!project || project.status === targetStatus) return;

    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: targetStatus } : p));
    try {
      const { error } = await supabase.from("vault_operator_projects").update({ status: targetStatus }).eq("id", id);
      if (error) throw error;
      toast.success(`Proyecto movido a ${COLUMNS.find(c => c.id === targetStatus)?.label}`);
    } catch {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, status: project.status } : p));
      toast.error("Error al mover el proyecto");
    } finally {
      draggedId.current = null;
    }
  };

  if (loading) return (
    <div className="flex justify-center p-8">
      <Loader2 className="animate-spin text-primary" />
    </div>
  );

  const workspaces = Array.from(new Set(projects.map(p => p.workspace || "Principal")));

  const workspaceProjects = projects.filter(p => (p.workspace || "Principal") === activeWorkspace);

  const filteredProjects = search
    ? workspaceProjects.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    )
    : workspaceProjects;

  return (
    <>
      {/* Workspace Tabs */}
      {workspaces.length > 0 && (
        <div className="flex bg-card/50 p-1 rounded-xl mb-6 w-max max-w-full overflow-x-auto border border-border/50 hide-scrollbar">
          {workspaces.map(w => (
            <button
              key={w}
              onClick={() => setActiveWorkspace(w)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeWorkspace === w
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
            >
              {w}
            </button>
          ))}
        </div>
      )}

      {/* Search / filter bar */}
      {projects.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar proyecto..."
              className="w-full bg-card border border-border rounded-lg pl-3 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <span className="text-xs">✕</span>
              </button>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? "s" : ""}
            {search && ` · filtrando por "${search}"`}
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center p-16 border border-dashed border-white/10 rounded-xl bg-card/20 space-y-4">
          <Folder className="w-12 h-12 text-muted-foreground mx-auto opacity-30" />
          <h3 className="text-lg font-display font-medium text-foreground">Sin proyectos aún</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto font-light">
            Crea tu primer proyecto para empezar a trackear tu ejecución en el Kanban.
          </p>
          <CreateProjectDialog onProjectCreated={fetchAll} defaultWorkspace={activeWorkspace}>
            <button className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              Crear primer proyecto
            </button>
          </CreateProjectDialog>
        </div>
      ) : (
        <div className="-mx-4 md:mx-0 px-4 md:px-0 overflow-x-auto pb-2">
          <div className="grid grid-cols-3 gap-4 min-w-[720px] md:min-w-0">
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                projects={filteredProjects.filter(p => p.status === col.id)}
                tasks={tasks}
                onCardClick={p => { setSelectedProject(p); setDetailsOpen(true); }}
                onDragStart={id => { draggedId.current = id; }}
                onDrop={handleDrop}
                onProjectCreated={fetchAll}
              />
            ))}
          </div>
        </div>
      )}

      <ProjectDetailsDialog
        project={selectedProject}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onProjectUpdated={fetchAll}
      />
    </>
  );
};

export default ProjectList;
