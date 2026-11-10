let allWords = [], filteredWords = [];
let currentPage = 1;
const itemsPerPage = 15;

let currentUser = "同學", userAvatar = "🐱", coins = 0, equippedTitle = "新手學童", equippedFrame = "default";
let unlockedItems = [];
let wrongNotebook = [];
let powerUps = { p_5050: 0, p_freeze: 0, p_heal: 0 };
let streakDays = 1, lastCheckInDate = "";
let userStats = { totalPlayed: 0, correctAnswers: 0, highScore: 0 };

const npcRankings = [
  { name: "Emma", title: "🏆 酷英神射手", score: 2800, avatar: "👑" },
  { name: "Lucas", title: "👑 英文大魔王", score: 2450, avatar: "🤖" },
  { name: "Sophia", title: "🔥 單字狂人", score: 1900, avatar: "🦊" },
  { name: "Ethan", title: "⚡ 閃電學霸", score: 1500, avatar: "🐶" },
  { name: "Olivia", title: "新手學童", score: 1200, avatar: "🐱" }
];

const achievements = [
  { id: 'b1', icon: '🐣', title: '初出茅廬', desc: '完成第一局遊戲挑戰' },
  { id: 'b2', icon: '🎯', title: '神準神射手', desc: '累積答對超過 20 題' },
  { id: 'b3', icon: '🔥', title: '熱血衝榜者', desc: '單局獲得超過 1,000 分' },
  { id: 'b4', icon: '💰', title: '金幣大亨', desc: '累積獲得超過 500 金幣' }
];

const shopItems = [
  { id: 't1', type: 'title', name: '⚡ 閃電學霸', price: 100, desc: '反應速度超群！' },
  { id: 't2', type: 'title', name: '🔥 單字狂人', price: 250, desc: '刷題停不下來！' },
  { id: 't3', type: 'title', name: '👑 英文大魔王', price: 500, desc: '制霸排行榜頂級強者！' },
  { id: 't4', type: 'title', name: '🏆 酷英神射手', price: 1000, desc: '百發百中神射手！' },

  { id: 'f1', type: 'frame', name: '🔵 科技藍光', price: 150, desc: '俐落電競科技藍光。' },
  { id: 'f2', type: 'frame', name: '🟣 霓虹極光', price: 300, desc: '神秘紫粉漸層極光外框。' },
  { id: 'f3', type: 'frame', name: '👑 傳奇帝王金', price: 800, desc: '耀眼的金幣富豪金光！' }
];

window.onload = function() {
  currentUser = localStorage.getItem('wm_nickname') || "同學";
  userAvatar = localStorage.getItem('wm_avatar') || "🐱";
  coins = parseInt(localStorage.getItem('wm_coins')) || 0;
  equippedTitle = localStorage.getItem('wm_title') || "新手學童";
  equippedFrame = localStorage.getItem('wm_frame') || "default";
  unlockedItems = JSON.parse(localStorage.getItem('wm_unlocked')) || [];
  wrongNotebook = JSON.parse(localStorage.getItem('wm_notebook')) || [];
  powerUps = JSON.parse(localStorage.getItem('wm_powerups')) || { p_5050: 0, p_freeze: 0, p_heal: 0 };
  streakDays = parseInt(localStorage.getItem('wm_streak')) || 1;
  lastCheckInDate = localStorage.getItem('wm_last_checkin') || "";
  userStats = JSON.parse(localStorage.getItem('wm_stats')) || { totalPlayed: 0, correctAnswers: 0, highScore: 0 };

  updateUserUI();
  applyFrameStyle(equippedFrame);
  renderShopUI();
  renderProfileUI();
  renderNotebookUI();
};

function toggleMobileMenu() {
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }
}

function closeMobileMenu() {
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar && overlay) {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  }
}

function selectEmojiAvatar(emoji) { userAvatar = emoji; }

function updateUserUI() {
  document.getElementById('userGreeting').innerText = currentUser;
  document.getElementById('userCoins').innerText = coins;
  document.getElementById('equippedTitle').innerText = equippedTitle;
  renderAvatarElement(document.getElementById('headerAvatar'), userAvatar);
  updatePowerUpUI();
}

