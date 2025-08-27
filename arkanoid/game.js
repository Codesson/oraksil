// 벽돌깨기 게임 JavaScript 구현

// Internationalization (i18n) for Arkanoid game
const arkanoidTranslations = {
    ko: {
        // Header
        gameTitle: "🧱 벽돌깨기 🧱",
        gameSubtitle: "클래식 아르카노이드 스타일의 블록 브레이커",
        backToGameCenter: "← 게임센터",
        
        // Controls
        controlsLabel: "조작법:",
        controlsText: "마우스 또는 화살표 키로 패들 이동 | 스페이스바로 일시정지",
        mobileHint: "모바일: 화면 터치로 조작",
        pauseButton: "일시정지",
        restartButton: "재시작",
        
        // Game screens
        startTitle: "🧱 벽돌깨기 🧱",
        startDescription: "패들을 조작해서 모든 벽돌을 깨뜨리세요!",
        startInstructions: "마우스 또는 화살표 키로 패들 이동",
        gameStartButton: "게임 시작",
        
        // Game over screen
        gameOverTitle: "게임 종료",
        finalScore: "최종 점수",
        reachedLevel: "도달 레벨",
        bricksDestroyed: "깨뜨린 벽돌",
        
        // Level complete screen
        levelCompleteTitle: "레벨 완료!",
        levelCompleteText: "축하합니다! 다음 레벨로 진행합니다.",
        currentScore: "현재 점수",
        nextLevel: "다음 레벨",
        continueButton: "계속하기",
        
        // In-game UI
        scoreLabel: "점수",
        levelLabel: "레벨",
        livesLabel: "생명",
        
        // Game messages
        paused: "일시정지",
        pressSpaceToResume: "스페이스바를 눌러 계속하기"
    },
    en: {
        // Header
        gameTitle: "🧱 Brick Breaker 🧱",
        gameSubtitle: "Classic Arkanoid Style Block Breaker",
        backToGameCenter: "← Game Center",
        
        // Controls
        controlsLabel: "Controls:",
        controlsText: "Mouse or arrow keys to move paddle | Spacebar to pause",
        mobileHint: "Mobile: Touch to control",
        pauseButton: "Pause",
        restartButton: "Restart",
        
        // Game screens
        startTitle: "🧱 Brick Breaker 🧱",
        startDescription: "Control the paddle to break all the bricks!",
        startInstructions: "Mouse or arrow keys to move paddle",
        gameStartButton: "Start Game",
        
        // Game over screen
        gameOverTitle: "Game Over",
        finalScore: "Final Score",
        reachedLevel: "Level Reached",
        bricksDestroyed: "Bricks Destroyed",
        
        // Level complete screen
        levelCompleteTitle: "Level Complete!",
        levelCompleteText: "Congratulations! Proceeding to next level.",
        currentScore: "Current Score",
        nextLevel: "Next Level",
        continueButton: "Continue",
        
        // In-game UI
        scoreLabel: "Score",
        levelLabel: "Level",
        livesLabel: "Lives",
        
        // Game messages
        paused: "Paused",
        pressSpaceToResume: "Press Space to Resume"
    }
};

// Get language from URL parameter or localStorage
function getArkanoidLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    if (langFromUrl && arkanoidTranslations[langFromUrl]) {
        return langFromUrl;
    }
    return localStorage.getItem('language') || 
           (navigator.language.startsWith('ko') ? 'ko' : 'en');
}

// Current language for Arkanoid game
let currentArkanoidLanguage = getArkanoidLanguage();

// Translation function for Arkanoid
function at(key) {
    return arkanoidTranslations[currentArkanoidLanguage]?.[key] || key;
}

