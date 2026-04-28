
async function render() {
  console.log("Sistema de vídeos: Iniciando tentativa de renderização...");
  
  const videosContainer = document.getElementById("videos");
  const livesContainer = document.getElementById("lives");

  if (!videosContainer || !livesContainer) {
    console.warn("Sistema de vídeos: Containers não encontrados ainda. Aguardando React...");
    return false;
  }

  try {
    const response = await fetch('/api/youtube');
    if (!response.ok) {
      // Fallback to /backend/youtube-all if /api/youtube fails
      console.warn("Sistema de vídeos: /api/youtube falhou, tentando fallback...");
      const fallback = await fetch('/backend/youtube-all');
      if (!fallback.ok) throw new Error("Erro em ambos endpoints de vídeo.");
      
      const allVideos = await fallback.json();
      renderItems(allVideos, videosContainer, livesContainer);
    } else {
      const data = await response.json();
      const allVideos = data.items || [];
      renderItems(allVideos, videosContainer, livesContainer);
    }
    return true; 
  } catch (error) {
    console.error("Erro no sistema de vídeos:", error);
    return true; // Stop trying if there's a fatal error
  }
}

function renderItems(allVideos, videosContainer, livesContainer) {
  if (!allVideos || allVideos.length === 0) return;

  const isLiveItem = (v) => v?.snippet?.liveBroadcastContent === "live" || v?.snippet?.thumbnails?.high?.url?.includes("_live");
  
  const videoItems = allVideos.filter(v => !isLiveItem(v)).slice(0, 5);
  const liveItems = allVideos.filter(v => isLiveItem(v)).slice(0, 5);

  const createCard = (v) => {
    const id = v.id?.videoId || v.id;
    if (typeof id === 'object' || !id) return "";
    const title = v.snippet?.title || "Sem título";
    const thumb = v.snippet?.thumbnails?.high?.url || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
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
    
    // Check if it's actually empty or has placeholder
    if (targetArea.children.length <= 1 || targetArea.innerText.includes("Nenhum") || targetArea.innerText.includes("Carregando")) {
      console.log(`Sistema de vídeos: Injetando ${items.length} itens em #${container.id}`);
      targetArea.innerHTML = items.map(createCard).join('');
      targetArea.className = "flex overflow-x-auto pb-4 md:grid md:grid-cols-5 gap-4 md:gap-6";
    }
  };

  updateContainer(videosContainer, videoItems);
  updateContainer(livesContainer, liveItems);
}

window.render = render;

// Polling for the elements because React renders asynchronously
let attempts = 0;
const maxAttempts = 20; // Try for 10 seconds (500ms * 20)

const interval = setInterval(async () => {
  attempts++;
  const success = await render();
  if (success || attempts >= maxAttempts) {
    if (!success) console.error("Sistema de vídeos: Desistindo após " + maxAttempts + " tentativas.");
    else console.log("Sistema de vídeos: Renderização concluída com sucesso.");
    clearInterval(interval);
  }
}, 500);

window.addEventListener("DOMContentLoaded", () => {
  console.log("Sistema começado (DOMContentLoaded)");
  render();
});

window.onload = () => {
  console.log("Sistema de vídeos: window.onload executado.");
  render();
};
