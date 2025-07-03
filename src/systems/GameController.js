import { Tiger } from '../entities/Tiger.js';
import { TigerModel } from '../entities/TigerModel.js';
import { Terrain } from '../entities/Terrain.js';
import { CameraSystem } from './Camera.js';
import { InputSystem } from './Input.js';
import { MovementSystem } from './Movement.js';
import { VegetationSystem } from './VegetationSystem.js';
import { TerrainRenderer } from './TerrainRenderer.js';

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
    // Create terrain system
    this.terrain = new Terrain(512, 512, 128);
    this.terrain.generateHeightmap(12345); // Use consistent seed for now

    // Create terrain renderer and add to scene
    this.terrainRenderer = new TerrainRenderer(this.terrain);
    this.scene.add(this.terrainRenderer.getMesh());

    // Create tiger entity and model
    this.tiger = new Tiger();
    this.tigerModel = new TigerModel();

    // Create camera system
    this.camera = new CameraSystem(this.canvas.width, this.canvas.height);

    // Create input system
    this.input = new InputSystem(this.canvas);

    // Create movement system
    this.movementSystem = new MovementSystem(this.tiger, this.terrain);

    // Create vegetation system
    this.vegetationSystem = new VegetationSystem(this.scene, this.terrain);
    this.vegetationSystem.generateVegetation(12345); // Use consistent seed

    // Position tiger on terrain surface
    this.positionTigerOnTerrain();

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
      
      // Update vegetation system (for wind effects, etc.)
      if (this.vegetationSystem) {
        this.vegetationSystem.update(deltaTime);
      }
      
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

    // Handle camera control with mouse movement
    const mouseDelta = this.input.getMouseDelta();
    
    if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
      // Create a mock event for camera system
      const mockEvent = {
        movementX: mouseDelta.x,
        movementY: mouseDelta.y,
        buttons: 0 // No buttons needed for pointer lock
      };
      this.camera.handleMouseMove(mockEvent);
    }
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
    // Reset terrain with new heightmap
    if (this.terrain) {
      this.terrain.generateHeightmap();
      
      // Update terrain renderer
      if (this.terrainRenderer) {
        this.terrainRenderer.updateTerrain();
      }
    }

    // Reset vegetation
    if (this.vegetationSystem) {
      this.vegetationSystem.generateVegetation();
    }

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
    this.movementSystem.setTerrain(this.terrain);
    
    // Position tiger on terrain
    this.positionTigerOnTerrain();
    
    // Sync initial state
    this.syncTigerToModel();
  }

  // Cleanup
  dispose() {
    // Clean up vegetation system
    if (this.vegetationSystem) {
      this.vegetationSystem.dispose();
    }

    // Clean up terrain renderer
    if (this.terrainRenderer) {
      this.scene.remove(this.terrainRenderer.getMesh());
      this.terrainRenderer.dispose();
    }

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
    this.terrain = null;
    this.terrainRenderer = null;
    this.vegetationSystem = null;
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

  // Terrain and vegetation access methods
  getTerrain() {
    return this.terrain;
  }

  getVegetationSystem() {
    return this.vegetationSystem;
  }

  getVegetationStats() {
    return this.vegetationSystem ? this.vegetationSystem.getStatistics() : null;
  }

  positionTigerOnTerrain() {
    if (this.terrain && this.tiger) {
      // Start tiger at center of terrain
      const centerX = 0;
      const centerZ = 0;
      const terrainHeight = this.terrain.getHeightAt(centerX, centerZ);
      const tigerHeight = 1.0; // Height above ground
      
      this.tiger.setPosition(centerX, terrainHeight + tigerHeight, centerZ);
    }
  }

  regenerateTerrain(seed) {
    if (this.terrain) {
      this.terrain.generateHeightmap(seed);
      
      // Update terrain renderer
      if (this.terrainRenderer) {
        this.terrainRenderer.updateTerrain();
      }
      
      // Regenerate vegetation to match new terrain
      if (this.vegetationSystem) {
        this.vegetationSystem.generateVegetation(seed);
      }

      // Reposition tiger on new terrain
      this.positionTigerOnTerrain();
    }
  }
}