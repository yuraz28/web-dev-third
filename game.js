class Game2048 {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.gridSize = 4;
        this.history = [];
        this.gameOver = false;
        this.won = false;
        this.tileIdCounter = 0;
        
        this.initDOM();
        this.initEventListeners();
        this.loadGame();
    }

    initDOM() {
        this.gridContainer = document.getElementById('grid-container');
        this.tilesContainer = document.getElementById('tiles-container');
        this.scoreElement = document.getElementById('score');
        
        this.newGameBtn = document.getElementById('new-game-btn');
        this.undoBtn = document.getElementById('undo-btn');
        this.leaderboardBtn = document.getElementById('leaderboard-btn');
        
        this.gameOverModal = document.getElementById('game-over-modal');
        this.gameOverTitle = document.getElementById('game-over-title');
        this.leaderboardModal = document.getElementById('leaderboard-modal');
        this.finalScoreElement = document.getElementById('final-score');
        this.saveScoreForm = document.getElementById('save-score-form');
        this.scoreSavedMessage = document.getElementById('score-saved-message');
        this.nameErrorMessage = document.getElementById('name-error-message');
        this.playerNameInput = document.getElementById('player-name');
        this.saveScoreBtn = document.getElementById('save-score-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.closeLeaderboardBtn = document.getElementById('close-leaderboard');
        this.errorModal = document.getElementById('error-modal');
        this.errorMessageText = document.getElementById('error-message-text');
        this.errorOkBtn = document.getElementById('error-ok-btn');
        this.closeErrorBtn = document.getElementById('close-error');
        this.winNotification = document.getElementById('win-notification');
        
        this.mobileControls = document.getElementById('mobile-controls');
        
        this.createGridCells();
    }

    createGridCells() {
        while (this.gridContainer.firstChild) {
            this.gridContainer.removeChild(this.gridContainer.firstChild);
        }
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            this.gridContainer.appendChild(cell);
        }
    }

    initEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            const keyMap = {
                'ArrowUp': 'up',
                'ArrowDown': 'down',
                'ArrowLeft': 'left',
                'ArrowRight': 'right'
            };
            
            if (keyMap[e.key]) {
                e.preventDefault();
                this.move(keyMap[e.key]);
            }
        });

        const controlButtons = document.querySelectorAll('.control-btn');
        controlButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.gameOver) {
                    this.move(btn.dataset.direction);
                }
            });
        });

        this.initTouchControls();

        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.undoBtn.addEventListener('click', () => this.undo());
        this.leaderboardBtn.addEventListener('click', () => this.showLeaderboard());
        this.restartBtn.addEventListener('click', () => this.restartFromGameOver());
        this.saveScoreBtn.addEventListener('click', () => this.saveScore());
        this.closeLeaderboardBtn.addEventListener('click', () => this.hideLeaderboard());
        this.errorOkBtn.addEventListener('click', () => this.hideError());
        this.closeErrorBtn.addEventListener('click', () => this.hideError());
        
        this.leaderboardModal.addEventListener('click', (e) => {
            if (e.target === this.leaderboardModal) {
                this.hideLeaderboard();
            }
        });
        
        this.errorModal.addEventListener('click', (e) => {
            if (e.target === this.errorModal) {
                this.hideError();
            }
        });
        
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveScore();
            }
        });
    }

    newGame() {
        this.grid = this.createEmptyGrid();
        this.score = 0;
        this.history = [];
        this.gameOver = false;
        this.won = false;
        this.tileIdCounter = 0;
        
        const initialTiles = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < initialTiles; i++) {
            this.addRandomTile();
        }
        
        this.updateDisplay();
        this.saveGame();
        this.updateUndoButton();
    }

    loadGame() {
        const savedGame = localStorage.getItem('game2048State');
        
        if (savedGame) {
            try {
                const state = JSON.parse(savedGame);
                this.grid = state.grid;
                this.score = state.score;
                this.history = state.history || [];
                this.gameOver = state.gameOver || false;
                this.won = state.won || false;
                this.tileIdCounter = state.tileIdCounter || 0;
                
                this.updateDisplay();
                this.updateUndoButton();
                
                if (this.gameOver) {
                    this.showGameOver();
                }
            } catch (e) {
                this.newGame();
            }
        } else {
            this.newGame();
        }
    }

    saveGame() {
        const state = {
            grid: this.grid,
            score: this.score,
            history: this.history,
            gameOver: this.gameOver,
            won: this.won,
            tileIdCounter: this.tileIdCounter
        };
        localStorage.setItem('game2048State', JSON.stringify(state));
    }

    createEmptyGrid() {
        const grid = [];
        for (let i = 0; i < this.gridSize; i++) {
            grid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                grid[i][j] = null;
            }
        }
        return grid;
    }

    addRandomTile() {
        const emptyCells = [];
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === null) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            
            this.grid[randomCell.row][randomCell.col] = {
                value: value,
                id: this.tileIdCounter++,
                isNew: true,
                merged: false
            };
        }
    }

    move(direction) {
        if (this.gameOver) return;
        
        this.saveStateToHistory();
        
        const previousGrid = JSON.stringify(this.grid);
        let moved = false;
        let scoreGained = 0;
        
        this.resetMergeFlags();
        
        if (direction === 'left') {
            for (let i = 0; i < this.gridSize; i++) {
                const result = this.moveRow(this.grid[i]);
                this.grid[i] = result.row;
                scoreGained += result.score;
                if (result.moved) moved = true;
            }
        } else if (direction === 'right') {
            for (let i = 0; i < this.gridSize; i++) {
                const reversed = this.grid[i].slice().reverse();
                const result = this.moveRow(reversed);
                this.grid[i] = result.row.reverse();
                scoreGained += result.score;
                if (result.moved) moved = true;
            }
        } else if (direction === 'up') {
            for (let j = 0; j < this.gridSize; j++) {
                const column = this.getColumn(j);
                const result = this.moveRow(column);
                this.setColumn(j, result.row);
                scoreGained += result.score;
                if (result.moved) moved = true;
            }
        } else if (direction === 'down') {
            for (let j = 0; j < this.gridSize; j++) {
                const column = this.getColumn(j).reverse();
                const result = this.moveRow(column);
                this.setColumn(j, result.row.reverse());
                scoreGained += result.score;
                if (result.moved) moved = true;
            }
        }
        
        if (moved) {
            this.score += scoreGained;
            
            if (!this.won && this.hasWon()) {
                this.won = true;
                setTimeout(() => this.showWinMessage(), 300);
            }
            
            const newTilesCount = Math.random() < 0.9 ? 1 : 2;
            for (let i = 0; i < newTilesCount; i++) {
                this.addRandomTile();
            }
            
            this.updateDisplay();
            this.saveGame();
            this.updateUndoButton();
            
            if (!this.canMove()) {
                this.gameOver = true;
                this.saveGame();
                setTimeout(() => this.showGameOver(), 300);
            }
        } else {
            this.history.pop();
        }
    }

    hasWon() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] && this.grid[i][j].value >= 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    showWinMessage() {
        this.winNotification.classList.remove('hidden');
        this.winNotification.classList.remove('fade-out');
        
        setTimeout(() => {
            this.winNotification.classList.add('fade-out');
            setTimeout(() => {
                this.winNotification.classList.add('hidden');
                this.winNotification.classList.remove('fade-out');
            }, 300);
        }, 2000);
    }

    moveRow(row) {
        let newRow = row.filter(cell => cell !== null);
        let moved = false;
        let score = 0;
        const originalLength = newRow.length;
        
        for (let i = 0; i < newRow.length - 1; i++) {
            if (newRow[i] && newRow[i + 1] && newRow[i].value === newRow[i + 1].value && !newRow[i].merged && !newRow[i + 1].merged) {
                newRow[i] = {
                    value: newRow[i].value * 2,
                    id: this.tileIdCounter++,
                    merged: true,
                    isNew: false
                };
                score += newRow[i].value;
                newRow.splice(i + 1, 1);
                moved = true;
            }
        }
        
        while (newRow.length < this.gridSize) {
            newRow.push(null);
        }
        
        if (!moved && originalLength !== row.filter(cell => cell !== null).length) {
            moved = true;
        }
        
        for (let i = 0; i < this.gridSize; i++) {
            if ((row[i] === null) !== (newRow[i] === null)) {
                moved = true;
                break;
            }
            if (row[i] && newRow[i] && row[i].value !== newRow[i].value) {
                moved = true;
                break;
            }
        }
        
        return { row: newRow, moved, score };
    }

    getColumn(colIndex) {
        const column = [];
        for (let i = 0; i < this.gridSize; i++) {
            column.push(this.grid[i][colIndex]);
        }
        return column;
    }

    setColumn(colIndex, column) {
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i][colIndex] = column[i];
        }
    }

    resetMergeFlags() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j]) {
                    this.grid[i][j].merged = false;
                    this.grid[i][j].isNew = false;
                }
            }
        }
    }

    canMove() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === null) {
                    return true;
                }
            }
        }
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const current = this.grid[i][j];
                
                if (j < this.gridSize - 1) {
                    const right = this.grid[i][j + 1];
                    if (right && current.value === right.value) {
                        return true;
                    }
                }
                
                if (i < this.gridSize - 1) {
                    const down = this.grid[i + 1][j];
                    if (down && current.value === down.value) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    saveStateToHistory() {
        const state = {
            grid: JSON.parse(JSON.stringify(this.grid)),
            score: this.score
        };
        this.history.push(state);
        
        if (this.history.length > 10) {
            this.history.shift();
        }
    }

    undo() {
        if (this.history.length === 0 || this.gameOver) {
            return;
        }
        
        const previousState = this.history.pop();
        this.grid = previousState.grid;
        this.score = previousState.score;
        
        this.updateDisplay();
        this.saveGame();
        this.updateUndoButton();
    }

    updateUndoButton() {
        this.undoBtn.disabled = this.history.length === 0 || this.gameOver;
    }

    updateDisplay() {
        this.scoreElement.textContent = this.score;
        
        this.renderTiles();
    }

    renderTiles() {
        while (this.tilesContainer.firstChild) {
            this.tilesContainer.removeChild(this.tilesContainer.firstChild);
        }
        
        const containerRect = this.gridContainer.getBoundingClientRect();
        const cellSize = (containerRect.width - (15 * (this.gridSize + 1))) / this.gridSize;
        const gap = 15;
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const tile = this.grid[i][j];
                
                if (tile) {
                    const tileElement = document.createElement('div');
                    tileElement.className = `tile tile-${tile.value}`;
                    
                    if (tile.isNew) {
                        tileElement.classList.add('new');
                    }
                    
                    if (tile.merged) {
                        tileElement.classList.add('merged');
                    }
                    
                    tileElement.textContent = tile.value;
                    
                    const left = gap + j * (cellSize + gap);
                    const top = gap + i * (cellSize + gap);
                    
                    tileElement.style.setProperty('--tile-size', `${cellSize}px`);
                    tileElement.style.setProperty('--tile-left', `${left}px`);
                    tileElement.style.setProperty('--tile-top', `${top}px`);
                    
                    this.tilesContainer.appendChild(tileElement);
                }
            }
        }
    }

    showGameOver() {
        this.finalScoreElement.textContent = this.score;
        this.gameOverTitle.textContent = 'Игра окончена!';
        this.saveScoreForm.classList.remove('hidden');
        this.scoreSavedMessage.classList.add('hidden');
        this.nameErrorMessage.classList.add('hidden');
        this.playerNameInput.value = '';
        this.gameOverModal.classList.add('active');
        this.hideMobileControls();
    }

    hideGameOver() {
        this.gameOverModal.classList.remove('active');
        this.showMobileControls();
    }

    restartFromGameOver() {
        this.hideGameOver();
        this.newGame();
    }

    saveScore() {
        const playerName = this.playerNameInput.value.trim();
        
        if (!playerName) {
            this.nameErrorMessage.classList.remove('hidden');
            return;
        }
        
        this.nameErrorMessage.classList.add('hidden');
        
        const leaderboard = this.getLeaderboard();
        
        const entry = {
            name: playerName,
            score: this.score,
            date: new Date().toISOString()
        };
        
        leaderboard.push(entry);
        leaderboard.sort((a, b) => b.score - a.score);
        
        const top10 = leaderboard.slice(0, 10);
        
        localStorage.setItem('game2048Leaderboard', JSON.stringify(top10));
        
        this.saveScoreForm.classList.add('hidden');
        this.scoreSavedMessage.classList.remove('hidden');
    }

    getLeaderboard() {
        const saved = localStorage.getItem('game2048Leaderboard');
        return saved ? JSON.parse(saved) : [];
    }

    showLeaderboard() {
        const leaderboard = this.getLeaderboard();
        const tbody = document.getElementById('leaderboard-body');
        const emptyMessage = document.getElementById('empty-leaderboard');
        
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }
        
        if (leaderboard.length === 0) {
            emptyMessage.classList.remove('hidden');
            document.getElementById('leaderboard-table').classList.add('hidden');
        } else {
            emptyMessage.classList.add('hidden');
            document.getElementById('leaderboard-table').classList.remove('hidden');
            
            leaderboard.forEach((entry, index) => {
                const row = document.createElement('tr');
                
                const date = new Date(entry.date);
                const formattedDate = date.toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                
                const rankCell = document.createElement('td');
                rankCell.textContent = index + 1;
                row.appendChild(rankCell);
                
                const nameCell = document.createElement('td');
                nameCell.textContent = entry.name;
                row.appendChild(nameCell);
                
                const scoreCell = document.createElement('td');
                scoreCell.textContent = entry.score;
                row.appendChild(scoreCell);
                
                const dateCell = document.createElement('td');
                dateCell.textContent = formattedDate;
                row.appendChild(dateCell);
                
                tbody.appendChild(row);
            });
        }
        
        this.leaderboardModal.classList.add('active');
        this.hideMobileControls();
    }

    hideLeaderboard() {
        this.leaderboardModal.classList.remove('active');
        if (!this.gameOver) {
            this.showMobileControls();
        }
    }

    hideMobileControls() {
        this.mobileControls.classList.remove('visible');
    }

    showMobileControls() {
        if (window.innerWidth <= 768) {
            this.mobileControls.classList.add('visible');
        }
    }

    showError(message) {
        this.errorMessageText.textContent = message;
        this.errorModal.classList.add('active');
        this.hideMobileControls();
    }

    hideError() {
        this.errorModal.classList.remove('active');
        if (!this.gameOver) {
            this.showMobileControls();
        }
    }

    initTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        const gameContainer = document.getElementById('game-container');
        const minSwipeDistance = 30;
        
        gameContainer.addEventListener('touchstart', (e) => {
            if (this.gameOver) return;
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        gameContainer.addEventListener('touchend', (e) => {
            if (this.gameOver) return;
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY, minSwipeDistance);
        }, { passive: true });
    }

    handleSwipe(startX, startY, endX, endY, minDistance) {
        const diffX = endX - startX;
        const diffY = endY - startY;
        const absDiffX = Math.abs(diffX);
        const absDiffY = Math.abs(diffY);
        
        if (Math.max(absDiffX, absDiffY) < minDistance) {
            return;
        }
        
        if (absDiffX > absDiffY) {
            if (diffX > 0) {
                this.move('right');
            } else {
                this.move('left');
            }
        } else {
            if (diffY > 0) {
                this.move('down');
            } else {
                this.move('up');
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game2048();
    
    window.addEventListener('resize', () => {
        game.renderTiles();
        
        if (window.innerWidth <= 768 && !game.gameOver) {
            game.showMobileControls();
        } else if (window.innerWidth > 768) {
            game.hideMobileControls();
        }
    });
});


