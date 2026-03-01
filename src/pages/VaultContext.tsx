import { motion } from "framer-motion";
import { Globe, Search, User, Calendar, MessageSquare, Plus, Clock, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { AddPersonDialog } from "@/components/context/AddPersonDialog";
import { EditPersonDialog } from "@/components/context/EditPersonDialog";
import { Button } from "@/components/ui/button";

interface Contact {
  id: string;
  name: string;
  role: string;
  last_interaction_summary: string;
  facts?: string[];
}

interface CalendarEvent {
  id: string;
  event_title: string;
  start_time: string;
  type: string;
}

const roleColors: Record<string, string> = {
  Cliente: "bg-sky-400/10 text-sky-400",
  Socia: "bg-primary/10 text-primary",
  Proveedor: "bg-emerald-400/10 text-emerald-400",
  Mentora: "bg-amber-400/10 text-amber-400",
  Equipo: "bg-purple-400/10 text-purple-400",
};

const VaultContext = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meetings, setMeetings] = useState<CalendarEvent[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("vault_context_people")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingMeetings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("vault_operator_calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(5);

      setMeetings(data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchUpcomingMeetings();
  }, []);

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      (c.last_interaction_summary && c.last_interaction_summary.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-sky-400/10">
              <Globe className="w-6 h-6 text-sky-400" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl text-foreground">Red de Contactos</h1>
          </div>
          <p className="text-muted-foreground font-light">Tus Conexiones · Personas · Networking</p>
        </div>

        <AddPersonDialog onPersonAdded={fetchContacts}>
          <Button className="gap-2 bg-sky-500 hover:bg-sky-600">
            <Plus className="w-4 h-4" /> Agregar Persona
          </Button>
        </AddPersonDialog>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Search + List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Buscar contacto, rol o contexto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-sky-400/40 transition-colors font-light"
            />
          </div>

          {/* Contact List */}
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-10">Cargando red...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground font-light border border-dashed border-border rounded-lg">
                <p>No se encontraron contactos.</p>
                <p className="text-sm opacity-50 mt-1">Agrega a tu red para empezar a construir contexto.</p>
              </div>
            ) : (
              filtered.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(selected === c.id ? null : c.id)}
                  className={`bg-card border rounded-lg p-5 cursor-pointer transition-all duration-200 ${selected === c.id ? "border-sky-400/40 neon-glow" : "border-border hover:border-sky-400/20"
                    }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-sky-400/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-sky-400" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground font-light line-clamp-1">{c.last_interaction_summary}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-display tracking-wider uppercase ${roleColors[c.role] || "bg-muted text-muted-foreground"}`}>
                      {c.role}
                    </span>
                  </div>

                  {selected === c.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 pt-3 border-t border-border/50 space-y-3"
                    >
                      <p className="text-sm text-muted-foreground font-light whitespace-pre-wrap">{c.last_interaction_summary}</p>
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditContact(c); setEditOpen(true); }}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-sky-400 transition-colors"
                        >
                          <Pencil className="w-3 h-3" /> Editar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right: Upcoming meetings (Static for now, could generally come from Calendar vault) */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-sky-400" strokeWidth={1.5} />
              <h2 className="font-display text-foreground text-sm tracking-wider uppercase">Próximas Reuniones</h2>
            </div>
            <div className="space-y-3">
              {meetings.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay reuniones programadas.</p>
              ) : (
                meetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border border-border/40">
                    <Clock className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" strokeWidth={1.5} />
                    <div className="min-w-0">
                      <p className="text-xs text-foreground font-light truncate">{meeting.event_title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(meeting.start_time).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        {" · "}
                        {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-sky-400" strokeWidth={1.5} />
              <h2 className="font-display text-foreground text-sm tracking-wider uppercase">Briefing IA</h2>
            </div>
            <div className="bg-sky-400/5 border border-sky-400/20 rounded-md p-4">
              <p className="text-xs text-muted-foreground font-light leading-relaxed">
                <span className="text-foreground">KAWA:</span> Al agregar personas clave, podré recordarte detalles importantes antes de reunirte con ellos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <EditPersonDialog
        contact={editContact}
        open={editOpen}
        onOpenChange={setEditOpen}
        onPersonUpdated={() => { fetchContacts(); setSelected(null); }}
      />
    </div>
  );
};

export default VaultContext;
