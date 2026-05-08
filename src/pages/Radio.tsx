import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import ReactPlayer from 'react-player';
import { Play, Pause, SkipForward, SkipBack, Volume2, ListMusic, Plus, Music2, Search, X, Trash2, Edit, Radio as RadioIcon, Youtube, Heart, Speaker } from 'lucide-react';
import { cn, getImageUrl } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

import { useRadio } from '@/contexts/RadioContext';

export default function RadioPage() {
  const { user, profile, isAdmin } = useAuth();
  const { tracks, radioArtists, playlists, settings, isLiveMode, currentTrack, isPlaying, playTrack: handlePlay, playLive, volume, isMuted, hasAccess } = useRadio();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0502] text-white font-sans pb-32 pt-32 flex flex-col items-center justify-center relative overflow-hidden px-4">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-tr from-transparent via-[#BF76FF]/10 to-[#FF4400]/10 rounded-full blur-[100px] opacity-60 translate-x-1/3 -translate-y-1/3" />
        </div>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center relative z-10 shadow-2xl">
          <RadioIcon className="w-16 h-16 text-[#FF4400] mx-auto mb-6 opacity-80" />
          <h2 className="text-2xl font-bold mb-4">Página em Construção</h2>
          <p className="text-white/60 mb-8 font-medium leading-relaxed">
            Estamos preparando novidades incríveis para a Rádio da Igreja! 
            Em breve este recurso estará disponível para todos os membros.
          </p>
          <Button onClick={() => window.location.href = "/"} className="bg-gradient-to-r from-[#BF76FF] to-[#FF4400] text-white rounded-full font-bold px-8 h-12 w-full hover:scale-105 transition-transform">
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  // App state
  const [activeTab, setActiveTab] = useState<'discover' | 'playlists' | 'live'>('discover');
  const [currentPlaylist, setCurrentPlaylist] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [artistProfileOpen, setArtistProfileOpen] = useState<any>(null);
  
  // Derived state
  const artists = React.useMemo(() => {
    const artistMap = new Map();
    
    // First load managed artists
    if (radioArtists && radioArtists.length > 0) {
      radioArtists.forEach(a => {
        if (a.name) {
          artistMap.set(a.name, {
            ...a,
            isManaged: true
          });
        }
      });
    }

    tracks.forEach(t => {
      // Ignore tracks with no artist or generic terms
      const name = t.artist?.trim();
      if (name && name !== "Desconhecido" && !artistMap.has(name)) {
        artistMap.set(name, {
          name: name,
          thumbnail: t.youtubeId ? `https://img.youtube.com/vi/${t.youtubeId}/mqdefault.jpg` : t.thumbnail
        });
      }
    });
    return Array.from(artistMap.values());
  }, [tracks, radioArtists]);

  const top10Tracks = React.useMemo(() => {
    return [...tracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 10);
  }, [tracks]);
  
  // Modals
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [selectedTrackToAdd, setSelectedTrackToAdd] = useState<any>(null);

  const createPlaylist = async () => {
    if (!user || !newPlaylistTitle.trim()) return;
    try {
      await addDoc(collection(db, "playlists"), {
        title: newPlaylistTitle.trim(),
        authorId: user.uid,
        authorName: profile?.name || user.displayName || "Usuário",
        authorPhoto: profile?.photo || user.photoURL || null,
        tracks: [],
        createdAt: serverTimestamp()
      });
      setNewPlaylistTitle('');
      setIsCreatePlaylistOpen(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "playlists");
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    try {
      await deleteDoc(doc(db, "playlists", playlistId));
      if (currentPlaylist?.id === playlistId) {
        setCurrentPlaylist(null);
      }
      setPlaylistToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `playlists/${playlistId}`);
    }
  };

  const addToPlaylist = async (playlistId: string) => {
    if (!selectedTrackToAdd) return;
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    // Check if track already exists
    if (playlist.tracks?.find((t: any) => t.id === selectedTrackToAdd.id)) {
      setIsAddToPlaylistOpen(false);
      return;
    }

    try {
      const updatedTracks = [...(playlist.tracks || []), selectedTrackToAdd];
      await updateDoc(doc(db, "playlists", playlistId), {
        tracks: updatedTracks
      });
      setIsAddToPlaylistOpen(false);
      setSelectedTrackToAdd(null);
      if (currentPlaylist?.id === playlistId) {
        setCurrentPlaylist({ ...currentPlaylist, tracks: updatedTracks });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `playlists/${playlistId}`);
    }
  };

  const removeFromPlaylist = async (playlistId: string, trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    try {
      const updatedTracks = playlist.tracks.filter((t: any) => t.id !== trackId);
      await updateDoc(doc(db, "playlists", playlistId), {
        tracks: updatedTracks
      });
      if (currentPlaylist?.id === playlistId) {
        setCurrentPlaylist({ ...currentPlaylist, tracks: updatedTracks });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `playlists/${playlistId}`);
    }
  };

  const getUrlToPlay = () => {
    if (isLiveMode) {
      return settings?.radioYoutubeLiveUrl || settings?.radioStreamUrl || "";
    }
    if (currentTrack) {
      return currentTrack.youtubeId ? `https://youtube.com/watch?v=${currentTrack.youtubeId}` : currentTrack.rawUrl || currentTrack.youtubeUrl;
    }
    return "";
  };

  const myPlaylists = playlists.filter(p => p.authorId === user?.uid);
  const otherPlaylists = playlists.filter(p => p.authorId !== user?.uid);
  const filteredTracks = tracks.filter(t => {
    const matchesSearch = t.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArtist = selectedArtist ? t.artist === selectedArtist : true;
    return matchesSearch && matchesArtist;
  });

  const selectedArtistData = selectedArtist ? artists.find(a => a.name === selectedArtist) : null;

  return (
    <div className="min-h-screen bg-[#0a0502] text-white font-sans pb-32 pt-20 flex flex-col relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none z-0">
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-tr from-transparent via-[#BF76FF]/10 to-[#FF4400]/10 rounded-full blur-[100px] opacity-60 translate-x-1/3 -translate-y-1/3" />
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#BF76FF]/5 to-transparent rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10 flex-1 flex flex-col">
        {/* Header / Nav */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
              Rádio <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BF76FF] to-[#FF4400]">Profecia</span>
            </h1>
            <p className="opacity-60 text-sm mt-1">Sua plataforma cristã de música e streaming.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 self-start md:self-auto w-full md:w-auto">
            {activeTab === 'discover' && (
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                <input 
                  type="text" 
                  placeholder="Buscar música..." 
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full h-12 sm:h-10 pl-10 pr-10 text-sm focus:outline-none focus:bg-[#BF76FF]/10 focus:border-[#BF76FF]/50 transition-all text-white placeholder:text-white/40"
                />
                {(isSearchFocused || searchQuery) && (
                   <button 
                     onClick={() => { setIsSearchFocused(false); setSearchQuery(''); }}
                     className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[#BF76FF]/20 rounded-full transition-colors"
                   >
                     <X className="w-4 h-4 opacity-70" />
                   </button>
                )}
              </div>
            )}
            <div className="flex bg-white/5 rounded-full p-1 backdrop-blur-md w-full sm:w-auto overflow-x-auto border border-white/10 scrollbar-hide">
              <TabButton active={activeTab === 'discover'} onClick={() => {setActiveTab('discover'); setCurrentPlaylist(null);}}>Descobrir</TabButton>
              <TabButton active={activeTab === 'playlists'} onClick={() => {if(user) {setActiveTab('playlists'); setCurrentPlaylist(null);} else alert("Faça login para criar playlists.")}}>Playlists</TabButton>
              <TabButton active={activeTab === 'live'} onClick={() => {setActiveTab('live'); setCurrentPlaylist(null);}}>Ao Vivo</TabButton>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 pb-10">
          {currentPlaylist ? (
            <PlaylistView 
              playlist={currentPlaylist} 
              onBack={() => setCurrentPlaylist(null)}
              onPlayTrack={(track) => handlePlay(track, currentPlaylist.tracks || [])}
              onPlayAll={() => currentPlaylist.tracks?.length && handlePlay(currentPlaylist.tracks[0], currentPlaylist.tracks)}
              isOwner={currentPlaylist.authorId === user?.uid}
              onRemoveTrack={(trackId, e) => removeFromPlaylist(currentPlaylist.id, trackId, e)}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
            />
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'discover' && (
                <motion.div key="discover" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}}>
                  
                  {/* Top 10 Tracks */}
                  {!(isSearchFocused || searchQuery.trim()) && top10Tracks.length > 0 && (
                    <div className="mb-12">
                      <h2 className="text-2xl font-bold mb-6 tracking-tight">Top Mais Escutadas</h2>
                      <div className="flex gap-10 md:gap-14 overflow-x-auto pb-16 md:pb-20 pt-4 pl-12 md:pl-16 snap-x snap-mandatory scrollbar-hide items-center" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                         {top10Tracks.map((track, i) => (
                           <div key={track.id} className="relative shrink-0 snap-center w-[140px] md:w-[180px] aspect-[3/4] group cursor-pointer" onClick={() => handlePlay(track, top10Tracks)}>
                              <div className="absolute -left-12 md:-left-16 bottom-[-1.5rem] md:bottom-[-2rem] text-[160px] md:text-[220px] font-black leading-none text-[#0a0502] [-webkit-text-stroke:3px_#444] z-0 select-none group-hover:[-webkit-text-stroke:3px_#fff] transition-all tracking-tighter" style={{ letterSpacing: '-0.08em' }}>
                                {i + 1}
                              </div>
                              <div className="relative w-full h-full rounded-md overflow-hidden shadow-2xl z-10 group-hover:scale-105 transition-all duration-500 bg-white/5 border border-white/10">
                                <img src={track.youtubeId ? `https://img.youtube.com/vi/${track.youtubeId}/mqdefault.jpg` : track.thumbnail} alt={track.title} className={cn("w-full h-full object-cover", currentTrack?.id === track.id && "opacity-60")} />
                                <div className={cn("absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity", currentTrack?.id === track.id ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                                  <div className="w-12 h-12 rounded-full bg-[#BF76FF] text-white flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 shrink-0">
                                    {isPlaying && currentTrack?.id === track.id ? <Speaker className="w-5 h-5 animate-pulse shrink-0" /> : <Play className="w-5 h-5 ml-1 fill-current shrink-0" />}
                                  </div>
                                </div>
                              </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  )}

                  {/* Artists Circular List */}
                  {!(isSearchFocused || searchQuery.trim()) && artists.length > 0 && (
                    <div className="mb-12">
                      <h2 className="text-2xl font-bold mb-6 tracking-tight">Artistas</h2>
                      <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                        <div 
                          className="shrink-0 flex flex-col items-center gap-3 cursor-pointer group"
                          onClick={() => setSelectedArtist(null)}
                        >
                          <div className={cn("w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center border-4 transition-all duration-300", selectedArtist === null ? "border-[#BF76FF] bg-[#BF76FF]/20" : "border-transparent bg-white/5 group-hover:border-white/20")}>
                            <ListMusic className={cn("w-8 h-8", selectedArtist === null ? "text-[#BF76FF]" : "text-white/50")} />
                          </div>
                          <span className={cn("text-sm font-bold", selectedArtist === null ? "text-[#BF76FF]" : "text-white/60")}>Todos</span>
                        </div>
                        
                        {artists.map((artist, i) => (
                          <div 
                            key={i} 
                            className="shrink-0 flex flex-col items-center gap-3 cursor-pointer group"
                            onClick={() => setSelectedArtist(artist.name)}
                          >
                            <div className={cn("w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 transition-all duration-300", selectedArtist === artist.name ? "border-[#BF76FF] scale-105" : "border-transparent group-hover:border-white/20")}>
                              <img src={artist.thumbnail || "/placeholder.jpg"} alt={artist.name} className="w-full h-full object-cover" />
                            </div>
                            <span className={cn("text-sm font-bold max-w-[100px] text-center truncate", selectedArtist === artist.name ? "text-[#BF76FF]" : "text-white/80 group-hover:text-white")}>{artist.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Featured / Global Playlist */}
                  <div className="mb-12">
                     {!(isSearchFocused || searchQuery.trim()) && selectedArtistData && selectedArtistData.isManaged && (
                       <div className="mb-8 p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                         <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shrink-0 border-4 border-white/10">
                           <img src={selectedArtistData.thumbnail || "/placeholder.jpg"} alt={selectedArtistData.name} className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1 flex flex-col justify-center min-h-[160px]">
                           <h3 className="text-3xl font-black tracking-tight mb-2">{selectedArtistData.name}</h3>
                           {selectedArtistData.bio && (
                             <p className="text-white/70 max-w-2xl mb-4 text-sm leading-relaxed">{selectedArtistData.bio}</p>
                           )}
                           {selectedArtistData.instagram && (
                             <div className="mt-auto">
                               <a 
                                 href={selectedArtistData.instagram.startsWith('http') ? selectedArtistData.instagram : `https://instagram.com/${selectedArtistData.instagram.replace('@', '')}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm font-bold"
                               >
                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                 Instagram
                               </a>
                             </div>
                           )}
                         </div>
                       </div>
                     )}
                     <div className="flex items-center justify-between mb-6">
                       <h2 className="text-2xl font-bold">
                         {(isSearchFocused || searchQuery.trim())
                           ? (searchQuery.trim() ? `Resultados para "${searchQuery}"` : "Recomendações") 
                           : (selectedArtist ? `Músicas de ${selectedArtist}` : "Acervo Global")}
                       </h2>
                     </div>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                       {filteredTracks.map((track, i) => (
                         <TrackCard 
                           key={track.id} 
                           track={track} 
                           isCurrent={currentTrack?.id === track.id}
                           isPlaying={isPlaying && currentTrack?.id === track.id}
                           onClick={() => handlePlay(track, filteredTracks)}
                           onAdd={() => {
                             if(!user) return alert("Faça login para adicionar às suas playlists.");
                             setSelectedTrackToAdd(track);
                             setIsAddToPlaylistOpen(true);
                           }}
                         />
                       ))}
                       {filteredTracks.length === 0 && <p className="opacity-50 text-sm col-span-full">Nenhuma música encontrada no acervo.</p>}
                     </div>
                  </div>

                  {/* Public Playlists */}
                  {!(isSearchFocused || searchQuery.trim()) && otherPlaylists.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6">Playlists da Comunidade</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {otherPlaylists.map(pl => (
                           <PlaylistCard key={pl.id} playlist={pl} onClick={() => setCurrentPlaylist(pl)} />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'playlists' && (
                <motion.div key="playlists" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}}>
                   <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold">Suas Playlists</h2>
                      <Button onClick={() => setIsCreatePlaylistOpen(true)} className="bg-white text-black hover:bg-gray-200 rounded-full font-bold px-6">
                        <Plus className="w-4 h-4 mr-2" /> Nova Playlist
                      </Button>
                   </div>
                   
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {myPlaylists.map(pl => (
                       <PlaylistCard key={pl.id} playlist={pl} onClick={() => setCurrentPlaylist(pl)} isOwner onDelete={(e) => { e.stopPropagation(); setPlaylistToDelete(pl.id); }} />
                     ))}
                     {myPlaylists.length === 0 && (
                       <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                         <ListMusic className="w-12 h-12 mb-4 opacity-50" />
                         <p>Você ainda não criou nenhuma playlist.</p>
                       </div>
                     )}
                   </div>
                </motion.div>
              )}

              {activeTab === 'live' && (
                <motion.div key="live" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="flex flex-col items-center justify-center py-10">
                   <div className="w-full max-w-3xl aspect-video rounded-3xl overflow-hidden bg-black/50 border border-white/10 shadow-2xl relative group">
                     {isLiveMode && settings?.radioYoutubeLiveUrl ? (
                         <div className="w-full h-full pointer-events-none">
                            <ReactPlayer src={settings.radioYoutubeLiveUrl} playing={isPlaying} volume={volume} muted={isMuted} style={{width: '100%', height: '100%'}} /> 
                         </div>
                     ) : (
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#BF76FF]/20 to-[#FF4400]/20 p-8 text-center">
                         <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-6 shadow-2xl shadow-[#BF76FF]/30 animate-pulse">
                           <RadioIcon className="w-10 h-10 text-white drop-shadow-lg" />
                         </div>
                         <h2 className="text-3xl font-black mb-2">{settings?.radioTitle || "Rádio Profecia Ao Vivo"}</h2>
                         <p className="text-white/60 mb-8">{settings?.radioSubtitle || "Acompanhe nossa transmissão ao vivo."}</p>
                         
                         <Button onClick={playLive} size="lg" className="bg-[#BF76FF] hover:bg-[#a65de6] text-white rounded-full px-12 h-14 font-black tracking-widest text-lg uppercase shadow-[0_0_40px_rgba(191,118,255,0.4)]">
                           {isLiveMode && isPlaying ? "Ouvindo Agora" : "Sintonizar"}
                         </Button>
                       </div>
                     )}
                     
                     {/* Overlay for Youtube live to allow pausing from our UI if we wanted, but we keep it simple */}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Modals */}
      <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
        <DialogContent className="bg-[#141414] text-white border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle>Criar Playlist</DialogTitle>
            <DialogDescription className="text-white/50">Dê um nome para sua nova playlist.</DialogDescription>
          </DialogHeader>
          <Input 
            placeholder="Minha Playlist" 
            value={newPlaylistTitle} 
            onChange={e => setNewPlaylistTitle(e.target.value)}
            className="bg-white/5 border-white/10 h-14 rounded-2xl px-4 text-lg focus:bg-white/10"
          />
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsCreatePlaylistOpen(false)} className="text-white/50 hover:text-white hover:bg-white/5">Cancelar</Button>
            <Button onClick={createPlaylist} className="bg-[#BF76FF] hover:bg-[#a65de6] text-white font-bold rounded-xl px-8">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddToPlaylistOpen} onOpenChange={setIsAddToPlaylistOpen}>
        <DialogContent className="bg-[#141414] text-white border-white/10 rounded-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar à Playlist</DialogTitle>
            <DialogDescription className="text-white/50">Selecione uma playlist para '{selectedTrackToAdd?.title}'</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {myPlaylists.map(pl => {
              const hasTrack = pl.tracks?.find((t:any) => t.id === selectedTrackToAdd?.id);
              return (
                <button 
                  key={pl.id}
                  onClick={() => addToPlaylist(pl.id)}
                  disabled={hasTrack}
                  className={cn("w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all", hasTrack ? "opacity-50 border-white/5 bg-transparent cursor-not-allowed" : "border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer")}
                >
                  <div>
                    <p className="font-bold">{pl.title}</p>
                    <p className="text-[10px] opacity-50 mt-1">{pl.tracks?.length || 0} músicas</p>
                  </div>
                  {hasTrack && <span className="text-xs text-[#BF76FF]">Adicionada</span>}
                </button>
              )
            })}
            {myPlaylists.length === 0 && (
               <div className="text-center py-10 opacity-50 text-sm">Você não tem playlists.</div>
            )}
          </div>
          <DialogFooter className="mt-4 border-t border-white/5 pt-4">
            <Button variant="ghost" onClick={() => {setIsAddToPlaylistOpen(false); setIsCreatePlaylistOpen(true);}} className="w-full justify-center text-[#BF76FF] hover:bg-[#BF76FF]/10">
              <Plus className="w-4 h-4 mr-2" /> Criar nova playlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!playlistToDelete} onOpenChange={(open) => !open && setPlaylistToDelete(null)}>
        <DialogContent className="bg-[#141414] text-white border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle>Excluir Playlist</DialogTitle>
            <DialogDescription className="text-red-400 opacity-80">
              Tem certeza que deseja excluir esta playlist? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setPlaylistToDelete(null)} className="text-white/50 hover:text-white hover:bg-white/5">Cancelar</Button>
            <Button onClick={() => playlistToDelete && deletePlaylist(playlistToDelete)} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl px-8">Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Components

function TabButton({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-6 py-2.5 rounded-full text-sm font-bold transition-all relative",
        active ? "text-black" : "text-white/60 hover:text-white"
      )}
    >
      {active && (
        <motion.div layoutId="radio-tab" className="absolute inset-0 bg-white rounded-full z-0 shadow-lg" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function TrackCard({ track, isCurrent, isPlaying, onClick, onAdd }: { track: any, isCurrent: boolean, isPlaying: boolean, onClick: () => void, onAdd: (e: React.MouseEvent) => void }) {
  return (
    <div className="group bg-white/5 border border-white/5 rounded-3xl p-4 hover:bg-white/10 transition-colors cursor-pointer relative" onClick={onClick}>
       <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/20 mb-4 shadow-lg">
          <img src={`https://img.youtube.com/vi/${track.youtubeId}/mqdefault.jpg`} alt={track.title} className={cn("w-full h-full object-cover transition-transform duration-500 group-hover:scale-110", isCurrent && "opacity-60 blur-[2px]")} />
          
          <div className={cn("absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity", isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
             <div className="w-12 h-12 rounded-full bg-[#BF76FF] text-white flex items-center justify-center shadow-lg shadow-[#BF76FF]/40 transform transition-transform hover:scale-110 shrink-0">
               {isPlaying ? <Speaker className="w-5 h-5 animate-pulse shrink-0" /> : <Play className="w-5 h-5 ml-1 fill-current shrink-0" />}
             </div>
          </div>
       </div>
       <h3 className="font-bold text-sm truncate">{track.title}</h3>
       
       <button 
         onClick={(e) => {e.stopPropagation(); onAdd(e);}}
         className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#BF76FF] hover:scale-110"
         title="Adicionar à Playlist"
       >
         <Plus className="w-4 h-4" />
       </button>
    </div>
  );
}

function PlaylistCard({ playlist, onClick, isOwner, onDelete }: { playlist: any, onClick: () => void, isOwner?: boolean, onDelete?: (e: React.MouseEvent) => void }) {
  const coverUrl = playlist.tracks?.[0]?.youtubeId ? `https://img.youtube.com/vi/${playlist.tracks[0].youtubeId}/mqdefault.jpg` : null;

  return (
    <div className="group bg-white/5 border border-white/5 rounded-3xl p-4 hover:bg-white/10 transition-colors cursor-pointer relative" onClick={onClick}>
       {isOwner && onDelete && (
         <button 
           onClick={onDelete}
           className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white flex items-center justify-center"
           title="Excluir Playlist"
         >
           <Trash2 className="w-4 h-4" />
         </button>
       )}
       
       <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#222] mb-4 shadow-lg flex items-center justify-center">
          {coverUrl ? (
            <img src={coverUrl} alt={playlist.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <Music2 className="w-12 h-12 opacity-20" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <ListMusic className="w-10 h-10 text-white" />
          </div>
       </div>
       <h3 className="font-bold text-sm truncate text-white">{playlist.title}</h3>
       <div className="flex items-center gap-2 mt-2">
         {playlist.authorPhoto ? (
           <img src={getImageUrl(playlist.authorPhoto)} alt="" className="w-4 h-4 rounded-full object-cover bg-white/10" />
         ) : (
           <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center"><UserIcon /></div>
         )}
         <p className="text-[10px] opacity-60 truncate">{playlist.authorName}</p>
       </div>
    </div>
  );
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-2.5 h-2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}

function PlaylistView({ playlist, onBack, onPlayTrack, onPlayAll, isOwner, onRemoveTrack, currentTrack, isPlaying }: any) {
  const coverUrl = playlist.tracks?.[0]?.youtubeId ? `https://img.youtube.com/vi/${playlist.tracks[0].youtubeId}/maxresdefault.jpg` : null;

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="pt-4">
      <button onClick={onBack} className="text-sm font-bold opacity-60 hover:opacity-100 mb-8 flex items-center gap-2 transition-opacity">
        ← Voltar
      </button>

      <div className="flex flex-col md:flex-row gap-8 md:items-end mb-12">
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden shrink-0 bg-[#222] shadow-2xl relative border border-white/10">
           {coverUrl ? (
             <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full flex items-center justify-center"><ListMusic className="w-20 h-20 opacity-20" /></div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 block">Playlist Pública</span>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight leading-none" style={{ fontFamily: "font-display, sans-serif" }}>{playlist.title}</h1>
          <div className="flex items-center gap-3">
             {playlist.authorPhoto ? (
               <img src={getImageUrl(playlist.authorPhoto)} alt="" className="w-6 h-6 rounded-full object-cover bg-white/10" />
             ) : (
               <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><UserIcon /></div>
             )}
             <p className="text-sm font-bold">{playlist.authorName}</p>
             <span className="opacity-40 text-xs">• {playlist.tracks?.length || 0} músicas</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-8">
        <Button onClick={onPlayAll} disabled={!playlist.tracks?.length} className="w-14 h-14 rounded-full bg-[#BF76FF] hover:bg-[#a65de6] hover:scale-105 transition-all text-white flex items-center justify-center shadow-[0_0_30px_rgba(191,118,255,0.4)] disabled:opacity-50">
           <Play className="w-6 h-6 fill-current ml-1" />
        </Button>
      </div>

      <div className="w-full">
         <div className="grid grid-cols-[40px_1fr] md:grid-cols-[40px_1fr_40px] px-4 py-2 border-b border-white/10 text-xs font-bold uppercase tracking-widest opacity-50 mb-2">
            <span>#</span>
            <span>Título</span>
            <span className="hidden md:block"></span>
         </div>
         
         <div className="space-y-1">
           {(!playlist.tracks || playlist.tracks.length === 0) && (
             <div className="py-10 text-center opacity-50 text-sm">Esta playlist está vazia. Adicione músicas do acervo global.</div>
           )}
           {playlist.tracks?.map((track: any, index: number) => {
             const isTrackActive = currentTrack?.id === track.id;
             return (
               <div 
                 key={`${track.id}-${index}`}
                 onClick={() => onPlayTrack(track)}
                 className={cn(
                   "grid grid-cols-[40px_1fr_auto] md:grid-cols-[40px_1fr_40px] items-center px-4 py-3 rounded-xl transition-all cursor-pointer group hover:bg-white/5",
                   isTrackActive ? "bg-white/5" : ""
                 )}
               >
                 <div className="text-sm opacity-50 relative w-6 flex items-center justify-center shrink-0">
                    {isTrackActive && isPlaying ? (
                       <Speaker className="w-4 h-4 text-[#BF76FF] animate-pulse shrink-0" />
                    ) : (
                       <span className={cn("group-hover:opacity-0 shrink-0", isTrackActive && "text-[#BF76FF]")}>{index + 1}</span>
                    )}
                    {!isTrackActive && (
                      <Play className="w-4 h-4 absolute opacity-0 group-hover:opacity-100 fill-current shrink-0" />
                    )}
                 </div>
                 
                 <div className="flex items-center gap-3 pr-4 min-w-0">
                    <img src={`https://img.youtube.com/vi/${track.youtubeId}/default.jpg`} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
                    <span className={cn("font-bold text-sm truncate", isTrackActive && "text-[#BF76FF]")}>{track.title}</span>
                 </div>

                 <div className="flex items-center justify-end">
                    {isOwner && (
                      <button 
                        onClick={(e) => onRemoveTrack(track.id, e)}
                        className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white/50 hover:text-red-500 transition-all"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                 </div>
               </div>
             );
           })}
         </div>
      </div>
    </motion.div>
  );
}

