import * as THREE from 'three';

export class CameraSystem {
  constructor(width, height) {
    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of view
      width / height, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );

    // Camera configuration
    this.distance = 15; // Distance from target
    this.height = 8; // Height offset above target
    this.smoothness = 0.3; // Camera smoothing factor (0-1) - increased for responsiveness
    this.minDistance = 5;
    this.maxDistance = 25;

    // Orbit controls
    this.orbitX = Math.PI; // Horizontal orbit angle (start behind tiger: π radians = behind tiger)
    this.orbitY = 0.3; // Vertical orbit angle (slightly above)
    this.maxOrbitY = Math.PI / 3; // 60 degrees up/down limit

    // Target to follow
    this.target = null;

    // Collision detection
    this.raycaster = new THREE.Raycaster();
    this.raycaster.near = 0.1;
    this.raycaster.far = this.maxDistance;

    // Desired position for smooth interpolation
    this.desiredPosition = new THREE.Vector3();
    this.currentPosition = new THREE.Vector3();
  }

  // Set the target object to follow (usually the tiger)
  setTarget(target) {
    this.target = target;
    if (target) {
      // Initialize camera position relative to target
      this.currentPosition.copy(this.camera.position);
    }
  }

  // Calculate the desired camera position based on target and orbit
  calculateDesiredPosition() {
    if (!this.target) return this.desiredPosition;

    // Get target position
    const targetPos = new THREE.Vector3(
      this.target.position.x,
      this.target.position.y,
      this.target.position.z
    );

    // Enhanced camera positioning - combine orbit with tiger rotation for proper following
    // This creates a third-person camera that stays behind the tiger as it rotates
    const tigerRotation = this.target.rotation ? this.target.rotation.y : 0;
    const cameraAngle = this.orbitX + tigerRotation; // Combine orbit with tiger rotation

    // Calculate spherical coordinates for camera position
    const horizontalDistance = this.distance * Math.cos(this.orbitY);
    const verticalDistance = this.distance * Math.sin(this.orbitY) + this.height;

    // Position camera using spherical coordinates around target
    // Note: In Three.js, negative Z is forward, positive Z is backward
    const offsetX = Math.sin(cameraAngle) * horizontalDistance;
    const offsetZ = Math.cos(cameraAngle) * horizontalDistance;

    this.desiredPosition.set(
      targetPos.x + offsetX,
      targetPos.y + verticalDistance,
      targetPos.z + offsetZ
    );

    return this.desiredPosition;
  }

  // Handle mouse wheel for zooming
  handleMouseWheel(event) {
    const zoomSpeed = 0.001;
    this.distance += event.deltaY * zoomSpeed;
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
  }

  // Handle mouse movement for orbiting
  handleMouseMove(event) {
    // Work with pointer lock (no button check needed) or mouse drag
    const isPointerLocked = document.pointerLockElement !== null;
    const shouldOrbit = isPointerLocked || event.buttons === 1;
    
    if (shouldOrbit) {
      const sensitivity = 0.003; // Reduced sensitivity for smoother control
      
      this.orbitX -= event.movementX * sensitivity;
      this.orbitY -= event.movementY * sensitivity;
      
      // Clamp vertical orbit
      this.orbitY = Math.max(-this.maxOrbitY, Math.min(this.maxOrbitY, this.orbitY));
    }
  }

  // Check for collisions between camera and target
  checkCollision(obstacles) {
    if (!this.target || !obstacles.length) return false;

    // Create ray from target to camera
    const targetPos = new THREE.Vector3(
      this.target.position.x,
      this.target.position.y + 1, // Slightly above ground
      this.target.position.z
    );

    const cameraPos = this.desiredPosition.clone();
    const direction = cameraPos.sub(targetPos).normalize();

    // Set up raycaster
    this.raycaster.set(targetPos, direction);
    
    // Check for intersections
    const intersections = this.raycaster.intersectObjects(obstacles);
    
    if (intersections.length > 0) {
      const firstHit = intersections[0];
      const distanceToObstacle = firstHit.distance;
      const desiredDistance = targetPos.distanceTo(this.desiredPosition);
      
      // If obstacle is closer than desired camera position
      if (distanceToObstacle < desiredDistance) {
        // Adjust camera position to be just in front of obstacle
        const safeDistance = Math.max(distanceToObstacle - 1, this.minDistance);
        this.distance = Math.min(this.distance, safeDistance);
        return true;
      }
    }
    
    return false;
  }

  // Update camera position and rotation
  update(deltaTime) {
    if (!this.target) return;

    // Store previous position for logging
    const prevCameraPosition = this.camera.position.clone();

    // Clamp distance within valid range
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    
    // Clamp vertical orbit angle
    this.orbitY = Math.max(-this.maxOrbitY, Math.min(this.maxOrbitY, this.orbitY));

    // Calculate desired position
    this.calculateDesiredPosition();

    // Smoothly interpolate to desired position
    this.camera.position.lerp(this.desiredPosition, this.smoothness);

    // Look at target with slight forward offset
    const lookAtTarget = new THREE.Vector3(
      this.target.position.x,
      this.target.position.y + 1,
      this.target.position.z
    );

    this.camera.lookAt(lookAtTarget);

    // Log camera data when position changes significantly (throttled)
    if (this.camera.position.distanceTo(prevCameraPosition) > 0.01) {
      this.logCounter = (this.logCounter || 0) + 1;
      if (this.logCounter % 120 === 0) { // Log every 120 frames
        this.logCameraData(deltaTime, prevCameraPosition);
      }
    }
  }

  logCameraData(deltaTime, prevPosition) {
    const currentPosition = this.camera.position.clone();
    const positionDelta = currentPosition.sub(prevPosition);
    const targetRotation = this.target.rotation ? this.target.rotation.y : 0;
    
    console.log('📷 CAMERA SYSTEM:', {
      deltaTime: deltaTime.toFixed(4),
      target: {
        position: {
          x: this.target.position.x.toFixed(2),
          y: this.target.position.y.toFixed(2),
          z: this.target.position.z.toFixed(2)
        },
        rotation: (targetRotation * 180 / Math.PI).toFixed(1) + '°'
      },
      camera: {
        position: {
          x: this.camera.position.x.toFixed(2),
          y: this.camera.position.y.toFixed(2),
          z: this.camera.position.z.toFixed(2)
        },
        desired: {
          x: this.desiredPosition.x.toFixed(2),
          y: this.desiredPosition.y.toFixed(2),
          z: this.desiredPosition.z.toFixed(2)
        },
        distance: this.distance.toFixed(2),
        orbit: {
          x: (this.orbitX * 180 / Math.PI).toFixed(1) + '°',
          y: (this.orbitY * 180 / Math.PI).toFixed(1) + '°'
        }
      },
      deltas: {
        position: {
          x: positionDelta.x.toFixed(3),
          y: positionDelta.y.toFixed(3),
          z: positionDelta.z.toFixed(3)
        },
        magnitude: positionDelta.length().toFixed(3)
      },
      smoothness: this.smoothness
    });
  }

  // Configuration methods
  updateAspectRatio(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setDistance(distance) {
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, distance));
  }

  setHeight(height) {
    this.height = height;
  }

  setSmoothness(smoothness) {
    this.smoothness = Math.max(0.01, Math.min(1, smoothness));
  }

  // Get camera for rendering
  getCamera() {
    return this.camera;
  }

  // Get current camera position
  getPosition() {
    return this.camera.position.clone();
  }

  // Reset camera to default position relative to target
  reset() {
    this.orbitX = Math.PI; // Reset to behind tiger (π radians with tiger rotation)
    this.orbitY = 0.3;
    this.distance = 15;
    
    if (this.target) {
      this.calculateDesiredPosition();
      this.camera.position.copy(this.desiredPosition);
    }
  }
}