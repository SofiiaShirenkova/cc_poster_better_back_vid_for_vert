const CANVAS_W = 1495 * 0.33
const CANVAS_H = 2200 * 0.33

let COLS = 5
let ROWS = 8

let cellW
let cellH

let grid = []
let placements = []

let userStarted = false
let videosLoaded = 0
let thumbnailsLoaded = 0
let videosLoadingStarted = false

const DATE_SIZE = 16
const TEXT_BLOCK_SIZE = 45

let myFont;

// Perlin noise variables
let sizes = [];
let cols; 
let rows; 
let size = 10;
let xoff = 0; 
let yoff = 0; 
let inc = 0.1;
let zoff = 0;

let noiseActive = false;
let currentHoveredVideo = null;
let isBackgroundPlaying = false;

// Режим отображения: 'portrait' или 'landscape'
let displayMode = 'portrait';

// Добавьте эти переменные в начало файла
let lastHoveredVideo = null;
let videoUpdateQueued = false;

// Массив объектов для заглушек
const thumbnails = [
  {src: "thumbnails/thumb1.jpg", img: null, loaded: false},
  {src: "thumbnails/thumb2.jpg", img: null, loaded: false},
  {src: "thumbnails/thumb3.jpg", img: null, loaded: false},
  {src: "thumbnails/thumb4.jpg", img: null, loaded: false},
  {src: "thumbnails/thumb5.jpg", img: null, loaded: false},
  {src: "thumbnails/thumb6.jpg", img: null, loaded: false},
  {src: "thumbnails/thumb7.jpg", img: null, loaded: false},
  {src: "thumbnails/thumb8.jpg", img: null, loaded: false},
]

let media = [
  {date:"12.07.2024", src:"videos/v1.mp4", video:null, loaded:false, thumbnailIndex: 0, loadAttempted: false, playing: false, element: null},
  {date:"03.26.2023", src:"videos/v2.mp4", video:null, loaded:false, thumbnailIndex: 1, loadAttempted: false, playing: false, element: null},
  {date:"05.06.2019", src:"videos/v3.mp4", video:null, loaded:false, thumbnailIndex: 2, loadAttempted: false, playing: false, element: null},
  {date:"12.12.2022", src:"videos/v4.mp4", video:null, loaded:false, thumbnailIndex: 3, loadAttempted: false, playing: false, element: null},
  {date:"07.07.2005", src:"videos/v5.mp4", video:null, loaded:false, thumbnailIndex: 4, loadAttempted: false, playing: false, element: null},
  {date:"12.07.2024", src:"videos/v6.mp4", video:null, loaded:false, thumbnailIndex: 5, loadAttempted: false, playing: false, element: null},
  {date:"03.26.2023", src:"videos/v7.mp4", video:null, loaded:false, thumbnailIndex: 6, loadAttempted: false, playing: false, element: null},
  {date:"14.04.2024", src:"videos/v8.mp4", video:null, loaded:false, thumbnailIndex: 6, loadAttempted: false, playing: false, element: null},
  {date:"08.03.2026", src:"videos/v9.mp4", video:null, loaded:false, thumbnailIndex: 6, loadAttempted: false, playing: false, element: null},
]

let textBlocks = [
  "Audio-visual\narchive",
  "Sofiia Shirenkova\n2025"
]

let gridContainer = null;
let canvasContainer = null;
let modalOverlay = null;
let backgroundVideo = null;

function preload() {
  myFont = loadFont('font/Arial_Narrow.ttf');
  
  for (let i = 0; i < thumbnails.length; i++) {
    thumbnails[i].img = loadImage(
      thumbnails[i].src,
      (img) => {
        console.log(`✅ Thumbnail loaded: ${thumbnails[i].src}`);
        thumbnails[i].loaded = true;
        thumbnailsLoaded++;
      },
      (err) => {
        console.warn(`⚠️ Could not load thumbnail ${thumbnails[i].src}, creating placeholder`);
        let placeholder = createGraphics(200, 200);
        placeholder.background(120, 120, 180);
        placeholder.fill(255);
        placeholder.textAlign(CENTER, CENTER);
        placeholder.textSize(14);
        placeholder.text(`Video ${i+1}`, 100, 100);
        thumbnails[i].img = placeholder;
        thumbnails[i].loaded = true;
        thumbnailsLoaded++;
      }
    );
  }
  
  for (let i = 0; i < media.length; i++) {
    let m = media[i];
    
    let videoElement = document.createElement('video');
    videoElement.src = m.src;
    videoElement.muted = true;
    videoElement.loop = true;
    videoElement.playsInline = true;
    videoElement.preload = 'metadata';
    videoElement.style.position = 'absolute';
    videoElement.style.objectFit = 'cover';
    
    videoElement.className = 'gray-video';
    
    videoElement.addEventListener('canplaythrough', () => {
      if (!m.loaded) {
        m.loaded = true;
        videosLoaded++;
        console.log(`✅ Video ${i+1} loaded (${videosLoaded}/${media.length})`);
      }
    });
    
    videoElement.addEventListener('error', (e) => {
      console.error(`❌ Error loading video ${i+1}:`, e);
    });
    
    m.video = videoElement;
    m.element = videoElement;
  }
}