function showSuccessModal(icon, title, desc) {
  document.getElementById('successModalIcon').innerText = icon;
  document.getElementById('successModalTitle').innerText = title;
  document.getElementById('successModalDesc').innerText = desc;
  document.getElementById('successModal').style.display = 'flex';
  confetti({ particleCount: 60, spread: 50 });
}

function renderAvatarElement(elem, avatarData) {
  if (avatarData.startsWith('data:image')) {
    elem.innerHTML = `<img src="${avatarData}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
  } else {
    elem.innerText = avatarData;
  }
}

function updatePowerUpUI() {
  document.getElementById('itemCount5050').innerText = powerUps.p_5050;
  document.getElementById('itemCountFreeze').innerText = powerUps.p_freeze;
  document.getElementById('itemCountHeal').innerText = powerUps.p_heal;
  if (document.getElementById('quiz5050Count')) document.getElementById('quiz5050Count').innerText = powerUps.p_5050;
  if (document.getElementById('quizHealCount')) document.getElementById('quizHealCount').innerText = powerUps.p_heal;
  if (document.getElementById('fallFreezeCount')) document.getElementById('fallFreezeCount').innerText = powerUps.p_freeze;
}

function getWordPoolBySource(sourceType) {
  if (sourceType === 'notebook') {
    if (wrongNotebook.length === 0) {
      showSuccessModal('⚠️', '錯題本目前是空的', '將自動使用【全部單字庫】為你出題！');
      return [...allWords];
    }
    return allWords.filter(w => wrongNotebook.some(n => n.word === w.word));
  }
  return [...allWords];
}

/* 📚 單字庫分頁繪製機制 (一次只顯示 15 個) */
function renderWordPage() {
  const tbody = document.getElementById('wordTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filteredWords.slice(start, end);

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-sub); padding:20px;">找不到符合的單字</td></tr>`;
    document.getElementById('loadingStatus').innerHTML = '';
    return;
  }

  pageItems.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${start + index + 1}</td>
      <td><strong style="color:white;">${item.word}</strong></td>
      <td><span class="phonetic-tag">${item.phonetic || ''}</span></td>
      <td><span class="pos-tag">${item.pos}</span></td>
      <td>${item.meaning}</td>
      <td><span class="grammar-badge">${item.grammar || '基礎單字用法'}</span></td>
      <td>
        <button class="btn btn-audio" onclick="speakWord('${item.word}')">🔊</button>
        <button class="btn btn-ai" onclick="showAIExample('${item.word}')">🤖</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const totalPages = Math.ceil(filteredWords.length / itemsPerPage);
  const statusElem = document.getElementById('loadingStatus');
  if (statusElem) {
    statusElem.innerHTML = `
      <div class="pagination-container">
        <button class="btn btn-ai" ${currentPage === 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="changePage(-1)">◀ 上頁</button>
        <span>第 ${currentPage} / ${totalPages || 1} 頁 (共 ${filteredWords.length} 個)</span>
        <button class="btn btn-ai" ${currentPage >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="changePage(1)">下頁 ▶</button>
      </div>
    `;
  }
}

function changePage(delta) {
  currentPage += delta;
  renderWordPage();
  document.getElementById('tab-words').scrollIntoView({ behavior: 'smooth' });
}

function filterCategory(cat, event) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');

  if (cat === 'all') {
    filteredWords = [...allWords];
  } else {
    filteredWords = allWords.filter(w => w.pos.includes(cat));
  }
  currentPage = 1;
  renderWordPage();
}

function handleSearch() {
  const kw = document.getElementById('searchInput').value.toLowerCase();
  filteredWords = allWords.filter(i => i.word.toLowerCase().includes(kw) || i.meaning.includes(kw));
  currentPage = 1;
  renderWordPage();
}

