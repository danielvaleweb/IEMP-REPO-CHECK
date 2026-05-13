import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, PlayCircle, Plus, Trash2, Edit, MessageCircle, FileText, 
  Send, CheckCircle2, Circle, GraduationCap, ArrowLeft, ChevronRight, 
  Lock, User, Youtube, FileDown, Loader2, ChevronDown, MonitorPlay 
} from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCachedCollection, useCachedDoc } from '@/hooks/useFirestore';
import { firestoreService } from '@/services/firestoreService';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

const getYoutubeId = (url: string) => {
  if (!url) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : url;
};

export default function EBD() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [questionText, setQuestionText] = useState('');
  
  // PDF Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfGenerationStatus, setPdfGenerationStatus] = useState('');

  // Test Data
  const [activeTest, setActiveTest] = useState<any>(null);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);

  const { data: modulesData } = useCachedCollection<any>("ebd-modules", [orderBy("createdAt", "asc")], 1000 * 60 * 60 * 24); // 24h
  const { data: lessonsData } = useCachedCollection<any>("ebd-lessons", [orderBy("createdAt", "asc")], 1000 * 60 * 60 * 6); // 6h
  const { data: questionsData } = useCachedCollection<any>("ebd-questions", [orderBy("createdAt", "desc")], 1000 * 60 * 10); // 10m
  const { data: testData } = useCachedDoc<any>("ebd-tests", activeLessonId || undefined, 1000 * 60 * 60 * 12); // 12h

  useEffect(() => {
    if (modulesData) {
      setModules(modulesData);
      if (modulesData.length > 0 && !activeModuleId) {
        setActiveModuleId(modulesData[0].id);
      }
    }
  }, [modulesData, activeModuleId]);

  useEffect(() => {
    if (lessonsData) {
      setLessons(lessonsData);
    }
  }, [lessonsData]);

  useEffect(() => {
    if (questionsData) {
      setQuestions(questionsData);
    }
  }, [questionsData]);

  useEffect(() => {
    if (testData) {
      setActiveTest(testData);
    } else {
      setActiveTest(null);
    }
  }, [testData]);

  useEffect(() => {
    // If current lesson no longer exists (deleted), reset activeLessonId
    if (activeLessonId && lessons.length > 0) {
      const exists = lessons.some(l => l.id === activeLessonId);
      if (!exists) {
        setActiveLessonId(null);
      }
    }

    if (!activeLessonId && activeModuleId) {
      const modsLessons = lessons.filter(l => l.moduleId === activeModuleId);
      if (modsLessons.length > 0) {
        setActiveLessonId(modsLessons[0].id);
      }
    }
  }, [activeModuleId, lessons, activeLessonId]);

  const currentLesson = lessons.find(l => l.id === activeLessonId);
  const activeModuleLessons = lessons.filter(l => l.moduleId === activeModuleId);
  const activeLessonQuestions = questions.filter(q => q.lessonId === activeLessonId);

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

  const generateSupportMaterial = async () => {
    if (!currentLesson?.transcript) {
      alert("Esta aula não possui uma transcrição cadastrada.");
      return;
    }

    setIsGeneratingPdf(true);
    setPdfGenerationStatus("Preparando documento...");

    try {
      const transcript = cleanTranscript(currentLesson.transcript);
      const currentModule = modules.find(m => m.id === activeModuleId);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      
      const logoUrl = "https://i.imgur.com/GELQtyU.png";
      
      const addWatermark = (pdfDoc: any) => {
        pdfDoc.setGState(new (pdfDoc as any).GState({ opacity: 0.08 }));
        const imgSize = 120;
        pdfDoc.addImage(logoUrl, 'PNG', (pageWidth - imgSize) / 2, (pageHeight - imgSize) / 2, imgSize, imgSize);
        pdfDoc.setGState(new (pdfDoc as any).GState({ opacity: 1.0 }));
      };

      addWatermark(doc);

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      const title = `${currentModule?.title || 'EBD'} - ${currentLesson?.title || 'Aula'}`;
      doc.text(title, margin, 35, { maxWidth: pageWidth - (margin * 2) });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text("MATERIAL DE APOIO - PORTAL EBD - MINISTÉRIO PROFECIA", margin, 45);
      
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, 50, pageWidth - margin, 50);

      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      const splitText = doc.splitTextToSize(transcript, pageWidth - (margin * 2));
      
      let cursorY = 65;
      for (let i = 0; i < splitText.length; i++) {
        if (cursorY + 10 > pageHeight - margin) {
          doc.addPage();
          addWatermark(doc);
          cursorY = margin + 15;
        }
        doc.text(splitText[i], margin, cursorY);
        cursorY += 7;
      }

      const fileName = `EBD_${currentModule?.title || 'Modulo'}_${currentLesson?.title || 'Aula'}`.replace(/\s+/g, '_') + '.pdf';
      doc.save(fileName);

      setPdfGenerationStatus("Material baixado!");
      setTimeout(() => setPdfGenerationStatus(''), 3000);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar PDF: " + (error as Error).message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!questionText.trim() || !activeLessonId) return;
    try {
      await addDoc(collection(db, "ebd-questions"), {
        lessonId: activeLessonId,
        userId: user?.uid,
        userName: profile?.name || user?.displayName || "Visitante",
        userPhoto: profile?.photo || user?.photoURL || null,
        question: questionText,
        answer: null,
        createdAt: serverTimestamp()
      });
      setQuestionText('');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'ebd-questions');
    }
  };

  const handleAnswerQuestion = async (qId: string, answerText: string) => {
    try {
      await updateDoc(doc(db, "ebd-questions", qId), {
        answer: answerText,
        answeredAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `ebd-questions/${qId}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center relative px-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[40px] p-10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-black mb-6 tracking-tight">Portal EBD</h2>
            <p className="text-white/60 mb-10 text-lg font-medium leading-relaxed">
              Autentique-se para ter acesso exclusivo aos conteúdos da Escola Bíblica.
            </p>
            <Button 
              onClick={() => navigate("/admin")} 
              className="bg-white text-black hover:bg-white/90 rounded-2xl font-black px-10 h-14 w-full text-lg shadow-xl"
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col md:flex-row pt-20">
      
      {/* Sidebar - Desktop */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-white/5 bg-[#080808]/50 backdrop-blur-3xl transition-all duration-500 overflow-hidden shrink-0",
        isSidebarOpen ? "w-80" : "w-0"
      )}>
        <div className="p-8 border-b border-white/5 sticky top-0 bg-[#080808]/80 backdrop-blur-3xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
               <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tight">Escola Bíblica</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {modules.map(mod => (
            <div key={mod.id} className="mb-6">
              <button 
                onClick={() => setActiveModuleId(mod.id === activeModuleId ? null : mod.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl transition-all group",
                  activeModuleId === mod.id ? "bg-white/5 text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <span className="text-sm font-black uppercase tracking-widest line-clamp-1">{mod.title}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", activeModuleId === mod.id ? "rotate-180" : "")} />
              </button>
              
              <AnimatePresence>
                {activeModuleId === mod.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-1 pl-2 border-l border-white/5 ml-3"
                  >
                    {lessons.filter(l => l.moduleId === mod.id).map((lesson, idx) => (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLessonId(lesson.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl transition-all group text-left",
                          activeLessonId === lesson.id ? "bg-blue-600/10 text-blue-400" : "hover:bg-white/5 text-zinc-400"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                          activeLessonId === lesson.id ? "border-blue-500 text-blue-500" : "border-zinc-800 text-zinc-600 group-hover:border-zinc-600"
                        )}>
                          <span className="text-[10px] font-black">{idx + 1}</span>
                        </div>
                        <span className="text-sm font-bold leading-tight flex-1 line-clamp-2">{lesson.title}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar relative px-4 sm:px-8 py-8">
        
        {/* Header Content */}
        <div className="max-w-6xl mx-auto w-full mb-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-blue-500 mb-4">
                 <span className="bg-blue-500/10 px-3 py-1 rounded-full">EBD ONLINE</span>
                 <span className="opacity-40">•</span>
                 <span className="opacity-60">{modules.find(m => m.id === activeModuleId)?.title || "EBD"}</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-4 leading-none">
                {currentLesson?.title || "Selecione uma aula"}
              </h1>
              <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed font-medium">
                {currentLesson?.description || "Explore o conteúdo bíblico preparado para o seu crescimento espiritual."}
              </p>
            </div>
            
            {currentLesson?.transcript && (
              <Button 
                onClick={generateSupportMaterial} 
                disabled={isGeneratingPdf}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl h-16 px-8 font-black text-lg transition-all active:scale-95 shrink-0 shadow-xl shadow-blue-600/20"
              >
                {isGeneratingPdf ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <FileDown className="w-6 h-6 mr-3" />}
                {pdfGenerationStatus || "Baixar Material"}
              </Button>
            )}
          </div>

          {!currentLesson ? (
            <div className="bg-white/5 border border-white/5 rounded-[40px] p-20 text-center flex flex-col items-center justify-center min-h-[500px]">
               <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8">
                  <MonitorPlay className="w-12 h-12 text-zinc-600" />
               </div>
               <h3 className="text-2xl font-black mb-4">Bem-vindo ao Portal EBD</h3>
               <p className="text-zinc-500 max-w-sm font-medium">Selecione uma aula no menu lateral para visualizar o vídeo e o material de apoio.</p>
               <Button onClick={() => setIsSidebarOpen(true)} variant="link" className="text-blue-500 mt-6 md:hidden">Abrir Menu</Button>
            </div>
          ) : (
            <div className="space-y-12">
              
              {/* Video Player Section */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-blue-600/5 rounded-[50px] blur-3xl pointer-events-none group-hover:bg-blue-600/10 transition-colors" />
                <div className="relative aspect-video bg-black rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
                  {currentLesson.youtubeUrl ? (
                    <iframe
                      key={currentLesson.id}
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYoutubeId(currentLesson.youtubeUrl)}?rel=0&modestbranding=1`}
                      title={currentLesson.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700">
                      <PlayCircle className="w-20 h-20 mb-6 opacity-20" />
                      <p className="font-black text-xl">Vídeo Indisponível</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Sections: Quiz & Q&A */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Quiz Section */}
                <div className="bg-[#0c0c0c] border border-white/5 rounded-[40px] p-8 sm:p-10">
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">Quiz de Aproveitamento</h2>
                      <p className="text-zinc-500 text-sm font-medium">Teste o que aprendeu nesta aula.</p>
                    </div>
                  </div>

                  {activeTest ? (
                    <div className="space-y-8">
                       <h3 className="text-xl font-bold leading-relaxed">{activeTest.question}</h3>
                       <div className="space-y-4">
                         {activeTest.options.map((option: string, idx: number) => {
                           const userAns = userAnswers.find(a => a.userId === user.uid && a.testId === activeTest.id);
                           const isSelected = userAns?.answerIndex === idx;
                           const isCorrect = idx === activeTest.correctAnswerIndex;
                           const showResults = !!userAns;

                           return (
                             <button
                               key={idx}
                               disabled={showResults}
                               onClick={async () => {
                                 try {
                                   await addDoc(collection(db, "ebd-test-answers"), {
                                     testId: activeTest.id,
                                     lessonId: activeLessonId,
                                     userId: user.uid,
                                     userName: profile?.name || user.displayName || "Visitante",
                                     answerIndex: idx,
                                     isCorrect: idx === activeTest.correctAnswerIndex,
                                     createdAt: serverTimestamp()
                                   });
                                 } catch (e) {
                                   console.error(e);
                                 }
                               }}
                               className={cn(
                                 "w-full text-left p-5 rounded-3xl border-2 transition-all duration-300 flex items-center justify-between group",
                                 !showResults && "border-zinc-800 bg-white/5 hover:border-blue-500/50 hover:bg-blue-500/5",
                                 showResults && isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-400",
                                 showResults && isSelected && !isCorrect && "border-red-500 bg-red-500/10 text-red-400",
                                 showResults && !isSelected && !isCorrect && "border-zinc-900 bg-transparent opacity-40"
                               )}
                             >
                               <span className="font-bold text-lg">{option}</span>
                               <div className={cn(
                                 "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                                 !showResults && "border-zinc-700 group-hover:border-blue-500",
                                 showResults && isCorrect && "border-emerald-500 bg-emerald-500",
                                 showResults && isSelected && !isCorrect && "border-red-500 bg-red-500",
                                 showResults && !isSelected && !isCorrect && "border-zinc-800"
                               )}>
                                 {showResults && (isCorrect || isSelected) && (
                                   isCorrect ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Circle className="w-4 h-4 text-white fill-current" />
                                 )}
                               </div>
                             </button>
                           )
                         })}
                       </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center bg-white/2 rounded-[30px] border border-white/5 border-dashed">
                       <Lock className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                       <p className="text-zinc-600 font-bold">Nenhum quiz para esta aula.</p>
                    </div>
                  )}
                </div>

                {/* Q&A Section */}
                <div className="bg-[#0c0c0c] border border-white/5 rounded-[40px] p-8 sm:p-10 flex flex-col h-full max-h-[700px]">
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">Dúvidas</h2>
                      <p className="text-zinc-500 text-sm font-medium">Interaja com o professor.</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mb-8">
                     <Textarea 
                       placeholder="Sua dúvida ou comentário aqui..." 
                       value={questionText}
                       onChange={e => setQuestionText(e.target.value)}
                       className="bg-white/3 border-white/5 rounded-3xl min-h-[120px] p-6 text-lg focus:bg-white/5 transition-all text-white"
                     />
                     <Button 
                       onClick={handleAskQuestion}
                       disabled={!questionText.trim()}
                       className="bg-white text-black hover:bg-zinc-200 rounded-2xl h-14 font-black px-10 shadow-lg"
                     >
                       Postar Dúvida
                     </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                     {activeLessonQuestions.map(q => (
                       <div key={q.id} className="p-6 rounded-3xl bg-white/2 border border-white/5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                               <img src={getImageUrl(q.userPhoto || null)} className="w-8 h-8 rounded-full border border-white/20" alt="" />
                               <span className="font-bold text-sm tracking-tight">{q.userName}</span>
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest opacity-30">
                              {q.createdAt?.toDate ? format(q.createdAt.toDate(), "dd MMM") : ''}
                            </span>
                          </div>
                          <p className="text-zinc-400 leading-relaxed font-medium mb-4">{q.question}</p>
                          
                          {q.answer && (
                            <div className="mt-4 p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                               <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 block mb-2">Professor</span>
                               <p className="text-sm font-medium text-zinc-300 italic">{q.answer}</p>
                            </div>
                          )}

                          {isAdmin && !q.answer && (
                            <div className="mt-4">
                               <AnswerInput onSend={(text) => handleAnswerQuestion(q.id, text)} />
                            </div>
                          )}
                       </div>
                     ))}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      </main>

    </div>
  );
}

function AnswerInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  return (
    <div className="flex gap-2">
      <Input 
        value={text} 
        onChange={e => setText(e.target.value)} 
        placeholder="Responder dúvida..." 
        className="bg-zinc-900 border-white/5 rounded-xl h-10 text-xs" 
      />
      <Button 
        size="sm" 
        onClick={() => { onSend(text); setText(''); }}
        disabled={!text.trim()}
        className="bg-blue-600 font-bold px-4 rounded-xl shrink-0"
      >
        OK
      </Button>
    </div>
  );
}
