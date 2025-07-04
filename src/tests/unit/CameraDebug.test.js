import { describe, it, expect, beforeEach } from 'vitest';
import { CameraSystem } from '../../systems/Camera.js';
import { TigerModel } from '../../entities/TigerModel.js';

describe('Camera Debug', () => {
  let camera;
  let tigerModel;

  beforeEach(() => {
    camera = new CameraSystem(800, 600);
    tigerModel = new TigerModel();
    camera.setTarget(tigerModel);
  });

  it('should show current camera behavior', () => {
    // Tiger at origin, facing forward (0 rotation)
    tigerModel.setPosition(0, 0, 0);
    tigerModel.setRotation(0, 0, 0);

    // Update camera
    camera.update(0.016);

    const cameraPosition = camera.getCamera().position;
    const tigerPosition = tigerModel.position;

    console.log('Tiger position:', tigerPosition);
    console.log('Camera position:', cameraPosition);
    console.log('Distance:', cameraPosition.distanceTo(tigerPosition));
    console.log('Camera offset from tiger:', {
      x: cameraPosition.x - tigerPosition.x,
      y: cameraPosition.y - tigerPosition.y,
      z: cameraPosition.z - tigerPosition.z
    });

    expect(true).toBe(true); // Just for debugging
  });
});