function renderLeaderboardUI() {
  const tbody = document.getElementById('leaderboardTableBody');
  if (!tbody) return;

  const playerEntry = {
    name: `${currentUser} (你)`,
    title: equippedTitle,
    score: userStats.highScore || 0,
    avatar: userAvatar,
    isSelf: true
  };

  let list = [...npcRankings, playerEntry];
  list.sort((a, b) => b.score - a.score);

  tbody.innerHTML = '';
  list.forEach((item, idx) => {
    const rank = idx + 1;
    let rankClass = '';
    let badgeHTML = '<span class="rank-badge">挑戰者</span>';

    if (rank === 1) {
      rankClass = 'rank-1';
      badgeHTML = '<span class="rank-badge rank-badge-gold">🥇 冠軍</span>';
    } else if (rank === 2) {
      rankClass = 'rank-2';
      badgeHTML = '<span class="rank-badge rank-badge-silver">🥈 亞軍</span>';
    } else if (rank === 3) {
      rankClass = 'rank-3';
      badgeHTML = '<span class="rank-badge rank-badge-bronze">🥉 季軍</span>';
    }

    const isSelfStyle = item.isSelf ? 'style="background: rgba(56, 189, 248, 0.15); font-weight:bold;"' : '';

    tbody.innerHTML += `
      <tr ${isSelfStyle}>
        <td class="${rankClass}">#${rank}</td>
        <td style="color:white; display:flex; align-items:center; gap:6px;">
          <span>${item.avatar}</span>
          <span>${item.name}</span>
        </td>
        <td><span class="user-title-tag">${item.title}</span></td>
        <td style="color:#fbbf24; font-weight:900;">${item.score} 分</td>
        <td>${badgeHTML}</td>
      </tr>
    `;
  });
}

function renderShopUI() {
  const titleGrid = document.getElementById('shopTitleGrid');
  const frameGrid = document.getElementById('shopFrameGrid');
  if (!titleGrid || !frameGrid) return;
  titleGrid.innerHTML = ''; frameGrid.innerHTML = '';

  shopItems.forEach(item => {
    const isUnlocked = unlockedItems.includes(item.id);
    const isEquipped = (item.type === 'title' && equippedTitle === item.name) || (item.type === 'frame' && equippedFrame === item.id);

    let btnHTML = '';
    if (isEquipped) {
      btnHTML = `<button class="btn btn-unequip" style="width:100%; justify-content:center;" onclick="unequipItem('${item.type}')">卸下</button>`;
    } else if (isUnlocked) {
      btnHTML = `<button class="btn btn-ai" style="width:100%; justify-content:center;" onclick="equipItem('${item.id}', '${item.type}', '${item.name}')">裝備</button>`;
    } else {
      btnHTML = `<button class="btn btn-game" style="width:100%; justify-content:center;" onclick="buyShopItem('${item.id}', '${item.type}', '${item.name}', ${item.price})">購買</button>`;
    }

    const cardHTML = `
      <div class="shop-item-card">
        <div class="shop-item-title">${item.name}</div>
        <div class="shop-item-desc">${item.desc}</div>
        <div class="shop-item-price">🪙 ${item.price} 金幣</div>
        ${btnHTML}
      </div>
    `;

    if (item.type === 'title') titleGrid.innerHTML += cardHTML;
    else frameGrid.innerHTML += cardHTML;
  });
}

function buyShopItem(id, type, name, price) {
  if (coins < price) {
    showSuccessModal('❌', '金幣不足', '快去挑戰遊戲賺取金幣吧！');
    return;
  }
  coins -= price; unlockedItems.push(id);
  if (type === 'title') { equippedTitle = name; localStorage.setItem('wm_title', equippedTitle); }
  else { equippedFrame = id; localStorage.setItem('wm_frame', equippedFrame); applyFrameStyle(equippedFrame); }
  localStorage.setItem('wm_coins', coins); localStorage.setItem('wm_unlocked', JSON.stringify(unlockedItems));
  updateUserUI(); renderShopUI(); renderProfileUI(); 
  showSuccessModal('🎁', '購買成功！', `已解鎖並裝備：${name}`);
}

function equipItem(id, type, name) {
  if (type === 'title') { equippedTitle = name; localStorage.setItem('wm_title', equippedTitle); }
  else { equippedFrame = id; localStorage.setItem('wm_frame', equippedFrame); applyFrameStyle(equippedFrame); }
  updateUserUI(); renderShopUI(); renderProfileUI();
  showSuccessModal('✨', '裝備成功', `已佩戴：${name}`);
}

