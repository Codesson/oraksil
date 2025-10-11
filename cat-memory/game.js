// 고양이 그림 짝맞추기 게임
class CatMemoryGame {
    constructor() {
        this.gameBoard = document.getElementById('gameBoard');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOver');
        this.gameSection = document.getElementById('game-section');
        
        // 게임 상태
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.startTime = null;
        this.gameTimer = null;
        this.currentLevel = 1;
        this.isGameActive = false;
        this.gameMode = 'progressive'; // 'progressive' or 'fixed'
        this.timeLimit = 60; // 1분 제한
        this.remainingTime = 60;
        this.totalScore = 0;
        this.highestLevel = 0;
        
        // 고양이 이모지들
        this.catEmojis = [
            '🐱', '😸', '😺', '😻', '😼', '😽', '🙀', '😿', '😾',
            '🐈', '🐈‍⬛', '🦁', '🐅', '🐆', '🐯', '🐱‍👤', '🐱‍💻', '🐱‍🚀'
        ];
        
        // 다른 동물 이모지들 (5 스테이지 이상에서 혼합 등장)
        this.otherAnimalEmojis = [
            '🐶', '🐰', '🐻', '🐼', '🐨', '🐵', '🐸', '🐷', '🐮',
            '🦊', '🐺', '🦝', '🦄', '🐔', '🐤', '🦆', '🦉', '🦅',
            '🦓', '🦒', '🐘', '🦘', '🦬', '🦏', '🦛', '🐪', '🐫'
        ];
        
        // 게임 설정 - 점진적 난이도 시스템
        this.gameConfig = {
            // 레벨별 설정 (2x2부터 시작) - 항상 짝수 개 카드(직사각형/정사각형)
            1: { rows: 2, cols: 2, pairs: 2, name: '레벨 1' },          // 4 = 2쌍
            2: { rows: 2, cols: 3, pairs: 3, name: '레벨 2' },          // 6 = 3쌍
            3: { rows: 3, cols: 4, pairs: 6, name: '레벨 3' },          // 12 = 6쌍
            4: { rows: 4, cols: 4, pairs: 8, name: '레벨 4' },          // 16 = 8쌍
            5: { rows: 4, cols: 5, pairs: 10, name: '레벨 5' },         // 20 = 10쌍
            6: { rows: 5, cols: 6, pairs: 15, name: '레벨 6' },         // 30 = 15쌍
            7: { rows: 6, cols: 6, pairs: 18, name: '레벨 7' },         // 36 = 18쌍
            8: { rows: 6, cols: 7, pairs: 21, name: '레벨 8' },         // 42 = 21쌍
            9: { rows: 7, cols: 8, pairs: 28, name: '레벨 9' },         // 56 = 28쌍
            10: { rows: 8, cols: 8, pairs: 32, name: '레벨 10' },       // 64 = 32쌍
            // 더 높은 레벨들
            11: { rows: 8, cols: 9, pairs: 36, name: '레벨 11' },       // 72 = 36쌍
            12: { rows: 9, cols: 10, pairs: 45, name: '레벨 12' },      // 90 = 45쌍
            13: { rows: 10, cols: 10, pairs: 50, name: '레벨 13' },     // 100 = 50쌍
            14: { rows: 10, cols: 12, pairs: 60, name: '레벨 14' },     // 120 = 60쌍
            15: { rows: 12, cols: 12, pairs: 72, name: '레벨 15' }      // 144 = 72쌍
        };
        
        // 고정 난이도 설정 (기존 시스템)
        this.fixedDifficultyConfig = {
            easy: { rows: 4, cols: 4, pairs: 8, name: '쉬움' },     // 16 = 8쌍
            medium: { rows: 5, cols: 6, pairs: 15, name: '보통' },  // 30 = 15쌍
            hard: { rows: 6, cols: 6, pairs: 18, name: '어려움' }   // 36 = 18쌍
        };
        
        this.init();
    }
    