function setup() {
  const style = document.createElement('style');
  style.textContent = `
    video {
      display: block !important;
      transition: none !important;
    }
    
    /* Предотвращаем любые анимации, которые могут вызвать мигание */
    video.gray-video, video.color-video {
      transition: filter 0.2s ease;
    }
  `;
  document.head.appendChild(style);
  // Создаем фоновое видео (самый нижний слой)
  backgroundVideo = document.createElement('video');
  backgroundVideo.style.position = 'fixed';
  backgroundVideo.style.top = '0';
  backgroundVideo.style.left = '0';
  backgroundVideo.style.width = '100%';
  backgroundVideo.style.height = '100%';
  backgroundVideo.style.objectFit = 'cover';
  backgroundVideo.style.zIndex = '0';
  backgroundVideo.style.filter = 'grayscale(100%)';
  backgroundVideo.style.display = 'none';
  backgroundVideo.loop = true;
  backgroundVideo.playsInline = true;
  backgroundVideo.muted = true;
  document.body.appendChild(backgroundVideo);
  
  // Создаем контейнер для канваса
  canvasContainer = document.createElement('div');
  canvasContainer.style.position = 'fixed';
  canvasContainer.style.top = '0';
  canvasContainer.style.left = '0';
  canvasContainer.style.width = '100%';
  canvasContainer.style.height = '100%';
  canvasContainer.style.display = 'flex';
  canvasContainer.style.alignItems = 'center';
  canvasContainer.style.justifyContent = 'center';
  canvasContainer.style.overflow = 'hidden';
  canvasContainer.style.backgroundColor = '#9fa6aec9';
  canvasContainer.style.zIndex = '1';
  document.body.appendChild(canvasContainer);
  
  // Создаем канвас и добавляем в контейнер
  const canvas = createCanvas(CANVAS_W, CANVAS_H);
  canvas.parent(canvasContainer);
  canvas.style.position = 'relative';
  canvas.style.zIndex = '2';
  canvas.style.backgroundColor = 'transparent';
  
  updateCanvasSize();
  cellW = width / COLS;
  cellH = height / ROWS;
  
  cols = ceil(width / size);
  rows = ceil(height / size);
  
  for (let m of media) {
    m.video.style.display = 'none';
    document.body.appendChild(m.video);
  }
  
  createGridOverlay();
  createToggleSwitch();
  createQuestionMark();

  generateLayout();
  textFont(myFont);

  addGlobalStyles();

  if (backgroundVideo) {
    backgroundVideo.id = 'background-video';
  }

  addZIndexStyles();
  
  // Даем ID фоновому видео
  if (backgroundVideo) {
    backgroundVideo.id = 'background-video';
  }
  
  console.log(`Setup complete. Thumbnails: ${thumbnailsLoaded}/${thumbnails.length}`);
  
  setTimeout(() => {
    if (!videosLoadingStarted) {
      startBackgroundVideoLoading();
    }
  }, 1000);


}

function updateCanvasSize() {
  if (displayMode === 'portrait') {
    // Вертикальный режим: канвас фиксированного размера, центрируется
    resizeCanvas(CANVAS_W, CANVAS_H);
    COLS = 5;
    ROWS = 8;
    
    // Центрируем канвас
    canvasContainer.style.justifyContent = 'center';
    canvasContainer.style.alignItems = 'center';
  } else {
    // Горизонтальный режим: канвас заполняет весь экран
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const targetRatio = CANVAS_H / CANVAS_W;
    
    let newWidth, newHeight;
    
    newWidth = windowWidth;
    newHeight = windowHeight;
    
    resizeCanvas(newWidth, newHeight);
    COLS = 9;
    ROWS = 5;
    
    // Растягиваем на весь экран
    canvasContainer.style.justifyContent = 'flex-start';
    canvasContainer.style.alignItems = 'flex-start';
    canvasContainer.style.overflow = 'auto';
    
    // // Скрываем фоновое видео в горизонтальном режиме
    // if (backgroundVideo) {
    //   backgroundVideo.pause();
    //   backgroundVideo.style.display = 'none';
    //   isBackgroundPlaying = false;
    // }
      // Фоновое видео всегда показывается, просто обновляем его стили
    if (backgroundVideo) {
      backgroundVideo.style.display = 'none';
      backgroundVideo.style.objectFit = 'cover';
      backgroundVideo.style.zIndex = '0';
      isBackgroundPlaying = false;
    }
  }
  
  // Обновляем позицию канваса
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.style.position = 'relative';
    if (displayMode === 'portrait') {
      canvas.style.margin = 'auto';
    } else {
      canvas.style.margin = '0';
    }
  }
}

