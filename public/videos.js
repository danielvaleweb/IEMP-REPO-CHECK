
// Função para esperar o elemento aparecer no DOM (útil para aplicações React)
const waitForElement = (selector) => {
  return new Promise(resolve => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
};

const renderVideos = async (selector, filterFn, limit = 5) => {
  try {
    const container = await waitForElement(selector);
    const res = await fetch("/api/youtube");
    if (!res.ok) throw new Error("Erro ao buscar vídeos");
    
    const data = await res.json();
    const items = data.items || [];
    
    const filteredItems = items
      .filter(item => item.id && item.id.videoId)
      .filter(filterFn)
      .slice(0, limit);

    if (filteredItems.length === 0) return;

    const target = container.querySelector('.video-grid-target') || container;
    
    target.innerHTML = filteredItems.map(item => {
      const videoId = item.id.videoId;
      const thumb = item.snippet.thumbnails.medium.url;
      const title = item.snippet.title;

      return `
        <div class="video group cursor-pointer" onclick="window.open('https://youtube.com/watch?v=${videoId}', '_blank')">
          <div class="relative aspect-video rounded-2xl overflow-hidden mb-4 border border-white/10 shadow-lg">
            <img src="${thumb}" alt="${title}" class="w-full h-full object-cover transition-transform group-hover:scale-110" />
            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <svg class="w-12 h-12 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <p class="text-white font-bold text-sm line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">${title}</p>
        </div>
      `;
    }).join("");

    target.className = "grid grid-cols-1 md:grid-cols-5 gap-6 mt-4";
  } catch (error) {
    console.error(`Erro ao carregar vídeos para ${selector}:`, error);
  }
};

// Inicializa as duas seções
const init = () => {
  console.log("Iniciando sistema de vídeos e lives...");
  
  // Vídeos Recentes (Tudo que não for live)
  renderVideos("#videos", (v) => v.snippet.liveBroadcastContent !== "live");
  
  // Lives (Apenas o que for live ou recentes lives)
  renderVideos("#lives", (v) => v.snippet.liveBroadcastContent === "live" || v.snippet.title.toLowerCase().includes("live"));
};

init();
