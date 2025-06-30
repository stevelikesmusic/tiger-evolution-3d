import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Engine } from '../../core/Engine.js';

describe('Engine', () => {
    let engine;
    let mockCanvas;

    beforeEach(() => {
        // Mock canvas element
        mockCanvas = {
            getContext: jest.fn(),
            width: 800,
            height: 600,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };
        
        // Mock WebGL context
        const mockWebGLContext = {
            getExtension: jest.fn(),
            getParameter: jest.fn(),
            createProgram: jest.fn(),
            createShader: jest.fn()
        };
        
        mockCanvas.getContext.mockReturnValue(mockWebGLContext);
        
        // Mock Three.js globals for testing
        global.THREE = {
            WebGLRenderer: jest.fn().mockImplementation(() => ({
                setSize: jest.fn(),
                setPixelRatio: jest.fn(),
                shadowMap: { enabled: false, type: null },
                outputEncoding: null,
                toneMapping: null,
                toneMappingExposure: 1,
                domElement: mockCanvas,
                render: jest.fn(),
                dispose: jest.fn()
            })),
            Scene: jest.fn().mockImplementation(() => ({
                add: jest.fn(),
                remove: jest.fn()
            })),
            PerspectiveCamera: jest.fn().mockImplementation(() => ({
                position: { set: jest.fn() },
                lookAt: jest.fn(),
                updateProjectionMatrix: jest.fn()
            })),
            Clock: jest.fn().mockImplementation(() => ({
                getDelta: jest.fn(() => 0.016),
                getElapsedTime: jest.fn(() => 1.0)
            })),
            Color: jest.fn(),
            Fog: jest.fn()
        };
    });

    afterEach(() => {
        if (engine) {
            engine.dispose();
        }
        delete global.THREE;
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

        test('should set up renderer with correct options', () => {
            engine = new Engine(mockCanvas);
            
            expect(global.THREE.WebGLRenderer).toHaveBeenCalledWith({
                canvas: mockCanvas,
                antialias: true,
                alpha: false
            });
        });

        test('should configure camera with correct parameters', () => {
            engine = new Engine(mockCanvas);
            
            expect(global.THREE.PerspectiveCamera).toHaveBeenCalledWith(
                75, // fov
                mockCanvas.width / mockCanvas.height, // aspect
                0.1, // near
                1000 // far
            );
        });
    });

    describe('Game Loop', () => {
        beforeEach(() => {
            engine = new Engine(mockCanvas);
        });

        test('should start game loop', () => {
            const spy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb());
            
            engine.start();
            
            expect(engine.isRunning).toBe(true);
            expect(spy).toHaveBeenCalled();
            
            spy.mockRestore();
        });

        test('should stop game loop', () => {
            engine.start();
            engine.stop();
            
            expect(engine.isRunning).toBe(false);
        });

        test('should update delta time on each frame', () => {
            const mockGetDelta = jest.fn(() => 0.016);
            engine.clock.getDelta = mockGetDelta;
            
            const spy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
                cb();
                return 1;
            });
            
            engine.start();
            
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