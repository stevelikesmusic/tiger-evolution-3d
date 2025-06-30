import { Engine } from './core/Engine.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.engine = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Show loading screen
            this.showLoading();
            
            // Test Three.js availability
            await this.testThreeJS();
            
            // Initialize engine
            this.engine = new Engine(this.canvas);
            
            // Set up canvas size
            this.resizeCanvas();
            
            // Add resize listener
            window.addEventListener('resize', () => this.resizeCanvas());
            
            // Hide loading screen and start game
            this.hideLoading();
            this.engine.start();
            
            console.log('Tiger Evolution 3D - Phase 1 initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError(`Failed to initialize game: ${error.message}`);
        }
    }
    
    async testThreeJS() {
        try {
            const THREE = await import('three');
            console.log('Three.js loaded successfully:', THREE.REVISION);
            return true;
        } catch (error) {
            throw new Error('Failed to load Three.js library. Please check your internet connection.');
        }
    }
    
    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        if (this.engine) {
            this.engine.resize(rect.width, rect.height);
        }
    }
    
    showLoading() {
        this.loadingScreen.style.display = 'flex';
    }
    
    hideLoading() {
        this.loadingScreen.style.display = 'none';
    }
    
    showError(message) {
        this.loadingScreen.innerHTML = `
            <div style="color: red; text-align: center;">
                <h2>Error</h2>
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});