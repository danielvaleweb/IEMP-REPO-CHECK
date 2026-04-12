import { Link, useLocation } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  const location = useLocation();

  if (location.pathname === "/admin") {
    return null;
  }

  return (
    <footer className="bg-muted/30 border-t border-black/5 pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              P
            </div>
            <span className="font-bold text-xl gradient-text">Ministério Profecia</span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Levando a palavra de Deus e transformando vidas através do evangelho. 
            Nossa missão é ser luz no mundo e sal na terra.
          </p>
          <div className="flex gap-4 mt-2">
            <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://www.youtube.com/@ministerio_profecia" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-6 text-foreground uppercase tracking-widest text-sm">Links Rápidos</h4>
          <ul className="flex flex-col gap-3 text-muted-foreground text-sm">
            <li><Link to="/quem-somos" className="hover:text-primary transition-colors">Quem Somos</Link></li>
            <li><Link to="/biblia" className="hover:text-primary transition-colors">Bíblia Online</Link></li>
            <li><Link to="/discipulado" className="hover:text-primary transition-colors">Discipulado</Link></li>
            <li><Link to="/ebd" className="hover:text-primary transition-colors">Escola Bíblica</Link></li>
            <li><Link to="/galeria" className="hover:text-primary transition-colors">Galeria de Fotos</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6 text-foreground uppercase tracking-widest text-sm">Contato</h4>
          <ul className="flex flex-col gap-4 text-muted-foreground text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <span>Rua da Igreja, 123 - Centro, Cidade - UF</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary shrink-0" />
              <span>(00) 0000-0000</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary shrink-0" />
              <span>contato@ministerioprofecia.com.br</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6 text-foreground uppercase tracking-widest text-sm">Legal</h4>
          <ul className="flex flex-col gap-3 text-muted-foreground text-sm">
            <li><Link to="/estatuto" className="hover:text-primary transition-colors">Estatuto</Link></li>
            <li><Link to="/imprensa" className="hover:text-primary transition-colors">Imprensa</Link></li>
            <li><Link to="/fale-conosco" className="hover:text-primary transition-colors">Fale Conosco</Link></li>
            <li><Link to="/privacidade" className="hover:text-primary transition-colors">Aviso de Privacidade</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Igreja Ministério Profecia. Todos os direitos reservados.</p>
        <p>Desenvolvido com ❤️ para a obra de Deus.</p>
      </div>
    </footer>
  );
}
