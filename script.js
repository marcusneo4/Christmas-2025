// ==================== Global Variables ====================
let participantNames = [];
let selectedWinners = [];
let currentWinnerIndex = 0;
let isAnimating = false;
let audioContext = null;

// Prize list starting from 10th prize (BBQ grill) going up to 1st prize (iPhone 17 pro)
const prizes = [
    "BBQ grill",                                    // 10th prize
    "One year supply of Milo",                     // After 10th
    "Air fryer",                                   // 9th prize
    "Massage Package",                             // After 9th
    "Gold class ticket + $80 voucher",            // 8th prize
    "Spa Package",                                 // After 8th
    "Airpods pro",                                 // 7th prize
    "Universal studio tickets",                    // After 7th
    "Apple watch",                                 // 6th prize
    "Disneyland tickets",                          // After 6th
    "$400",                                        // 5th prize
    "Trip to Korea",                               // After 5th
    "$500",                                        // 4th prize
    "$1000 CASH",                                  // After 4th
    "$600",                                        // 3rd prize
    "iPad wifi 256gb",                             // 2nd prize
    "iPhone 17 pro"                               // 1st prize (Grand Prize)
];

// ==================== DOM Elements ====================
const inputScreen = document.getElementById('input-screen');
const animationScreen = document.getElementById('animation-screen');
const resultsScreen = document.getElementById('results-screen');
const namesTextarea = document.getElementById('names-textarea');
const csvUpload = document.getElementById('csv-upload');
const participantCount = document.getElementById('participant-count');
const startBtn = document.getElementById('start-btn');
const gameSelectorBtn = document.getElementById('game-selector-btn');
const lootBox = document.getElementById('loot-box');
const winnerNameEl = document.getElementById('winner-name');
const winnerProgress = document.getElementById('winner-progress');
const previousWinners = document.getElementById('previous-winners');
const winnersGrid = document.getElementById('winners-grid');
const skipBtn = document.getElementById('skip-btn');
const newDrawBtn = document.getElementById('new-draw-btn');
const downloadBtn = document.getElementById('download-btn');
const fileName = document.getElementById('file-name');
const particleContainer = document.getElementById('particle-container');
const confettiCanvas = document.getElementById('confetti-canvas');
const clickPrompt = document.getElementById('click-prompt');
const lightBeams = document.getElementById('light-beams');
const glowRings = document.getElementById('glow-rings');
const screenFlash = document.getElementById('screen-flash');
const spotlightBg = document.getElementById('spotlight-bg');
const animationContainer = document.querySelector('.animation-container');

// ==================== Initialize Audio Context ====================
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// ==================== Background Christmas Music ====================
let backgroundMusicInterval = null;

function playBackgroundMusic() {
    initAudioContext();
    
    // Jazzy, mellow Christmas carol - "Silent Night" style with jazz chords
    // Lower octave, slower tempo, smooth jazz feel
    const melody = [
        { freq: 261.63, duration: 0.8 },   // C (low, slow)
        { freq: 293.66, duration: 0.6 },   // D
        { freq: 329.63, duration: 0.8 },    // E
        { freq: 293.66, duration: 0.6 },   // D
        { freq: 261.63, duration: 1.0 },   // C (longer)
    ];
    
    let currentTime = audioContext.currentTime;
    
    melody.forEach((note, index) => {
        // Main note - smooth jazz tone
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = note.freq;
        oscillator.type = 'sine';  // Smooth, mellow
        
        filter.type = 'lowpass';
        filter.frequency.value = note.freq * 1.5;  // Warmer, less bright
        filter.Q.value = 0.3;  // Softer resonance
        
        gainNode.gain.setValueAtTime(0.012, currentTime);  // Very soft
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + note.duration);
        
        // Add subtle jazz harmony (7th chord) for richness
        if (index % 2 === 0) {
            const harmony = audioContext.createOscillator();
            const harmonyGain = audioContext.createGain();
            
            harmony.connect(harmonyGain);
            harmonyGain.connect(audioContext.destination);
            
            harmony.frequency.value = note.freq * 1.75;  // 7th interval
            harmony.type = 'sine';
            
            harmonyGain.gain.setValueAtTime(0.004, currentTime);
            harmonyGain.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
            
            harmony.start(currentTime);
            harmony.stop(currentTime + note.duration);
        }
        
        currentTime += note.duration * 0.98;  // Gentle overlap
    });
}

