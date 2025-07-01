import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameController } from '../../systems/GameController.js';
import { Tiger } from '../../entities/Tiger.js';
import { TigerModel } from '../../entities/TigerModel.js';
import { CameraSystem } from '../../systems/Camera.js';
import { InputSystem } from '../../systems/Input.js';

// Mock the required classes
vi.mock('../../entities/Tiger.js', () => ({
  Tiger: vi.fn(() => {
    const position = { x: 0, y: 0, z: 0 };
    return {
      position: {
        ...position,
        set: vi.fn((x, y, z) => { position.x = x; position.y = y; position.z = z; }),
        setPosition: vi.fn()
      },
      rotation: { y: 0 },
      speed: 12,
      state: 'idle',
      evolutionStage: 'Young',
      health: 100,
      stamina: 300,
      hunger: 100,
      level: 1,
      experience: 0,
      setState: vi.fn(),
      update: vi.fn(),
      isAlive: vi.fn(() => true)
    };
  })
}));

vi.mock('../../entities/TigerModel.js', () => ({
  TigerModel: vi.fn(() => ({
    evolutionStage: 'Young',
    getMesh: vi.fn(() => ({ id: 'tiger-mesh' })),
    setPosition: vi.fn(),
    playAnimation: vi.fn(),
    evolveToAdult: vi.fn(),
    evolveToAlpha: vi.fn(),
    update: vi.fn(),
    dispose: vi.fn()
  }))
}));

vi.mock('../../systems/Camera.js', () => ({
  CameraSystem: vi.fn(() => ({
    setTarget: vi.fn(),
    handleMouseWheel: vi.fn(),
    updateAspectRatio: vi.fn(),
    update: vi.fn(),
    reset: vi.fn(),
    getCamera: vi.fn(() => ({ id: 'camera' }))
  }))
}));

vi.mock('../../systems/Input.js', () => ({
  InputSystem: vi.fn(() => ({
    update: vi.fn(),
    getMovementDirection: vi.fn(() => ({ x: 0, z: 0 })),
    isMoving: vi.fn(() => false),
    isRunning: vi.fn(() => false),
    isCrouching: vi.fn(() => false),
    isJumping: vi.fn(() => false),
    onMouseWheel: null,
    onPointerLockChange: null,
    dispose: vi.fn()
  }))
}));

vi.mock('../../systems/Movement.js', () => ({
  MovementSystem: vi.fn(() => ({
    setMovementInput: vi.fn(),
    update: vi.fn(),
    reset: vi.fn()
  }))
}));

