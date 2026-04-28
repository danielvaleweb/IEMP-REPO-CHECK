
// Função global para inicializar os vídeos, pode ser chamada pelo React
const initVideos = async () => {
  console.log("Chamando initVideos...");
  
  const videosContainer = document.getElementById("videos");
  if (!videosContainer) {
    console.warn("Container #videos não encontrado no DOM.");
    return;
  }

  // Se já houver conteúdo gerado pelo React e não for placeholder, não sobrescrevemos
  const currentContent = videosContainer.querySelector('.video-grid-target') || videosContainer;
  if (currentContent.children.length > 0 && !currentContent.innerHTML.includes('Configuração Pendente')) {
     console.log("Conteúdo de vídeos já presente, pulando auto-render.");
     // return; // Opcional: descomente se quiser que o React tenha prioridade total
  }

  try {
    const res = await fetch("/api/youtube");
    if (!res.ok) throw new Error("Erro ao buscar vídeos da API");
    const data = await res.json();
    const items = data.items || [];

    if (items.length === 0) return;

    const videoGrid = items.slice(0, 10).map(item => {
      const videoId = item.id.videoId;
      const thumb = item.snippet.thumbnails.medium.url;
      const title = item.snippet.title;
      return `
        <div class="video-card group cursor-pointer" onclick="window.open('https://youtube.com/watch?v=${videoId}', '_blank')">
          <div class="relative aspect-video rounded-xl overflow-hidden mb-3 border border-white/10 shadow-lg">
            <img src="${thumb}" class="w-full h-full object-cover transition-transform group-hover:scale-110" />
            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <svg class="w-12 h-12 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <p class="text-white text-[13px] font-bold line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">${title}</p>
        </div>
      `;
    }).join("");

    const target = videosContainer.querySelector('.video-grid-target') || videosContainer;
    target.innerHTML = videoGrid;
    target.className = "grid grid-cols-2 md:grid-cols-5 gap-6 mt-8";
    
    console.log("Vídeos renderizados com sucesso via Vanilla JS Service.");
  } catch (error) {
    console.error("Falha ao carregar vídeos via script:", error);
  }
};

// Expõe para o escopo global
window.initVideos = initVideos;
