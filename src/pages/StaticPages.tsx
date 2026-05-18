import { useParams } from "react-router-dom";
import { Shield, FileText, Mail, Lock, Youtube, Instagram, MessageCircle } from "lucide-react";
import ConstructionView from "@/components/ConstructionView";

export default function StaticPages() {
  const { page } = useParams();
  
  if (page === "oracao" || page === "contato") {
    const titles: Record<string, string> = {
      oracao: "Pedidos de Oração",
      contato: "Contato"
    };
    return (
      <div className="pt-24 min-h-screen bg-background">
        <ConstructionView title={titles[page] || "Em Construção"} />
      </div>
    );
  }

  const content: Record<string, any> = {
    estatuto: {
      title: "Estatuto da Igreja",
      icon: Shield,
      text: "O estatuto do Ministério Profecia define nossas diretrizes administrativas, direitos e deveres dos membros, e nossa estrutura organizacional. Este documento é público e pode ser consultado por qualquer membro em nossa secretaria física."
    },
    imprensa: {
      title: "Assessoria de Imprensa",
      icon: FileText,
      text: "Para solicitações de entrevistas, materiais de divulgação ou informações oficiais sobre a igreja, entre em contato com nosso departamento de comunicação pelos canais abaixo:"
    },
    "fale-conosco": {
      title: "Fale Conosco",
      icon: Mail,
      text: "Estamos aqui para ouvir você. Seja para tirar dúvidas, pedir oração ou enviar sugestões, use nossos canais oficiais de comunicação:"
    },
    privacidade: {
      title: "Aviso de Privacidade",
      icon: Lock,
      text: "Respeitamos a sua privacidade e a proteção dos seus dados pessoais. Todas as informações coletadas em nosso site são tratadas com sigilo e utilizadas apenas para os fins específicos de comunicação da igreja."
    }
  };

  const info = content[page || ""] || content.privacidade;
  const Icon = info.icon;

  return (
    <div className="pt-32 pb-24 px-4 min-h-screen">
      <div className="max-w-3xl mx-auto glass-panel p-12 rounded-[3rem] border-black/5 bg-white shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#BF76FF]/10 flex items-center justify-center text-[#BF76FF]">
            <Icon className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-900">{info.title}</h1>
        </div>
        
        {page === "imprensa" || page === "fale-conosco" ? (
          <div className="space-y-12 text-center flex flex-col items-center">
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              {info.text}
            </p>

            {page === "fale-conosco" ? (
              /* Fale Conosco Buttons Layout */
              <div className="flex flex-col sm:flex-row items-center justify-center gap-12 py-6 w-full">
                {/* WhatsApp Option */}
                <div className="flex flex-col items-center gap-4 text-center group">
                  <a
                    href="https://wa.me/5532999194640?text=Ol%C3%A1%21%20Gostaria%20de%20falar%20com%20o%20Minist%C3%A9rio%20Profecia."
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Falar no WhatsApp"
                    className="w-16 h-16 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 hover:border-[#25D366]/40 text-[#25D366] flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#25D366] hover:text-white"
                  >
                    <MessageCircle className="w-7 h-7 fill-current" />
                  </a>
                  <span className="text-sm font-bold text-neutral-600 group-hover:text-[#25D366] transition-colors max-w-[220px] leading-snug">
                    Envie uma mensagem no WhatsApp
                  </span>
                </div>

                {/* Email Option */}
                <div className="flex flex-col items-center gap-4 text-center group">
                  <a
                    href="mailto:contato@ministerioprofecia.com.br"
                    title="Enviar E-mail"
                    className="w-16 h-16 rounded-full bg-[#BF76FF]/10 border border-[#BF76FF]/20 hover:border-[#BF76FF]/40 text-[#BF76FF] flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#BF76FF] hover:text-white"
                  >
                    <Mail className="w-7 h-7" />
                  </a>
                  <span className="text-sm font-bold text-neutral-600 group-hover:text-[#BF76FF] transition-colors max-w-[220px] leading-snug">
                    Mande um e-mail para nossa equipe de suporte
                  </span>
                </div>
              </div>
            ) : (
              /* Imprensa Buttons Layout (4 Buttons) */
              <div className="flex flex-wrap items-center justify-center gap-6 py-6 w-full">
                {/* WhatsApp Button */}
                <a
                  href="https://wa.me/5532999194640?text=Solicita%C3%A7%C3%B5es%20de%20entrevistas%2C%20materiais%20de%20divulga%C3%A7%C3%A3o%20ou%20informa%C3%A7%C3%B5es%20oficiais%20sobre%20a%20igreja."
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Falar no WhatsApp"
                  className="w-16 h-16 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 hover:border-[#25D366]/40 text-[#25D366] flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#25D366] hover:text-white"
                >
                  <MessageCircle className="w-7 h-7 fill-current" />
                </a>

                {/* Email Button */}
                <a
                  href="mailto:contato@ministerioprofecia.com.br"
                  title="Enviar E-mail"
                  className="w-16 h-16 rounded-full bg-[#BF76FF]/10 border border-[#BF76FF]/20 hover:border-[#BF76FF]/40 text-[#BF76FF] flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#BF76FF] hover:text-white"
                >
                  <Mail className="w-7 h-7" />
                </a>

                {/* YouTube Button */}
                <a
                  href="https://www.youtube.com/@ministerioprofecia"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Nosso YouTube"
                  className="w-16 h-16 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/20 hover:border-[#FF0000]/40 text-[#FF0000] flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#FF0000] hover:text-white"
                >
                  <Youtube className="w-7 h-7" />
                </a>

                {/* Instagram Button */}
                <a
                  href="https://www.instagram.com/ministerio_profecia"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Nosso Instagram"
                  className="w-16 h-16 rounded-full bg-[#E1306C]/10 border border-[#E1306C]/20 hover:border-[#E1306C]/40 text-[#E1306C] flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#E1306C] hover:text-white"
                >
                  <Instagram className="w-7 h-7" />
                </a>
              </div>
            )}

            {/* Email Label Hint */}
            <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest leading-relaxed opacity-70">
              E-mail: <span className="text-neutral-800 font-black">contato@ministerioprofecia.com.br</span> <br />
              WhatsApp: <span className="text-neutral-800 font-black">(32) 9 9919-4640</span>
            </div>

            <div className="w-full mt-8 p-8 bg-neutral-50 rounded-2xl border border-neutral-100 text-left">
              <h3 className="font-bold mb-2 text-neutral-900">Informações Adicionais</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Última atualização: Abril de 2026. <br />
                Para mais detalhes, visite nossa secretaria em horário comercial.
              </p>
            </div>
          </div>
        ) : (
          <div className="prose max-w-none">
            <p className="text-xl text-muted-foreground leading-relaxed">
              {info.text}
            </p>
            <div className="mt-12 p-8 bg-muted/50 rounded-2xl border border-black/5">
              <h3 className="font-bold mb-4">Informações Adicionais</h3>
              <p className="text-sm text-muted-foreground">
                Última atualização: Abril de 2026. <br />
                Para mais detalhes, visite nossa secretaria em horário comercial.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
