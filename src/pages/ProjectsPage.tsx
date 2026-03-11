import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  Plus, Briefcase, Clock, CheckSquare, Square, Trash2,
  Save, AlertCircle, Loader2, X, ChevronRight, TrendingUp,
  Circle, Flame, Building2
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateProjectDialog } from "@/components/operator/CreateProjectDialog";

type FilterStatus = "all" | "active" | "backlog" | "done";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "backlog" | "done";
  priority: string;
  deadline?: string;
  company_id?: string | null;
}

interface Company {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  name: string;
  status: "pending" | "done";
  project_id: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  active: { label: "Activo", dot: "bg-emerald-400", text: "text-emerald-400", pill: "bg-emerald-400/10 border-emerald-400/20" },
  backlog: { label: "Espera", dot: "bg-amber-400", text: "text-amber-400", pill: "bg-amber-400/10 border-amber-400/20" },
  done: { label: "Listo", dot: "bg-primary", text: "text-primary", pill: "bg-primary/10 border-primary/20" },
};

const PRIORITY_CFG: Record<string, { label: string; color: string }> = {
  "5": { label: "Crítica", color: "#ef4444" },
  "4": { label: "Alta", color: "#f97316" },
  "3": { label: "Media", color: "#f59e0b" },
  "2": { label: "Normal", color: "#38bdf8" },
  "1": { label: "Baja", color: "#64748b" },
};

const isOverdue = (d?: string) => d ? new Date(d) < new Date() : false;

// ─── Circular Progress ────────────────────────────────────────────────────────

const CircleProgress = ({ pct, size = 40, stroke = 3, color = "#f43f5e" }: { pct: number; size?: number; stroke?: number; color?: string }) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
};

// ─── Project Card ─────────────────────────────────────────────────────────────

