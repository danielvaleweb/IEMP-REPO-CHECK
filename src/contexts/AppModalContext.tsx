import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { __registerModalFns } from "@/lib/modalHelpers";

type ModalType = "success" | "error" | "warning" | "info" | "confirm";

interface ModalOptions {
  title?: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
}

interface ModalState extends ModalOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
}

interface AppModalContextType {
  showAlert: (message: string, type?: ModalType, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string, confirmText?: string) => Promise<boolean>;
}

const AppModalContext = createContext<AppModalContextType | null>(null);

export function AppModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({ open: false, message: "" });

  const closeModal = useCallback((result: boolean) => {
    modal.resolve?.(result);
    setModal((prev) => ({ ...prev, open: false }));
  }, [modal]);

  const showAlert = useCallback((message: string, type: ModalType = "info", title?: string): Promise<void> => {
    return new Promise((resolve) => {
      setModal({
        open: true,
        message,
        type,
        title,
        resolve: () => resolve(),
      });
    });
  }, []);

  const showConfirm = useCallback((message: string, title?: string, confirmText?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({
        open: true,
        message,
        type: "confirm",
        title: title ?? "Confirmar",
        confirmText: confirmText ?? "Confirmar",
        cancelText: "Cancelar",
        resolve,
      });
    });
  }, []);

  // Register imperative helpers so non-hook code can call appAlert/appConfirm
  useEffect(() => {
    __registerModalFns(showAlert, showConfirm);
  }, [showAlert, showConfirm]);

  const iconMap: Record<ModalType, { icon: typeof CheckCircle2; color: string; bg: string }> = {
    success: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
    error:   { icon: AlertCircle,  color: "text-red-400",   bg: "bg-red-400/10 border-red-400/20" },
    warning: { icon: AlertTriangle,color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
    info:    { icon: Info,         color: "text-blue-400",  bg: "bg-blue-400/10 border-blue-400/20" },
    confirm: { icon: AlertTriangle,color: "text-[#BF76FF]", bg: "bg-[#BF76FF]/10 border-[#BF76FF]/20" },
  };

  const modalType = modal.type ?? "info";
  const { icon: Icon, color, bg } = iconMap[modalType];

  const confirmBtnStyle =
    modalType === "error"   ? "bg-red-500 hover:bg-red-600 text-white" :
    modalType === "warning" ? "bg-amber-500 hover:bg-amber-600 text-black" :
    modalType === "success" ? "bg-green-500 hover:bg-green-600 text-white" :
    "bg-gradient-to-r from-[#BF76FF] to-pink-500 hover:opacity-90 text-white";

  return (
    <AppModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      <AnimatePresence>
        {modal.open && (
          <motion.div
            key="app-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 sm:p-6"
            style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.55)" }}
            onClick={() => closeModal(false)}
          >
            <motion.div
              key="app-modal-panel"
              initial={{ opacity: 0, y: 60, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className="relative w-full max-w-sm bg-[#10001D] border border-white/10 rounded-[28px] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button for non-confirm */}
              {modalType !== "confirm" && (
                <button
                  onClick={() => closeModal(false)}
                  className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl ${bg} border flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>

              {/* Title */}
              {modal.title && (
                <h3 className="text-white font-black text-lg uppercase tracking-tight mb-2 pr-6">
                  {modal.title}
                </h3>
              )}

              {/* Message */}
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                {modal.message}
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                {modalType === "confirm" && (
                  <Button
                    onClick={() => closeModal(false)}
                    className="flex-1 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold uppercase tracking-widest text-xs cursor-pointer"
                  >
                    {modal.cancelText ?? "Cancelar"}
                  </Button>
                )}
                <Button
                  onClick={() => closeModal(true)}
                  className={`flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-xs border-none shadow-lg cursor-pointer ${confirmBtnStyle}`}
                >
                  {modal.confirmText ?? (modalType === "confirm" ? "Confirmar" : "OK")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppModalContext.Provider>
  );
}

export function useAppModal() {
  const ctx = useContext(AppModalContext);
  if (!ctx) throw new Error("useAppModal must be used inside AppModalProvider");
  return ctx;
}
