document.addEventListener('DOMContentLoaded', () => {
    // ----- Constants -----
    const GRID_SIZE = 10;
    const MINES = 15;
    let gameGrid = [];
    let gameActive = false;
    let startTime = 0;
    let timerInterval = null;
  
    // Firebase refs
    const auth = firebase.auth();
    const db   = firebase.database();
  
    // Seeded RNG (xmur3 + 32‑bit ARX)
    function createSeededRandom(seed) {
      let value = xmur3(seed)();
      return () => (value = Math.imul(value ^ (value >>> 16), 2246822507), 
                   Math.imul(value ^ (value >>> 13), 3266489909) ^ (value >>> 16));
    }
    function xmur3(str) {
      let h = 1779033703 ^ str.length;
      for (let i = 0; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
        h = (h << 13) | (h >>> 19);
      return () => h = Math.imul(h ^ (h >>> 16), 2246822507) ^ h;
    }
  
    // ----- UI Helpers -----
    function renderGrid() {
      const gridEl = document.getElementById('grid');
      gridEl.innerHTML = '';
      gameActive = true;
  
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          const cell = document.createElement('div');
          cell.classList.add('cell');
          cell.dataset.x = x;
          cell.dataset.y = y;
          cell.addEventListener('click', onCellClick);
          cell.addEventListener('contextmenu', onCellFlag);
          gridEl.appendChild(cell);
        }
      }
    }
  
    function onCellClick(e) {
      if (!gameActive) return;
      const x = +e.target.dataset.x, y = +e.target.dataset.y;
      if (gameGrid[x][y].flagged) return;
      if (gameGrid[x][y].isMine) return gameOver(false);
      revealCell(x, y);
      checkWin();
    }
  
    function onCellFlag(e) {
      e.preventDefault();
      if (!gameActive) return;
      const x = +e.target.dataset.x, y = +e.target.dataset.y;
      gameGrid[x][y].flagged = !gameGrid[x][y].flagged;
      e.target.textContent = gameGrid[x][y].flagged ? '🚩' : '';
    }
  
    function revealCell(x, y) {
      if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
      const cellData = gameGrid[x][y];
      if (cellData.revealed || cellData.flagged) return;
  
      cellData.revealed = true;
      const el = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
      el.classList.add('revealed');
  
      const count = countNeighbors(x, y);
      if (count) {
        el.textContent = count;
      } else {
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = -1; dy <= 1; dy++)
            revealCell(x + dx, y + dy);
      }
    }
  
    function countNeighbors(x, y) {
      let cnt = 0;
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx, ny = y + dy;
          if (nx>=0 && nx<GRID_SIZE && ny>=0 && ny<GRID_SIZE)
            if (gameGrid[nx][ny].isMine) cnt++;
        }
      return cnt;
    }
  
    function checkWin() {
      const safeLeft = gameGrid.flat()
        .filter(c => !c.isMine && !c.revealed).length;
      if (safeLeft === 0) gameOver(true);
    }
  
    function gameOver(won) {
      gameActive = false;
      clearInterval(timerInterval);
      alert(won ? '🎉 You won!' : '💥 Game Over');
      // … leaderboard & streak logic …
    }
  
    // ----- Timer -----
    function startTimer() {
      document.getElementById('timer').textContent = '0';
      startTime = Date.now();
      timerInterval = setInterval(() => {
        document.getElementById('timer').textContent =
          Math.floor((Date.now() - startTime) / 1000);
      }, 1000);
    }
  
    // ----- Persistence / Daily Seed -----
    function initGame() {
      const today = new Date().toISOString().slice(0, 10);
      const saved = JSON.parse(localStorage.getItem('currentGame') || 'null');
      if (saved && saved.seed === today) {
        gameGrid = saved.grid;
        startTime = saved.startTime;
      } else {
        const rand = createSeededRandom(today);
        gameGrid = Array.from({ length: GRID_SIZE }, () =>
          Array.from({ length: GRID_SIZE }, () => ({
            isMine: rand() % (GRID_SIZE * GRID_SIZE) < MINES,
            revealed: false,
            flagged: false
          }))
        );
      }
      renderGrid();
      startTimer();
    }
  
    setInterval(() => {
      if (gameActive)
        localStorage.setItem('currentGame',
          JSON.stringify({ seed: new Date().toISOString().slice(0,10),
                           grid: gameGrid,
                           startTime }));
    }, 5000);
  
    // ----- Auth & Leaderboard Wiring -----
    document.getElementById('google-login')
      .addEventListener('click', () => {
        auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
            .catch(e => alert('Login error: '+e.message));
      });
  
    document.getElementById('sign-out')
      .addEventListener('click', () => auth.signOut());
  
    auth.onAuthStateChanged(user => {
      document.getElementById('game-section')
              .classList.toggle('hidden', !user && auth.currentUser.isAnonymous);
      document.getElementById('auth-section')
              .classList.toggle('hidden', !!user && !user.isAnonymous);
      const ui = document.getElementById('user-info');
      if (user && !user.isAnonymous) {
        ui.classList.remove('hidden');
        document.getElementById('username').textContent = user.displayName;
      } else ui.classList.add('hidden');
  
      // Always kick off game & leaderboard
      initGame();
      // loadLeaderboard(); updateStreakDisplay(); …
    });
  });
  