function unequipItem(type) {
  if (type === 'title') { equippedTitle = "新手學童"; localStorage.setItem('wm_title', equippedTitle); }
  else { equippedFrame = "default"; localStorage.setItem('wm_frame', equippedFrame); applyFrameStyle(equippedFrame); }
  updateUserUI(); renderShopUI(); renderProfileUI();
  showSuccessModal('🔄', '已卸下裝備', '恢復預設外觀！');
}

function applyFrameStyle(frameId) {
  const root = document.documentElement;
  if (frameId === 'f1') {
    root.style.setProperty('--card-border-color', 'rgba(56, 189, 248, 0.6)');
  } else if (frameId === 'f2') {
    root.style.setProperty('--card-border-color', 'rgba(168, 85, 247, 0.6)');
  } else if (frameId === 'f3') {
    root.style.setProperty('--card-border-color', 'rgba(245, 158, 11, 0.7)');
  } else {
    root.style.setProperty('--card-border-color', 'rgba(255, 255, 255, 0.08)');
  }
}

function buyPowerUp(type, price) {
  if (coins < price) {
    showSuccessModal('❌', '金幣不足', '快去挑戰遊戲賺取金幣吧！');
    return;
  }
  coins -= price; powerUps[type] = (powerUps[type] || 0) + 1;
  localStorage.setItem('wm_coins', coins); localStorage.setItem('wm_powerups', JSON.stringify(powerUps));
  updateUserUI(); 
  showSuccessModal('🧪', '購買成功！', '道具已加入背包！');
}

function doDailyCheckIn() {
  const today = new Date().toDateString();
  if (lastCheckInDate === today) {
    showSuccessModal('📅', '今日已簽到', '明天再來領取 50 金幣！');
    return;
  }
  coins += 50; streakDays++; lastCheckInDate = today;
  localStorage.setItem('wm_coins', coins); localStorage.setItem('wm_streak', streakDays); localStorage.setItem('wm_last_checkin', lastCheckInDate);
  updateUserUI(); document.getElementById('statStreak').innerText = `${streakDays} 天`;
  showSuccessModal('🎉', '簽到成功！', `獲得 50 金幣！已連續簽到 ${streakDays} 天！`);
}

function renderProfileUI() {
  document.getElementById('profileName').innerText = currentUser || "同學";
  document.getElementById('profileTitleTag').innerText = `稱號：${equippedTitle}`;
  renderAvatarElement(document.getElementById('profileAvatar'), userAvatar);
  document.getElementById('statStreak').innerText = `${streakDays} 天`;
  document.getElementById('statTotalPlayed').innerText = userStats.totalPlayed;
  document.getElementById('statHighScore').innerText = userStats.highScore;

  const badgeGrid = document.getElementById('badgeGrid'); if (!badgeGrid) return;
  badgeGrid.innerHTML = '';
  achievements.forEach(b => {
    let isUnlocked = false;
    if (b.id === 'b1' && userStats.totalPlayed >= 1) isUnlocked = true;
    if (b.id === 'b2' && userStats.correctAnswers >= 20) isUnlocked = true;
    if (b.id === 'b3' && userStats.highScore >= 1000) isUnlocked = true;
    if (b.id === 'b4' && coins >= 500) isUnlocked = true;

    badgeGrid.innerHTML += `
      <div class="badge-item ${isUnlocked ? 'unlocked' : ''}">
        <div class="badge-icon">${b.icon}</div>
        <div class="badge-title">${b.title}</div>
        <div class="badge-desc">${b.desc}</div>
      </div>
    `;
  });
}

function saveWrongWord(wordObj) {
  const exist = wrongNotebook.find(w => w.word === wordObj.word);
  if (exist) { exist.count++; } else { wrongNotebook.push({ word: wordObj.word, meaning: wordObj.meaning, count: 1 }); }
  localStorage.setItem('wm_notebook', JSON.stringify(wrongNotebook)); renderNotebookUI();
}

