import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Trash2, Mic, MicOff, Users, Menu, X, Plus, MessageSquare, SearchCheck, BrainCircuit, CheckCheck, XCircle, Calendar, UserPlus, Brain } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { chatService, confirmAndSave } from "@/lib/chatService";
import type { ExtractedData } from "@/lib/chatService";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { id?: string; role: "user" | "assistant"; text: string };
type ChatSession = { id: string; title: string; updated_at: string };

type ChatMode = 'consultant' | 'interviewer';

const MODE_CONFIG: Record<ChatMode, { label: string; icon: React.ElementType; hint: string; color: string }> = {
  consultant: {
    label: 'Consultor',
    icon: BrainCircuit,
    hint: 'Modo estratégico: consejos directos y planes de acción.',
    color: 'text-primary',
  },
  interviewer: {
    label: 'Explorador',
    icon: SearchCheck,
    hint: 'Modo recolección: KAWA hace preguntas para conocerte mejor.',
    color: 'text-amber-400',
  },
};

const INITIAL_MESSAGE_BY_MODE: Record<ChatMode, string> = {
  consultant: 'Hola, soy KAWA. Conozco tu estrategia, proyectos y contexto. ¿En qué trabajamos hoy?',
  interviewer: 'Hola, estoy en modo **Explorador**. Voy a hacerte preguntas clave para entender mejor tu situación y construir un contexto más rico. ¿Empezamos? Cuéntame: ¿Qué estás trabajando últimamente y cuál es tu mayor desafío esta semana?',
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  text: INITIAL_MESSAGE_BY_MODE.consultant,
};

const SUGGESTIONS: Record<ChatMode, string[]> = {
  consultant: [
    "¿Qué proyectos tengo activos?",
    "Ayúdame a priorizar mis tareas de hoy",
    "¿Mis proyectos se alinean con mi Foco?",
    "Dame un resumen de mi situación",
  ],
  interviewer: [
    "Cuéntame sobre tu empresa principal",
    "¿Cómo fue tu semana?  Descóngela conmigo",
    "¿Qué proyectos estás desarrollando?",
    "¿Cuál es tu mayor desafío ahora mismo?",
  ],
};

