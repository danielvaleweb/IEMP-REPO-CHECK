import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Plus, Save, Key, User, ArrowLeft, Eye, EyeOff, Lock, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

export function SavedLoginsAdmin({ isDark }: { isDark: boolean }) {
  const [logins, setLogins] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [unlockedItem, setUnlockedItem] = useState<string | null>(null);
  const [masterPasswordModal, setMasterPasswordModal] = useState<string | null>(null);
  const [masterPasswordInput, setMasterPasswordInput] = useState("");

  const SECURITY_PIN = "iemp1234@"; // Using a specific default master password for viewing specific passwords.

  useEffect(() => {
    const q = query(collection(db, "saved-logins"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setLogins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching logins:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!formData.title || !formData.password) return;
    try {
      if (selectedItem?.id) {
        await updateDoc(doc(db, "saved-logins", selectedItem.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "saved-logins"), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsEditing(false);
      setSelectedItem(null);
      setFormData({});
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar login.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este login?")) {
      try {
        await deleteDoc(doc(db, "saved-logins", id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPasswordInput === SECURITY_PIN) {
      setUnlockedItem(masterPasswordModal);
      setMasterPasswordModal(null);
      setMasterPasswordInput("");
    } else {
      alert("Contra-senha incorreta!");
    }
  };

  const [copiedItem, setCopiedItem] = useState<{ id: string, type: string } | null>(null);

  const copyToClipboard = (text: string, id: string, type: 'username' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopiedItem({ id, type });
    setTimeout(() => setCopiedItem(null), 2000);
  };

  if (isEditing) {
    return (
      <Card className={cn("border rounded-3xl p-4 md:p-8 transition-colors", isDark ? "bg-[#1a1a1a] border-white/5" : "bg-white border-black/5 shadow-xl")}>
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => setIsEditing(false)} className={cn("pl-0 tracking-[0.2em] text-[10px] uppercase font-bold", isDark ? "text-gray-500 hover:text-[#BF76FF]" : "text-gray-500 hover:text-[#BF76FF]")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>
        
        <h3 className={cn("text-2xl font-bold mb-6", isDark ? "text-white" : "text-black")}>{selectedItem ? "Editar Login" : "Novo Login"}</h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Título / Identificação</label>
            <Input 
              value={formData.title || ""} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
              className={cn("h-14 rounded-2xl", isDark ? "bg-cinza-input border-white/5 text-white" : "bg-white text-black border-black/5")} 
              placeholder="Ex: Instagram da Igreja"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Usuário / Email / Login</label>
              <Input 
                value={formData.username || ""} 
                onChange={e => setFormData({ ...formData, username: e.target.value })} 
                className={cn("h-14 rounded-2xl", isDark ? "bg-cinza-input border-white/5 text-white" : "bg-white text-black border-black/5")} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Senha</label>
              <Input 
                value={formData.password || ""} 
                onChange={e => setFormData({ ...formData, password: e.target.value })} 
                className={cn("h-14 rounded-2xl", isDark ? "bg-cinza-input border-white/5 text-white" : "bg-white text-black border-black/5")} 
                type="text"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Observações (Opcional)</label>
            <textarea 
              value={formData.notes || ""} 
              onChange={e => setFormData({ ...formData, notes: e.target.value })} 
              className={cn("w-full min-h-[100px] border p-4 rounded-2xl", isDark ? "bg-cinza-input border-white/5 text-white" : "bg-white border-black/5 text-black")}
            />
          </div>
          
          <div className="pt-6">
            <Button onClick={handleSave} className="h-14 px-8 rounded-2xl font-bold bg-[#BF76FF] text-white hover:bg-[#A05ADB]">
              <Save className="w-5 h-5 mr-2" /> Salvar Login
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const filteredLogins = logins.filter(l => (l.title?.toLowerCase().includes(searchTerm.toLowerCase()) || l.username?.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className={cn("text-3xl font-black uppercase tracking-tighter", isDark ? "text-white" : "text-black")}>Logins Salvos</h2>
        <Button onClick={() => { setSelectedItem(null); setFormData({}); setIsEditing(true); }} className="h-12 px-6 rounded-2xl font-bold bg-[#BF76FF] text-white hover:bg-[#A05ADB]">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Login
        </Button>
      </div>

      {masterPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className={cn("w-full max-w-sm rounded-[30px] p-8 border", isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10 shadow-2xl")}>
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#BF76FF]/10 flex items-center justify-center mb-4 text-[#BF76FF]">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className={cn("text-2xl font-black text-center tracking-tight", isDark ? "text-white" : "text-black")}>Acesso Restrito</h3>
              <p className={cn("text-center text-sm font-medium mt-2", isDark ? "text-gray-400" : "text-gray-500")}>Digite a contra-senha para visualizar esta credencial.</p>
            </div>
            <form onSubmit={handleUnlock} className="space-y-4">
              <Input 
                type="password" 
                placeholder="Contra-senha" 
                value={masterPasswordInput}
                onChange={e => setMasterPasswordInput(e.target.value)}
                className={cn("h-14 rounded-2xl text-center tracking-[0.3em] font-black text-lg", isDark ? "bg-black/50 border-white/5 text-white" : "bg-gray-50 border-black/5")}
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => { setMasterPasswordModal(null); setMasterPasswordInput(""); }} className="flex-1 h-12 rounded-xl text-gray-500 font-bold">Cancelar</Button>
                <Button type="submit" className="flex-1 h-12 rounded-xl bg-[#BF76FF] hover:bg-[#A05ADB] text-white font-bold">Desbloquear</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Card className={cn("border rounded-3xl p-6 transition-colors shadow-2xl", isDark ? "bg-roxo-bg border-white/5" : "bg-white border-black/5")}>
        <div className="mb-6">
          <Input 
            placeholder="Pesquisar logins..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn("max-w-md h-12 rounded-xl", isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-black/5")}
          />
        </div>
        
        {filteredLogins.length === 0 ? (
          <div className="py-20 text-center">
            <Key className="w-16 h-16 mx-auto mb-4 text-gray-400/20" />
            <p className={cn("text-xl font-bold mb-2", isDark ? "text-gray-400" : "text-gray-600")}>Nenhum login salvo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLogins.map(login => {
              const isUnlocked = unlockedItem === login.id;
              
              return (
                <div key={login.id} className={cn("p-6 rounded-2xl border transition-all", isDark ? "bg-[#1a1a1a] border-white/5" : "bg-gray-50 border-black/5")}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#BF76FF]/10 flex items-center justify-center text-[#BF76FF]">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={cn("font-bold", isDark ? "text-white" : "text-black")}>{login.title}</h4>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setSelectedItem(login); setFormData(login); setIsEditing(true); }} className={cn("p-2 rounded-lg transition-colors", isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-black/5 text-gray-500")}>
                        <User className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(login.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center group">
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-gray-500" : "text-gray-400")}>Usuário / Email</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-medium", isDark ? "text-gray-300" : "text-gray-700")}>{login.username || "-"}</span>
                        {login.username && (
                          <button onClick={() => copyToClipboard(login.username, login.id, 'username')} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-[#BF76FF] transition-all">
                            {copiedItem?.id === login.id && copiedItem.type === 'username' ? (
                              <span className="text-[#BF76FF] text-[10px] font-bold">Copiado!</span>
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center group">
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-gray-500" : "text-gray-400")}>Senha</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-mono tracking-wider font-bold", isDark ? "text-gray-300" : "text-gray-700")}>
                          {isUnlocked ? login.password : "••••••••"}
                        </span>
                        {!isUnlocked ? (
                          <button onClick={() => setMasterPasswordModal(login.id)} className="p-1 text-[#BF76FF] hover:bg-[#BF76FF]/10 rounded-md transition-colors">
                            <Lock className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <button onClick={() => setUnlockedItem(null)} className="p-1 text-[#BF76FF] hover:bg-[#BF76FF]/10 rounded-md transition-colors">
                              <EyeOff className="w-4 h-4" />
                            </button>
                            <button onClick={() => copyToClipboard(login.password, login.id, 'password')} className="opacity-0 group-hover:opacity-100 p-1 text-[#BF76FF] hover:bg-[#BF76FF]/10 rounded-md transition-colors">
                              {copiedItem?.id === login.id && copiedItem.type === 'password' ? (
                                <span className="text-[#BF76FF] text-[10px] font-bold">Copiado!</span>
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