const ProjectCard = ({ project, tasks, company, onClick }: { project: Project; tasks: Task[]; company?: Company; onClick: () => void }) => {
  const done = tasks.filter(t => t.status === "done").length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const overdue = isOverdue(project.deadline);
  const cfg = STATUS_CFG[project.status];
  const pCfg = PRIORITY_CFG[project.priority] ?? PRIORITY_CFG["3"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group relative bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/30 transition-all duration-200 overflow-hidden"
    >
      {/* Priority accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-70"
        style={{ background: pCfg.color }}
      />

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            <span className={`text-[9px] font-display tracking-widest uppercase font-semibold ${cfg.text}`}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground leading-snug truncate">
              {project.name}
            </h3>
            {company && (
              <span
                className="text-[8px] px-1.5 py-0.5 rounded-md border flex items-center gap-1 shrink-0"
                style={{ backgroundColor: `${company.color}10`, borderColor: `${company.color}30`, color: company.color }}
              >
                <Building2 className="w-2 h-2" />
                {company.name}
              </span>
            )}
          </div>
        </div>

        {/* Progress ring */}
        <div className="relative shrink-0">
          <CircleProgress pct={pct} size={38} stroke={3} color={pCfg.color} />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">
            {pct}%
          </span>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-muted-foreground font-light line-clamp-2 mb-4 leading-relaxed">
          {project.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckSquare className="w-3 h-3" />
          <span>{done}/{total} tareas</span>
        </div>

        <div className="flex items-center gap-2">
          {project.deadline && (
            <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${overdue
              ? "text-rose-400 border-rose-400/20 bg-rose-400/10"
              : "text-muted-foreground border-border/50"
              }`}>
              {overdue ? <AlertCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
              {new Date(project.deadline).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
            </div>
          )}
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: pCfg.color }}
            title={`Prioridad: ${pCfg.label}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  // Sheet
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editPriority, setEditPriority] = useState("3");
  const [editDeadline, setEditDeadline] = useState("");
  const [editCompanyId, setEditCompanyId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState("");
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: pd }, { data: td }, { data: cd }] = await Promise.all([
        supabase.from("vault_operator_projects").select("*").eq("user_id", user.id).order("priority", { ascending: false }),
        supabase.from("vault_operator_tasks").select("*").eq("user_id", user.id),
        supabase.from("vault_companies").select("*").eq("user_id", user.id).order("name"),
      ]);
      setProjects(pd || []);
      setTasks(td || []);
      setCompanies(cd || []);
    } catch { console.error("fetch fail"); }
    finally { setLoading(false); }
  };

  const openProject = (p: Project) => {
    setSelectedProject(p);
    setEditName(p.name);
    setEditDesc(p.description || "");
    setEditStatus(p.status);
    setEditPriority(p.priority.toString());
    setEditDeadline(p.deadline ? p.deadline.split("T")[0] : "");
    setEditCompanyId(p.company_id || null);
    setProjectTasks(tasks.filter(t => t.project_id === p.id));
    setSheetOpen(true);
  };

  const handleSaveProject = async () => {
    if (!selectedProject || !editName) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("vault_operator_projects")
        .update({
          name: editName,
          description: editDesc,
          status: editStatus,
          priority: parseInt(editPriority),
          deadline: editDeadline || null,
          company_id: editCompanyId === "none" ? null : editCompanyId
        })
        .eq("id", selectedProject.id);
      if (error) throw error;
      toast.success("Proyecto guardado");
      fetchAll();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject || !confirm("¿Eliminar este proyecto?")) return;
    await supabase.from("vault_operator_projects").delete().eq("id", selectedProject.id);
    toast.success("Proyecto eliminado");
    setSheetOpen(false);
    fetchAll();
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !selectedProject) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("vault_operator_tasks")
      .insert({ project_id: selectedProject.id, user_id: user.id, name: newTask, status: "pending" })
      .select().single();
    if (error) { toast.error("Error al crear tarea"); return; }
    setProjectTasks(p => [...p, data]);
    setTasks(p => [...p, data]);
    setNewTask("");
  };

  const toggleTask = async (task: Task) => {
    const ns = task.status === "pending" ? "done" : "pending";
    setProjectTasks(p => p.map(t => t.id === task.id ? { ...t, status: ns } : t));
    setTasks(p => p.map(t => t.id === task.id ? { ...t, status: ns } : t));
    const { error } = await supabase.from("vault_operator_tasks").update({ status: ns }).eq("id", task.id);
    if (error) { setProjectTasks(p => p.map(t => t.id === task.id ? { ...t, status: task.status } : t)); }
  };

  const deleteTask = async (id: string) => {
    setProjectTasks(p => p.filter(t => t.id !== id));
    setTasks(p => p.filter(t => t.id !== id));
    await supabase.from("vault_operator_tasks").delete().eq("id", id);
  };

  let filtered = filter === "all" ? projects : projects.filter(p => p.status === filter);
  if (companyFilter !== "all") {
    filtered = filtered.filter(p => p.company_id === companyFilter);
  }
  const active = projects.filter(p => p.status === "active");
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "done").length;

  const TABS: { id: FilterStatus; label: string }[] = [
    { id: "all", label: "Todos" },
    { id: "active", label: "Activos" },
    { id: "backlog", label: "En Espera" },
    { id: "done", label: "Terminados" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 pb-24 space-y-8">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-light text-foreground">Proyectos</h1>
            <p className="text-sm text-muted-foreground font-light mt-0.5">
              {active.length} activos · {projects.filter(p => p.status === "backlog").length} en espera
            </p>
          </div>
          <CreateProjectDialog onProjectCreated={fetchAll} />
        </div>

        {/* ── STATS STRIP ── */}
        {projects.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: projects.length, icon: Briefcase, color: "text-violet-400" },
              { label: "Tareas completadas", value: `${doneTasks}/${totalTasks}`, icon: CheckSquare, color: "text-emerald-400" },
              { label: "Prioridad crítica", value: projects.filter(p => p.priority === "5").length, icon: Flame, color: "text-rose-400" },
            ].map((s, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <s.icon className={`w-4 h-4 ${s.color} mb-2`} strokeWidth={1.5} />
                <p className="text-lg font-semibold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-light">{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── TABS & COMPANY FILTER ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/50">
            {TABS.map(t => {
              const count = t.id === "all" ? projects.length : projects.filter(p => p.status === t.id).length;
              return (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-display transition-all duration-150 ${filter === t.id
                    ? "bg-card text-foreground shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {t.label}
                  {count > 0 && (
                    <span className={`ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded-full ${filter === t.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {companies.length > 0 && (
            <div className="sm:w-48">
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="h-full rounded-xl bg-muted/40 border-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Empresa..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary w-6 h-6" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-5">
              <Briefcase className="w-7 h-7 text-muted-foreground/40" strokeWidth={1.2} />
            </div>
            <h3 className="text-base font-display font-semibold text-foreground mb-1">
              {filter === "all" ? "Sin proyectos aún" : "No hay proyectos aquí"}
            </h3>
            <p className="text-sm text-muted-foreground font-light max-w-xs mb-6">
              {filter === "all"
                ? "Crea tu primer proyecto para empezar a trackear tu trabajo."
                : "Cambia el filtro o crea un nuevo proyecto."}
            </p>
            {filter === "all" && <CreateProjectDialog onProjectCreated={fetchAll} />}
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filtered.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  company={companies.find(c => c.id === p.company_id)}
                  tasks={tasks.filter(t => t.project_id === p.id)}
                  onClick={() => openProject(p)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ── DETAIL SHEET ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-card border-border p-0 flex flex-col overflow-hidden">
          {selectedProject && (
            <>
              <SheetHeader className="px-6 py-5 border-b border-border/50">
                <div className="flex items-center justify-between gap-3">
                  <SheetTitle className="text-base font-bold truncate">{editName || selectedProject.name}</SheetTitle>
                  <span className={`text-[9px] font-display px-2.5 py-1 rounded-full border tracking-widest uppercase font-semibold ${STATUS_CFG[editStatus as keyof typeof STATUS_CFG]?.pill ?? STATUS_CFG["active"].pill} ${STATUS_CFG[editStatus as keyof typeof STATUS_CFG]?.text ?? STATUS_CFG["active"].text}`}>
                    {STATUS_CFG[editStatus as keyof typeof STATUS_CFG]?.label ?? "Activo"}
                  </span>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Edit fields */}
                <div className="space-y-3">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre del proyecto" className="font-medium" />
                  <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Descripción..." className="resize-none text-sm min-h-[72px]" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-widest">Estado</label>
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="backlog">En Espera</SelectItem>
                          <SelectItem value="done">Terminado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-widest">Prioridad</label>
                      <Select value={editPriority} onValueChange={setEditPriority}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">🔴 Crítica</SelectItem>
                          <SelectItem value="4">🟠 Alta</SelectItem>
                          <SelectItem value="3">🟡 Media</SelectItem>
                          <SelectItem value="2">🔵 Normal</SelectItem>
                          <SelectItem value="1">⚫ Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-widest">Fecha límite</label>
                      <Input type="date" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} className="h-9" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-widest">Empresa</label>
                      <Select value={editCompanyId || "none"} onValueChange={setEditCompanyId}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Personal</SelectItem>
                          {companies.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-display font-semibold uppercase tracking-widest text-muted-foreground">Tareas</h3>
                    <span className="text-xs text-muted-foreground">
                      {projectTasks.filter(t => t.status === "done").length}/{projectTasks.length}
                    </span>
                  </div>

                  {/* Task progress bar */}
                  {projectTasks.length > 0 && (
                    <div className="h-1 bg-border/50 rounded-full overflow-hidden mb-3">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${projectTasks.length > 0 ? (projectTasks.filter(t => t.status === "done").length / projectTasks.length) * 100 : 0}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}

                  <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
                    <Input placeholder="Nueva tarea..." value={newTask} onChange={e => setNewTask(e.target.value)} className="flex-1 h-9 text-sm" />
                    <Button type="submit" size="sm" className="h-9 px-3" disabled={!newTask.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </form>

                  <div className="space-y-0.5">
                    {projectTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground/40 italic text-center py-4">Sin tareas todavía</p>
                    ) : (
                      projectTasks.map(task => (
                        <div key={task.id} className="group flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition-colors">
                          <button onClick={() => toggleTask(task)} className={`shrink-0 transition-colors ${task.status === "done" ? "text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}>
                            {task.status === "done" ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>
                          <span className={`flex-1 text-sm ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {task.name}
                          </span>
                          <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border/50 flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleDeleteProject} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-1.5" /> Eliminar
                </Button>
                <Button onClick={handleSaveProject} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Guardar
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProjectsPage;
