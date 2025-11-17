// Game classes
class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    createJumpParticles(x, y) {
        const count = 3 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 40,
                y: y + 10,
                velocityX: (Math.random() - 0.5) * 400,
                velocityY: -Math.random() * 100 - 50,
                life: 0.8 + Math.random() * 0.4,
                maxLife: 0.8 + Math.random() * 0.4,
                size: 1.5 + Math.random() * 2.4,
                color: Math.random() < 0.5 ? '#FFD700' : '#ffd11a'
            });
        }
    }
    
    update(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.velocityX * deltaTime;
            particle.y += particle.velocityY * deltaTime;
            particle.velocityY += 300 * deltaTime;
            particle.life -= deltaTime;
            
            return particle.life > 0;
        });
    }
    
    render(ctx) {
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.collected = false;
        this.value = 1;
        this.rotation = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.originalY = y;
    }
    
    update(deltaTime) {
        this.y = this.originalY + Math.sin(Date.now() * 0.003 + this.bobOffset) * 5;
        return !this.collected;
    }
    
    collect() {
        if (!this.collected) {
            this.collected = true;
            return true;
        }
        return false;
    }
    
    getBounds() {
        return {
            left: this.x - this.width/2,
            right: this.x + this.width/2,
            top: this.y - this.height/2,
            bottom: this.y + this.height/2
        };
    }
    
    render(ctx) {
        if (this.collected) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const coinGradient = ctx.createRadialGradient(-5, -5, 0, 0, 0, this.width/2);
        coinGradient.addColorStop(0, '#FFED4E');
        coinGradient.addColorStop(0.7, '#FFD700');
        coinGradient.addColorStop(1, '#DAA520');
        ctx.fillStyle = coinGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(0, 0, this.width/3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(-4, -4, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.width = width;
        this.height = height;
        this.target = null;
        this.smoothing = 0.1;
    }
    
    follow(target) {
        this.target = target;
    }
    
    update(deltaTime) {
        if (this.target) {
            this.targetY = this.target.y - this.height / 2;
            this.targetX = this.target.x - this.width / 2;
        }
        
        this.x += (this.targetX - this.x) * this.smoothing;
        this.y += (this.targetY - this.y) * this.smoothing;
    }
    
    applyTransform(ctx) {
        ctx.save();
        ctx.translate(-this.x, -this.y);
    }
    
    restoreTransform(ctx) {
        ctx.restore();
    }
    
    isInView(obj) {
        const margin = 200;
        return obj.y > this.y - margin && obj.y < this.y + this.height + margin;
    }
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 80;
        this.velocityX = 0;
        this.velocityY = 0;
        this.gravity = 1200;
        this.jumpPower = -550;
        this.moveSpeed = 300;
        this.onGround = false;
        this.rotation = 0;
        
        // Load character image
        this.image = new Image();
        this.image.src = './player-character.png';
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }
    
    update(deltaTime) {
        this.velocityY += this.gravity * deltaTime;
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        if (this.x < -this.width/2) {
            this.x = window.innerWidth + this.width/2;
        } else if (this.x > window.innerWidth + this.width/2) {
            this.x = -this.width/2;
        }
        
        this.velocityX *= 0.98;
        this.rotation = Math.atan2(this.velocityY, this.velocityX * 2) * 0.1;
    }
    
    jump() {
        this.velocityY = this.jumpPower;
        this.onGround = false;
    }
    
    land() {
        this.onGround = true;
    }
    
    moveLeft() {
        this.velocityX = Math.max(this.velocityX - this.moveSpeed * 2, -this.moveSpeed);
    }
    
    moveRight() {
        this.velocityX = Math.min(this.velocityX + this.moveSpeed * 2, this.moveSpeed);
    }
    
    getBounds() {
        return {
            left: this.x - this.width/2,
            right: this.x + this.width/2,
            top: this.y - this.height/2,
            bottom: this.y + this.height/2
        };
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.imageLoaded) {
            // Draw the character image
            ctx.drawImage(
                this.image,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            // Fallback: draw simple green circle if image not loaded yet
            const gradient = ctx.createRadialGradient(0, -5, 0, 0, 0, this.width/2);
            gradient.addColorStop(0, '#6a9f6a');
            gradient.addColorStop(1, '#4a7c59');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            const eyeOffset = Math.sin(Date.now() * 0.01) * 2;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-8, -5 + eyeOffset, 6, 0, Math.PI * 2);
            ctx.arc(8, -5 + eyeOffset, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-8, -5 + eyeOffset, 3, 0, Math.PI * 2);
            ctx.arc(8, -5 + eyeOffset, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class Platform {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 90;
        this.height = 15;
        this.scored = false;
    }
    
    getBounds() {
        return {
            left: this.x - this.width/2,
            right: this.x + this.width/2,
            top: this.y - this.height/2,
            bottom: this.y + this.height/2
        };
    }
    
    render(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x - this.width/2 + 2, this.y - this.height/2 + 2, this.width, this.height);
        
        const gradient = ctx.createLinearGradient(this.x, this.y - this.height/2, this.x, this.y + this.height/2);
        gradient.addColorStop(0, '#A0522D');
        gradient.addColorStop(1, '#8B4513');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, 3);
    }
}

