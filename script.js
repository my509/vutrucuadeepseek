(function() {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');

  // ── DOM cache ──
  const panel = document.getElementById('panel');
  const nameEl = document.getElementById('planet-name');
  const detailsEl = document.getElementById('planet-details');
  const backBtn = document.getElementById('back-btn');

  // ── KÍCH THƯỚC ──
  let W, H;

  // ── CAMERA ──
  let cam = { x: 0, y: 0, s: 1 };
  let camTarget = { x: 0, y: 0, s: 1 };
  const CAM_SPEED = 8.5; // hệ số làm mượt
  const MAX_SCALE = 6.5;
  const MIN_SCALE = 0.3;
  let defaultScale = 1;

  // ── TRẠNG THÁI ──
  let focusPlanet = null; // object hành tinh đang focus
  let isFocus = false;

  // ── PRE-RENDER SAO ──
  let starsCanvas = null;
  let starsReady = false;

  function buildStars() {
    if (!W || !H) return;
    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    const offCtx = off.getContext('2d');
    const count = 300;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 2.2 + 0.3;
      const alpha = Math.random() * 0.45 + 0.35;
      offCtx.fillStyle = `rgba(255,255,255,${alpha})`;
      offCtx.beginPath();
      offCtx.arc(x, y, r, 0, Math.PI * 2);
      offCtx.fill();
    }
    starsCanvas = off;
    starsReady = true;
  }

  // ── DỮ LIỆU ──
  const SUN_RADIUS = 42;
  const planets = [
    { name:'Sao Thủy', en:'Mercury', orbit:65, r:5.5, speed:1.8, color:'#b0b5b9',
      info:{ diameter:'4.879 km', distance:'57,9 triệu km', period:'88 ngày', moons:'0', temp:'-180°C đến 430°C', fact:'Hành tinh nhỏ nhất, gần Mặt Trời nhất.' } },
    { name:'Sao Kim', en:'Venus', orbit:100, r:8.5, speed:1.2, color:'#e6c229',
      info:{ diameter:'12.104 km', distance:'108,2 triệu km', period:'225 ngày', moons:'0', temp:'462°C (tb)', fact:'Nóng nhất hệ Mặt Trời, khí quyển CO₂ dày đặc.' } },
    { name:'Trái Đất', en:'Earth', orbit:140, r:9, speed:0.95, color:'#3b7dd8', highlight:'#5dade2',
      info:{ diameter:'12.742 km', distance:'149,6 triệu km', period:'365,25 ngày', moons:'1', temp:'15°C (tb)', fact:'Hành tinh duy nhất có sự sống.' } },
    { name:'Sao Hỏa', en:'Mars', orbit:180, r:6.5, speed:0.7, color:'#c1440e',
      info:{ diameter:'6.779 km', distance:'227,9 triệu km', period:'687 ngày', moons:'2', temp:'-65°C (tb)', fact:'Hành tinh đỏ, có núi Olympus Mons.' } },
    { name:'Sao Mộc', en:'Jupiter', orbit:260, r:22, speed:0.35, color:'#d4a373', stripes:true,
      info:{ diameter:'139.820 km', distance:'778,5 triệu km', period:'11,86 năm', moons:'95', temp:'-110°C', fact:'Lớn nhất, Vết Đỏ Lớn tồn tại hàng thế kỷ.' } },
    { name:'Sao Thổ', en:'Saturn', orbit:330, r:18, speed:0.25, color:'#f4d03f', ring:true,
      info:{ diameter:'116.460 km', distance:'1,43 tỷ km', period:'29,46 năm', moons:'146', temp:'-140°C', fact:'Vành đai băng đá rực rỡ.' } },
    { name:'Sao Thiên Vương', en:'Uranus', orbit:390, r:13, speed:0.17, color:'#6fd4d4',
      info:{ diameter:'50.724 km', distance:'2,87 tỷ km', period:'84 năm', moons:'27', temp:'-195°C', fact:'Quay nghiêng ~98°, lạnh nhất.' } },
    { name:'Sao Hải Vương', en:'Neptune', orbit:450, r:12.5, speed:0.13, color:'#2d5f9e',
      info:{ diameter:'49.244 km', distance:'4,5 tỷ km', period:'164,8 năm', moons:'16', temp:'-200°C', fact:'Gió nhanh nhất hệ Mặt Trời (2100 km/h).' } }
  ];

  let angles = planets.map(() => Math.random() * Math.PI * 2);

  // ── RESIZE ──
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    const maxOrbit = 450;
    defaultScale = (Math.min(W, H) * 0.75) / (maxOrbit * 2);
    defaultScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, defaultScale));

    if (!isFocus) {
      camTarget.x = W / 2;
      camTarget.y = H / 2;
      camTarget.s = defaultScale;
    } else if (focusPlanet) {
      recalcFocusTarget();
    }
    buildStars();
  }

  function recalcFocusTarget() {
    if (!focusPlanet || !isFocus) return;
    const p = focusPlanet;
    const wx = p.orbit * Math.cos(p._angle);
    const wy = p.orbit * Math.sin(p._angle);
    camTarget.x = W / 2 - wx * camTarget.s;
    camTarget.y = H / 2 - wy * camTarget.s;
  }

  // ── PANEL ──
  function showPanel(planet) {
    nameEl.textContent = planet.name;
    const i = planet.info;
    detailsEl.innerHTML = `
      <p><strong>Đường kính:</strong> ${i.diameter}</p>
      <p><strong>Khoảng cách:</strong> ${i.distance}</p>
      <p><strong>Chu kỳ:</strong> ${i.period}</p>
      <p><strong>Mặt trăng:</strong> ${i.moons}</p>
      <p><strong>Nhiệt độ:</strong> ${i.temp}</p>
      <p style="margin-top:6px;border:none"><em>${i.fact}</em></p>
    `;
    panel.classList.remove('hidden');
  }

  function hidePanel() {
    panel.classList.add('hidden');
  }

  // ── FOCUS ──
  function focusOn(planet) {
    isFocus = true;
    focusPlanet = planet;
    planet._angle = angles[planets.indexOf(planet)];
    const desired = Math.min(MAX_SCALE, Math.max(defaultScale * 1.8, (W * 0.18) / (planet.r * 2)));
    camTarget.s = desired;
    recalcFocusTarget();
    showPanel(planet);
  }

  function unfocus() {
    isFocus = false;
    focusPlanet = null;
    camTarget.x = W / 2;
    camTarget.y = H / 2;
    camTarget.s = defaultScale;
    hidePanel();
  }

  // ── HIT TEST ──
  function hitTest(mx, my) {
    // Kiểm tra các hành tinh (từ ngoài vào trong để ưu tiên lớp gần nhất?)
    // Nhưng ở đây ta ưu tiên hành tinh nhỏ nhất trong phạm vi click để chính xác
    let best = null;
    let bestDist = Infinity;

    for (let i = 0; i < planets.length; i++) {
      const p = planets[i];
      const a = angles[i];
      const sx = p.orbit * Math.cos(a) * cam.s + cam.x;
      const sy = p.orbit * Math.sin(a) * cam.s + cam.y;
      const sr = p.r * cam.s + 7;
      const d = (mx - sx) ** 2 + (my - sy) ** 2;
      if (d < sr * sr && d < bestDist) {
        bestDist = d;
        best = p;
      }
    }

    // Mặt trời
    if (!best) {
      const sunSr = SUN_RADIUS * cam.s + 9;
      if ((mx - cam.x) ** 2 + (my - cam.y) ** 2 < sunSr * sunSr) {
        return 'sun';
      }
    }
    return best;
  }

  // ── EVENTS ──
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = hitTest(mx, my);

    if (hit === 'sun') {
      if (isFocus) unfocus();
      return;
    }
    if (hit) {
      if (isFocus && focusPlanet === hit) unfocus();
      else focusOn(hit);
    } else {
      if (isFocus) unfocus();
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = hitTest(mx, my);
    canvas.style.cursor = (hit && hit !== 'sun') || hit === 'sun' ? 'pointer' : 'default';
  });

  backBtn.addEventListener('click', unfocus);
  window.addEventListener('resize', resize);

  // ── VẼ ──
  function drawOrbit(r) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Gradient cache để tránh tạo lại mỗi frame
  let sunGlowGrad = null;
  let sunBodyGrad = null;

  function drawSun() {
    if (!sunGlowGrad) {
      sunGlowGrad = ctx.createRadialGradient(0, 0, SUN_RADIUS * 0.2, 0, 0, SUN_RADIUS * 2.5);
      sunGlowGrad.addColorStop(0, 'rgba(255,200,50,0.9)');
      sunGlowGrad.addColorStop(0.4, 'rgba(255,140,20,0.5)');
      sunGlowGrad.addColorStop(1, 'rgba(255,80,0,0)');
      sunBodyGrad = ctx.createRadialGradient(-SUN_RADIUS*0.2, -SUN_RADIUS*0.2, SUN_RADIUS*0.1, 0, 0, SUN_RADIUS);
      sunBodyGrad.addColorStop(0, '#fff7b0');
      sunBodyGrad.addColorStop(0.5, '#ffb703');
      sunBodyGrad.addColorStop(1, '#e05a00');
    }
    ctx.fillStyle = sunGlowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, SUN_RADIUS * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = sunBodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, SUN_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlanet(x, y, p) {
    ctx.save();
    ctx.translate(x, y);

    if (p.ring) {
      ctx.save();
      ctx.rotate(0.45);
      ctx.scale(1, 0.35);
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 2.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(220,200,140,0.7)';
      ctx.lineWidth = p.r * 0.7;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 1.6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200,180,120,0.4)';
      ctx.lineWidth = p.r * 0.35;
      ctx.stroke();
      ctx.restore();
    }

    const grad = ctx.createRadialGradient(-p.r*0.25, -p.r*0.25, p.r*0.1, 0, 0, p.r);
    grad.addColorStop(0, p.highlight || p.color);
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.fill();

    if (p.stripes) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(180,100,50,0.25)';
      for (let sy = -p.r; sy < p.r; sy += p.r * 0.45) {
        ctx.fillRect(-p.r, sy, p.r * 2, p.r * 0.2);
      }
      ctx.fillStyle = 'rgba(220,160,100,0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawLabel(x, y, text, scale) {
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(9, 11 / scale)}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y - 7 / scale);
  }

  let lastTime = performance.now();

  function loop(now) {
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt > 0.15) dt = 0.15; // clamp tránh nhảy vọt
    if (dt <= 0) dt = 0.016;

    // Cập nhật góc quay
    if (!isFocus) {
      for (let i = 0; i < planets.length; i++) {
        angles[i] += planets[i].speed * dt;
      }
    }

    // Camera smoothing
    const t = 1 - Math.exp(-CAM_SPEED * dt);
    cam.x += (camTarget.x - cam.x) * t;
    cam.y += (camTarget.y - cam.y) * t;
    cam.s += (camTarget.s - cam.s) * t;

    // Vẽ
    ctx.clearRect(0, 0, W, H);

    // Sao nền (ảnh tĩnh pre-render)
    if (starsReady && starsCanvas) {
      ctx.drawImage(starsCanvas, 0, 0);
    }

    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.s, cam.s);

    // Quỹ đạo
    for (const p of planets) drawOrbit(p.orbit);

    // Mặt trời
    drawSun();

    // Hành tinh
    for (let i = 0; i < planets.length; i++) {
      const p = planets[i];
      const a = angles[i];
      const px = p.orbit * Math.cos(a);
      const py = p.orbit * Math.sin(a);
      drawPlanet(px, py, p);
      if (!isFocus || focusPlanet !== p) {
        drawLabel(px, py - p.r - 3, p.name, cam.s);
      }
    }

    ctx.restore();
    requestAnimationFrame(loop);
  }

  // ── START ──
  resize();
  cam.x = camTarget.x;
  cam.y = camTarget.y;
  cam.s = camTarget.s;
  hidePanel();
  window.requestAnimationFrame(loop);
})();
