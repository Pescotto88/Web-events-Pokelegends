// js/events/whack-event.js
import { loginWithDiscord, getDiscordUser, logoutDiscord } from '../discord-auth.js';

// --- Supabase Database Configuration ---
const SUPABASE_URL = "https://nyhijimwghgvsjtfbrcm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55aGlqaW13Z2hndnNqdGZicmNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzMTExMjQsImV4cCI6MjEwODg4NzEyNH0.YaExlFywe5FT1mBAJOF3DVUSvNdo6eP6_I29Two5TKs";

async function fetchGlobalLeaderboard() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard?select=*&order=score.desc&limit=10`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    return await res.json();
  } catch (err) {
    console.error("Leaderboard fetch failed", err);
    return [];
  }
}

async function saveGlobalScore(discordId, username, score) {
  try {
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard?discord_id=eq.${discordId}&select=score`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    const data = await getRes.json();

    if (Array.isArray(data) && data.length > 0) {
      if (score > data[0].score) {
        await fetch(`${SUPABASE_URL}/rest/v1/leaderboard?discord_id=eq.${discordId}`, {
          method: 'PATCH',
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({ username, score })
        });
      }
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({ discord_id: discordId, username, score })
      });
    }
  } catch (err) {
    console.error("Score submit failed", err);
  }
}