class BackgroundManager {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.stars = [];
        this.clouds = [];
        this.generateBackground();
    }
    
    generateBackground() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * 20000 - 10000,
                size: Math.random() * 2 + 1,
                twinkle: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.5 + 0.1
            });
        }
        
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.width * 2 - this.width,
                y: Math.random() * 5000,
                size: Math.random() * 100 + 50,
                speed: Math.random() * 0.2 + 0.1,
                opacity: Math.random() * 0.3 + 0.1
            });
        }
    }
    
    update(cameraY, deltaTime) {
        this.stars.forEach(star => {
            star.twinkle += deltaTime * star.speed;
        });
        
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed * deltaTime * 10;
            if (cloud.x > this.width + cloud.size) {
                cloud.x = -cloud.size;
                cloud.y = Math.random() * 5000;
            }
        });
    }
    
    render(ctx, cameraY) {
        const height = Math.abs(cameraY);
        
        let topColor, bottomColor;
        
        if (height < 2000) {
            topColor = '#87CEEB';
            bottomColor = '#00aaff';
        } else if (height < 8000) {
            const progress = (height - 2000) / 6000;
            topColor = this.interpolateColor('#87CEEB', '#9999ff', progress);
            bottomColor = this.interpolateColor('#00aaff', '#FFE66D', progress);
        } else if (height < 15000) {
            const progress = (height - 8000) / 7000;
            topColor = this.interpolateColor('#9999ff', '#440066', progress);
            bottomColor = this.interpolateColor('#FFE66D', '#4A2C2A', progress);
        } else {
            topColor = '#0B1426';
            bottomColor = '#1e3a8a';
        }
        
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, topColor);
        gradient.addColorStop(1, bottomColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        if (height < 10000) {
            ctx.save();
            this.clouds.forEach(cloud => {
                if (Math.abs(cloud.y - Math.abs(cameraY)) < this.height * 2) {
                    const parallaxY = cloud.y + cameraY * 0.1;
                    ctx.globalAlpha = cloud.opacity * (1 - Math.min(height / 10000, 1));
                    ctx.fillStyle = '#ffffff';
                    
                    ctx.beginPath();
                    ctx.arc(cloud.x, parallaxY, cloud.size, 0, Math.PI * 2);
                    ctx.arc(cloud.x + cloud.size * 0.5, parallaxY, cloud.size * 0.8, 0, Math.PI * 2);
                    ctx.arc(cloud.x - cloud.size * 0.5, parallaxY, cloud.size * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.restore();
        }
        
        if (height > 8000) {
            ctx.save();
            const starOpacity = Math.min((height - 8000) / 7000, 1);
            
            this.stars.forEach(star => {
                if (Math.abs(star.y - Math.abs(cameraY)) < this.height) {
                    const twinkleIntensity = (Math.sin(star.twinkle) + 1) * 0.5;
                    ctx.globalAlpha = starOpacity * twinkleIntensity;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(star.x, star.y + cameraY, star.size, star.size);
                }
            });
            ctx.restore();
        }
    }
    
    interpolateColor(color1, color2, factor) {
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
}

class AudioManager {
    constructor() {
        this.context = null;
        this.initialized = false;
    }
    
    async init() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Audio initialization failed:', e);
        }
    }
    
    playJump() {
        if (!this.context) return;
        
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, this.context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
            
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + 0.2);
        } catch (e) {
            console.warn('Audio playback failed', e);
        }
    }
    
    playCoin() {
        if (!this.context) return;
        
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, this.context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.05);
            oscillator.frequency.exponentialRampToValueAtTime(1400, this.context.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.4, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
            
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + 0.15);
        } catch (e) {
            console.warn('Coin audio playback failed', e);
        }
    }
    
    playGameOver() {
        if (!this.initialized) return;
        this.playTone([440, 330, 247, 185], 0.8, 'triangle', 0.4);
    }
    
    playTone(frequencies, duration, waveType = 'sine', volume = 0.3) {
        if (!this.context) return;
        
        const now = this.context.currentTime;
        
        frequencies.forEach((freq, index) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = waveType;
            osc.frequency.setValueAtTime(freq, now);
            
            const startTime = now + index * 0.05;
            const endTime = startTime + duration / frequencies.length;
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, endTime);
            
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.start(startTime);
            osc.stop(endTime);
        });
    }
    
    async resumeContext() {
        if (this.context && this.context.state === 'suspended') {
            await this.context.resume();
        }
        if (!this.initialized) {
            await this.init();
        }
    }
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameTime = 0;
        
        this.camera = new Camera(this.width, this.height);
        this.backgroundManager = new BackgroundManager(this.width, this.height);
        this.audioManager = new AudioManager();
        this.particleSystem = new ParticleSystem();
        
        this.player = null;
        this.platforms = [];
        this.coins = [];
        
        this.score = 0;
        this.coinScore = 0;
        this.heightScore = 0;
        this.highScore = this.loadHighScore();
        this.gameState = 'menu';
        
        this.platformSpawnY = 0;
        this.platformSpacing = 100;
        
        this.lastTime = 0;
        this.isRunning = false;
        this.keys = {};
        
        this.init();
    }
    
    init() {
        this.audioManager.init();
        this.setupEventListeners();
        
        window.addEventListener('resize', () => this.handleResize());
    }
    
    handleResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.camera.width = this.width;
        this.camera.height = this.height;
        this.backgroundManager.width = this.width;
        this.backgroundManager.height = this.height;
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }
    
    handleKeyDown(e) {
        this.keys[e.code] = true;
        
        if (this.gameState === 'playing' && this.player) {
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
                this.player.moveLeft();
            } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
                this.player.moveRight();
            }
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
    }
    
    handleClick(e) {
        this.audioManager.resumeContext();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        this.processInput(x);
    }
    
    handleTouch(e) {
        e.preventDefault();
        this.audioManager.resumeContext();
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        
        this.processInput(x);
    }
    
    processInput(x) {
        if (this.gameState === 'playing' && this.player) {
            if (x < this.width / 2) {
                this.player.moveLeft();
            } else {
                this.player.moveRight();
            }
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.coinScore = 0;
        this.heightScore = 0;
        
        this.platforms = [];
        this.coins = [];
        
        this.createInitialPlatforms();
        
        const firstPlatform = this.platforms[0];
        this.player = new Player(firstPlatform.x, firstPlatform.y - 40);
        
        this.camera = new Camera(this.width, this.height);
        this.camera.y = this.player.y - this.height / 2;
        this.camera.follow(this.player);
        document.getElementById('uiOverlay').style.display = 'block';
        
        this.start();
    }
    
    createInitialPlatforms() {
        const startY = this.height - 100;
        
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * (this.width - 100) + 50;
            const y = startY - (i * this.platformSpacing);
            
            const platform = new Platform(x, y);
            this.platforms.push(platform);
            
            if (Math.random() < 0.4 && i > 1) {
                const coinX = x + (Math.random() - 0.5) * 40;
                const coin = new Coin(coinX, y - 30);
                this.coins.push(coin);
            }
        }
        
        this.platformSpawnY = startY - (15 * this.platformSpacing);
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 1/60);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        if (this.player) {
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
                this.player.moveLeft();
            }
            if (this.keys['ArrowRight'] || this.keys['KeyD']) {
                this.player.moveRight();
            }
        }
        
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        this.coins = this.coins.filter(coin => coin.update(deltaTime));
        this.particleSystem.update(deltaTime);
        this.camera.update(deltaTime);
        this.backgroundManager.update(this.camera.y, deltaTime);
        
        this.checkCollisions();
        this.checkPassedPlatforms();
        this.spawnPlatforms();
        this.cleanupPlatforms();
        this.updateScore();
        
        if (this.player && this.player.y > this.camera.y + this.height + 50) {
            this.gameOver();
        }
    }
    
    checkCollisions() {
        if (!this.player) return;
        
        const playerBounds = this.player.getBounds();
        
        if (this.player.velocityY > 0) {
            for (const platform of this.platforms) {
                const platformBounds = platform.getBounds();
                
                if (playerBounds.bottom > platformBounds.top &&
                    playerBounds.bottom < platformBounds.bottom &&
                    playerBounds.right > platformBounds.left &&
                    playerBounds.left < platformBounds.right) {
                    
                    this.player.y = platformBounds.top - this.player.height / 2;
                    this.player.jump();
                    this.player.land();
                    
                    this.particleSystem.createJumpParticles(
                        this.player.x, 
                        this.player.y + this.player.height / 2
                    );
                    
                    this.audioManager.playJump();
                    break;
                }
            }
        }
        
        for (const coin of this.coins) {
            if (coin.collected) continue;
            
            const coinBounds = coin.getBounds();
            
            if (playerBounds.right > coinBounds.left &&
                playerBounds.left < coinBounds.right &&
                playerBounds.bottom > coinBounds.top &&
                playerBounds.top < coinBounds.bottom) {
                
                if (coin.collect()) {
                    this.score += 1;
                    this.audioManager.playCoin();
                }
            }
        }
    }
    
    checkPassedPlatforms() {
        if (!this.player) return;
        
        const screenBottom = this.camera.y + this.height;
        
        for (const platform of this.platforms) {
            if (platform.y > screenBottom && !platform.scored) {
                platform.scored = true;
                this.score += 1;
            }
        }
    }
    
    spawnPlatforms() {
        while (this.platformSpawnY > this.camera.y - this.height) {
            let x, attempts = 0;
            const y = this.platformSpawnY;
            
            do {
                x = Math.random() * (this.width - 100) + 50;
                attempts++;
            } while (this.player && Math.abs(x - this.player.x) > this.width * 0.4 && attempts < 10);
            
            if (this.player && Math.abs(x - this.player.x) > this.width * 0.4) {
                const direction = Math.random() < 0.5 ? -1 : 1;
                x = this.player.x + direction * (Math.random() * 150 + 50);
                x = Math.max(45, Math.min(this.width - 45, x));
            }
            
            const platform = new Platform(x, y);
            this.platforms.push(platform);
            
            if (Math.random() < 0.3) {
                const coinX = x + (Math.random() - 0.5) * 50;
                const coin = new Coin(coinX, y - 30);
                this.coins.push(coin);
            }
            
            this.platformSpawnY -= this.platformSpacing;
        }
    }
    
    cleanupPlatforms() {
        const cleanupY = this.camera.y + this.height + 200;
        this.platforms = this.platforms.filter(platform => platform.y <= cleanupY);
        this.coins = this.coins.filter(coin => coin.y <= cleanupY && !coin.collected);
    }
    
    updateScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore(this.score);
        }
        const scoreDisplay = document.getElementById('scoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.textContent = this.score;
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.isRunning = false;
        this.audioManager.playGameOver();
        document.getElementById('uiOverlay').style.display = 'none';
        showGameOverScreen(this.score);
    }
    
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        
        if (this.gameState === 'playing') {
            this.backgroundManager.render(ctx, this.camera.y);
            this.camera.applyTransform(ctx);
            
            for (const platform of this.platforms) {
                if (this.camera.isInView(platform)) {
                    platform.render(ctx);
                }
            }
            
            for (const coin of this.coins) {
                if (this.camera.isInView(coin)) {
                    coin.render(ctx);
                }
            }
            
            if (this.player) {
                this.player.render(ctx);
            }
            
            this.particleSystem.render(ctx);
            this.camera.restoreTransform(ctx);
        }
    }
    
    loadHighScore() {
        try {
            const saved = localStorage.getItem('celioJumpHighScore');
            return saved ? parseInt(saved) : 0;
        } catch (e) {
            return 0;
        }
    }
    
    saveHighScore(score) {
        try {
            localStorage.setItem('celioJumpHighScore', score.toString());
        } catch (e) {
            console.error('Failed to save high score:', e);
        }
    }
}

