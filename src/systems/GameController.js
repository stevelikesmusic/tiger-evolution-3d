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
    
    // Expose debug API
    this.exposeDebugAPI();
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
      
      // Log position sync issues
      this.logPositionSync();
      
    } catch (error) {
      console.error('GameController update error:', error);
      // Continue running despite errors
    }
  }

  logPositionSync() {
    this.positionLogCounter = (this.positionLogCounter || 0) + 1;
    if (this.positionLogCounter % 120 === 0) { // Log every 120 frames (~2 seconds at 60fps)
      const tigerModelPos = this.tigerModel.getMesh().position;
      const tigerModelRot = this.tigerModel.getMesh().rotation;
      const positionDiff = Math.abs(this.tiger.position.x - tigerModelPos.x) + 
                          Math.abs(this.tiger.position.y - tigerModelPos.y) + 
                          Math.abs(this.tiger.position.z - tigerModelPos.z);
      
      if (positionDiff > 0.1) { // Only log if there's a significant difference
        console.log('⚠️ POSITION SYNC ISSUE:', JSON.stringify({
          tiger: {
            entity: { x: this.tiger.position.x.toFixed(2), y: this.tiger.position.y.toFixed(2), z: this.tiger.position.z.toFixed(2) },
            model: { x: tigerModelPos.x.toFixed(2), y: tigerModelPos.y.toFixed(2), z: tigerModelPos.z.toFixed(2) },
            difference: positionDiff.toFixed(3)
          },
          camera: {
            pos: { x: this.camera.camera.position.x.toFixed(2), y: this.camera.camera.position.y.toFixed(2), z: this.camera.camera.position.z.toFixed(2) },
            target: this.camera.target ? 'TigerModel' : 'null'
          }
        }, null, 2));
      }
    }
  }

  processInput() {
    // Get tank controls input - separate movement and rotation
    const movementInput = {
      direction: this.input.getMovementDirection(), // Only forward/backward (W/S)
      rotation: this.input.getRotationDirection(), // Only left/right rotation (A/D)
      isRunning: this.input.isRunning(),
      isCrouching: this.input.isCrouching(),
      isJumping: this.input.isJumping()
    };

    // Log input data when there's significant input (throttled)
    const inputMagnitude = Math.abs(movementInput.direction.z);
    const rotationMagnitude = Math.abs(movementInput.rotation);
    if (inputMagnitude > 0.1 || rotationMagnitude > 0.1) {
      // Only log every 30 frames to reduce spam
      this.inputLogCounter = (this.inputLogCounter || 0) + 1;
      if (this.inputLogCounter % 30 === 0) {
        console.log('🎮 TANK CONTROLS INPUT:', JSON.stringify({
          movement: {
            z: movementInput.direction.z.toFixed(2),
            magnitude: inputMagnitude.toFixed(2)
          },
          rotation: movementInput.rotation.toFixed(2),
          isRunning: movementInput.isRunning,
          isCrouching: movementInput.isCrouching,
          isJumping: movementInput.isJumping,
          pointerLocked: this.isPointerLocked
        }, null, 2));
      }
    }

    // Apply to movement system
    this.movementSystem.setMovementInput(movementInput);

    // Handle camera control with mouse movement
    const mouseDelta = this.input.getMouseDelta();
    
    if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
      console.log('🔍 MOUSE INPUT:', {
        delta: {
          x: mouseDelta.x.toFixed(2),
          y: mouseDelta.y.toFixed(2)
        },
        pointerLocked: this.isPointerLocked
      });
      
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

    // Sync rotation (only Y-axis rotation for turning)
    if (this.tiger.rotation !== undefined) {
      this.tigerModel.setRotation(0, this.tiger.rotation.y, 0);
    }

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

  // Make debug function globally accessible
  exposeDebugAPI() {
    if (typeof window !== 'undefined') {
      window.tigerGame = {
        logState: () => this.logGameState(),
        getTigerPosition: () => this.getTigerPosition(),
        getTigerStats: () => this.getTigerStats(),
        getMovementSystem: () => this.movementSystem,
        getCamera: () => this.camera,
        resetKeys: () => this.input.resetAllKeys(),
        getKeys: () => this.input.keys,
        validateKeys: () => this.input.validateKeyStates(),
        getPhysicalKeys: () => Array.from(this.input.physicalKeys),
        forceKeyState: (key, state) => {
          if (this.input.keys.hasOwnProperty(key)) {
            this.input.keys[key] = state;
            console.log(`🔧 Manually set ${key} to ${state}`);
          } else {
            console.log(`⚠️ Invalid key: ${key}`);
          }
        },
        logPositions: () => {
          const tigerModelPos = this.tigerModel.getMesh().position;
          const tigerModelRot = this.tigerModel.getMesh().rotation;
          console.log('📍 POSITION DEBUG:', JSON.stringify({
            tiger: {
              entity: { x: this.tiger.position.x.toFixed(2), y: this.tiger.position.y.toFixed(2), z: this.tiger.position.z.toFixed(2) },
              model: { x: tigerModelPos.x.toFixed(2), y: tigerModelPos.y.toFixed(2), z: tigerModelPos.z.toFixed(2) },
              entityRot: this.tiger.rotation ? (this.tiger.rotation.y * 180 / Math.PI).toFixed(1) + '°' : '0°',
              modelRot: (tigerModelRot.y * 180 / Math.PI).toFixed(1) + '°'
            },
            camera: {
              pos: { x: this.camera.camera.position.x.toFixed(2), y: this.camera.camera.position.y.toFixed(2), z: this.camera.camera.position.z.toFixed(2) },
              desired: { x: this.camera.desiredPosition.x.toFixed(2), y: this.camera.desiredPosition.y.toFixed(2), z: this.camera.desiredPosition.z.toFixed(2) },
              distance: this.camera.distance.toFixed(2)
            }
          }, null, 2));
        }
      };
      console.log('🔍 Debug API exposed: window.tigerGame');
      console.log('Available commands:');
      console.log('  window.tigerGame.logState() - Log complete game state');
      console.log('  window.tigerGame.getTigerPosition() - Get tiger position');
      console.log('  window.tigerGame.getTigerStats() - Get tiger stats');
      console.log('  window.tigerGame.resetKeys() - Reset all stuck keys');
      console.log('  window.tigerGame.getKeys() - Show current key states');
      console.log('  window.tigerGame.validateKeys() - Validate and fix key states');
      console.log('  window.tigerGame.getPhysicalKeys() - Show physically pressed keys');
      console.log('  window.tigerGame.forceKeyState(key, state) - Manually set key state');
      console.log('  window.tigerGame.logPositions() - Log tiger and camera positions');
    }
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

  // Log complete game state for debugging
  logGameState() {
    const tigerModelPos = this.tigerModel.getMesh().position;
    const tigerModelRot = this.tigerModel.getMesh().rotation;
    const cameraLookAt = new THREE.Vector3();
    this.camera.camera.getWorldDirection(cameraLookAt);
    
    console.log('🎮 GAME STATE DEBUG:', JSON.stringify({
      tiger: {
        entityPosition: {
          x: this.tiger.position.x.toFixed(2),
          y: this.tiger.position.y.toFixed(2),
          z: this.tiger.position.z.toFixed(2)
        },
        modelPosition: {
          x: tigerModelPos.x.toFixed(2),
          y: tigerModelPos.y.toFixed(2),
          z: tigerModelPos.z.toFixed(2)
        },
        entityRotation: this.tiger.rotation ? (this.tiger.rotation.y * 180 / Math.PI).toFixed(1) + '°' : '0°',
        modelRotation: {
          x: (tigerModelRot.x * 180 / Math.PI).toFixed(1) + '°',
          y: (tigerModelRot.y * 180 / Math.PI).toFixed(1) + '°',
          z: (tigerModelRot.z * 180 / Math.PI).toFixed(1) + '°'
        },
        state: this.tiger.state,
        velocity: {
          x: this.movementSystem.velocity.x.toFixed(2),
          y: this.movementSystem.velocity.y.toFixed(2),
          z: this.movementSystem.velocity.z.toFixed(2)
        },
        isGrounded: this.movementSystem.isGrounded,
        isMoving: this.movementSystem.isMoving,
        isRunning: this.movementSystem.isRunning
      },
      camera: {
        position: {
          x: this.camera.camera.position.x.toFixed(2),
          y: this.camera.camera.position.y.toFixed(2),
          z: this.camera.camera.position.z.toFixed(2)
        },
        desiredPosition: {
          x: this.camera.desiredPosition.x.toFixed(2),
          y: this.camera.desiredPosition.y.toFixed(2),
          z: this.camera.desiredPosition.z.toFixed(2)
        },
        lookingAt: {
          x: cameraLookAt.x.toFixed(2),
          y: cameraLookAt.y.toFixed(2),
          z: cameraLookAt.z.toFixed(2)
        },
        distance: this.camera.distance.toFixed(2),
        orbit: {
          x: (this.camera.orbitX * 180 / Math.PI).toFixed(1) + '°',
          y: (this.camera.orbitY * 180 / Math.PI).toFixed(1) + '°'
        },
        target: this.camera.target ? 'TigerModel' : 'null'
      },
      terrain: {
        heightAtTiger: this.terrain.getHeightAt(this.tiger.position.x, this.tiger.position.z).toFixed(2),
        slopeAtTiger: this.terrain.getSlope(this.tiger.position.x, this.tiger.position.z).toFixed(3)
      },
      input: {
        direction: this.input.getMovementDirection(),
        pointerLocked: this.isPointerLocked
      },
      sync: {
        positionDifference: {
          x: (this.tiger.position.x - tigerModelPos.x).toFixed(3),
          y: (this.tiger.position.y - tigerModelPos.y).toFixed(3),
          z: (this.tiger.position.z - tigerModelPos.z).toFixed(3)
        }
      },
      timestamp: new Date().toISOString()
    }, null, 2));
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
    if (this.terrain && this.tiger && this.tigerModel) {
      // Start tiger at center of terrain
      const centerX = 0;
      const centerZ = 0;
      const terrainHeight = this.terrain.getHeightAt(centerX, centerZ);
      const tigerHeight = 1.0; // Height above ground
      
      // Set tiger entity position
      this.tiger.position.set(centerX, terrainHeight + tigerHeight, centerZ);
      
      // Set tiger model position and rotation
      this.tigerModel.setPosition(centerX, terrainHeight + tigerHeight, centerZ);
      
      // Set tiger to face away from camera initially
      // Tiger head is at negative Z (-1.9), tail is at positive Z (+2.3)
      // Camera is positioned at positive Z relative to tiger
      // No rotation needed - tiger should already face away from camera
      this.tigerModel.setRotation(0, 0, 0); // No rotation - default orientation
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