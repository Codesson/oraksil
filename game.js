// 갤러그 게임 JavaScript 구현

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // 게임 상태
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.keys = {};
        
        // 게임 기록 시스템
        this.gameStats = {
            startTime: null,
            totalEnemiesKilled: 0,
            totalShots: 0,
            accuracy: 0
        };
        
        // 저장된 기록 불러오기
        this.loadGameRecords();
        
        // 게임 객체들
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        
        // 효과
        this.screenFlash = 0;
        
        // 플래그
        this.showRecordsAfterSave = false;
        
        // 타이밍
        this.lastTime = 0;
        this.enemySpawnTimer = 0;
        this.enemyShootTimer = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.player = new Player(this.width / 2, this.height - 60);
        this.displayRecords();
        this.gameLoop();
    }
    
    loadGameRecords() {
        try {
            const savedRecords = localStorage.getItem('galagaGameRecords');
            if (savedRecords) {
                this.records = JSON.parse(savedRecords);
                // 기존 기록과 호환성을 위해 rankings 배열이 없으면 추가
                if (!this.records.rankings) {
                    this.records.rankings = [];
                }
            } else {
                this.records = {
                    highScore: 0,
                    totalGamesPlayed: 0,
                    totalTimePlayed: 0,
                    bestAccuracy: 0,
                    mostEnemiesKilled: 0,
                    recentScores: [],
                    rankings: [] // 이름과 함께 저장되는 랭킹 리스트
                };
            }
        } catch (e) {
            console.log('기록 불러오기 실패:', e);
            this.records = {
                highScore: 0,
                totalGamesPlayed: 0,
                totalTimePlayed: 0,
                bestAccuracy: 0,
                mostEnemiesKilled: 0,
                recentScores: [],
                rankings: []
            };
        }
    }
    
    saveGameRecords() {
        try {
            localStorage.setItem('galagaGameRecords', JSON.stringify(this.records));
        } catch (e) {
            console.log('기록 저장 실패:', e);
        }
    }
    
    displayRecords() {
        // 기록 관련 함수 (필요시 확장 가능)
    }
    
    setupEventListeners() {
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Space') {
                e.preventDefault();
            }
            
            if (e.code === 'KeyR') {
                // 입력 필드에 포커스가 있을 때는 재시작하지 않음
                if (document.activeElement.tagName !== 'INPUT') {
                    this.restart();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    start() {
        document.getElementById('startScreen').style.display = 'none';
        this.gameStats.startTime = Date.now();
        this.gameStats.totalEnemiesKilled = 0;
        this.gameStats.totalShots = 0;
        this.showStageDisplay();
    }
    
    restart() {
        document.getElementById('gameOver').style.display = 'none';
        this.gameState = 'playing';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.player = new Player(this.width / 2, this.height - 60);
        this.gameStats.startTime = Date.now();
        this.gameStats.totalEnemiesKilled = 0;
        this.gameStats.totalShots = 0;
        this.spawnEnemyWave();
        this.updateUI();
    }
    
    spawnEnemyWave() {
        this.enemies = [];
        
        // 레벨에 따른 난이도 조정
        const baseRows = 2 + Math.floor(this.level / 2); // 레벨이 올라갈 때마다 행 수 증가
        const baseCols = 4 + Math.floor(this.level / 3); // 레벨이 올라갈 때마다 열 수 증가
        
        const rows = Math.min(baseRows, 6); // 최대 6행
        const cols = Math.min(baseCols, 10); // 최대 10열
        
        // 레벨에 따른 크기 조정 (레벨이 높을수록 더 큰 적)
        const sizeMultiplier = 1 + (this.level - 1) * 0.15; // 레벨마다 15% 크기 증가
        
        const spacing = Math.max(60, 100 - this.level * 5); // 레벨이 높을수록 더 촘촘하게
        const startX = (this.width - (cols - 1) * spacing) / 2;
        const startY = 80;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * spacing;
                const y = startY + row * 50;
                
                // 레벨에 따른 적 타입 분포 조정
                let type = 'basic';
                if (this.level >= 2 && Math.random() < 0.2) {
                    type = 'zigzag';
                } else if (this.level >= 3 && row >= Math.floor(rows / 2)) {
                    type = 'advanced';
                } else if (this.level >= 4 && Math.random() < 0.15) {
                    type = 'circler';
                } else if (this.level >= 5 && row >= Math.floor(rows * 0.7)) {
                    type = 'boss';
                } else if (this.level >= 6 && Math.random() < 0.1) {
                    type = 'diver';
                }
                
                this.enemies.push(new Enemy(x, y, type, sizeMultiplier));
            }
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing' && this.gameState !== 'stagePause') return;
        
        // 스테이지 전환 중에는 게임 로직 업데이트 중단
        if (this.gameState === 'stagePause') return;
        
        // 스페이스바를 누르고 있으면 연속 발사 (플레이어 업데이트 전에 처리)
        if (this.keys['Space']) {
            this.player.shoot();
        }
        
        // 플레이어 업데이트
        this.player.update(deltaTime, this.keys);
        
        // 적들 업데이트 및 화면 아래로 지나간 적 체크
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime);
            
            // 적이 화면 아래로 지나갔을 때
            if (enemy.y > this.height) {
                this.lives--; // 생명 감소
                this.enemies.splice(i, 1); // 적 제거
                
                // 경고 효과
                this.createWarningEffect();
                
                if (this.lives <= 0) {
                    this.gameOver();
                    return;
                }
            }
        }
        
        // 총알들 업데이트
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.y > 0;
        });
        
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.y < this.height;
        });
        
        // 파티클 업데이트
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.life > 0;
        });
        
        // 화면 깜빡임 효과 업데이트
        if (this.screenFlash > 0) {
            this.screenFlash -= deltaTime;
        }
        
        // 적 발사 (레벨에 따라 빈도 증가)
        this.enemyShootTimer += deltaTime;
        const shootInterval = Math.max(500, 1500 - this.level * 100); // 레벨이 높을수록 더 자주 발사
        if (this.enemyShootTimer > shootInterval + Math.random() * 1000) {
            this.enemyShootTimer = 0;
            const shootingEnemies = this.enemies.filter(enemy => enemy.canShoot());
            if (shootingEnemies.length > 0) {
                // 레벨이 높을 경우 여러 적이 동시에 발사할 수 있음
                const numShooters = Math.min(Math.floor(this.level / 3) + 1, 3);
                for (let i = 0; i < numShooters && i < shootingEnemies.length; i++) {
                    const randomEnemy = shootingEnemies[Math.floor(Math.random() * shootingEnemies.length)];
                    randomEnemy.shoot();
                }
            }
        }
        
        // 충돌 감지
        this.checkCollisions();
        
        // 게임 상태 체크
        if (this.enemies.length === 0) {
            this.level++;
            this.showStageDisplay();
        }
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    checkCollisions() {
        // 플레이어 총알과 적의 충돌
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (this.isColliding(bullet, enemy)) {
                    // 적 체력 감소
                    enemy.health--;
                    
                    // 총알 제거
                    this.bullets.splice(i, 1);
                    
                    // 적이 죽었을 때만 폭발 효과와 점수
                    if (enemy.health <= 0) {
                        // 폭발 효과
                        this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                        this.playExplosionSound();
                        
                        // 점수 추가 (타입과 크기에 따라)
                        let baseScore = this.getScoreByType(enemy.type);
                        this.score += Math.floor(baseScore * enemy.sizeMultiplier);
                        
                        // 적 처치 통계 업데이트
                        this.gameStats.totalEnemiesKilled++;
                        
                        // 적 제거
                        this.enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }
        
        // 적 총알과 플레이어의 충돌
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            if (this.isColliding(bullet, this.player)) {
                this.createExplosion(this.player.x, this.player.y);
                this.lives--;
                this.enemyBullets.splice(i, 1);
                
                // 플레이어 무적 시간
                this.player.invulnerable = 2000;
                break;
            }
        }
        
        // 적과 플레이어의 직접 충돌
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (this.isColliding(enemy, this.player) && this.player.invulnerable <= 0) {
                this.createExplosion(this.player.x, this.player.y);
                this.lives--;
                this.enemies.splice(i, 1);
                this.player.invulnerable = 2000;
                break;
            }
        }
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y));
        }
    }
    
    createWarningEffect() {
        // 화면 가장자리에 경고 파티클 생성
        for (let i = 0; i < 20; i++) {
            this.particles.push(new WarningParticle(Math.random() * this.width, this.height - 10));
        }
        
        // 화면 깜빡임 효과
        this.screenFlash = 500; // 500ms 동안 깜빡임
        
        // 경고음
        this.playWarningSound();
    }
    
    playExplosionSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.type = 'sawtooth';
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // 사운드 재생 실패 시 무시
        }
    }
    
    playWarningSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 경고음: 높은 음에서 낮은 음으로
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(400, audioContext.currentTime + 0.2);
            oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.4);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.type = 'triangle';
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // 사운드 재생 실패 시 무시
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // 게임 통계 계산
        const gameTime = (Date.now() - this.gameStats.startTime) / 1000; // 초 단위
        const accuracy = this.gameStats.totalShots > 0 ? 
            Math.round((this.gameStats.totalEnemiesKilled / this.gameStats.totalShots) * 100) : 0;
        
        // 현재 게임 결과 저장 (이름 입력 전)
        this.currentGameResult = {
            score: this.score,
            level: this.level,
            enemiesKilled: this.gameStats.totalEnemiesKilled,
            accuracy: accuracy,
            gameTime: gameTime,
            date: new Date().toLocaleDateString()
        };
        
        // UI 업데이트
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameTime').textContent = Math.floor(gameTime);
        document.getElementById('enemiesKilled').textContent = this.gameStats.totalEnemiesKilled;
        document.getElementById('accuracy').textContent = accuracy;
        document.getElementById('playerName').value = ''; // 입력 필드 초기화
        document.getElementById('gameOver').style.display = 'block';
        
        // 새 기록인지 확인
        if (this.score > this.records.highScore) {
            document.getElementById('newRecord').style.display = 'block';
        }
    }
    
    saveGameWithName() {
        const playerName = document.getElementById('playerName').value.trim();
        
        if (!playerName) {
            // 이름 입력 필드에 포커스
            document.getElementById('playerName').focus();
            document.getElementById('playerName').style.borderColor = '#ff4444';
            setTimeout(() => {
                document.getElementById('playerName').style.borderColor = '#0ff';
            }, 1000);
            return;
        }
        
        // 이름과 함께 기록 저장
        this.currentGameResult.name = playerName;
        
        // 기존 기록 업데이트
        this.updateGameRecords(this.currentGameResult.gameTime, this.currentGameResult.accuracy);
        
        // 랭킹에 추가
        this.addToRanking(this.currentGameResult);
        
        // 게임 오버 화면 숨기기
        document.getElementById('gameOver').style.display = 'none';
        
        // 게임 상태 초기화 (시작 화면은 나중에 표시)
        this.gameState = 'start';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.screenFlash = 0;
        this.player = new Player(this.width / 2, this.height - 60);
        
        // UI 업데이트
        this.updateUI();
        
        // 랭킹 화면 표시 (기록 저장 후)
        this.showRecordsAfterSave = true; // 저장 후 랭킹 표시 플래그
        this.showRecords();
    }
    
    addToRanking(gameResult) {
        // 랭킹 배열에 추가
        this.records.rankings.push(gameResult);
        
        // 점수 순으로 정렬 (내림차순)
        this.records.rankings.sort((a, b) => b.score - a.score);
        
        // 상위 50개만 유지
        if (this.records.rankings.length > 50) {
            this.records.rankings = this.records.rankings.slice(0, 50);
        }
        
        // 기록 저장
        this.saveGameRecords();
    }
    
    updateGameRecords(gameTime, accuracy) {
        // 최고 점수 업데이트
        if (this.score > this.records.highScore) {
            this.records.highScore = this.score;
        }
        
        // 최고 정확도 업데이트
        if (accuracy > this.records.bestAccuracy) {
            this.records.bestAccuracy = accuracy;
        }
        
        // 최다 적 처치 업데이트
        if (this.gameStats.totalEnemiesKilled > this.records.mostEnemiesKilled) {
            this.records.mostEnemiesKilled = this.gameStats.totalEnemiesKilled;
        }
        
        // 전체 통계 업데이트
        this.records.totalGamesPlayed++;
        this.records.totalTimePlayed += gameTime;
        
        // 최근 점수 기록 (최대 10개)
        this.records.recentScores.unshift({
            score: this.score,
            level: this.level,
            enemiesKilled: this.gameStats.totalEnemiesKilled,
            accuracy: accuracy,
            date: new Date().toLocaleDateString()
        });
        
        if (this.records.recentScores.length > 10) {
            this.records.recentScores.pop();
        }
        
        // 기록 저장
        this.saveGameRecords();
        this.displayRecords();
    }
    
    getScoreByType(enemyType) {
        switch(enemyType) {
            case 'basic': return 100;
            case 'zigzag': return 150;
            case 'advanced': return 200;
            case 'circler': return 250;
            case 'boss': return 500;
            case 'diver': return 300;
            default: return 100;
        }
    }
    
    showRecords() {
        this.updateRecordsDisplay();
        document.getElementById('recordsScreen').style.display = 'block';
    }
    
    hideRecords() {
        document.getElementById('recordsScreen').style.display = 'none';
        
        // 기록 저장 후 랭킹을 본 경우, 시작 화면 표시
        if (this.showRecordsAfterSave) {
            this.showRecordsAfterSave = false; // 플래그 리셋
            document.getElementById('startScreen').style.display = 'block';
        }
        // 시작 화면에서 기록 보기를 한 경우, 다시 시작 화면으로 돌아가기
        else if (this.gameState === 'start') {
            document.getElementById('startScreen').style.display = 'block';
        }
    }
    
    updateRecordsDisplay() {
        // 랭킹 리스트 표시
        const rankingList = document.getElementById('rankingList');
        if (!this.records.rankings || this.records.rankings.length === 0) {
            rankingList.innerHTML = '<div class="record-item">아직 랭킹 기록이 없습니다.<br>게임을 플레이하고 이름을 등록해보세요!</div>';
        } else {
            rankingList.innerHTML = this.records.rankings
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
                                    스테이지 ${record.level} | 적 ${record.enemiesKilled}마리 | 명중률 ${record.accuracy}% | ${record.date}
                                </div>
                            </div>
                            <div class="ranking-score">${record.score.toLocaleString()}</div>
                        </div>
                    `;
                }).join('');
        }
        
        // 전체 기록 표시
        const overallRecords = document.getElementById('overallRecords');
        overallRecords.innerHTML = `
            <div class="record-item">
                <strong>최고 점수:</strong> ${this.records.highScore.toLocaleString()}점
            </div>
            <div class="record-item">
                <strong>등록된 플레이어:</strong> ${this.records.rankings.length}명
            </div>
            <div class="record-item">
                <strong>플레이한 게임:</strong> ${this.records.totalGamesPlayed}회
            </div>
            <div class="record-item">
                <strong>총 플레이 시간:</strong> ${Math.floor(this.records.totalTimePlayed / 60)}분 ${Math.floor(this.records.totalTimePlayed % 60)}초
            </div>
            <div class="record-item">
                <strong>최고 명중률:</strong> ${this.records.bestAccuracy}%
            </div>
            <div class="record-item">
                <strong>최다 적 처치:</strong> ${this.records.mostEnemiesKilled}마리
            </div>
        `;
    }
    
    clearRecords() {
        if (confirm('정말로 모든 기록을 삭제하시겠습니까?')) {
            this.records = {
                highScore: 0,
                totalGamesPlayed: 0,
                totalTimePlayed: 0,
                bestAccuracy: 0,
                mostEnemiesKilled: 0,
                recentScores: [],
                rankings: []
            };
            this.saveGameRecords();
            this.updateRecordsDisplay();
            // alert 대신 자동으로 화면만 업데이트
        }
    }
    
    showStageDisplay() {
        // 게임 일시 정지
        this.gameState = 'stagePause';
        
        // 스테이지 번호 업데이트
        document.getElementById('stageNumber').textContent = this.level;
        document.getElementById('stageDisplay').style.display = 'block';
        
        // 2초 후 게임 재시작
        setTimeout(() => {
            this.hideStageDisplay();
        }, 2000);
    }
    
    hideStageDisplay() {
        document.getElementById('stageDisplay').style.display = 'none';
        this.gameState = 'playing';
        this.spawnEnemyWave();
    }
    
    render() {
        // 화면 클리어
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 별 배경 그리기
        this.drawStars();
        
        if (this.gameState === 'playing') {
            // 플레이어 그리기
            this.player.render(this.ctx);
            
            // 적들 그리기
            this.enemies.forEach(enemy => enemy.render(this.ctx));
            
            // 총알들 그리기
            this.bullets.forEach(bullet => bullet.render(this.ctx));
            this.enemyBullets.forEach(bullet => bullet.render(this.ctx));
            
            // 파티클들 그리기
            this.particles.forEach(particle => particle.render(this.ctx));
            
            // 화면 깜빡임 효과
            if (this.screenFlash > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillRect(0, 0, this.width, this.height);
                this.ctx.restore();
            }
            
            // 화면 내 UI 그리기
            this.drawInGameUI();
        }
        
        this.updateUI();
    }
    
    drawStars() {
        this.ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % this.width;
            const y = (i * 67) % this.height;
            const size = Math.sin(Date.now() * 0.001 + i) * 0.5 + 1;
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    drawInGameUI() {
        this.ctx.save();
        
        // 폰트 설정
        this.ctx.font = 'bold 20px "Courier New", monospace';
        this.ctx.textAlign = 'left';
        
        // 점수 표시 (왼쪽 상단)
        this.ctx.fillStyle = '#0ff';
        this.ctx.shadowColor = '#0ff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, 20, 35);
        
        // 스테이지 표시 (오른쪽 상단)
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`STAGE: ${this.level}`, this.width - 20, 35);
        
        // 생명 표시 (왼쪽 하단에 비행기 아이콘들)
        this.drawLives();
        
        this.ctx.restore();
    }
    
    drawLives() {
        const lifeIconSize = 20;
        const spacing = 30;
        const startX = 20;
        const startY = this.height - 30;
        
        this.ctx.save();
        
        for (let i = 0; i < this.lives; i++) {
            const x = startX + i * spacing;
            const y = startY;
            
            // 비행기 모양 그리기
            this.ctx.fillStyle = '#0ff';
            this.ctx.shadowColor = '#0ff';
            this.ctx.shadowBlur = 5;
            
            // 비행기 본체
            this.ctx.beginPath();
            this.ctx.moveTo(x + lifeIconSize/2, y);
            this.ctx.lineTo(x, y + lifeIconSize);
            this.ctx.lineTo(x + lifeIconSize/4, y + lifeIconSize * 0.7);
            this.ctx.lineTo(x + lifeIconSize * 0.75, y + lifeIconSize * 0.7);
            this.ctx.lineTo(x + lifeIconSize, y + lifeIconSize);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    updateUI() {
        // 모든 UI가 게임 화면 내부로 이동했으므로 더 이상 필요 없음
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
        this.speed = 300; // pixels per second
        this.shootCooldown = 0;
        this.invulnerable = 0;
    }
    
    update(deltaTime, keys) {
        // 무적 시간 감소
        if (this.invulnerable > 0) {
            this.invulnerable -= deltaTime;
        }
        
        // 이동
        if (keys['ArrowLeft'] && this.x > 0) {
            this.x -= this.speed * deltaTime / 1000;
        }
        if (keys['ArrowRight'] && this.x < game.width - this.width) {
            this.x += this.speed * deltaTime / 1000;
        }
        if (keys['ArrowUp'] && this.y > 0) {
            this.y -= this.speed * deltaTime / 1000;
        }
        if (keys['ArrowDown'] && this.y < game.height - this.height) {
            this.y += this.speed * deltaTime / 1000;
        }
        
        // 발사 쿨다운
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
    }
    
    shoot() {
        if (this.shootCooldown <= 0) {
            game.bullets.push(new Bullet(this.x + this.width / 2, this.y, -400, '#0ff'));
            this.shootCooldown = 200; // 200ms cooldown
            this.playSound('shoot');
            
            // 발사 통계 업데이트
            game.gameStats.totalShots++;
        }
    }
    
    playSound(type) {
        // Web Audio API를 사용한 간단한 사운드 생성
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'shoot') {
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // 무적 시간 중에는 깜빡임
        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // 플레이어 우주선 그리기
        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 4, this.y + this.height * 0.7);
        ctx.lineTo(this.x + this.width * 0.75, this.y + this.height * 0.7);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        // 엔진 불꽃
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x + this.width * 0.3, this.y + this.height, this.width * 0.1, 8);
        ctx.fillRect(this.x + this.width * 0.6, this.y + this.height, this.width * 0.1, 8);
        
        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, type = 'basic', sizeMultiplier = 1) {
        this.x = x;
        this.y = y;
        this.baseWidth = 30;
        this.baseHeight = 25;
        this.width = this.baseWidth * sizeMultiplier;
        this.height = this.baseHeight * sizeMultiplier;
        this.type = type;
        this.speed = 50 + (sizeMultiplier - 1) * 20; // 큰 적일수록 조금 더 빠름
        this.direction = 1;
        this.shootCooldown = 0;
        this.moveTimer = 0;
        this.originalX = x;
        this.sizeMultiplier = sizeMultiplier;
        
        // 타입별 체력 설정
        this.maxHealth = this.getHealthByType();
        this.health = this.maxHealth;
        
        // 움직임 패턴별 변수들
        this.zigzagDirection = Math.random() < 0.5 ? -1 : 1;
        this.circleRadius = 40;
        this.circleAngle = 0;
        this.isDiving = false;
        this.diveSpeed = 0;
    }
    
    getHealthByType() {
        switch(this.type) {
            case 'basic': return 1;
            case 'zigzag': return 1;
            case 'advanced': return 2;
            case 'circler': return 2;
            case 'boss': return 3;
            case 'diver': return 2;
            default: return 1;
        }
    }
    
    update(deltaTime) {
        this.moveTimer += deltaTime;
        
        // 타입별 움직임 패턴
        switch(this.type) {
            case 'basic':
                this.updateBasicMovement(deltaTime);
                break;
            case 'zigzag':
                this.updateZigzagMovement(deltaTime);
                break;
            case 'advanced':
                this.updateAdvancedMovement(deltaTime);
                break;
            case 'circler':
                this.updateCirclerMovement(deltaTime);
                break;
            case 'boss':
                this.updateBossMovement(deltaTime);
                break;
            case 'diver':
                this.updateDiverMovement(deltaTime);
                break;
        }
        
        // 발사 쿨다운
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
    }
    
    updateBasicMovement(deltaTime) {
        // 기본 좌우 진동 이동
        this.x = this.originalX + Math.sin(this.moveTimer * 0.002) * 50;
        
        // 천천히 아래로 이동
        const downwardSpeed = 0.1 + (game.level - 1) * 0.02;
        this.y += this.speed * deltaTime / 1000 * downwardSpeed;
    }
    
    updateZigzagMovement(deltaTime) {
        // 지그재그 움직임
        this.x += this.zigzagDirection * this.speed * deltaTime / 1000 * 0.5;
        
        // 화면 경계에서 방향 전환
        if (this.x < 50 || this.x > game.width - 50) {
            this.zigzagDirection *= -1;
        }
        
        // 아래로 이동
        const downwardSpeed = 0.15 + (game.level - 1) * 0.02;
        this.y += this.speed * deltaTime / 1000 * downwardSpeed;
    }
    
    updateAdvancedMovement(deltaTime) {
        // 고급형: 더 빠른 좌우 진동
        this.x = this.originalX + Math.sin(this.moveTimer * 0.004) * 70;
        
        // 조금 더 빠른 하강
        const downwardSpeed = 0.12 + (game.level - 1) * 0.02;
        this.y += this.speed * deltaTime / 1000 * downwardSpeed;
    }
    
    updateCirclerMovement(deltaTime) {
        // 원형 움직임
        this.circleAngle += deltaTime * 0.003;
        this.x = this.originalX + Math.cos(this.circleAngle) * this.circleRadius;
        const verticalOffset = Math.sin(this.circleAngle) * 20;
        
        // 아래로 이동하면서 원형 패턴
        const downwardSpeed = 0.08 + (game.level - 1) * 0.02;
        this.y += this.speed * deltaTime / 1000 * downwardSpeed + verticalOffset * deltaTime / 1000;
    }
    
    updateBossMovement(deltaTime) {
        // 보스: 느린 좌우 이동과 가끔 급격한 움직임
        const slowWave = Math.sin(this.moveTimer * 0.001) * 80;
        const fastWave = Math.sin(this.moveTimer * 0.01) * 20;
        this.x = this.originalX + slowWave + fastWave;
        
        // 매우 느린 하강
        const downwardSpeed = 0.05 + (game.level - 1) * 0.01;
        this.y += this.speed * deltaTime / 1000 * downwardSpeed;
    }
    
    updateDiverMovement(deltaTime) {
        // 다이버: 가끔 급강하
        if (!this.isDiving && Math.random() < 0.0005) {
            this.isDiving = true;
            this.diveSpeed = 200;
        }
        
        if (this.isDiving) {
            // 급강하
            this.y += this.diveSpeed * deltaTime / 1000;
            this.diveSpeed += 50 * deltaTime / 1000; // 가속
            
            // 화면 밖으로 나가면 다이빙 종료
            if (this.y > game.height + 50) {
                this.isDiving = false;
                this.diveSpeed = 0;
            }
        } else {
            // 일반적인 움직임
            this.x = this.originalX + Math.sin(this.moveTimer * 0.003) * 30;
            const downwardSpeed = 0.08 + (game.level - 1) * 0.02;
            this.y += this.speed * deltaTime / 1000 * downwardSpeed;
        }
    }
    
    getColorByType() {
        switch(this.type) {
            case 'basic': return '#ff4444';      // 빨간색
            case 'zigzag': return '#44ff44';     // 녹색
            case 'advanced': return '#ff8844';   // 주황색
            case 'circler': return '#4488ff';    // 파란색
            case 'boss': return '#ff2266';       // 진한 빨간색
            case 'diver': return '#ff44ff';      // 자주색
            default: return '#ff4444';
        }
    }
    
    getDamagedColor() {
        switch(this.type) {
            case 'basic': return '#ff6666';
            case 'zigzag': return '#66ff66';
            case 'advanced': return '#ffaa66';
            case 'circler': return '#66aaff';
            case 'boss': return '#ff4488';
            case 'diver': return '#ff66ff';
            default: return '#ff6666';
        }
    }
    
    canShoot() {
        return this.shootCooldown <= 0 && Math.random() < 0.001;
    }
    
    shoot() {
        if (this.canShoot()) {
            game.enemyBullets.push(new Bullet(this.x + this.width / 2, this.y + this.height, 300, '#ff4444'));
            this.shootCooldown = 1000 + Math.random() * 2000;
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // 타입에 따른 색상 설정
        let fillColor = this.getColorByType();
        if (this.health < this.maxHealth) {
            // 피격 시 밝은 색상으로 변경
            fillColor = this.getDamagedColor();
        }
        
        ctx.fillStyle = fillColor;
        
        // 크기에 따른 글로우 효과
        if (this.sizeMultiplier > 1.2) {
            ctx.shadowColor = fillColor;
            ctx.shadowBlur = 10 * this.sizeMultiplier;
        }
        
        // 적 우주선 그리기 (크기 적용)
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height);
        ctx.lineTo(this.x, this.y);
        ctx.lineTo(this.x + this.width / 4, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width * 0.75, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.closePath();
        ctx.fill();
        
        // 보스 타입일 경우 추가 디테일
        if (this.type === 'boss') {
            ctx.fillStyle = '#ffff44';
            ctx.fillRect(this.x + this.width * 0.2, this.y + this.height * 0.1, this.width * 0.6, this.height * 0.2);
        }
        
        // 적 우주선 중앙 디테일
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + this.width * 0.4, this.y + this.height * 0.2, this.width * 0.2, this.height * 0.3);
        
        // 체력 바 (체력이 1보다 많은 경우)
        if (this.maxHealth > 1) {
            const barWidth = this.width * 0.8;
            const barHeight = 3;
            const barX = this.x + this.width * 0.1;
            const barY = this.y - 8;
            
            // 배경
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // 체력
            ctx.fillStyle = '#4f4';
            ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
        }
        
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, speed, color) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 8;
        this.speed = speed;
        this.color = color;
    }
    
    update(deltaTime) {
        this.y += this.speed * deltaTime / 1000;
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
        
        // 총알 글로우 효과
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 200;
        this.vy = (Math.random() - 0.5) * 200;
        this.life = 1000;
        this.maxLife = 1000;
        this.size = Math.random() * 3 + 1;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime / 1000;
        this.y += this.vy * deltaTime / 1000;
        this.life -= deltaTime;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

class WarningParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 100;
        this.vy = -Math.random() * 150 - 50; // 위로 향하는 속도
        this.life = 800;
        this.maxLife = 800;
        this.size = Math.random() * 4 + 2;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime / 1000;
        this.y += this.vy * deltaTime / 1000;
        this.life -= deltaTime;
        this.vx *= 0.95;
        this.vy *= 0.98;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff8800'; // 주황색 경고 파티클
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 5;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

// 게임 인스턴스 생성
const game = new Game();
