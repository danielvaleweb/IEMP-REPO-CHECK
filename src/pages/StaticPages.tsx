import { useParams } from "react-router-dom";
import { Shield, FileText, Mail, Lock } from "lucide-react";

export default function StaticPages() {
  const { page } = useParams();
  
  const content: Record<string, any> = {
    estatuto: {
      title: "Estatuto da Igreja",
      icon: Shield,
      text: "O estatuto da Igreja Ministério Profecia define nossas diretrizes administrativas, direitos e deveres dos membros, e nossa estrutura organizacional. Este documento é público e pode ser consultado por qualquer membro em nossa secretaria física."
    },
    imprensa: {
      title: "Assessoria de Imprensa",
      icon: FileText,
      text: "Para solicitações de entrevistas, materiais de divulgação ou informações oficiais sobre a igreja, entre em contato com nosso departamento de comunicação através do e-mail midia@ministerioprofecia.com.br."
    },
    "fale-conosco": {
      title: "Fale Conosco",
      icon: Mail,
      text: "Estamos aqui para ouvir você. Seja para tirar dúvidas, pedir oração ou dar sugestões, use nossos canais oficiais. WhatsApp: (00) 00000-0000 | E-mail: contato@ministerioprofecia.com.br"
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
      <div className="max-w-3xl mx-auto glass-panel p-12 rounded-[3rem] border-black/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
            <Icon className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold">{info.title}</h1>
        </div>
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
      </div>
    </div>
  );
}
