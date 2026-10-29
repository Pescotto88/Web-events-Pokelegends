// js/events/whack-event.js

export function initWhackEvent() {
  // 1. Dynamically set the Hero Title and Description for this specific event
  const heroTitle = document.getElementById('hero-title-container');
  const heroDesc = document.getElementById('hero-desc');
  
  if (heroTitle) heroTitle.innerHTML = 'Whack a <span>Mon!</span>';
  if (heroDesc) heroDesc.textContent = 'Test your reflexes in this high-speed Cobblemon event! Score 25,000+ points before time runs out to earn an exclusive in-game reward code!';

  // 2. Inject Event Content
  const container = document.getElementById('event-content');
  container.innerHTML = `
    <div class="card">
      <div class="card-title">
        <span>Aim Challenge Arena (4x4)</span>
        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Time Limit: 60s</span>
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
        <span class="claim-code" id="claim-code">⚡ Score 25,000+ pts to unlock your server reward code!</span>
        <button class="btn-copy" id="copy-btn">Copy Code</button>
      </div>
    </div>

    <!-- Point Legend Sidebar -->
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
  `;

  // 3. Game Logic
  const holes = container.querySelectorAll('.hole');
  const scoreBoard = container.querySelector('#score');
  const timerBoard = container.querySelector('#timer');
  const highScoreBoard = container.querySelector('#high-score');
  const claimCodeEl = container.querySelector('#claim-code');
  const startBtn = container.querySelector('#start-btn');
  const copyBtn = container.querySelector('#copy-btn');

  let timeUp = false;
  let score = 0;
  let timeLeft = 60;
  let timerId, spawnLoopId, cooldownInterval;
  const COOLDOWN_TIME = 60 * 60 * 1000;

  let highScore = localStorage.getItem('pl_aim_highscore') || 0;
  highScoreBoard.textContent = highScore;

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
    if (checkCooldown()) return;
    score = 0;
    timeLeft = 60;
    timeUp = false;
    scoreBoard.textContent = 0;
    timerBoard.textContent = '60s';
    startBtn.disabled = true;
    copyBtn.style.display = 'none';
    claimCodeEl.textContent = '⚡ Score 25,000+ pts to unlock your server reward code!';

    spawnManager();

    timerId = setInterval(() => {
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

        if (score >= 25000) {
          const code = 'PL-WHACK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
          claimCodeEl.textContent = `/claim ${code}`;
          copyBtn.style.display = 'inline-block';
        } else {
          claimCodeEl.textContent = `Almost! You scored ${score.toLocaleString()} pts (Need 25,000 pts)`;
          copyBtn.style.display = 'none';
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
    if (code.startsWith('/claim')) {
      navigator.clipboard.writeText(code);
      alert('Reward code copied to clipboard!');
    }
  });
}
