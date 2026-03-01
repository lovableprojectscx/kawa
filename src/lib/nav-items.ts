import {
  MessageSquare,
  LayoutDashboard,
  CalendarDays,
  Upload,
  Telescope,
  Settings,
  Heart,
  Globe,
  Bookmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

// Daily-use items in the fixed bottom bar
export const mainItems: NavItem[] = [
  { to: "/chat", icon: MessageSquare, label: "Chat IA" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/vault/operator", icon: Settings, label: "Proyectos" },
  { to: "/vault/founder", icon: Heart, label: "Bienestar" },
];

// Secondary items in the "Más" sheet
export const vaultItems: NavItem[] = [
  { to: "/vault/vision", icon: Telescope, label: "Estrategia" },
  { to: "/vault/context", icon: Globe, label: "Contactos" },
  { to: "/calendar", icon: CalendarDays, label: "Calendario" },
  { to: "/insights", icon: Bookmark, label: "Insights" },
  { to: "/upload", icon: Upload, label: "Subir Datos" },
];
