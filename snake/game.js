// 스네이크 게임 JavaScript 구현

const snakeTranslations = {
    ko: {
        gameTitle: "🐍 스네이크 게임 🐍",
        gameSubtitle: "먹이를 먹고 뱀을 키우세요",
        backToGameCenter: "← 게임센터",
        controlsLabel: "조작법:",
        controlsText: "방향키로 이동 | 스페이스바 일시정지 | R키 재시작",
        mobileHint: "모바일: 화면 버튼으로 방향 조작",
        startTitle: "🐍 스네이크 🐍",
        startDescription: "먹이를 먹을수록 뱀이 길어져요!",
        startInstructions: "벽이나 자신의 몸에 부딪히지 마세요.",
        gameStartButton: "게임 시작",
        gameOverTitle: "게임 종료",
        finalScore: "최종 점수",
        bestScore: "최고 점수",
        length: "뱀 길이",
        restartButton: "다시 시작",
        backToMenu: "메뉴로",
        paused: "일시정지",
        pressSpaceToResume: "스페이스바를 눌러 계속하기",
        resumeButton: "계속하기",
        scoreLabel: "점수",
        highScoreLabel: "최고",
        levelLabel: "단계",
        levelReached: "도달 단계",
        foodLegendTitle: "볼 종류",
        foodNormal: "일반: 점수+10, 길이+1",
        foodSpeed: "속도: 점수+15, 속도 업",
        foodBonus: "보너스: 점수+30, 길이+2",
        foodSlow: "감속: 점수+20, 잠시 느려짐",
        foodDouble: "더블: 점수+25, 길이+2",
        foodMinus1: "꼬리-1: 점수+8",
        foodShrink: "꼬리-2: 점수+15",
        foodMinus3: "꼬리-3: 점수+25",
        levelUpTitle: "단계",
        levelUpExclaim: "!"
    },
    en: {
        gameTitle: "🐍 Snake Game 🐍",
        gameSubtitle: "Eat food and grow your snake",
        backToGameCenter: "← Game Center",
        controlsLabel: "Controls:",
        controlsText: "Arrow keys to move | Space to pause | R to restart",
        mobileHint: "Mobile: Use buttons to change direction",
        startTitle: "🐍 Snake 🐍",
        startDescription: "The more you eat, the longer you get!",
        startInstructions: "Don't hit the walls or your own body.",
        gameStartButton: "Start Game",
        gameOverTitle: "Game Over",
        finalScore: "Final Score",
        bestScore: "Best Score",
        length: "Length",
        restartButton: "Restart",
        backToMenu: "Back to Menu",
        paused: "Paused",
        pressSpaceToResume: "Press Space to resume",
        resumeButton: "Resume",
        scoreLabel: "Score",
        highScoreLabel: "Best",
        levelLabel: "Level",
        levelReached: "Level Reached",
        foodLegendTitle: "Ball types",
        foodNormal: "Normal: +10 pts, +1 length",
        foodSpeed: "Speed: +15 pts, faster",
        foodBonus: "Bonus: +30 pts, +2 length",
        foodSlow: "Slow: +20 pts, temporary slow",
        foodDouble: "Double: +25 pts, +2 length",
        foodMinus1: "Tail -1: +8 pts",
        foodShrink: "Tail -2: +15 pts",
        foodMinus3: "Tail -3: +25 pts",
        levelUpTitle: "Stage",
        levelUpExclaim: "!"
    }
};

function getSnakeLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    if (langFromUrl && snakeTranslations[langFromUrl]) return langFromUrl;
    return localStorage.getItem('language') || (navigator.language.startsWith('ko') ? 'ko' : 'en');
}

let currentSnakeLanguage = getSnakeLanguage();

function pt(key) {
    return snakeTranslations[currentSnakeLanguage]?.[key] || key;
}

function updateSnakeLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) el.textContent = pt(key);
    });
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) backBtn.setAttribute('aria-label', currentSnakeLanguage === 'ko' ? '메인으로' : 'Back to main');
    const canvas = document.getElementById('gameCanvas');
    if (canvas) canvas.setAttribute('aria-label', currentSnakeLanguage === 'ko' ? '스네이크 게임' : 'Snake game');
    document.title = currentSnakeLanguage === 'ko' ? '스네이크 게임 | Oraksil' : 'Snake Game | Oraksil';
}

// 게임 상수
const GRID_COLS = 24;
const GRID_ROWS = 24;
const CELL_SIZE = 20;
const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;

const INITIAL_SPEED_MS = 240;
const MIN_SPEED_MS = 50;
const LEVEL_SPEED_BONUS = 6;   // 단계당 속도 증가 (ms 감소)
const FOOD_PER_LEVEL = 5;      // 이만큼 먹으면 단계 업

// 먹이 종류: score, grow, slowDebuff, shrink, label(볼에 표기할 텍스트·특징에 맞춤), color/border. 속도는 단계 업 시에만 변경.
const FOOD_TYPES = {
    normal:  { score: 10,  grow: 1, slowDebuff: 0, shrink: 0, label: '+1',  color: '#e85959', border: '#f07373', glow: false },
    speed:   { score: 15,  grow: 1, slowDebuff: 0, shrink: 0, label: '↑',   color: '#40c057', border: '#51cf66', glow: true },
    bonus:   { score: 30,  grow: 2, slowDebuff: 0, shrink: 0, label: '+2',  color: '#37b24d', border: '#40c057', glow: true },
    slow:    { score: 20,  grow: 1, slowDebuff: 5, shrink: 0, label: '↓',   color: '#fd7e14', border: '#ff922b', glow: true },
    double:  { score: 25,  grow: 2, slowDebuff: 0, shrink: 0, label: '+2',  color: '#2f9e44', border: '#37b24d', glow: true },
    minus1:  { score: 8,   grow: 0, slowDebuff: 0, shrink: 1, label: '-1',  color: '#74c0fc', border: '#91d5ff', glow: true },
    shrink:  { score: 15,  grow: 0, slowDebuff: 0, shrink: 2, label: '-2',  color: '#339af0', border: '#4dabf7', glow: true },
    minus3:  { score: 25,  grow: 0, slowDebuff: 0, shrink: 3, label: '-3',  color: '#1c7ed6', border: '#228be6', glow: true }
};
const SPECIAL_TYPES = ['speed', 'bonus', 'slow', 'double', 'minus1', 'shrink', 'minus3'];
const LEVEL_UP_POPUP_MS = 1800;

