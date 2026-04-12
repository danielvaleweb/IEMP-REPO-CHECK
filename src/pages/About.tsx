import { Info, Target, Heart, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <div className="pt-24 pb-12 px-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 gradient-text">Quem Somos</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            A Igreja Ministério Profecia nasceu de um chamado ardente para levar a verdade do 
            evangelho a todas as nações, começando por nossa comunidade local.
          </p>
        </div>

        <div className="aspect-video rounded-[3rem] overflow-hidden mb-16 shadow-2xl border border-black/5">
          <img 
            src="https://picsum.photos/seed/church-about/1200/800" 
            alt="Nossa Igreja" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="glass-panel border-black/5 p-8">
            <Target className="w-12 h-12 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-4">Nossa Missão</h3>
            <p className="text-muted-foreground leading-relaxed">
              Pregar o evangelho de Jesus Cristo, discipular novos crentes e servir à 
              comunidade com amor e dedicação, manifestando o Reino de Deus na terra.
            </p>
          </Card>
          <Card className="glass-panel border-black/5 p-8">
            <Heart className="w-12 h-12 text-secondary mb-6" />
            <h3 className="text-2xl font-bold mb-4">Nossos Valores</h3>
            <p className="text-muted-foreground leading-relaxed">
              Fidelidade bíblica, adoração genuína, comunhão fraternal, integridade 
              e compromisso com a obra missionária e social.
            </p>
          </Card>
        </div>

        <div className="space-y-12">
          <h2 className="text-3xl font-bold text-center">Nossa História</h2>
          <div className="space-y-8 text-muted-foreground leading-relaxed text-lg">
            <p>
              Fundada em [Ano], a Igreja Ministério Profecia começou como um pequeno grupo de 
              oração em uma residência. Com o passar do tempo, Deus foi acrescentando pessoas 
              sedentas por sua palavra, e o que era um pequeno grupo se tornou uma comunidade vibrante.
            </p>
            <p>
              Hoje, somos centenas de irmãos unidos por um único propósito: exaltar o nome de Jesus. 
              Através de nossos diversos ministérios e departamentos, buscamos atender às necessidades 
              espirituais e sociais de todos que nos procuram.
            </p>
            <p>
              Acreditamos que o melhor de Deus ainda está por vir e convidamos você a fazer parte 
              desta história de fé e milagres.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