function renderNotebookUI() {
  const tbody = document.getElementById('notebookTableBody'); if (!tbody) return;
  tbody.innerHTML = wrongNotebook.length === 0 ? `<tr><td colspan="4" style="color:var(--text-sub);">錯題本目前空空如也！</td></tr>` : '';
  wrongNotebook.forEach(item => {
    tbody.innerHTML += `<tr><td style="color:white; font-weight:bold;">${item.word}</td><td>${item.meaning}</td><td style="color:#ef4444; font-weight:bold;">${item.count} 次</td><td><button class="btn btn-audio" onclick="speakWord('${item.word}')">🔊 發音</button></td></tr>`;
  });
}

fetch('words.json').then(r => r.json()).then(data => { allWords = data; filteredWords = data; renderWordPage(); });

function speakWord(word) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(word); u.lang = 'en-US';
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  }
}

function showAIExample(wordName) {
  const item = allWords.find(w => w.word === wordName);
  if (item && item.examples) {
    document.getElementById('modalWordTitle').innerText = `🤖 「${item.word}」AI 解析`;
    document.getElementById('modalExampleEn').innerText = item.examples[0].en;
    document.getElementById('modalExampleZh').innerText = item.examples[0].zh;
    document.getElementById('exampleModal').style.display = 'flex';
  }
}

/* ⚡ 4選1與生存遊戲 */
let qIndex = 0, qScore = 0, qList = [], isSurvival = false, hp = 3;

function startQuizGame() {
  isSurvival = false; 
  document.getElementById('hpBar').style.display = 'none'; 
  document.getElementById('healBtn').style.display = 'none'; 
  
  const count = parseInt(document.getElementById('quizCountSelect').value) || 10;
  const source = document.getElementById('quizSourceSelect').value;
  const pool = getWordPoolBySource(source);

  qList = [...pool].sort(() => 0.5 - Math.random()).slice(0, count); 
  qIndex = 0; qScore = 0; 
  document.getElementById('quizPlayingScreen').style.display = 'block'; 
  document.getElementById('quizResultScreen').style.display = 'none'; 
  document.getElementById('quizModal').style.display = 'flex'; 
  nextQuiz(); 
}

function startSurvivalGame() {
  isSurvival = true; hp = 3; 
  document.getElementById('hpBar').style.display = 'block'; 
  document.getElementById('healBtn').style.display = 'inline-flex'; 
  updateHPUI(); 

  const source = document.getElementById('survivalSourceSelect').value;
  const pool = getWordPoolBySource(source);

  qList = [...pool].sort(() => 0.5 - Math.random()); 
  qIndex = 0; qScore = 0; 
  document.getElementById('quizPlayingScreen').style.display = 'block'; 
  document.getElementById('quizResultScreen').style.display = 'none'; 
  document.getElementById('quizModal').style.display = 'flex'; 
  nextQuiz(); 
}

function updateHPUI() { document.getElementById('hpBar').innerText = "❤️".repeat(hp) + "🖤".repeat(3 - hp); }

function nextQuiz() {
  if ((!isSurvival && qIndex >= qList.length) || (isSurvival && hp <= 0)) { 
    document.getElementById('quizPlayingScreen').style.display = 'none'; 
    document.getElementById('quizResultScreen').style.display = 'block'; 
    document.getElementById('finalScore').innerText = qScore; 
    
    userStats.totalPlayed += qIndex;
    if (qScore > userStats.highScore) userStats.highScore = qScore;
    coins += Math.floor(qScore / 10);
    localStorage.setItem('wm_stats', JSON.stringify(userStats));
    localStorage.setItem('wm_coins', coins);
    updateUserUI();

    confetti({ particleCount: 80 }); return; 
  }
  const q = qList[qIndex]; 
  document.getElementById('qWord').innerText = q.word; 
  document.getElementById('scoreText').innerText = qScore; 
  speakWord(q.word);

  const opts = [q, ...allWords.filter(w => w.word !== q.word).sort(() => 0.5 - Math.random()).slice(0, 3)].sort(() => 0.5 - Math.random());
  const grid = document.getElementById('optionsGrid'); grid.innerHTML = '';
  opts.forEach(o => {
    const btn = document.createElement('button'); btn.className = 'btn option-btn'; btn.style.cssText = 'padding:10px; background:rgba(255,255,255,0.08); color:white; justify-content:center;'; btn.innerText = o.meaning;
    btn.onclick = () => { if (o.word === q.word) { qScore += 100; userStats.correctAnswers++; qIndex++; nextQuiz(); } else { saveWrongWord(q); if (isSurvival) { hp--; updateHPUI(); } qIndex++; nextQuiz(); } };
    grid.appendChild(btn);
  });
  updatePowerUpUI();
}

