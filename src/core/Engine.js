import * as THREE from 'three';
import { GameController } from '../systems/GameController.js';

export class Engine {
    constructor(canvas, options = {}) {
        if (!canvas) {
            throw new Error('Canvas element is required');
        }
        
        this.canvas = canvas;
        this.options = {
            enableShadows: true,
            antialias: true,
            alpha: false,
            ...options
        };
        
        this.isRunning = false;
        this.deltaTime = 0;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.initRenderer();
        this.initScene();
        this.initClock();
        this.initGameController();
        
        this.setupEventListeners();
    }
    
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: this.options.antialias,
            alpha: this.options.alpha
        });
        
        this.renderer.setSize(this.canvas.width, this.canvas.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        if (this.options.enableShadows) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
    }
    
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        // Add basic lighting
        this.initLighting();
        
        // Add ground plane
        this.addGround();
    }
    
    initLighting() {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light for sun
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 200;
        this.scene.add(directionalLight);
    }
    
    addGround() {
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3d5a3d // Forest green
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    initGameController() {
        // Initialize game controller with scene and canvas
        this.gameController = new GameController(this.scene, this.canvas);
        
        // Create a temporary camera until the game initializes
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.canvas.width / this.canvas.height,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);
    }
    
    initClock() {
        this.clock = new THREE.Clock();
    }
    
    setupEventListeners() {
        // Handle window resize
        this.handleResize = () => {
            const rect = this.canvas.getBoundingClientRect();
            this.resize(rect.width, rect.height);
        };
        
        window.addEventListener('resize', this.handleResize);
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
        
        this.deltaTime = this.clock.getDelta();
        this.update(this.deltaTime);
        this.render();
    }
    
    update(deltaTime) {
        // Update game controller and all systems
        if (this.gameController) {
            this.gameController.update(deltaTime);
            
            // Switch to game controller's camera when game is initialized
            if (this.gameController.gameInitialized && this.gameController.getCamera) {
                const gameCamera = this.gameController.getCamera();
                if (gameCamera && gameCamera !== this.camera) {
                    this.camera = gameCamera;
                }
            }
        }
    }
    
    render() {
        // Safety check to prevent render errors
        if (!this.camera || !this.scene || !this.renderer) {
            console.warn('⚠️ Engine render called with missing components:', {
                camera: !!this.camera,
                scene: !!this.scene,
                renderer: !!this.renderer
            });
            return;
        }
        
        try {
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error('❌ WebGL render error caught:', error);
            // Try to continue without crashing the game loop
            if (error.message.includes('uniform') || error.message.includes('value')) {
                console.warn('⚠️ Material uniform error detected, attempting to continue...');
            }
        }
    }
    
    resize(width, height) {
        this.renderer.setSize(width, height);
        
        // Notify game controller of resize (which will update camera)
        if (this.gameController && this.gameController.gameInitialized) {
            this.gameController.resize(width, height);
        } else {
            // Update temporary camera while game is not initialized
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
    }
    
    dispose() {
        this.stop();
        
        // Dispose game controller
        if (this.gameController) {
            this.gameController.dispose();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        window.removeEventListener('resize', this.handleResize);
    }
}