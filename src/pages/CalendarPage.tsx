import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Plus, Clock, X, ChevronLeft, ChevronRight, Trash2, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface CalendarEvent {
  id: string;
  event_title: string;
  start_time: string;
  end_time: string;
  type: string;
}

const CalendarPage = () => {
  const realToday = new Date();

  const [viewDate, setViewDate] = useState(new Date(realToday.getFullYear(), realToday.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number>(realToday.getDate());
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState({ title: "", type: "meeting", time: "09:00" });
  const [editForm, setEditForm] = useState({ title: "", type: "meeting", time: "09:00", endTime: "10:00" });

  const today = realToday.getDate();
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const isCurrentMonth = currentMonth === realToday.getMonth() && currentYear === realToday.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startOffset = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const goToPrevMonth = () => { setViewDate(new Date(currentYear, currentMonth - 1, 1)); setSelectedDay(1); };
  const goToNextMonth = () => { setViewDate(new Date(currentYear, currentMonth + 1, 1)); setSelectedDay(1); };

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('vault_operator_calendar_events').select('*').eq('user_id', user.id);
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Calendar error:", error);
      toast.error("Error al cargar el calendario");
    } finally {
      setLoading(false);
    }
  };

  const dayEvents = (day: number) =>
    events.filter(e => {
      const d = new Date(e.start_time);
      return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.from("vault_operator_calendar_events").delete().eq("id", eventId);
      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast.success("Evento eliminado");
    } catch {
      toast.error("Error al eliminar evento");
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [h, m] = newEvent.time.split(':');
      const startTime = new Date(currentYear, currentMonth, selectedDay, parseInt(h), parseInt(m));
      const endTime = new Date(startTime.getTime() + 3600000);
      const { error, data } = await supabase.from('vault_operator_calendar_events').insert({
        user_id: user.id,
        event_title: newEvent.title,
        type: newEvent.type,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      }).select().single();
      if (error) throw error;
      setEvents(prev => [...prev, data]);
      toast.success("Evento guardado");
      setShowAddModal(false);
      setNewEvent({ title: "", type: "meeting", time: "09:00" });
    } catch {
      toast.error("Error al guardar evento");
    }
  };

  const openEditModal = (ev: CalendarEvent) => {
    const start = new Date(ev.start_time);
    const end = new Date(ev.end_time);
    const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    setEditForm({ title: ev.event_title, type: ev.type, time: fmt(start), endTime: fmt(end) });
    setEditingEvent(ev);
  };

  const handleEditEvent = async () => {
    if (!editingEvent || !editForm.title) return;
    try {
      const startDate = new Date(editingEvent.start_time);
      const [sh, sm] = editForm.time.split(':');
      const [eh, em] = editForm.endTime.split(':');
      const newStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), parseInt(sh), parseInt(sm));
      const newEnd = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), parseInt(eh), parseInt(em));

      const { error } = await supabase.from("vault_operator_calendar_events").update({
        event_title: editForm.title,
        type: editForm.type,
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      }).eq("id", editingEvent.id);
      if (error) throw error;

      setEvents(prev => prev.map(e => e.id === editingEvent.id
        ? { ...e, event_title: editForm.title, type: editForm.type, start_time: newStart.toISOString(), end_time: newEnd.toISOString() }
        : e
      ));
      toast.success("Evento actualizado");
      setEditingEvent(null);
    } catch {
      toast.error("Error al actualizar evento");
    }
  };

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const EventModal = ({ title, onSave, onClose, form, setForm }: {
    title: string;
    onSave: () => void;
    onClose: () => void;
    form: { title: string; type: string; time: string; endTime?: string };
    setForm: (f: any) => void;
  }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Título</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Reunión Estratégica"
              className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary/50 transition-all text-foreground"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Tipo</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary/50 transition-all appearance-none text-foreground"
            >
              <option value="meeting">Reunión</option>
              <option value="call">Llamada</option>
              <option value="task">Tarea</option>
              <option value="deadline">Deadline</option>
              <option value="block">Foco Digital</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Hora inicio</label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary/50 transition-all text-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">Hora fin</label>
              <input
                type="time"
                value={form.endTime || ""}
                onChange={e => setForm({ ...form, endTime: e.target.value })}
                className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2.5 outline-none focus:border-primary/50 transition-all text-foreground"
              />
            </div>
          </div>

          <button
            onClick={onSave}
            className="w-full bg-primary text-primary-foreground font-display py-3 rounded-lg hover:bg-primary/90 transition-all mt-2 font-bold tracking-wide"
          >
            GUARDAR
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl text-foreground font-display">Calendario</h1>
            <div className="flex items-center gap-3 mt-1">
              <button onClick={goToPrevMonth} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-muted-foreground font-light capitalize min-w-[160px] text-center">
                {viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </p>
              <button onClick={goToNextMonth} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
              {!isCurrentMonth && (
                <button
                  onClick={() => { setViewDate(new Date(realToday.getFullYear(), realToday.getMonth(), 1)); setSelectedDay(realToday.getDate()); }}
                  className="text-xs text-primary hover:underline ml-1"
                >
                  Hoy
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-primary/30 text-primary text-sm font-display hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo evento
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2 bg-card border border-border rounded-lg p-6"
        >
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[11px] text-muted-foreground font-display tracking-wider uppercase py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
              const eventsInDay = dayEvents(day);
              const isToday = isCurrentMonth && day === today;
              const isSelected = day === selectedDay;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "aspect-square rounded-md flex flex-col items-center justify-center text-sm transition-all relative",
                    isSelected ? "bg-primary text-primary-foreground"
                      : isToday ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-foreground hover:bg-muted"
                  )}
                >
                  {day}
                  {eventsInDay.length > 0 && !isSelected && (
                    <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <h2 className="text-lg font-display text-foreground">
              {selectedDay} de {viewDate.toLocaleDateString('es-ES', { month: 'long' })}
            </h2>
          </div>

          <div className="space-y-3">
            {dayEvents(selectedDay).length > 0 ? (
              dayEvents(selectedDay).map((ev, i) => (
                <div key={i} className="group flex items-start gap-3 px-4 py-3 rounded-md bg-muted/50 border border-border/50 hover:border-primary/20 transition-all">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-light truncate">{ev.event_title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        {' — '}
                        {new Date(ev.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-display tracking-wider uppercase bg-primary/10 text-primary">
                        {({ meeting: 'Reunión', call: 'Llamada', task: 'Tarea', deadline: 'Entrega', block: 'Foco' } as Record<string,string>)[ev.type] || ev.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <button
                      onClick={() => openEditModal(ev)}
                      className="text-muted-foreground hover:text-primary transition-colors p-1"
                      title="Editar evento"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Eliminar evento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-light">Sin eventos este día</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-xs text-primary hover:underline hover:text-primary/80"
                >
                  + Programar algo
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <EventModal
            title={`Nuevo Evento — ${selectedDay} de ${viewDate.toLocaleDateString('es-ES', { month: 'long' })}`}
            form={{ ...newEvent, endTime: "" }}
            setForm={(f: any) => setNewEvent({ title: f.title, type: f.type, time: f.time })}
            onSave={handleAddEvent}
            onClose={() => setShowAddModal(false)}
          />
        )}
        {editingEvent && (
          <EventModal
            title="Editar Evento"
            form={editForm}
            setForm={setEditForm}
            onSave={handleEditEvent}
            onClose={() => setEditingEvent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarPage;