export async function initWhackEvent() {
  // Set Dynamic Hero Banner
  const heroTitle = document.getElementById('hero-title-container');
  const heroDesc = document.getElementById('hero-desc');
  
  if (heroTitle) heroTitle.innerHTML = 'Whack a <span>Mon!</span>';
  if (heroDesc) heroDesc.textContent = 'Test your reflexes in this high-speed Cobblemon event! Score 25,000+ points before time runs out to earn an exclusive in-game reward code!';

  // Inject Event UI Content
  const container = document.getElementById('event-content');
  container.innerHTML = `
    <div class="card">
      <div class="card-title">
        <span>Aim Challenge Arena (4x4)</span>
        <div id="user-badge" style="font-size: 0.85rem; font-weight: 700;">
          <button id="discord-login-btn" style="background: #5865F2; color: #fff; border: none; padding: 6px 14px; border-radius: 8px; font-weight: 700; cursor: pointer;">Login with Discord</button>
        </div>
      </div>

      <div class="hud">
        <div class="hud-item">
          <div class="hud-label">Score</div>
          <div class="hud-value" id="score">0</div>
        </div>
        <div class="hud-item">
          <div class="hud-label">Time</div>
          <div class="hud-value" id="timer">60s</div>
        </div>
        <div class="hud-item">
          <div class="hud-label">High Score</div>
          <div class="hud-value" id="high-score">0</div>
        </div>
      </div>

      <div class="arena-grid">
        ${Array(16).fill('<div class="hole"><img class="mole" src="" alt=""></div>').join('')}
      </div>

      <button class="btn-action" id="start-btn">Start Aim Challenge</button>

      <div class="claim-box">
        <span class="claim-code" id="claim-code">⚡ Log in with Discord & score 25,000+ pts to unlock your code!</span>
        <button class="btn-copy" id="copy-btn">Copy Code</button>
      </div>
    </div>

    <!-- Sidebar Column: Point Table + Live Top 10 Leaderboard -->
    <div style="display: flex; flex-direction: column; gap: 25px;">
      <div class="card">
        <div class="card-title">Point & Rarity Table</div>
        <div class="legend-item">
          <div class="legend-info"><img class="legend-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/143.gif"><span class="legend-name">Snorlax (Rare)</span></div>
          <span class="legend-pts pts-high">+500</span>
        </div>
        <div class="legend-item">
          <div class="legend-info"><img class="legend-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/25.gif"><span class="legend-name">Pikachu</span></div>
          <span class="legend-pts pts-plus">+300</span>
        </div>
        <div class="legend-item">
          <div class="legend-info"><img class="legend-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/447.gif"><span class="legend-name">Riolu (Common)</span></div>
          <span class="legend-pts pts-plus">+200</span>
        </div>
        <div class="legend-item">
          <div class="legend-info"><img class="legend-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/100.gif"><span class="legend-name">Voltorb Trap</span></div>
          <span class="legend-pts pts-minus">-200</span>
        </div>
        <div class="legend-item">
          <div class="legend-info"><img class="legend-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/shiny/100.gif"><span class="legend-name">Shiny Voltorb Trap</span></div>
          <span class="legend-pts pts-minus">-500</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>🏆 Top 10 High Scores</span>
        </div>
        <div id="leaderboard-list">
          <div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 10px 0;">Loading leaderboard...</div>
        </div>
      </div>
    </div>
  `;

  const holes = container.querySelectorAll('.hole');
  const scoreBoard = container.querySelector('#score');
  const timerBoard = container.querySelector('#timer');
  const highScoreBoard = container.querySelector('#high-score');
  const claimCodeEl = container.querySelector('#claim-code');
  const startBtn = container.querySelector('#start-btn');
  const copyBtn = container.querySelector('#copy-btn');
  const userBadge = container.querySelector('#user-badge');
  const leaderboardList = container.querySelector('#leaderboard-list');

  let currentUser = null;
  let timeUp = false;
  let score = 0;
  let timeLeft = 60;
  let timerId, spawnLoopId, cooldownInterval;
  const COOLDOWN_TIME = 60 * 60 * 1000;

  currentUser = await getDiscordUser();

  if (currentUser) {
    userBadge.innerHTML = `
      <span style="color: var(--accent-yellow);">@${currentUser.username}</span>
      <button id="discord-logout-btn" style="background: rgba(255,255,255,0.1); color: var(--text-muted); border: none; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; margin-left: 8px; cursor: pointer;">Logout</button>
    `;
    container.querySelector('#discord-logout-btn').addEventListener('click', logoutDiscord);

    const existingClaim = localStorage.getItem(`pl_claim_whack_${currentUser.id}`);
    if (existingClaim) {
      claimCodeEl.textContent = `Already Claimed: ${existingClaim}`;
      copyBtn.style.display = 'inline-block';
    }
  } else {
    container.querySelector('#discord-login-btn').addEventListener('click', loginWithDiscord);
  }

  let highScore = localStorage.getItem('pl_aim_highscore') || 0;
  highScoreBoard.textContent = highScore;

  async function loadLeaderboard() {
    const rawScores = await fetchGlobalLeaderboard();
    
    if (!Array.isArray(rawScores) || rawScores.length === 0) {
      leaderboardList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 10px 0;">No global scores found. Submit one!</div>`;
      return;
    }

    leaderboardList.innerHTML = rawScores.map((entry, index) => {
      const rankColor = index === 0 ? 'color: #fbc02d;' : index === 1 ? 'color: #c0c0c0;' : index === 2 ? 'color: #cd7f32;' : 'color: var(--text-muted);';
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-weight: 800; font-size: 0.85rem; width: 18px; ${rankColor}">#${index + 1}</span>
            <span style="font-weight: 700; font-size: 0.85rem;">@${entry.username}</span>
          </div>
          <span style="font-weight: 800; font-size: 0.85rem; color: var(--accent-yellow);">${entry.score.toLocaleString()}</span>
        </div>
      `;
    }).join('');
  }

  loadLeaderboard();

  const pokemonPool = [
    { id: 447, pts: 200, shiny: false, weight: 40 },
    { id: 25,  pts: 300, shiny: false, weight: 25 },
    { id: 100, pts: -200, shiny: false, weight: 20 },
    { id: 143, pts: 500, shiny: false, weight: 10 },
    { id: 100, pts: -500, shiny: true, weight: 5 }
  ];

  function checkCooldown() {
    const lastPlay = localStorage.getItem('pl_last_play_time');
    if (!lastPlay) return false;

    const timePassed = Date.now() - parseInt(lastPlay);
    if (timePassed < COOLDOWN_TIME) {
      startBtn.disabled = true;
      updateCooldownButton(COOLDOWN_TIME - timePassed);
      return true;
    }
    startBtn.disabled = false;
    startBtn.textContent = 'Start Aim Challenge';
    if (cooldownInterval) clearInterval(cooldownInterval);
    return false;
  }

  function updateCooldownButton() {
    if (cooldownInterval) clearInterval(cooldownInterval);
    cooldownInterval = setInterval(() => {
      const lastPlay = localStorage.getItem('pl_last_play_time');
      const left = COOLDOWN_TIME - (Date.now() - parseInt(lastPlay));

      if (left <= 0) {
        clearInterval(cooldownInterval);
        startBtn.disabled = false;
        startBtn.textContent = 'Start Aim Challenge';
      } else {
        const mins = Math.floor(left / 60000);
        const secs = Math.floor((left % 60000) / 1000);
        startBtn.textContent = `Cooldown: ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
      }
    }, 1000);
  }

  checkCooldown();

  function getRandomPokemon() {
    const totalWeight = pokemonPool.reduce((sum, p) => sum + p.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const p of pokemonPool) {
      if (rand < p.weight) return p;
      rand -= p.weight;
    }
    return pokemonPool[0];
  }

  function popSingle() {
    if (timeUp) return;
    const available = Array.from(holes).filter(h => !h.classList.contains('up'));
    if (available.length === 0) return;

    const hole = available[Math.floor(Math.random() * available.length)];
    const mole = hole.querySelector('.mole');
    const pokemon = getRandomPokemon();

    const spriteType = pokemon.shiny ? 'showdown/shiny' : 'showdown';
    mole.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/${spriteType}/${pokemon.id}.gif`;
    hole.dataset.pts = pokemon.pts;
    hole.dataset.active = "true";
    hole.classList.add('up');

    setTimeout(() => {
      hole.classList.remove('up');
      hole.dataset.active = "false";
    }, Math.round(Math.random() * (900 - 650) + 650));
  }

  function spawnManager() {
    if (timeUp) return;
    const count = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < count; i++) popSingle();
    spawnLoopId = setTimeout(spawnManager, Math.round(Math.random() * (600 - 400) + 400));
  }

  startBtn.addEventListener('click', () => {
    if (!currentUser) {
      alert('Please log in with Discord before starting!');
      loginWithDiscord();
      return;
    }

    if (checkCooldown()) return;
    score = 0;
    timeLeft = 60;
    timeUp = false;
    scoreBoard.textContent = 0;
    timerBoard.textContent = '60s';
    startBtn.disabled = true;

    const existingClaim = localStorage.getItem(`pl_claim_whack_${currentUser.id}`);
    if (!existingClaim) {
      copyBtn.style.display = 'none';
      claimCodeEl.textContent = '⚡ Score 25,000+ pts to unlock your server reward code!';
    }

    spawnManager();

    timerId = setInterval(async () => {
      timeLeft--;
      timerBoard.textContent = timeLeft + 's';
      if (timeLeft <= 0) {
        clearInterval(timerId);
        clearTimeout(spawnLoopId);
        timeUp = true;
        localStorage.setItem('pl_last_play_time', Date.now());
        checkCooldown();

        if (score > highScore) {
          highScore = score;
          localStorage.setItem('pl_aim_highscore', highScore);
          highScoreBoard.textContent = highScore;
        }

        await saveGlobalScore(currentUser.id, currentUser.username, score);
        await loadLeaderboard();

        if (score >= 25000) {
          if (localStorage.getItem(`pl_claim_whack_${currentUser.id}`)) {
            claimCodeEl.textContent = 'Account already claimed reward for this event!';
            copyBtn.style.display = 'none';
          } else {
            const code = 'PL-WHACK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            localStorage.setItem(`pl_claim_whack_${currentUser.id}`, `/claim ${code}`);
            claimCodeEl.textContent = `/claim ${code}`;
            copyBtn.style.display = 'inline-block';
          }
        } else {
          if (!localStorage.getItem(`pl_claim_whack_${currentUser.id}`)) {
            claimCodeEl.textContent = `Almost! You scored ${score.toLocaleString()} pts (Need 25,000 pts)`;
            copyBtn.style.display = 'none';
          }
        }
      }
    }, 1000);
  });

  holes.forEach(hole => {
    hole.addEventListener('click', function(e) {
      if (!e.isTrusted || this.dataset.active !== "true") return;
      score += parseInt(this.dataset.pts || 0);
      if (score < 0) score = 0;
      scoreBoard.textContent = score;
      this.dataset.active = "false";
      this.classList.remove('up');
    });
  });

  copyBtn.addEventListener('click', () => {
    const code = claimCodeEl.textContent;
    if (code.startsWith('/claim') || code.startsWith('Already Claimed:')) {
      const cleanCode = code.replace('Already Claimed: ', '');
      navigator.clipboard.writeText(cleanCode);
      alert('Reward code copied to clipboard!');
    }
  });
}
