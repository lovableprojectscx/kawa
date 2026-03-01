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

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { count, error } = await supabase
            .from("vault_founder_energy")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("checkin_date", today.toISOString())
            .lt("checkin_date", tomorrow.toISOString());

        if (error) {
            console.error("Error checking daily log:", error);
            return;
        }

        // No mostrar si el usuario es nuevo (OnboardingWizard ya lo maneja)
        const { data: visionData } = await supabase
            .from("vault_vision")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (!visionData) {
            setChecked(true);
            return;
        }

        if (count === 0) {
            const hour = new Date().getHours();
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
