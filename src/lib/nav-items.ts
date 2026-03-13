import {
  MessageSquare,
  CalendarDays,
  Telescope,
  Heart,
  Globe,
  Briefcase,
  LayoutDashboard,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

// All nav pages
export const navItems: NavItem[] = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/chat", icon: MessageSquare, label: "Chat IA" },
  { to: "/vault/operator", icon: Briefcase, label: "Proyectos" },
  { to: "/calendar", icon: CalendarDays, label: "Calendario" },
  { to: "/vault/context", icon: Globe, label: "Contexto" },
  { to: "/vault/companies", icon: Building2, label: "Empresas" },
];

// Keep legacy exports so existing imports don't break
export const mainItems = navItems.slice(0, 4);
export const vaultItems = navItems.slice(4);
