/** =========================================================================
 * 1. LOCAL STORAGE WRAPPER & CENTRAL STATE MANAGEMENT SYSTEM
 * ========================================================================= */
const Storage = {
  get(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } 
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  remove(key) { localStorage.removeItem(key); }
};

// Application State Schema definition
let appState = {
  username: Storage.get('ts_username', 'Trader Pemula'),
  completedMaterials: Storage.get('ts_completed_materials', []),
  simulationsCount: Storage.get('ts_simulations_count', 0),
  lastQuizScore: Storage.get('ts_last_quiz_score', null),
  quizAttempts: Storage.get('ts_quiz_attempts', 0),
  totalQuizScores: Storage.get('ts_total_quiz_scores', 0),
  integratedRiskScore: Storage.get('ts_integrated_risk', 0)
};

/** =========================================================================
 * 2. INDONESIAN CURRENCY & PERCENT FORMATTING STATIC HELPERS
 * ========================================================================= */
function formatNumberID(value) {
  return new Intl.NumberFormat('id-ID').format(value);
}
function formatPercentID(value) {
  return Number(value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

/** =========================================================================
 * 3. EDUCATIONAL CONTENT REPOSITORY (MATERI, CHEATSHEET & CASES)
 * ========================================================================= */
const MaterialsData = [
  { id: "candle", title: "Candlestick Anatomy", icon: "fa-chart-bar", desc: "Membaca harga Open, High, Low, Close (OHLC) dan aksi rejection buyer/seller.", safe: "Candle hijau body besar close dekat High di area Support kuat didukung akumulasi volume tinggi.", alert: "Sumbu atas panjang (rejection atas), kenaikan harga semu tanpa volume pendukung.", risk: "Candle merah Marubozu besar menembus support (breakdown) disertai ledakan volume jual." },
  { id: "supres", title: "Support & Resistance", icon: "fa-layer-group", desc: "Menemukan titik lantai (support) dan plafon (resistance) pergerakan harga pasar.", safe: "Harga memantul (rebound) naik dari support utama dikonfirmasi candle pembalikan arah/rejection ekor panjang.", alert: "Harga mendekati resistance kuat tetapi volume transaksi mengecil, rawan berbalik turun.", risk: "Support krusial jebol ke bawah, harga close di bawah garis lantai berubah status menjadi resistance baru." },
  { id: "ma", title: "Moving Average (MA)", icon: "fa-wave-square", desc: "Menganalisis tren besar jangka menengah hingga panjang memakai garis MA50, MA100, MA200.", safe: "Harga bergerak stabil di atas garis MA200, struktur MA50 berada di atas MA100 (Golden Cross).", alert: "Harga memotong ke bawah MA50, menguji MA200 namun belum ada sinyal pembalikan arah yang kuat.", risk: "Harga jebol jauh di bawah MA200, kemiringan garis MA200 menukik tajam ke bawah (Downtrend dikonfirmasi)." },
  { id: "vol", title: "Volume Transaction", icon: "fa-chart-area", desc: "Mendeteksi kevalidan pergerakan harga lewat intensitas partisipasi modal transaksi market.", safe: "Harga breakout mencetak level tertinggi baru didukung volume di atas rata-rata 20 hari (valid breakout).", alert: "Harga terus naik tinggi namun grafik batang volume justru menurun (Divergence, rawan false breakout).", risk: "Harga anjlok parah menembus support dikonfirmasi dengan volume transaksi yang sangat masif." },
  { id: "macd", title: "MACD Momentum", icon: "fa-arrows-left-right", desc: "Mengidentifikasi perubahan momentum tren melalui perpotongan garis MACD & Signal Line.", safe: "Garis MACD melakukan persilangan emas ke atas (Golden Cross) garis signal, histogram berubah hijau.", alert: "MACD naik tetapi posisi struktur masih berada jauh di bawah garis nol, kekuatan tren masih terbatas.", risk: "Garis MACD memotong ke bawah garis signal (Dead Cross) disertai pelebaran balok histogram merah." },
  { id: "rsi", title: "Relative Strength Index", icon: "fa-gauge-high", desc: "Mengukur kejenuhan pasar lewat rasio rentang skor momentum skala 0 sampai 100.", safe: "Skor RSI berada di area aman netral atas (50 - 65) menunjukkan akumulasi tren naik yang sehat.", alert: "Skor RSI merangkak naik melewati ambang 70 - 75 memasuki zona jenuh beli (Overbought), rawan aksi ambil untung.", risk: "RSI meluncur deras di bawah angka 50 mengonfirmasi hilangnya tenaga dominasi momentum beli." },
  { id: "stoch", title: "Stochastic Oscillator", icon: "fa-bolt", desc: "Membaca titik jenuh beli dan jual jangka pendek berbasis posisi harga penutupan.", safe: "Garis Stochastic memotong naik dari bawah level 20 (Oversold), memberikan sinyal awal technical rebound.", alert: "Kedua garis berada menetap di atas level 80, momentum jangka pendek sudah jenuh beli namun tren utama kuat.", risk: "Terjadi Dead Cross dari atas area level 80 mengonfirmasi struktur pembalikan arah turun jangka pendek." },
  { id: "orderbook", title: "Order Book System", icon: "fa-list-ol", desc: "Menganalisis peta psikologi pasar dari tebal tipisnya antrian papan Bid dan Offer.", safe: "Susunan antrian Bid tebal melindungi harga di bawah, sedangkan Offer tipis teratur menandakan distribusi sehat.", alert: "Tembok antrian Offer tebal menghadang tepat di atas harga berjalan, membatasi ruang kenaikan jangka pendek.", risk: "Antrian Bid kosong/sangat tipis, rawan tersapu jebol ke bawah jika muncul aksi panic selling." },
  { id: "araarb", title: "Auto Rejection (ARA/ARB)", icon: "fa-ban", desc: "Memahami regulasi batas maksimum kenaikan dan penurunan harga saham harian pasar modal.", safe: "Harga bergerak wajar di tengah rentang harian, memiliki ruang tumbuh yang rasional menuju target profit.", alert: "Harga sudah melonjak mendekati batas ARA harian, sangat berisiko memicu euforia buta/FOMO akut.", risk: "Saham terkunci di batas bawah ARB dengan jutaan lot antrian jual yang tidak menampung pembeli." }
];

const CaseStudies = [
  { title: "Kasus 1: Rebound Sempurna MA200", desc: "Saham XYZ turun menguji MA200 pada harga 3.200 (MA200 di 3.086). Terbentuk candle hammer dengan volume 1.7x lipat di atas rata-rata. RSI bertahan stabil di 58.", status: "AMAN RELATIF", badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
  { title: "Kasus 2: Katastrofe Breakdown Support", desc: "Saham ABC gagal bertahan di level support psikologis, harga close di 2.980 menembus MA200 ke bawah. Volume jual melonjak 1.8x dari rata-rata biasa. MACD mengonfirmasi Dead Cross.", status: "TIDAK AMAN", badge: "bg-red-500/20 text-red-400 border border-red-500/30" },
  { title: "Kasus 3: Jebakan Overbought Saham FOMO", desc: "Saham MNO meroket naik tinggi dalam 4 hari beruntun ke harga 3.600, menjauhi MA200 (+16,65%). Nilai RSI menyentuh angka ekstrem 76 dan Stochastic berada di posisi 88.", status: "WASPADA", badge: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" }
];

const QuizQuestions = [
  { q: "Jika harga close suatu saham berada di bawah garis MA200, maka dalam strategi trend-following kondisi tren jangka panjang dianggap?", a: ["Bullish Kuat", "Konsolidasi/Sideways", "Downtrend / Lemah"], c: 2, e: "Harga di bawah MA200 menandakan bahwa secara statistik tren jangka panjang sedang dikuasai oleh penjual (Downtrend)." },
  { q: "Indikator Relative Strength Index (RSI) menunjukkan angka 82. Kondisi psikologi pasar ini dikategorikan sebagai?", a: ["Oversold (Jenuh Jual)", "Overbought (Jenuh Beli)", "Netral Sehat"], c: 1, e: "Skor RSI di atas 70 mengindikasikan kondisi Overbought, yang berarti harga sudah naik terlalu cepat dan rawan aksi profit taking." },
  { q: "Harga saham melonjak naik 8% hari ini, tetapi total volume transaksi sangat kecil (di bawah rata-rata MA20). Kondisi ini mengindikasikan?", a: ["Kenaikan valid didukung bandar", "Rawan pembalikan arah (Kenaikan Palsu)", "Aman untuk dibeli porsi besar"], c: 1, e: "Kenaikan harga tanpa didukung volume yang memadai menandakan kurangnya partisipasi pasar. Kenaikan tersebut rapuh dan rawan berbalik turun." },
  { q: "Peristiwa saat garis MACD memotong ke atas garis signal dari area bawah dinamakan?", a: ["Golden Cross", "Dead Cross", "Divergence Bearish"], c: 0, e: "Perpotongan garis MACD ke atas garis signal disebut Golden Cross, menandakan awal perubahan momentum menjadi bullish." },
  { q: "Papan Order Book yang menunjukkan antrian Offer sangat tebal sedangkan Bid tipis memberikan petunjuk awal bahwa?", a: ["Saham akan segera ARA", "Tekanan jual pasar sedang tinggi", "Banyak institusi besar sedang mengantri beli"], c: 1, e: "Offer tebal mencerminkan banyaknya pihak yang ingin menjual saham di harga atas, sehingga menahan laju kenaikan harga." }
];

/** =========================================================================
 * 4. ROUTING & SECTION NAVIGATION SINGLE PAGE APPLICATION (SPA) SYSTEM
 * ========================================================================= */
function navigate(viewId) {
  // Hide all screens
  document.querySelectorAll('.page-view').forEach(view => view.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
// 1. Pastikan fungsi navigate kamu strukturnya seperti ini
function navigate(pageId) {
    // Sembunyikan semua section dengan class 'page-view'
    document.querySelectorAll('.page-view').forEach(section => {
        section.classList.add('hidden');
    });

    // Tampilkan section yang sedang dipilih
    const targetSection = document.getElementById(`page-${pageId}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
}
  
  // Activate selected component
  const activeView = document.getElementById(`page-${viewId}`);
  if (activeView) activeView.classList.remove('hidden');
  
  // Format topbar title
  const titleMap = {
    dashboard: "Dashboard Ringkasan", materi: "Materi Belajar Indikator", simulator: "Simulator Indikator Terintegrasi",
    ma200: "Simulasi Khusus Tren MA200", entry: "Simulasi Kalkulator Kelayakan Entry", cheatsheet: "Quick Cheat Sheet",
    "studi-kasus": "Bedah Studi Kasus Riil", kuis: "Uji Pemahaman Kuis", hasil: "Analisis Hasil Belajar", pengaturan: "Pengaturan Sistem"
  };
  document.getElementById('view-title').textContent = titleMap[viewId] || "Simulator";

  // Sync active sidebar links
  document.querySelectorAll(`nav a[onclick="navigate('${viewId}')"]`).forEach(el => el.classList.add('active'));
  
  // Lifecycle triggers based on tab open
  if (viewId === 'dashboard') renderDashboard();
  if (viewId === 'materi') renderMaterials();
  if (viewId === 'cheatsheet') renderCheatSheet();
  if (viewId === 'studi-kasus') renderCaseStudies();
  if (viewId === 'kuis') initQuizModule();
  if (viewId === 'hasil') renderLearningOutcomes();
}

function toggleMobileMenu() {
  showToast("Gunakan navigasi bawah di handphone untuk akses cepat antar halaman.", "info");
}

/** =========================================================================
 * 5. CORE RENDERERS & DATA BINDING ENGINES
 * ========================================================================= */
function renderDashboard() {
  document.getElementById('dash-greeting-name').textContent = appState.username;
  document.getElementById('dash-stat-materi').textContent = `${appState.completedMaterials.length} / ${MaterialsData.length}`;
  document.getElementById('dash-stat-sim').textContent = `${appState.simulationsCount} Sesi`;
  document.getElementById('dash-stat-kuis').textContent = appState.lastQuizScore !== null ? `${appState.lastQuizScore}/100` : '-';
  
  // Evaluate understanding level
  let level = "Pemula";
  if (appState.completedMaterials.length >= 5 && appState.simulationsCount >= 3) level = "Intermediate";
  if (appState.completedMaterials.length === MaterialsData.length && appState.lastQuizScore >= 80) level = "Expert Trader";
  
  document.getElementById('dash-stat-level').textContent = level;
  document.getElementById('user-badge-level').textContent = level;
  document.getElementById('dash-stat-level').className = `text-sm font-extrabold uppercase tracking-wide ${level === 'Expert Trader' ? 'text-purple-400' : level === 'Intermediate' ? 'text-blue-400' : 'text-emerald-400'}`;

  // Update dynamic gauge based on state
  const gauge = document.getElementById('dash-risk-gauge');
  const scoreText = document.getElementById('dash-risk-score');
  const badge = document.getElementById('dash-risk-status-badge');
  const score = appState.integratedRiskScore;

  scoreText.textContent = score;
  let rotation = (score / 100) * 180;
  gauge.style.transform = `rotate(${rotation}deg)`;

  if (score === 0) {
    badge.textContent = "Belum Ada Analisis";
    badge.className = "mt-4 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-widest";
    gauge.style.borderTopColor = "#94A3B8";
  } else if (score >= 75) {
    badge.textContent = "Aman Relatif";
    badge.className = "mt-4 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest";
    gauge.style.borderTopColor = "#22C55E";
  } else if (score >= 50) {
    badge.textContent = "Waspada";
    badge.className = "mt-4 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 uppercase tracking-widest";
    gauge.style.borderTopColor = "#FACC15";
  } else {
    badge.textContent = "Tidak Aman";
    badge.className = "mt-4 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-widest";
    gauge.style.borderTopColor = "#EF4444";
  }

  // Render materials checklist bars
  const container = document.getElementById('dash-progress-container');
  container.innerHTML = '';
  MaterialsData.forEach(mat => {
    const isDone = appState.completedMaterials.includes(mat.id);
    const div = document.createElement('div');
    div.className = "flex items-center justify-between p-2.5 rounded-xl bg-slate-900/30 border border-slate-800/40 text-xs";
    div.innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fa-solid ${mat.icon} ${isDone ? 'text-blue-400' : 'text-slate-500'} w-4"></i>
        <span class="${isDone ? 'text-slate-200 font-semibold' : 'text-slate-400'}">${mat.title}</span>
      </div>
      <button onclick="toggleMaterialProgress('${mat.id}')" class="px-2.5 py-1 rounded-lg font-bold text-[10px] transition uppercase tracking-wider ${isDone ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}">
        ${isDone ? '<i class="fa-solid fa-check mr-1"></i> Selesai' : 'Tandai Selesai'}
      </button>
    `;
    container.appendChild(div);
  });
}

function renderMaterials() {
  const container = document.getElementById('materi-grid-container');
  container.innerHTML = '';
  MaterialsData.forEach(mat => {
    const isDone = appState.completedMaterials.includes(mat.id);
    const card = document.createElement('div');
    card.className = "card-glass p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition duration-300";
    card.innerHTML = `
      <div class="space-y-3">
        <div class="flex justify-between items-start">
          <div class="p-3 bg-slate-900 rounded-xl text-blue-400 text-lg border border-slate-800 shadow-inner"><i class="fa-solid ${mat.icon}"></i></div>
          <span class="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${isDone ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}">${isDone ? 'Sudah Dibaca' : 'Belum Dibaca'}</span>
        </div>
        <div>
          <h4 class="font-bold text-base text-white tracking-wide">${mat.title}</h4>
          <p class="text-xs text-slate-400 mt-1 leading-relaxed">${mat.desc}</p>
        </div>
        <div class="space-y-1.5 pt-2 text-[11px] border-t border-slate-800/60">
          <div class="text-emerald-400"><strong class="uppercase text-[9px] tracking-wider block text-slate-400">Sinyal Aman Relatif:</strong> ${mat.safe}</div>
          <div class="text-yellow-400 pt-1"><strong class="uppercase text-[9px] tracking-wider block text-slate-400">Sinyal Waspada:</strong> ${mat.alert}</div>
          <div class="text-red-400 pt-1"><strong class="uppercase text-[9px] tracking-wider block text-slate-400">Sinyal Tidak Aman / Risiko Tinggi:</strong> ${mat.risk}</div>
        </div>
      </div>
      <button onclick="toggleMaterialProgress('${mat.id}')" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition border border-slate-700">
        ${isDone ? '<i class="fa-solid fa-rotate-left mr-1"></i> Pelajari Ulang' : 'Selesai Pelajari'}
      </button>
    `;
    container.appendChild(card);
  });
}

function toggleMaterialProgress(id) {
  if (appState.completedMaterials.includes(id)) {
    appState.completedMaterials = appState.completedMaterials.filter(x => x !== id);
    showToast("Materi diubah menjadi belum selesai dibaca", "info");
  } else {
    appState.completedMaterials.push(id);
    showToast("Materi berhasil diselesaikan!", "success");
  }
  Storage.set('ts_completed_materials', appState.completedMaterials);
  renderDashboard();
  renderMaterials();
}

function renderCheatSheet() {
  const container = document.getElementById('cheatsheet-grid-container');
  container.innerHTML = '';
  MaterialsData.forEach(mat => {
    const card = document.createElement('div');
    card.className = "card-glass p-4 rounded-xl border border-slate-800 space-y-2 text-xs";
    card.innerHTML = `
      <h4 class="font-bold text-blue-400 text-sm flex items-center gap-2"><i class="fa-solid ${mat.icon}"></i> ${mat.title}</h4>
      <ul class="space-y-1.5 list-disc list-inside text-slate-300 border-t border-slate-800 pt-2">
        <li><span class="text-emerald-400 font-medium">Aman:</span> ${mat.safe}</li>
        <li><span class="text-red-400 font-medium">Bahaya:</span> ${mat.risk}</li>
      </ul>
    `;
    container.appendChild(card);
  });
}

function renderCaseStudies() {
  const container = document.getElementById('studi-kasus-grid-container');
  container.innerHTML = '';
  CaseStudies.forEach(cs => {
    const card = document.createElement('div');
    card.className = "card-glass p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3";
    card.innerHTML = `
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <h4 class="font-bold text-sm text-slate-200 tracking-wide">${cs.title}</h4>
          <span class="px-2 py-0.5 text-[9px] font-black rounded ${cs.badge}">${cs.status}</span>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed bg-slate-900/30 p-3 rounded-lg border border-slate-800/40">${cs.desc}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

/** =========================================================================
 * 6. INTEGRATED MAIN SIMULATOR SYSTEM (ALGORITHM ENGINE)
 * ========================================================================= */
function loadSimulatorSampleData() {
  document.getElementById('sim-price').value = 3420;
  document.getElementById('sim-ma200').value = 3086;
  document.getElementById('sim-ma50').value = 3150;
  document.getElementById('sim-ma100').value = 3100;
  document.getElementById('sim-volume').value = 160000;
  document.getElementById('sim-vol-avg').value = 100000;
  document.getElementById('sim-macd').value = 15;
  document.getElementById('sim-signal').value = 10;
  document.getElementById('sim-rsi').value = 58;
  document.getElementById('sim-stoch').value = 45;
  showToast("Data contoh berhasil dimasukkan ke form!", "success");
}

function analyzeMainSimulator(e) {
  e.preventDefault();
  
  const price = parseFloat(document.getElementById('sim-price').value);
  const ma200 = parseFloat(document.getElementById('sim-ma200').value);
  const ma50 = parseFloat(document.getElementById('sim-ma50').value);
  const ma100 = parseFloat(document.getElementById('sim-ma100').value);
  const volume = parseFloat(document.getElementById('sim-volume').value);
  const volAvg = parseFloat(document.getElementById('sim-vol-avg').value);
  const macd = parseFloat(document.getElementById('sim-macd').value);
  const signal = parseFloat(document.getElementById('sim-signal').value);
  const rsi = parseFloat(document.getElementById('sim-rsi').value);
  const stoch = parseFloat(document.getElementById('sim-stoch').value);
  
  const orderBook = document.getElementById('sim-orderbook').value;
  const candleState = document.getElementById('sim-candle').value;

  let score = 0;

  // Rule Scoring System Calculations
  if (price > ma200) score += 15; else score -= 20;
  if (price > ma50) score += 10;
  if (ma50 > ma100) score += 10;
  if (ma100 > ma200) score += 10;
  
  const volRatio = volume / (volAvg || 1);
  if (volRatio > 1.5) score += 10; else if (volRatio < 1.0) score -= 15;
  
  if (macd > signal) score += 10; else score -= 10;
  
  if (rsi >= 50 && rsi <= 65) score += 10;
  else if (rsi < 50) score -= 10;
  else if (rsi > 75) score -= 8;
  
  if (stoch >= 20 && stoch <= 80) score += 5;
  else if (stoch > 80) score -= 8;
  
  if (orderBook === 'tebal-bid') score += 5;
  else if (orderBook === 'tebal-offer') score -= 10;
  else if (orderBook === 'spread-lebar') score -= 10;
  
  if (candleState === 'mantul') score += 10;
  else if (candleState === 'jebol') score -= 20;

  // Constrain boundary score values
  score = Math.max(0, Math.min(100, score));

  // Save risk results to system profile state
  appState.simulationsCount++;
  appState.integratedRiskScore = score;
  Storage.set('ts_simulations_count', appState.simulationsCount);
  Storage.set('ts_integrated_risk', score);

  // Render evaluation panel layout elements
  const badge = document.getElementById('sim-res-badge');
  const scoreText = document.getElementById('sim-res-score');
  const desc = document.getElementById('sim-res-desc');
  const metricsBox = document.getElementById('sim-res-metrics-box');

  scoreText.textContent = score;
  metricsBox.classList.remove('hidden');
  document.getElementById('sim-res-vol-ratio').textContent = volRatio.toFixed(1) + 'x';
  
  const distPercent = ((price - ma200) / ma200) * 100;
  document.getElementById('sim-res-ma-dist').textContent = (distPercent >= 0 ? '+' : '') + distPercent.toFixed(2) + '%';

  if (score >= 75) {
    badge.textContent = "AMAN RELATIF";
    badge.className = "inline-block px-4 py-1.5 rounded-full font-black tracking-widest text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    desc.textContent = "Kombinasi indikator berada dalam kondisi prima (Bullish trend teratur, momentum sehat, volume mendukung). Risiko masuk pasar tergolong rendah, namun pastikan batasan stop loss tetap terpasang dengan disiplin.";
  } else if (score >= 50) {
    badge.textContent = "WASPADA";
    badge.className = "inline-block px-4 py-1.5 rounded-full font-black tracking-widest text-sm bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    desc.textContent = "Kondisi pasar berbaur atau indikator mulai memanas (skor RSI tinggi atau harga terlalu jauh di atas MA200). Dianjurkan menunggu konfirmasi candle pantulan lanjutan dan membatasi ukuran modal masuk.";
  } else {
    badge.textContent = "TIDAK AMAN";
    badge.className = "inline-block px-4 py-1.5 rounded-full font-black tracking-widest text-sm bg-red-500/20 text-red-400 border border-red-500/30";
    desc.textContent = "Risiko tinggi terdeteksi untuk strategi mengikuti tren! Harga berada di wilayah rawan / breakdown support / di bawah MA200 disertai volume distribusi masif. Sebaiknya hindari memaksakan entry belanja saham.";
  }

  showToast("Analisis risiko portofolio berhasil dieksekusi!", "success");
}

function resetMainSimulator() {
  document.getElementById('main-simulator-form').reset();
  document.getElementById('sim-res-badge').textContent = "BELUM ADA DATA";
  document.getElementById('sim-res-badge').className = "inline-block px-4 py-1.5 rounded-full font-black tracking-widest text-sm bg-slate-800 text-slate-500";
  document.getElementById('sim-res-score').textContent = "0";
  document.getElementById('sim-res-desc').textContent = "Silakan lengkapi form data pasar di sebelah kiri lalu jalankan analisis risiko untuk mendapatkan feedback simulasi belajar.";
  document.getElementById('sim-res-metrics-box').classList.add('hidden');
}

/** =========================================================================
 * 7. MA200 TACTICAL SIMULATOR ENGINE
 * ========================================================================= */
function loadMA200Preset(price, ma200, volRatio, trend) {
  document.getElementById('ma200-price').value = price;
  document.getElementById('ma200-value').value = ma200;
  document.getElementById('ma200-vol-ratio').value = volRatio;
  document.getElementById('ma200-trend').value = trend;
  calculateMA200Simulator();
}

function calculateMA200Simulator() {
  const price = parseFloat(document.getElementById('ma200-price').value);
  const ma200 = parseFloat(document.getElementById('ma200-value').value);
  const volRatio = parseFloat(document.getElementById('ma200-vol-ratio').value) || 1.0;
  const trend = document.getElementById('ma200-trend').value;

  if (isNaN(price) || isNaN(ma200)) {
    showToast("Mohon masukkan angka harga dan nilai MA200 dengan benar.", "error");
    return;
  }

  const distance = ((price - ma200) / ma200) * 100;
  document.getElementById('ma200-res-distance').textContent = (distance >= 0 ? '+' : '') + distance.toFixed(2) + '%';
  
  const badge = document.getElementById('ma200-res-badge');
  const explanation = document.getElementById('ma200-res-explanation');
  
  if (distance >= 0) {
    document.getElementById('ma200-res-pos-text').textContent = `Harga berada di atas garis trend jangka panjang MA200 (Premium area).`;
    
    if (distance >= 2 && distance <= 8 && trend === 'naik' && volRatio >= 1.2) {
      badge.textContent = "AMAN RELATIF";
      badge.className = "px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      explanation.textContent = "Struktur ideal terpenuhi. Harga memantul sehat di batas wajar akumulasi awal di atas MA200 dengan volume transaksi yang kuat. Cocok untuk taktik Trend Following Buy on Weakness.";
    } else if (distance > 12) {
      badge.textContent = "WASPADA";
      badge.className = "px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      explanation.textContent = "Harga sudah naik terlalu tinggi meninggalkan batas rata-rata MA200 (Overextended). Kondisi ini rawan memicu koreksi mendadak (Pullback) menuju area Mean Reversion akibat aksi ambil untung.";
    } else {
      badge.textContent = "WASPADA";
      badge.className = "px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      explanation.textContent = "Harga sangat dekat dengan area kritis MA200 (0% - 2%). Belum terlihat struktur pantulan menjauh yang didukung volume besar. Tunggu konfirmasi penutupan bar candle berikutnya.";
    }
  } else {
    document.getElementById('ma200-res-pos-text').textContent = `Harga berada di bawah garis trend jangka panjang MA200 (Discount area).`;
    badge.textContent = "TIDAK AMAN";
    badge.className = "px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30";
    explanation.textContent = "Secara mekanikal, saham berada pada fase bearish jangka panjang (Downtrend). Tekanan jual dominan, risiko berlanjut turun sangat besar, tidak direkomendasikan untuk dibeli.";
  }
}

/** =========================================================================
 * 8. ENTRY RISK/REWARD SUITABILITY SIMULATOR
 * ========================================================================= */
function calculateEntrySimulator(e) {
  e.preventDefault();
  
  const entry = parseFloat(document.getElementById('entry-price').value);
  const target = parseFloat(document.getElementById('entry-target').value);
  const sl = parseFloat(document.getElementById('entry-sl').value);

  const nearSupport = document.getElementById('entry-chk-support').checked;
  const aboveMA200 = document.getElementById('entry-chk-ma200').checked;
  const rsiNormal = document.getElementById('entry-chk-rsi').checked;

  if (sl >= entry || target <= entry) {
    showToast("Konfigurasi tidak logis! Stop Loss harus di bawah harga entry, dan Target harus di atas entry.", "error");
    return;
  }

  const risk = entry - sl;
  const reward = target - entry;
  const rrRatio = reward / risk;

  document.getElementById('entry-res-risk').textContent = `Rp${formatNumberID(risk)}`;
  document.getElementById('entry-res-reward').textContent = `Rp${formatNumberID(reward)}`;
  document.getElementById('entry-res-rr').textContent = `1 : ${rrRatio.toFixed(1)}`;

  const badge = document.getElementById('entry-res-badge');
  const explanation = document.getElementById('entry-res-explanation');

  if (rrRatio >= 2.0 && nearSupport && aboveMA200 && rsiNormal) {
    badge.textContent = "AMAN RELATIF";
    badge.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    explanation.textContent = "Rencana trading sangat matang! Rasio keuntungan berbanding risiko sangat menarik (> 1:2) didukung penuh letak teknikal dekat lantai support serta momentum tren yang aman.";
  } else if (rrRatio >= 1.0 && rrRatio < 2.0) {
    badge.textContent = "WASPADA";
    badge.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    explanation.textContent = "Rencana berada pada level moderat. Rasio keuntungan berbanding risiko kurang ideal (antara 1:1 hingga 1:2), atau beberapa parameter ceklist kondisi pasar pendukung belum terpenuhi sempurna.";
  } else if (rrRatio < 1.0) {
    badge.textContent = "TIDAK AMAN";
    badge.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30";
    explanation.textContent = "Rencana trading buruk (High Risk)! Potensi kerugian (Risk) jauh lebih besar daripada ekspektasi keuntungan yang dikejar. Sangat dilarang melakukan aksi beli dengan setup seperti ini.";
  } else {
    badge.textContent = "WASPADA";
    badge.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    explanation.textContent = "Rasio R:R bagus, namun beberapa checklist indikator penting tidak terpenuhi. Periksa kembali apakah harga saat ini sudah terlalu panas atau terlalu dekat dengan resistensi plafon.";
  }
}

/** =========================================================================
 * 9. QUIZ MODULE SYSTEM
 * ========================================================================= */
let currentQuizIndex = 0;
let tempScore = 0;

function initQuizModule() {
  currentQuizIndex = 0;
  tempScore = 0;
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const box = document.getElementById('quiz-card-box');
  if (currentQuizIndex >= QuizQuestions.length) {
    // Process final score submission details
    let finalPercentScore = (tempScore / QuizQuestions.length) * 100;
    appState.quizAttempts++;
    appState.totalQuizScores += finalPercentScore;
    appState.lastQuizScore = finalPercentScore;
    
    Storage.set('ts_quiz_attempts', appState.quizAttempts);
    Storage.set('ts_total_quiz_scores', appState.totalQuizScores);
    Storage.set('ts_last_quiz_score', finalPercentScore);

    box.innerHTML = `
      <div class="text-center space-y-4 py-6">
        <div class="p-4 bg-blue-500/10 text-blue-400 rounded-full inline-block text-3xl"><i class="fa-solid fa-square-poll-vertical"></i></div>
        <h3 class="text-lg font-bold text-white tracking-wide">Kuis Selesai Dievaluasi!</h3>
        <p class="text-sm text-slate-400">Skor pencapaian pemahaman materi Anda saat ini adalah:</p>
        <p class="text-5xl font-black text-emerald-400 font-mono">${finalPercentScore.toFixed(0)}</p>
        <button onclick="initQuizModule()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition mt-4 uppercase">Ulangi Kuis Sesi Baru</button>
      </div>
    `;
    return;
  }

  const qData = QuizQuestions[currentQuizIndex];
  box.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-widest">
        <span>Pertanyaan Kuis Teknikal</span>
        <span>${currentQuizIndex + 1} dari ${QuizQuestions.length}</span>
      </div>
      <h4 class="text-sm font-semibold text-white leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">${qData.q}</h4>
      <div class="space-y-2 pt-2" id="quiz-options-box">
        ${qData.a.map((opt, i) => `
          <button onclick="evaluateQuizAnswer(${i})" class="w-full text-left p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 font-medium transition duration-150 focus:outline-none flex gap-3 items-center">
            <span class="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700 text-[10px] text-slate-400 font-bold">${String.fromCharCode(65+i)}</span>
            <span>${opt}</span>
          </button>
        `).join('')}
      </div>
      <div id="quiz-feedback-box" class="hidden p-4 rounded-xl text-xs space-y-2"></div>
    </div>
  `;
}

function evaluateQuizAnswer(selectedIndex) {
  const qData = QuizQuestions[currentQuizIndex];
  const buttons = document.getElementById('quiz-options-box').getElementsByTagName('button');
  
  // Disable option click changes
  for (let b of buttons) b.disabled = true;

  const feedback = document.getElementById('quiz-feedback-box');
  feedback.classList.remove('hidden');

  if (selectedIndex === qData.c) {
    tempScore++;
    feedback.className = "p-4 rounded-xl text-xs space-y-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
    feedback.innerHTML = `<strong><i class="fa-solid fa-circle-check mr-1"></i> Benar Sekali!</strong> <p class="text-slate-300 mt-0.5">${qData.e}</p>`;
  } else {
    feedback.className = "p-4 rounded-xl text-xs space-y-1.5 bg-red-500/10 border border-red-500/20 text-red-400";
    feedback.innerHTML = `<strong><i class="fa-solid fa-circle-xmark mr-1"></i> Jawaban Kurang Tepat.</strong> <p class="text-slate-300 mt-0.5">${qData.e}</p>`;
    // Highlight the wrong button clicked
    buttons[selectedIndex].classList.add('border-red-500', 'bg-red-500/5');
  }
  
  // Highlighting correct selection path anyway
  buttons[qData.c].classList.add('border-emerald-500', 'bg-emerald-500/5');

  // Inject continue layout action trigger
  const nextBtn = document.createElement('button');
  nextBtn.className = "w-full py-2.5 bg-slate-200 hover:bg-white text-slate-900 font-bold text-xs rounded-xl transition uppercase tracking-wider font-semibold mt-3";
  nextBtn.textContent = currentQuizIndex === QuizQuestions.length - 1 ? "Lihat Hasil Akhir" : "Lanjutkan Pertanyaan";
  nextBtn.onclick = () => {
    currentQuizIndex++;
    renderQuizQuestion();
  };
  feedback.appendChild(nextBtn);
}

/** =========================================================================
 * 10. SYSTEM OUTCOMES & METRICS REPORT RENDERING
 * ========================================================================= */
function renderLearningOutcomes() {
  const avg = appState.quizAttempts > 0 ? (appState.totalQuizScores / appState.quizAttempts) : 0;
  document.getElementById('hasil-avg-score').textContent = avg.toFixed(0);
  document.getElementById('hasil-total-kuis').textContent = `${appState.quizAttempts} Sesi`;
  document.getElementById('hasil-total-sim').textContent = `${appState.simulationsCount} Kali`;

  const recBox = document.getElementById('hasil-rekomendasi');
  if (appState.completedMaterials.length < 4) {
    recBox.textContent = "Fokus membaca landasan dasar terlebih dahulu! Anda baru menyelesaikan sedikit bab materi. Sistem menyarankan Anda memperdalam bab Candlestick, Support Resistance, serta Moving Average sebelum menguji coba market.";
  } else if (avg < 70 && appState.quizAttempts > 0) {
    recBox.textContent = "Progress membaca sudah baik, namun pemahaman analisis praktis kuis Anda masih di bawah target. Bacalah kembali bagian Cheat Sheet ringkas lalu coba simulasikan data secara mandiri menggunakan modul simulator utama.";
  } else {
    recBox.textContent = "Luar biasa! Tingkat akurasi jawaban dan porsi eksplorasi edukasi Anda sudah sangat seimbang. Pertahankan kedisiplinan membaca peta volume pasar serta validasi kecukupan rasio kelayakan target rencana entry Anda.";
  }
}

/** =========================================================================
 * 11. CONFIGURATION SYSTEM MANAGEMENT
 * ========================================================================= */
function saveUserProfileName() {
  const nameInput = document.getElementById('cfg-username').value.trim();
  if (!nameInput) {
    showToast("Nama tidak boleh kosong!", "error");
    return;
  }
  appState.username = nameInput;
  Storage.set('ts_username', nameInput);
  document.getElementById('user-display-name').textContent = nameInput;
  showToast("Nama profil berhasil diperbarui!", "success");
}

function clearSystemData() {
  if (confirm("Apakah Anda yakin ingin menghapus seluruh riwayat aktivitas pembelajaran? Semua progress akan direset.")) {
    Storage.remove('ts_username');
    Storage.remove('ts_completed_materials');
    Storage.remove('ts_simulations_count');
    Storage.remove('ts_last_quiz_score');
    Storage.remove('ts_quiz_attempts');
    Storage.remove('ts_total_quiz_scores');
    Storage.remove('ts_integrated_risk');
    
    appState = { username: 'Trader Pemula', completedMaterials: [], simulationsCount: 0, lastQuizScore: null, quizAttempts: 0, totalQuizScores: 0, integratedRiskScore: 0 };
    document.getElementById('cfg-username').value = '';
    showToast("Seluruh database lokal berhasil dibersihkan.", "info");
    navigate('dashboard');
  }
}

/** =========================================================================
 * 12. FLOATING ALERTS NOTIFICATION (TOAST COMPONENT)
 * ========================================================================= */
function showToast(message, type = "success") {
  const toast = document.getElementById('toast-notif');
  const iconBox = document.getElementById('toast-icon-box');
  const text = document.getElementById('toast-text');

  text.textContent = message;
  if (type === "success") {
    iconBox.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-400"></i>';
  } else if (type === "error") {
    iconBox.innerHTML = '<i class="fa-solid fa-circle-xmark text-red-400"></i>';
  } else {
    iconBox.innerHTML = '<i class="fa-solid fa-circle-info text-blue-400"></i>';
  }

  toast.classList.add('toast-slide-up');
  setTimeout(() => { toast.classList.remove('toast-slide-up'); }, 3000);
}

// Global initialization on core elements load completed
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('user-display-name').textContent = appState.username;
  document.getElementById('cfg-username').value = appState.username === 'Trader Pemula' ? '' : appState.username;
  navigate('dashboard');
});

// 2. BIANG FIX-NYA: Tambahkan baris ini di paling bawah file JS kamu!
window.navigate = navigate;              
