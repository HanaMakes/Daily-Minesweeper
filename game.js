document.addEventListener("DOMContentLoaded", () => {
  const gameBoard = document.getElementById("game-board");
  const resetButton = document.getElementById("reset-button");
  const statusLabel = document.getElementById("status-label");

  let board = [];
  let minePositions = [];

  resetButton.addEventListener("click", resetGame);

  function resetGame() {
    gameBoard.innerHTML = "";
    board = [];
    minePositions = [];
    statusLabel.textContent = "Good luck!";
    setupBoard(16, 30, 100); // Always use 16x30 grid with 100 mines (Expert Mode)
    renderBoard();
  }

  function setupBoard(rows, cols, mines) {
    initializeBoard(rows, cols);
    placeMines(rows, cols, mines);
    calculateAdjacentMines(rows, cols);
    gameBoard.style.gridTemplateColumns = `repeat(${cols}, auto)`; // Ensure grid columns match the number of columns
  }

  function initializeBoard(rows, cols) {
    for (let i = 0; i < rows; i++) {
      board[i] = [];
      for (let j = 0; j < cols; j++) {
        board[i][j] = { revealed: false, mine: false, flagged: false, adjacentMines: 0 };
      }
    }
  }

  function placeMines(rows, cols, mines) {
    while (minePositions.length < mines) {
      const position = [Math.floor(Math.random() * rows), Math.floor(Math.random() * cols)];
      if (!minePositions.some(([x, y]) => x === position[0] && y === position[1])) {
        minePositions.push(position);
        board[position[0]][position[1]].mine = true;
      }
    }
  }

  function calculateAdjacentMines(rows, cols) {
    for (const [x, y] of minePositions) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const nx = x + i, ny = y + j;
          if (isValidCell(nx, ny, rows, cols) && !board[nx][ny].mine) {
            board[nx][ny].adjacentMines++;
          }
        }
      }
    }
  }

  function renderBoard() {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = i;
        cell.dataset.col = j;
        cell.addEventListener("click", handleCellClick);
        cell.addEventListener("contextmenu", handleCellRightClick);
        cell.addEventListener("dblclick", handleCellDoubleClick); // Add2 double-click listener
        cell.addEventListener("mousedown", handleMouseDown); // Handle double right-click
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

  function handleCellDoubleClick(event) {
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    doubleClickReveal(row, col);
  }

  function handleMouseDown(event) {
    if (event.button === 2 && event.detail === 2) { // Double right-click
      const row = parseInt(event.target.dataset.row);
      const col = parseInt(event.target.dataset.col);
      autoMarkAdjacent(row, col);
    }
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

  function doubleClickReveal(row, col) {
    const cell = board[row][col];
    if (!cell.revealed) return;

    const adjacentCells = getAdjacentCells(row, col);
    const flaggedCount = adjacentCells.filter(({ flagged }) => flagged).length;

    if (flaggedCount === cell.adjacentMines) {
      adjacentCells.forEach(({ row, col }) => revealCell(row, col));
    }
  }

  function autoMarkAdjacent(row, col) {
    const cell = board[row][col];
    if (!cell.revealed) return;

    const adjacentCells = getAdjacentCells(row, col);
    const flaggedCount = adjacentCells.filter(({ flagged }) => flagged).length;
    const unflaggedAndUnrevealed = adjacentCells.filter(({ revealed, flagged }) => !revealed && !flagged);

    // Only proceed if the existing flags + unflagged tiles match the adjacent mine count
    if (flaggedCount + unflaggedAndUnrevealed.length === cell.adjacentMines) {
      unflaggedAndUnrevealed.forEach(({ row, col }) => {
        toggleFlag(row, col);
      });
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
        const nx = row + i, ny = col + j;
        if (isValidCell(nx, ny) && !board[nx][ny].revealed && !board[nx][ny].flagged) {
          revealCell(nx, ny);
        }
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

  function getAdjacentCells(row, col) {
    const cells = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const nx = row + i, ny = col + j;
        if (isValidCell(nx, ny)) {
          cells.push({ ...board[nx][ny], row: nx, col: ny });
        }
      }
    }
    return cells;
  }

  function isValidCell(row, col, rows = board.length, cols = board[0].length) {
    return row >= 0 && col >= 0 && row < rows && col < cols;
  }

  resetGame();
});