import { describe, it, expect, beforeEach } from 'vitest';
import { MovementSystem } from '../../systems/Movement.js';
import { CameraSystem } from '../../systems/Camera.js';
import { TigerModel } from '../../entities/TigerModel.js';
import { Tiger } from '../../entities/Tiger.js';

describe('Basic Movement and Camera Test', () => {
  let tiger;
  let tigerModel;
  let movementSystem;
  let camera;
  let deltaTime;

  beforeEach(() => {
    tiger = new Tiger();
    tigerModel = new TigerModel();
    movementSystem = new MovementSystem(tiger);
    camera = new CameraSystem(800, 600);
    camera.setTarget(tigerModel);
    deltaTime = 0.016;
  });

  it('should show current movement behavior', () => {
    console.log('=== INITIAL STATE ===');
    console.log('Tiger position:', tiger.position);
    console.log('Tiger rotation:', tiger.rotation.y);
    console.log('TigerModel position:', tigerModel.position);

    // Update camera to get initial position
    for (let i = 0; i < 50; i++) {
      camera.update(deltaTime);
    }
    
    console.log('Camera position:', camera.getCamera().position);
    console.log('Camera distance from tiger:', camera.getCamera().position.distanceTo(tigerModel.position));

    // Test pure left input (should only rotate)
    console.log('\n=== PRESSING LEFT (A) ===');
    movementSystem.setMovementInput({
      direction: { x: -1, z: 0 }, // Pure left
      isRunning: false,
      isCrouching: false,
      isJumping: false
    });

    for (let i = 0; i < 20; i++) {
      movementSystem.update(deltaTime);
      tigerModel.setPosition(tiger.position.x, tiger.position.y, tiger.position.z);
      tigerModel.setRotation(0, tiger.rotation.y, 0);
      camera.update(deltaTime);
    }

    console.log('Tiger position after left:', tiger.position);
    console.log('Tiger rotation after left:', tiger.rotation.y);
    console.log('Camera position after left:', camera.getCamera().position);

    // Test pure forward input
    console.log('\n=== PRESSING FORWARD (W) ===');
    movementSystem.setMovementInput({
      direction: { x: 0, z: -1 }, // Pure forward
      isRunning: false,
      isCrouching: false,
      isJumping: false
    });

    const beforePosition = tiger.position.clone();
    for (let i = 0; i < 20; i++) {
      movementSystem.update(deltaTime);
      tigerModel.setPosition(tiger.position.x, tiger.position.y, tiger.position.z);
      tigerModel.setRotation(0, tiger.rotation.y, 0);
      camera.update(deltaTime);
    }

    console.log('Tiger position after forward:', tiger.position);
    console.log('Movement delta:', tiger.position.clone().sub(beforePosition));
    console.log('Camera position after forward:', camera.getCamera().position);

    expect(true).toBe(true); // Just for logging
  });
});