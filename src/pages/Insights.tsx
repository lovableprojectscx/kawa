import { motion } from "framer-motion";
import { Bookmark, Calendar, Trash2, Search, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Insight {
    id: number;
    content: string;
    category: string;
    created_at: string;
}

const Insights = () => {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("vault_insights")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setInsights(data || []);
        } catch (error) {
            console.error("Error fetching insights:", error);
            toast.error("No se pudieron cargar los insights");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const { error } = await supabase.from("vault_insights").delete().eq("id", id);
            if (error) throw error;
            setInsights(prev => prev.filter(i => i.id !== id));
            toast.success("Insight eliminado");
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const filteredInsights = insights.filter(i =>
        i.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-md bg-primary/10">
                            <Bookmark className="w-6 h-6 text-primary" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-3xl text-foreground">Mis Insights</h1>
                    </div>
                    <p className="text-muted-foreground font-light">
                        Decisiones, aprendizajes y análisis guardados desde el chat.
                    </p>
                </div>

                <div className="relative group w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar en tus insights..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-card/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground animate-pulse">Consultando tus archivos...</p>
                </div>
            ) : filteredInsights.length === 0 ? (
                <div className="text-center py-32 bg-card/30 border border-dashed border-border rounded-3xl">
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-display font-medium mb-2">Tus insights están vacíos</h3>
                    <p className="text-muted-foreground text-sm font-light max-w-xs mx-auto">
                        Guarda respuestas valiosas directamente desde el chat para verlas aquí reflejadas.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredInsights.map((insight, idx) => (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group bg-card hover:bg-card/80 border border-border hover:border-primary/30 rounded-2xl p-6 transition-all shadow-sm hover:shadow-xl hover:shadow-primary/5 flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-display tracking-wider uppercase">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(insight.created_at).toLocaleDateString()}
                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">
                                        {insight.category}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(insight.id)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="prose prose-invert prose-sm max-w-none flex-grow">
                                <ReactMarkdown>{insight.content}</ReactMarkdown>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Insights;
