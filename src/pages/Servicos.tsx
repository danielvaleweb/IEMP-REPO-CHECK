import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Briefcase, MapPin, Phone, Building2, Search, Zap, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Servicos() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Escuta todos os membros aprovados (status !== 'pending' ou pending se não tiver campo status) que tem profession
    import("firebase/firestore").then(({ collection, query, onSnapshot }) => {
      const q = query(collection(db, "members"));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const mems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                     .filter((m: any) => m.profession && m.profession.trim() !== "");
                     
        setServices(mems);
        setLoading(false);
      });

      return () => unsubscribe();
    });
  }, []);

  const filteredServices = services.filter(service => 
    service.profession?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.serviceDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-20 relative overflow-hidden">
      {/* Elementos de Fundo */}
      <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-br from-[#7300FF]/20 via-[#BF76FF]/10 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-full h-[500px] bg-gradient-to-tr from-[#BF76FF]/20 via-[#7300FF]/10 to-transparent blur-[120px] pointer-events-none -z-10" />
      
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center space-x-2 bg-white/5 border border-white/10 px-6 py-2.5 rounded-full mb-6 backdrop-blur-md">
            <Zap className="w-5 h-5 text-[#BF76FF]" />
            <span className="text-sm font-bold tracking-widest uppercase text-white/90">Work & Network</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/50">
            Profissionais & Serviços
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto font-medium">
            Conheça os profissionais do nosso ministério, apoie seus negócios e encontre os serviços que você precisa.
          </p>

          <div className="mt-10 max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400 group-focus-within:text-[#BF76FF] transition-colors" />
            </div>
            <input 
              type="text"
              placeholder="Buscar por profissão, nome, empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white h-16 rounded-3xl pl-16 pr-6 focus:outline-none focus:border-[#BF76FF]/50 focus:bg-white/10 transition-all font-medium text-lg placeholder:text-gray-500 shadow-2xl shadow-black/50"
            />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#BF76FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold text-white mb-2">Nenhum profissional encontrado</h3>
            <p className="text-gray-400">Tente buscar por um termo diferente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#7300FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem] blur-xl -z-10" />
                  
                  <div className="h-full bg-[#111111]/80 backdrop-blur-xl border border-white/5 group-hover:border-white/10 transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col">
                    
                    {/* Header do Cartão */}
                    <div className="p-8 pb-6 flex items-start justify-between gap-4">
                      {service.companyLogo ? (
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
                          <img src={service.companyLogo} alt={service.companyName || service.profession} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7300FF]/20 to-[#BF76FF]/20 border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
                          <Briefcase className="w-8 h-8 text-[#BF76FF]" />
                        </div>
                      )}

                      <div className="flex-1 text-right">
                        <h3 className="text-xl font-black text-white leading-tight mb-1">{service.profession}</h3>
                        {service.companyName && (
                          <div className="flex items-center justify-end gap-1.5 text-[#BF76FF] font-bold text-sm">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{service.companyName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Conteúdo Principal */}
                    <div className="px-8 flex-1">
                      {service.serviceDescription && (
                        <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
                          {service.serviceDescription}
                        </p>
                      )}

                      <div className="space-y-4 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white/5 border border-white/10">
                            {service.photoURL ? (
                              <img src={service.photoURL} alt={service.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-sm font-bold text-white">
                                {service.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-0.5">Profissional</p>
                            <p className="font-bold text-white truncate">{service.name}</p>
                          </div>
                        </div>

                        {service.serviceAddress && (
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex-1 overflow-hidden pt-1">
                              <p className="text-xs text-gray-400 leading-snug">{service.serviceAddress}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botão WhatsApp */}
                    <div className="p-4 pt-6 mt-auto">
                      {service.servicePhone || service.phone ? (
                        <a 
                          href={`https://wa.me/55${(service.servicePhone || service.phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${service.name}, vi seu cartão profissional no site da Ministério Profecia!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/20 py-4 rounded-2xl font-bold transition-all group/btn"
                        >
                          <Phone className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                          <span>Falar no WhatsApp</span>
                          <ExternalLink className="w-4 h-4 ml-1 opacity-50" />
                        </a>
                      ) : (
                        <div className="w-full flex items-center justify-center gap-2 bg-white/5 text-gray-500 py-4 rounded-2xl font-bold cursor-not-allowed">
                          <span>WhatsApp Indisponível</span>
                        </div>
                      )}
                    </div>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
