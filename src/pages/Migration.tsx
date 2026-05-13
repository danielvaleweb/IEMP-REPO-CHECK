import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, AlertTriangle, CheckCircle2, Play, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Initialize the secondary firebase app
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  writeBatch,
  query,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  orderBy
} from 'firebase/firestore';
import { db as oldDb } from '@/lib/firebase'; // The current app database

const COLLECTIONS_TO_MIGRATE = [
  'posts',
  'videos',
  'users',
  'settings',
  'events',
  'favorites',
  'members',
  'gallery',
  'avisos',
  'departamentos'
];

export default function Migration() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(true);

  // New Firebase configs
  const [newProjectId, setNewProjectId] = useState("iemp-app-494618");
  const [newAppId, setNewAppId] = useState("");
  const [newApiKey, setNewApiKey] = useState("");

  const [isRunning, setIsRunning] = useState(false);
  const [currentCollection, setCurrentCollection] = useState("");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [totalMigrated, setTotalMigrated] = useState(0);

  useEffect(() => {
    // Basic protection
    if (profile && profile.role !== 'Admin' && profile.role !== 'Presidente' && profile.role !== 'Pastor') {
      // In a real scenario, strictly verify the user
      // setHasAccess(false);
    }
  }, [profile]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    setTimeout(() => {
      const scrollEl = document.getElementById('log-scroll');
      if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
    }, 100);
  };

  const getNewApp = () => {
    const config = {
      apiKey: newApiKey,
      projectId: newProjectId,
      appId: newAppId,
      authDomain: `${newProjectId}.firebaseapp.com`,
      storageBucket: `${newProjectId}.firebasestorage.app`,
    };

    try {
      return getApp('migrator');
    } catch {
      return initializeApp(config, 'migrator');
    }
  };

  const startMigration = async () => {
    if (!newProjectId || !newAppId || !newApiKey) {
      addLog("⚠️ Erro: Preencha todos os campos do novo Firebase.");
      return;
    }

    setIsRunning(true);
    setIsFinished(false);
    setLogs([]);
    setTotalMigrated(0);
    setProgress(0);

    addLog("Iniciando migração de banco de dados...");
    addLog(`Origem: ${process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0162085067'}`);
    addLog(`Destino: ${newProjectId}`);

    let totalDocCount = 0;

    try {
      const newApp = getNewApp();
      const newDb = getFirestore(newApp);

      for (const colName of COLLECTIONS_TO_MIGRATE) {
        setCurrentCollection(colName);
        addLog(`Migrando coleção: [${colName}]`);
        
        let hasMore = true;
        let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
        const BATCH_SIZE = 100; // Safe threshold for Firestore batch (max 500)
        let collectionCount = 0;

        while (hasMore) {
          let q = query(collection(oldDb, colName), limit(BATCH_SIZE));
          
          if (lastDoc) {
             q = query(collection(oldDb, colName), startAfter(lastDoc), limit(BATCH_SIZE));
          }

          let retries = 3;
          let snapshot;
          while (retries > 0) {
            try {
              snapshot = await getDocs(q);
              break;
            } catch (err: any) {
              retries--;
              addLog(`⚠️ Erro ao ler lote de ${colName}. Tentativas restantes: ${retries} - ${err.message}`);
              if (retries === 0) throw err;
              await new Promise(r => setTimeout(r, 2000));
            }
          }

          if (!snapshot || snapshot.empty) {
            hasMore = false;
            break;
          }

          let commitRetries = 3;
          while (commitRetries > 0) {
            try {
              const batch = writeBatch(newDb);
              
              // Preservar IDs
              snapshot.docs.forEach((document) => {
                const docRef = doc(newDb, colName, document.id);
                // setDoc with merge: true evita remoção de dados caso já exista e foi atualizado
                batch.set(docRef, document.data(), { merge: true });
              });

              await batch.commit();
              break;
            } catch (err: any) {
              commitRetries--;
              addLog(`⚠️ Erro ao gravar lote de ${colName}. Tentativas restantes: ${commitRetries} - ${err.message}`);
              if (commitRetries === 0) throw err;
              await new Promise(r => setTimeout(r, 2000));
            }
          }

          collectionCount += snapshot.size;
          totalDocCount += snapshot.size;
          setTotalMigrated(totalDocCount);
          lastDoc = snapshot.docs[snapshot.docs.length - 1];

          addLog(`  -> Processados ${collectionCount} documentos...`);
        }

        addLog(`✅ Coleção [${colName}] finalizada (${collectionCount} documentos)`);
        setProgress(prev => prev + (100 / COLLECTIONS_TO_MIGRATE.length));
      }

      addLog(`🎉 Migração finalizada com sucesso! Total: ${totalDocCount} documentos.`);
      setIsFinished(true);
      
      // Attempt to save new credentials in backend
      await updateSystemConfig();

    } catch (error: any) {
      console.error(error);
      addLog(`❌ ERRO CRÍTICO: ${error.message}`);
      
      if (error.message.includes("Quota limit exceeded")) {
        addLog("🚨 AVISO: O limite diário GRATUITO de leituras do seu Firebase ANTIGO foi atingido!");
        addLog("Para continuar a migração imediatamente, você precisará ativar o faturamento (plano Blaze) no projeto antigo.");
        addLog("Caso contrário, você precisará aguardar até amanhã para que a cota gratuita seja resetada e tentar novamente.");
      } else {
        addLog("Se ocorreu erro de permissão (Missing or insufficient permissions), atualize as regras de segurança do novo Firebase para permitir gravação.");
      }
    } finally {
      setIsRunning(false);
      setProgress(100);
      setCurrentCollection("");
    }
  };

  const updateSystemConfig = async () => {
    addLog(`🔄 Atualizando configurações do sistema (firebase-applet-config.json)...`);
    
    try {
      const payload = {
        projectId: newProjectId,
        appId: newAppId,
        apiKey: newApiKey,
        authDomain: `${newProjectId}.firebaseapp.com`,
        storageBucket: `${newProjectId}.firebasestorage.app`
      };

      const response = await fetch('/api/admin/update-firebase-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Falha na API de atualização");

      addLog(`✅ Sistema atualizado com sucesso! Reiniciando a plataforma...`);
      setTimeout(() => {
        window.location.reload();
      }, 5000);
      
    } catch (err: any) {
      addLog(`⚠️ Não foi possível alterar o arquivo local automaticamente pelo navegador: ${err.message}`);
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Acesso Negado</h2>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10 mx-auto space-y-8 animate-in fade-in">
      <div className="flex items-center space-x-3 mb-6">
        <Database className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Migração de Sistema</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projeto Destino</CardTitle>
            <CardDescription>
              Insira as chaves do novo projeto do Firebase para copiar os dados originais sem duplicá-los.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project ID</Label>
              <Input 
                value={newProjectId}
                onChange={(e) => setNewProjectId(e.target.value)}
                placeholder="Ex: iemp-app-494618" 
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label>Web App ID</Label>
              <Input 
                value={newAppId}
                onChange={(e) => setNewAppId(e.target.value)}
                placeholder="1:1060640608459:web:..." 
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <Label>API Key (Web)</Label>
              <Input 
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="AIzaSy..." 
                type="password"
                disabled={isRunning}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={startMigration} 
              disabled={isRunning || isFinished} 
              className="w-full bg-[#BF76FF] hover:bg-[#A355E6]"
            >
              {isRunning ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processando {currentCollection}...</>
              ) : isFinished ? (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Tudo finalizado</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Iniciar Migração Segura</>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
           <CardHeader>
             <CardTitle>Status</CardTitle>
             <CardDescription>Progresso da Migração</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-1">
               <div className="flex justify-between text-sm">
                 <span>Progresso</span>
                 <span>{Math.round(progress)}%</span>
               </div>
               <Progress value={progress} className="h-2" />
             </div>
             
             <div className="text-center pt-4">
               <div className="text-4xl font-bold text-primary">
                 {totalMigrated}
               </div>
               <div className="text-sm text-muted-foreground mt-1">
                 documentos transferidos
               </div>
             </div>
             
             {isFinished && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="mt-4 p-3 bg-green-500/10 text-green-500 rounded-md flex items-center justify-center text-sm font-medium"
               >
                 <CheckCircle2 className="w-4 h-4 mr-2" />
                 Os dados foram transferidos.
               </motion.div>
             )}
           </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea id="log-scroll" className="h-[300px] w-full rounded-md border bg-black/50 p-4 font-mono text-sm shadow-inner">
            {logs.length === 0 ? (
              <span className="text-muted-foreground italic">Aguardando inicialização...</span>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-green-400 mb-1 leading-tight">{log}</div>
              ))
            )}
            
            {isRunning && (
              <div className="flex items-center text-yellow-400 mt-2">
                <Loader2 className="w-3 h-3 animate-spin mr-2" /> Trabalhando...
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
