import { motion, AnimatePresence } from "framer-motion";
import {
    Globe, Search, User, Calendar, MessageSquare, Plus, Clock,
    Pencil, ArrowRight, Trash2, X, ChevronDown, ChevronUp, UserPlus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { AddPersonDialog } from "@/components/context/AddPersonDialog";
import { EditPersonDialog } from "@/components/context/EditPersonDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Contact {
    id: string;
    name: string;
    role: string;
    last_interaction_summary: string;
    facts?: string[];
    created_at?: string;
}

interface CalendarEvent {
    id: string;
    event_title: string;
    start_time: string;
    type: string;
}

const roleColors: Record<string, string> = {
    Cliente: "bg-sky-400/10 text-sky-400 border-sky-400/20",
    Socia: "bg-primary/10 text-primary border-primary/20",
    Socio: "bg-primary/10 text-primary border-primary/20",
    Proveedor: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    Mentora: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    Mentor: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    Equipo: "bg-purple-400/10 text-purple-400 border-purple-400/20",
    Inversor: "bg-rose-400/10 text-rose-400 border-rose-400/20",
    Inversora: "bg-rose-400/10 text-rose-400 border-rose-400/20",
};

const defaultRoleColor = "bg-muted text-muted-foreground border-border";

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");
    const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
    return (
        <div className={`${sz} rounded-full bg-gradient-to-br from-sky-400/20 to-violet-400/20 border border-white/10 flex items-center justify-center text-white font-semibold shrink-0`}>
            {initials || <User className="w-3.5 h-3.5" />}
        </div>
    );
}