function startBackgroundMusic() {
    stopBackgroundMusic();
    playBackgroundMusic();
    backgroundMusicInterval = setInterval(playBackgroundMusic, 5000);  // Slower repeat
}

function stopBackgroundMusic() {
    if (backgroundMusicInterval) {
        clearInterval(backgroundMusicInterval);
        backgroundMusicInterval = null;
    }
}

// ==================== Enhanced Christmas Sound Effects ====================
function playShakeSound() {
    initAudioContext();
    
    // Soft, jazzy carol snippet - mellow and smooth
    const melodyNotes = [
        { freq: 329.63, duration: 0.5 },  // E (lower, slower)
        { freq: 392.00, duration: 0.4 },  // G
        { freq: 329.63, duration: 0.6 },  // E (longer)
    ];
    
    const now = audioContext.currentTime;
    let currentTime = now;
    
    melodyNotes.forEach((note, index) => {
        // Main smooth jazz note
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = note.freq;
        oscillator.type = 'sine';  // Smooth, mellow
        
        filter.type = 'lowpass';
        filter.frequency.value = note.freq * 1.6;  // Warmer
        filter.Q.value = 0.4;  // Softer
        
        gainNode.gain.setValueAtTime(0.02, currentTime);  // Softer volume
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + note.duration);
        
        // Add subtle jazz harmony
        const harmony = audioContext.createOscillator();
        const harmonyGain = audioContext.createGain();
        
        harmony.connect(harmonyGain);
        harmonyGain.connect(audioContext.destination);
        
        harmony.frequency.value = note.freq * 1.5;  // Gentle harmony
        harmony.type = 'sine';
        
        harmonyGain.gain.setValueAtTime(0.006, currentTime);
        harmonyGain.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
        
        harmony.start(currentTime);
        harmony.stop(currentTime + note.duration);
        
        currentTime += note.duration * 0.95; // Gentle overlap
    });
}

function playOpenSound() {
    initAudioContext();
    
    // Smooth jazz carol - "Silent Night" with jazzy feel
    const now = audioContext.currentTime;
    
    // Lower octave, slower tempo, jazz harmony
    const melody = [
        { freq: 261.63, duration: 0.7, delay: 0 },    // C (low, smooth)
        { freq: 293.66, duration: 0.6, delay: 0.75 }, // D
        { freq: 329.63, duration: 0.9, delay: 1.4 },   // E (longer)
        { freq: 293.66, duration: 0.6, delay: 2.4 },   // D
        { freq: 261.63, duration: 1.0, delay: 3.1 }    // C (gentle ending)
    ];
    
    melody.forEach((note) => {
        // Main smooth jazz note
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'sine';
        osc.frequency.value = note.freq;
        
        filter.type = 'lowpass';
        filter.frequency.value = note.freq * 1.6;  // Warmer, less bright
        filter.Q.value = 0.4;  // Softer
        
        const startTime = now + note.delay;
        gain.gain.setValueAtTime(0.03, startTime);  // Softer
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);
        
        osc.start(startTime);
        osc.stop(startTime + note.duration);
        
        // Add jazz 7th harmony for richness
        const harmony = audioContext.createOscillator();
        const harmonyGain = audioContext.createGain();
        
        harmony.connect(harmonyGain);
        harmonyGain.connect(audioContext.destination);
        
        harmony.frequency.value = note.freq * 1.75;  // 7th interval (jazz)
        harmony.type = 'sine';
        
        harmonyGain.gain.setValueAtTime(0.01, startTime);
        harmonyGain.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);
        
        harmony.start(startTime);
        harmony.stop(startTime + note.duration);
    });
    
    // Very gentle, mellow shimmer at the end (lower pitch)
    const endShimmer = [523.25, 659.25];  // Lower octave
    endShimmer.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const startTime = now + 4.5 + (i * 0.4);
        gain.gain.setValueAtTime(0.008, startTime);  // Very soft
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);
        
        osc.start(startTime);
        osc.stop(startTime + 1.0);
    });
}