class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.snake = [];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.food = null;
        this.score = 0;
        this.level = 1;
        this.foodEaten = 0;
        this.slowDebuffRemaining = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
        this.speedMs = INITIAL_SPEED_MS;
        this.moveTimer = null;
        this.state = 'start'; // start | playing | paused | gameover

        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.scoreEl = document.getElementById('scoreValue');
        this.highScoreEl = document.getElementById('highScoreValue');
        this.levelEl = document.getElementById('levelValue');
        this.finalScoreEl = document.getElementById('finalScore');
        this.bestScoreEl = document.getElementById('bestScore');
        this.lengthEl = document.getElementById('lengthValue');
        this.levelReachedEl = document.getElementById('levelReached');

        this.bindKeys();
        this.bindMobileControls();
        this.bindScreenButtons();
        this.updateScoreDisplay();
        this.showScreen('startScreen');
        this.render();
    }

    bindScreenButtons() {
        // Start button: delegate so click on button or its text content works
        const startBtn = document.getElementById('startGameBtn');
        const startScreen = this.startScreen;
        if (startScreen && startBtn) {
            startScreen.addEventListener('click', (e) => {
                if (startBtn === e.target || startBtn.contains(e.target)) {
                    e.preventDefault();
                    this.start();
                }
            });
        }

        const restartBtn = document.querySelector('#gameOverScreen .game-button');
        const gameOverMenuBtn = document.querySelector('#gameOverScreen .game-button.secondary');
        if (restartBtn) restartBtn.addEventListener('click', () => this.restart());
        if (gameOverMenuBtn) gameOverMenuBtn.addEventListener('click', () => this.backToStart());

        const resumeBtn = document.querySelector('#pauseScreen .game-button');
        const pauseMenuBtn = document.querySelector('#pauseScreen .game-button.secondary');
        if (resumeBtn) resumeBtn.addEventListener('click', () => this.resume());
        if (pauseMenuBtn) pauseMenuBtn.addEventListener('click', () => this.backToStart());
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (this.state === 'start') return;
            if (e.key === ' ') {
                e.preventDefault();
                if (this.state === 'playing') this.pause();
                else if (this.state === 'paused') this.resume();
                return;
            }
            if (e.key === 'r' || e.key === 'R') {
                if (this.state === 'playing' || this.state === 'paused' || this.state === 'gameover') {
                    this.restart();
                }
                return;
            }
            const keyToDir = {
                ArrowUp: 'up',
                ArrowDown: 'down',
                ArrowLeft: 'left',
                ArrowRight: 'right'
            };
            const dir = keyToDir[e.key];
            if (!dir) return;
            e.preventDefault();
            const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
            if (this.direction !== opposite[dir]) this.nextDirection = dir;
        });
    }

    bindMobileControls() {
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.getAttribute('data-key');
                const keyToDir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
                const dir = keyToDir[key];
                if (dir) {
                    const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
                    if (this.direction !== opposite[dir]) this.nextDirection = dir;
                }
            });
        });
    }

    showScreen(id) {
        [this.startScreen, this.gameOverScreen, this.pauseScreen].forEach(el => {
            if (el) el.classList.remove('show');
        });
        if (id) {
            const el = document.getElementById(id);
            if (el) el.classList.add('show');
        }
    }

    initSnake() {
        const cx = Math.floor(GRID_COLS / 2);
        const cy = Math.floor(GRID_ROWS / 2);
        this.snake = [
            { x: cx - 2, y: cy },
            { x: cx - 1, y: cy },
            { x: cx, y: cy }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
    }

    spawnFood() {
        const cells = [];
        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                if (!this.snake.some(s => s.x === x && s.y === y)) cells.push({ x, y });
            }
        }
        if (cells.length === 0) return;
        const cell = cells[Math.floor(Math.random() * cells.length)];
        const type = this.rollFoodType();
        this.food = { x: cell.x, y: cell.y, type };
    }

    rollFoodType() {
        const specialChance = Math.min(0.1 + (this.level - 1) * 0.08, 0.5);
        if (Math.random() < specialChance) {
            return SPECIAL_TYPES[Math.floor(Math.random() * SPECIAL_TYPES.length)];
        }
        return 'normal';
    }

    getBaseSpeedMs() {
        return Math.max(MIN_SPEED_MS, INITIAL_SPEED_MS - (this.level - 1) * LEVEL_SPEED_BONUS);
    }

    start() {
        this.state = 'playing';
        this.score = 0;
        this.level = 1;
        this.foodEaten = 0;
        this.slowDebuffRemaining = 0;
        this.speedMs = this.getBaseSpeedMs();
        this.initSnake();
        this.spawnFood();
        this.showScreen(null);
        this.updateScoreDisplay();
        this.scheduleMove();
        this.render();
    }

    scheduleMove() {
        if (this.moveTimer) clearTimeout(this.moveTimer);
        if (this.state !== 'playing') return;
        const slowPenalty = this.slowDebuffRemaining > 0 ? 22 : 0;
        this.moveTimer = setTimeout(() => {
            const skipNextSchedule = this.move();
            if (!skipNextSchedule) return;
            this.scheduleMove();
        }, this.speedMs + slowPenalty);
    }

    showLevelUpPopup(level) {
        const overlay = document.getElementById('levelUpOverlay');
        const labelEl = document.getElementById('levelUpLabel');
        const numberEl = document.getElementById('levelUpNumber');
        const exclaimEl = document.getElementById('levelUpExclaim');
        if (!overlay || !numberEl) return;
        if (labelEl) labelEl.textContent = pt('levelUpTitle') + ' ';
        numberEl.textContent = level;
        if (exclaimEl) exclaimEl.textContent = pt('levelUpExclaim');
        overlay.classList.add('show');
        setTimeout(() => {
            overlay.classList.remove('show');
            this.scheduleMove();
        }, LEVEL_UP_POPUP_MS);
    }

    move() {
        this.direction = this.nextDirection;
        const head = { ...this.snake[this.snake.length - 1] };
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        if (head.x < 0 || head.x >= GRID_COLS || head.y < 0 || head.y >= GRID_ROWS) {
            this.gameOver();
            return;
        }
        if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.push(head);
        if (this.food && head.x === this.food.x && head.y === this.food.y) {
            const info = FOOD_TYPES[this.food.type] || FOOD_TYPES.normal;
            this.score += info.score;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snakeHighScore', String(this.highScore));
            }
            for (let g = 1; g < info.grow; g++) this.snake.push({ ...this.snake[this.snake.length - 1] });
            if (info.slowDebuff > 0) this.slowDebuffRemaining = info.slowDebuff;
            if (info.shrink > 0 && this.snake.length > 3) {
                for (let s = 0; s < info.shrink && this.snake.length > 3; s++) this.snake.shift();
            }
            this.foodEaten++;
            const newLevel = Math.floor(this.foodEaten / FOOD_PER_LEVEL) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.speedMs = Math.max(MIN_SPEED_MS, this.getBaseSpeedMs());
                this.spawnFood();
                this.updateScoreDisplay();
                this.render();
                this.showLevelUpPopup(this.level);
                return false;
            }
            this.spawnFood();
            this.updateScoreDisplay();
        } else {
            this.snake.shift();
        }
        if (this.slowDebuffRemaining > 0) this.slowDebuffRemaining--;
        this.render();
        return true;
    }

    updateScoreDisplay() {
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        if (this.highScoreEl) this.highScoreEl.textContent = this.highScore;
        if (this.levelEl) this.levelEl.textContent = this.level;
        if (this.lengthEl) this.lengthEl.textContent = this.snake.length;
    }

    gameOver() {
        this.state = 'gameover';
        if (this.moveTimer) clearTimeout(this.moveTimer);
        this.moveTimer = null;
        if (this.finalScoreEl) this.finalScoreEl.textContent = this.score;
        if (this.bestScoreEl) this.bestScoreEl.textContent = this.highScore;
        if (this.lengthEl) this.lengthEl.textContent = this.snake.length;
        if (this.levelReachedEl) this.levelReachedEl.textContent = this.level;
        this.showScreen('gameOverScreen');
    }

    pause() {
        this.state = 'paused';
        if (this.moveTimer) clearTimeout(this.moveTimer);
        this.moveTimer = null;
        this.showScreen('pauseScreen');
    }

    resume() {
        this.state = 'playing';
        this.showScreen(null);
        this.scheduleMove();
    }

    restart() {
        this.start();
    }

    backToStart() {
        this.state = 'start';
        if (this.moveTimer) clearTimeout(this.moveTimer);
        this.moveTimer = null;
        this.showScreen('startScreen');
        this.snake = [];
        this.food = null;
        this.render();
    }

    render() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0d1b2a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 그리드 (연한 선)
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= GRID_COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE, 0);
            ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y <= GRID_ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * CELL_SIZE);
            ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
            ctx.stroke();
        }

        // 먹이 (종류별 색·테두리·글로우 + 길이 변화 표기)
        if (this.food) {
            const info = FOOD_TYPES[this.food.type] || FOOD_TYPES.normal;
            const fx = this.food.x * CELL_SIZE + CELL_SIZE / 2;
            const fy = this.food.y * CELL_SIZE + CELL_SIZE / 2;
            const r = CELL_SIZE / 2 - 2;
            if (info.glow) {
                ctx.shadowColor = info.border;
                ctx.shadowBlur = 10;
            }
            ctx.fillStyle = info.color;
            ctx.beginPath();
            ctx.arc(fx, fy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = info.border;
            ctx.lineWidth = 2;
            ctx.stroke();
            const ballLabel = info.label != null ? String(info.label) : '';
            ctx.font = ballLabel.length <= 2 ? 'bold 12px Arial' : 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = 2;
            ctx.strokeText(ballLabel, fx, fy);
            ctx.fillText(ballLabel, fx, fy);
        }

        // 뱀 (머리·몸·꼬리 구분, 방향에 맞는 디자인)
        const dir = this.direction;
        const rad = CELL_SIZE / 2 - 1;

        this.snake.forEach((seg, i) => {
            const isHead = i === this.snake.length - 1;
            const isTail = i === 0;
            const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
            const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;

            if (isHead) {
                drawSnakeHead(ctx, cx, cy, rad, dir);
            } else if (isTail) {
                drawSnakeTail(ctx, cx, cy, rad, seg, this.snake[1]);
            } else {
                drawSnakeBody(ctx, cx, cy, rad, seg, this.snake[i - 1], this.snake[i + 1]);
            }
        });
    }
}