// Update Arkanoid game language
function updateArkanoidLanguage() {
    // Update HTML elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = at(key);
    });
    
    // Update aria-labels
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.setAttribute('aria-label', 
            currentArkanoidLanguage === 'ko' ? '메인 페이지로 돌아가기' : 'Back to main page');
    }
    
    // Update canvas aria-label
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.setAttribute('aria-label', 
            currentArkanoidLanguage === 'ko' ? '벽돌깨기 게임 캔버스' : 'Brick breaker game canvas');
    }
    
    // Update mobile controls aria-label
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
        mobileControls.setAttribute('aria-label', 
            currentArkanoidLanguage === 'ko' ? '모바일 터치 컨트롤' : 'Mobile touch controls');
    }
    
    // Update document title
    document.title = currentArkanoidLanguage === 'ko' 
        ? '벽돌깨기 게임 - 온라인 무료 아케이드 게임 | Oraksil'
        : 'Brick Breaker Game - Free Online Arcade Game | Oraksil';
}

class ArkanoidGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // 게임 상태
        this.gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver', 'levelComplete'
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.totalBricksDestroyed = 0;
        
        // 게임 객체들
        this.paddle = null;
        this.ball = null;
        this.bricks = [];
        this.powerUps = [];
        this.particles = [];
        
        // 입력 처리
        this.keys = {};
        this.mouseX = 0;
        
        // 애니메이션
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        // Initialize internationalization
        updateArkanoidLanguage();
        
        this.setupEventListeners();
        this.setupMobileControls();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // 키보드 이벤트
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
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // 마우스 이벤트
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        });
        
        // 윈도우 크기 변경 이벤트
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // 초기 캔버스 크기 설정
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
        const keyMap = {
            'ArrowLeft': 'ArrowLeft',
            'ArrowRight': 'ArrowRight',
            'Space': 'Space',
            'KeyR': 'KeyR'
        };

        const gameKey = keyMap[key];
        if (!gameKey) return;

        if (isPressed) {
            this.keys[gameKey] = true;
            
            if (gameKey === 'Space') {
                if (this.gameState === 'playing') {
                    this.pause();
                } else if (this.gameState === 'paused') {
                    this.resume();
                }
            }
            
            if (gameKey === 'KeyR') {
                this.restart();
            }
        } else {
            this.keys[gameKey] = false;
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
            
            const aspectRatio = 800 / 600;
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
            this.canvas.style.width = '800px';
            this.canvas.style.height = '600px';
        }
    }
    
    start() {
        document.getElementById('startScreen').style.display = 'none';
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.totalBricksDestroyed = 0;
        
        this.initializeGame();
    }
    
    restart() {
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('levelComplete').style.display = 'none';
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.totalBricksDestroyed = 0;
        
        this.initializeGame();
    }
    
    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        }
    }
    
    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
    }
    
    initializeGame() {
        // 패들 생성
        this.paddle = new Paddle(this.width / 2 - 50, this.height - 40, 100, 15);
        
        // 볼 생성
        this.ball = new Ball(this.width / 2, this.height - 60, 8, -300, -300);
        
        // 벽돌 생성
        this.createBricks();
        
        // 배열 초기화
        this.powerUps = [];
        this.particles = [];
    }
    
    createBricks() {
        this.bricks = [];
        const rows = Math.min(5 + Math.floor(this.level / 3), 10);
        const cols = 10;
        const brickWidth = 70;
        const brickHeight = 25;
        const padding = 5;
        const offsetX = (this.width - (cols * (brickWidth + padding) - padding)) / 2;
        const offsetY = 80;
        
        const colors = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4d9de0', '#ff8e53', '#b794f6'];
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = offsetX + col * (brickWidth + padding);
                const y = offsetY + row * (brickHeight + padding);
                const colorIndex = row % colors.length;
                const color = colors[colorIndex];
                
                // 레벨이 높을수록 일부 벽돌의 체력 증가
                const health = row < 2 && this.level > 2 ? 2 : 1;
                
                this.bricks.push(new Brick(x, y, brickWidth, brickHeight, color, health));
            }
        }
    }
    
    nextLevel() {
        document.getElementById('levelComplete').style.display = 'none';
        this.level++;
        this.gameState = 'playing';
        
        // 볼 리셋
        this.ball.reset(this.width / 2, this.height - 60);
        
        // 새로운 레벨의 벽돌 생성
        this.createBricks();
        
        // 파워업과 파티클 제거
        this.powerUps = [];
        this.particles = [];
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // 게임 오버 화면 업데이트
        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        document.getElementById('reachedLevel').textContent = this.level;
        document.getElementById('bricksDestroyed').textContent = this.totalBricksDestroyed;
        
        document.getElementById('gameOver').style.display = 'flex';
    }
    
    levelComplete() {
        this.gameState = 'levelComplete';
        
        // 레벨 완료 화면 업데이트
        document.getElementById('currentScore').textContent = this.score.toLocaleString();
        document.getElementById('nextLevel').textContent = this.level + 1;
        
        document.getElementById('levelComplete').style.display = 'flex';
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // 패들 업데이트
        this.paddle.update(deltaTime, this.keys, this.mouseX);
        
        // 볼 업데이트
        this.ball.update(deltaTime);
        
        // 볼과 벽 충돌
        this.ball.handleWallCollision(this.width, this.height);
        
        // 볼이 바닥에 닿았을 때
        if (this.ball.y > this.height) {
            this.lives--;
            if (this.lives <= 0) {
                this.gameOver();
                return;
            } else {
                // 볼 리셋
                this.ball.reset(this.width / 2, this.height - 60);
            }
        }
        
        // 볼과 패들 충돌
        if (this.ball.checkCollision(this.paddle)) {
            this.ball.handlePaddleCollision(this.paddle);
            this.addScore(10);
        }
        
        // 볼과 벽돌 충돌
        for (let i = this.bricks.length - 1; i >= 0; i--) {
            const brick = this.bricks[i];
            if (this.ball.checkCollision(brick)) {
                this.ball.handleBrickCollision(brick);
                
                brick.health--;
                if (brick.health <= 0) {
                    // 벽돌 파괴
                    this.createBrickParticles(brick);
                    this.addScore(brick.scoreValue);
                    this.totalBricksDestroyed++;
                    
                    // 파워업 생성 확률
                    if (Math.random() < 0.1) {
                        this.createPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
                    }
                    
                    this.bricks.splice(i, 1);
                    
                    // 모든 벽돌이 파괴되었는지 확인
                    if (this.bricks.length === 0) {
                        this.levelComplete();
                        return;
                    }
                }
                break; // 한 번에 하나의 벽돌만 충돌 처리
            }
        }
        
        // 파워업 업데이트
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.update(deltaTime);
            
            // 패들과 충돌 확인
            if (powerUp.checkCollision(this.paddle)) {
                this.applyPowerUp(powerUp.type);
                this.powerUps.splice(i, 1);
                continue;
            }
            
            // 화면 밖으로 나간 파워업 제거
            if (powerUp.y > this.height) {
                this.powerUps.splice(i, 1);
            }
        }
        
        // 파티클 업데이트
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    addScore(points) {
        this.score += points;
    }
    
    createBrickParticles(brick) {
        for (let i = 0; i < 8; i++) {
            const particle = new Particle(
                brick.x + brick.width / 2,
                brick.y + brick.height / 2,
                (Math.random() - 0.5) * 200,
                -Math.random() * 150 - 50,
                brick.color
            );
            this.particles.push(particle);
        }
    }
    
    createPowerUp(x, y) {
        const types = ['expand', 'multiball', 'speed', 'life'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerUps.push(new PowerUp(x, y, type));
    }
    
    applyPowerUp(type) {
        this.addScore(50);
        
        switch (type) {
            case 'expand':
                this.paddle.expand();
                break;
            case 'multiball':
                // 추가 볼 생성 (간단한 구현)
                break;
            case 'speed':
                this.ball.speedUp();
                break;
            case 'life':
                this.lives++;
                break;
        }
    }
    
    render() {
        // 화면 클리어
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 배경 그라디언트
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            // 게임 객체들 렌더링
            if (this.paddle) this.paddle.render(this.ctx);
            if (this.ball) this.ball.render(this.ctx);
            
            this.bricks.forEach(brick => brick.render(this.ctx));
            this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
            this.particles.forEach(particle => particle.render(this.ctx));
            
            // UI 렌더링
            this.renderUI();
            
            // 일시정지 오버레이
            if (this.gameState === 'paused') {
                this.renderPauseOverlay();
            }
        }
    }
    
    renderUI() {
        this.ctx.save();
        
        // 폰트 설정
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'left';
        
        // 점수
        this.ctx.fillText(`${at('scoreLabel')}: ${this.score.toLocaleString()}`, 20, 35);
        
        // 레벨
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${at('levelLabel')}: ${this.level}`, this.width / 2, 35);
        
        // 생명
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${at('livesLabel')}: ${this.lives}`, this.width - 20, 35);
        
        this.ctx.restore();
    }
    
    renderPauseOverlay() {
        this.ctx.save();
        
        // 반투명 오버레이
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 일시정지 텍스트
        this.ctx.font = 'bold 48px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(at('paused'), this.width / 2, this.height / 2 - 20);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText(at('pressSpaceToResume'), this.width / 2, this.height / 2 + 30);
        
        this.ctx.restore();
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// 게임 객체 클래스들

class Paddle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 500;
        this.originalWidth = width;
        this.expandTimer = 0;
    }
    
    update(deltaTime, keys, mouseX) {
        // 키보드 입력
        if (keys['ArrowLeft'] && this.x > 0) {
            this.x -= this.speed * deltaTime / 1000;
        }
        if (keys['ArrowRight'] && this.x < game.width - this.width) {
            this.x += this.speed * deltaTime / 1000;
        }
        
        // 마우스 입력 (키보드 입력이 없을 때)
        if (!keys['ArrowLeft'] && !keys['ArrowRight']) {
            const targetX = mouseX - this.width / 2;
            this.x = Math.max(0, Math.min(targetX, game.width - this.width));
        }
        
        // 확장 효과 타이머
        if (this.expandTimer > 0) {
            this.expandTimer -= deltaTime;
            if (this.expandTimer <= 0) {
                this.width = this.originalWidth;
            }
        }
    }
    
    expand() {
        this.width = this.originalWidth * 1.5;
        this.expandTimer = 10000; // 10초
    }
    
    render(ctx) {
        ctx.save();
        
        // 그라디언트 효과
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#ff5252');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#ff6b6b';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 확장 효과 표시
        if (this.expandTimer > 0) {
            ctx.strokeStyle = '#ffd93d';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        }
        
        ctx.restore();
    }
}

