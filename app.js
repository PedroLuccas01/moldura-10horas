(() => {
  const SIZE = 1080;
  const FRAME_SRC = '/assets/moldura.png';
  const FILE_NAME = 'minha-moldura.jpg';

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const fileInput = document.getElementById('file');
  const fileLabel = document.getElementById('fileLabel');
  const zoom = document.getElementById('zoom');
  const resetBtn = document.getElementById('reset');
  const downloadBtn = document.getElementById('download');
  const shareBtn = document.getElementById('share');
  const loading = document.getElementById('loading');

  const frame = new Image();
  let frameReady = false;
  let photo = null;
  let baseScale = 1;   // escala que faz a foto cobrir a moldura
  let zoomFactor = 1;  // multiplicador escolhido pelo usuário
  let offX = 0, offY = 0; // deslocamento do centro da foto (px do canvas)

  frame.onload = () => { frameReady = true; loading.hidden = true; draw(); };
  frame.onerror = () => { loading.textContent = 'Não foi possível carregar a moldura.'; };
  frame.src = FRAME_SRC;

  function scale() { return baseScale * zoomFactor; }

  function clampOffsets() {
    if (!photo) return;
    const w = photo.width * scale(), h = photo.height * scale();
    const maxX = Math.max(0, (w - SIZE) / 2);
    const maxY = Math.max(0, (h - SIZE) / 2);
    offX = Math.min(maxX, Math.max(-maxX, offX));
    offY = Math.min(maxY, Math.max(-maxY, offY));
  }

  function drawPlaceholder() {
    const g = ctx.createLinearGradient(0, 0, 0, SIZE);
    g.addColorStop(0, '#5a1d06');
    g.addColorStop(1, '#1f0c04');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f6e7d2';
    ctx.font = '900 92px "Big Shoulders Display", sans-serif';
    ctx.fillText('SUA FOTO AQUI', SIZE / 2, 420);
    ctx.fillStyle = '#e8892b';
    ctx.font = 'italic 44px "Instrument Serif", serif';
    ctx.fillText('toque para escolher', SIZE / 2, 500);
  }

  function draw() {
    ctx.clearRect(0, 0, SIZE, SIZE);
    if (photo) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, SIZE, SIZE);
      const s = scale();
      const w = photo.width * s, h = photo.height * s;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(photo, SIZE / 2 - w / 2 + offX, SIZE / 2 - h / 2 + offY, w, h);
    } else {
      drawPlaceholder();
    }
    if (frameReady) ctx.drawImage(frame, 0, 0, SIZE, SIZE);
  }

  function setEnabled(on) {
    zoom.disabled = resetBtn.disabled = downloadBtn.disabled = shareBtn.disabled = !on;
  }

  function resetView() {
    if (!photo) return;
    baseScale = Math.max(SIZE / photo.width, SIZE / photo.height);
    zoomFactor = 1; offX = 0; offY = 0;
    zoom.value = '1';
    draw();
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      photo = img;
      resetView();
      setEnabled(true);
      fileLabel.textContent = 'Trocar foto';
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert('Não foi possível abrir essa imagem. Tente uma foto em JPG ou PNG.');
    };
    img.src = url;
    fileInput.value = '';
  });

  zoom.addEventListener('input', () => {
    zoomFactor = parseFloat(zoom.value);
    clampOffsets();
    draw();
  });

  resetBtn.addEventListener('click', resetView);

  // ---- Arrastar e pinçar (mouse e toque) ----
  const pointers = new Map();
  let pinchStart = null;

  function toCanvas(dx) { return dx * (SIZE / canvas.getBoundingClientRect().width); }

  canvas.addEventListener('pointerdown', (e) => {
    if (!photo) { fileInput.click(); return; }
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.classList.add('dragging');
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: zoomFactor };
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!photo || !pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);
    if (pointers.size === 1) {
      offX += toCanvas(cur.x - prev.x);
      offY += toCanvas(cur.y - prev.y);
    } else if (pointers.size === 2 && pinchStart) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      zoomFactor = Math.min(4, Math.max(1, pinchStart.zoom * dist / pinchStart.dist));
      zoom.value = String(zoomFactor);
      // acompanha o movimento médio dos dois dedos
      offX += toCanvas(cur.x - prev.x) / 2;
      offY += toCanvas(cur.y - prev.y) / 2;
    }
    clampOffsets();
    draw();
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 0) canvas.classList.remove('dragging');
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  canvas.addEventListener('wheel', (e) => {
    if (!photo) return;
    e.preventDefault();
    zoomFactor = Math.min(4, Math.max(1, zoomFactor * (e.deltaY < 0 ? 1.06 : 1 / 1.06)));
    zoom.value = String(zoomFactor);
    clampOffsets();
    draw();
  }, { passive: false });

  // ---- Exportar ----
  function toBlob() {
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
  }

  downloadBtn.addEventListener('click', async () => {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = FILE_NAME;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  });

  // Compartilhar só aparece quando o aparelho suporta enviar arquivos
  try {
    const test = new File([new Blob()], 'x.jpg', { type: 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [test] })) shareBtn.hidden = false;
  } catch (_) { /* sem suporte */ }

  shareBtn.addEventListener('click', async () => {
    const blob = await toBlob();
    if (!blob) return;
    const file = new File([blob], FILE_NAME, { type: 'image/jpeg' });
    try {
      await navigator.share({ files: [file] });
    } catch (err) {
      if (err && err.name !== 'AbortError') downloadBtn.click();
    }
  });

  // redesenha o texto do placeholder quando a fonte terminar de carregar
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  draw();
})();
