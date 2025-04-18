document.addEventListener('DOMContentLoaded', () => {
    // Game Constants
    const GRID_SIZE = 10;
    const MINES = 15;
    let timerInterval;
    let gameGrid = [];
    let gameActive = false;
    let startTime = null;

    // Firebase References
    const auth = firebase.auth();
    const database = firebase.database();

    // Game Initialization
    function initGame() {
        const today = new Date();
        const seed = today.toISOString().split('T')[0];
        gameActive = true;
        startTime = Date.now();
        document.getElementById('timer').textContent = '0';
        clearInterval(timerInterval);
        
        // Initialize grid
        gameGrid = Array(GRID_SIZE).fill().map((_, i) => 
            Array(GRID_SIZE).fill().map((_, j) => ({
                isMine: Math.random() < MINES/(GRID_SIZE*GRID_SIZE),
                revealed: false,
                flagged: false
            }))
        );

        // Create grid cells
        const gridContainer = document.getElementById('grid');
        gridContainer.innerHTML = '';
        
        for(let i = 0; i < GRID_SIZE; i++) {
            for(let j = 0; j < GRID_SIZE; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = i;
                cell.dataset.y = j;
                cell.addEventListener('click', handleCellClick);
                cell.addEventListener('contextmenu', handleRightClick);
                gridContainer.appendChild(cell);
            }
        }
    }

    function handleCellClick(e) {
        if(!gameActive) return;
        const x = parseInt(e.target.dataset.x);
        const y = parseInt(e.target.dataset.y);
        
        if(gameGrid[x][y].isMine) {
            gameOver(false);
            return;
        }
        
        revealCell(x, y);
        checkWin();
    }

    function handleRightClick(e) {
        e.preventDefault();
        if(!gameActive) return;
        const x = parseInt(e.target.dataset.x);
        const y = parseInt(e.target.dataset.y);
        gameGrid[x][y].flagged = !gameGrid[x][y].flagged;
        e.target.textContent = gameGrid[x][y].flagged ? '🚩' : '';
    }

    function revealCell(x, y) {
        if(x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
        if(gameGrid[x][y].revealed || gameGrid[x][y].flagged) return;
        
        gameGrid[x][y].revealed = true;
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        cell.classList.add('revealed');
        
        // Get neighbor mine count
        const count = countNeighborMines(x, y);
        if(count > 0) {
            cell.textContent = count;
        } else {
            // Reveal neighbors
            for(let dx = -1; dx <= 1; dx++) {
                for(let dy = -1; dy <= 1; dy++) {
                    revealCell(x + dx, y + dy);
                }
            }
        }
    }

    function countNeighborMines(x, y) {
        let count = 0;
        for(let dx = -1; dx <= 1; dx++) {
            for(let dy = -1; dy <= 1; dy++) {
                const nx = x + dx;
                const ny = y + dy;
                if(nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    if(gameGrid[nx][ny].isMine) count++;
                }
            }
        }
        return count;
    }

    function gameOver(won) {
        gameActive = false;
        clearInterval(timerInterval);
        if(won) {
            alert('Congratulations! You won!');
            const time = Math.floor((Date.now() - startTime) / 1000);
            updateLeaderboard(time);
            updateStreak();
        } else {
            alert('Game Over! Try again!');
        }
    }

    function checkWin() {
        let unrevealedSafeCells = 0;
        for(let i = 0; i < GRID_SIZE; i++) {
            for(let j = 0; j < GRID_SIZE; j++) {
                if(!gameGrid[i][j].isMine && !gameGrid[i][j].revealed) {
                    unrevealedSafeCells++;
                }
            }
        }
        if(unrevealedSafeCells === 0) gameOver(true);
    }

    // Authentication
    document.getElementById('google-login').addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(error => {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        });
    });

    auth.onAuthStateChanged(user => {
        const authSection = document.getElementById('auth-section');
        const gameSection = document.getElementById('game-section');
        
        if(user) {
            authSection.classList.add('hidden');
            gameSection.classList.remove('hidden');
            initGame();
            startTimer();
            loadLeaderboard();
            updateStreakDisplay();
        } else {
            authSection.classList.remove('hidden');
            gameSection.classList.add('hidden');
        }
    });

    // Timer
    function startTimer() {
        document.getElementById('timer').textContent = '0';
        timerInterval = setInterval(() => {
            const seconds = Math.floor((Date.now() - startTime) / 1000);
            document.getElementById('timer').textContent = seconds;
        }, 1000);
    }

    // Leaderboard
    async function updateLeaderboard(time) {
        const user = auth.currentUser;
        if(!user) return;

        const today = new Date().toISOString().split('T')[0];
        const entry = {
            username: user.displayName || 'Anonymous',
            time: time,
            timestamp: Date.now()
        };

        try {
            await database.ref(`leaderboards/${today}`).push(entry);
            loadLeaderboard();
        } catch (error) {
            console.error('Leaderboard update failed:', error);
        }
    }

    async function loadLeaderboard() {
        const today = new Date().toISOString().split('T')[0];
        try {
            const snapshot = await database.ref(`leaderboards/${today}`).once('value');
            const scores = snapshot.val() || {};
            
            const sorted = Object.values(scores)
                .sort((a, b) => a.time - b.time)
                .slice(0, 10);
            
            const leaderboardHTML = sorted
                .map((score, index) => `
                    <div class="leaderboard-entry">
                        <span>${index + 1}.</span>
                        <span>${score.username}</span>
                        <span>${score.time}s</span>
                    </div>
                `)
                .join('');
            
            document.getElementById('leaderboard').innerHTML = leaderboardHTML || '<div>No scores yet!</div>';
        } catch (error) {
            console.error('Leaderboard load failed:', error);
        }
    }

    // Streak System
    async function updateStreakDisplay() {
        const user = auth.currentUser;
        if(!user) return;

        try {
            const snapshot = await database.ref(`users/${user.uid}`).once('value');
            const userData = snapshot.val() || {};
            document.getElementById('streak').textContent = userData.streak || 0;
        } catch (error) {
            console.error('Streak update failed:', error);
        }
    }

    async function updateStreak() {
        const user = auth.currentUser;
        if(!user) return;

        try {
            const userRef = database.ref(`users/${user.uid}`);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val() || {};
            const lastPlayed = userData.lastPlayed ? new Date(userData.lastPlayed) : null;
            const today = new Date();

            let newStreak = 1;
            if(lastPlayed) {
                if(isSameDay(lastPlayed, today)) {
                    return; // Already played today
                }
                newStreak = isYesterday(lastPlayed, today) ? (userData.streak || 0) + 1 : 1;
            }

            await userRef.update({
                streak: newStreak,
                lastPlayed: today.toISOString()
            });
            updateStreakDisplay();
        } catch (error) {
            console.error('Streak update failed:', error);
        }
    }

    function isSameDay(d1, d2) {
        return d1.toDateString() === d2.toDateString();
    }

    function isYesterday(d1, d2) {
        const yesterday = new Date(d2);
        yesterday.setDate(d2.getDate() - 1);
        return isSameDay(d1, yesterday);
    }
});