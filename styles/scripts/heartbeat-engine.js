// Heartbeat Engine - The Living Pulse of The Revelation Engine

class HeartbeatEngine extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Initial state
        this.bpm = parseInt(this.getAttribute('bpm')) || 72;
        this.state = this.getAttribute('state') || 'arrival';
        this.audioContext = null;
        this.isPlaying = false;
        
        // Create the heartbeat visualization
        this.render();
        this.init();
    }
    
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    z-index: 1000;
                }
                
                .heartbeat-container {
                    width: 60px;
                    height: 60px;
                    position: relative;
                }
                
                .pulse-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 2px solid var(--cosmos-secondary, #00A8E8);
                    animation: pulse-ring calc(60s / var(--bpm, 72)) linear infinite;
                }
                
                .pulse-core {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 20px;
                    height: 20px;
                    background: var(--cosmos-secondary, #00A8E8);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    animation: pulse-core calc(60s / var(--bpm, 72)) ease-in-out infinite;
                }
                
                @keyframes pulse-ring {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(2.5);
                        opacity: 0;
                    }
                }
                
                @keyframes pulse-core {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.3);
                    }
                }
                
                .status {
                    position: absolute;
                    bottom: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 0.75rem;
                    color: var(--cosmos-light, #F0F8FF);
                    font-family: monospace;
                    white-space: nowrap;
                }
            </style>
            
            <div class="heartbeat-container">
                <div class="pulse-ring"></div>
                <div class="pulse-core"></div>
                <div class="status">${this.bpm} BPM</div>
            </div>
        `;
    }
    
    init() {
        // Initialize audio context for heartbeat sound
        this.initAudio();
        
        // Listen for scroll events to modulate BPM
        this.setupScrollListener();
        
        // Listen for section changes
        this.setupIntersectionObserver();
        
        // Start the heartbeat
        this.start();
    }
    
    initAudio() {
        // Create audio context on user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.startHeartbeatSound();
            }
        }, { once: true });
    }
    
    startHeartbeatSound() {
        if (!this.audioContext || this.isPlaying) return;
        
        this.isPlaying = true;
        
        const playBeat = () => {
            if (!this.isPlaying) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Low frequency for heartbeat thump
            oscillator.frequency.value = 40;
            oscillator.type = 'sine';
            
            // Quick attack and decay for thump effect
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            
            // Schedule next beat
            const interval = 60000 / this.bpm;
            setTimeout(playBeat, interval);
        };
        
        playBeat();
    }
    
    setupScrollListener() {
        let lastScrollY = window.scrollY;
        let scrollVelocity = 0;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            scrollVelocity = Math.abs(currentScrollY - lastScrollY);
            lastScrollY = currentScrollY;
            
            // Modulate BPM based on scroll velocity
            const targetBPM = Math.min(120, 72 + scrollVelocity * 0.5);
            this.transitionBPM(targetBPM, 300);
        });
    }
    
    setupIntersectionObserver() {
        const sections = document.querySelectorAll('section');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.updateState(entry.target.id);
                }
            });
        }, { threshold: 0.5 });
        
        sections.forEach(section => observer.observe(section));
    }
    
    updateState(sectionId) {
        const stateMap = {
            'arrival': { bpm: 72, color: '#00A8E8' },
            'valley': { bpm: 60, color: '#ff6b6b' },
            'revelation': { bpm: 100, color: '#00C9A7' },
            'cta': { bpm: 80, color: '#FFD700' }
        };
        
        const state = stateMap[sectionId] || stateMap['arrival'];
        this.transitionBPM(state.bpm, 1000);
        this.updateColor(state.color);
    }
    
    transitionBPM(targetBPM, duration) {
        const startBPM = this.bpm;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-in-out animation
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            this.bpm = Math.round(startBPM + (targetBPM - startBPM) * easeProgress);
            this.updateBPM();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    updateBPM() {
        // Update CSS variable
        this.style.setProperty('--bpm', this.bpm);
        
        // Update status text
        const status = this.shadowRoot.querySelector('.status');
        if (status) {
            status.textContent = `${this.bpm} BPM`;
        }
        
        // Dispatch event for other components
        this.dispatchEvent(new CustomEvent('heartbeat:change', {
            detail: { bpm: this.bpm },
            bubbles: true
        }));
    }
    
    updateColor(color) {
        this.style.setProperty('--cosmos-secondary', color);
    }
    
    start() {
        this.dispatchEvent(new CustomEvent('heartbeat:start', {
            detail: { bpm: this.bpm, state: this.state },
            bubbles: true
        }));
    }
    
    stop() {
        this.isPlaying = false;
        this.dispatchEvent(new CustomEvent('heartbeat:stop', {
            bubbles: true
        }));
    }
}

// Register the custom element
customElements.define('heartbeat-engine', HeartbeatEngine);

// Vignette reveal on scroll
document.addEventListener('DOMContentLoaded', () => {
    const vignettes = document.querySelectorAll('.vignette');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
    });
    
    vignettes.forEach(vignette => revealObserver.observe(vignette));
});