function createToggleSwitch() {
  const toggleContainer = document.createElement('div');
  toggleContainer.style.position = 'fixed';
  toggleContainer.style.top = '50px';
  toggleContainer.style.right = '50px';
  toggleContainer.style.zIndex = '2000';
  toggleContainer.style.fontFamily = 'Arial, sans-serif';
  
  const label = document.createElement('label');
  label.style.display = 'inline-block';
  label.style.width = '170px';
  label.style.height = '86px';
  label.style.position = 'relative';
  label.style.cursor = 'pointer';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.style.opacity = '0';
  checkbox.style.width = '0';
  checkbox.style.height = '0';
  checkbox.style.position = 'absolute';
  
  const slider = document.createElement('span');
  slider.style.position = 'absolute';
  slider.style.top = '0';
  slider.style.left = '0';
  slider.style.right = '0';
  slider.style.bottom = '0';
  slider.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
  slider.style.backdropFilter = 'blur(8px)';
  slider.style.borderRadius = '80px';
  slider.style.transition = '0.3s';
  slider.style.border = '1px solid rgba(255, 255, 255, 0.6)';
  
  const round = document.createElement('span');
  round.style.position = 'absolute';
  round.style.height = '75px';
  round.style.width = '75px';
  round.style.left = '5px';
  round.style.bottom = '2.5px';
  round.style.backgroundColor = 'white';
  round.style.borderRadius = '50%';
  round.style.transition = '0.3s';
  round.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  
  slider.appendChild(round);
  label.appendChild(checkbox);
  label.appendChild(slider);
  toggleContainer.appendChild(label);
  
  document.body.appendChild(toggleContainer);
  
  checkbox.addEventListener('change', (e) => {
    if (checkbox.checked) {
      displayMode = 'landscape';
      round.style.transform = 'translateX(82px)';
      slider.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    } else {
      displayMode = 'portrait';
      round.style.transform = 'translateX(0)';
      slider.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    }
    regenerateLayout();
  });
}

function createQuestionMark() {
  const questionContainer = document.createElement('div');
  questionContainer.style.position = 'fixed';
  questionContainer.style.top = '50px';
  questionContainer.style.left = '50px';
  questionContainer.style.zIndex = '2000';
  questionContainer.style.cursor = 'pointer';
  
  const questionButton = document.createElement('div');
  questionButton.innerHTML = '?';
  questionButton.style.width = '82px';
  questionButton.style.height = '82px';
  questionButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
  questionButton.style.backdropFilter = 'blur(8px)';
  questionButton.style.borderRadius = '50%';
  questionButton.style.display = 'flex';
  questionButton.style.alignItems = 'center';
  questionButton.style.justifyContent = 'center';
  questionButton.style.fontSize = '42px';
  questionButton.style.fontWeight = 'bold';
  questionButton.style.color = 'white';
  questionButton.style.border = '1px solid rgba(255, 255, 255, 0.6)';
  questionButton.style.transition = 'all 0.3s ease';
  questionButton.style.fontFamily = 'Arial, sans-serif';
  
  questionButton.onmouseenter = () => {
    questionButton.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    questionButton.style.transform = 'scale(1.05)';
  };
  
  questionButton.onmouseleave = () => {
    questionButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    questionButton.style.transform = 'scale(1)';
  };
  
  questionButton.onclick = () => {
    showModal();
  };
  
  questionContainer.appendChild(questionButton);
  document.body.appendChild(questionContainer);
}

function showModal() {
  // Создаем затемненный фон
  modalOverlay = document.createElement('div');
  modalOverlay.style.position = 'fixed';
  modalOverlay.style.top = '0';
  modalOverlay.style.left = '0';
  modalOverlay.style.width = '100%';
  modalOverlay.style.height = '100%';
  modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modalOverlay.style.backdropFilter = 'blur(4px)';
  modalOverlay.style.zIndex = '3000';
  modalOverlay.style.display = 'flex';
  modalOverlay.style.alignItems = 'center';
  modalOverlay.style.justifyContent = 'center';
  
  // Создаем модальное окно
  const modal = document.createElement('div');
  modal.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
  modal.style.backdropFilter = 'blur(10px)';
  modal.style.borderRadius = '12px';
  modal.style.padding = '30px';
  modal.style.maxWidth = '500px';
  modal.style.minWidth = '300px';
  modal.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
  modal.style.position = 'relative';
  modal.style.animation = 'fadeIn 0.3s ease';
  
  // Добавляем анимацию
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;
  document.head.appendChild(style);
  
  // Кнопка закрытия
  const closeButton = document.createElement('div');
  closeButton.innerHTML = '✕';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '15px';
  closeButton.style.right = '15px';
  closeButton.style.width = '30px';
  closeButton.style.height = '30px';
  closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
  closeButton.style.borderRadius = '50%';
  closeButton.style.display = 'flex';
  closeButton.style.alignItems = 'center';
  closeButton.style.justifyContent = 'center';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontSize = '20px';
  closeButton.style.fontWeight = 'bold';
  closeButton.style.color = '#333';
  closeButton.style.transition = 'all 0.2s ease';
  
  closeButton.onmouseenter = () => {
    closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    closeButton.style.transform = 'scale(1.1)';
  };
  
  closeButton.onmouseleave = () => {
    closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    closeButton.style.transform = 'scale(1)';
  };
  
  closeButton.onclick = () => {
    closeModal();
  };
  
  // Текст внутри модального окна
  const modalText = document.createElement('div');
  modalText.innerHTML = `
    <h2 style="margin: 0 0 20px 0; color: #333; font-family: Arial, sans-serif;">Информация</h2>
    <p style="margin: 0; line-height: 1.6; color: #555; font-family: Arial, sans-serif; font-size: 16px;">
      привет тут будет текст
    </p>
  `;
  
  modal.appendChild(closeButton);
  modal.appendChild(modalText);
  modalOverlay.appendChild(modal);
  
  // Закрытие по клику на фон
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  };
  
  // Закрытие по клавише Escape
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
  
  document.body.appendChild(modalOverlay);
}

function closeModal() {
  if (modalOverlay) {
    modalOverlay.remove();
    modalOverlay = null;
  }
}

