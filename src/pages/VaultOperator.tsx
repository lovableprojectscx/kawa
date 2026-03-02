import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Plus, Calendar, ListTodo, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ProjectList from "@/components/operator/ProjectList";
import CapacityMeter from "@/components/operator/CapacityMeter";
import { CreateProjectDialog } from "@/components/operator/CreateProjectDialog";

const CAPACITY_KEY = "kawa_capacity_config";

const VaultOperator = () => {
  const [loading, setLoading] = useState(true);
  const [projectListKey, setProjectListKey] = useState(0);
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedTasks: 0,
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

  const saveCapacityConfig = () => {
    localStorage.setItem(CAPACITY_KEY, JSON.stringify({ available: hoursAvailable, perProject: hoursPerProject }));
    setStats(prev => ({
      ...prev,
      hoursAvailable,
      hoursCommitted: prev.activeProjects * hoursPerProject,
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
        completedTasks: taskCount || 0,
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
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proyectos Activos</p>
                <h3 className="text-2xl font-bold">{stats.activeProjects}</h3>
              </div>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-white/10 p-6 rounded-xl hover:border-amber-400/30 transition-colors">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-amber-400/10 rounded-lg text-amber-400">
                <ListTodo className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tareas Pendientes</p>
                <h3 className="text-2xl font-bold">{stats.completedTasks}</h3>
              </div>
            </div>
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

      {/* Capacity Config Modal */}
      <AnimatePresence>
        {showCapacityEditor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCapacityEditor(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-display font-semibold text-foreground">Configurar Capacidad</h3>
                <button onClick={() => setShowCapacityEditor(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Horas disponibles por semana</label>
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    value={hoursAvailable}
                    onChange={e => setHoursAvailable(Math.max(1, parseInt(e.target.value) || 40))}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Horas promedio por proyecto activo</label>
                  <Input
                    type="number"
                    min={1}
                    value={hoursPerProject}
                    onChange={e => setHoursPerProject(Math.max(1, parseInt(e.target.value) || 10))}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Estimado comprometido: {stats.activeProjects} proyectos × {hoursPerProject}h = <strong>{stats.activeProjects * hoursPerProject}h</strong>
                </p>
                <Button onClick={saveCapacityConfig} className="w-full">Guardar</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VaultOperator;
