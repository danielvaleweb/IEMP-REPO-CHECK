import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, Eye, EyeOff, CheckCircle2, Lock, Loader2, AlertCircle, Sparkles, Check } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { firestoreService } from '@/services/firestoreService';
import { cn } from '@/lib/utils';

export default function ResetarSenha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loginData, setLoginData] = useState<any>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if dark mode is enabled in the body or document
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') || 
                         document.body.classList.contains('dark') || 
                         localStorage.getItem('theme') === 'dark' || 
                         true; // Default to dark for this app's style
      setIsDark(isDarkMode);
    };
    checkTheme();
  }, []);

  useEffect(() => {
    const fetchAccountData = async () => {
      if (!id) {
        setError('Link de redefinição inválido ou incompleto.');
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'saved-logins', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setLoginData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('A conta para a qual você está tentando redefinir a senha não foi encontrada.');
        }
      } catch (err: any) {
        console.error('Erro ao buscar conta:', err);
        setError('Ocorreu um erro ao carregar os dados da conta. Verifique sua conexão.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Por favor, insira a nova senha.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setSaving(true);

    try {
      // 1. Update the saved-logins document
      const loginRef = doc(db, 'saved-logins', id!);
      await updateDoc(loginRef, {
        password: password,
        updatedAt: serverTimestamp()
      });
      firestoreService.clearCache('saved-logins');

      // 2. Update the corresponding members document if it exists
      if (loginData?.username) {
        const username = loginData.username.trim();
        const q1 = query(collection(db, 'members'), where('email', '==', username));
        const q2 = query(collection(db, 'members'), where('email', '==', username.toLowerCase().trim()));
        
        const [snap1, snap2] = await Promise.all([
          getDocs(q1),
          getDocs(q2)
        ]);

        const uniqueDocs = new Map<string, any>();
        snap1.docs.forEach(d => uniqueDocs.set(d.id, d));
        snap2.docs.forEach(d => uniqueDocs.set(d.id, d));

        if (uniqueDocs.size > 0) {
          const promises: Promise<any>[] = [];
          uniqueDocs.forEach((memberDoc, memberId) => {
            const memberRef = doc(db, 'members', memberId);
            promises.push(
              updateDoc(memberRef, {
                signupPassword: password,
                updatedAt: serverTimestamp()
              })
            );
          });
          
          await Promise.all(promises);
          firestoreService.clearCache('members');
        }
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      setError('Não foi possível salvar a nova senha. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("min-h-[90vh] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500", isDark ? "bg-[#0B0B0E]" : "bg-gray-50")}>
      
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#BF76FF]/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7300FF]/10 rounded-full blur-[100px] pointer-events-none animate-pulse delay-700" />

      <Card className={cn(
        "w-full max-w-md rounded-[32px] border p-8 relative z-10 transition-all duration-300 backdrop-blur-md shadow-2xl",
        isDark ? "bg-[#141418]/80 border-white/5 shadow-black/40" : "bg-white/90 border-black/5 shadow-gray-200/50"
      )}>
        
        {/* Glow corner element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#BF76FF]/20 to-transparent rounded-bl-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <Loader2 className="w-12 h-12 text-[#BF76FF] animate-spin" />
              <p className={cn("text-sm font-bold tracking-wider uppercase", isDark ? "text-gray-400" : "text-gray-500")}>Carregando Conta...</p>
            </motion.div>
          ) : error && !success ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center py-6"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 text-red-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className={cn("text-2xl font-black mb-3 tracking-tight", isDark ? "text-white" : "text-black")}>
                Ops! Ocorreu um Erro
              </h3>
              <p className={cn("text-sm font-medium mb-8 leading-relaxed max-w-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                {error}
              </p>
              <Button 
                onClick={() => navigate('/')} 
                className="h-14 px-8 rounded-2xl font-bold bg-[#BF76FF] text-white hover:bg-[#A05ADB] w-full shadow-lg shadow-[#BF76FF]/20 transition-all active:scale-[0.98]"
              >
                Voltar ao Início
              </Button>
            </motion.div>
          ) : success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center py-6"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6 text-green-500 border border-green-500/20 relative">
                <Check className="w-10 h-10" />
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2 }}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#BF76FF] text-white flex items-center justify-center"
                >
                  <Sparkles className="w-3 h-3" />
                </motion.div>
              </div>
              
              <h3 className={cn("text-2xl font-black mb-3 tracking-tight", isDark ? "text-white" : "text-black")}>
                Senha Alterada!
              </h3>
              <p className={cn("text-sm font-medium mb-8 leading-relaxed max-w-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                Sua senha foi redefinida com sucesso no banco de dados. Agora você pode fazer login normalmente com a nova senha.
              </p>

              <Button 
                onClick={() => navigate('/admin')} 
                className="h-14 px-8 rounded-2xl font-bold bg-gradient-to-r from-[#BF76FF] to-[#7300FF] text-white hover:opacity-90 w-full shadow-lg shadow-[#7300FF]/25 transition-all active:scale-[0.98]"
              >
                Ir para o Painel de Login
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#BF76FF]/10 flex items-center justify-center mb-4 text-[#BF76FF]">
                  <KeyRound className="w-7 h-7 animate-pulse" />
                </div>
                <h3 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-black")}>
                  Redefinir Senha
                </h3>
                <p className={cn("text-sm font-medium mt-2 leading-relaxed px-4", isDark ? "text-gray-400" : "text-gray-500")}>
                  Defina a sua nova senha de acesso para a conta abaixo.
                </p>

                {loginData && (
                  <div className={cn(
                    "mt-4 px-4 py-2.5 rounded-xl border w-full flex flex-col items-center text-xs font-semibold gap-1",
                    isDark ? "bg-white/5 border-white/5 text-gray-300" : "bg-gray-50 border-black/5 text-gray-700"
                  )}>
                    <span className="text-[10px] uppercase tracking-wider text-[#BF76FF] font-bold">{loginData.title}</span>
                    <span className="opacity-80 font-mono select-all">{loginData.username}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-4 rounded-2xl mb-6 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* New Password Input */}
                <div className="space-y-2 relative">
                  <label className={cn("text-xs font-bold uppercase tracking-widest block", isDark ? "text-gray-400" : "text-gray-500")}>
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className={cn(
                        "h-14 rounded-2xl pr-12 text-base font-semibold transition-all outline-none",
                        isDark ? "bg-cinza-input border-white/5 text-white focus:border-[#BF76FF]/40 focus:ring-1 focus:ring-[#BF76FF]/20" : "bg-white text-black border-black/5 focus:border-[#BF76FF]"
                      )}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#BF76FF] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2 relative">
                  <label className={cn("text-xs font-bold uppercase tracking-widest block", isDark ? "text-gray-400" : "text-gray-500")}>
                    Repetir Nova Senha
                  </label>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirme a nova senha"
                      className={cn(
                        "h-14 rounded-2xl pr-12 text-base font-semibold transition-all outline-none",
                        isDark ? "bg-cinza-input border-white/5 text-white focus:border-[#BF76FF]/40 focus:ring-1 focus:ring-[#BF76FF]/20" : "bg-white text-black border-black/5 focus:border-[#BF76FF]"
                      )}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#BF76FF] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-14 bg-gradient-to-r from-[#BF76FF] to-[#7300FF] hover:opacity-95 text-white rounded-2xl text-base font-bold shadow-lg shadow-[#7300FF]/25 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando Senha...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Redefinir e Salvar
                    </>
                  )}
                </Button>

              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