// Также вызывайте updateVideoPositions после регенерации лейаута
function regenerateLayout() {
  updateCanvasSize();
  cellW = width / COLS;
  cellH = height / ROWS;
  cols = ceil(width / size);
  rows = ceil(height / size);
  
  if (gridContainer) {
    gridContainer.style.width = width + 'px';
    gridContainer.style.height = height + 'px';
    const canvasRect = document.querySelector('canvas').getBoundingClientRect();
    gridContainer.style.left = canvasRect.left + 'px';
    gridContainer.style.top = canvasRect.top + 'px';
  }
  
  updateGridOverlay();
  generateLayout();
  updateVideoPositions(); // Обновляем позиции видео
}

function updateVideoPositions() {
  const canvasRect = document.querySelector('canvas').getBoundingClientRect();
  
  for (let p of placements) {
    if (p.type === "video") {
      let m = media[p.mediaIndex];
      if (m.video && m.loaded) {
        let x = canvasRect.left + (p.col * cellW);
        let y = canvasRect.top + (p.row * cellH);
        let w = p.size * cellW;
        let h = p.size * cellH;
        
        m.video.style.position = 'fixed';
        m.video.style.left = x + 'px';
        m.video.style.top = y + 'px';
        m.video.style.width = w + 'px';
        m.video.style.height = h + 'px';
      }
    }
  }
}

function createGridOverlay() {
  if (gridContainer) {
    gridContainer.remove();
  }
  
  gridContainer = document.createElement('div');
  gridContainer.style.position = 'fixed';
  gridContainer.style.pointerEvents = 'none';
  gridContainer.style.zIndex = '100';
  document.body.appendChild(gridContainer);
  
  updateGridOverlay();
}

function updateGridOverlay() {
  if (!gridContainer) return;
  
  const canvasRect = document.querySelector('canvas').getBoundingClientRect();
  
  gridContainer.style.left = canvasRect.left + 'px';
  gridContainer.style.top = canvasRect.top + 'px';
  gridContainer.style.width = width + 'px';
  gridContainer.style.height = height + 'px';
  
  while (gridContainer.firstChild) {
    gridContainer.removeChild(gridContainer.firstChild);
  }
  
  // Создаем вертикальные линии
  for (let x = 1; x < COLS; x++) {
    const line = document.createElement('div');
    line.style.position = 'absolute';
    line.style.left = (x * cellW) + 'px';
    line.style.top = '0';
    line.style.width = '1px';
    line.style.height = height + 'px';
    line.style.backgroundColor = '#000000';
    line.style.opacity = '1';
    gridContainer.appendChild(line);
  }
  
  // Создаем горизонтальные линии
  for (let y = 1; y < ROWS; y++) {
    const line = document.createElement('div');
    line.style.position = 'absolute';
    line.style.left = '0';
    line.style.top = (y * cellH) + 'px';
    line.style.width = width + 'px';
    line.style.height = '1px';
    line.style.backgroundColor = '#000000';
    line.style.opacity = '1';
    gridContainer.appendChild(line);
  }
  
  // Добавляем обводку по краям
  const border = document.createElement('div');
  border.style.position = 'absolute';
  border.style.top = '0';
  border.style.left = '0';
  border.style.width = width + 'px';
  border.style.height = height + 'px';
  border.style.border = '1px solid #000000';
  border.style.boxSizing = 'border-box';
  border.style.pointerEvents = 'none';
  gridContainer.appendChild(border);
}

// Вызывайте updateVideoPositions при изменении размера окна
function windowResized() {
  if (displayMode === 'landscape') {
    updateCanvasSize();
    cellW = width / COLS;
    cellH = height / ROWS;
    updateGridOverlay();
    updateVideoPositions(); // Обновляем позиции видео
  }
}

function generateLayout() {
  initGrid();
  placements = [];
  placeTextBlocks();
  placeMedia();
}

function placeTextBlocks() {
  const textsToPlace = [...textBlocks];
  
  
  for (let i = 0; i < textsToPlace.length; i++) {
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!placed && attempts < maxAttempts) {
      attempts++;
      let col = floor(random(COLS - 2));
      let row = floor(random(ROWS));
      
      if (fitsRect(col, row, 3, 1)) {
        occupyRect(col, row, 3, 1);
        placements.push({
          type: "text",
          text: textsToPlace[i],
          id: i,
          col, row,
          w: 3,
          h: 1,
        });
        placed = true;
      }
    }
  }
}

function startBackgroundVideoLoading() {
  videosLoadingStarted = true;
  let currentIndex = 0;
  
  function loadNextVideo() {
    if (currentIndex >= media.length) {
      console.log("All videos loaded in background!");
      return;
    }
    
    let m = media[currentIndex];
    if (!m.loaded && !m.loadAttempted) {
      m.loadAttempted = true;
      console.log(`🔄 Background loading video ${currentIndex + 1}/${media.length}`);
      
      m.video.preload = 'auto';
      m.video.load();
      
      let loadTimeout = setTimeout(() => {
        if (!m.loaded) {
          console.warn(`⚠️ Video ${currentIndex + 1} loading timeout`);
          currentIndex++;
          loadNextVideo();
        }
      }, 15000);
      
      m.video.addEventListener('canplaythrough', () => {
        clearTimeout(loadTimeout);
        currentIndex++;
        loadNextVideo();
      }, { once: true });
      
      m.video.onerror = () => {
        clearTimeout(loadTimeout);
        console.error(`❌ Error loading video ${currentIndex + 1}`);
        currentIndex++;
        loadNextVideo();
      };
    } else {
      currentIndex++;
      loadNextVideo();
    }
  }
  
  loadNextVideo();
}