function playRevealSound() {
    initAudioContext();
    
    // Smooth jazz carol snippet - mellow and pleasant
    const melody = [
        { freq: 329.63, duration: 0.6 },  // E (lower, slower)
        { freq: 392.00, duration: 0.5 },  // G
        { freq: 440.00, duration: 0.5 },  // A
        { freq: 392.00, duration: 0.7 },  // G (longer)
        { freq: 329.63, duration: 0.8 }   // E (gentle ending)
    ];
    
    let currentTime = audioContext.currentTime;
    
    melody.forEach((note, index) => {
        // Main smooth jazz note
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = note.freq;
        oscillator.type = 'sine';  // Smooth
        
        filter.type = 'lowpass';
        filter.frequency.value = note.freq * 1.6;  // Warmer
        filter.Q.value = 0.4;  // Softer
        
        gainNode.gain.setValueAtTime(0.035, currentTime);  // Softer
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + note.duration);
        
        // Add subtle jazz harmony
        const harmonic = audioContext.createOscillator();
        const harmonicGain = audioContext.createGain();
        
        harmonic.connect(harmonicGain);
        harmonicGain.connect(audioContext.destination);
        
        harmonic.frequency.value = note.freq * 1.5;  // Gentle harmony
        harmonic.type = 'sine';
        
        harmonicGain.gain.setValueAtTime(0.012, currentTime);
        harmonicGain.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
        
        harmonic.start(currentTime);
        harmonic.stop(currentTime + note.duration);
        
        currentTime += note.duration * 0.95; // Gentle overlap
    });
}

function playConfettiSound() {
    initAudioContext();
    
    // Gentle jazz carol celebration - smooth and pleasant
    const now = audioContext.currentTime;
    
    // Soft jazz chord progression (major 7th chords)
    const jazzChords = [
        { root: 261.63, delay: 0 },      // C major 7
        { root: 293.66, delay: 0.3 },    // D major 7
        { root: 329.63, delay: 0.6 },    // E major 7
        { root: 293.66, delay: 0.9 }     // D major 7
    ];
    
    jazzChords.forEach((chord, i) => {
        // Play chord notes (root, 3rd, 5th, 7th)
        const chordNotes = [
            chord.root,           // Root
            chord.root * 1.25,    // Major 3rd
            chord.root * 1.5,      // Perfect 5th
            chord.root * 1.875     // Major 7th (jazz!)
        ];
        
        chordNotes.forEach((freq, noteIndex) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            filter.type = 'lowpass';
            filter.frequency.value = freq * 1.5;
            filter.Q.value = 0.3;
            
            const startTime = now + chord.delay + (noteIndex * 0.05);
            const noteGain = 0.015 / (noteIndex + 1);  // Softer for higher notes
            gain.gain.setValueAtTime(noteGain, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
            
            osc.start(startTime);
            osc.stop(startTime + 0.5);
        });
    });
    
    // Gentle mellow chimes (lower pitch)
    const chimeFreqs = [523.25, 659.25, 783.99];  // Lower octave
    chimeFreqs.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const startTime = now + 0.3 + (i * 0.15);
        gain.gain.setValueAtTime(0.02, startTime);  // Softer
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
        
        osc.start(startTime);
        osc.stop(startTime + 0.6);
    });
}

// ==================== Name Input Functions ====================
function updateParticipantCount() {
    participantCount.textContent = `${participantNames.length} participants loaded`;
    startBtn.disabled = participantNames.length < 17;
    gameSelectorBtn.disabled = participantNames.length < 1;
}

function parseNames(text) {
    const names = text
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);
    
    // Remove duplicates
    return [...new Set(names)];
}

namesTextarea.addEventListener('input', (e) => {
    participantNames = parseNames(e.target.value);
    updateParticipantCount();
});

csvUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    fileName.textContent = file.name;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target.result;
        participantNames = parseNames(content);
        namesTextarea.value = participantNames.join('\n');
        updateParticipantCount();
    };
    reader.readAsText(file);
});

