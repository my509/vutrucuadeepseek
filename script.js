// script.js
(function() {
  const canvas = document.getElementById('solarCanvas');
  const ctx = canvas.getContext('2d');
  const infoPanel = document.getElementById('info-panel');
  const planetNameEl = document.getElementById('planet-name');
  const planetDetailsEl = document.getElementById('planet-details');
  const backBtn = document.getElementById('back-btn');

  // ---------- KÍCH THƯỚC ----------
  let W, H;

  // ---------- CAMERA ----------
  let offsetX = 0, offsetY = 0, scale = 1;
  let targetOffsetX = 0, targetOffsetY = 0, targetScale = 1;
  let defaultScale = 1;
  const maxScale = 6.5;
  const minScale = 0.3;

  // ---------- TRẠNG THÁI ----------
  let isFocus = false;
  let focusedPlanet = null;
  let lastTime = performance.now();

  // ---------- SAO NỀN ----------
  const stars = [];
  const STAR_COUNT = 300;

  // ---------- DỮ LIỆU HÀNH TINH ----------
  const SUN_RADIUS = 42;
  const planets = [
    { 
      name: 'Sao Thủy', nameEn: 'Mercury', orbit: 65, radius: 5.5, speed: 1.8, color: '#b0b5b9',
      info: {
        diameter: '4.879 km',
        distance: '57,9 triệu km',
        period: '88 ngày',
        moons: '0',
        temp: '-180°C đến 430°C',
        fact: 'Hành tinh nhỏ nhất và gần Mặt Trời nhất. Bề mặt lởm chởm hố va chạm.'
      }
    },
    { 
      name: 'Sao Kim', nameEn: 'Venus', orbit: 100, radius: 8.5, speed: 1.2, color: '#e6c229',
      info: {
        diameter: '12.104 km',
        distance: '108,2 triệu km',
        period: '225 ngày',
        moons: '0',
        temp: '462°C (trung bình)',
        fact: 'Hành tinh nóng nhất hệ Mặt Trời, có khí quyển dày đặc CO₂ và mây axit sulfuric.'
      }
    },
    { 
      name: 'Trái Đất', nameEn: 'Earth', orbit: 140, radius: 9, speed: 0.95, color: '#3b7dd8',
      info: {
        diameter: '12.742 km',
        distance: '149,6 triệu km',
        period: '365,25 ngày',
        moons: '1',
        temp: '15°C (trung bình)',
        fact: 'Hành tinh duy nhất được biết có sự sống. 71% bề mặt là nước.'
      }
    },
    { 
      name: 'Sao Hỏa', nameEn: 'Mars', orbit: 180, radius: 6.5, speed: 0.7, color: '#c1440e',
      info: {
        diameter: '6.779 km',
        distance: '227,9 triệu km',
        period: '687 ngày',
        moons: '2 (Phobos, Deimos)',
        temp: '-65°C (trung bình)',
        fact: 'Hành tinh đỏ với núi lửa Olympus Mons cao nhất hệ Mặt Trời (21,9 km).'
      }
    },
    { 
      name: 'Sao Mộc', nameEn: 'Jupiter', orbit: 260, radius: 22, speed: 0.35, color: '#d4a373',
      hasStripes: true,
      info: {
        diameter: '139.820 km',
        distance: '778,5 triệu km',
        period: '11,86 năm',
        moons: '95',
        temp: '-110°C (đỉnh mây)',
        fact: 'Hành tinh lớn nhất, nổi tiếng với Vết Đỏ Lớn – cơn bão kéo dài hàng thế kỷ.'
      }
    },
    { 
      name: 'Sao Thổ', nameEn: 'Saturn', orbit: 330, radius: 18, speed: 0.25, color: '#f4d03f',
      hasRing: true,
      info: {
        diameter: '116.460 km',
        distance: '1,43 tỷ km',
        period: '29,46 năm',
        moons: '146',
        temp: '-140°C',
        fact: 'Nổi bật với hệ vành đai rực rỡ làm từ băng và đá, có thể nhìn thấy từ Trái Đất.'
      }
    },
    { 
      name: 'Sao Thiên Vương', nameEn: 'Uranus', orbit: 390, radius: 13, speed: 0.17, color: '#6fd4d4',
      info: {
        diameter: '50.724 km',
        distance: '2,87 tỷ km',
        period: '84 năm',
        moons: '27',
        temp: '-195°C',
        fact: 'Hành tinh lạnh nhất, quay nghiêng gần 98°, có lẽ do va chạm khổng lồ trong quá khứ.'
      }
    },
    { 
      name: 'Sao Hải Vương', nameEn: 'Neptune', orbit: 450, radius: 12.5, speed: 0.13, color: '#2d5f9e',
      info: {
        diameter: '49.244 km',
        distance: '4,5 tỷ km',
        period: '164,8 năm',
        moons: '16',
        temp: '-200°C',
        fact: 'Hành tinh xa nhất, có tốc độ gió nhanh nhất hệ Mặt Trời (lên đến 2.100 km/h).'
      }
    }
  ];

  // Góc quay hiện tại của mỗi hành tinh (radian)
  let planetAngles = planets.map(() => Math.random() * Math.PI * 2);

  // ---------- KHỞI TẠO SAO ----------
  function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 2.2 + 0.4,
        twinkleSpeed: Math.random() * 3 + 1,
        twinkleOffset: Math.random() * Math.PI * 2,
        baseOpacity: Math.random() * 0.5 + 0.4
      });
    }
  }

  // ---------- RESIZE ----------
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    
    // Tính scale mặc định để toàn bộ hệ mặt trời vừa màn hình
    const maxOrbit = 450;
    defaultScale = (Math.min(W, H) * 0.75) / (maxOrbit * 2);
    defaultScale = Math.max(minScale, Math.min(maxScale, defaultScale));
    
    // Cập nhật target mặc định nếu không focus
    if (!isFocus) {
      targetOffsetX = W / 2;
      targetOffsetY = H / 2;
      targetScale = defaultScale;
    } else if (focusedPlanet) {
      // Cập nhật target focus với vị trí mới
      updateFocusTarget();
    }
    
    initStars();
  }

  function updateFocusTarget() {
    if (!focusedPlanet) return;
    const p = focusedPlanet;
    const worldX = p.orbit * Math.cos(p.angle);
    const worldY = p.orbit * Math.sin(p.angle);
    targetOffsetX = W / 2 - worldX * targetScale;
    targetOffsetY = H / 2 - worldY * targetScale;
  }

  // ---------- HIỂN THỊ / ẨN PANEL ----------
  function showPanel(planet) {
    planetNameEl.textContent = planet.name;
    const info = planet.info;
    planetDetailsEl.innerHTML = `
      <p><strong>Đường kính:</strong> ${info.diameter}</p>
      <p><strong>Khoảng cách đến Mặt Trời:</strong> ${info.distance}</p>
      <p><strong>Chu kỳ quỹ đạo:</strong> ${info.period}</p>
      <p><strong>Số mặt trăng:</strong> ${info.moons}</p>
      <p><strong>Nhiệt độ:</strong> ${info.temp}</p>
      <p style="margin-top:8px; border-bottom:none;"><em>${info.fact}</em></p>
    `;
    infoPanel.classList.remove('hidden');
  }

  function hidePanel() {
    infoPanel.classList.add('hidden');
    planetNameEl.textContent = '';
    planetDetailsEl.innerHTML = '';
  }

  // ---------- CHUYỂN ĐỔI FOCUS ----------
  function focusPlanet(planet) {
    isFocus = true;
    focusedPlanet = planet;
    // Lưu góc hiện tại vào planet object để dùng cho updateFocusTarget
    planet.angle = planetAngles[planets.indexOf(planet)];
    
    // Tính target scale phù hợp (hành tinh chiếm ~18% chiều ngang màn hình)
    const desiredScreenSize = W * 0.18;
    const calcScale = desiredScreenSize / (planet.radius * 2);
    targetScale = Math.min(maxScale, Math.max(defaultScale * 1.8, calcScale));
    
    updateFocusTarget();
    showPanel(planet);
  }

  function unfocus() {
    isFocus = false;
    focusedPlanet = null;
    targetOffsetX = W / 2;
    targetOffsetY = H / 2;
    targetScale = defaultScale;
    hidePanel();
  }

  // ---------- XỬ LÝ CLICK ----------
  function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Chuyển mouse sang world space
    const worldX = (mouseX - offsetX) / scale;
    const worldY = (mouseY - offsetY) / scale;

    // Kiểm tra click vào hành tinh nào (theo screen space để chính xác)
    let clickedPlanet = null;
    for (let i = 0; i < planets.length; i++) {
      const p = planets[i];
      const angle = planetAngles[i];
      const px = p.orbit * Math.cos(angle);
      const py = p.orbit * Math.sin(angle);
      // Screen position
      const sx = px * scale + offsetX;
      const sy = py * scale + offsetY;
      const screenRadius = p.radius * scale + 6; // thêm padding cho dễ click
      const dist = Math.hypot(mouseX - sx, mouseY - sy);
      if (dist <= screenRadius) {
        clickedPlanet = planets[i];
        break;
      }
    }

    // Kiểm tra click vào Mặt Trời
    const sunScreenX = offsetX;
    const sunScreenY = offsetY;
    const sunScreenRadius = SUN_RADIUS * scale + 8;
    if (!clickedPlanet && Math.hypot(mouseX - sunScreenX, mouseY - sunScreenY) <= sunScreenRadius) {
      // Click vào mặt trời -> quay lại toàn cảnh (nếu đang focus) hoặc không làm gì
      if (isFocus) unfocus();
      return;
    }

    if (clickedPlanet) {
      if (isFocus && focusedPlanet === clickedPlanet) {
        // Click lại hành tinh đang focus -> unfocus
        unfocus();
      } else {
        focusPlanet(clickedPlanet);
      }
    } else {
      // Click vào khoảng trống
      if (isFocus) unfocus();
    }
  }

  // ---------- DI CHUYỂN CHUỘT (ĐỔI CURSOR) ----------
  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    let hovering = false;
    // Kiểm tra hành tinh
    for (let i = 0; i < planets.length; i++) {
      const p = planets[i];
      const angle = planetAngles[i];
      const px = p.orbit * Math.cos(angle);
      const py = p.orbit * Math.sin(angle);
      const sx = px * scale + offsetX;
      const sy = py * scale + offsetY;
      const screenRadius = p.radius * scale + 6;
      if (Math.hypot(mouseX - sx, mouseY - sy) <= screenRadius) {
        hovering = true;
        break;
      }
    }
    // Kiểm tra mặt trời
    if (!hovering) {
      const sunSR = SUN_RADIUS * scale + 8;
      if (Math.hypot(mouseX - offsetX, mouseY - offsetY) <= sunSR) {
        hovering = true;
      }
    }
    canvas.style.cursor = hovering ? 'pointer' : 'default';
  }

  // ---------- VẼ ----------
  function drawStars(time) {
    for (const star of stars) {
      const twinkle = Math.sin(time * 0.002 * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.baseOpacity + twinkle * 0.25;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.15, alpha)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawOrbit(radius, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawSun(x, y, radius) {
    // Glow
    const glowGrad = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 2.5);
    glowGrad.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
    glowGrad.addColorStop(0.4, 'rgba(255, 140, 20, 0.5)');
    glowGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Thân mặt trời
    const sunGrad = ctx.createRadialGradient(x - radius*0.2, y - radius*0.2, radius*0.1, x, y, radius);
    sunGrad.addColorStop(0, '#fff7b0');
    sunGrad.addColorStop(0.5, '#ffb703');
    sunGrad.addColorStop(1, '#e05a00');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlanet(x, y, radius, color, options = {}) {
    ctx.save();
    ctx.translate(x, y);
    
    // Vành đai (Saturn) - vẽ sau lưng và trước mặt? Vẽ ellipse trước khi vẽ hành tinh.
    if (options.hasRing) {
      ctx.save();
      ctx.rotate(0.45); // độ nghiêng
      ctx.scale(1, 0.35);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 2.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(220, 200, 140, 0.7)';
      ctx.lineWidth = radius * 0.7;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200, 180, 120, 0.4)';
      ctx.lineWidth = radius * 0.35;
      ctx.stroke();
      ctx.restore();
    }

    // Hành tinh
    const grad = ctx.createRadialGradient(-radius*0.25, -radius*0.25, radius*0.1, 0, 0, radius);
    grad.addColorStop(0, options.highlight || color);
    grad.addColorStop(1, options.shadow || '#000000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Sọc cho Jupiter
    if (options.hasStripes) {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(180, 100, 50, 0.25)';
      for (let sy = -radius; sy < radius; sy += radius * 0.45) {
        ctx.fillRect(-radius, sy, radius * 2, radius * 0.2);
      }
      ctx.fillStyle = 'rgba(220, 160, 100, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawLabel(x, y, text) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.max(10, 12 / scale)}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y - 8 / scale);
  }

  // ---------- ANIMATION LOOP ----------
  function animate(timestamp) {
    const dt = Math.min(0.1, (timestamp - lastTime) / 1000); // tránh dt quá lớn
    lastTime = timestamp;

    // Cập nhật góc hành tinh nếu không focus
    if (!isFocus) {
      for (let i = 0; i < planets.length; i++) {
        planetAngles[i] += planets[i].speed * dt;
      }
    } else {
      // Khi focus vẫn cho quay rất chậm để tạo cảm giác sống động (tùy chọn)
      // Nhưng giữ nguyên vị trí để thuyết trình rõ ràng -> không quay
    }

    // Smooth camera movement
    offsetX += (targetOffsetX - offsetX) * 0.12;
    offsetY += (targetOffsetY - offsetY) * 0.12;
    scale += (targetScale - scale) * 0.12;

    // Vẽ
    ctx.clearRect(0, 0, W, H);
    
    // Background sao (screen space)
    drawStars(timestamp);

    // Áp dụng camera transform
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Vẽ quỹ đạo
    for (const p of planets) {
      drawOrbit(p.orbit, 0, 0);
    }

    // Vẽ Mặt Trời
    drawSun(0, 0, SUN_RADIUS);

    // Vẽ các hành tinh
    for (let i = 0; i < planets.length; i++) {
      const p = planets[i];
      const angle = planetAngles[i];
      const px = p.orbit * Math.cos(angle);
      const py = p.orbit * Math.sin(angle);
      const options = {};
      if (p.hasRing) options.hasRing = true;
      if (p.hasStripes) options.hasStripes = true;
      if (p.name === 'Trái Đất') options.highlight = '#5dade2';
      drawPlanet(px, py, p.radius, p.color, options);
      
      // Nhãn tên (chỉ khi scale không quá lớn và không focus để tránh rối)
      if (!isFocus || focusedPlanet !== p) {
        drawLabel(px, py - p.radius - 4, p.name);
      }
    }

    ctx.restore();

    requestAnimationFrame(animate);
  }

  // ---------- SỰ KIỆN ----------
  canvas.addEventListener('click', handleCanvasClick);
  canvas.addEventListener('mousemove', handleMouseMove);
  backBtn.addEventListener('click', unfocus);
  window.addEventListener('resize', () => {
    resize();
  });

  // ---------- KHỞI ĐỘNG ----------
  resize();
  // Đặt camera về mặc định ngay lập tức
  offsetX = targetOffsetX;
  offsetY = targetOffsetY;
  scale = targetScale;
  hidePanel();
  requestAnimationFrame(animate);
})();
