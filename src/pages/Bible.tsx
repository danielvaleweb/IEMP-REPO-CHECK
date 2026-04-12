import { Book, Search, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Bible() {
  return (
    <div className="pt-24 pb-12 px-4 min-h-screen gradient-bg">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Bíblia Online</h1>
            <p className="text-muted-foreground">Alimente-se da palavra de Deus todos os dias.</p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <Input placeholder="Pesquisar versículo ou tema..." className="bg-white border-black/10 rounded-full" />
            <Button size="icon" className="rounded-full bg-primary text-white shrink-0">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Books Sidebar */}
          <div className="md:col-span-1 glass-panel rounded-3xl p-6 border-black/5">
            <h3 className="font-bold mb-4 uppercase tracking-widest text-xs text-primary">Livros</h3>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-1">
                {["Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio", "Josué", "Juízes", "Rute"].map((book) => (
                  <button key={book} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors">
                    {book}
                  </button>
                ))}
                <div className="h-px bg-black/5 my-4" />
                {["Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos"].map((book) => (
                  <button key={book} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-secondary/10 hover:text-secondary transition-colors">
                    {book}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Reading Area */}
          <div className="md:col-span-3 glass-panel rounded-3xl p-8 md:p-12 border-black/5">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Gênesis 1</h2>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5">
                <Bookmark className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6 text-lg leading-relaxed text-foreground/90">
              <p><span className="text-primary font-bold mr-2">1</span> No princípio criou Deus o céu e a terra.</p>
              <p><span className="text-primary font-bold mr-2">2</span> E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o Espírito de Deus se movia sobre a face das águas.</p>
              <p><span className="text-primary font-bold mr-2">3</span> E disse Deus: Haja luz; e houve luz.</p>
              <p><span className="text-primary font-bold mr-2">4</span> E viu Deus que era boa a luz; e fez Deus separação entre a luz e as trevas.</p>
              <p><span className="text-primary font-bold mr-2">5</span> E Deus chamou à luz Dia; e às trevas chamou Noite. E foi a tarde e a manhã, o dia primeiro.</p>
            </div>

            <div className="mt-12 pt-8 border-t border-black/5 flex justify-between">
              <Button variant="outline" className="rounded-full border-black/10">Anterior</Button>
              <Button className="bg-primary hover:bg-primary/80 text-white rounded-full px-8">Próximo Capítulo</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
