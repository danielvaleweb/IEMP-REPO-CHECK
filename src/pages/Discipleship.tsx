import { Users, BookOpen, Heart, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Discipleship() {
  return (
    <div className="pt-24 pb-12 px-4 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 gradient-text">Discipulado</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Caminhando juntos na fé. O discipulado é o processo de se tornar cada vez mais 
            parecido com Jesus através do ensino e da comunhão.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Por que fazer o discipulado?</h2>
            <div className="space-y-4">
              {[
                "Crescimento espiritual sólido fundamentado na Bíblia.",
                "Integração com a família da fé.",
                "Descoberta de dons e talentos ministeriais.",
                "Preparação para o batismo e vida cristã ativa."
              ].map((item, i) => (
                <div key={`discipleship-reason-${i}`} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary shrink-0" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
            <Button size="lg" className="bg-primary hover:bg-primary/80 text-white rounded-full px-10">
              Quero me inscrever
            </Button>
          </div>
          <div className="rounded-[3rem] overflow-hidden shadow-2xl border border-black/5 aspect-square">
            <img 
              src="https://picsum.photos/seed/discipleship/800/800" 
              alt="Discipulado" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="glass-panel border-black/5 p-8 text-center">
            <BookOpen className="w-12 h-12 text-primary mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-2">Ensino Bíblico</h3>
            <p className="text-sm text-muted-foreground">Aulas semanais com foco nas doutrinas fundamentais.</p>
          </Card>
          <Card className="glass-panel border-black/5 p-8 text-center">
            <Users className="w-12 h-12 text-secondary mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-2">Comunhão</h3>
            <p className="text-sm text-muted-foreground">Grupos pequenos para partilha e oração mútua.</p>
          </Card>
          <Card className="glass-panel border-black/5 p-8 text-center">
            <Heart className="w-12 h-12 text-primary mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-2">Acompanhamento</h3>
            <p className="text-sm text-muted-foreground">Mentoria individual com irmãos mais experientes.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
