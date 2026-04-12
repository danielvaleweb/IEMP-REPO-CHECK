import { BookOpen, GraduationCap, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EBD() {
  return (
    <div className="pt-24 pb-12 px-4 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 gradient-text">Escola Bíblica Dominical</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            O maior centro de ensino bíblico da nossa igreja. Venha aprender e crescer 
            no conhecimento da palavra de Deus todos os domingos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="md:col-span-2 space-y-8">
            <div className="rounded-[3rem] overflow-hidden shadow-2xl border border-black/5 aspect-video">
              <img 
                src="https://picsum.photos/seed/ebd/1200/800" 
                alt="EBD" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Nossas Classes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Crianças", age: "4 a 10 anos" },
                  { title: "Adolescentes", age: "11 a 14 anos" },
                  { title: "Jovens", age: "15 a 25 anos" },
                  { title: "Adultos", age: "Acima de 25 anos" }
                ].map((classe, i) => (
                  <Card key={i} className="glass-panel border-black/5 p-6">
                    <GraduationCap className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-bold text-lg">{classe.title}</h3>
                    <p className="text-sm text-muted-foreground">{classe.age}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="glass-panel border-black/5 p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Informações
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Horário</p>
                  <p className="font-medium">Todos os Domingos às 09:00</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Local</p>
                  <p className="font-medium">Salas do Anexo Educacional</p>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/80 text-white rounded-full">
                  Falar com o Diretor
                </Button>
              </div>
            </Card>

            <Card className="bg-primary/10 border-primary/20 p-8 rounded-3xl">
              <BookOpen className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Lição da Semana</h3>
              <p className="text-sm text-muted-foreground mb-4 italic">
                "A Importância da Oração na Vida do Cristão"
              </p>
              <Button variant="link" className="p-0 text-primary h-auto font-bold">
                Baixar material PDF →
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