function usePowerUp5050() {
  if (powerUps.p_5050 <= 0) {
    showSuccessModal('⚠️', '無法使用', '沒有二選一排除卡了！');
    return;
  }
  powerUps.p_5050--; localStorage.setItem('wm_powerups', JSON.stringify(powerUps)); updatePowerUpUI();
  const q = qList[qIndex]; let removed = 0;
  document.querySelectorAll('.option-btn').forEach(b => { if (b.innerText !== q.meaning && removed < 2) { b.style.visibility = 'hidden'; removed++; } });
}

function usePowerUpHeal() { 
  if (powerUps.p_heal <= 0) {
    showSuccessModal('⚠️', '無法使用', '沒有補血藥水了！');
    return;
  }
  if (hp >= 3) {
    showSuccessModal('❤️', '血量已滿', '不需要使用補血藥水！');
    return;
  }
  powerUps.p_heal--; hp++; localStorage.setItem('wm_powerups', JSON.stringify(powerUps)); updateHPUI(); updatePowerUpUI(); 
}

/* 🌧️ 瀑布 */
let fallTimer = null;
function startWordFallGame() {
  document.getElementById('fallModal').style.display = 'flex'; 
  const fallArea = document.getElementById('fallArea'); fallArea.innerHTML = '';
  
  const source = document.getElementById('fallSourceSelect').value;
  const pool = getWordPoolBySource(source);

  const q = pool[Math.floor(Math.random() * pool.length)]; 
  document.getElementById('fallTargetMeaning').innerText = `🎯 目標：${q.meaning}`;
  
  const item = document.createElement('div'); item.className = 'falling-item'; item.innerText = q.word; item.style.left = '80px'; item.style.top = '0px'; fallArea.appendChild(item);
  let pos = 0; fallTimer = setInterval(() => { pos += 2; item.style.top = pos + 'px'; if (pos > 220) { clearInterval(fallTimer); closeModal('fallModal'); } }, 30);
  item.onclick = () => { clearInterval(fallTimer); confetti({ particleCount: 50 }); showSuccessModal('🎉', '答對了！', '成功接住單字！'); closeModal('fallModal'); };
}
function usePowerUpFreeze() { 
  if (powerUps.p_freeze <= 0) {
    showSuccessModal('⚠️', '無法使用', '沒有凍結沙漏了！');
    return;
  }
  powerUps.p_freeze--; localStorage.setItem('wm_powerups', JSON.stringify(powerUps)); updatePowerUpUI(); clearInterval(fallTimer); setTimeout(() => { showSuccessModal('⏰', '時間流動', '繼續下落！'); }, 3000); 
}

/* 🔤 拼字 */
let spellWord = null, spellUser = [];
function startSpellingGame() {
  document.getElementById('spellingModal').style.display = 'flex'; 
  
  const source = document.getElementById('spellSourceSelect').value;
  const pool = getWordPoolBySource(source);

  spellWord = pool[Math.floor(Math.random() * pool.length)];
  document.getElementById('spellMeaning').innerText = spellWord.meaning; 
  spellUser = []; 
  renderSpelling();
}
function renderSpelling() {
  const slots = document.getElementById('spellingSlots'); slots.innerHTML = '';
  for(let i=0; i<spellWord.word.length; i++) slots.innerHTML += `<div class="letter-slot">${spellUser[i] || ''}</div>`;
  const pool = document.getElementById('letterPool'); pool.innerHTML = '';
  spellWord.word.split('').sort(() => 0.5 - Math.random()).forEach(char => {
    const btn = document.createElement('button'); btn.className = 'letter-btn'; btn.innerText = char.toUpperCase();
    btn.onclick = () => { spellUser.push(char); renderSpelling(); }; pool.appendChild(btn);
  });
}
function checkSpelling() { 
  if (spellUser.join('').toLowerCase() === spellWord.word.toLowerCase()) { 
    showSuccessModal('🎉', '正確！', `正確單字就是 ${spellWord.word}！`); 
    closeModal('spellingModal'); 
  } else {
    showSuccessModal('❌', '錯誤', '再試一次！');
  } 
}

