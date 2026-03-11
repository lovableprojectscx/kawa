import { Link } from "react-router-dom";
import {
  Twitter,
  Github,
  Linkedin,
  Zap,
  Shield,
  Globe,
} from "lucide-react";

const footerLinks = {
  Producto: [
    { label: "Funciones", href: "/features" },
    { label: "Precios", href: "/pricing" },
    { label: "Changelog", href: "#" },
    { label: "Roadmap", href: "#" },
  ],
  Empresa: [
    { label: "Sobre nosotros", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Prensa", href: "#" },
    { label: "Carreras", href: "#" },
  ],
  Legal: [
    { label: "Privacidad", href: "#" },
    { label: "Términos", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

const socials = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#030303]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-8">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-rose-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-display font-black text-base leading-none">
                  K
                </span>
              </div>
              <span className="font-display font-bold text-white text-lg">
                KAWA
              </span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              El orquestador IA para fundadores que construyen el futuro sin
              perder su norte ni su bienestar.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.06] text-white/40 hover:text-white transition-all duration-200"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white/80 text-sm font-semibold mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-white/40 hover:text-white/80 text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.06]">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} KAWA. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-white/30 text-xs">
              <Shield className="w-3 h-3" />
              <span>SOC 2 Type II</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/30 text-xs">
              <Globe className="w-3 h-3" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/30 text-xs">
              <Zap className="w-3 h-3 text-primary/60" />
              <span>Powered by Gemini 2.5</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
