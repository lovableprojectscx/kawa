import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { EnergyCheckinDialog } from "@/components/founder/EnergyCheckinDialog";
import { toast } from "sonner";
import { Heart } from "lucide-react";

export const DailyCheckinManager = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        checkDailyLog();
    }, []);

    const checkDailyLog = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // No mostrar si el usuario es nuevo (OnboardingWizard ya lo maneja)
        const { data: onboardingData } = await supabase
            .from("vault_companies")
            .select("id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();

        if (!onboardingData) {
            setChecked(true);
            return;
        }

        // Obtener el último check-in
        const { data: lastEntry, error } = await supabase
            .from("vault_founder_energy")
            .select("checkin_date")
            .eq("user_id", user.id)
            .order("checkin_date", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Error checking daily log:", error);
            setChecked(true);
            return;
        }

        const now = new Date();
        const hoursSinceLast = lastEntry
            ? (now.getTime() - new Date(lastEntry.checkin_date).getTime()) / (1000 * 60 * 60)
            : Infinity;

        // Mostrar si no hay check-in hoy o pasaron más de 4 horas
        if (hoursSinceLast >= 4) {
            const hour = now.getHours();
            const greeting =
                hour < 12 ? "¿Cómo empezaste el día?"
                : hour < 18 ? "¿Cómo va tu energía esta tarde?"
                : "¿Cómo terminaste el día hoy?";

            setTimeout(() => {
                toast(greeting, {
                    icon: <Heart className="w-4 h-4 text-rose-400" />,
                    description: "Registra tu check-in para que KAWA ajuste sus sugerencias.",
                    duration: 12000,
                    action: {
                        label: "Hacer check-in",
                        onClick: () => setDialogOpen(true),
                    },
                });
            }, 2500);
        }

        setChecked(true);
    };

    if (!checked) return null;

    return (
        <EnergyCheckinDialog
            openProp={dialogOpen}
            onOpenChangeProp={setDialogOpen}
            onCheckinComplete={() => setDialogOpen(false)}
        >
            <span />
        </EnergyCheckinDialog>
    );
};
