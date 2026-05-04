import { useNavigate } from "react-router-dom";
import { Hammer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ConstructionViewProps {
  title: string;
}

export default function ConstructionView({ title }: ConstructionViewProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-[#1a1a1a] p-8 rounded-[2.5rem] shadow-xl border border-black/5 dark:border-white/5"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <Hammer className="w-10 h-10 text-primary animate-bounce shadow-glow" />
        </div>
        
        <h1 className="text-3xl font-black mb-4 tracking-tighter uppercase dark:text-white">
          {title}
        </h1>
        
        <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
          Esta página está em desenvolvimento para trazer a melhor experiência para você. Em breve teremos novidades aqui!
        </p>

        <Button 
          onClick={() => navigate('/')}
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
        >
          <ArrowLeft className="w-6 h-6" />
          Voltar para o Início
        </Button>
      </motion.div>
    </div>
  );
}
