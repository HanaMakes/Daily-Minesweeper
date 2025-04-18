// Game Constants
const GRID_SIZE = 10;
const MINES = 15;
let timerInterval;
let gameGrid = [];
let gameActive = false;

// Firebase References
const auth = firebase.auth();
const database = firebase.database();

// Game Initialization
function initGame() {
    // Generate daily seed
    const today = new Date();
    const seed = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
    
    // Generate grid
    const gridContainer = document.getElementById('grid');
    gridContainer.innerHTML = '';
    
    gameGrid = Array(GRID_SIZE).fill().map(() => 
        Array(GRID_SIZE).fill().map(() => ({
            isMine: Math.random() < MINES/(GRID_SIZE*GRID_SIZE),
            revealed: false
        }))
    );

    // Create grid cells
    for(let i = 0; i < GRID_SIZE; i++) {
        for(let j = 0; j < GRID_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = i;
            cell.dataset.y = j;
            cell.addEventListener('click', handleCellClick);
            gridContainer.appendChild(cell);
        }
    }
}

function handleCellClick(e) {
    if(!gameActive) return;
    
    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);
    
    if(gameGrid[x][y].isMine) {
        alert('Game Over!');
        gameActive = false;
        return;
    }
    
    e.target.classList.add('revealed');
    gameGrid[x][y].revealed = true;
}

// Authentication
document.getElementById('google-login').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
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
        updateStreak();
    } else {
        authSection.classList.remove('hidden');
        gameSection.classList.add('hidden');
    }
});

// Timer
function startTimer() {
    let seconds = 0;
    document.getElementById('timer').textContent = seconds;
    timerInterval = setInterval(() => {
        seconds++;
        document.getElementById('timer').textContent = seconds;
    }, 1000);
}

// Leaderboard
async function loadLeaderboard() {
    const today = new Date().toISOString().split('T')[0];
    const snapshot = await database.ref(`leaderboards/${today}`).once('value');
    const scores = snapshot.val() || {};
    
    const leaderboardHTML = Object.values(scores)
        .sort((a, b) => a.time - b.time)
        .map(score => `<div>${score.username}: ${score.time}s</div>`)
        .join('');
    
    document.getElementById('leaderboard').innerHTML = leaderboardHTML;
}

// Streak System
async function updateStreak() {
    const user = auth.currentUser;
    if(!user) return;

    const userRef = database.ref(`users/${user.uid}`);
    const snapshot = await userRef.once('value');
    const userData = snapshot.val() || {};

    const lastPlayed = userData.lastPlayed ? new Date(userData.lastPlayed) : null;
    const today = new Date();
    
    if(!lastPlayed || !isSameDay(lastPlayed, today)) {
        const streak = userData.streak || 0;
        const newStreak = lastPlayed && isYesterday(lastPlayed, today) ? streak + 1 : 1;
        
        await userRef.update({
            streak: newStreak,
            lastPlayed: today.toISOString()
        });
        
        document.getElementById('streak').textContent = newStreak;
    }
}

function isSameDay(d1, d2) {
    return d1.toDateString() === d2.toDateString();
}

function isYesterday(d1, d2) {
    const yesterday = new Date(d2);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(d1, yesterday);
}