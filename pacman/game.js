// 팩맨 게임 JavaScript 구현

// Internationalization (i18n) for Pacman game
const pacmanTranslations = {
    ko: {
        // Header
        gameTitle: "👻 팩맨 게임 👻",
        gameSubtitle: "클래식 미로 탐험 게임",
        backToGameCenter: "← 게임센터",
        
        // Controls
        controlsLabel: "조작법:",
        controlsText: "방향키로 이동 | 스페이스바로 일시정지 | R키로 재시작",
        mobileHint: "모바일: 화면 터치로 조작",
        
        // Game screens
        startTitle: "👻 팩맨 게임 👻",
        startDescription: "미로를 탐험하며 모든 점을 먹어보세요!",
        startInstructions: "방향키로 이동, 유령을 피하세요",
        gameStartButton: "게임 시작",
        
        // Game over screen
        gameOverTitle: "게임 종료",
        finalScore: "최종 점수",
        levelReached: "도달 레벨",
        dotsEaten: "먹은 점",
        ghostsEaten: "먹은 유령",
        restartButton: "다시 시작",
        backToMenu: "메뉴로",
        
        // Level complete screen
        levelCompleteTitle: "레벨 완료!",
        levelCompleteText: "축하합니다! 다음 레벨로 진행합니다.",
        currentScore: "현재 점수",
        nextLevel: "다음 레벨",
        continueButton: "계속하기",
        
        // Pause screen
        paused: "일시정지",
        pressSpaceToResume: "스페이스바를 눌러 계속하기",
        resumeButton: "계속하기",
        
        // In-game UI
        scoreLabel: "점수",
        levelLabel: "레벨",
        livesLabel: "생명"
    },
    en: {
        // Header
        gameTitle: "👻 Pacman Game 👻",
        gameSubtitle: "Classic Maze Adventure Game",
        backToGameCenter: "← Game Center",
        
        // Controls
        controlsLabel: "Controls:",
        controlsText: "Arrow keys to move | Spacebar to pause | R key to restart",
        mobileHint: "Mobile: Touch to control",
        
        // Game screens
        startTitle: "👻 Pacman Game 👻",
        startDescription: "Explore the maze and eat all the dots!",
        startInstructions: "Use arrow keys to move, avoid the ghosts",
        gameStartButton: "Start Game",
        
        // Game over screen
        gameOverTitle: "Game Over",
        finalScore: "Final Score",
        levelReached: "Level Reached",
        dotsEaten: "Dots Eaten",
        ghostsEaten: "Ghosts Eaten",
        restartButton: "Restart",
        backToMenu: "Back to Menu",
        
        // Level complete screen
        levelCompleteTitle: "Level Complete!",
        levelCompleteText: "Congratulations! Proceeding to next level.",
        currentScore: "Current Score",
        nextLevel: "Next Level",
        continueButton: "Continue",
        
        // Pause screen
        paused: "Paused",
        pressSpaceToResume: "Press Space to Resume",
        resumeButton: "Resume",
        
        // In-game UI
        scoreLabel: "Score",
        levelLabel: "Level",
        livesLabel: "Lives"
    }
};

// Get language from URL parameter or localStorage
function getPacmanLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    if (langFromUrl && pacmanTranslations[langFromUrl]) {
        return langFromUrl;
    }
    return localStorage.getItem('language') || 
           (navigator.language.startsWith('ko') ? 'ko' : 'en');
}

// Current language for Pacman game
let currentPacmanLanguage = getPacmanLanguage();

// Translation function for Pacman
function pt(key) {
    return pacmanTranslations[currentPacmanLanguage]?.[key] || key;
}

// Update Pacman game language
function updatePacmanLanguage() {
    // Update HTML elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = pt(key);
    });
    
    // Update aria-labels
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.setAttribute('aria-label', 
            currentPacmanLanguage === 'ko' ? '메인 페이지로 돌아가기' : 'Back to main page');
    }
    
    // Update canvas aria-label
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.setAttribute('aria-label', 
            currentPacmanLanguage === 'ko' ? '팩맨 게임 캔버스' : 'Pacman game canvas');
    }
    
    // Update document title
    document.title = currentPacmanLanguage === 'ko' 
        ? '팩맨 게임 - 온라인 무료 미로 게임 | Oraksil'
        : 'Pacman Game - Free Online Maze Game | Oraksil';
}

// Game constants
const CELL_SIZE = 30;
const MAZE_WIDTH = 19;
const MAZE_HEIGHT = 21;
const CANVAS_WIDTH = MAZE_WIDTH * CELL_SIZE;
const CANVAS_HEIGHT = MAZE_HEIGHT * CELL_SIZE;

