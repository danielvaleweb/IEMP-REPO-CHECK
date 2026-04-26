import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Heart, 
  Users, 
  Send, 
  Share2,
  Trophy,
  Crown,
  Medal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const MOCK_RANKING = [
  { id: "1", name: "Irmão José", points: 1250, level: "Ancião", rank: 1 },
  { id: "2", name: "Maria Oliveira", points: 1100, level: "Diácono", rank: 2 },
  { id: "3", name: "Carlos Souza", points: 950, level: "Obreiro", rank: 3 },
  { id: "4", name: "Ana Paula", points: 800, level: "Membro", rank: 4 },
  { id: "5", name: "Ricardo Lima", points: 750, level: "Membro", rank: 5 },
];

const MOCK_CHAT = [
  { id: "1", user: "João", message: "Glória a Deus!", time: "19:05" },
  { id: "2", user: "Marta", message: "Amém, que palavra abençoada.", time: "19:10" },
  { id: "3", user: "Lucas", message: "Deus é fiel em todo tempo.", time: "19:12" },
  { id: "4", user: "Sarah", message: "Paz do Senhor a todos!", time: "19:15" },
];

export default function Live() {
  const [prayerRequest, setPrayerRequest] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [videoId, setVideoId] = useState("");
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });
    return () => unsub();
  }, []);

  const channelId = settings.youtubeChannelId || "UCILgaItnqDH3plhRXD54QUg";

  useEffect(() => {
    const fetchLiveVideoId = async () => {
      try {
        const response = await fetch('/api/recent-lives');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0 && data[0].id) {
            setVideoId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch live video id", error);
      }
    };
    fetchLiveVideoId();
  }, []);

  return (
    <div className="pt-24 pb-12 px-4 min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Content: Video & Info */}
        <div className="xl:col-span-2 space-y-6">
          <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-black/5 relative group">
            <iframe
              width="100%"
              height="100%"
              src={videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&origin=${window.location.origin}` : `https://www.youtube-nocookie.com/embed/live_stream?channel=${channelId}&origin=${window.location.origin}`}
              title="YouTube Live Stream"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full" />
              AO VIVO
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Culto de Celebração e Adoração</h1>
                <p className="text-muted-foreground">Igreja Ministério Profecia • 1.2k assistindo agora</p>
              </div>
              <div className="flex gap-2">
                <a 
                  href={`https://www.youtube.com/channel/${channelId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium hover:bg-white/5 transition-colors text-white"
                >
                  <Youtube className="w-4 h-4 mr-2 text-red-600" /> Ver no YouTube
                </a>
                <Button className="bg-primary hover:bg-primary/80 text-white rounded-full">
                  <Heart className="w-4 h-4 mr-2" /> Ofertar
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Seja bem-vindo à nossa transmissão ao vivo. Hoje teremos uma palavra especial sobre 
              "A Fidelidade de Deus em Tempos de Crise". Prepare seu coração para receber o que 
              o Senhor tem para você hoje.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prayer Requests */}
            <Card className="glass-panel border-black/5 rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/10 border-b border-black/5">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Heart className="w-5 h-5" /> Pedidos de Oração
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Deixe seu pedido de oração e nossa equipe de intercessão estará orando por você.
                </p>
                <div className="space-y-4">
                  <Textarea 
                    placeholder="Escreva seu pedido aqui..." 
                    className="bg-muted/50 border-black/10 focus:border-primary min-h-[100px]"
                    value={prayerRequest}
                    onChange={(e) => setPrayerRequest(e.target.value)}
                  />
                  <Button className="w-full bg-primary hover:bg-primary/80 text-white">
                    Enviar Pedido
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Presence Ranking */}
            <Card className="glass-panel border-black/5 rounded-3xl overflow-hidden">
              <CardHeader className="bg-secondary/10 border-b border-black/5">
                <CardTitle className="flex items-center gap-2 text-secondary">
                  <Trophy className="w-5 h-5" /> Ranking de Presença
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[250px]">
                  <div className="p-4 space-y-4">
                    {MOCK_RANKING.map((user, idx) => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10 border border-black/5">
                              <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            {idx === 0 && <Crown className="w-4 h-4 text-yellow-500 absolute -top-2 -right-1 rotate-12" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{user.level}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{user.points} pts</p>
                          <div className="flex justify-end">
                            {idx === 0 && <Medal className="w-3 h-3 text-yellow-500" />}
                            {idx === 1 && <Medal className="w-3 h-3 text-slate-400" />}
                            {idx === 2 && <Medal className="w-3 h-3 text-amber-600" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar: Live Chat */}
        <div className="xl:col-span-1">
          <Card className="glass-panel border-black/5 rounded-3xl overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-muted/50 border-b border-black/5 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-primary" /> Chat ao Vivo
              </CardTitle>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Conectado
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-grow flex flex-col">
              <div className="flex-grow h-[500px]">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/live_chat?v=${videoId || "live_stream"}&embed_domain=${window.location.hostname}`}
                  frameBorder="0"
                ></iframe>
              </div>
              
              <div className="p-4 bg-muted/50 border-t border-black/5">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Diga algo..." 
                    className="bg-white border-black/10 focus:border-primary rounded-full"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                  />
                  <Button size="icon" className="rounded-full bg-primary hover:bg-primary/80 text-white shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[9px] text-muted-foreground mt-2 text-center">
                  Lembre-se de manter a paz e o respeito no chat.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
