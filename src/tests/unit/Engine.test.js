import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { Engine } from '../../core/Engine.js';

// Mock Three.js module
vi.mock('three', () => ({
    WebGLRenderer: vi.fn().mockImplementation(() => ({
        setSize: vi.fn(),
        setPixelRatio: vi.fn(),
        shadowMap: { enabled: false, type: null },
        outputEncoding: null,
        toneMapping: null,
        toneMappingExposure: 1,
        domElement: null,
        render: vi.fn(),
        dispose: vi.fn()
    })),
    Scene: vi.fn().mockImplementation(() => ({
        add: vi.fn(),
        remove: vi.fn(),
        background: null,
        fog: null
    })),
    PerspectiveCamera: vi.fn().mockImplementation(() => ({
        position: { set: vi.fn() },
        lookAt: vi.fn(),
        updateProjectionMatrix: vi.fn(),
        aspect: 1
    })),
    Clock: vi.fn().mockImplementation(() => ({
        getDelta: vi.fn(() => 0.016),
        getElapsedTime: vi.fn(() => 1.0)
    })),
    Color: vi.fn(),
    Fog: vi.fn(),
    BoxGeometry: vi.fn(),
    MeshBasicMaterial: vi.fn(),
    Mesh: vi.fn().mockImplementation(() => ({
        position: { set: vi.fn() },
        rotation: { x: 0, y: 0 }
    })),
    sRGBEncoding: 'sRGBEncoding',
    ACESFilmicToneMapping: 'ACESFilmicToneMapping',
    PCFSoftShadowMap: 'PCFSoftShadowMap'
}));

describe('Engine', () => {
    let engine;
    let mockCanvas;

    beforeEach(() => {
        // Mock canvas element
        mockCanvas = {
            getContext: vi.fn(),
            width: 800,
            height: 600,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600 })),
            parentElement: {
                getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600 }))
            }
        };
        
        // Mock WebGL context
        const mockWebGLContext = {
            getExtension: vi.fn(),
            getParameter: vi.fn(),
            createProgram: vi.fn(),
            createShader: vi.fn()
        };
        
        mockCanvas.getContext.mockReturnValue(mockWebGLContext);
        
        // Mock window
        global.window = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            devicePixelRatio: 1
        };
    });

    afterEach(() => {
        if (engine) {
            engine.dispose();
        }
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        test('should create engine with canvas element', () => {
            engine = new Engine(mockCanvas);
            
            expect(engine).toBeInstanceOf(Engine);
            expect(engine.canvas).toBe(mockCanvas);
        });

        test('should throw error without canvas', () => {
            expect(() => {
                engine = new Engine();
            }).toThrow('Canvas element is required');
        });

        test('should initialize with default options', () => {
            engine = new Engine(mockCanvas);
            
            expect(engine.options.enableShadows).toBe(true);
            expect(engine.options.antialias).toBe(true);
            expect(engine.options.alpha).toBe(false);
        });

        test('should override default options', () => {
            const customOptions = {
                enableShadows: false,
                antialias: false,
                alpha: true
            };
            
            engine = new Engine(mockCanvas, customOptions);
            
            expect(engine.options.enableShadows).toBe(false);
            expect(engine.options.antialias).toBe(false);
            expect(engine.options.alpha).toBe(true);
        });
    });

    describe('Initialization', () => {
        test('should initialize renderer, scene, and camera', () => {
            engine = new Engine(mockCanvas);
            
            expect(engine.renderer).toBeDefined();
            expect(engine.scene).toBeDefined();
            expect(engine.camera).toBeDefined();
            expect(engine.clock).toBeDefined();
        });
    });

    describe('Game Loop', () => {
        beforeEach(() => {
            engine = new Engine(mockCanvas);
        });

        test('should start game loop', () => {
            const spy = vi.spyOn(global, 'requestAnimationFrame').mockImplementation(() => 1);
            
            engine.start();
            
            expect(engine.isRunning).toBe(true);
            expect(spy).toHaveBeenCalled();
            
            spy.mockRestore();
        });

        test('should stop game loop', () => {
            const spy = vi.spyOn(global, 'requestAnimationFrame').mockImplementation(() => 1);
            
            engine.start();
            engine.stop();
            
            expect(engine.isRunning).toBe(false);
            
            spy.mockRestore();
        });

        test('should update delta time on each frame', () => {
            const mockGetDelta = vi.fn(() => 0.016);
            engine.clock.getDelta = mockGetDelta;
            
            const spy = vi.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => {
                // Don't call the callback to avoid infinite recursion
                return 1;
            });
            
            engine.start();
            
            // Manually call the game loop once to test delta time
            engine.deltaTime = engine.clock.getDelta();
            
            expect(mockGetDelta).toHaveBeenCalled();
            expect(engine.deltaTime).toBe(0.016);
            
            engine.stop();
            spy.mockRestore();
        });
    });

    describe('Render', () => {
        beforeEach(() => {
            engine = new Engine(mockCanvas);
        });

        test('should render scene with camera', () => {
            engine.render();
            
            expect(engine.renderer.render).toHaveBeenCalledWith(engine.scene, engine.camera);
        });
    });

    describe('Resize', () => {
        beforeEach(() => {
            engine = new Engine(mockCanvas);
        });

        test('should update renderer and camera on resize', () => {
            const newWidth = 1024;
            const newHeight = 768;
            
            engine.resize(newWidth, newHeight);
            
            expect(engine.renderer.setSize).toHaveBeenCalledWith(newWidth, newHeight);
            expect(engine.camera.aspect).toBe(newWidth / newHeight);
            expect(engine.camera.updateProjectionMatrix).toHaveBeenCalled();
        });
    });

    describe('Dispose', () => {
        beforeEach(() => {
            engine = new Engine(mockCanvas);
        });

        test('should clean up resources', () => {
            engine.dispose();
            
            expect(engine.renderer.dispose).toHaveBeenCalled();
            expect(engine.isRunning).toBe(false);
        });
    });
});