function drawSnakeHead(ctx, cx, cy, r, dir) {
    ctx.save();
    ctx.translate(cx, cy);
    const angle = { up: -0.5 * Math.PI, down: 0.5 * Math.PI, left: Math.PI, right: 0 }[dir] || 0;
    ctx.rotate(angle);

    // 머리 (둥근 타원)
    ctx.fillStyle = '#5cb85c';
    ctx.strokeStyle = '#3d8b3d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.05, r * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 입 (앞쪽)
    ctx.strokeStyle = '#2d5a2d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(r * 0.4, 0);
    ctx.lineTo(r * 0.95, -r * 0.25);
    ctx.moveTo(r * 0.4, 0);
    ctx.lineTo(r * 0.95, r * 0.25);
    ctx.stroke();

    // 눈 흰자
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-r * 0.25, -r * 0.35, r * 0.28, r * 0.22, 0, 0, Math.PI * 2);
    ctx.ellipse(-r * 0.25, r * 0.35, r * 0.28, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    // 눈동자
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(-r * 0.22, -r * 0.35, r * 0.12, r * 0.14, 0, 0, Math.PI * 2);
    ctx.ellipse(-r * 0.22, r * 0.35, r * 0.12, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    // 눈 하이라이트
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(-r * 0.26, -r * 0.38, 2, 0, Math.PI * 2);
    ctx.arc(-r * 0.26, r * 0.32, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawSnakeBody(ctx, cx, cy, r, seg, prev, next) {
    ctx.save();
    ctx.translate(cx, cy);

    // 몸통 그라데이션 (뱀 비늘 느낌)
    const gradient = ctx.createLinearGradient(-r, 0, r, 0);
    gradient.addColorStop(0, '#4a9c4a');
    gradient.addColorStop(0.5, '#6bb86b');
    gradient.addColorStop(1, '#4a9c4a');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#3d8b3d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.92, r * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 비늘 하이라이트 (작은 곡선)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -r * 0.2, r * 0.35, 0, Math.PI);
    ctx.stroke();

    ctx.restore();
}

function drawSnakeTail(ctx, cx, cy, r, tail, next) {
    ctx.save();
    ctx.translate(cx, cy);

    const dx = next.x - tail.x;
    const dy = next.y - tail.y;
    const angle = Math.atan2(dy, dx);

    ctx.rotate(angle);

    // 꼬리 (앞으로 갈수록 가늘어지는 타원)
    const gradient = ctx.createLinearGradient(-r, 0, r, 0);
    gradient.addColorStop(0, '#4a9c4a');
    gradient.addColorStop(0.6, '#5cb85c');
    gradient.addColorStop(1, '#3d8b3d');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#3d8b3d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.88, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

let game;
function initSnakeGame() {
    try {
        updateSnakeLanguage();
        game = new SnakeGame();
        window.snakeGame = game;
    } catch (err) {
        window.snakeGameError = err.message || String(err);
    }
}
if (document.readyState === 'complete') {
    initSnakeGame();
} else {
    window.addEventListener('load', initSnakeGame);
}
