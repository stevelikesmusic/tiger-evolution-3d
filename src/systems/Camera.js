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
    this.smoothness = 0.1; // Camera smoothing factor (0-1)
    this.minDistance = 5;
    this.maxDistance = 25;

    // Orbit controls
    this.orbitX = 0; // Horizontal orbit angle
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

    // Get target position and rotation
    const targetPos = new THREE.Vector3(
      this.target.position.x,
      this.target.position.y,
      this.target.position.z
    );

    // Calculate camera offset based on orbit angles and target rotation
    const targetRotation = this.target.rotation ? this.target.rotation.y : 0;
    const totalRotationY = targetRotation + this.orbitX;

    // Calculate spherical coordinates for camera position
    const horizontalDistance = this.distance * Math.cos(this.orbitY);
    const verticalDistance = this.distance * Math.sin(this.orbitY) + this.height;

    // Position camera behind and to the side of target
    const offsetX = horizontalDistance * Math.sin(totalRotationY);
    const offsetZ = horizontalDistance * Math.cos(totalRotationY);

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
    if (event.buttons === 1) { // Left mouse button held
      const sensitivity = 0.005;
      
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
    this.orbitX = 0;
    this.orbitY = 0.3;
    this.distance = 15;
    
    if (this.target) {
      this.calculateDesiredPosition();
      this.camera.position.copy(this.desiredPosition);
    }
  }
}