function ContactCard({
    c, selected, onSelect, onEdit, onDelete, onPrepare,
}: {
    c: Contact;
    selected: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onPrepare: () => void;
}) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`bg-card border rounded-xl overflow-hidden transition-all duration-200 ${selected ? "border-sky-400/40 shadow-md shadow-sky-400/5" : "border-border hover:border-sky-400/25"
                }`}
        >
            <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={onSelect}>
                <Avatar name={c.name} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium leading-tight">{c.name}</p>
                    <p className="text-xs text-muted-foreground font-light truncate mt-0.5">
                        {c.last_interaction_summary
                            ? c.last_interaction_summary.slice(0, 70) + (c.last_interaction_summary.length > 70 ? "…" : "")
                            : "Sin resumen registrado"}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-display tracking-wider uppercase border ${roleColors[c.role] || defaultRoleColor}`}>
                        {c.role}
                    </span>
                    {selected ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
            </div>

            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-border/50 px-4 pb-4"
                    >
                        <p className="text-sm text-muted-foreground font-light whitespace-pre-wrap leading-relaxed mt-3">
                            {c.last_interaction_summary || "Sin resumen registrado aún."}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                            <button onClick={(e) => { e.stopPropagation(); onPrepare(); }} className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors">
                                <MessageSquare className="w-3.5 h-3.5" /> Preparar reunión con KAWA
                            </button>
                            <div className="flex items-center gap-3">
                                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                    <Pencil className="w-3 h-3" /> Editar
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-400 transition-colors">
                                    <Trash2 className="w-3 h-3" /> Eliminar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function DeleteConfirm({
    name, onConfirm, onCancel,
}: { name: string; onConfirm: () => void; onCancel: () => void }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-rose-400/10"><Trash2 className="w-5 h-5 text-rose-400" strokeWidth={1.5} /></div>
                    <div>
                        <h3 className="font-display font-semibold text-foreground">Eliminar contacto</h3>
                        <p className="text-sm text-muted-foreground mt-1">¿Eliminar a <span className="text-foreground font-medium">{name}</span> de tu red? Esta acción no se puede deshacer.</p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className="px-4 py-2 text-sm text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors font-medium">Eliminar</button>
                </div>
            </motion.div>
        </motion.div>
    );
}

const VaultContacts = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [meetings, setMeetings] = useState<CalendarEvent[]>([]);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [editContact, setEditContact] = useState<Contact | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
    const navigate = useNavigate();

    const fetchContacts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase.from("vault_context_people").select("id, name, role, last_interaction_summary, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
            if (error) throw error;
            setContacts(data || []);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const fetchUpcomingMeetings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from("vault_operator_calendar_events").select("*").eq("user_id", user.id).gte("start_time", new Date().toISOString()).order("start_time", { ascending: true }).limit(5);
            setMeetings(data || []);
        } catch { }
    };

    useEffect(() => {
        fetchContacts();
        fetchUpcomingMeetings();
    }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const { error } = await supabase.from("vault_context_people").delete().eq("id", deleteTarget.id);
            if (error) throw error;
            setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
            if (selected === deleteTarget.id) setSelected(null);
            toast.success(`${deleteTarget.name} eliminado de tu red`);
        } catch {
            toast.error("Error al eliminar el contacto");
        } finally {
            setDeleteTarget(null);
        }
    };

    const handlePrepare = (contact: Contact) => navigate(`/chat?context=meeting&contact=${encodeURIComponent(contact.name)}`);

    const filtered = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()) || (c.last_interaction_summary?.toLowerCase().includes(search.toLowerCase())));

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-sky-400/10"><Globe className="w-6 h-6 text-sky-400" strokeWidth={1.5} /></div>
                        <h1 className="text-3xl text-foreground">Red de Contactos</h1>
                    </div>
                    <p className="text-muted-foreground font-light">{contacts.length > 0 ? `${contacts.length} contacto${contacts.length !== 1 ? "s" : ""} en tu red · KAWA los recuerda en cada conversación` : "Tus conexiones clave · Personas · Networking"}</p>
                </div>
                <AddPersonDialog onPersonAdded={fetchContacts}>
                    <Button className="gap-2 bg-sky-500 hover:bg-sky-600"><UserPlus className="w-4 h-4" /> Agregar Persona</Button>
                </AddPersonDialog>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        <input type="text" placeholder="Buscar por nombre, rol o contexto..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-card border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-sky-400/40 transition-colors font-light" />
                        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
                    </div>
                    {search && <p className="text-xs text-muted-foreground px-1">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "{search}"</p>}
                    {loading ? (
                        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-border rounded-xl space-y-3">
                            {search ? (
                                <><Search className="w-8 h-8 text-muted-foreground/30 mx-auto" /><p className="text-muted-foreground text-sm">Sin resultados para "{search}"</p><button onClick={() => setSearch("")} className="text-xs text-sky-400 hover:underline">Limpiar búsqueda</button></>
                            ) : (
                                <><UserPlus className="w-8 h-8 text-muted-foreground/30 mx-auto" strokeWidth={1} /><p className="text-muted-foreground text-sm font-light">Tu red está vacía.</p><p className="text-xs text-muted-foreground/50 max-w-xs mx-auto">Añade personas clave — inversores, clientes, mentores — y KAWA las recordará cuando hablen de reuniones o contexto.</p></>
                            )}
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filtered.map((c) => (
                                <ContactCard key={c.id} c={c} selected={selected === c.id} onSelect={() => setSelected(selected === c.id ? null : c.id)} onEdit={() => { setEditContact(c); setEditOpen(true); }} onDelete={() => setDeleteTarget(c)} onPrepare={() => handlePrepare(c)} />
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-card border border-border rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4"><Calendar className="w-4 h-4 text-sky-400" strokeWidth={1.5} /><h2 className="font-display text-foreground text-sm tracking-wider uppercase">Próximas Reuniones</h2></div>
                        <div className="space-y-2.5">
                            {meetings.length === 0 ? (
                                <div className="text-center py-4 space-y-1"><Calendar className="w-6 h-6 text-muted-foreground/20 mx-auto" /><p className="text-xs text-muted-foreground">Sin reuniones próximas.</p></div>
                            ) : (
                                meetings.map((meeting) => (
                                    <div key={meeting.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/40 hover:border-sky-400/20 transition-colors">
                                        <Clock className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" strokeWidth={1.5} />
                                        <div className="min-w-0">
                                            <p className="text-xs text-foreground font-light truncate">{meeting.event_title}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(meeting.start_time).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} {" · "} {new Date(meeting.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3"><MessageSquare className="w-4 h-4 text-sky-400" strokeWidth={1.5} /><h2 className="font-display text-foreground text-sm tracking-wider uppercase">Preparar Reunión</h2></div>
                        <p className="text-xs text-muted-foreground font-light leading-relaxed mb-4">Abre un contacto y pulsa "Preparar reunión" — KAWA generará un briefing con el contexto de esa persona.</p>
                        <button onClick={() => navigate("/chat")} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-sky-400/5 border border-sky-400/20 text-xs text-sky-400 hover:bg-sky-400/10 transition-colors group">
                            <span>Hablar con KAWA sobre mi red</span><ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>

                    {contacts.length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h2 className="font-display text-foreground text-xs tracking-wider uppercase text-muted-foreground mb-3">Distribución por Rol</h2>
                            <div className="space-y-1.5">
                                {Object.entries(
                                    contacts.reduce((acc, c) => { acc[c.role] = (acc[c.role] || 0) + 1; return acc; }, {} as Record<string, number>)
                                ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([role, count]) => (
                                    <div key={role} className="flex items-center gap-2">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${roleColors[role] || defaultRoleColor}`}>{role}</span>
                                        <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                                            <div className="h-full bg-sky-400/40 rounded-full" style={{ width: `${(count / contacts.length) * 100}%` }} />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground w-3 text-right">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <EditPersonDialog contact={editContact} open={editOpen} onOpenChange={setEditOpen} onPersonUpdated={() => { fetchContacts(); setSelected(null); }} />

            {deleteTarget && <DeleteConfirm name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
        </div>
    );
};

export default VaultContacts;