function lazyLoadVideoOnHover(m) {
  if (!m.loaded && !m.loadAttempted) {
    m.loadAttempted = true;
    console.log(`🔄 Lazy loading video on hover`);
    
    m.video.preload = 'auto';
    m.video.load();
    
    m.video.addEventListener('canplaythrough', () => {
      m.loaded = true;
      videosLoaded++;
      console.log(`✅ Video loaded on hover (${videosLoaded}/${media.length})`);
    }, { once: true });
  }
}

function draw() {
  clear();
  drawPerlinNoise();    // Шум внизу
  drawAllTextBlocks();  // Текст поверх шума
  drawAllMedia();       // Видео (но они DOM-элементы, не рисуются на канвасе)
  
  // Текст загрузки
  if (!userStarted && (videosLoaded < media.length || thumbnailsLoaded < thumbnails.length)) {
    push();
    fill(0);
    textSize(16);
    textAlign(CENTER, CENTER);
    let loadingText = `Loading... `;
    if (thumbnailsLoaded < thumbnails.length) {
      loadingText += `Thumbnails: ${thumbnailsLoaded}/${thumbnails.length} `;
    }
    if (videosLoaded < media.length) {
      loadingText += `Videos: ${videosLoaded}/${media.length}`;
    }
    text(loadingText, width/2, 40);
    pop();
  }
}

// Добавьте CSS стили для правильного z-index
function addZIndexStyles() {
  const style = document.createElement('style');
  style.textContent = `
    canvas {
      position: relative;
      z-index: 5 !important;
      background-color: transparent !important;
    }
    
    video {
      position: fixed !important;
      transition: none !important;
      object-fit: cover;
    }
    
    /* Обычные видео (без ховера) - под канвасом */
    video.gray-video {
      z-index: 1 !important;
      filter: grayscale(100%);
    }
    
    /* Видео при наведении - над канвасом */
    video.color-video {
      z-index: 10 !important;
      filter: grayscale(0%);
    }
    
    /* Фоновое видео */
    #background-video {
      z-index: 0 !important;
    }
    
    /* Контейнер канваса */
    .canvas-container {
      z-index: 5 !important;
    }
  `;
  document.head.appendChild(style);
}


function drawPerlinNoise() {
  xoff = 0;
  for (let i = 0; i < cols; i++) {
    sizes[i] = [];
    yoff = 0;
    for (let j = 0; j < rows; j++) {
      let circleSize = map(noise(xoff, yoff, zoff), 0, 1, 0, size * 1.7);
      sizes[i][j] = circleSize;
      yoff += inc;
      
      let r = noise(zoff) * 255;
      let g = noise(zoff + 15) * 255;
      let b = noise(zoff + 30) * 255;
      
      fill(r, g, b, 100);
      noStroke();
      circle(size/2 + i * size, size/2 + j * size, circleSize);
    }
    xoff += inc;
  }
  
  if (noiseActive && userStarted) {
    zoff += 0.03;
  } else {
    zoff += 0.009;
  }
}

function drawAllMedia() {
  for (let p of placements) {
    if (p.type === "video") {
      drawVideo(p);
    }
  }
}

function drawAllTextBlocks() {
  for (let p of placements) {
    if (p.type === "text") {
      drawSingleTextBlock(p);
    }
  }
}

// Обновите функцию updateVideoOnHover
function updateVideoOnHover(hoveredVideo) {
  if (lastHoveredVideo === hoveredVideo) return;
  
  // Скрываем предыдущее видео
  if (lastHoveredVideo && lastHoveredVideo.video) {
    lastHoveredVideo.video.muted = true;
    lastHoveredVideo.video.className = 'gray-video';
    lastHoveredVideo.video.style.zIndex = '1'; // Видео под канвасом когда не в фокусе
    if (!lastHoveredVideo.video.paused) {
      lastHoveredVideo.video.pause();
      lastHoveredVideo.playing = false;
    }
  }
  
  // Останавливаем фоновое видео (ЭТО ВАЖНО - всегда останавливаем)
  if (isBackgroundPlaying) {
    backgroundVideo.pause();
    backgroundVideo.style.display = 'none';
    isBackgroundPlaying = false;
  }
  
  // Показываем новое видео
  if (hoveredVideo && hoveredVideo.video && userStarted) {
    hoveredVideo.video.muted = false;
    hoveredVideo.video.className = 'color-video';
    hoveredVideo.video.style.display = 'block';
    hoveredVideo.video.style.zIndex = '10'; // Видео ПОВЕРХ канваса когда в фокусе
    
    // Запускаем фоновое видео ТОЛЬКО если есть наведение
    if (backgroundVideo.src !== hoveredVideo.video.src) {
      backgroundVideo.src = hoveredVideo.video.src;
      backgroundVideo.load();
    }
    
    backgroundVideo.style.display = 'block';
    backgroundVideo.style.zIndex = '0'; // Фоновое видео под всем
    backgroundVideo.play().catch(e => console.log("Background play error:", e));
    isBackgroundPlaying = true;
    
    if (hoveredVideo.video.paused) {
      hoveredVideo.video.play().catch(error => {
        console.log("Auto-play prevented:", error);
      });
      hoveredVideo.playing = true;
    }
  }
  
  lastHoveredVideo = hoveredVideo;
}

