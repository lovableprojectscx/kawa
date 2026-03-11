import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Calendar, ListTodo, Briefcase, Plus } from "lucide-react";
import { toast } from "sonner";
import ProjectList from "@/components/operator/ProjectList";
import CapacityMeter from "@/components/operator/CapacityMeter";
import { CreateProjectDialog } from "@/components/operator/CreateProjectDialog";
import { CapacityConfigModal } from "@/components/operator/CapacityConfigModal";

const CAPACITY_KEY = "kawa_capacity_config";

const VaultOperator = () => {
  const [loading, setLoading] = useState(true);
  const [projectListKey, setProjectListKey] = useState(0);
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingTasksCount: 0,
    hoursAvailable: 40,
    hoursCommitted: 0,
  });
  const [agenda, setAgenda] = useState<any[]>([]);

  // Capacity config
  const [showCapacityEditor, setShowCapacityEditor] = useState(false);
  const [hoursAvailable, setHoursAvailable] = useState(40);
  const [hoursPerProject, setHoursPerProject] = useState(10);

  useEffect(() => {
    const saved = localStorage.getItem(CAPACITY_KEY);
    if (saved) {
      try {
        const { available, perProject } = JSON.parse(saved);
        if (available) setHoursAvailable(available);
        if (perProject) setHoursPerProject(perProject);
      } catch { /* ignore */ }
    }
  }, []);

  const handleSaveCapacity = (available: number, perProject: number) => {
    setHoursAvailable(available);
    setHoursPerProject(perProject);
    localStorage.setItem(CAPACITY_KEY, JSON.stringify({ available, perProject }));
    setStats(prev => ({
      ...prev,
      hoursAvailable: available,
      hoursCommitted: prev.activeProjects * perProject,
    }));
    setShowCapacityEditor(false);
    toast.success("Configuración guardada");
  };

  useEffect(() => {
    fetchStats();
    fetchAgenda();
  }, [projectListKey]);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count: activeCount } = await supabase
        .from('vault_operator_projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');

      const { count: taskCount } = await supabase
        .from('vault_operator_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      const savedConfig = localStorage.getItem(CAPACITY_KEY);
      let configAvailable = 40;
      let configPerProject = 10;
      if (savedConfig) {
        try {
          const { available, perProject } = JSON.parse(savedConfig);
          if (available) configAvailable = available;
          if (perProject) configPerProject = perProject;
        } catch { /* ignore */ }
      }

      setStats({
        activeProjects: activeCount || 0,
        pendingTasksCount: taskCount || 0,
        hoursAvailable: configAvailable,
        hoursCommitted: (activeCount || 0) * configPerProject,
      });
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAgenda = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const { data } = await supabase
        .from('vault_operator_calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true });

      setAgenda(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProjectCreated = () => {
    setProjectListKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden pb-24">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-6xl mx-auto space-y-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground neon-text-glow">
              Proyectos
            </h1>
            <p className="text-muted-foreground mt-2">
              Tu centro de control de proyectos y tareas.
            </p>
          </div>
          <CreateProjectDialog onProjectCreated={handleProjectCreated} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CapacityMeter
            committed={stats.hoursCommitted}
            available={stats.hoursAvailable}
            onEdit={() => setShowCapacityEditor(true)}
          />

          <div className="bg-card/50 backdrop-blur-sm border border-white/10 p-6 rounded-xl hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-primary/20 rounded-lg text-primary">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proyectos Activos</p>
                <h3 className="text-2xl font-bold">{stats.activeProjects}</h3>
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-light">En progreso ahora mismo</p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-white/10 p-6 rounded-xl hover:border-amber-400/30 transition-colors">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-amber-400/10 rounded-lg text-amber-400">
                <ListTodo className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tareas Pendientes</p>
                <h3 className="text-2xl font-bold">{stats.pendingTasksCount}</h3>
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-light">Sin completar en todos los proyectos</p>
          </div>
        </div>

        {/* Agenda del día — compacta arriba del Kanban */}
        <div className="bg-card/30 border border-white/5 p-4 rounded-xl">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Agenda de Hoy
          </h3>
          {agenda.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {agenda.map((event, i) => (
                <div key={i} className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 min-w-[180px]">
                  <span className="text-[10px] uppercase tracking-wider text-primary font-display shrink-0">
                    {new Date(event.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-sm text-foreground font-light truncate">{event.event_title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic">No hay eventos para hoy.</p>
          )}
        </div>

        {/* Kanban Board — ancho completo */}
        <ProjectList key={projectListKey} />
      </motion.div>

      <CapacityConfigModal
        isOpen={showCapacityEditor}
        onClose={() => setShowCapacityEditor(false)}
        onSave={handleSaveCapacity}
        initialAvailable={hoursAvailable}
        initialPerProject={hoursPerProject}
        activeProjects={stats.activeProjects}
      />
    </div>
  );
};

export default VaultOperator;