class Ball {
    constructor(x, y, radius, vx, vy) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.originalSpeed = Math.sqrt(vx * vx + vy * vy);
        this.speedMultiplier = 1;
        this.trail = [];
    }
    
    update(deltaTime) {
        // 위치 업데이트
        this.x += this.vx * deltaTime / 1000;
        this.y += this.vy * deltaTime / 1000;
        
        // 트레일 효과
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 10) {
            this.trail.shift();
        }
    }
    
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = this.originalSpeed * (Math.random() > 0.5 ? 1 : -1) * 0.7;
        this.vy = -this.originalSpeed;
        this.speedMultiplier = 1;
        this.trail = [];
    }
    
    speedUp() {
        this.speedMultiplier = Math.min(this.speedMultiplier * 1.2, 2);
    }
    
    handleWallCollision(gameWidth, gameHeight) {
        // 좌우 벽 충돌
        if (this.x - this.radius <= 0 || this.x + this.radius >= gameWidth) {
            this.vx = -this.vx;
            this.x = Math.max(this.radius, Math.min(this.x, gameWidth - this.radius));
        }
        
        // 상단 벽 충돌
        if (this.y - this.radius <= 50) { // UI 공간 고려
            this.vy = -this.vy;
            this.y = 50 + this.radius;
        }
    }
    
    handlePaddleCollision(paddle) {
        // 패들과의 상대적 위치에 따라 반사각 조정
        const hitPos = (this.x - paddle.x) / paddle.width;
        const angle = (hitPos - 0.5) * Math.PI / 3; // -60도 ~ +60도
        
        const speed = this.originalSpeed * this.speedMultiplier;
        this.vx = Math.sin(angle) * speed;
        this.vy = -Math.cos(angle) * speed;
        
        // 볼이 패들 위에 위치하도록 조정
        this.y = paddle.y - this.radius;
    }
    
    handleBrickCollision(brick) {
        // 충돌 면 계산
        const ballCenterX = this.x;
        const ballCenterY = this.y;
        const brickCenterX = brick.x + brick.width / 2;
        const brickCenterY = brick.y + brick.height / 2;
        
        const dx = ballCenterX - brickCenterX;
        const dy = ballCenterY - brickCenterY;
        
        const overlapX = this.radius + brick.width / 2 - Math.abs(dx);
        const overlapY = this.radius + brick.height / 2 - Math.abs(dy);
        
        if (overlapX < overlapY) {
            // 좌우 충돌
            this.vx = -this.vx;
        } else {
            // 상하 충돌
            this.vy = -this.vy;
        }
    }
    
    checkCollision(rect) {
        const closestX = Math.max(rect.x, Math.min(this.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(this.y, rect.y + rect.height));
        
        const distance = Math.sqrt(
            (this.x - closestX) * (this.x - closestX) +
            (this.y - closestY) * (this.y - closestY)
        );
        
        return distance < this.radius;
    }
    
    render(ctx) {
        ctx.save();
        
        // 트레일 렌더링
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = i / this.trail.length * 0.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#4d9de0';
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, this.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 볼 렌더링
        ctx.globalAlpha = 1;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, '#6bcf7f');
        gradient.addColorStop(1, '#4d9de0');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#4d9de0';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Brick {
    constructor(x, y, width, height, color, health = 1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.health = health;
        this.maxHealth = health;
        this.scoreValue = health * 100;
    }
    
    render(ctx) {
        ctx.save();
        
        // 체력에 따른 투명도 조정
        const alpha = this.health / this.maxHealth;
        ctx.globalAlpha = alpha;
        
        // 벽돌 렌더링
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 테두리
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // 체력이 2 이상일 때 표시
        if (this.health > 1) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.health.toString(), this.x + this.width / 2, this.y + this.height / 2 + 5);
        }
        
        ctx.restore();
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type;
        this.speed = 100;
        this.colors = {
            expand: '#ffd93d',
            multiball: '#ff6b6b',
            speed: '#4d9de0',
            life: '#6bcf7f'
        };
        this.symbols = {
            expand: '⬅️➡️',
            multiball: '⚽',
            speed: '⚡',
            life: '❤️'
        };
    }
    
    update(deltaTime) {
        this.y += this.speed * deltaTime / 1000;
    }
    
    checkCollision(paddle) {
        return this.x < paddle.x + paddle.width &&
               this.x + this.width > paddle.x &&
               this.y < paddle.y + paddle.height &&
               this.y + this.height > paddle.y;
    }
    
    render(ctx) {
        ctx.save();
        
        // 배경
        ctx.fillStyle = this.colors[this.type];
        ctx.shadowColor = this.colors[this.type];
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        // 심볼
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.symbols[this.type], this.x, this.y + 4);
        
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = 1000;
        this.maxLife = 1000;
        this.size = Math.random() * 4 + 2;
        this.color = color;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime / 1000;
        this.y += this.vy * deltaTime / 1000;
        this.life -= deltaTime;
        this.vx *= 0.98;
        this.vy += 200 * deltaTime / 1000; // 중력
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

// 게임 인스턴스 생성
const game = new ArkanoidGame();
