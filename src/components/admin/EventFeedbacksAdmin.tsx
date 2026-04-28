import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { handleFirestoreError, OperationType } from '@/lib/firebase';

export function EventFeedbacksAdmin({ eventId, isDark }: { eventId: string; isDark: boolean }) {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const q = query(
          collection(db, "event_feedbacks"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((f: any) => f.eventId === eventId);
        setFeedbacks(data);
      } catch (err) {
        console.error("Error fetching feedbacks:", err);
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchFeedbacks();
  }, [eventId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Realmente deseja excluir este feedback?")) return;
    try {
      await deleteDoc(doc(db, "event_feedbacks", id));
      setFeedbacks(feedbacks.filter(f => f.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `event_feedbacks/${id}`);
    }
  };

  if (loading) return null;
  if (feedbacks.length === 0) return null;

  return (
    <div className={cn("mt-12 p-6 rounded-3xl border", isDark ? "bg-[#1f1f1f] border-white/10" : "bg-gray-50 border-black/10")}>
      <h3 className={cn("text-xl font-black uppercase tracking-widest mb-6", isDark ? "text-white" : "text-black")}>Feedbacks do Evento</h3>
      <div className="space-y-4">
        {feedbacks.map((f, i) => (
          <div key={i} className={cn("p-4 rounded-xl border flex gap-4 items-start", isDark ? "bg-[#111] border-white/5" : "bg-white border-black/5 shadow-sm")}>
            <img src={f.userPhoto || "https://api.dicebear.com/7.x/avataaars/svg?seed=Anon"} alt={f.userName} className="w-10 h-10 rounded-full shrink-0 object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={cn("font-bold text-sm", isDark ? "text-white" : "text-black")}>{f.userName}</span>
                <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>{new Date(f.date).toLocaleDateString()}</span>
              </div>
              <div className="flex text-yellow-400 my-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("w-3 h-3", i < f.rating ? "fill-current" : "text-gray-400")} />
                ))}
              </div>
              {f.comment && <p className={cn("text-sm mt-2 whitespace-pre-wrap", isDark ? "text-gray-300" : "text-gray-600")}>{f.comment}</p>}
            </div>
            <Button 
              variant="ghost" 
              onClick={() => handleDelete(f.id)}
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-full w-10 h-10 p-0 shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
