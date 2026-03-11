import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Loader2, Lock, Eye, EyeOff, User } from "lucide-react";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState("");
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        },
                    },
                });
                if (error) throw error;

                if (data.session) {
                    toast.success("¡Registro exitoso! Bienvenido.");
                    navigate("/dashboard");
                } else {
                    toast.success("Registro creado. (Nota: Si tienes confirmación de email activada en Supabase, revisa tu correo).");
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                if (data.session) {
                    toast.success("¡Bienvenido de nuevo!");
                    navigate("/dashboard");
                }
            }
        } catch (error: any) {
            console.error("Auth error:", error);
            toast.error(error.message || "Error de autenticación");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-[80px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 w-full max-w-md space-y-8 bg-card/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl"
            >
                <div className="text-center space-y-4">
                    <img src="/kawa-logo.png" alt="KAWA" className="h-14 w-auto mx-auto mb-2" />
                    <p className="text-muted-foreground">{isSignUp ? "Crea tu cuenta" : "Ingresa a tu segunda mente"}</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    <div className="space-y-4">
                        {isSignUp && (
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Nombre Completo"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 h-12 bg-background/50 border-white/10 focus:border-primary transition-all"
                                    required={isSignUp}
                                />
                            </div>
                        )}
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 h-12 bg-background/50 border-white/10 focus:border-primary transition-all"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 pr-10 h-12 bg-background/50 border-white/10 focus:border-primary transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-lg font-medium neon-glow transition-all duration-300 transform hover:scale-[1.02]"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isSignUp ? "Registrarse" : "Iniciar Sesión")}
                        {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                    </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="underline hover:text-primary transition-colors"
                    >
                        {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
                    </button>
                    <p className="mt-4 text-xs">Al continuar, aceptas nuestros términos de servicio.</p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