    init() {
        this.showStartScreen();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isGameActive) {
                this.pauseGame();
            }
        });
    }
    
    showStartScreen() {
        this.startScreen.classList.add('show');
        this.gameOverScreen.classList.remove('show');
        this.gameSection.style.display = 'none';
        this.isGameActive = false;
    }
    
    showGameOver() {
        this.gameOverScreen.classList.add('show');
        this.startScreen.classList.remove('show');
        this.gameSection.style.display = 'none';
        this.isGameActive = false;
        
        // 최종 통계 업데이트
        this.updateFinalStats();
    }
    
    showLevelComplete() {
        // 레벨 완료 화면 표시
        const levelCompleteScreen = document.getElementById('levelComplete');
        if (levelCompleteScreen) {
            levelCompleteScreen.classList.add('show');
            this.gameSection.style.display = 'none';
            this.startScreen.classList.remove('show');
            this.gameOverScreen.classList.remove('show');
            
            // 레벨 완료 통계 업데이트
            this.updateLevelCompleteStats();
        } else {
            // 레벨 완료 화면이 없으면 다음 레벨로 바로 진행
            this.nextLevel();
        }
    }
    
    updateLevelCompleteStats() {
        const config = this.gameConfig[this.currentLevel];
        const usedTime = this.timeLimit - this.remainingTime;
        const minutes = Math.floor(usedTime / 60);
        const seconds = usedTime % 60;
        
        // 레벨 점수 계산
        const levelScore = this.calculateLevelScore();
        
        // 레벨 완료 화면 업데이트
        const levelCompleteScreen = document.getElementById('levelComplete');
        if (levelCompleteScreen) {
            const levelName = levelCompleteScreen.querySelector('#levelName');
            const currentScore = levelCompleteScreen.querySelector('#currentScore');
            const levelTime = levelCompleteScreen.querySelector('#levelTime');
            const levelMoves = levelCompleteScreen.querySelector('#levelMoves');
            const nextLevel = levelCompleteScreen.querySelector('#nextLevel');
            const totalScore = levelCompleteScreen.querySelector('#totalScore');
            
            if (levelName) levelName.textContent = config.name;
            if (currentScore) currentScore.textContent = levelScore.toLocaleString();
            if (levelTime) levelTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            if (levelMoves) levelMoves.textContent = this.moves;
            if (nextLevel) nextLevel.textContent = this.gameConfig[this.currentLevel + 1]?.name || '최종 레벨';
            if (totalScore) totalScore.textContent = this.totalScore.toLocaleString();
        }
    }
    
    nextLevel() {
        // 이 함수는 더 이상 사용되지 않음 (startLevelTransition에서 처리)
        // 레거시 호환성을 위해 유지
        console.warn('nextLevel() is deprecated. Use startLevelTransition() instead.');
    }
    
    showGameComplete() {
        // 모든 레벨 완료 화면
        this.showGameOver();
        
        // 특별한 완료 메시지 표시
        const gameOverTitle = document.querySelector('#gameOver .screen-title');
        if (gameOverTitle) {
            gameOverTitle.innerHTML = '🎉 모든 레벨 완료! 🎉<br><small>축하합니다! 고양이 마스터가 되셨습니다!</small>';
        }
    }
    
    startGame(mode = 'progressive', level = 1) {
        this.gameMode = mode;
        
        if (mode === 'progressive') {
            this.currentLevel = level;
            const config = this.gameConfig[level];
            
            // 게임 상태 초기화
            this.cards = [];
            this.flippedCards = [];
            this.matchedPairs = 0;
            this.moves = 0;
            this.startTime = Date.now();
            this.remainingTime = this.timeLimit;
            this.isGameActive = false; // 카운트다운 중에는 게임 비활성화
            
            // 첫 레벨이면 총 점수 초기화
            if (level === 1) {
                this.totalScore = 0;
                this.highestLevel = 0;
            }
            
            // 기존 타이머 정리
            if (this.gameTimer) {
                clearInterval(this.gameTimer);
            }
            
            // UI 업데이트
            this.startScreen.classList.remove('show');
            this.gameOverScreen.classList.remove('show');
            this.gameSection.style.display = 'flex';
            
            // 게임 보드 설정
            this.setupGameBoard(config);
            this.createCards(config);
            this.shuffleCards();
            this.renderCards();
            
            // 레벨 1에서는 시작 카운트다운, 이후 레벨은 즉시 시작 (갤러그 스타일)
            if (level === 1) {
                // 게임 시작 카운트다운
                this.startGameCountdown();
            } else {
                // 스테이지 전환 후 즉시 시작
                this.isGameActive = true;
                this.startTimer();
            }
            
            // 게임 시작 이벤트 추적
            if (typeof gtag !== 'undefined') {
                gtag('event', 'game_start', {
                    'game_name': 'cat_memory',
                    'mode': 'progressive',
                    'level': level
                });
            }
        } else {
            // 기존 고정 난이도 시스템
            this.difficulty = mode;
            const config = this.fixedDifficultyConfig[mode];
            
            // 게임 상태 초기화
            this.cards = [];
            this.flippedCards = [];
            this.matchedPairs = 0;
            this.moves = 0;
            this.startTime = Date.now();
            this.isGameActive = true;
            
            // UI 업데이트
            this.startScreen.classList.remove('show');
            this.gameOverScreen.classList.remove('show');
            this.gameSection.style.display = 'flex';
            
            // 게임 보드 설정
            this.setupGameBoard(config);
            this.createCards(config);
            this.shuffleCards();
            this.renderCards();
            
            // 타이머 시작
            this.startTimer();
            
            // 게임 시작 이벤트 추적
            if (typeof gtag !== 'undefined') {
                gtag('event', 'game_start', {
                    'game_name': 'cat_memory',
                    'mode': 'fixed',
                    'difficulty': mode
                });
            }
        }
    }
    
    setupGameBoard(config) {
        // 게임 보드 크기에 따른 클래스 설정 + 정확한 열 수 고정
        const sizeClass = this.getSizeClass(config.rows, config.cols);
        this.gameBoard.className = `game-board ${sizeClass}`;
        this.gameBoard.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
        this.gameBoard.innerHTML = '';
    }
    
    getSizeClass(rows, cols) {
        if (rows <= 2 && cols <= 3) return 'small';
        if (rows <= 3 && cols <= 4) return 'medium';
        if (rows <= 4 && cols <= 5) return 'large';
        return 'xlarge';
    }
    
    createCards(config) {
        const totalCards = config.rows * config.cols;
        // 안전장치: 항상 짝수 개 카드가 되도록 쌍 계산을 강제
        const pairs = Math.floor(totalCards / 2);
        
        // 카드 쌍 생성
        const cardTypes = [];
        // 5 스테이지 이상(점진적 모드)에서는 고양이 + 다른 동물 혼합
        const useMixedAnimals = this.gameMode === 'progressive' && this.currentLevel >= 5;
        const emojiPool = useMixedAnimals 
            ? this.catEmojis.concat(this.otherAnimalEmojis)
            : this.catEmojis;
        
        for (let i = 0; i < pairs; i++) {
            const emoji = emojiPool[i % emojiPool.length];
            cardTypes.push(emoji, emoji); // 각 이모지를 2개씩
        }
        
        // 카드 객체 생성
        this.cards = cardTypes.map((emoji, index) => ({
            id: index,
            emoji: emoji,
            isFlipped: false,
            isMatched: false
        }));
    }
    
    shuffleCards() {
        // Fisher-Yates 셔플 알고리즘
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    renderCards() {
        this.gameBoard.innerHTML = '';
        
        this.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.cardId = card.id;
            cardElement.dataset.index = index;
            
            // 카드 내용
            cardElement.innerHTML = `
                <div class="card-back">🐾</div>
                <div class="card-front">${card.emoji}</div>
            `;
            
            // 클릭 이벤트
            cardElement.addEventListener('click', () => this.flipCard(index));
            
            this.gameBoard.appendChild(cardElement);
        });
    }
    
    flipCard(index) {
        if (!this.isGameActive) return;
        
        const card = this.cards[index];
        const cardElement = this.gameBoard.children[index];
        
        // 이미 뒤집힌 카드나 매치된 카드는 무시
        if (card.isFlipped || card.isMatched) return;
        
        // 최대 2장까지만 뒤집기
        if (this.flippedCards.length >= 2) return;
        
        // 카드 뒤집기
        card.isFlipped = true;
        cardElement.classList.add('flipped');
        this.flippedCards.push({ card, element: cardElement, index });
        
        // 2장이 뒤집어졌을 때 체크
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateGameInfo();
            this.checkForMatch();
        }
    }
    
    checkForMatch() {
        const [first, second] = this.flippedCards;
        
        if (first.card.emoji === second.card.emoji) {
            // 매치 성공
            setTimeout(() => {
                first.card.isMatched = true;
                second.card.isMatched = true;
                first.element.classList.add('matched');
                second.element.classList.add('matched');
                
                this.matchedPairs++;
                this.flippedCards = [];
                this.updateGameInfo();
                
                // 게임 완료 체크
                this.checkGameComplete();
            }, 500);
        } else {
            // 매치 실패
            setTimeout(() => {
                first.card.isFlipped = false;
                second.card.isFlipped = false;
                first.element.classList.remove('flipped');
                second.element.classList.add('wrong');
                second.element.classList.remove('flipped');
                second.element.classList.add('wrong');
                
                // 잠시 후 원래 상태로
                setTimeout(() => {
                    first.element.classList.remove('wrong');
                    second.element.classList.remove('wrong');
                }, 300);
                
                this.flippedCards = [];
            }, 1000);
        }
    }
    
    checkGameComplete() {
        let config;
        if (this.gameMode === 'progressive') {
            config = this.gameConfig[this.currentLevel];
        } else {
            config = this.fixedDifficultyConfig[this.difficulty];
        }
        
        console.log(`매치된 쌍: ${this.matchedPairs}, 필요한 쌍: ${config.pairs}`);
        if (this.matchedPairs === config.pairs) {
            console.log('레벨 완료! completeGame 호출');
            this.completeGame();
        }
    }
    
    completeGame() {
        this.isGameActive = false;
        clearInterval(this.gameTimer);
        
        if (this.gameMode === 'progressive') {
            // 레벨 완료 점수 계산
            const levelScore = this.calculateLevelScore();
            this.totalScore += levelScore;
            this.highestLevel = Math.max(this.highestLevel, this.currentLevel);
            
            // 게임 완료 이벤트 추적
            if (typeof gtag !== 'undefined') {
                gtag('event', 'level_complete', {
                    'game_name': 'cat_memory',
                    'mode': 'progressive',
                    'level': this.currentLevel,
                    'level_score': levelScore,
                    'total_score': this.totalScore,
                    'remaining_time': this.remainingTime
                });
            }
            
            // 카운트다운 후 다음 레벨로 자동 진행
            this.startLevelTransition();
        } else {
            // 고정 난이도 모드에서는 게임 오버 화면
            setTimeout(() => {
                this.showGameOver();
            }, 1000);
        }
    }
    
    startGameCountdown() {
        // 팩맨 스타일의 게임 시작 카운트다운
        this.showGameStartCountdown();
    }
    
    showGameStartCountdown() {
        this.gameState = 'countdown';
        
        // Create countdown overlay (팩맨 스타일)
        const countdownOverlay = document.createElement('div');
        countdownOverlay.id = 'countdownOverlay';
        countdownOverlay.style.cssText = `
            position: fixed;
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
        stageTitle.id = 'gameStartTitle';
        stageTitle.style.cssText = `
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 20px;
            background: linear-gradient(45deg, #ffd93d, #ff6b6b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        `;
        const currentLang = localStorage.getItem('language') || 'ko';
        stageTitle.textContent = currentLang === 'en' ? 'GAME START' : '게임 시작';
        
        // Countdown display
        const countdownDisplay = document.createElement('div');
        countdownDisplay.id = 'gameStartCountdownDisplay';
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
        const countdownDisplay = document.getElementById('gameStartCountdownDisplay');
        
        if (count > 0) {
            countdownDisplay.textContent = count;
            setTimeout(() => {
                this.startCountdown(count - 1);
            }, 1000);
        } else {
            const currentLang = localStorage.getItem('language') || 'ko';
            countdownDisplay.textContent = currentLang === 'en' ? 'START!' : '시작!';
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
        this.isGameActive = true;
        this.startTimer();
    }
    
    startLevelTransition() {
        // 다음 레벨 게임 보드를 미리 준비
        const nextLevelNum = this.currentLevel + 1;
        
        // 최대 레벨 체크
        if (!this.gameConfig[nextLevelNum]) {
            this.showGameComplete();
            return;
        }
        
        // 다음 레벨 설정 (팝업 전에 준비)
        this.currentLevel = nextLevelNum;
        const config = this.gameConfig[nextLevelNum];
        
        // 게임 보드 초기화 (시간과 점수는 유지)
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.remainingTime = this.timeLimit; // 시간 리셋
        this.isGameActive = false; // 카운트다운 중에는 비활성화
        
        // 게임 보드 설정
        this.setupGameBoard(config);
        this.createCards(config);
        this.shuffleCards();
        this.renderCards();
        
        // 게임 정보 업데이트
        this.updateGameInfo();
        
        // 팩맨 스타일의 스테이지 전환 오버레이
        const stageOverlay = document.createElement('div');
        stageOverlay.id = 'stageOverlay';
        stageOverlay.style.cssText = `
            position: fixed;
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
        stageTitle.id = 'stageTransitionTitle';
        stageTitle.style.cssText = `
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 20px;
            background: linear-gradient(45deg, #ffd93d, #ff6b6b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        `;
        const currentLang = localStorage.getItem('language') || 'ko';
        stageTitle.textContent = currentLang === 'en' 
            ? `STAGE ${nextLevelNum}` 
            : `스테이지 ${nextLevelNum}`;
        
        // Countdown display for stage transition
        const countdownDisplay = document.createElement('div');
        countdownDisplay.id = 'stageTransitionCountdown';
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
        
        stageOverlay.appendChild(stageTitle);
        stageOverlay.appendChild(countdownDisplay);
        document.body.appendChild(stageOverlay);
        
        // Start stage transition countdown
        this.startStageCountdown(3);
    }
    
    startStageCountdown(count) {
        const countdownDisplay = document.getElementById('stageTransitionCountdown');
        
        if (count > 0) {
            countdownDisplay.textContent = count;
            setTimeout(() => {
                this.startStageCountdown(count - 1);
            }, 1000);
        } else {
            const currentLang = localStorage.getItem('language') || 'ko';
            countdownDisplay.textContent = currentLang === 'en' ? 'START!' : '시작!';
            setTimeout(() => {
                this.finishStageTransition();
            }, 500);
        }
    }
    
    finishStageTransition() {
        // Remove stage overlay
        const stageOverlay = document.getElementById('stageOverlay');
        if (stageOverlay) {
            stageOverlay.remove();
        }
        
        // 게임 활성화 (게임 보드는 이미 준비됨)
        this.isGameActive = true;
        
        // 타이머 시작 (스테이지 전환 시 타이머가 멈춰있으므로 재시작)
        this.startTimer();
        
        // 게임 정보 업데이트
        this.updateGameInfo();
    }
    
    startTimer() {
        console.log('[startTimer] ⏱️ Starting timer...');
        console.log(`[startTimer] gameMode: ${this.gameMode}, isGameActive: ${this.isGameActive}, remainingTime: ${this.remainingTime}`);
        
        // 기존 타이머가 있으면 먼저 정리
        if (this.gameTimer) {
            console.log('[startTimer] Clearing existing timer');
            clearInterval(this.gameTimer);
        }
        
        this.gameTimer = setInterval(() => {
            this.updateGameInfo();
            this.checkTimeLimit();
        }, 1000);
        
        console.log('[startTimer] Timer started successfully');
    }
    
    checkTimeLimit() {
        console.log(`[checkTimeLimit] gameMode: ${this.gameMode}, isGameActive: ${this.isGameActive}, remainingTime: ${this.remainingTime}`);
        
        if (this.gameMode === 'progressive' && this.isGameActive) {
            this.remainingTime--;
            
            console.log(`[checkTimeLimit] Time decreased to: ${this.remainingTime}`);
            
            // 시간이 0 이하가 되면 게임 오버
            if (this.remainingTime <= 0) {
                console.log('[checkTimeLimit] ⏰ TIME IS UP! Calling gameOver()');
                this.remainingTime = 0; // 음수 방지
                this.gameOver();
                return;
            }
            
            // 시간이 10초 이하일 때 경고 표시
            if (this.remainingTime <= 10) {
                console.log(`[checkTimeLimit] ⚠️ Warning! Only ${this.remainingTime} seconds left`);
                this.showTimeWarning();
            }
        } else {
            console.log(`[checkTimeLimit] Skipped - gameMode: ${this.gameMode}, isGameActive: ${this.isGameActive}`);
        }
    }
    
    showTimeWarning() {
        const timeElement = document.getElementById('time');
        if (timeElement) {
            timeElement.style.color = '#ff4444';
            timeElement.style.animation = 'pulse 0.5s infinite';
        }
    }
    
    gameOver() {
        console.log('[gameOver] 🎮 GAME OVER called!');
        console.log(`[gameOver] Current level: ${this.currentLevel}, Total score: ${this.totalScore}`);
        
        this.isGameActive = false;
        clearInterval(this.gameTimer);
        
        // 최고 레벨 업데이트
        this.highestLevel = Math.max(this.highestLevel, this.currentLevel);
        
        console.log(`[gameOver] Highest level: ${this.highestLevel}`);
        
        // 게임 통계 계산 (갤러그 스타일)
        const gameTime = this.startTime ? (Date.now() - this.startTime) / 1000 : 0; // 초 단위
        
        // 현재 게임 결과 저장 (이름 입력 전)
        this.currentGameResult = {
            score: this.totalScore,
            level: this.highestLevel,
            moves: this.moves,
            gameTime: gameTime,
            rank: this.getRank(),
            date: new Date().toLocaleDateString()
        };
        
        // 게임 오버 이벤트 추적
        if (typeof gtag !== 'undefined') {
            gtag('event', 'game_over', {
                'game_name': 'cat_memory',
                'mode': 'progressive',
                'highest_level': this.highestLevel,
                'total_score': this.totalScore,
                'game_time': Math.round(gameTime)
            });
        }
        
        setTimeout(() => {
            this.showGameOver();
        }, 500);
    }
    
    updateGameInfo() {
        // 레벨 (점진적 모드에서만)
        if (this.gameMode === 'progressive') {
            document.getElementById('currentLevel').textContent = this.currentLevel;
        }
        
        // 이동 횟수
        document.getElementById('moves').textContent = this.moves;
        
        // 시간 표시 (점진적 모드에서는 남은 시간, 고정 모드에서는 경과 시간)
        if (this.gameMode === 'progressive') {
            const minutes = Math.floor(this.remainingTime / 60);
            const seconds = this.remainingTime % 60;
            document.getElementById('time').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else if (this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('time').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // 매치된 쌍
        document.getElementById('matches').textContent = this.matchedPairs;
    }
    
    updateFinalStats() {
        if (this.gameMode === 'progressive') {
            // 점진적 모드에서는 총 점수와 최고 레벨 표시 (갤러그 스타일)
            // HTML 구조: finalMoves(최고 레벨), finalTime(총 점수), finalDifficulty(모드), finalScore(랭크)
            
            // 최고 레벨
            document.getElementById('finalMoves').textContent = this.highestLevel;
            
            // 총 점수
            document.getElementById('finalTime').textContent = this.totalScore.toLocaleString();
            
            // 모드
            document.getElementById('finalDifficulty').textContent = '점진적 모드';
            
            // 랭크
            document.getElementById('finalScore').textContent = this.getRank();
            
            // 플레이어 이름 입력 필드 초기화
            const playerNameInput = document.getElementById('playerName');
            if (playerNameInput) {
                playerNameInput.value = '';
            }
        } else {
            // 고정 난이도 모드
            const config = this.fixedDifficultyConfig[this.difficulty];
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const score = this.calculateScore();
            
            document.getElementById('finalMoves').textContent = this.moves;
            document.getElementById('finalTime').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            document.getElementById('finalDifficulty').textContent = this.getDifficultyText();
            document.getElementById('finalScore').textContent = score.toLocaleString();
        }
    }
    
    getDifficultyText() {
        if (this.gameMode === 'progressive') {
            return this.gameConfig[this.currentLevel]?.name || `레벨 ${this.currentLevel}`;
        } else {
            const difficultyTexts = {
                easy: '쉬움',
                medium: '보통',
                hard: '어려움'
            };
            return difficultyTexts[this.difficulty];
        }
    }
    
    getRank() {
        const score = this.totalScore;
        const level = this.highestLevel;
        
        if (level >= 15 && score >= 50000) return '🏆 고양이 마스터';
        if (level >= 12 && score >= 35000) return '🥇 고양이 전문가';
        if (level >= 10 && score >= 25000) return '🥈 고양이 고수';
        if (level >= 8 && score >= 18000) return '🥉 고양이 중급자';
        if (level >= 6 && score >= 12000) return '⭐ 고양이 초급자';
        if (level >= 4 && score >= 8000) return '🌟 고양이 입문자';
        if (level >= 2 && score >= 4000) return '🐱 고양이 애호가';
        return '🐾 고양이 친구';
    }
    
    pauseGame() {
        if (this.isGameActive) {
            this.isGameActive = false;
            clearInterval(this.gameTimer);
            // 일시정지 UI 표시 (간단한 알림)
            alert('게임이 일시정지되었습니다. ESC 키를 다시 눌러 계속하세요.');
            this.isGameActive = true;
            this.startTimer();
        }
    }
    
    restart() {
        if (this.gameMode === 'progressive') {
            this.startGame('progressive', this.currentLevel);
        } else {
            this.startGame(this.difficulty);
        }
    }
    
    backToStart() {
        this.showStartScreen();
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
    }
    
    saveGameWithName() {
        const playerName = document.getElementById('playerName').value.trim();
        
        if (!playerName) {
            // 이름 입력 필드에 포커스 (갤러그 스타일)
            document.getElementById('playerName').focus();
            document.getElementById('playerName').style.borderColor = '#ff4444';
            setTimeout(() => {
                document.getElementById('playerName').style.borderColor = '#0ff';
            }, 1000);
            return;
        }
        
        // 이름과 함께 기록 저장
        this.currentGameResult.name = playerName;
        
        // 랭킹에 추가 (갤러그 스타일)
        this.addToRanking(this.currentGameResult);
        
        // 게임 오버 화면 숨기기
        this.gameOverScreen.classList.remove('show');
        
        // 게임 상태 초기화
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.startTime = null;
        this.currentLevel = 1;
        this.totalScore = 0;
        this.highestLevel = 0;
        
        // 랭킹 화면 표시 (갤러그 스타일)
        this.showRecords();
    }
    
    showRecords() {
        this.updateRecordsDisplay();
        const recordsScreen = document.getElementById('recordsScreen');
        if (recordsScreen) {
            recordsScreen.style.display = 'block';
        }
    }
    
    hideRecords() {
        const recordsScreen = document.getElementById('recordsScreen');
        if (recordsScreen) {
            recordsScreen.style.display = 'none';
        }
        // 시작 화면으로 돌아가기
        this.showStartScreen();
    }
    
    updateRecordsDisplay() {
        const records = JSON.parse(localStorage.getItem('catMemoryRecords') || '[]');
        const rankingList = document.getElementById('rankingList');
        
        if (!rankingList) return;
        
        if (records.length === 0) {
            const currentLang = localStorage.getItem('language') || 'ko';
            const noRecordsMessage = currentLang === 'ko' 
                ? '아직 랭킹 기록이 없습니다.<br>게임을 플레이하고 이름을 등록해보세요!'
                : 'No ranking records yet.<br>Play the game and register your name!';
            rankingList.innerHTML = `<div class="record-item">${noRecordsMessage}</div>`;
        } else {
            rankingList.innerHTML = records
                .slice(0, 10) // TOP 10만 표시
                .map((record, index) => {
                    const rank = index + 1;
                    const rankClass = rank <= 3 ? `rank-${rank}` : '';
                    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                    
                    return `
                        <div class="ranking-item ${rankClass}">
                            <div class="ranking-rank">${rankEmoji}${rank}</div>
                            <div class="ranking-info">
                                <div class="ranking-name">${record.name}</div>
                                <div class="ranking-details">
                                    레벨 ${record.level} | ${record.rank} | ${record.date}
                                </div>
                            </div>
                            <div class="ranking-score">${record.score.toLocaleString()}</div>
                        </div>
                    `;
                }).join('');
        }
    }
    
    clearRecords() {
        const currentLang = localStorage.getItem('language') || 'ko';
        const confirmMessage = currentLang === 'ko' 
            ? '정말로 모든 기록을 삭제하시겠습니까?'
            : 'Are you sure you want to delete all records?';
        
        if (confirm(confirmMessage)) {
            localStorage.removeItem('catMemoryRecords');
            this.updateRecordsDisplay();
        }
    }
    
    addToRanking(gameResult) {
        // 랭킹 배열에 추가 (갤러그 스타일)
        const records = JSON.parse(localStorage.getItem('catMemoryRecords') || '[]');
        records.push(gameResult);
        
        // 점수 순으로 정렬 (내림차순)
        records.sort((a, b) => {
            if (a.score !== b.score) {
                return b.score - a.score;
            }
            return b.level - a.level;
        });
        
        // 상위 50개만 유지
        const topRecords = records.slice(0, 50);
        
        localStorage.setItem('catMemoryRecords', JSON.stringify(topRecords));
    }
    
    // 게임 기록 저장 (로컬 스토리지)
    saveGameRecord(playerName = '익명') {
        const record = {
            playerName: playerName,
            mode: this.gameMode,
            highestLevel: this.highestLevel,
            totalScore: this.totalScore,
            rank: this.getRank(),
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        const records = JSON.parse(localStorage.getItem('catMemoryRecords') || '[]');
        records.push(record);
        
        // 최고 기록 10개만 유지 (점수 기준으로 정렬)
        records.sort((a, b) => {
            if (a.totalScore !== b.totalScore) {
                return b.totalScore - a.totalScore;
            }
            return b.highestLevel - a.highestLevel;
        });
        const topRecords = records.slice(0, 10);
        
        localStorage.setItem('catMemoryRecords', JSON.stringify(topRecords));
    }
    
    calculateLevelScore() {
        const config = this.gameConfig[this.currentLevel];
        const usedTime = this.timeLimit - this.remainingTime;
        
        // 기본 점수 (레벨이 높을수록 더 많은 점수)
        const baseScore = this.currentLevel * 100;
        
        // 시간 보너스 (빠르게 완료할수록 더 많은 점수)
        const timeBonus = Math.max(0, this.remainingTime * 10);
        
        // 이동 횟수 보너스 (적게 움직일수록 더 많은 점수)
        const optimalMoves = config.pairs * 2;
        const moveBonus = Math.max(0, (optimalMoves - this.moves) * 5);
        
        // 레벨 보너스 (높은 레벨일수록 더 많은 보너스)
        const levelBonus = this.currentLevel * 50;
        
        return Math.max(0, baseScore + timeBonus + moveBonus + levelBonus);
    }
    
    calculateScore() {
        let config;
        if (this.gameMode === 'progressive') {
            config = this.gameConfig[this.currentLevel];
        } else {
            config = this.fixedDifficultyConfig[this.difficulty];
        }
        
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const timeBonus = Math.max(0, 300 - elapsed);
        const moveBonus = Math.max(0, (config.pairs * 2) - this.moves);
        const levelBonus = this.gameMode === 'progressive' ? this.currentLevel * 50 : 0;
        return Math.max(0, (config.pairs * 100) + timeBonus + moveBonus + levelBonus);
    }
    
    // 게임 기록 불러오기
    getGameRecords() {
        return JSON.parse(localStorage.getItem('catMemoryRecords') || '[]');
    }
    
    // 게임 기록 초기화
    clearGameRecords() {
        localStorage.removeItem('catMemoryRecords');
    }
}

// 게임 인스턴스 생성
const game = new CatMemoryGame();

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 언어 설정 확인
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang') || 'ko';
    
    // 다국어 지원 (간단한 버전)
    if (lang === 'en') {
        // 영어 텍스트로 변경
        document.querySelector('[data-i18n="gameTitle"]').textContent = '🐱 Cat Memory Game';
        document.querySelector('[data-i18n="gameSubtitle"]').textContent = 'Cute cat memory matching game';
        document.querySelector('[data-i18n="backToGameCenter"]').textContent = '← Game Center';
        document.querySelector('[data-i18n="startTitle"]').textContent = '🐱 Cat Memory Game';
        document.querySelector('[data-i18n="startDescription"]').textContent = 'Match the cute cat pictures!';
        document.querySelector('[data-i18n="startInstructions"]').textContent = 'Start from 2x2 and progress through increasingly difficult levels';
        document.querySelector('[data-i18n="startGameButton"]').textContent = 'Start Game';
        document.querySelector('[data-i18n="gameOverTitle"]').textContent = '⏰ Time Over! ⏰';
        document.querySelector('[data-i18n="playAgainButton"]').textContent = 'Play Again';
        document.querySelector('[data-i18n="backToMenu"]').textContent = 'Back to Menu';
        document.querySelector('[data-i18n="levelLabel"]').textContent = 'Level';
        document.querySelector('[data-i18n="movesLabel"]').textContent = 'Moves';
        document.querySelector('[data-i18n="timeLabel"]').textContent = 'Time';
        document.querySelector('[data-i18n="matchesLabel"]').textContent = 'Matches';
        document.querySelector('[data-i18n="controlsLabel"]').textContent = 'Controls:';
        document.querySelector('[data-i18n="controlsText"]').textContent = 'Click cards to flip and find matching pairs!';
        document.querySelector('[data-i18n="levelCompleteTitle"]').textContent = '🎉 Level Complete! 🎉';
        document.querySelector('[data-i18n="levelName"]').textContent = 'Level';
        document.querySelector('[data-i18n="currentScore"]').textContent = 'Score';
        document.querySelector('[data-i18n="levelTime"]').textContent = 'Time';
        document.querySelector('[data-i18n="levelMoves"]').textContent = 'Moves';
        document.querySelector('[data-i18n="nextLevelText"]').textContent = 'Next Level:';
        document.querySelector('[data-i18n="nextLevelButton"]').textContent = 'Next Level';
        document.querySelector('[data-i18n="finalMoves"]').textContent = 'Highest Level';
        document.querySelector('[data-i18n="finalTime"]').textContent = 'Total Score';
        document.querySelector('[data-i18n="difficulty"]').textContent = 'Mode';
        document.querySelector('[data-i18n="score"]').textContent = 'Rank';
        document.querySelector('[data-i18n="playerNameLabel"]').textContent = 'Enter your name:';
        document.querySelector('[data-i18n="saveRecordButton"]').textContent = 'Save Record';
        // Old stage title system removed - now using dynamic overlays
    }
});

// 모바일 터치 이벤트 최적화
document.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('memory-card')) {
        e.preventDefault();
    }
}, { passive: false });

// 게임 보드 터치 이벤트
document.addEventListener('touchend', (e) => {
    if (e.target.classList.contains('memory-card')) {
        e.preventDefault();
        const cardId = e.target.dataset.index;
        if (cardId !== undefined) {
            game.flipCard(parseInt(cardId));
        }
    }
}, { passive: false });
