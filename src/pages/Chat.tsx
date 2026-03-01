import { motion } from "framer-motion";
import { MessageSquare, ArrowUp, Bot, User, Loader2, Bookmark, BookmarkCheck, Trash2, Mic, MicOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { chatService } from "@/lib/chatService";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { role: "user" | "assistant"; text: string; vault?: string; saved?: boolean };

const INITIAL_MESSAGE: Message = { role: "assistant", text: "Hola, soy KAWA. Tu agente orquestador. Tengo acceso a tus Bóvedas (Visión y Operador) para ayudarte a ejecutar tu estrategia. ¿En qué trabajamos hoy?" };
const initialMessages: Message[] = [INITIAL_MESSAGE];

const suggestions = [
  "¿Qué proyectos tengo activos?",
  "¿Cuáles son mis anti-goals?",
  "Ayúdame a priorizar mis tareas",
  "Revisa si mi último proyecto se alinea con mi North Star",
];

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const loadHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const saved = localStorage.getItem(`kawa_chat_${user.id}`);
      if (saved) {
        try {
          const parsed: Message[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 1) {
            setMessages(parsed.map(m => ({ ...m, saved: false })));
          }
        } catch { /* ignore malformed data */ }
      }
    };
    loadHistory();
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (!userId || messages.length <= 1) return;
    localStorage.setItem(`kawa_chat_${userId}`, JSON.stringify(messages));
  }, [messages, userId]);

  const handleClearChat = () => {
    if (!userId) return;
    localStorage.removeItem(`kawa_chat_${userId}`);
    setMessages([INITIAL_MESSAGE]);
    chatService.clearHistory?.();
    toast.success("Conversación borrada");
  };

  const handleSaveInsight = async (content: string, index: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('vault_insights').insert({
        user_id: user.id,
        content: content,
        category: 'Estratégico'
      });

      if (error) throw error;

      toast.success("Insight guardado en tu Bitácora");

      // Mark as saved locally for UI feedback (optional but nice)
      setMessages(prev => prev.map((msg, i) => i === index ? { ...msg, saved: true } : msg));
    } catch (error) {
      console.error("Error saving insight:", error);
      toast.error("Error al guardar el insight");
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e.error !== "no-speech" && e.error !== "aborted") {
        toast.error("Error al escuchar: " + e.error);
      }
    };
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      // Auto-enviar tras reconocimiento
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "user", text: transcript }]);
        setLoading(true);
        chatService.sendMessage(transcript, messages).then((responseText) => {
          setMessages((prev) => [...prev, { role: "assistant", text: responseText, vault: "Orquestador" }]);
        }).catch(() => {
          toast.error("Error al conectar con KAWA");
        }).finally(() => {
          setLoading(false);
          setInput("");
        });
      }, 100);
    };

    recognition.start();
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      // Call Gemini via ChatService
      const responseText = await chatService.sendMessage(userMessage, messages);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: responseText,
          vault: "Orquestador" // For now, generic vault
        },
      ]);
    } catch (error) {
      toast.error("Error al conectar con KAWA");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <MessageSquare className="w-5 h-5 text-primary" strokeWidth={1.5} />
        <span className="font-display text-foreground font-semibold tracking-wide">KAWA Agent</span>
        <span className="flex items-center gap-1.5 ml-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-muted-foreground">Conectado (Gemini 2.5)</span>
        </span>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-primary/70 font-display tracking-wider hidden md:block uppercase bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
            Contexto: Full-System (4 Bóvedas)
          </span>
          {messages.length > 1 && (
            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Borrar conversación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-1 border border-white/5 ${msg.role === "user" ? "bg-primary/20" : "bg-muted"
                }`}>
                {msg.role === "user" ? (
                  <User className="w-4 h-4 text-primary" strokeWidth={1.5} />
                ) : (
                  <Bot className="w-4 h-4 text-foreground" strokeWidth={1.5} />
                )}
              </div>
              <div>
                {msg.vault && (
                  <span className="text-[10px] text-primary font-display tracking-wider uppercase mb-1 block ml-1">
                    {msg.vault}
                  </span>
                )}
                <div
                  className={`px-5 py-3.5 rounded-2xl text-sm font-light leading-relaxed shadow-sm ${msg.role === "user"
                    ? "bg-primary/10 text-foreground border border-primary/20 rounded-tr-sm"
                    : "bg-card text-foreground/90 border border-border rounded-tl-sm"
                    }`}
                >
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800/50 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg prose-ul:my-2 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                      {msg.role === "assistant" && (
                        <div className="mt-3 pt-3 border-t border-border/40 flex justify-end">
                          <button
                            onClick={() => handleSaveInsight(msg.text, i)}
                            disabled={msg.saved}
                            className={`flex items-center gap-1.5 text-[10px] font-display tracking-wider uppercase transition-colors ${msg.saved ? "text-emerald-400" : "text-muted-foreground hover:text-primary"}`}
                          >
                            {msg.saved ? (
                              <>
                                <BookmarkCheck className="w-3 h-3" />
                                Guardado
                              </>
                            ) : (
                              <>
                                <Bookmark className="w-3 h-3" />
                                Guardar en Bitácora
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 max-w-[75%]">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-1 bg-muted border border-white/5">
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" strokeWidth={1.5} />
              </div>
              <div className="bg-card px-5 py-4 rounded-2xl rounded-tl-sm border border-border">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-foreground/20 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-foreground/20 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-foreground/20 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />

        {/* Suggestions (show when few messages) */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap justify-center gap-2 pt-8 opacity-70">
            {suggestions.map((s, i) => (
              <button
                key={i}
                disabled={loading}
                onClick={() => {
                  setMessages((prev) => [...prev, { role: "user", text: s }]);
                  setLoading(true);
                  chatService.sendMessage(s, messages).then((responseText) => {
                    setMessages((prev) => [...prev, { role: "assistant", text: responseText, vault: "Orquestador" }]);
                  }).catch(() => {
                    toast.error("Error al conectar con KAWA");
                  }).finally(() => setLoading(false));
                }}
                className="text-xs px-4 py-2 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all font-light disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-lg">
          <input
            type="text"
            placeholder={isListening ? "Escuchando..." : loading ? "KAWA está pensando..." : "Escribe o habla tu consulta..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading || isListening}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-light"
          />
          <button
            onClick={toggleListening}
            disabled={loading}
            title={isListening ? "Detener escucha" : "Hablar con KAWA"}
            className={`p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isListening
                ? "text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 animate-pulse"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" strokeWidth={2} /> : <Mic className="w-4 h-4" strokeWidth={2} />}
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || isListening}
            className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <ArrowUp className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/40 mt-3 font-mono">
          KAWA v1.0 • Powered by Gemini AI
        </p>
      </div>
    </div>
  );
};

export default Chat;
