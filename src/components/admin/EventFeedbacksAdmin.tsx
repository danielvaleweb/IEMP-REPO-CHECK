import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Star, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { handleFirestoreError, OperationType } from '@/lib/firebase';

export function EventFeedbacksAdmin({ eventId, isDark }: { eventId?: string; isDark: boolean }) {
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
        let data = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((f: any) => f.eventId === eventId);
        
        try {
          const membersSnap = await getDocs(collection(db, "members"));
          const membersMap: Record<string, string> = {};
          membersSnap.docs.forEach(d => {
            const memberData = d.data();
            if (memberData.photoURL) membersMap[d.id] = memberData.photoURL;
          });
          data = data.map((f: any) => ({
            ...f,
            userPhoto: membersMap[f.userId] || f.userPhoto
          }));
        } catch(e) {
          console.error("Error fetching members for feedbacks admin", e);
        }

        setFeedbacks(data);
      } catch (err) {
        console.error("Error fetching feedbacks:", err);
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchFeedbacks();
  }, [eventId]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div className={cn("mt-12 p-6 rounded-3xl border", isDark ? "bg-[#1C1C1C] border-white/10 shadow-2xl" : "bg-gray-50 border-black/10")}>
      <h3 className={cn("text-xl font-black uppercase tracking-widest mb-6", isDark ? "text-white" : "text-black")}>Feedbacks do Evento</h3>
      <div className="space-y-4">
        {feedbacks.map((f, i) => {
          const displayName = f.userName === "Anônimo" ? "Visitante" : f.userName;
          const hasPhoto = f.userPhoto && !f.userPhoto.includes('dicebear');
          
          return (
            <div key={i} className={cn("p-4 rounded-xl border flex gap-4 items-start transition-colors", isDark ? "bg-white/[0.03] border-white/5" : "bg-white border-black/5 shadow-sm")}>
              {hasPhoto ? (
                <img src={f.userPhoto} alt={displayName} className="w-10 h-10 rounded-full shrink-0 object-cover border border-white/10" />
              ) : (
                <div className={cn("w-10 h-10 rounded-full shrink-0 flex items-center justify-center border", isDark ? "bg-white/5 border-white/10" : "bg-gray-100 border-black/5")}>
                  <User className={cn("w-5 h-5", isDark ? "text-white/20" : "text-gray-400")} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn("font-bold text-sm", isDark ? "text-white/90" : "text-black")}>{displayName}</span>
                  <span className={cn("text-xs font-medium", isDark ? "text-white/20" : "text-gray-400")}>{new Date(f.date).toLocaleDateString()}</span>
                </div>
                <div className="flex text-yellow-500 my-1 drop-shadow-sm">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("w-3.5 h-3.5", i < f.rating ? "fill-current" : "text-gray-600")} />
                  ))}
                </div>
                {f.comment && <p className={cn("text-sm mt-3 whitespace-pre-wrap leading-relaxed", isDark ? "text-white/60" : "text-gray-600")}>{f.comment}</p>}
              </div>
              <Button 
                variant="ghost" 
                onClick={(e) => handleDelete(f.id, e)}
                className="text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-full w-10 h-10 p-0 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
