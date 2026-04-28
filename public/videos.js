
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
  console.log("VIDEOS:", allVideos);
  if (!allVideos || allVideos.length === 0) return;

  const validItems = allVideos.filter(item => item.id && item.id.videoId);
  
  const isLiveItem = (v) => v?.snippet?.liveBroadcastContent === "live" || v?.snippet?.thumbnails?.medium?.url?.includes("_live");
  
  const videoItems = validItems.filter(v => !isLiveItem(v)).slice(0, 5);
  const liveItems = validItems.filter(v => isLiveItem(v)).slice(0, 5);

  const createCard = (item) => {
    const videoId = item.id.videoId;
    const thumb = item.snippet.thumbnails.medium.url;
    const title = item.snippet.title;

    return `
      <div class="video group cursor-pointer" onclick="window.open('https://youtube.com/watch?v=${videoId}', '_blank')">
        <div class="relative aspect-video rounded-2xl overflow-hidden mb-4 border border-white/10">
          <img src="${thumb}" alt="${title}" class="w-full h-full object-cover transition-transform group-hover:scale-110" />
        </div>
        <p class="text-white font-bold text-sm line-clamp-2">${title}</p>
      </div>
    `;
  };

  const updateContainer = (container, items) => {
    if (items.length === 0) return;
    const targetArea = container.querySelector('.max-w-\\[1600px\\] > div:last-child') || container;
    
    if (targetArea.children.length <= 1 || targetArea.innerText.includes("Nenhum") || targetArea.innerText.includes("Carregando")) {
      console.log(`Renderizando ${items.length} itens no container #${container.id}`);
      targetArea.innerHTML = items.map(createCard).join('');
      targetArea.className = "grid grid-cols-1 md:grid-cols-5 gap-6";
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
