import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, doc, updateDoc, setDoc, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  User, 
  Instagram, 
  Calendar, 
  Briefcase, 
  Building2, 
  MessageSquare, 
  MapPin, 
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  UserPlus,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { firestoreService } from "@/services/firestoreService";

interface MemberData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  joinedDate?: string;
  instagram?: string;
  churchSkills?: string;
  professionalArea?: string;
  profession?: string;
  companyName?: string;
  companyWhatsapp?: string;
  isCompanyWhatsappSame?: boolean;
  companyAddress?: string;
  companyServiceType?: string;
}

export default function Formulario() {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [members, setMembers] = useState<MemberData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);

  const [formData, setFormData] = useState({
    joinedDate: "",
    day: "",
    month: "",
    year: "",
    instagram: "",
    churchSkills: "",
    professionalArea: "",
    profession: "",
    companyName: "",
    companyWhatsapp: "",
    isCompanyWhatsappSame: false,
    companyAddress: "",
    companyServiceType: ""
  });

  const [newSkillNameField, setNewSkillNameField] = useState("");

  // Access control
  const isAllowed = isAdmin || 
                   profile?.role === "Administradores" || 
                   profile?.role === "Desenvolvedor" || 
                   profile?.role === "Mídia";

  useEffect(() => {
    if (!authLoading && !isAllowed) {
      navigate("/");
    }
  }, [authLoading, isAllowed, navigate]);

  const loadData = useCallback(async () => {
    if (!isAllowed) return;
    
    try {
      setInitialLoading(true);
      const [membersData, skillsData] = await Promise.all([
        firestoreService.getCollection<any>("members", [orderBy("name", "asc")], 1000 * 60 * 60), // 1 hour TTL
        firestoreService.getDoc<any>("settings", "skills", 1000 * 60 * 60 * 24) // 24 hours TTL
      ]);
      
      setMembers(membersData);
      if (skillsData) {
        setAvailableSkills(skillsData.list || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  }, [isAllowed]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const handleSelectMember = (member: MemberData) => {
    const [d, m, y] = (member.joinedDate || "").split("/");
    setSelectedMember(member);
    setSearchTerm(member.name);
    setFormData({
      joinedDate: member.joinedDate || "",
      day: d || "",
      month: m || "",
      year: y || "",
      instagram: member.instagram || "",
      churchSkills: member.churchSkills || "",
      professionalArea: member.professionalArea || "",
      profession: member.profession || "",
      companyName: member.companyName || "",
      companyWhatsapp: member.companyWhatsapp || "",
      isCompanyWhatsappSame: member.isCompanyWhatsappSame || false,
      companyAddress: member.companyAddress || "",
      companyServiceType: member.companyServiceType || ""
    });
    setSuccess(false);
    setErrorStatus(null);
  };

  const handleAddSkillManual = async () => {
    if (!newSkillNameField.trim()) return;
    if (availableSkills.includes(newSkillNameField.trim())) {
      setNewSkillNameField("");
      return;
    }
    const updatedSkills = [...availableSkills, newSkillNameField.trim()];
    await setDoc(doc(db, "settings", "skills"), { list: updatedSkills });
    firestoreService.clearCache("settings/skills");
    setNewSkillNameField("");
    loadData();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    setIsSubmitting(true);
    setSuccess(false);
    setErrorStatus(null);

    try {
      const memberRef = doc(db, "members", selectedMember.id);
      
      const day = formData.day.padStart(2, "0");
      const month = formData.month.padStart(2, "0");
      const year = formData.year;
      const fullDate = (day && month && year) ? `${day}/${month}/${year}` : formData.joinedDate;

      // Prepare data to update
      const dataToUpdate = {
        joinedDate: fullDate,
        instagram: formData.instagram,
        churchSkills: formData.churchSkills,
        professionalArea: formData.professionalArea,
        profession: formData.profession,
        companyName: formData.companyName,
        companyWhatsapp: formData.isCompanyWhatsappSame ? (selectedMember.phone || formData.companyWhatsapp) : formData.companyWhatsapp,
        isCompanyWhatsappSame: formData.isCompanyWhatsappSame,
        companyAddress: formData.companyAddress,
        companyServiceType: formData.companyServiceType,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(memberRef, dataToUpdate);
      firestoreService.clearCache("members");
      firestoreService.clearCache(`members/${selectedMember.id}`);
      setSuccess(true);
      loadData();
      
      // Clear for new entry after delay
      setTimeout(() => {
        setSelectedMember(null);
        setSearchTerm("");
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("Erro ao atualizar membro:", err);
      setErrorStatus(err.message || "Erro ao salvar dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAllowed) return null;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-2">
            <UserPlus size={14} />
            <span>Sistema Interno</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4">
            Formulário de <span className="text-primary italic">Dados</span>
          </h1>
          <p className="text-gray-400 max-w-xl">
            Preencha e atualize as informações profissionais e ministeriais dos membros da igreja.
          </p>
        </header>

        <section className="relative mb-12">
          <Label className="text-[10px] font-black uppercase tracking-widest ml-2 mb-2 block text-gray-500">
            Buscar Membro
          </Label>
          <div className="relative group">
            <Input 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (selectedMember && e.target.value !== selectedMember.name) {
                  setSelectedMember(null);
                }
              }}
              placeholder="Digite o nome do membro..."
              className="h-14 bg-white/5 border-white/10 rounded-2xl pl-12 text-lg focus:ring-primary/20 transition-all font-medium text-white placeholder:text-gray-500"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
          </div>

          <AnimatePresence>
            {searchTerm && !selectedMember && filteredMembers.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
              >
                {filteredMembers.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMember(m)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="font-bold">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.email}</div>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-gray-700" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {selectedMember && (
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSave}
            className="space-y-8"
          >
            <Card className="bg-[#111] border-white/5 p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-black">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">Dados Ministeriais</h2>
                  <p className="text-xs text-gray-500">Histórico e talentos na igreja</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Calendar size={12} />
                      Data que se tornou membro
                    </div>
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      value={formData.day}
                      onChange={(e) => setFormData({...formData, day: e.target.value.replace(/\D/g, "").slice(0, 2)})}
                      placeholder="DD"
                      className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 text-center"
                    />
                    <Input 
                      value={formData.month}
                      onChange={(e) => setFormData({...formData, month: e.target.value.replace(/\D/g, "").slice(0, 2)})}
                      placeholder="MM"
                      className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 text-center"
                    />
                    <Input 
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: e.target.value.replace(/\D/g, "").slice(0, 4)})}
                      placeholder="AAAA"
                      className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 text-center"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Instagram size={12} />
                      Instagram
                    </div>
                  </Label>
                  <Input 
                    value={formData.instagram}
                    onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                    placeholder="@usuario"
                    className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Wrench size={12} />
                      Habilidades na igreja
                    </div>
                  </Label>
                  
                  <div className="relative">
                    <div 
                      className="min-h-[3rem] w-full bg-white/5 border border-white/10 rounded-xl p-2 flex flex-wrap gap-2 cursor-text focus-within:ring-2 focus-within:ring-primary/20"
                      onClick={() => setShowSkillsDropdown(!showSkillsDropdown)}
                    >
                      {formData.churchSkills ? formData.churchSkills.split(",").map(skill => skill.trim()).filter(Boolean).map((skill, idx) => (
                        <span key={idx} className="bg-primary/20 text-primary text-[10px] font-bold uppercase px-2 py-1 rounded-lg flex items-center gap-1">
                          {skill}
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const skills = formData.churchSkills.split(",").map(s => s.trim()).filter(s => s !== skill);
                              setFormData({...formData, churchSkills: skills.join(", ")});
                            }}
                            className="hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      )) : (
                        <span className="text-gray-600 text-sm py-1.5 px-2">Selecione ou digite habilidades...</span>
                      )}
                    </div>

                    <AnimatePresence>
                      {showSkillsDropdown && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full mb-2 left-0 right-0 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl p-3"
                        >
                          <div className="flex gap-2 mb-3">
                            <Input 
                              placeholder="Nova habilidade..."
                              value={newSkillNameField}
                              onChange={(e) => setNewSkillNameField(e.target.value)}
                              className="h-9 text-xs bg-white/5 border-white/10"
                            />
                            <Button 
                              type="button"
                              onClick={handleAddSkillManual}
                              size="sm"
                              className="h-9 px-3 bg-primary text-black"
                            >
                              <Plus size={14} />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto pr-1">
                            {availableSkills.map(skill => {
                              const isSelected = formData.churchSkills.split(",").map(s => s.trim()).includes(skill);
                              return (
                                <button
                                  key={skill}
                                  type="button"
                                  onClick={() => {
                                    const currentSkills = formData.churchSkills.split(",").map(s => s.trim()).filter(Boolean);
                                    if (isSelected) {
                                      setFormData({...formData, churchSkills: currentSkills.filter(s => s !== skill).join(", ")});
                                    } else {
                                      setFormData({...formData, churchSkills: [...currentSkills, skill].join(", ")});
                                    }
                                  }}
                                  className={cn(
                                    "text-[10px] font-bold uppercase p-2 rounded-lg text-left transition-colors",
                                    isSelected ? "bg-primary text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"
                                  )}
                                >
                                  {skill}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-[#111] border-white/5 p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-black">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">Dados Profissionais</h2>
                  <p className="text-xs text-gray-500">Informações sobre trabalho e negócios</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">Área profissional</Label>
                  <Input 
                    value={formData.professionalArea}
                    onChange={(e) => setFormData({...formData, professionalArea: e.target.value})}
                    placeholder="Ex: Tecnologia, Saúde, Vendas..."
                    className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">Profissão</Label>
                  <Input 
                    value={formData.profession}
                    onChange={(e) => setFormData({...formData, profession: e.target.value})}
                    placeholder="Ex: Engenheiro, Médica, Vendedor..."
                    className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Building2 size={12} />
                      Nome da empresa
                    </div>
                  </Label>
                  <Input 
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    placeholder="Nome do local de trabalho"
                    className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare size={12} />
                        Whatsapp da empresa
                      </div>
                    </Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="samePhone"
                        checked={formData.isCompanyWhatsappSame}
                        onChange={(e) => setFormData({...formData, isCompanyWhatsappSame: e.target.checked})}
                        className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20"
                      />
                      <label htmlFor="samePhone" className="text-[9px] uppercase font-bold text-gray-500 cursor-pointer">Mesmo do pessoal</label>
                    </div>
                  </div>
                  <Input 
                    value={formData.isCompanyWhatsappSame ? (selectedMember.phone || "Não cadastrado") : formData.companyWhatsapp}
                    onChange={(e) => setFormData({...formData, companyWhatsapp: e.target.value})}
                    placeholder="(00) 00000-0000"
                    disabled={formData.isCompanyWhatsappSame}
                    className={cn("h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600", formData.isCompanyWhatsappSame && "opacity-50 cursor-not-allowed text-gray-500")}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MapPin size={12} />
                      Endereço da empresa
                    </div>
                  </Label>
                  <Input 
                    value={formData.companyAddress}
                    onChange={(e) => setFormData({...formData, companyAddress: e.target.value})}
                    placeholder="Rua, número, bairro, cidade..."
                    className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-gray-500">Qual tipo de serviço a empresa faz?</Label>
                  <Input 
                    value={formData.companyServiceType}
                    onChange={(e) => setFormData({...formData, companyServiceType: e.target.value})}
                    placeholder="Descreva brevemente os produtos ou serviços..."
                    className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600"
                  />
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="h-16 w-full rounded-2xl text-lg font-black uppercase tracking-widest bg-primary text-black hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  "Salvar Informações"
                )}
              </Button>

              <AnimatePresence>
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-green-500/20 border border-green-500/30 text-green-400 p-4 rounded-2xl flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    <span className="font-bold text-sm uppercase tracking-tighter">Dados atualizados com sucesso!</span>
                  </motion.div>
                )}
                {errorStatus && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center justify-center gap-2"
                  >
                    <AlertCircle size={18} />
                    <span className="font-bold text-sm uppercase tracking-tighter">{errorStatus}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}