// ==================== Random Selection Algorithm ====================
function fisherYatesShuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function selectWinners() {
    const shuffled = fisherYatesShuffle(participantNames);
    return shuffled.slice(0, 17); // 10 prizes + 7 booby prizes = 17 total
}

// ==================== Enhanced Overwatch-Style Particle Effects ====================
function createEpicParticleBurst() {
    const colors = ['#FFD700', '#FFA500', '#FFFFFF', '#FFE57F', '#FFEB3B', '#FF6B6B', '#4ECDC4'];
    const particleCount = 120; // More particles for epic effect
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.8;
        const velocity = 180 + Math.random() * 280;
        const size = 6 + Math.random() * 18;
        
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = '50%';
        particle.style.top = '50%';
        
        // Mix of circles, squares, and stars
        const shape = Math.random();
        if (shape < 0.5) {
            particle.style.borderRadius = '50%';
        } else if (shape < 0.75) {
            particle.style.borderRadius = '0%';
        } else {
            particle.style.borderRadius = '30%';
            particle.style.transform = 'rotate(45deg)';
        }
        
        particleContainer.appendChild(particle);
        
        // More dramatic animation with 3D feel
        const duration = 1400 + Math.random() * 1200;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        const rotations = 360 + Math.random() * 720;
        
        particle.animate([
            {
                transform: 'translate(-50%, -50%) scale(0.5) rotate(0deg) translateZ(0px)',
                opacity: 0
            },
            {
                transform: 'translate(-50%, -50%) scale(1.5) rotate(0deg) translateZ(0px)',
                opacity: 1,
                offset: 0.1
            },
            {
                transform: `translate(calc(-50% + ${tx * 0.6}px), calc(-50% + ${ty * 0.6}px)) scale(2) rotate(${rotations * 0.6}deg) translateZ(${Math.random() * 100}px)`,
                opacity: 1,
                offset: 0.5
            },
            {
                transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.3) rotate(${rotations}deg) translateZ(${Math.random() * 200}px)`,
                opacity: 0
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        });
        
        setTimeout(() => particle.remove(), duration);
    }
    
    // Add some larger "hero" particles
    for (let i = 0; i < 15; i++) {
        const heroParticle = document.createElement('div');
        heroParticle.className = 'particle';
        heroParticle.style.backgroundColor = '#FFD700';
        heroParticle.style.width = '20px';
        heroParticle.style.height = '20px';
        heroParticle.style.borderRadius = '50%';
        heroParticle.style.left = '50%';
        heroParticle.style.top = '50%';
        
        particleContainer.appendChild(heroParticle);
        
        const angle = (Math.PI * 2 * i) / 15;
        const velocity = 250 + Math.random() * 150;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        heroParticle.animate([
            {
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 1,
                boxShadow: '0 0 30px rgba(255, 215, 0, 1)'
            },
            {
                transform: `translate(calc(-50% + ${tx * 0.7}px), calc(-50% + ${ty * 0.7}px)) scale(2.5)`,
                opacity: 1,
                boxShadow: '0 0 50px rgba(255, 215, 0, 1)',
                offset: 0.5
            },
            {
                transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.5)`,
                opacity: 0,
                boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
            }
        ], {
            duration: 2000,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        });
        
        setTimeout(() => heroParticle.remove(), 2000);
    }
}

function createContinuousSparkles() {
    const colors = ['#FFD700', '#FFA500', '#FFFFFF'];
    const sparkleInterval = setInterval(() => {
        if (!isAnimating) {
            clearInterval(sparkleInterval);
            return;
        }
        
        for (let i = 0; i < 5; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'particle';
            sparkle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            sparkle.style.width = '6px';
            sparkle.style.height = '6px';
            sparkle.style.borderRadius = '50%';
            sparkle.style.left = (40 + Math.random() * 20) + '%';
            sparkle.style.top = (40 + Math.random() * 20) + '%';
            
            particleContainer.appendChild(sparkle);
            
            sparkle.animate([
                { opacity: 0, transform: 'scale(0)' },
                { opacity: 1, transform: 'scale(1.5)', offset: 0.5 },
                { opacity: 0, transform: 'scale(0)' }
            ], {
                duration: 800,
                easing: 'ease-out'
            });
            
            setTimeout(() => sparkle.remove(), 800);
        }
    }, 100);
}

