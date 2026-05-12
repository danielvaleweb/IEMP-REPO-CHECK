import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import ReactPlayer from 'react-player';
import { BookOpen, PlayCircle, Plus, Trash2, Edit, MessageCircle, FileText, Send, CheckCircle2, Circle, GraduationCap, ArrowLeft, ChevronRight, Lock, User } from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCachedCollection, useCachedDoc } from '@/hooks/useFirestore';
import { firestoreService } from '@/services/firestoreService';

const Player = ReactPlayer as any;
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

export default function EBD() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const [questionText, setQuestionText] = useState('');
  
  // Test Data
  const [activeTest, setActiveTest] = useState<any>(null);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);

  const { data: modulesData } = useCachedCollection<any>("ebd-modules", [orderBy("createdAt", "asc")], 1000 * 60 * 60);
  const { data: lessonsData } = useCachedCollection<any>("ebd-lessons", [orderBy("createdAt", "asc")], 1000 * 60 * 30);
  const { data: questionsData } = useCachedCollection<any>("ebd-questions", [orderBy("createdAt", "desc")], 1000 * 60 * 5); // Questions more frequent
  const { data: testData } = useCachedDoc<any>("ebd-tests", activeLessonId || undefined, 1000 * 60 * 60);

  useEffect(() => {
    if (modulesData) {
      setModules(modulesData);
      if (modulesData.length > 0 && !activeModuleId) {
        setActiveModuleId(modulesData[0].id);
      }
    }
  }, [modulesData]);

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
    if (!activeLessonId) {
      const modsLessons = lessons.filter(l => l.moduleId === activeModuleId);
      if (modsLessons.length > 0) setActiveLessonId(modsLessons[0].id);
      setActiveTest(null);
      return;
    }

    const fetchAnswers = async () => {
      try {
        const answers = await firestoreService.getCollection<any>(`ebd-test-answers`, [], 1000 * 60 * 5);
        setUserAnswers(answers);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchAnswers();
  }, [activeLessonId, activeModuleId, lessons]);


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

  const handleSubmitAnswer = async (index: number) => {
    if (!user || !activeTest) return;
    try {
      await addDoc(collection(db, "ebd-test-answers"), {
        testId: activeTest.id,
        lessonId: activeLessonId,
        userId: user.uid,
        userName: profile?.name || user.displayName || "Visitante",
        answerIndex: index,
        isCorrect: index === activeTest.correctAnswerIndex,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `ebd-test-answers`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0502] text-white font-sans flex items-center justify-center relative overflow-hidden px-4">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-tr from-[#3b82f6]/20 to-[#8b5cf6]/20 rounded-full blur-[100px] opacity-60 translate-x-1/3 -translate-y-1/3" />
        </div>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center relative z-10 shadow-2xl backdrop-blur-md">
          <GraduationCap className="w-16 h-16 text-[#3b82f6] mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-black mb-4 tracking-tighter">Escola Bíblica</h2>
          <p className="text-white/60 mb-8 font-medium leading-relaxed">
            Faça login para ter acesso aos nossos módulos, vídeos e materiais de apoio da EBD.
          </p>
          <Button onClick={() => navigate("/admin")} className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white rounded-full font-bold px-8 h-12 w-full hover:scale-105 transition-transform">
            Acessar Portal
          </Button>
        </div>
      </div>
    );
  }

  const currentLesson = lessons.find(l => l.id === activeLessonId);
  const activeModuleLessons = lessons.filter(l => l.moduleId === activeModuleId);
  const activeLessonQuestions = questions.filter(q => q.lessonId === activeLessonId);
  
  const userHasAnsweredTest = userAnswers.find(a => a.userId === user?.uid && a.testId === activeTest?.id);

  return (
    <div className="min-h-screen bg-[#0a0502] text-white font-sans flex flex-col md:flex-row pt-20 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
         <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-transparent via-[#3b82f6]/5 to-[#8b5cf6]/5 rounded-full blur-[100px] opacity-60 -translate-x-1/3 -translate-y-1/3" />
      </div>

      {/* Sidebar / Modules */}
      <div className="w-full md:w-80 border-r border-white/10 flex flex-col z-10 relative bg-[#0a0502]/80 backdrop-blur-xl h-[calc(100vh-80px)] overflow-y-auto">
        <div className="p-6 border-b border-white/10 shrink-0">
           <h1 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-2">
             <GraduationCap className="w-6 h-6 text-[#3b82f6]" />
             Portal EBD
           </h1>
           <p className="opacity-50 text-xs">Aprenda e cresça na palavra.</p>
        </div>
        
        <div className="flex-1 p-4 flex flex-col gap-6">
           {modules.map(mod => (
             <div key={mod.id} className="flex flex-col gap-2">
               <div className="flex items-center justify-between mb-2">
                 <button 
                   onClick={() => setActiveModuleId(mod.id)} 
                   className={cn(
                     "text-sm font-bold uppercase tracking-widest transition-colors flex-1 text-left line-clamp-1",
                     activeModuleId === mod.id ? "text-[#3b82f6]" : "text-white/50 hover:text-white"
                   )}
                 >
                   {mod.title}
                 </button>
               </div>

               {activeModuleId === mod.id && (
                 <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="flex flex-col gap-1 overflow-hidden">
                   {lessons.filter(l => l.moduleId === mod.id).map((lesson, idx) => (
                     <div key={lesson.id} className="relative group">
                       <button
                         onClick={() => setActiveLessonId(lesson.id)}
                         className={cn(
                           "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                           activeLessonId === lesson.id ? "bg-white/10" : "hover:bg-white/5"
                         )}
                       >
                         <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 border", activeLessonId === lesson.id ? "border-[#3b82f6] text-[#3b82f6]" : "border-white/20 text-white/50")}>
                           <span className="text-[10px] font-bold">{idx + 1}</span>
                         </div>
                         <span className={cn("text-xs font-bold leading-tight flex-1", activeLessonId === lesson.id ? "text-white" : "text-white/60")}>
                           {lesson.title}
                         </span>
                       </button>
                     </div>
                   ))}
                 </motion.div>
               )}
             </div>
           ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col z-10 relative overflow-y-auto h-[calc(100vh-80px)] custom-scrollbar pb-32">
        {currentLesson ? (
          <div className="max-w-5xl mx-auto w-full p-4 sm:p-8">
             
             {/* Player Area */}
             <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative mb-8 border border-white/10">
               {currentLesson.youtubeUrl ? (
                 <Player 
                   url={currentLesson.youtubeUrl} 
                   width="100%" 
                   height="100%" 
                   controls 
                 />
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
                   <PlayCircle className="w-16 h-16 mb-4 opacity-50" />
                   <p className="font-bold">Vídeo não disponível</p>
                 </div>
               )}
             </div>

             <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
               <div className="flex-1">
                 <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 leading-tight">{currentLesson.title}</h1>
                 {currentLesson.description && (
                   <p className="text-white/60 leading-relaxed text-sm">{currentLesson.description}</p>
                 )}
               </div>
               
               {currentLesson.supportMaterialUrl && (
                 <a 
                   href={currentLesson.supportMaterialUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="shrink-0 flex items-center gap-3 px-6 py-4 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 transition-colors rounded-2xl border border-[#3b82f6]/30 text-[#3b82f6] font-bold group"
                 >
                   <FileText className="w-6 h-6 group-hover:scale-110 transition-transform" />
                   <div className="flex flex-col">
                     <span className="text-xs uppercase tracking-widest opacity-80">Material</span>
                     <span>Baixar PDF</span>
                   </div>
                 </a>
               )}
             </div>

             {/* Content Tabs (Quiz & Questions) */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               
               {/* Teste seus conhecimentos */}
               <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5">
                   <BookOpen className="w-32 h-32" />
                 </div>
                 
                 <div className="flex items-center justify-between mb-6 relative z-10">
                   <h2 className="text-xl font-bold flex items-center gap-2">
                     <CheckCircle2 className="w-5 h-5 text-[#3b82f6]" /> 
                     Teste seus Conhecimentos
                   </h2>
                 </div>

                 {activeTest ? (
                   <div className="relative z-10">
                     <p className="text-lg font-medium mb-6 leading-relaxed">{activeTest.question}</p>
                     
                     <div className="flex flex-col gap-3">
                       {activeTest.options.map((option: string, idx: number) => {
                         const isSelected = userHasAnsweredTest?.answerIndex === idx;
                         const isCorrectOption = idx === activeTest.correctAnswerIndex;
                         const showColors = !!userHasAnsweredTest;

                         return (
                           <button
                             key={idx}
                             disabled={!!userHasAnsweredTest}
                             onClick={() => handleSubmitAnswer(idx)}
                             className={cn(
                               "text-left px-5 py-4 rounded-2xl border transition-all flex items-center gap-3",
                               !showColors && "border-white/10 hover:bg-white/5 bg-black/20",
                               showColors && isCorrectOption && "border-green-500/50 bg-green-500/10",
                               showColors && !isCorrectOption && isSelected && "border-red-500/50 bg-red-500/10 opacity-70",
                               showColors && !isCorrectOption && !isSelected && "border-white/5 opacity-30"
                             )}
                           >
                             <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", 
                               !showColors && "border-white/20",
                               showColors && isCorrectOption && "border-green-500",
                               showColors && !isCorrectOption && isSelected && "border-red-500",
                               showColors && !isCorrectOption && !isSelected && "border-white/10"
                             )}>
                               {showColors && isCorrectOption && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                             </div>
                             <span className={cn("text-sm", showColors && isCorrectOption && "text-green-500 font-bold")}>{option}</span>
                           </button>
                         )
                       })}
                     </div>

                     <AnimatePresence>
                       {userHasAnsweredTest && (
                         <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className={cn("mt-6 p-4 rounded-2xl flex items-center gap-3", userHasAnsweredTest.isCorrect ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                           {userHasAnsweredTest.isCorrect ? (
                             <>
                               <CheckCircle2 className="w-5 h-5 shrink-0" />
                               <span className="text-sm font-bold">Parabéns! Você acertou a resposta!</span>
                             </>
                           ) : (
                             <>
                               <Circle className="w-5 h-5 shrink-0" />
                               <span className="text-sm font-bold">Que pena, você errou. Tente prestar mais atenção na próxima aula.</span>
                             </>
                           )}
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                 ) : (
                   <div className="text-center py-10 opacity-50 relative z-10 flex flex-col items-center">
                     <Lock className="w-8 h-8 mb-3 opacity-50" />
                     <p className="text-sm">Nenhum teste configurado para esta aula.</p>
                   </div>
                 )}
               </div>

               {/* Q&A */}
               <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col relative">
                 <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                   <MessageCircle className="w-5 h-5 text-[#8b5cf6]" /> 
                   Dúvidas da Aula
                 </h2>

                 <div className="flex gap-3 mb-8">
                   {profile?.photo || user?.photoURL ? (
                     <img src={getImageUrl(profile?.photo || user?.photoURL)} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                   ) : (
                     <div className="w-10 h-10 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-xs border border-white/5"><User className="w-5 h-5 text-zinc-500" /></div>
                   )}
                   <div className="flex-1 flex flex-col gap-2">
                     <Textarea 
                       placeholder="Deixe sua dúvida sobre a aula..." 
                       value={questionText}
                       onChange={e => setQuestionText(e.target.value)}
                       className="bg-black/20 border-white/10 rounded-2xl min-h-[80px] text-sm resize-none focus:bg-white/5"
                     />
                     <Button 
                       onClick={handleAskQuestion}
                       disabled={!questionText.trim()}
                       className="self-end bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl h-10 px-6 font-bold"
                     >
                       <Send className="w-4 h-4 mr-2" /> Enviar
                     </Button>
                   </div>
                 </div>

                 <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                   {activeLessonQuestions.map(q => (
                     <div key={q.id} className="flex flex-col gap-3">
                       <div className="flex gap-3">
                         {q.userPhoto ? (
                           <img src={getImageUrl(q.userPhoto)} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                         ) : (
                           <div className="w-8 h-8 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-xs border border-white/5"><User className="w-4 h-4 text-zinc-500" /></div>
                         )}
                         <div className="flex flex-col">
                           <div className="flex items-center gap-2">
                             <span className="text-xs font-bold leading-none">{q.userName === "Anônimo" || q.userName === "Usuário" ? "Visitante" : q.userName}</span>
                             <span className="text-[10px] opacity-40">{q.createdAt?.toDate ? format(q.createdAt.toDate(), "dd/MM 'às' HH:mm") : ''}</span>
                           </div>
                           <p className="text-sm mt-1 leading-relaxed opacity-80">{q.question}</p>
                         </div>
                       </div>

                       {q.answer && (
                         <div className="flex gap-3 ml-11 p-4 bg-[#8b5cf6]/10 rounded-2xl rounded-tl-none border border-[#8b5cf6]/20">
                           <div className="flex flex-col">
                             <span className="text-xs font-bold text-[#8b5cf6] mb-1">Resposta do Professor</span>
                             <p className="text-sm leading-relaxed opacity-90">{q.answer}</p>
                           </div>
                         </div>
                       )}

                       {isAdmin && !q.answer && (
                         <div className="ml-11 mt-1">
                           <AnswerInput onSend={(text) => handleAnswerQuestion(q.id, text)} />
                         </div>
                       )}
                     </div>
                   ))}
                   {activeLessonQuestions.length === 0 && (
                     <div className="text-center py-10 opacity-50 relative z-10 flex flex-col items-center">
                       <span className="text-sm">Seja o primeiro a tirar uma dúvida!</span>
                     </div>
                   )}
                 </div>

               </div>
               
             </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/50 h-full p-8 text-center min-h-[50vh]">
            <BookOpen className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">Selecione um módulo e uma aula no menu lateral para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Small localized component to keep states clean
function AnswerInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  return (
    <div className="flex gap-2 items-center">
      <Input 
        value={text} onChange={e=>setText(e.target.value)} 
        placeholder="Escreva a resposta..." 
        className="h-10 bg-white/5 border-white/10 rounded-xl flex-1 text-sm text-white" 
      />
      <Button size="sm" onClick={() => { onSend(text); setText(''); }} className="bg-[#8b5cf6] text-white hover:bg-[#7c3aed] rounded-xl"><Send className="w-4 h-4 mr-2" /> Responder</Button>
    </div>
  );
}
