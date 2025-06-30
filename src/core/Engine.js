import * as THREE from 'three';

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
        this.initCamera();
        this.initClock();
        
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
        
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
    }
    
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        // Add a test cube to verify rendering works
        this.addTestCube();
    }
    
    addTestCube() {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff6600,
            wireframe: true
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0, -5);
        this.scene.add(cube);
        
        // Store reference for animation
        this.testCube = cube;
    }
    
    initCamera() {
        const aspect = this.canvas.width / this.canvas.height;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
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
        // Animate the test cube to verify the game loop is working
        if (this.testCube) {
            this.testCube.rotation.x += deltaTime;
            this.testCube.rotation.y += deltaTime * 0.5;
        }
        
        // Override in subclasses or add update systems here
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    resize(width, height) {
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
    
    dispose() {
        this.stop();
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        window.removeEventListener('resize', this.handleResize);
    }
}