const Chat = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userCompanies, setUserCompanies] = useState<any[]>([]);

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('consultant');
  const [pendingExtraction, setPendingExtraction] = useState<ExtractedData | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [meetingContact, setMeetingContact] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile primarily, or togglable on desktop

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Load sessions and companies
      const [existingSessions, { data: companiesData }] = await Promise.all([
        chatService.getSessions(user.id),
        supabase.from("vault_companies").select("*").eq("user_id", user.id)
      ]);
      setSessions(existingSessions || []);
      setUserCompanies(companiesData || []);

      // Check context from URL for preloaded queries
      const contextType = searchParams.get("context");
      const contactName = searchParams.get("contact");

      if (contextType === "meeting" && contactName) {
        setMeetingContact(contactName);
        const prompt = `Prepárame para mi próxima reunión con ${contactName}. Dame: 1) lo que recuerdas de esta persona, 2) temas pendientes, y 3) qué proponer en la reunión.`;
        handleSystemPrompt(prompt, user.id);
        return;
      }

      // Automatically load the latest session if available
      if (existingSessions && existingSessions.length > 0 && !contextType) {
        loadSession(existingSessions[0].id);
      }
    };
    init();
  }, []);

  const loadSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setLoading(true);
    const dbMsgs = await chatService.getSessionMessages(sessionId);
    if (dbMsgs && dbMsgs.length > 0) {
      setMessages(dbMsgs.map((m: any) => ({ role: m.role, text: m.content })));
    } else {
      setMessages([INITIAL_MESSAGE]);
    }
    setLoading(false);
    setSidebarOpen(false); // Close sidebar on mobile
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([INITIAL_MESSAGE]);
    setMeetingContact(null);
    setSidebarOpen(false);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const success = await chatService.deleteSession(sessionId);
    if (success) {
      toast.success("Chat borrado");
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
    } else {
      toast.error("Error al borrar el chat");
    }
  };

  const handleSystemPrompt = async (prompt: string, uid: string) => {
    setMessages([INITIAL_MESSAGE, { role: "user", text: prompt }]);
    setLoading(true);
    let sid = await createAutoSession(uid, "Preparación de Reunión");
    try {
      if (sid) await chatService.saveMessage(sid, "user", prompt);
      const { reply, extraction } = await chatService.sendMessage(prompt, [INITIAL_MESSAGE], chatMode);
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
      if (sid) await chatService.saveMessage(sid, "assistant", reply);
      if (extraction) setPendingExtraction(extraction);
    } catch {
      toast.error("Error al preparar briefing");
    } finally {
      setLoading(false);
    }
  };

  const createAutoSession = async (uid: string, title?: string) => {
    const sessionTitle = title || "Nueva conversación";
    const newSession = await chatService.createSession(uid, sessionTitle);
    if (newSession) {
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      return newSession.id;
    }
    return null;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !userId || loading) return;

    let sid = currentSessionId;

    // Si no hay sesión, crear una nueva automáticamente
    if (!sid) {
      // Usar las primeras 30 letras del mensaje como título
      const title = text.length > 30 ? text.substring(0, 30) + "..." : text;
      sid = await createAutoSession(userId, title);
    }

    setMessages(prev => [...prev, { role: "user", text }]);

    if (sid) {
      // Guardar msj del usuario
      await chatService.saveMessage(sid, "user", text);
    }

    setLoading(true);
    try {
      // Enviar al LLM con el modo activo
      const { reply, extraction } = await chatService.sendMessage(text, messages, chatMode);
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
      if (sid) await chatService.saveMessage(sid, "assistant", reply);
      // Show confirmation card if Smart Router found something to save
      if (extraction) setPendingExtraction(extraction);
    } catch {
      toast.error("Error al conectar con KAWA");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    setInput("");
    sendMessage(text);
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Tu navegador no soporta voz. Usa Chrome o Edge.");
      return;
    }
    if (isListening) { recognitionRef.current?.stop(); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e.error !== "no-speech" && e.error !== "aborted") toast.error("Error al escuchar: " + e.error);
    };
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => { setInput(""); sendMessage(transcript); }, 100);
    };
    recognition.start();
  };

  return (
    <div className="flex h-screen md:h-[100dvh] bg-background">

      {/* ─── Sidebar de Historial ─── */}
      <AnimatePresence>
        {(sidebarOpen || (typeof window !== "undefined" && window.innerWidth >= 768)) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={`
              absolute md:relative z-30 h-full bg-card border-r border-border/50 shrink-0 shadow-2xl md:shadow-none
              flex flex-col transition-transform
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            `}
          >
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <button
                onClick={handleNewChat}
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" /> Nuevo Chat
              </button>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-2 p-2 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-2">Historial</p>
              {sessions.length === 0 ? (
                <p className="px-2 text-xs text-muted-foreground/50 italic">No hay conversaciones previas.</p>
              ) : (
                sessions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    className={`
                      group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors
                      ${currentSessionId === s.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}
                    `}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                      <span className="text-sm truncate">{s.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-500 transition-all rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Área Principal del Chat ─── */}
      <div className="flex-1 flex flex-col h-full bg-background min-w-0 relative">
        {/* Header con toggle de modo */}
        <div className="border-b border-border/50 px-3 md:px-4 flex items-center gap-2 md:gap-3 bg-background/80 backdrop-blur sticky top-0 z-20 h-14 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-display font-medium text-foreground text-sm tracking-tight">KAWA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          </div>

          {meetingContact && (
            <span className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground truncate max-w-[80px] sm:max-w-none">
              <Users className="w-3 h-3 md:w-3.5 md:h-3.5" /> {meetingContact}
            </span>
          )}

          {/* Mode Toggle */}
          <div className="ml-auto flex items-center gap-0.5 md:gap-1 bg-muted/40 rounded-xl p-0.5 md:p-1 border border-border/50">
            {(Object.keys(MODE_CONFIG) as ChatMode[]).map(mode => {
              const cfg = MODE_CONFIG[mode];
              const Icon = cfg.icon;
              const active = chatMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => {
                    setChatMode(mode);
                    if (!currentSessionId) {
                      setMessages([{ role: 'assistant', text: INITIAL_MESSAGE_BY_MODE[mode] }]);
                    }
                  }}
                  title={cfg.hint}
                  className={`flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${active
                    ? `bg-background border border-border shadow-sm ${cfg.color}`
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden xs:inline sm:inline">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-5 w-full mx-auto md:max-w-3xl">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} w-full`}
            >
              {msg.role === "user" ? (
                <div className="max-w-[85%] md:max-w-[70%] px-4 py-2.5 bg-primary/10 text-foreground text-sm font-light rounded-2xl rounded-tr-sm border border-primary/20 leading-relaxed shadow-sm">
                  {msg.text}
                </div>
              ) : (
                <div className="max-w-[100%] md:max-w-[90%] text-sm md:text-[15px] font-light leading-relaxed text-foreground/90 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-0.5 prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-3 overflow-x-hidden w-full">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
              )}
            </motion.div>
          ))}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex gap-1 py-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 pt-4">
              {SUGGESTIONS[chatMode].map((s: string, i: number) => (
                <button
                  key={i}
                  disabled={loading}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-4 py-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-border/60 transition-all disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* ─── Confirmation Card ─── */}
          <AnimatePresence>
            {pendingExtraction && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="flex justify-start"
              >
                <div className="max-w-[90%] w-full border border-primary/20 bg-primary/5 rounded-2xl p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    {pendingExtraction.type === 'event' && <Calendar className="w-4 h-4 text-sky-400" />}
                    {pendingExtraction.type === 'contact' && <UserPlus className="w-4 h-4 text-amber-400" />}
                    {pendingExtraction.type === 'memory' && <Brain className="w-4 h-4 text-violet-400" />}
                    {pendingExtraction.type === 'project' && <BrainCircuit className="w-4 h-4 text-emerald-400" />}
                    {pendingExtraction.type === 'task' && <CheckCheck className="w-4 h-4 text-emerald-400" />}
                    <p className="text-xs font-semibold text-foreground">
                      {pendingExtraction.type === 'event' && '📅 KAWA detectó un evento — revisa y guarda en el calendario'}
                      {pendingExtraction.type === 'contact' && '👤 KAWA detectó un contacto — revisa y guarda en tu red'}
                      {pendingExtraction.type === 'memory' && '🧠 KAWA detectó contexto importante — revisa y guarda en el Cerebro'}
                      {pendingExtraction.type === 'project' && '💼 KAWA detectó un nuevo proyecto — revisa y guarda'}
                      {pendingExtraction.type === 'task' && '✅ KAWA detectó una nueva tarea — revisa y guarda'}
                    </p>
                  </div>

                  {/* Fields preview */}
                  <div className="bg-background/60 rounded-xl p-3 space-y-1.5 border border-border/40">
                    {Object.entries(pendingExtraction.data)
                      .filter(([k, v]) => v && !['workspace', 'task_project_id', 'memory_type', 'event_type'].includes(k))
                      .map(([key, value]) => (
                        <div key={key} className="flex gap-2 text-xs">
                          <span className="text-muted-foreground font-medium min-w-[120px] shrink-0 pt-1">
                            {{
                              event_title: 'Título',
                              start_time: 'Inicio',
                              end_time: 'Fin',
                              event_type: 'Tipo de Evento',
                              description: 'Descripción',
                              name: 'Nombre',
                              role: 'Rol',
                              personal_facts: 'Datos personales',
                              personal_facts_text: 'Datos personales',
                              last_interaction_summary: 'Última interacción',
                              content: 'Contenido',
                              category: 'Categoría',
                              memory_date: 'Fecha',
                              memory_type: 'Tipo de Memoria',
                              project_name: 'Nombre del Proyecto',
                              project_description: 'Descripción',
                              project_deadline: 'Fecha Límite',
                              project_priority: 'Prioridad',
                              task_name: 'Nombre de la Tarea',
                              task_project_id: 'ID de Proyecto'
                            }[key] || key}:
                          </span>
                          <input
                            type="text"
                            value={value as string}
                            onChange={(e) => {
                              setPendingExtraction({
                                ...pendingExtraction,
                                data: {
                                  ...pendingExtraction.data,
                                  [key]: e.target.value
                                }
                              });
                            }}
                            className="text-foreground font-light leading-relaxed bg-transparent border-b border-border/30 focus:border-primary/50 outline-none w-full pb-1 placeholder:text-muted-foreground/30 transition-colors"
                            placeholder="Añadir valor..."
                          />
                        </div>
                      ))}
                    {pendingExtraction.workspace && pendingExtraction.workspace !== 'General' && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-muted-foreground font-medium min-w-[120px] shrink-0 pt-1">Empresa:</span>
                        <input
                          type="text"
                          value={pendingExtraction.workspace}
                          onChange={(e) => {
                            setPendingExtraction({
                              ...pendingExtraction,
                              workspace: e.target.value
                            });
                          }}
                          className="text-foreground font-light bg-transparent border-b border-border/30 focus:border-primary/50 outline-none w-full pb-1 transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  {/* Alignment badge */}
                  {pendingExtraction.alignment && (
                    <p className="text-[10px] text-muted-foreground/60 pl-1">
                      Alineado a tu Visión: {pendingExtraction.alignment.score}/5 · {pendingExtraction.alignment.reasoning?.slice(0, 80)}{(pendingExtraction.alignment.reasoning?.length ?? 0) > 80 ? '…' : ''}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={async () => {
                        const lastMsg = messages[messages.length - 1]?.text || "";
                        const ok = await confirmAndSave(pendingExtraction, lastMsg, userCompanies);
                        if (ok) setPendingExtraction(null);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Confirmar y guardar
                    </button>
                    <button
                      onClick={() => setPendingExtraction(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground text-xs hover:text-foreground hover:border-primary/30 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Descartar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Input area */}
        <div className="p-3 md:p-4 bg-background border-t border-border/10 md:border-transparent shrink-0">
          <div className="md:max-w-3xl mx-auto flex items-center gap-2 bg-card border border-border/60 rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/10 transition-all shadow-sm">
            <input
              type="text"
              placeholder={
                isListening ? "Escuchando..."
                  : loading ? "KAWA está pensando..."
                    : chatMode === 'interviewer' ? "Cuéntame algo..."
                      : "Pregúntale a KAWA..."
              }
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              disabled={loading || isListening}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-light"
            />
            <button
              onClick={toggleListening}
              disabled={loading}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 shrink-0 ${isListening ? "text-rose-400 animate-pulse bg-rose-400/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || isListening}
              className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 transition-colors shrink-0"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2 hidden md:block">
            {chatMode === 'interviewer'
              ? '🔍 Modo Explorador: KAWA está aprendiendo sobre tí para darte mejor contexto a futuro.'
              : 'KAWA usa contexto inteligente de tus proyectos, energía y contactos.'
            }
          </p>
        </div>

      </div>
    </div>
  );
};

export default Chat;
