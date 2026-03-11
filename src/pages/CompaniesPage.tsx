import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
    Building2, Plus, Target, Rocket, ShieldAlert,
    ChevronRight, Briefcase, Eye, Edit2, Trash2,
    TrendingUp, Search, Loader2
} from "lucide-react";
import { CreateCompanyDialog } from "@/components/operator/CreateCompanyDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Company {
    id: string;
    name: string;
    vision: string;
    mision: string;
    anti_goals: string[];
    color: string;
}

interface Project {
    id: string;
    company_id: string;
}

const CompaniesPage = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [comps, projs] = await Promise.all([
                supabase.from("vault_companies").select("*").eq("user_id", user.id).order("name"),
                supabase.from("vault_operator_projects").select("id, company_id").eq("user_id", user.id)
            ]);

            setCompanies(comps.data || []);
            setProjects(projs.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Error al cargar empresas");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar la empresa "${name}"? Los proyectos vinculados quedarán sin empresa.`)) return;

        try {
            const { error } = await supabase.from("vault_companies").delete().eq("id", id);
            if (error) throw error;
            toast.success("Empresa eliminada");
            fetchData();
        } catch (err) {
            toast.error("Error al eliminar");
        }
    };

    const filtered = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getProjectCount = (compId: string) => projects.filter(p => p.company_id === compId).length;

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-primary" />
                        Mis Empresas
                    </h1>
                    <p className="text-muted-foreground font-light max-w-lg leading-relaxed">
                        Define la visión y misión estratégica de cada unidad de negocio.
                    </p>
                </div>

                <CreateCompanyDialog onCompanyCreated={fetchData}>
                    <Button className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 transition-all">
                        <Plus className="w-5 h-5" /> Nueva Empresa
                    </Button>
                </CreateCompanyDialog>
            </div>

            {/* Stats / Intro */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-card/50 border border-border/50 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-foreground">{companies.length}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Total Empresas</div>
                    </div>
                </div>
                <div className="bg-card/50 border border-border/50 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-foreground">{projects.length}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Proyectos Totales</div>
                    </div>
                </div>
                <div className="relative group overflow-hidden bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-4">
                    <Target className="absolute -right-2 -bottom-2 w-20 h-20 text-primary opacity-[0.03] group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-foreground leading-tight">Clarity Engine</div>
                            <p className="text-[10px] text-muted-foreground">Visión alineada por empresa</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Control Bar */}
            <div className="flex items-center gap-4 mb-8 bg-card/30 border border-border/40 rounded-2xl p-2 pl-4">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar empresa..."
                    className="border-none bg-transparent focus-visible:ring-0 text-sm h-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground italic">Cargando empresas...</p>
                </div>
            ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filtered.map((company, i) => (
                            <motion.div
                                key={company.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group relative bg-card/60 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden hover:border-white/[0.12] hover:shadow-2xl hover:shadow-black/40 transition-all duration-300"
                            >
                                {/* Accent top bar */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-1.5 opacity-80"
                                    style={{ backgroundColor: company.color }}
                                />

                                <div className="p-6">
                                    {/* Title & Badge */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                                                style={{ backgroundColor: company.color }}
                                            >
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{company.name}</h3>
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">
                                                    <Briefcase className="w-2.5 h-2.5" />
                                                    {getProjectCount(company.id)} Proyectos
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <CreateCompanyDialog onCompanyCreated={fetchData} editingCompany={company}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/5">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </CreateCompanyDialog>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(company.id, company.name)}
                                                className="h-8 w-8 rounded-full hover:bg-rose-500/10 hover:text-rose-400"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Vision & Mission */}
                                    <div className="space-y-4 mb-6">
                                        <div className="relative pl-6">
                                            <div className="absolute left-0 top-1 text-primary/40"><Target className="w-4 h-4" /></div>
                                            <h4 className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Visión</h4>
                                            <p className="text-xs text-foreground/90 font-light line-clamp-2 leading-relaxed italic">
                                                "{company.vision || "Sin visión definida..."}"
                                            </p>
                                        </div>
                                        <div className="relative pl-6">
                                            <div className="absolute left-0 top-1 text-emerald-400/40"><Rocket className="w-4 h-4" /></div>
                                            <h4 className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Misión</h4>
                                            <p className="text-xs text-foreground/90 font-light line-clamp-2 leading-relaxed">
                                                {company.mision || "Sin misión definida..."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Limits */}
                                    {company.anti_goals && company.anti_goals.length > 0 && (
                                        <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 mb-2">
                                            <div className="flex items-center gap-1.5 mb-2 text-rose-400/80">
                                                <ShieldAlert className="w-3 h-3" />
                                                <span className="text-[9px] font-bold uppercase tracking-widest">Límites Estratégicos</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {company.anti_goals.slice(0, 3).map((g, idx) => (
                                                    <span key={idx} className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-muted-foreground">
                                                        {g}
                                                    </span>
                                                ))}
                                                {company.anti_goals.length > 3 && (
                                                    <span className="text-[9px] text-muted-foreground font-mono">+{company.anti_goals.length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-2 border-dashed border-border/50 rounded-3xl bg-card/20 group">
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                        <Building2 className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Comienza la estructura</h3>
                    <p className="text-muted-foreground max-w-sm mb-8 font-light leading-relaxed">
                        Aún no tienes empresas registradas. Crea tu primera empresa para organizar tus proyectos y alinearlos con una visión clara.
                    </p>
                    <CreateCompanyDialog onCompanyCreated={fetchData}>
                        <Button className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 gap-3 text-lg font-semibold">
                            <Plus className="w-6 h-6" /> Crear Primera Empresa
                        </Button>
                    </CreateCompanyDialog>
                </div>
            )}
        </div>
    );
};

export default CompaniesPage;