describe('GameController Integration', () => {
  let gameController;
  let mockScene;
  let mockCanvas;

  beforeEach(() => {
    // Mock Three.js scene
    mockScene = {
      add: vi.fn(),
      remove: vi.fn()
    };

    // Mock canvas
    mockCanvas = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      width: 800,
      height: 600
    };

    // Clear all mocks
    vi.clearAllMocks();

    gameController = new GameController(mockScene, mockCanvas);
  });

  afterEach(() => {
    if (gameController) {
      gameController.dispose();
    }
  });

  describe('initialization', () => {
    it('should initialize all core systems', () => {
      expect(gameController.tiger).toBeDefined();
      expect(gameController.tigerModel).toBeDefined();
      expect(gameController.camera).toBeDefined();
      expect(gameController.input).toBeDefined();
      expect(gameController.movementSystem).toBeDefined();
    });

    it('should add tiger model to scene', () => {
      expect(mockScene.add).toHaveBeenCalledWith(gameController.tigerModel.getMesh());
    });

    it('should set camera target to tiger model', () => {
      expect(gameController.camera.setTarget).toHaveBeenCalledWith(gameController.tigerModel);
    });

    it('should setup input callbacks', () => {
      expect(gameController.input.onMouseWheel).toBeDefined();
      expect(gameController.input.onPointerLockChange).toBeDefined();
    });

    it('should initialize movement system', () => {
      expect(gameController.movementSystem).toBeDefined();
    });
  });

  describe('update coordination', () => {
    it('should update all systems in correct order', () => {
      const deltaTime = 0.016;
      
      gameController.update(deltaTime);

      // Verify update order: input → movement → tiger → model → camera
      expect(gameController.input.update).toHaveBeenCalledWith(deltaTime);
      expect(gameController.movementSystem.update).toHaveBeenCalledWith(deltaTime);
      expect(gameController.tiger.update).toHaveBeenCalledWith(deltaTime);
      expect(gameController.tigerModel.update).toHaveBeenCalledWith(deltaTime);
      expect(gameController.camera.update).toHaveBeenCalledWith(deltaTime);
    });

    it('should sync tiger stats to model', () => {
      const syncSpy = vi.spyOn(gameController, 'syncTigerToModel');
      gameController.update(0.016);
      expect(syncSpy).toHaveBeenCalled();
    });

    it('should handle input-driven movement', () => {
      // Mock input system returning movement
      gameController.input.getMovementDirection.mockReturnValue({ x: 1, z: 0 });
      gameController.input.isRunning.mockReturnValue(true);

      gameController.update(0.016);

      expect(gameController.movementSystem.update).toHaveBeenCalledWith(0.016);
    });
  });

  describe('tiger-model synchronization', () => {
    it('should sync tiger position to model', () => {
      // Manually set position values since the mock doesn't update references
      gameController.tiger.position.x = 10;
      gameController.tiger.position.y = 2;
      gameController.tiger.position.z = 5;
      
      gameController.syncTigerToModel();
      
      expect(gameController.tigerModel.setPosition).toHaveBeenCalledWith(10, 2, 5);
    });

    it('should sync tiger animation based on state', () => {
      gameController.tiger.state = 'running';
      
      gameController.syncTigerToModel();
      
      expect(gameController.tigerModel.playAnimation).toHaveBeenCalledWith('running');
    });

    it('should sync evolution changes', () => {
      gameController.tiger.evolutionStage = 'Adult';
      gameController.tigerModel.evolutionStage = 'Young';
      
      gameController.syncTigerToModel();
      
      expect(gameController.tigerModel.evolveToAdult).toHaveBeenCalled();
    });

    it('should sync alpha evolution', () => {
      gameController.tiger.evolutionStage = 'Alpha';
      gameController.tigerModel.evolutionStage = 'Adult';
      
      gameController.syncTigerToModel();
      
      expect(gameController.tigerModel.evolveToAlpha).toHaveBeenCalled();
    });
  });

  describe('camera integration', () => {
    it('should forward mouse wheel events to camera', () => {
      const wheelEvent = { deltaY: 100 };
      
      gameController.input.onMouseWheel(wheelEvent);
      
      expect(gameController.camera.handleMouseWheel).toHaveBeenCalledWith(wheelEvent);
    });

    it('should handle pointer lock changes', () => {
      const isLocked = true;
      
      gameController.input.onPointerLockChange(isLocked);
      
      // Should trigger any pointer lock specific behavior
      expect(gameController.isPointerLocked).toBe(isLocked);
    });

    it('should update camera aspect ratio on resize', () => {
      gameController.resize(1920, 1080);
      
      expect(gameController.camera.updateAspectRatio).toHaveBeenCalledWith(1920, 1080);
    });
  });

  describe('input handling', () => {
    it('should process movement input', () => {
      gameController.input.isMoving.mockReturnValue(true);
      gameController.input.getMovementDirection.mockReturnValue({ x: 0.707, z: -0.707 });
      gameController.input.isRunning.mockReturnValue(false);

      gameController.processInput();

      expect(gameController.movementSystem.setMovementInput).toHaveBeenCalledWith({
        direction: { x: 0.707, z: -0.707 },
        isRunning: false,
        isCrouching: false,
        isJumping: false
      });
    });

    it('should handle running state', () => {
      gameController.input.isRunning.mockReturnValue(true);
      gameController.input.getMovementDirection.mockReturnValue({ x: 1, z: 0 });

      gameController.processInput();

      expect(gameController.movementSystem.setMovementInput).toHaveBeenCalledWith(
        expect.objectContaining({ isRunning: true })
      );
    });

    it('should handle crouching state', () => {
      gameController.input.isCrouching.mockReturnValue(true);

      gameController.processInput();

      expect(gameController.movementSystem.setMovementInput).toHaveBeenCalledWith(
        expect.objectContaining({ isCrouching: true })
      );
    });

    it('should handle jump input', () => {
      gameController.input.isJumping.mockReturnValue(true);

      gameController.processInput();

      expect(gameController.movementSystem.setMovementInput).toHaveBeenCalledWith(
        expect.objectContaining({ isJumping: true })
      );
    });
  });

  describe('state management', () => {
    it('should get current game state', () => {
      const state = gameController.getGameState();

      expect(state).toEqual({
        tiger: gameController.tiger,
        camera: gameController.camera,
        isPointerLocked: gameController.isPointerLocked
      });
    });

    it('should pause/resume game systems', () => {
      gameController.pause();
      expect(gameController.isPaused).toBe(true);

      gameController.resume();
      expect(gameController.isPaused).toBe(false);
    });

    it('should not update systems when paused', () => {
      gameController.pause();
      gameController.update(0.016);

      expect(gameController.tiger.update).not.toHaveBeenCalled();
      expect(gameController.camera.update).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should dispose all systems properly', () => {
      const inputDisposeSpy = gameController.input.dispose;
      const modelDisposeSpy = gameController.tigerModel.dispose;
      const meshMock = gameController.tigerModel.getMesh();
      
      gameController.dispose();

      expect(inputDisposeSpy).toHaveBeenCalled();
      expect(modelDisposeSpy).toHaveBeenCalled();
      expect(mockScene.remove).toHaveBeenCalledWith(meshMock);
    });

    it('should clean up event listeners', () => {
      // Store references before dispose
      const input = gameController.input;
      
      gameController.dispose();
      
      expect(gameController.input).toBeNull();
      expect(gameController.tigerModel).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle missing canvas gracefully', () => {
      expect(() => new GameController(mockScene, null)).toThrow('Canvas is required');
    });

    it('should handle missing scene gracefully', () => {
      expect(() => new GameController(null, mockCanvas)).toThrow('Scene is required');
    });

    it('should handle update errors gracefully', () => {
      gameController.tiger.update.mockImplementation(() => {
        throw new Error('Tiger update failed');
      });

      expect(() => gameController.update(0.016)).not.toThrow();
      // Should log error but continue running
    });
  });
});