// Maze layouts (1 = wall, 0 = empty, 2 = dot, 3 = power pellet, 4 = ghost house)
const MAZE_LAYOUTS = [
    // Level 1 - Classic layout
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
        [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
        [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
        [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
        [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
        [0,0,0,1,2,1,0,0,4,4,4,0,0,1,2,1,0,0,0],
        [1,1,1,1,2,1,0,4,4,4,4,4,0,1,2,1,1,1,1],
        [0,0,0,0,2,0,0,4,4,4,4,4,0,0,2,0,0,0,0],
        [1,1,1,1,2,1,0,4,4,4,4,4,0,1,2,1,1,1,1],
        [0,0,0,1,2,1,0,0,4,4,4,0,0,1,2,1,0,0,0],
        [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
        [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
        [1,3,2,1,2,2,2,2,2,2,2,2,2,2,2,1,2,3,1],
        [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
        [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // Level 2 - More open spaces
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,3,1,1,1,2,1,1,1,2,1,1,1,2,1,1,1,3,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,2,1],
        [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
        [1,1,1,2,1,1,1,1,0,1,0,1,1,1,1,2,1,1,1],
        [0,0,0,2,2,2,0,0,0,0,0,0,0,2,2,2,0,0,0],
        [0,0,0,2,1,2,0,0,4,4,4,0,0,2,1,2,0,0,0],
        [1,1,1,2,1,2,0,4,4,4,4,4,0,2,1,2,1,1,1],
        [0,0,0,2,2,2,0,4,4,4,4,4,0,2,2,2,0,0,0],
        [1,1,1,2,1,2,0,4,4,4,4,4,0,2,1,2,1,1,1],
        [0,0,0,2,1,2,0,0,4,4,4,0,0,2,1,2,0,0,0],
        [0,0,0,2,2,2,0,0,0,0,0,0,0,2,2,2,0,0,0],
        [1,1,1,2,1,1,1,1,0,1,0,1,1,1,1,2,1,1,1],
        [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,2,1,1,1,1,1,1,1,2,1,1,1,2,1],
        [1,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,1],
        [1,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,1],
        [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // Level 3 - Complex maze
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
        [1,3,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,3,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,2,1,1,2,1,2,1,1,2,1,1,1,2,1],
        [1,2,2,2,2,2,1,2,2,1,2,2,1,2,2,2,2,2,1],
        [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
        [0,0,0,2,2,1,0,0,0,0,0,0,0,1,2,2,0,0,0],
        [0,0,0,1,2,1,0,0,4,4,4,0,0,1,2,1,0,0,0],
        [1,1,1,1,2,1,0,4,4,4,4,4,0,1,2,1,1,1,1],
        [0,0,0,0,2,0,0,4,4,4,4,4,0,0,2,0,0,0,0],
        [1,1,1,1,2,1,0,4,4,4,4,4,0,1,2,1,1,1,1],
        [0,0,0,1,2,1,0,0,4,4,4,0,0,1,2,1,0,0,0],
        [0,0,0,2,2,1,0,0,0,0,0,0,0,1,2,2,0,0,0],
        [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,1,2,1,1,1,2,1,1,2,1,1,2,1],
        [1,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,1],
        [1,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,1],
        [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
];

// Current maze layout (will be set based on level)
let MAZE_LAYOUT = MAZE_LAYOUTS[0];

// Function to generate random maze
function generateRandomMaze() {
    const maze = [];
    
    // Start with border walls
    for (let y = 0; y < MAZE_HEIGHT; y++) {
        maze[y] = [];
        for (let x = 0; x < MAZE_WIDTH; x++) {
            // Border walls
            if (y === 0 || y === MAZE_HEIGHT - 1 || x === 0 || x === MAZE_WIDTH - 1) {
                maze[y][x] = 1;
            } else {
                maze[y][x] = 2; // Default to dots
            }
        }
    }
    
    // Add ghost house in center
    const centerX = Math.floor(MAZE_WIDTH / 2);
    const centerY = Math.floor(MAZE_HEIGHT / 2);
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const y = centerY + dy;
            const x = centerX + dx;
            if (y >= 0 && y < MAZE_HEIGHT && x >= 0 && x < MAZE_WIDTH) {
                maze[y][x] = 4; // Ghost house
            }
        }
    }
    
    // Add walls around ghost house
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
            const y = centerY + dy;
            const x = centerX + dx;
            if (y >= 0 && y < MAZE_HEIGHT && x >= 0 && x < MAZE_WIDTH) {
                if (Math.abs(dy) === 2 || Math.abs(dx) === 3) {
                    if (maze[y][x] !== 4) {
                        maze[y][x] = (dy === 0 || dx === 0) ? 0 : 1; // Passages or walls
                    }
                }
            }
        }
    }
    
    // Add random wall blocks
    const numWallBlocks = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numWallBlocks; i++) {
        const blockX = 2 + Math.floor(Math.random() * (MAZE_WIDTH - 4));
        const blockY = 2 + Math.floor(Math.random() * (MAZE_HEIGHT - 4));
        const blockWidth = 1 + Math.floor(Math.random() * 3);
        const blockHeight = 1 + Math.floor(Math.random() * 3);
        
        // Skip if too close to center (ghost house)
        if (Math.abs(blockX - centerX) < 5 && Math.abs(blockY - centerY) < 4) {
            continue;
        }
        
        for (let dy = 0; dy < blockHeight; dy++) {
            for (let dx = 0; dx < blockWidth; dx++) {
                const y = blockY + dy;
                const x = blockX + dx;
                if (y > 0 && y < MAZE_HEIGHT - 1 && x > 0 && x < MAZE_WIDTH - 1) {
                    if (maze[y][x] === 2) {
                        maze[y][x] = 1; // Wall
                    }
                }
            }
        }
    }
    
    // Add power pellets in corners
    const corners = [
        [2, 2], [2, MAZE_WIDTH - 3],
        [MAZE_HEIGHT - 3, 2], [MAZE_HEIGHT - 3, MAZE_WIDTH - 3]
    ];
    corners.forEach(([y, x]) => {
        if (maze[y][x] === 2) {
            maze[y][x] = 3; // Power pellet
        }
    });
    
    // Ensure paths are connected (simple flood fill check)
    // If not enough dots, add some passages
    let dotCount = 0;
    for (let y = 0; y < MAZE_HEIGHT; y++) {
        for (let x = 0; x < MAZE_WIDTH; x++) {
            if (maze[y][x] === 2 || maze[y][x] === 3) {
                dotCount++;
            }
        }
    }
    
    // If too few dots, add some passages
    if (dotCount < 100) {
        for (let i = 0; i < 20; i++) {
            const y = 1 + Math.floor(Math.random() * (MAZE_HEIGHT - 2));
            const x = 1 + Math.floor(Math.random() * (MAZE_WIDTH - 2));
            if (maze[y][x] === 1 && Math.abs(x - centerX) > 4 && Math.abs(y - centerY) > 3) {
                maze[y][x] = 2;
            }
        }
    }
    
    return maze;
}

// Game class
class PacmanGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        
        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver', 'levelComplete'
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.totalDots = 0;
        this.dotsEaten = 0;
        this.ghostsEaten = 0;
        
        // Game objects
        this.pacman = null;
        this.ghosts = [];
        this.dots = [];
        this.powerPellets = [];
        this.fruit = null;
        
        // Game timing
        this.lastTime = 0;
        this.powerMode = false;
        this.powerModeTimer = 0;
        this.fruitTimer = 0;
        
        // Input handling
        this.keys = {};
        this.nextDirection = null;
        
        this.init();
    }
    
    init() {
        // Initialize internationalization
        updatePacmanLanguage();
        
        this.setupEventListeners();
        this.setupMobileControls();
        this.initializeGame();
        
        // Show start screen
        document.getElementById('startScreen').style.display = 'block';
        
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.pause();
                } else if (this.gameState === 'paused') {
                    this.resume();
                }
            }
            
            if (e.code === 'KeyR') {
                this.restart();
            }
            
            // Direction keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault(); // Prevent page scrolling
                const newDirection = e.code.replace('Arrow', '').toLowerCase();
                this.nextDirection = newDirection;
                console.log('=== KEY PRESSED ===');
                console.log('Key:', e.code, 'Direction:', newDirection);
                console.log('Game State:', this.gameState);
                console.log('Pacman position:', this.pacman ? `(${this.pacman.x}, ${this.pacman.y})` : 'null');
                console.log('Pacman direction:', this.pacman ? this.pacman.direction : 'null');
                // Start game if on start screen
                if (this.gameState === 'start') {
                    this.start();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        this.resizeCanvas();
    }
    
    setupMobileControls() {
        const mobileControls = document.getElementById('mobile-controls');
        if (!mobileControls) return;

        const controlButtons = mobileControls.querySelectorAll('[data-key]');
        
        controlButtons.forEach(button => {
            const key = button.getAttribute('data-key');
            
            // Touch events
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleMobileInput(key, true);
                button.classList.add('pressed');
                this.addHapticFeedback();
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleMobileInput(key, false);
                button.classList.remove('pressed');
            });
            
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.handleMobileInput(key, false);
                button.classList.remove('pressed');
            });
            
            // Mouse events for desktop testing
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleMobileInput(key, true);
                button.classList.add('pressed');
            });
            
            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.handleMobileInput(key, false);
                button.classList.remove('pressed');
            });
            
            button.addEventListener('mouseleave', (e) => {
                this.handleMobileInput(key, false);
                button.classList.remove('pressed');
            });
        });

        // Prevent context menu and scrolling
        mobileControls.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        mobileControls.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
    }
    
    handleMobileInput(key, isPressed) {
        if (isPressed) {
            this.nextDirection = key.replace('Arrow', '').toLowerCase();
        }
    }
    
    addHapticFeedback() {
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    resizeCanvas() {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            const maxWidth = window.innerWidth - 40;
            const maxHeight = window.innerHeight - 280;
            
            const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
            let newWidth, newHeight;
            
            if (maxWidth / maxHeight > aspectRatio) {
                newHeight = maxHeight;
                newWidth = maxHeight * aspectRatio;
            } else {
                newWidth = maxWidth;
                newHeight = maxWidth / aspectRatio;
            }
            
            this.canvas.style.width = `${newWidth}px`;
            this.canvas.style.height = `${newHeight}px`;
        } else {
            this.canvas.style.width = `${CANVAS_WIDTH}px`;
            this.canvas.style.height = `${CANVAS_HEIGHT}px`;
        }
    }
    
    initializeGame() {
        // Select maze based on level
        if (this.level <= 3) {
            // Use predefined mazes for first 3 levels
            MAZE_LAYOUT = MAZE_LAYOUTS[this.level - 1];
        } else {
            // Generate random maze for level 4+
            MAZE_LAYOUT = generateRandomMaze();
        }
        
        this.createMaze();
        
        // Find a safe starting position (avoid walls and ghost house)
        let startX = 4, startY = 15;
        // Try to find a dot position in the bottom left area
        for (let y = MAZE_HEIGHT - 5; y < MAZE_HEIGHT - 1; y++) {
            for (let x = 1; x < 8; x++) {
                if (MAZE_LAYOUT[y][x] === 2) {
                    startX = x;
                    startY = y;
                    break;
                }
            }
            if (MAZE_LAYOUT[startY][startX] === 2) break;
        }
        
        this.pacman = new Pacman(startX, startY);
        
        // Increase speed based on level (10% increase per level)
        const speedMultiplier = 1 + ((this.level - 1) * 0.1);
        this.pacman.baseSpeed = 2.5; // Base speed
        this.pacman.speed = this.pacman.baseSpeed * speedMultiplier;
        
        this.createGhosts();
        
        // Increase ghost speed based on level
        this.ghosts.forEach(ghost => {
            ghost.baseSpeed = 2.0; // Base speed
            ghost.speed = ghost.baseSpeed * speedMultiplier;
        });
        
        this.totalDots = this.dots.length;
        this.dotsEaten = 0;
        this.ghostsEaten = 0;
        this.powerMode = false;
        this.powerModeTimer = 0;
        this.fruitTimer = 0;
        this.fruit = null;
    }
    
    createMaze() {
        this.dots = [];
        this.powerPellets = [];
        
        for (let y = 0; y < MAZE_LAYOUT.length; y++) {
            for (let x = 0; x < MAZE_LAYOUT[y].length; x++) {
                const cell = MAZE_LAYOUT[y][x];
                if (cell === 2) {
                    this.dots.push({ x, y });
                } else if (cell === 3) {
                    this.powerPellets.push({ x, y });
                }
            }
        }
    }
    
    createGhosts() {
        this.ghosts = [];
        // Ghost house positions
        this.ghosts.push(new Ghost(9, 9, 'blinky', '#ff0000')); // Red
        this.ghosts.push(new Ghost(9, 10, 'pinky', '#ffb8ff')); // Pink
        this.ghosts.push(new Ghost(8, 10, 'inky', '#00ffff')); // Cyan
        this.ghosts.push(new Ghost(10, 10, 'clyde', '#ffb852')); // Orange
    }
    
    start() {
        document.getElementById('startScreen').style.display = 'none';
        this.showCountdown();
    }
    
    showCountdown() {
        this.gameState = 'countdown';
        
        // Create countdown overlay
        const countdownOverlay = document.createElement('div');
        countdownOverlay.id = 'countdownOverlay';
        countdownOverlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid #ffd93d;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            min-width: 300px;
            backdrop-filter: blur(15px);
            z-index: 1000;
        `;
        
        // Stage title
        const stageTitle = document.createElement('h2');
        stageTitle.style.cssText = `
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 20px;
            background: linear-gradient(45deg, #ffd93d, #ff6b6b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        `;
        stageTitle.textContent = `스테이지 ${this.level}`;
        
        // Countdown display
        const countdownDisplay = document.createElement('div');
        countdownDisplay.id = 'countdownDisplay';
        countdownDisplay.style.cssText = `
            font-size: 4rem;
            font-weight: bold;
            color: #ffd93d;
            margin: 20px 0;
            min-height: 5rem;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        countdownOverlay.appendChild(stageTitle);
        countdownOverlay.appendChild(countdownDisplay);
        document.body.appendChild(countdownOverlay);
        
        // Start countdown
        this.startCountdown(3);
    }
    
    startCountdown(count) {
        const countdownDisplay = document.getElementById('countdownDisplay');
        
        if (count > 0) {
            countdownDisplay.textContent = count;
            setTimeout(() => {
                this.startCountdown(count - 1);
            }, 1000);
        } else {
            countdownDisplay.textContent = '시작!';
            setTimeout(() => {
                this.finishCountdown();
            }, 500);
        }
    }
    
    finishCountdown() {
        // Remove countdown overlay
        const countdownOverlay = document.getElementById('countdownOverlay');
        if (countdownOverlay) {
            countdownOverlay.remove();
        }
        
        // Start the game
        this.gameState = 'playing';
        console.log('Game started, gameState:', this.gameState);
        
        // Track game start event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'game_start', {
                'game_name': 'pacman',
                'language': currentPacmanLanguage || 'ko'
            });
        }
    }
    
    restart() {
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('levelComplete').style.display = 'none';
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.initializeGame();
    }
    
    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseScreen').style.display = 'block';
        }
    }
    
    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseScreen').style.display = 'none';
        }
    }
    
    backToStart() {
        this.gameState = 'start';
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('levelComplete').style.display = 'none';
        document.getElementById('pauseScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'block';
    }
    
    nextLevel() {
        document.getElementById('levelComplete').style.display = 'none';
        this.level++;
        this.initializeGame();
        this.showCountdown();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Track game over event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'game_over', {
                'game_name': 'pacman',
                'score': this.score,
                'level': this.level,
                'dots_eaten': this.dotsEaten,
                'ghosts_eaten': this.ghostsEaten,
                'language': currentPacmanLanguage || 'ko'
            });
        }
        
        // Update game over screen
        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        document.getElementById('levelReached').textContent = this.level;
        document.getElementById('dotsEaten').textContent = this.dotsEaten;
        document.getElementById('ghostsEaten').textContent = this.ghostsEaten;
        
        document.getElementById('gameOver').style.display = 'block';
    }
    
    levelComplete() {
        this.gameState = 'levelComplete';
        
        // Update level complete screen
        document.getElementById('currentScore').textContent = this.score.toLocaleString();
        document.getElementById('nextLevel').textContent = this.level + 1;
        
        document.getElementById('levelComplete').style.display = 'block';
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') {
            return;
        }
        
        // Update pacman
        if (this.nextDirection) {
            console.log('=== UPDATE ===');
            console.log('Passing nextDirection to pacman:', this.nextDirection);
            console.log('DeltaTime:', deltaTime);
            console.log('Pacman current direction:', this.pacman.direction);
            console.log('Pacman position:', this.pacman.x, this.pacman.y);
        }
        this.pacman.update(deltaTime, this.nextDirection);
        // Reset nextDirection after passing to pacman
        this.nextDirection = null;
        
        // Update ghosts
        this.ghosts.forEach(ghost => {
            ghost.update(deltaTime, this.pacman, this.powerMode);
        });
        
        // Update power mode timer
        if (this.powerMode) {
            this.powerModeTimer -= deltaTime;
            if (this.powerModeTimer <= 0) {
                this.powerMode = false;
                this.ghosts.forEach(ghost => {
                    ghost.setPowerMode(false);
                });
            }
        }
        
        // Update fruit timer
        if (this.fruitTimer > 0) {
            this.fruitTimer -= deltaTime;
            if (this.fruitTimer <= 0) {
                this.fruit = null;
            }
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Check win condition
        if (this.dots.length === 0 && this.powerPellets.length === 0) {
            this.levelComplete();
        }
        
        // Spawn fruit occasionally
        if (!this.fruit && Math.random() < 0.001) {
            this.spawnFruit();
        }
    }
    
    checkCollisions() {
        // Pacman and dots (check if pacman is close enough to the dot)
        for (let i = this.dots.length - 1; i >= 0; i--) {
            const dot = this.dots[i];
            const distance = Math.sqrt(Math.pow(this.pacman.x - dot.x, 2) + Math.pow(this.pacman.y - dot.y, 2));
            if (distance < 0.3) { // Allow eating dots when within 0.3 cells
                this.dots.splice(i, 1);
                this.score += 10;
                this.dotsEaten++;
                this.playSound('dot');
            }
        }
        
        // Pacman and power pellets
        for (let i = this.powerPellets.length - 1; i >= 0; i--) {
            const pellet = this.powerPellets[i];
            const distance = Math.sqrt(Math.pow(this.pacman.x - pellet.x, 2) + Math.pow(this.pacman.y - pellet.y, 2));
            if (distance < 0.3) { // Allow eating pellets when within 0.3 cells
                this.powerPellets.splice(i, 1);
                this.score += 50;
                this.dotsEaten++;
                this.activatePowerMode();
                this.playSound('power');
            }
        }
        
        // Pacman and fruit
        if (this.fruit) {
            const distance = Math.sqrt(Math.pow(this.pacman.x - this.fruit.x, 2) + Math.pow(this.pacman.y - this.fruit.y, 2));
            if (distance < 0.3) {
            this.score += this.fruit.value;
            this.fruit = null;
            this.playSound('fruit');
            }
        }
        
        // Pacman and ghosts
        for (let i = 0; i < this.ghosts.length; i++) {
            const ghost = this.ghosts[i];
            const distance = Math.sqrt(Math.pow(this.pacman.x - ghost.x, 2) + Math.pow(this.pacman.y - ghost.y, 2));
            if (distance < 0.5) { // Collision when within 0.5 cells
                if (this.powerMode && !ghost.isEaten) {
                    // Eat ghost
                    ghost.setEaten();
                    this.score += 200 * Math.pow(2, this.ghostsEaten);
                    this.ghostsEaten++;
                    this.playSound('ghost');
                } else if (!this.powerMode && !ghost.isEaten) {
                    // Pacman dies
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver();
                        return;
                    } else {
                        this.resetPositions();
                    }
                    this.playSound('death');
                }
            }
        }
    }
    
    activatePowerMode() {
        this.powerMode = true;
        this.powerModeTimer = 6000; // 6 seconds
        this.ghosts.forEach(ghost => {
            ghost.setPowerMode(true);
        });
    }
    
    spawnFruit() {
        const fruits = [
            { symbol: '🍒', value: 100 },
            { symbol: '🍓', value: 300 },
            { symbol: '🍊', value: 500 },
            { symbol: '🍎', value: 700 },
            { symbol: '🍇', value: 1000 },
            { symbol: '🍌', value: 2000 },
            { symbol: '🍑', value: 3000 }
        ];
        
        const fruit = fruits[Math.floor(Math.random() * fruits.length)];
        this.fruit = {
            x: 9,
            y: 10,
            ...fruit
        };
        this.fruitTimer = 10000; // 10 seconds
    }
    
    resetPositions() {
        this.pacman.reset();
        this.ghosts.forEach(ghost => {
            ghost.reset();
        });
        this.powerMode = false;
        this.powerModeTimer = 0;
    }
    
    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            switch(type) {
                case 'dot':
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.1);
                    break;
                case 'power':
                    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.5);
                    break;
                case 'ghost':
                    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.3);
                    break;
                case 'fruit':
                    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.2);
                    break;
                case 'death':
                    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 1);
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 1);
                    break;
            }
        } catch (e) {
            // Sound play failed, ignore
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
        this.drawMaze();
        
        // Draw dots
        this.dots.forEach(dot => {
            this.drawDot(dot.x, dot.y);
        });
        
        // Draw power pellets
        this.powerPellets.forEach(pellet => {
            this.drawPowerPellet(pellet.x, pellet.y);
        });
        
        // Draw fruit
        if (this.fruit) {
            this.drawFruit(this.fruit.x, this.fruit.y, this.fruit.symbol);
        }
        
        // Draw game objects
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.pacman.render(this.ctx);
            this.ghosts.forEach(ghost => {
                ghost.render(this.ctx);
            });
            
            // Draw UI
            this.renderUI();
        }
        
        // Draw start screen overlay if needed
        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    drawMaze() {
        this.ctx.fillStyle = '#0000ff';
        
        for (let y = 0; y < MAZE_LAYOUT.length; y++) {
            for (let x = 0; x < MAZE_LAYOUT[y].length; x++) {
                if (MAZE_LAYOUT[y][x] === 1) {
                    this.ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }
        }
    }
    
    drawDot(x, y) {
        this.ctx.fillStyle = '#ffd93d';
        this.ctx.beginPath();
        this.ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    drawPowerPellet(x, y) {
        this.ctx.fillStyle = '#ffd93d';
        this.ctx.beginPath();
        this.ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            6,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
    
    drawFruit(x, y, symbol) {
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            symbol,
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2
        );
    }
    
    renderUI() {
        this.ctx.save();
        
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = '#ffd93d';
        this.ctx.textAlign = 'left';
        
        // Score
        this.ctx.fillText(`${pt('scoreLabel')}: ${this.score.toLocaleString()}`, 10, 20);
        
        // Level
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${pt('levelLabel')}: ${this.level}`, this.canvas.width / 2, 20);
        
        // Lives
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${pt('livesLabel')}: ${this.lives}`, this.canvas.width - 10, 20);
        
        this.ctx.restore();
    }
    
    gameLoop(currentTime = 0) {
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Prevent large deltaTime on first frame or after pause
        if (deltaTime > 100 || deltaTime <= 0) {
            deltaTime = 16; // 60fps default
        }
        
        // Limit deltaTime to reasonable bounds (between 8ms and 33ms)
        // This ensures consistent movement regardless of frame rate
        deltaTime = Math.max(8, Math.min(deltaTime, 33));
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Pacman class
class Pacman {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.direction = null; // No initial direction, wait for user input
        this.nextDirection = null;
        this.speed = 2.5; // cells per second (초당 2.5칸 이동)
        this.animationFrame = 0;
        this.mouthOpen = true;
        
        // Ensure pacman starts at grid center
        this.snapToGrid();
    }
    
    update(deltaTime, nextDirection) {
        // Update next direction if provided
        if (nextDirection) {
            this.nextDirection = nextDirection;
            console.log('Pacman direction changed to:', nextDirection);
        }
        
        // If no current direction, set it from nextDirection
        if (!this.direction && this.nextDirection) {
            this.direction = this.nextDirection;
            this.nextDirection = null;
            console.log('Initial direction set to:', this.direction);
        }
        
        // Try to change direction if possible
        if (this.nextDirection && this.canMove(this.nextDirection)) {
            // Allow direction change if at grid center, current direction is blocked,
            // OR the player is requesting a direct reversal (left<->right, up<->down)
            if (this.isAtGridCenter() || !this.canMove(this.direction) || this.isOpposite(this.direction, this.nextDirection)) {
                this.direction = this.nextDirection;
                this.nextDirection = null; // Clear after successful direction change
            }
        }
        
        // Move in current direction (only if direction is set)
        if (this.direction && this.canMove(this.direction)) {
            // Convert speed from cells/second to cells/frame
            // deltaTime is in milliseconds, so divide by 1000 to get seconds
            // Use parseFloat to ensure precision is maintained
            const moveDistance = parseFloat((this.speed * (deltaTime / 1000)).toFixed(4));
            console.log('Moving:', moveDistance, 'cells, deltaTime:', deltaTime);

            // Axis-lock to nearest grid line to avoid drift preventing entry
            if (this.direction === 'left' || this.direction === 'right') {
                const alignedY = Math.round(this.y);
                if (Math.abs(this.y - alignedY) < 0.2) {
                    this.y = alignedY;
                }
            } else if (this.direction === 'up' || this.direction === 'down') {
                const alignedX = Math.round(this.x);
                if (Math.abs(this.x - alignedX) < 0.2) {
                    this.x = alignedX;
                }
            }

            switch (this.direction) {
                case 'up':
                    this.y -= moveDistance;
                    this.y = parseFloat(this.y.toFixed(4)); // Maintain 4 decimal precision
                    break;
                case 'down':
                    this.y += moveDistance;
                    this.y = parseFloat(this.y.toFixed(4)); // Maintain 4 decimal precision
                    break;
                case 'left':
                    this.x -= moveDistance;
                    this.x = parseFloat(this.x.toFixed(4)); // Maintain 4 decimal precision
                    break;
                case 'right':
                    this.x += moveDistance;
                    this.x = parseFloat(this.x.toFixed(4)); // Maintain 4 decimal precision
                    break;
            }
            
            // Only snap when VERY close to grid center (within 0.01)
            const cellX = Math.round(this.x);
            const cellY = Math.round(this.y);
            if (Math.abs(this.x - cellX) < 0.01) {
                this.x = cellX;
            }
            if (Math.abs(this.y - cellY) < 0.01) {
                this.y = cellY;
            }
            
            // Log current position
            console.log(`Pacman position: (${this.x.toFixed(4)}, ${this.y.toFixed(4)}) | Grid: (${Math.floor(this.x)}, ${Math.floor(this.y)}) | Direction: ${this.direction}`);
        }
        
        // Update animation
        this.animationFrame += deltaTime * 0.01;
        this.mouthOpen = Math.sin(this.animationFrame) > 0;
    }
    
    isOpposite(dirA, dirB) {
        if (!dirA || !dirB) return false;
        return (
            (dirA === 'left' && dirB === 'right') ||
            (dirA === 'right' && dirB === 'left') ||
            (dirA === 'up' && dirB === 'down') ||
            (dirA === 'down' && dirB === 'up')
        );
    }

    canMove(direction) {
        // Determine which cell we're trying to move into based on current position and direction
        let targetCellX, targetCellY;
        
        switch (direction) {
            case 'up':
                targetCellX = Math.floor(this.x);
                targetCellY = Math.floor(this.y - 0.1); // Check cell above
                break;
            case 'down':
                targetCellX = Math.floor(this.x);
                targetCellY = Math.floor(this.y + 1); // Check cell below
                break;
            case 'left':
                targetCellX = Math.floor(this.x - 0.1); // Check cell to the left
                targetCellY = Math.floor(this.y);
                break;
            case 'right':
                targetCellX = Math.floor(this.x + 1); // Check cell to the right
                targetCellY = Math.floor(this.y);
                break;
        }
        
        // Check bounds
        if (targetCellX < 0 || targetCellX >= MAZE_WIDTH || targetCellY < 0 || targetCellY >= MAZE_HEIGHT) {
            console.log(`CanMove: Out of bounds - direction=${direction}, from(${this.x.toFixed(2)},${this.y.toFixed(2)}), targetCell(${targetCellX},${targetCellY})`);
            return false;
        }
        
        // Check if the cell exists in the maze layout
        if (targetCellY >= 0 && targetCellY < MAZE_LAYOUT.length && 
            targetCellX >= 0 && targetCellX < MAZE_LAYOUT[targetCellY].length) {
            const cellValue = MAZE_LAYOUT[targetCellY][targetCellX];
            console.log(`CanMove: direction=${direction}, from(${this.x.toFixed(2)},${this.y.toFixed(2)}), targetCell(${targetCellX},${targetCellY}), value=${cellValue}, canMove=${cellValue !== 1}`);
            // Allow movement if not a wall (1), including empty space (0), dots (2), power pellets (3), ghost house (4)
            return cellValue !== 1;
        }
        
        return false;
    }
    
    isAtGridCenter() {
        const cellX = Math.round(this.x);
        const cellY = Math.round(this.y);
        return Math.abs(this.x - cellX) < 0.05 && Math.abs(this.y - cellY) < 0.05;
    }
    
    snapToGrid() {
        const cellX = Math.round(this.x);
        const cellY = Math.round(this.y);
        
        // Snap if we're close to the center (within 0.15)
        if (Math.abs(this.x - cellX) < 0.15) {
            this.x = cellX;
        }
        if (Math.abs(this.y - cellY) < 0.15) {
            this.y = cellY;
        }
    }
    
    render(ctx) {
        const centerX = this.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = this.y * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE / 2 - 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Rotate based on direction (default to right if no direction)
        switch (this.direction) {
            case 'up':
                ctx.rotate(-Math.PI / 2);
                break;
            case 'down':
                ctx.rotate(Math.PI / 2);
                break;
            case 'left':
                ctx.rotate(Math.PI);
                break;
            case 'right':
            default:
                // No rotation needed (facing right)
                break;
        }
        
        // Draw pacman
        ctx.fillStyle = '#ffd93d';
        ctx.beginPath();
        
        if (this.mouthOpen) {
            // Open mouth
            ctx.arc(0, 0, radius, 0.2 * Math.PI, 1.8 * Math.PI);
            ctx.lineTo(0, 0);
        } else {
            // Closed mouth (circle)
            ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        }
        
        ctx.fill();
        ctx.restore();
    }
    
    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.direction = null;
        this.nextDirection = null;
    }
}

// Ghost class
class Ghost {
    constructor(x, y, name, color) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.name = name;
        this.color = color;
        this.direction = 'up';
        this.speed = 2.0; // cells per second (초당 2칸 이동, 팩맨보다 느림)
        this.mode = 'chase'; // 'chase', 'scatter', 'frightened', 'eaten'
        this.modeTimer = 0;
        this.isEaten = false;
        this.animationFrame = 0;
    }
    
    update(deltaTime, pacman, powerMode) {
        this.modeTimer -= deltaTime;
        this.animationFrame += deltaTime * 0.01;
        
        // Update mode based on power mode
        if (powerMode && this.mode !== 'eaten') {
            this.mode = 'frightened';
            this.modeTimer = 6000; // 6 seconds
        } else if (!powerMode && this.mode === 'frightened') {
            this.mode = 'chase';
        }
        
        // Move
        if (this.canMove(this.direction)) {
            // Convert speed from cells/second to cells/frame
            // Use parseFloat to ensure precision is maintained
            const moveDistance = parseFloat((this.speed * (deltaTime / 1000)).toFixed(4));
            
            switch (this.direction) {
                case 'up':
                    this.y -= moveDistance;
                    this.y = parseFloat(this.y.toFixed(4)); // Maintain 4 decimal precision
                    break;
                case 'down':
                    this.y += moveDistance;
                    this.y = parseFloat(this.y.toFixed(4)); // Maintain 4 decimal precision
                    break;
                case 'left':
                    this.x -= moveDistance;
                    this.x = parseFloat(this.x.toFixed(4)); // Maintain 4 decimal precision
                    break;
                case 'right':
                    this.x += moveDistance;
                    this.x = parseFloat(this.x.toFixed(4)); // Maintain 4 decimal precision
                    break;
            }
            
            // Only snap when VERY close to grid center (within 0.01)
            const cellX = Math.round(this.x);
            const cellY = Math.round(this.y);
            if (Math.abs(this.x - cellX) < 0.01) {
                this.x = cellX;
            }
            if (Math.abs(this.y - cellY) < 0.01) {
                this.y = cellY;
            }
        } else {
            // Choose new direction
            this.chooseDirection(pacman);
        }
    }
    
    canMove(direction) {
        let newX = this.x;
        let newY = this.y;
        
        switch (direction) {
            case 'up':
                newY -= 1;
                break;
            case 'down':
                newY += 1;
                break;
            case 'left':
                newX -= 1;
                break;
            case 'right':
                newX += 1;
                break;
        }
        
        // Check bounds
        if (newX < 0 || newX >= MAZE_WIDTH || newY < 0 || newY >= MAZE_HEIGHT) {
            return false;
        }
        
        // Check walls
        const cellX = Math.floor(newX);
        const cellY = Math.floor(newY);
        
        if (cellY >= 0 && cellY < MAZE_LAYOUT.length && 
            cellX >= 0 && cellX < MAZE_LAYOUT[cellY].length) {
            return MAZE_LAYOUT[cellY][cellX] !== 1;
        }
        
        return false;
    }
    
    chooseDirection(pacman) {
        const directions = ['up', 'down', 'left', 'right'];
        const validDirections = directions.filter(dir => this.canMove(dir));
        
        if (validDirections.length === 0) return;
        
        let bestDirection = validDirections[0];
        let bestDistance = Infinity;
        
        for (const direction of validDirections) {
            let targetX = this.x;
            let targetY = this.y;
            
            switch (direction) {
                case 'up':
                    targetY -= 1;
                    break;
                case 'down':
                    targetY += 1;
                    break;
                case 'left':
                    targetX -= 1;
                    break;
                case 'right':
                    targetX += 1;
                    break;
            }
            
            let distance;
            if (this.mode === 'frightened') {
                // Move away from pacman
                distance = Math.sqrt(Math.pow(targetX - pacman.x, 2) + Math.pow(targetY - pacman.y, 2));
                if (distance > bestDistance) {
                    bestDistance = distance;
                    bestDirection = direction;
                }
            } else {
                // Move towards pacman
                distance = Math.sqrt(Math.pow(targetX - pacman.x, 2) + Math.pow(targetY - pacman.y, 2));
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestDirection = direction;
                }
            }
        }
        
        this.direction = bestDirection;
    }
    
    snapToGrid() {
        const cellX = Math.round(this.x);
        const cellY = Math.round(this.y);
        
        if (Math.abs(this.x - cellX) < 0.1 && Math.abs(this.y - cellY) < 0.1) {
            this.x = cellX;
            this.y = cellY;
        }
    }
    
    render(ctx) {
        const centerX = this.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = this.y * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE / 2 - 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Set color based on mode
        if (this.mode === 'frightened') {
            ctx.fillStyle = '#0000ff';
        } else if (this.mode === 'eaten') {
            ctx.fillStyle = '#666666';
        } else {
            ctx.fillStyle = this.color;
        }
        
        // Draw ghost body
        ctx.beginPath();
        ctx.arc(0, -radius/2, radius, Math.PI, 0, false);
        ctx.lineTo(radius, radius/2);
        ctx.lineTo(radius/2, radius);
        ctx.lineTo(-radius/2, radius);
        ctx.lineTo(-radius, radius/2);
        ctx.closePath();
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-radius/3, -radius/3, radius/6, 0, 2 * Math.PI);
        ctx.arc(radius/3, -radius/3, radius/6, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-radius/3, -radius/3, radius/12, 0, 2 * Math.PI);
        ctx.arc(radius/3, -radius/3, radius/12, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.restore();
    }
    
    setPowerMode(isPowerMode) {
        if (isPowerMode && this.mode !== 'eaten') {
            this.mode = 'frightened';
            this.modeTimer = 6000;
        } else if (!isPowerMode && this.mode === 'frightened') {
            this.mode = 'chase';
        }
    }
    
    setEaten() {
        this.mode = 'eaten';
        this.isEaten = true;
        this.modeTimer = 5000; // 5 seconds to return
    }
    
    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.direction = 'up';
        this.mode = 'chase';
        this.isEaten = false;
        this.modeTimer = 0;
    }
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new PacmanGame();
});
