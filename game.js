const boardSize = 8;
const mineCount = 10;
let board = [];
let minePositions = [];

document.addEventListener("DOMContentLoaded", () => {
  const gameBoard = document.getElementById("game-board");
  const resetButton = document.getElementById("reset-button");
  const statusLabel = document.getElementById("status-label");

  resetButton.addEventListener("click", resetGame);

  function resetGame() {
    board = [];
    minePositions = [];
    statusLabel.textContent = "Game reset! Good luck.";
    gameBoard.innerHTML = "";
    setupBoard();
    renderBoard();
  }

  function setupBoard() {
    // Initialize board and mines
    for (let i = 0; i < boardSize; i++) {
      board[i] = [];
      for (let j = 0; j < boardSize; j++) {
        board[i][j] = { revealed: false, mine: false, flagged: false, adjacentMines: 0 };
      }
    }
    placeMines();
    calculateAdjacentMines();
  }

  function placeMines() {
    while (minePositions.length < mineCount) {
      const position = [randomInt(boardSize), randomInt(boardSize)];
      if (!minePositions.some(([x, y]) => x === position[0] && y === position[1])) {
        minePositions.push(position);
        board[position[0]][position[1]].mine = true;
      }
    }
  }

  function calculateAdjacentMines() {
    for (const [x, y] of minePositions) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const nx = x + i, ny = y + j;
          if (isValidCell(nx, ny) && !board[nx][ny].mine) {
            board[nx][ny].adjacentMines++;
          }
        }
      }
    }
  }

  function renderBoard() {
    gameBoard.style.gridTemplateColumns = `repeat(${boardSize}, auto)`;
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = i;
        cell.dataset.col = j;
        cell.addEventListener("click", handleCellClick);
        cell.addEventListener("contextmenu", handleCellRightClick);
        gameBoard.appendChild(cell);
      }
    }
  }

  function handleCellClick(event) {
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    revealCell(row, col);
  }

  function handleCellRightClick(event) {
    event.preventDefault();
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    toggleFlag(row, col);
  }

  function revealCell(row, col) {
    if (!isValidCell(row, col) || board[row][col].revealed || board[row][col].flagged) {
      return;
    }
    const cell = getCellElement(row, col);
    board[row][col].revealed = true;
    cell.classList.add("revealed");
    if (board[row][col].mine) {
      cell.classList.add("mine");
      statusLabel.textContent = "Game Over!";
      showAllMines();
    } else {
      cell.textContent = board[row][col].adjacentMines || "";
      if (board[row][col].adjacentMines === 0) {
        revealAdjacentCells(row, col);
      }
    }
  }

  function toggleFlag(row, col) {
    if (!isValidCell(row, col) || board[row][col].revealed) {
      return;
    }
    const cell = getCellElement(row, col);
    board[row][col].flagged = !board[row][col].flagged;
    cell.classList.toggle("flagged");
  }

  function revealAdjacentCells(row, col) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        revealCell(row + i, col + j);
      }
    }
  }

  function showAllMines() {
    for (const [x, y] of minePositions) {
      const cell = getCellElement(x, y);
      cell.classList.add("mine");
    }
  }

  function getCellElement(row, col) {
    return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  }

  function randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  function isValidCell(row, col) {
    return row >= 0 && col >= 0 && row < boardSize && col < boardSize;
  }

  // Initialize the game on load
  resetGame();
});
