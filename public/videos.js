
async function render() {
  console.log("Sistema de vídeos iniciado");
  
  const videosContainer = document.getElementById("videos");
  const livesContainer = document.getElementById("lives");

  if (!videosContainer || !livesContainer) {
    console.error("Containers não encontrados");
    return;
  }

  try {
    const response = await fetch('/backend/youtube-all');
    if (!response.ok) throw new Error("Erro ao buscar vídeos: " + response.statusText);
    
    const allVideos = await response.json();
    if (!allVideos || allVideos.length === 0) return;

    const isLiveItem = (v) => v?.snippet?.liveBroadcastContent === "live" || v?.snippet?.thumbnails?.high?.url?.includes("_live");
    
    const videoItems = allVideos.filter(v => !isLiveItem(v)).slice(0, 5);
    const liveItems = allVideos.filter(v => isLiveItem(v)).slice(0, 5);

    const createCard = (v) => {
      const id = v.id?.videoId;
      const title = v.snippet?.title || "Sem título";
      const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      const date = v.snippet?.publishedAt ? new Date(v.snippet.publishedAt).toLocaleDateString('pt-BR') : "";

      return `
        <div class="video-card group cursor-pointer" onclick="window.open('https://youtube.com/watch?v=${id}', '_blank')">
          <div class="relative aspect-video rounded-lg overflow-hidden mb-3 border border-white/5 bg-gray-900">
            <img src="${thumb}" alt="${title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div class="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              </div>
            </div>
          </div>
          <h3 class="text-white text-sm font-bold line-clamp-2 group-hover:text-[#BF76FF] transition-colors">${title}</h3>
          <p class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">${date}</p>
        </div>
      `;
    };

    const updateContainer = (container, items) => {
      if (items.length === 0) return;
      const targetArea = container.querySelector('.max-w-\\[1600px\\] > div:last-child') || container;
      if (targetArea.children.length <= 1 || targetArea.innerText.includes("Nenhum")) {
        console.log(`Renderizando ${items.length} itens em #${container.id}`);
        targetArea.innerHTML = items.map(createCard).join('');
        targetArea.className = "flex overflow-x-auto pb-4 md:grid md:grid-cols-5 gap-4 md:gap-6";
      }
    };

    updateContainer(videosContainer, videoItems);
    updateContainer(livesContainer, liveItems);

  } catch (error) {
    console.error("Erro no fetch da API:", error);
  }
}

window.render = render;

window.addEventListener("DOMContentLoaded", () => {
  console.log("Sistema de vídeos iniciado");
  render();
});

window.onload = () => {
  render();
};