// ==================== Confetti Effect ====================
class ConfettiPiece {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = -20;
        this.size = 5 + Math.random() * 10;
        this.speedY = 2 + Math.random() * 3;
        this.speedX = -1 + Math.random() * 2;
        this.colors = ['#FFD700', '#C41E3A', '#165B33', '#FFA500', '#FF1493'];
        this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.rotation = Math.random() * 360;
        this.rotationSpeed = -5 + Math.random() * 10;
    }
    
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        
        if (this.y > this.canvas.height) {
            this.reset();
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

class ConfettiEffect {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pieces = [];
        this.animationId = null;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    start(count = 100) {
        this.pieces = [];
        for (let i = 0; i < count; i++) {
            this.pieces.push(new ConfettiPiece(this.canvas));
            // Stagger the initial positions
            this.pieces[i].y = -20 - (i * 5);
        }
        this.animate();
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.pieces.forEach(piece => {
            piece.update();
            piece.draw(this.ctx);
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

const confettiEffect = new ConfettiEffect(confettiCanvas);

// ==================== Overwatch-Style Epic Loot Box Animation ====================
async function animateLootBox(winnerName) {
    return new Promise((resolve) => {
        isAnimating = true;
        
        // Reset all states
        lootBox.className = 'loot-box';
        winnerNameEl.className = 'winner-name';
        winnerNameEl.textContent = '';
        particleContainer.innerHTML = '';
        clickPrompt.className = 'click-prompt';
        lightBeams.className = 'light-beams';
        glowRings.className = 'glow-rings';
        screenFlash.className = 'screen-flash';
        spotlightBg.className = 'spotlight-bg';
        
        // PHASE 1: Cinematic Entrance - Box flies in from distance
        spotlightBg.classList.add('active');
        lootBox.classList.add('entering');
        
        // Play dramatic entrance sound
        setTimeout(() => playShakeSound(), 300);
        setTimeout(() => playShakeSound(), 700);
        setTimeout(() => playShakeSound(), 1100);
        
        setTimeout(() => {
            // PHASE 2: Ready to Click - Floating and pulsing
            lootBox.classList.remove('entering');
            lootBox.classList.add('ready-to-click', 'clickable');
            clickPrompt.classList.add('show');
            
            // Continuous sparkles during wait
            createContinuousSparkles();
            
            // Anticipation music loop
            const anticipationInterval = setInterval(() => {
                playShakeSound();
            }, 900);
            
            // Wait for user click - make entire container clickable
            let hasClicked = false;
            const lootBoxContainer = document.getElementById('loot-box-container');
            const clickHandler = () => {
                if (hasClicked) return;
                hasClicked = true;
                
                // Remove click listener and prompt
                lootBoxContainer.removeEventListener('click', clickHandler);
                clickPrompt.classList.remove('show');
                clearInterval(anticipationInterval);
                
                // PHASE 3: Intense Pre-Opening Shake (like Overwatch charging)
                lootBox.classList.remove('ready-to-click', 'clickable');
                lootBox.classList.add('shaking', 'glowing');
                
                // Rapid shake sounds
                const shakeInterval = setInterval(() => {
                    playShakeSound();
                }, 80);
                
                // Intense charge-up for 1.5 seconds
                setTimeout(() => {
                    clearInterval(shakeInterval);
                    
                    // PHASE 4: MASSIVE OPENING - Box explodes toward camera
                    lootBox.classList.remove('shaking', 'glowing');
                    lootBox.classList.add('opening');
                    
                    // Trigger screen flash (Overwatch white flash)
                    screenFlash.classList.add('active');
                    
                    // Camera shake for impact!
                    animationContainer.classList.add('camera-shake');
                    setTimeout(() => {
                        animationContainer.classList.remove('camera-shake');
                    }, 500);
                    
                    // Epic opening sound
                    playOpenSound();
                    
                    // Light beams shoot out immediately
                    setTimeout(() => {
                        lightBeams.classList.add('active');
                        glowRings.classList.add('active');
                    }, 100);
                    
                    // Sound layers for epic feel (spaced out to avoid overlap)
                    setTimeout(() => playConfettiSound(), 800);
                    
                    // PHASE 5: Massive Particle Explosions
                    setTimeout(() => {
                        // First wave
                        createEpicParticleBurst();
                        
                        // Second wave
                        setTimeout(() => createEpicParticleBurst(), 150);
                        
                        // Third wave
                        setTimeout(() => createEpicParticleBurst(), 300);
                        
                        // Fourth wave for extra epic-ness
                        setTimeout(() => createEpicParticleBurst(), 450);
                    }, 300);
                    
                    // PHASE 6: Winner Name Flies Out (like Overwatch item reveal)
                    setTimeout(() => {
                        winnerNameEl.textContent = winnerName;
                        winnerNameEl.classList.add('reveal');
                        
                        // Epic reveal sound
                        playRevealSound();
                        
                        // More particle bursts during name reveal
                        setTimeout(() => createEpicParticleBurst(), 500);
                        setTimeout(() => createEpicParticleBurst(), 700);
                        
                        // PHASE 7: Celebration Hold
                        setTimeout(() => {
                            // Wait for player to admire the winner
                            setTimeout(() => {
                                // Clean up and resolve
                                screenFlash.classList.remove('active');
                                isAnimating = false;
                                resolve();
                            }, 2000);
                        }, 1200);
                    }, 900);
                }, 1500);
            };
            
            lootBoxContainer.addEventListener('click', clickHandler);
        }, 2000); // Wait for entrance animation to complete
    });
}

// ==================== Winner Reveal Sequence ====================
async function revealNextWinner() {
    if (currentWinnerIndex >= selectedWinners.length) {
        showResultsScreen();
        return;
    }
    
    const winnerName = selectedWinners[currentWinnerIndex];
    const prize = prizes[currentWinnerIndex];
    
    // Update progress - show prize name BEFORE opening (this is displayed prominently)
    winnerProgress.textContent = prize;
    
    // Animate the loot box
    await animateLootBox(winnerName);
    
    // Add to previous winners display
    const card = document.createElement('div');
    card.className = 'winner-card';
    card.innerHTML = `<div class="winner-card-prize">${prize}</div><div class="winner-card-name">${winnerName}</div>`;
    previousWinners.appendChild(card);
    
    // Move to next winner
    currentWinnerIndex++;
    
    // Small delay before next winner
    setTimeout(() => {
        if (!isAnimating) {
            revealNextWinner();
        }
    }, 500);
}

// ==================== Screen Transitions ====================
const gameSelectorScreen = document.getElementById('game-selector-screen');

function showScreen(screen) {
    inputScreen.classList.remove('active');
    gameSelectorScreen.classList.remove('active');
    animationScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
    
    screen.classList.add('active');
}

// ==================== Game Selector (Claw Machine) Functions ====================
let selectedGamePlayers = [];
const toyEmojis = ['🧸', '🐻', '🐰', '🦊', '🐼', '🐨', '🦁', '🐯', '🐻‍❄️', '🐶', '🐱', '🐭', '🐹', '🐮', '🐷'];

function showGameSelector() {
    showScreen(gameSelectorScreen);
    selectedGamePlayers = [];
    updateSelectedPlayersList();
}

async function playClawMachineAnimation() {
    return new Promise((resolve) => {
        const clawArm = document.getElementById('claw-arm');
        const toysContainer = document.getElementById('toys-container');
        const selectedPlayerDisplay = document.getElementById('selected-player-display');
        const claw = clawArm.querySelector('.claw');
        
        // Hide previous selection
        selectedPlayerDisplay.classList.remove('show');
        selectedPlayerDisplay.innerHTML = '';
        
        // Select random player and toy
        const availablePlayers = participantNames.filter(name => 
            !selectedGamePlayers.some(p => p.name === name)
        );
        
        if (availablePlayers.length === 0) {
            // Reset if all players have been selected
            selectedGamePlayers = [];
        }
        
        const randomPlayer = availablePlayers.length > 0 
            ? availablePlayers[Math.floor(Math.random() * availablePlayers.length)]
            : participantNames[Math.floor(Math.random() * participantNames.length)];
        const randomToy = toyEmojis[Math.floor(Math.random() * toyEmojis.length)];
        
        // Play sound effect
        playShakeSound();
        
        // Move claw to random position (no need for actual toy elements)
        const randomLeft = 20 + Math.random() * 60; // 20% to 80%
        
        // PHASE 1: Move claw horizontally to random position (FASTER)
        clawArm.style.left = randomLeft + '%';
        clawArm.style.transition = 'left 0.8s ease'; // Faster horizontal movement
        
        setTimeout(() => {
            // PHASE 2: Lower claw (FASTER)
            clawArm.classList.add('grabbing');
            playShakeSound();
            
            setTimeout(() => {
                // PHASE 3: Close claw (FASTER)
                claw.classList.add('closed');
                playOpenSound();
                
                // Create grabbed toy that appears when claw closes
                const grabbedToy = document.createElement('div');
                grabbedToy.className = 'toy grabbed';
                grabbedToy.textContent = randomToy;
                grabbedToy.style.position = 'absolute';
                grabbedToy.style.left = randomLeft + '%';
                grabbedToy.style.bottom = '20px';
                grabbedToy.style.transform = 'translateX(-50%)';
                toysContainer.appendChild(grabbedToy);
                
                setTimeout(() => {
                    // PHASE 4: Lift claw with toy (FASTER)
                    clawArm.classList.remove('grabbing');
                    clawArm.classList.add('lifting');
                    
                    // Animate toy up with claw - FASTER
                    grabbedToy.style.transition = 'all 0.6s ease';
                    grabbedToy.style.bottom = '200px';
                    
                    playRevealSound();
                    
                    setTimeout(() => {
                        // PHASE 5: Move to prize chute (FASTER)
                        clawArm.style.transition = 'left 0.9s ease';
                        clawArm.style.left = '85%';
                        grabbedToy.style.left = '85%';
                        
                        setTimeout(() => {
                            // PHASE 6: Open claw and drop toy (FASTER)
                            claw.classList.remove('closed');
                            
                            // Animate toy falling - FASTER
                            grabbedToy.style.transition = 'all 0.5s ease-in';
                            grabbedToy.style.bottom = '-100px';
                            grabbedToy.style.opacity = '0';
                            
                            playConfettiSound();
                            
                            setTimeout(() => {
                                // PHASE 7: Reset claw and show winner (FASTER)
                                clawArm.classList.remove('lifting');
                                clawArm.style.transition = 'none';
                                clawArm.style.left = '50%';
                                setTimeout(() => {
                                    clawArm.style.transition = 'left 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                                }, 50);
                                
                                // Remove grabbed toy
                                grabbedToy.remove();
                                
                                // Show selected player
                                selectedPlayerDisplay.innerHTML = `
                                    <div class="player-toy">${randomToy}</div>
                                    <div class="player-name">${randomPlayer}</div>
                                `;
                                selectedPlayerDisplay.classList.add('show');
                                
                                // Add to selected players list
                                selectedGamePlayers.push({
                                    name: randomPlayer,
                                    toy: randomToy
                                });
                                updateSelectedPlayersList();
                                
                                playRevealSound();
                                
                                resolve();
                            }, 600);
                        }, 1000);
                    }, 700);
                }, 500);
            }, 900);
        }, 900);
    });
}

function updateSelectedPlayersList() {
    const listContainer = document.getElementById('selected-players-list');
    listContainer.innerHTML = '';
    
    selectedGamePlayers.forEach((player, index) => {
        const chip = document.createElement('div');
        chip.className = 'player-chip';
        chip.style.animationDelay = (index * 0.1) + 's';
        chip.innerHTML = `
            <span class="chip-toy">${player.toy}</span>
            <span class="chip-name">${player.name}</span>
        `;
        listContainer.appendChild(chip);
    });
}

function startDrawing() {
    // Select winners
    selectedWinners = selectWinners();
    currentWinnerIndex = 0;
    previousWinners.innerHTML = '';
    
    // Show animation screen
    showScreen(animationScreen);
    
    // Start background music
    startBackgroundMusic();
    
    // Start revealing winners
    revealNextWinner();
}

function showResultsScreen() {
    stopBackgroundMusic();
    showScreen(resultsScreen);
    
    // Display all winners in grid (from 10th prize to 1st prize)
    winnersGrid.innerHTML = '';
    selectedWinners.forEach((name, index) => {
        const prize = prizes[index];
        const card = document.createElement('div');
        card.className = 'winner-result-card';
        card.innerHTML = `
            <div class="winner-prize">${prize}</div>
            <div class="winner-result-name">${name}</div>
        `;
        winnersGrid.appendChild(card);
    });
    
    // Start confetti
    confettiEffect.start(150);
    playConfettiSound();
}

function resetApp() {
    stopBackgroundMusic();
    confettiEffect.stop();
    currentWinnerIndex = 0;
    selectedWinners = [];
    showScreen(inputScreen);
}

function downloadResults() {
    const text = selectedWinners
        .map((name, index) => {
            const prize = prizes[index];
            return `${prize}: ${name}`;
        })
        .join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'christmas-party-winners-2025.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function skipAnimation() {
    stopBackgroundMusic();
    if (isAnimating) {
        // Skip to end of current animation
        isAnimating = false;
    }
    // Fast-forward through remaining winners
    currentWinnerIndex = selectedWinners.length;
    showResultsScreen();
}

// ==================== Event Listeners ====================
startBtn.addEventListener('click', startDrawing);
gameSelectorBtn.addEventListener('click', showGameSelector);
skipBtn.addEventListener('click', skipAnimation);
newDrawBtn.addEventListener('click', resetApp);
downloadBtn.addEventListener('click', downloadResults);


// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
    showScreen(inputScreen);
    
    // Game Selector event listeners
    const startButtonMachine = document.querySelector('.start-button-machine');
    const spinAgainBtn = document.getElementById('spin-again-btn');
    const backToInputBtn = document.getElementById('back-to-input-btn');
    
    if (startButtonMachine) {
        startButtonMachine.addEventListener('click', () => {
            playClawMachineAnimation();
        });
    }
    
    if (spinAgainBtn) {
        spinAgainBtn.addEventListener('click', () => {
            playClawMachineAnimation();
        });
    }
    
    if (backToInputBtn) {
        backToInputBtn.addEventListener('click', () => {
            showScreen(inputScreen);
        });
    }
    
    // Prefill with participant names
    const defaultNames = [
        'Da Sao',
        'Lynette',
        'Thian Pong',
        'Yvette',
        'Gabriel',
        'Samuel',
        'Susan',
        'Emmanual',
        'Michelle',
        'Sebastian',
        'Sarah',
        'Da Ee Ee',
        'Uncle John',
        'Sharon',
        'Leslie',
        'Kenzie',
        'Jezzrie',
        'Calvin',
        'Joyce',
        'Shaniah',
        'Nataniah',
        'Adeliah',
        'Emeliah',
        'Amor',
        'Mama Lily',
        'Mah Chye',
        'Sharon',
        'Austin',
        'Ashley',
        'Mah Kok',
        'Gma',
        'Gpa',
        'Steffi',
        'Clement',
        'Noah',
        'Mark',
        'Ben',
        'Vivien',
        'Paul',
        'Lisa',
        'Priscilla',
        'Keegan',
        'Kaka Lisa',
        'Chris',
        'Darren',
        'Denise',
        'Vanessa',
        'Bryle',
        'Roger',
        'May Soon',
        'Martin',
        'Marcus',
        'Marissa',
        'Kaka Emma',
        'Rinnah',
        'Shanna',
        'Yuan Zhang',
        'Maggi Teo',
        'Sally (Clem\'s mum)',
        'Jing Jie',
        'JJ\'s mum',
        'May Chua',
        'Johannes',
        'Mikael',
        'Margorie'
    ];
    
    namesTextarea.value = defaultNames.join('\n');
    participantNames = defaultNames;
    updateParticipantCount();
});