function drawVideo(p) {
  let x = p.col * cellW;
  let y = p.row * cellH;
  let w = p.size * cellW;
  let h = p.size * cellH;
  
  let m = media[p.mediaIndex];
  let thumb = thumbnails[m.thumbnailIndex];
  
  let hover = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  
  if (hover && !m.loaded && !m.loadAttempted) {
    lazyLoadVideoOnHover(m);
  }
  
  if (!m.loaded) {
    if (m.video) {
      m.video.style.display = 'none';
    }
    
    if (thumb && thumb.loaded && thumb.img) {
      push();
      image(thumb.img, x, y, w, h);
      pop();
    } else {
      push();
      fill(120, 120, 180);
      noStroke();
      rect(x, y, w, h);
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(16);
      text('Loading...', x + w/2, y + h/2);
      pop();
    }
    return;
  }
  
  const canvasRect = document.querySelector('canvas').getBoundingClientRect();
  
  // Обновляем позицию видео
  m.video.style.position = 'fixed';
  m.video.style.left = (canvasRect.left + x) + 'px';
  m.video.style.top = (canvasRect.top + y) + 'px';
  m.video.style.width = w + 'px';
  m.video.style.height = h + 'px';
  
  // Управляем отображением и z-index
  if (hover && userStarted) {
    m.video.style.display = 'block';
    m.video.style.zIndex = '10'; // Видео поверх всего при наведении
    m.video.muted = false;
    m.video.className = 'color-video';
    
    // Фоновое видео
    if (backgroundVideo.src !== m.video.src) {
      if (isBackgroundPlaying) {
        backgroundVideo.pause();
        isBackgroundPlaying = false;
      }
      backgroundVideo.src = m.video.src;
      backgroundVideo.load();
    }
    
    if (!isBackgroundPlaying) {
      backgroundVideo.style.display = 'block';
      backgroundVideo.style.zIndex = '0'; // Фон под всем
      backgroundVideo.play()
        .then(() => {
          isBackgroundPlaying = true;
        })
        .catch(e => console.log("Background play error:", e));
    }
    
    if (m.video.paused) {
      m.video.play().catch(error => {
        console.log("Auto-play prevented:", error);
      });
      m.playing = true;
    }
  } else {
    m.video.muted = true;
    m.video.className = 'gray-video';
    m.video.style.zIndex = '1'; // Видео под канвасом когда не наведены
    
    // Останавливаем фоновое видео когда нет ховера
    if (isBackgroundPlaying) {
      backgroundVideo.pause();
      backgroundVideo.style.display = 'none';
      isBackgroundPlaying = false;
    }
    
    if (!m.video.paused) {
      m.video.pause();
      m.playing = false;
    }
  }
  
  drawDate(p);
}