// UI Functions
window.backToMenu = function() {
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('profileHeader').style.display = 'flex';
    document.getElementById('leaderboardBtn').style.display = 'block';
       
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.disabled = false;
        playBtn.textContent = 'Play Game';
    }
};

function showGameOverScreen(finalScore) {
    document.getElementById('finalScore').textContent = finalScore;
    
    const eligibleDiv = document.getElementById('eligibleReward');
    const notEligibleDiv = document.getElementById('notEligibleReward');
    
    if (finalScore >= 30 && window.isWalletConnected) {
        eligibleDiv.style.display = 'block';
        notEligibleDiv.style.display = 'none';
    } else {
        eligibleDiv.style.display = 'none';
        notEligibleDiv.style.display = 'block';
    }
    
    document.getElementById('gameOverScreen').style.display = 'flex';
}

window.shareScore = function() {
    const score = window.gameInstance ? Math.floor(window.gameInstance.score) : 0;
    const highScore = window.gameInstance ? window.gameInstance.highScore : 0;
    
    const shareText = encodeURIComponent(
        `🎮 Just scored ${score} points in Super Jump!\n\n` +
        `🏆 My high score: ${highScore}\n\n` +
        `😎 Can you beat me?\n` +
        `📣 Score 30+ to earn ETH rewards!\n` +
        `💰 Play daily and earn crypto`
    );
    
    const shareUrl = encodeURIComponent(window.location.href);
    const castUrl = `https://farcaster.xyz/~/compose?text=${shareText}&embeds%5B%5D=${shareUrl}`;
    
    window.open(castUrl, '_blank');
};

window.showLeaderboard = function() {
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('leaderboardScreen').style.display = 'flex';
    document.getElementById('profileHeader').style.display = 'none';
    document.getElementById('leaderboardBtn').style.display = 'none';
    window.loadOnChainLeaderboard();
};

window.hideLeaderboard = function() {
    document.getElementById('leaderboardScreen').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('profileHeader').style.display = 'flex';
    document.getElementById('leaderboardBtn').style.display = 'block';

    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.disabled = false;
        playBtn.textContent = 'Play Game';
    }
};

window.toggleLeaderboard = function() {
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    if (leaderboardScreen.style.display === 'none' || !leaderboardScreen.style.display) {
        showLeaderboard();
    } else {
        hideLeaderboard();
    }
};

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    window.gameInstance = new Game(canvas);
    document.getElementById('leaderboardBtn').style.display = 'block';
});