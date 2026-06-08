import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function ClearCache() {
  const navigate = useNavigate();

  useEffect(() => {
    const clearAllCache = async () => {
      try {
        // 1. Limpar LocalStorage e SessionStorage (onde ficam os caches do Firebase do app)
        localStorage.clear();
        sessionStorage.clear();

        // 2. Desregistrar Service Workers (se houver algum PWA antigo)
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        }

        // 3. Limpar Cache API do navegador
        if ('caches' in window) {
          const keys = await caches.keys();
          for (const key of keys) {
            await caches.delete(key);
          }
        }

        // Aguarda um pequeno instante para mostrar que algo aconteceu
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 4. Redirecionar para a home com um timestamp na URL para forçar recarregamento sem cache do HTML
        window.location.href = `/?refresh=${new Date().getTime()}`;

      } catch (error) {
        console.error("Erro ao limpar cache:", error);
        // Fallback de segurança
        window.location.href = "/";
      }
    };

    clearAllCache();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
      <Loader2 className="w-12 h-12 text-[#BF76FF] animate-spin mb-4" />
      <h2 className="text-2xl font-black uppercase tracking-widest text-center">Atualizando Sistema...</h2>
      <p className="text-gray-400 mt-2 text-center max-w-sm">Estamos limpando os arquivos antigos do seu celular para garantir que você veja a versão mais recente.</p>
    </div>
  );
}