// Добавьте эту функцию и вызовите её в setup()
function addGlobalStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Канвас - средний слой */
    canvas {
      position: relative;
      z-index: 5 !important;
      background-color: transparent !important;
    }
    
    /* Видео по умолчанию - под канвасом */
    video {
      position: fixed !important;
      z-index: 1 !important;
      transition: z-index 0s;
      pointer-events: auto;
      object-fit: cover;
    }
    
    /* Видео при наведении - над канвасом */
    video.color-video {
      z-index: 10 !important;
    }
    
    /* Фоновое видео - самый нижний слой */
    #background-video {
      z-index: 0 !important;
    }
    
    /* Контейнер сетки */
    .grid-container {
      z-index: 4 !important;
    }
  `;
  document.head.appendChild(style);
}

function drawSingleTextBlock(p) {
  push();
  fill(0);
  noStroke();
  
  // Увеличиваем размер шрифта для текстовых блоков в горизонтальном режиме
  let textSizeValue = TEXT_BLOCK_SIZE;
  if (displayMode === 'landscape') {
    textSizeValue = TEXT_BLOCK_SIZE * 1.6;
  }
  textSize(textSizeValue);
  textAlign(LEFT, TOP);
  textLeading(1.1);
  
  let x = p.col * cellW - 13;
  let y = p.row * cellH - 40;
  
  let lines = p.text.split('\n');
  let lineHeight = textSizeValue - 6;
  
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], x + 20, y + 40 + (i * lineHeight));
  }
  pop();
}

function initGrid() {
  for (let y = 0; y < ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < COLS; x++) {
      grid[y][x] = null;
    }
  }
}

function getAllLargeVideoPositions() {
  let positions = [];
  for (let p of placements) {
    if (p.type === "video" && p.size === 2) {
      positions.push({col: p.col, row: p.row});
    }
  }
  return positions;
}

function isSmallTouchingLarge(smallCol, smallRow, largeCol, largeRow) {
  for (let dy = 0; dy < 1; dy++) {
    for (let dx = 0; dx < 1; dx++) {
      let smallX = smallCol + dx;
      let smallY = smallRow + dy;
      
      for (let ly = 0; ly < 2; ly++) {
        for (let lx = 0; lx < 2; lx++) {
          let largeX = largeCol + lx;
          let largeY = largeRow + ly;
          
          if ((Math.abs(smallX - largeX) === 1 && smallY === largeY) || 
              (Math.abs(smallY - largeY) === 1 && smallX === largeX)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function wouldSmallCreateBridge(smallCol, smallRow) {
  let largeVideos = getAllLargeVideoPositions();
  let touchingLargeVideos = [];
  
  for (let large of largeVideos) {
    if (isSmallTouchingLarge(smallCol, smallRow, large.col, large.row)) {
      touchingLargeVideos.push(large);
    }
  }
  
  return touchingLargeVideos.length >= 2;
}

function hasAdjacentSingleBlock(col, row, size) {
  for (let dy = -1; dy <= size; dy++) {
    for (let dx = -1; dx <= size; dx++) {
      if ((dx === -1 && dy === -1) || 
          (dx === size && dy === -1) || 
          (dx === -1 && dy === size) || 
          (dx === size && dy === size)) {
        continue;
      }
      
      let checkX = col + dx;
      let checkY = row + dy;
      
      if (checkX >= 0 && checkX < COLS && checkY >= 0 && checkY < ROWS) {
        if (grid[checkY][checkX] === "single") {
          return true;
        }
      }
    }
  }
  return false;
}

function hasAdjacentLargeVideo(col, row, size) {
  for (let dy = -2; dy <= size + 1; dy++) {
    for (let dx = -2; dx <= size + 1; dx++) {
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) continue;
      
      let checkX = col + dx;
      let checkY = row + dy;
      
      if (checkX >= 0 && checkX < COLS && checkY >= 0 && checkY < ROWS) {
        if (grid[checkY][checkX] === "large") {
          for (let ly = 0; ly < 2; ly++) {
            for (let lx = 0; lx < 2; lx++) {
              let possibleLargeCol = checkX - lx;
              let possibleLargeRow = checkY - ly;
              
              let isLargeVideo = true;
              for (let y2 = 0; y2 < 2; y2++) {
                for (let x2 = 0; x2 < 2; x2++) {
                  let checkY2 = possibleLargeRow + y2;
                  let checkX2 = possibleLargeCol + x2;
                  if (checkY2 < 0 || checkY2 >= ROWS || checkX2 < 0 || checkX2 >= COLS || 
                      grid[checkY2][checkX2] !== "large") {
                    isLargeVideo = false;
                    break;
                  }
                }
                if (!isLargeVideo) break;
              }
              
              if (isLargeVideo) {
                for (let y1 = row; y1 < row + size; y1++) {
                  for (let x1 = col; x1 < col + size; x1++) {
                    for (let y2 = possibleLargeRow; y2 < possibleLargeRow + 2; y2++) {
                      for (let x2 = possibleLargeCol; x2 < possibleLargeCol + 2; x2++) {
                        if ((Math.abs(x1 - x2) === 1 && y1 === y2) || 
                            (Math.abs(y1 - y2) === 1 && x1 === x2)) {
                          return true;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return false;
}

function canPlaceSmallNextToLarge(smallCol, smallRow) {
  let largeVideos = getAllLargeVideoPositions();
  let touchingCount = 0;
  let touchingLarge = null;
  
  for (let large of largeVideos) {
    if (isSmallTouchingLarge(smallCol, smallRow, large.col, large.row)) {
      touchingCount++;
      touchingLarge = large;
    }
  }
  
  if (touchingCount > 1) return false;
  
  if (touchingCount === 1) {
    for (let p of placements) {
      if (p.type === "video" && p.size === 1) {
        if (isSmallTouchingLarge(p.col, p.row, touchingLarge.col, touchingLarge.row)) {
          return false;
        }
      }
    }
  }
  
  return true;
}

function hasSpaceForDate(col, row, size) {
  let below = {x: col, y: row + size};
  let right = {x: col + size, y: row};
  let above = {x: col, y: row - 1};
  let left  = {x: col - 1, y: row};
  let possibleDateCells = [below, right, above, left];
  
  for (let cell of possibleDateCells) {
    if (cell.x >= 0 && cell.x < COLS && cell.y >= 0 && cell.y < ROWS) {
      if (grid[cell.y][cell.x] === null) {
        return true;
      }
    }
  }
  return false;
}

function canPlaceVideo(col, row, size) {
  if (col + size > COLS || row + size > ROWS) return false;
  
  for (let y = row; y < row + size; y++) {
    for (let x = col; x < col + size; x++) {
      if (grid[y][x] !== null) return false;
    }
  }
  
  if (!hasSpaceForDate(col, row, size)) return false;
  
  if (size === 1) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx !== 0 && dy !== 0) continue;
        if (dx === 0 && dy === 0) continue;
        
        let checkX = col + dx;
        let checkY = row + dy;
        
        if (checkX >= 0 && checkX < COLS && checkY >= 0 && checkY < ROWS) {
          if (grid[checkY][checkX] === "single") return false;
        }
      }
    }
    
    if (wouldSmallCreateBridge(col, row)) return false;
    if (!canPlaceSmallNextToLarge(col, row)) return false;
    
  } else if (size === 2) {
    if (hasAdjacentLargeVideo(col, row, size)) return false;
    if (hasAdjacentSingleBlock(col, row, size)) return false;
  }
  
  return true;
}

function placeMedia() {
  let largeVideosPlaced = 0;
  let maxLargeVideos = 3;
  
  let mediaIndices = [...Array(media.length).keys()];
  for (let i = mediaIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mediaIndices[i], mediaIndices[j]] = [mediaIndices[j], mediaIndices[i]];
  }
  
  for (let idx of mediaIndices) {
    if (largeVideosPlaced >= maxLargeVideos) break;
    
    let placed = false;
    let attempts = 0;
    let maxAttempts = 3000;
    
    while (!placed && attempts < maxAttempts && largeVideosPlaced < maxLargeVideos) {
      attempts++;
      let col = floor(random(COLS - 1));
      let row = floor(random(ROWS - 1));
      
      if (canPlaceVideo(col, row, 2)) {
        occupyVideoRect(col, row, 2, "large");
        let dateCell = findDateCell(col, row, 2);
        placements.push({
          type: "video",
          col, row,
          size: 2,
          mediaIndex: idx,
          dateCell
        });
        placed = true;
        largeVideosPlaced++;
      }
    }
  }
  
  for (let idx of mediaIndices) {
    let alreadyUsed = false;
    for (let p of placements) {
      if (p.mediaIndex === idx) {
        alreadyUsed = true;
        break;
      }
    }
    if (alreadyUsed) continue;
    
    let placed = false;
    let attempts = 0;
    let maxAttempts = 3000;
    
    while (!placed && attempts < maxAttempts) {
      attempts++;
      let col = floor(random(COLS));
      let row = floor(random(ROWS));
      
      if (canPlaceVideo(col, row, 1)) {
        occupyVideoRect(col, row, 1, "single");
        let dateCell = findDateCell(col, row, 1);
        placements.push({
          type: "video",
          col, row,
          size: 1,
          mediaIndex: idx,
          dateCell
        });
        placed = true;
      }
    }
  }
}

function occupyVideoRect(col, row, size, type) {
  for (let y = row; y < row + size; y++) {
    for (let x = col; x < col + size; x++) {
      grid[y][x] = type;
    }
  }
}

function fitsRect(col, row, w, h) {
  if (col + w > COLS || row + h > ROWS) return false;
  
  for (let y = row; y < row + h; y++) {
    for (let x = col; x < col + w; x++) {
      if (grid[y][x] != null) return false;
    }
  }
  return true;
}

function occupyRect(col, row, w, h) {
  for (let y = row; y < row + h; y++) {
    for (let x = col; x < col + w; x++) {
      grid[y][x] = "used";
    }
  }
}

function free(c) {
  return c.x >= 0 && c.x < COLS && c.y >= 0 && c.y < ROWS && grid[c.y][c.x] == null;
}

function findDateCell(col, row, size) {
  let below = {x: col, y: row + size};
  let right = {x: col + size, y: row};
  let above = {x: col, y: row - 1};
  let left  = {x: col - 1, y: row};
  
  if (free(below)) {
    grid[below.y][below.x] = "date";
    return {x: below.x, y: below.y, align: "leftTop"};
  }
  
  if (free(right)) {
    grid[right.y][right.x] = "date";
    return {x: right.x, y: right.y, align: "leftBottom"};
  }
  
  if (free(above)) {
    grid[above.y][above.x] = "date";
    return {x: above.x, y: above.y, align: "leftBottom"};
  }
  
  if (free(left)) {
    grid[left.y][left.x] = "date";
    return {x: left.x, y: left.y, align: "rightBottom"};
  }
  
  return null;
}

function drawDate(p) {
  if (!p.dateCell) return;
  
  let m = media[p.mediaIndex];
  let x = p.dateCell.x * cellW;
  let y = p.dateCell.y * cellH;
  
  push();
  fill(0);
  noStroke();
  
  // Увеличиваем размер шрифта для дат в горизонтальном режиме
  let dateSizeValue = DATE_SIZE;
  if (displayMode === 'landscape') {
    dateSizeValue = DATE_SIZE * 2;
  }
  textSize(dateSizeValue);
  
  let align = p.dateCell.align;
  
  if (align == "leftTop") {
    textAlign(LEFT, TOP);
    text(m.date, x + 5, y + 5);
  }
  
  if (align == "leftBottom") {
    textAlign(LEFT, BOTTOM);
    text(m.date, x + 5, y + cellH - 5);
  }
  
  if (align == "rightBottom") {
    textAlign(RIGHT, BOTTOM);
    text(m.date, x + cellW - 5, y + cellH - 5);
  }
  pop();
}

function mousePressed() {
  if (!userStarted) {
    userStarted = true;
    
    for (let m of media) {
      if (m.video && m.loaded) {
        m.video.muted = true;
        let playPromise = m.video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              m.video.pause();
              m.video.currentTime = 0;
            })
            .catch(error => console.log("Playback failed:", error));
        }
      }
    }
  }
  return false;
}

function mouseMoved() {
  let hoveringVideo = false;
  
  for (let p of placements) {
    if (p.type === "video") {
      let x = p.col * cellW;
      let y = p.row * cellH;
      let w = p.size * cellW;
      let h = p.size * cellH;
      
      if (mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h) {
        hoveringVideo = true;
        break;
      }
    }
  }
  
  noiseActive = hoveringVideo;
}

function keyPressed() {
  if (key === 'd' || key === 'D') {
    console.log('=== DEBUG INFO ===');
    console.log('User started:', userStarted);
    console.log('Videos loaded:', videosLoaded + '/' + media.length);
    console.log('Thumbnails loaded:', thumbnailsLoaded + '/' + thumbnails.length);
    console.log('Placements:', placements.length);
    console.log('Text blocks:', placements.filter(p => p.type === 'text').length);
    console.log('Large videos:', placements.filter(p => p.type === 'video' && p.size === 2).length);
    console.log('Single videos:', placements.filter(p => p.type === 'video' && p.size === 1).length);
  }
}