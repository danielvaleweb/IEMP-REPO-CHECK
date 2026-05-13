import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { Plus, Trash2, Edit, Save, BookOpen, GraduationCap, X, CheckCircle2, FileDown, Loader2, Youtube, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { jsPDF } from 'jspdf';
import { firestoreService } from "@/services/firestoreService";

export function EBDAdminView({ isDark }: { isDark: boolean }) {
  const [modules, setModules] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  // Modals & Forms
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonData, setLessonData] = useState({ title: '', youtubeUrl: '', supportMaterialUrl: '', description: '', transcript: '' });

  // Test Data
  const [activeTest, setActiveTest] = useState<any>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testData, setTestData] = useState({ question: '', options: ['', '', '', ''], correctAnswerIndex: 0 });
  const [testLessonId, setTestLessonId] = useState<string | null>(null);

  // PDF Generator State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfGenerationStatus, setPdfGenerationStatus] = useState('');
  const [activeLessonForGen, setActiveLessonForGen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Deletion States
  const [deleteInfo, setDeleteInfo] = useState<{ id: string, type: 'module' | 'lesson', title: string } | null>(null);

  const cleanTranscript = (text: string) => {
    if (!text) return '';
    
    // Remove pattern of time like "1 hora, 34 minutos e 12 segundos", "2 horas e 5 minutos", "45 segundos"
    // Handle variations with accents and plural
    let cleaned = text.replace(/\b\d+\s+(horas?|minutos?|segundos?)(,\s*\d+\s+(minutos?|segundos?))?(\s+e\s+\d+\s+(minutos?|segundos?))?\b/gi, '');
    
    // Remove simpler variations like "15min", "2h", etc if present
    cleaned = cleaned.replace(/\b\d+\s*(h|min|s|seg)\b/gi, '');

    // Remove pattern like: "1:13:12", "15:30", "01:05"
    cleaned = cleaned.replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, '');
    
    // Clean up empty lines and extra spaces
    cleaned = cleaned.split('\n').map(line => line.trim()).filter(line => line).join('\n');
    return cleaned;
  };

  const generateSupportMaterial = async (lesson: any) => {
    if (!lesson.transcript) {
      alert("Esta aula não possui uma transcrição cadastrada para gerar o material.");
      return;
    }

    setIsGeneratingPdf(true);
    setActiveLessonForGen(lesson);
    setPdfGenerationStatus("Gerando arquivo PDF...");

    try {
      const transcript = cleanTranscript(lesson.transcript);
      const currentModule = modules.find(m => m.id === lesson.moduleId);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      
      const logoUrl = "https://i.imgur.com/GELQtyU.png";
      
      const addWatermark = (pdfDoc: any) => {
        pdfDoc.setGState(new (pdfDoc as any).GState({ opacity: 0.1 }));
        const imgWidth = 100;
        const imgHeight = 100;
        pdfDoc.addImage(logoUrl, 'PNG', (pageWidth - imgWidth) / 2, (pageHeight - imgHeight) / 2, imgWidth, imgHeight);
        pdfDoc.setGState(new (pdfDoc as any).GState({ opacity: 1.0 }));
      };

      addWatermark(doc);

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      const title = `${currentModule?.title || 'Módulo'} - ${lesson.title || 'Aula'}`;
      doc.text(title, margin, 30, { maxWidth: pageWidth - (margin * 2) });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("MATERIAL DE APOIO - PORTAL EBD - IEMP", margin, 40);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 45, pageWidth - margin, 45);

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const splitText = doc.splitTextToSize(transcript, pageWidth - (margin * 2));
      
      let cursorY = 55;
      for (let i = 0; i < splitText.length; i++) {
        if (cursorY + 10 > pageHeight - margin) {
          doc.addPage();
          addWatermark(doc);
          cursorY = margin + 10;
        }
        doc.text(splitText[i], margin, cursorY);
        cursorY += 6;
      }

      const fileName = `${currentModule?.title || 'Modulo'}_${lesson.title || 'Aula'}.pdf`.replace(/\s+/g, '_');
      doc.save(fileName);

      setPdfGenerationStatus("PDF gerado com sucesso!");
      setTimeout(() => setPdfGenerationStatus(''), 3000);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar PDF: " + (error as Error).message);
    } finally {
      setIsGeneratingPdf(false);
      setActiveLessonForGen(null);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [mods, less] = await Promise.all([
        firestoreService.getCollection<any>("ebd-modules", [orderBy("createdAt", "asc")], 1000 * 60 * 30),
        firestoreService.getCollection<any>("ebd-lessons", [orderBy("createdAt", "asc")], 1000 * 60 * 30)
      ]);
      setModules(mods);
      setLessons(less);
      if (mods.length > 0 && !activeModuleId) {
        setActiveModuleId(mods[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateModule = async () => {
    if (!moduleTitle.trim()) return;
    try {
      await addDoc(collection(db, "ebd-modules"), {
        title: moduleTitle,
        createdAt: serverTimestamp()
      });
      firestoreService.clearCache("ebd-modules");
      await loadData();
      setIsModuleModalOpen(false);
      setModuleTitle('');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'ebd-modules');
    }
  };

  const handleSaveLesson = async () => {
    if (!lessonData.title.trim() || !activeModuleId) return;
    try {
      const cleanedTranscript = cleanTranscript(lessonData.transcript);
      const data = {
        moduleId: activeModuleId,
        title: lessonData.title,
        youtubeUrl: lessonData.youtubeUrl,
        supportMaterialUrl: lessonData.supportMaterialUrl,
        description: lessonData.description,
        transcript: cleanedTranscript,
        updatedAt: serverTimestamp()
      };

      if (editingLessonId) {
        await updateDoc(doc(db, "ebd-lessons", editingLessonId), data);
      } else {
        await addDoc(collection(db, "ebd-lessons"), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      
      firestoreService.clearCache("ebd-lessons");
      await loadData();
      setIsLessonModalOpen(false);
      setEditingLessonId(null);
      setLessonData({ title: '', youtubeUrl: '', supportMaterialUrl: '', description: '', transcript: '' });
    } catch (e) {
      handleFirestoreError(e, editingLessonId ? OperationType.UPDATE : OperationType.CREATE, editingLessonId ? `ebd-lessons/${editingLessonId}` : 'ebd-lessons');
    }
  };

  const openLessonModal = (lesson: any = null) => {
    if (lesson) {
      setEditingLessonId(lesson.id);
      setLessonData({
        title: lesson.title || '',
        youtubeUrl: lesson.youtubeUrl || '',
        supportMaterialUrl: lesson.supportMaterialUrl || '',
        description: lesson.description || '',
        transcript: lesson.transcript || ''
      });
    } else {
      setEditingLessonId(null);
      setLessonData({ title: '', youtubeUrl: '', supportMaterialUrl: '', description: '', transcript: '' });
    }
    setIsLessonModalOpen(true);
  };

  const handleDeleteModule = async () => {
    if (!deleteInfo || deleteInfo.type !== 'module') return;
    try {
      await deleteDoc(doc(db, "ebd-modules", deleteInfo.id));
      firestoreService.clearCache("ebd-modules");
      firestoreService.clearCache("ebd-lessons"); // Some lessons might become orphaned/affected
      await loadData();
      setDeleteInfo(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `ebd-modules/${deleteInfo.id}`);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deleteInfo || deleteInfo.type !== 'lesson') return;
    try {
      await deleteDoc(doc(db, "ebd-lessons", deleteInfo.id));
      firestoreService.clearCache("ebd-lessons");
      await loadData();
      setDeleteInfo(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `ebd-lessons/${deleteInfo.id}`);
    }
  };

  const openTestModal = (lessonId: string) => {
    setTestLessonId(lessonId);
    // fetch test for this lesson
    const unsub = onSnapshot(doc(db, "ebd-tests", lessonId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTestData({
          question: data.question || '',
          options: data.options || ['', '', '', ''],
          correctAnswerIndex: data.correctAnswerIndex || 0
        });
      } else {
        setTestData({ question: '', options: ['', '', '', ''], correctAnswerIndex: 0 });
      }
      setIsTestModalOpen(true);
      unsub();
    }, (err) => console.error(err));
  };

  const handleSaveTest = async () => {
    if (!testLessonId) return;
    try {
      await setDoc(doc(db, "ebd-tests", testLessonId), {
        question: testData.question,
        options: testData.options.filter(o => o.trim() !== ''),
        correctAnswerIndex: testData.correctAnswerIndex,
        createdAt: serverTimestamp()
      });
      firestoreService.clearCache("ebd-tests");
      setIsTestModalOpen(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `ebd-tests`);
    }
  };

  return (
    <div className={cn("p-6 md:p-10 space-y-8 animate-in fade-in duration-500", isDark ? "text-white" : "text-black")}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#3b82f6]" /> Portal EBD Admin
          </h2>
          <p className={cn("text-sm mt-1", isDark ? "text-white/60" : "text-black/60")}>
            Gerencie os módulos, aulas e testes da Escola Bíblica.
          </p>
        </div>
        <Button onClick={() => setIsModuleModalOpen(true)} className="bg-[#3b82f6] text-white hover:bg-[#2563eb] font-bold rounded-xl h-11 px-6 shadow-xl shadow-blue-500/20">
          <Plus className="w-4 h-4 mr-2" /> Novo Módulo
        </Button>
      </div>

      {modules.length === 0 ? (
        <div className={cn("border border-dashed rounded-3xl p-16 text-center", isDark ? "border-white/10" : "border-black/10")}>
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold">Nenhum Módulo</h3>
          <p className="opacity-60 text-sm mt-2 mb-6">Crie o primeiro módulo para começar a adicionar aulas.</p>
          <Button onClick={() => setIsModuleModalOpen(true)} variant="outline" className={cn("rounded-xl border-dashed", isDark ? "border-white/20 text-white hover:bg-white/5" : "border-black/20 text-black hover:bg-black/5")}>
            <Plus className="w-4 h-4 mr-2" /> Criar Módulo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={cn("lg:col-span-1 rounded-3xl border p-4 space-y-2", isDark ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5")}>
            <h3 className="text-sm font-black uppercase tracking-widest opacity-50 px-2 mb-4">Módulos</h3>
            {modules.map(mod => (
              <div
                key={mod.id}
                onClick={() => setActiveModuleId(mod.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setActiveModuleId(mod.id)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between group transition-all duration-300 cursor-pointer",
                  activeModuleId === mod.id 
                    ? (isDark ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30" : "bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20")
                    : (isDark ? "hover:bg-white/5 text-white/70 border border-transparent" : "hover:bg-black/5 text-black/70 border border-transparent")
                )}
              >
                <span className="font-bold text-sm tracking-wide">{mod.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteInfo({ id: mod.id, type: 'module', title: mod.title });
                  }}
                  className={cn("p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity", isDark ? "text-white/30 hover:text-red-500" : "text-black/30 hover:text-red-500")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className={cn("lg:col-span-2 rounded-3xl border p-6 min-h-[400px]", isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-black/5 shadow-sm")}>
            {activeModuleId ? (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-dashed border-black/10 dark:border-white/10">
                  <h3 className="text-xl font-black tracking-tight">{modules.find(m => m.id === activeModuleId)?.title} - Aulas</h3>
                  <button onClick={() => openLessonModal()} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-9 px-4 text-xs font-bold flex items-center gap-2 transition-all">
                    <Plus className="w-3 h-3" /> Adicionar Aula
                  </button>
                </div>

                <div className="space-y-4">
                  {lessons.filter(l => l.moduleId === activeModuleId).length === 0 ? (
                    <div className="text-center py-10 opacity-50 text-sm italic">Nenhuma aula neste módulo.</div>
                  ) : (
                    lessons.filter(l => l.moduleId === activeModuleId).map((lesson, idx) => (
                      <div key={lesson.id} className={cn("p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border group", isDark ? "border-white/5 bg-black/20 hover:border-white/10" : "border-black/5 bg-gray-50/50 hover:border-black/10")}>
                        <div className="flex items-center gap-4 flex-1">
                          <div className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-black", isDark ? "border-white/10 text-white/40 group-hover:border-white/30 group-hover:text-white/80" : "border-black/10 text-black/40 group-hover:border-black/30 group-hover:text-black/80")}>
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm leading-tight">{lesson.title}</h4>
                            <div className="flex items-center gap-3 mt-1.5 opacity-50 text-xs">
                              {lesson.youtubeUrl && <span>Tem Vídeo</span>}
                              {lesson.supportMaterialUrl && <span>• Tem Material</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                           <Button 
                             size="sm" 
                             variant="outline" 
                             onClick={() => generateSupportMaterial(lesson)} 
                             disabled={isGeneratingPdf && activeLessonForGen?.id === lesson.id}
                             className={cn("h-8 rounded-lg text-xs flex items-center gap-2", isDark ? "border-white/10 hover:bg-white/10" : "border-black/10 hover:bg-black/5")}
                           >
                             {isGeneratingPdf && activeLessonForGen?.id === lesson.id ? (
                               <Loader2 className="w-3 h-3 animate-spin" />
                             ) : (
                               <FileDown className="w-3 h-3" />
                             )}
                             Gerar PDF
                           </Button>
                           <Button 
                             size="icon" 
                             variant="outline" 
                             onClick={() => openLessonModal(lesson)} 
                             className={cn("h-8 w-8 rounded-lg", isDark ? "border-white/10 hover:bg-white/10" : "border-black/10 hover:bg-black/5")}
                           >
                             <Edit className="w-3.5 h-3.5" />
                           </Button>
                           <Button size="sm" variant="outline" onClick={() => openTestModal(lesson.id)} className={cn("h-8 rounded-lg text-xs", isDark ? "border-white/10 hover:bg-white/10" : "border-black/10 hover:bg-black/5")}>
                             <CheckCircle2 className="w-3 h-3 mr-1" /> Quiz
                           </Button>
                           <Button size="icon" variant="ghost" onClick={(e) => {
                             e.stopPropagation();
                             setDeleteInfo({ id: lesson.id, type: 'lesson', title: lesson.title });
                           }} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg">
                             <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <GraduationCap className="w-12 h-12 mb-4" />
                <p>Selecione um módulo ao lado para gerenciar as aulas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Modals */}
      <Dialog open={isModuleModalOpen} onOpenChange={setIsModuleModalOpen}>
        <DialogContent className={cn("border-white/10 rounded-3xl", isDark ? "bg-[#141414] text-white" : "bg-white text-black")}>
          <DialogHeader><DialogTitle>Novo Módulo EBD</DialogTitle></DialogHeader>
          <Input 
            placeholder="Ex: Mês de Janeiro" 
            value={moduleTitle} 
            onChange={e => setModuleTitle(e.target.value)}
            className={cn("h-14 rounded-2xl px-4", isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10")}
          />
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsModuleModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateModule} className="bg-[#3b82f6] text-white rounded-xl">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLessonModalOpen} onOpenChange={(open) => {
        setIsLessonModalOpen(open);
        if (!open) setEditingLessonId(null);
      }}>
        <DialogContent className={cn("border-white/10 rounded-3xl max-w-lg", isDark ? "bg-[#141414] text-white" : "bg-white text-black")}>
          <DialogHeader><DialogTitle>{editingLessonId ? "Editar Aula" : "Nova Aula"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs opacity-60 uppercase tracking-widest pl-2">Título da Aula</label>
              <Input value={lessonData.title} onChange={e => setLessonData({...lessonData, title: e.target.value})} className={cn("h-14 rounded-2xl px-4", isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10")} placeholder="Ex: Aula 01 - A Criação" />
            </div>
            <div className="space-y-2">
              <label className="text-xs opacity-60 uppercase tracking-widest pl-2">URL do YouTube (Não Listado)</label>
              <Input value={lessonData.youtubeUrl} onChange={e => setLessonData({...lessonData, youtubeUrl: e.target.value})} className={cn("h-14 rounded-2xl px-4", isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10")} placeholder="Copie e cole o link do vídeo" />
            </div>
            <div className="space-y-2">
              <label className="text-xs opacity-60 uppercase tracking-widest pl-2">Material de Apoio (Link PDF / Google Drive)</label>
              <Input value={lessonData.supportMaterialUrl} onChange={e => setLessonData({...lessonData, supportMaterialUrl: e.target.value})} className={cn("h-14 rounded-2xl px-4", isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10")} placeholder="Link para baixar material (opcional)" />
            </div>
            <div className="space-y-2">
              <label className="text-xs opacity-60 uppercase tracking-widest pl-2">Descrição Curta</label>
              <Textarea value={lessonData.description} onChange={e => setLessonData({...lessonData, description: e.target.value})} className={cn("rounded-2xl px-4 py-3 resize-none", isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10")} placeholder="Opcional..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs opacity-60 uppercase tracking-widest pl-2">Transcrição da Aula (Para gerar Material)</label>
              <Textarea 
                value={lessonData.transcript} 
                onChange={e => setLessonData({...lessonData, transcript: e.target.value})} 
                className={cn("rounded-2xl px-4 py-3 h-32", isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10")} 
                placeholder="Cole aqui a transcrição completa da aula para gerar o PDF de material de apoio com marca d'água automaticamente." 
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => { setIsLessonModalOpen(false); setEditingLessonId(null); }}>Cancelar</Button>
            <Button onClick={handleSaveLesson} className="bg-[#3b82f6] text-white rounded-xl px-8">
              {editingLessonId ? "Salvar Alterações" : "Salvar Aula"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent className={cn("border-white/10 rounded-3xl max-w-lg", isDark ? "bg-[#141414] text-white" : "bg-white text-black")}>
          <DialogHeader><DialogTitle>Teste de Conhecimentos</DialogTitle><DialogDescription className="opacity-50">Crie uma questão de múltipla escolha para esta aula.</DialogDescription></DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
               <label className="text-xs opacity-60 uppercase tracking-widest pl-2">Pergunta</label>
               <Textarea value={testData.question} onChange={e=>setTestData({...testData, question: e.target.value})} className={cn("rounded-2xl h-20 resize-none px-4 py-3", isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10")} placeholder="Qual foi o principal assunto da aula?" />
            </div>
            <div className="space-y-3">
               <label className="text-xs opacity-60 uppercase tracking-widest pl-2 block">Alternativas</label>
               {[0,1,2,3].map(index => (
                 <div key={index} className="flex items-center gap-3">
                   <input type="radio" name="correctAnswer" checked={testData.correctAnswerIndex === index} onChange={() => setTestData({...testData, correctAnswerIndex: index})} className="w-5 h-5 accent-[#3b82f6]" />
                   <Input 
                     value={testData.options[index] || ''}
                     onChange={e => {
                       const newOptions = [...testData.options];
                       newOptions[index] = e.target.value;
                       setTestData({...testData, options: newOptions});
                     }}
                     className={cn("h-12 rounded-xl px-4 flex-1", isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10")}
                     placeholder={`Opção ${index + 1}`}
                   />
                 </div>
               ))}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsTestModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTest} className="bg-[#3b82f6] text-white rounded-xl px-8">Salvar Teste</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteInfo} onOpenChange={() => setDeleteInfo(null)}>
        <DialogContent className={cn("border-white/10 rounded-3xl max-w-sm", isDark ? "bg-[#141414] text-white" : "bg-white text-black")}>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription className="opacity-60">
              Tem certeza que deseja excluir {deleteInfo?.type === 'module' ? 'o módulo' : 'a aula'} <strong>"{deleteInfo?.title}"</strong>?
              {deleteInfo?.type === 'module' && <p className="mt-2 text-red-500 font-bold">Aviso: Todas as aulas deste módulo ficarão sem categoria vinculada.</p>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeleteInfo(null)} className="flex-1">Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={deleteInfo?.type === 'module' ? handleDeleteModule : handleDeleteLesson}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
