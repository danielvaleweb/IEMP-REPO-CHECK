import { useParams } from "react-router-dom";
import { Users, Camera, Shield, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const DEPT_INFO: Record<string, any> = {
  secretaria: {
    title: "Secretaria",
    icon: Shield,
    color: "text-blue-400",
    description: "Responsável pela organização administrativa, registros e suporte aos membros.",
    image: "https://picsum.photos/seed/office/1200/800"
  },
  midia: {
    title: "Mídia",
    icon: Camera,
    color: "text-purple-400",
    description: "Responsável pela transmissão ao vivo, redes sociais, som e projeção.",
    image: "https://picsum.photos/seed/media/1200/800"
  },
  jovenil: {
    title: "Jovenil",
    icon: Users,
    color: "text-green-400",
    description: "Focado no crescimento espiritual, integração e eventos para a juventude.",
    image: "https://picsum.photos/seed/youth-dept/1200/800"
  }
};

export default function Departments() {
  const { dept } = useParams();
  const info = DEPT_INFO[dept || ""] || DEPT_INFO.secretaria;
  const Icon = info.icon;

  return (
    <div className="pt-24 pb-12 px-4 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
          <div className={`w-24 h-24 rounded-3xl bg-muted flex items-center justify-center ${info.color} shadow-2xl border border-black/5`}>
            <Icon className="w-12 h-12" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-bold mb-4">{info.title}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">{info.description}</p>
          </div>
        </div>

        <div className="rounded-[3rem] overflow-hidden mb-16 shadow-2xl border border-black/5 aspect-video">
          <img 
            src={info.image} 
            alt={info.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="glass-panel border-black/5 p-8">
            <h3 className="text-xl font-bold mb-4">Liderança</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">L</div>
              <div>
                <p className="font-bold">Líder do Depto</p>
                <p className="text-xs text-muted-foreground">Responsável Geral</p>
              </div>
            </div>
          </Card>
          <Card className="glass-panel border-black/5 p-8">
            <h3 className="text-xl font-bold mb-4">Horários</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Reuniões semanais todas as terças-feiras às 19:30 no salão principal.
            </p>
          </Card>
          <Card className="glass-panel border-black/5 p-8">
            <h3 className="text-xl font-bold mb-4">Como Participar</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Procure a liderança após os cultos ou entre em contato via WhatsApp.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
