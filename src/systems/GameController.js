import { Tiger } from '../entities/Tiger.js';
import { TigerModel } from '../entities/TigerModel.js';
import { CameraSystem } from './Camera.js';
import { InputSystem } from './Input.js';
import { MovementSystem } from './Movement.js';

export class GameController {
  constructor(scene, canvas) {
    if (!scene) {
      throw new Error('Scene is required');
    }
    if (!canvas) {
      throw new Error('Canvas is required');
    }

    this.scene = scene;
    this.canvas = canvas;

    // Game state
    this.isPaused = false;
    this.isPointerLocked = false;

    // Initialize core systems
    this.initializeSystems();
    this.setupConnections();
  }

  initializeSystems() {
    // Create tiger entity and model
    this.tiger = new Tiger();
    this.tigerModel = new TigerModel();

    // Create camera system
    this.camera = new CameraSystem(this.canvas.width, this.canvas.height);

    // Create input system
    this.input = new InputSystem(this.canvas);

    // Create movement system
    this.movementSystem = new MovementSystem(this.tiger);

    // Add tiger model to scene
    this.scene.add(this.tigerModel.getMesh());
  }

  setupConnections() {
    // Set camera target to follow tiger model
    this.camera.setTarget(this.tigerModel);

    // Setup input callbacks
    this.input.onMouseWheel = (event) => {
      this.camera.handleMouseWheel(event);
    };

    this.input.onPointerLockChange = (isLocked) => {
      this.isPointerLocked = isLocked;
    };
  }

  update(deltaTime) {
    if (this.isPaused) return;

    try {
      // Update systems in correct order
      this.input.update(deltaTime);
      
      // Process input and apply to movement
      this.processInput();
      
      // Update movement system
      this.movementSystem.update(deltaTime);
      
      // Update tiger logic
      this.tiger.update(deltaTime);
      
      // Sync tiger state to model
      this.syncTigerToModel();
      
      // Update 3D model
      this.tigerModel.update(deltaTime);
      
      // Update camera
      this.camera.update(deltaTime);
      
    } catch (error) {
      console.error('GameController update error:', error);
      // Continue running despite errors
    }
  }

  processInput() {
    // Get movement input
    const movementInput = {
      direction: this.input.getMovementDirection(),
      isRunning: this.input.isRunning(),
      isCrouching: this.input.isCrouching(),
      isJumping: this.input.isJumping()
    };

    // Apply to movement system
    this.movementSystem.setMovementInput(movementInput);
  }

  syncTigerToModel() {
    // Sync position
    this.tigerModel.setPosition(
      this.tiger.position.x,
      this.tiger.position.y,
      this.tiger.position.z
    );

    // Sync animation based on tiger state
    this.tigerModel.playAnimation(this.tiger.state);

    // Handle evolution changes
    if (this.tiger.evolutionStage !== this.tigerModel.evolutionStage) {
      switch (this.tiger.evolutionStage) {
        case 'Adult':
          this.tigerModel.evolveToAdult();
          break;
        case 'Alpha':
          this.tigerModel.evolveToAlpha();
          break;
      }
    }
  }

  // Public API methods
  getGameState() {
    return {
      tiger: this.tiger,
      camera: this.camera,
      isPointerLocked: this.isPointerLocked
    };
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  resize(width, height) {
    this.camera.updateAspectRatio(width, height);
  }

  // Get camera for rendering
  getCamera() {
    return this.camera.getCamera();
  }

  // Get scene objects (for physics/collision systems)
  getSceneObjects() {
    return [this.tigerModel.getMesh()];
  }

  // Reset game state
  reset() {
    // Reset tiger to starting state
    this.tiger = new Tiger();
    
    // Reset movement system
    this.movementSystem.reset();
    
    // Reset camera
    this.camera.reset();
    
    // Reset tiger model
    this.tigerModel.dispose();
    this.scene.remove(this.tigerModel.getMesh());
    
    this.tigerModel = new TigerModel();
    this.scene.add(this.tigerModel.getMesh());
    
    // Re-establish connections
    this.camera.setTarget(this.tigerModel);
    this.movementSystem.tiger = this.tiger;
    
    // Sync initial state
    this.syncTigerToModel();
  }

  // Cleanup
  dispose() {
    // Clean up input system
    if (this.input) {
      this.input.dispose();
      this.input.onMouseWheel = null;
      this.input.onPointerLockChange = null;
    }

    // Clean up tiger model
    if (this.tigerModel) {
      this.scene.remove(this.tigerModel.getMesh());
      this.tigerModel.dispose();
    }

    // Clean up references
    this.tiger = null;
    this.tigerModel = null;
    this.camera = null;
    this.input = null;
    this.movementSystem = null;
    this.scene = null;
    this.canvas = null;
  }

  // Development/debugging helpers
  getTigerPosition() {
    return {
      x: this.tiger.position.x,
      y: this.tiger.position.y,
      z: this.tiger.position.z
    };
  }

  setTigerPosition(x, y, z) {
    this.tiger.setPosition(x, y, z);
    this.syncTigerToModel();
  }

  getTigerStats() {
    return {
      health: this.tiger.health,
      stamina: this.tiger.stamina,
      hunger: this.tiger.hunger,
      level: this.tiger.level,
      experience: this.tiger.experience,
      evolutionStage: this.tiger.evolutionStage
    };
  }
}