/* 🧩 句子 */
let sentObj = null, sentUser = [];
function startSentenceGame() {
  document.getElementById('sentenceModal').style.display = 'flex'; 
  const valid = allWords.filter(w => w.examples && w.examples.length > 0);
  sentObj = valid[Math.floor(Math.random() * valid.length)].examples[0]; 
  document.getElementById('sentenceMeaning').innerText = `💡 ${sentObj.zh}`;
  sentUser = []; 
  renderSentence();
}
function renderSentence() {
  const target = document.getElementById('sentenceTargetArea'); target.innerHTML = '';
  sentUser.forEach(w => target.innerHTML += `<div class="word-chip">${w}</div>`);
  const pool = document.getElementById('sentenceWordPool'); pool.innerHTML = '';
  sentObj.en.replace(/[.,?!]/g, '').split(' ').sort(() => 0.5 - Math.random()).forEach(w => {
    const chip = document.createElement('div'); chip.className = 'word-chip'; chip.innerText = w;
    chip.onclick = () => { sentUser.push(w); renderSentence(); }; pool.appendChild(chip);
  });
}
function checkSentenceAnswer() { 
  if (sentUser.join(' ').toLowerCase() === sentObj.en.replace(/[.,?!]/g, '').toLowerCase()) { 
    showSuccessModal('🎉', '重組成功！', '語順完全正確！'); 
    closeModal('sentenceModal'); 
  } else {
    showSuccessModal('❌', '語順有誤', '再試一次！');
  } 
}

function exportData() {
  const data = { currentUser, coins, equippedTitle, wrongNotebook, powerUps, streakDays, userStats };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `WordMaster_Backup_${currentUser}.json`; a.click();
}
function importData(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader(); reader.onload = function(evt) {
    const data = JSON.parse(evt.target.result); localStorage.setItem('wm_nickname', data.currentUser || "同學"); localStorage.setItem('wm_coins', data.coins || 0); localStorage.setItem('wm_notebook', JSON.stringify(data.wrongNotebook || [])); localStorage.setItem('wm_powerups', JSON.stringify(data.powerUps || {})); localStorage.setItem('wm_stats', JSON.stringify(data.userStats || {}));
    showSuccessModal('🎉', '還原成功！', '紀錄已載入！'); 
    setTimeout(() => location.reload(), 1500);
  }; reader.readAsText(file);
}

function printWordList() { window.print(); }

function switchTab(tabName) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
  
  const targetNav = Array.from(document.querySelectorAll('.nav-item')).find(item => item.getAttribute('onclick').includes(`'${tabName}'`));
  if (targetNav) targetNav.classList.add('active');
  
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.getElementById('searchBoxContainer').style.display = tabName === 'words' ? 'block' : 'none';
  
  if (tabName === 'shop') renderShopUI();
  if (tabName === 'profile') renderProfileUI();
  if (tabName === 'notebook') renderNotebookUI();
  if (tabName === 'leaderboard') renderLeaderboardUI();

  closeMobileMenu();
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openEditNameModal() { document.getElementById('nicknameModal').style.display = 'flex'; }
function saveNickname() {
  const input = document.getElementById('nicknameInput').value.trim();
  if (input) currentUser = input;
  const fileInput = document.getElementById('avatarFileInput');
  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) { userAvatar = e.target.result; saveUserData(); };
    reader.readAsDataURL(fileInput.files[0]);
  } else { saveUserData(); }
}
function saveUserData() {
  localStorage.setItem('wm_nickname', currentUser); localStorage.setItem('wm_avatar', userAvatar);
  updateUserUI(); renderProfileUI(); closeModal('nicknameModal');
  showSuccessModal('👤', '暱稱更新', `好的，以後就叫你 ${currentUser}！`);
}