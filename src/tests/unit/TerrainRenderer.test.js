import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { TerrainRenderer } from '../../systems/TerrainRenderer.js';
import { Terrain } from '../../entities/Terrain.js';

// Mock THREE.js objects
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    WebGLRenderer: vi.fn(() => ({
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      shadowMap: { enabled: false, type: null },
      outputColorSpace: null,
      toneMapping: null,
      toneMappingExposure: 1,
      render: vi.fn(),
      dispose: vi.fn()
    }))
  };
});

describe('TerrainRenderer', () => {
  let terrainRenderer;
  let mockTerrain;

  beforeEach(() => {
    // Mock terrain with realistic data
    mockTerrain = {
      segments: 64,
      width: 256,
      height: 256,
      getHeightmapData: vi.fn(() => {
        // Return a simple 2D array for testing
        const heightmap = [];
        for (let i = 0; i <= 64; i++) {
          heightmap[i] = [];
          for (let j = 0; j <= 64; j++) {
            heightmap[i][j] = Math.sin(i * 0.1) * Math.cos(j * 0.1) * 10;
          }
        }
        return heightmap;
      }),
      getTextureWeights: vi.fn((x, z) => ({
        grass: 0.4,
        dirt: 0.3,
        rock: 0.2,
        sand: 0.1
      }))
    };

    terrainRenderer = new TerrainRenderer(mockTerrain);
  });

  describe('constructor', () => {
    it('should initialize with terrain', () => {
      expect(terrainRenderer.terrain).toBe(mockTerrain);
    });

    it('should create mesh, geometry, and material', () => {
      expect(terrainRenderer.mesh).toBeInstanceOf(THREE.Mesh);
      expect(terrainRenderer.geometry).toBeInstanceOf(THREE.PlaneGeometry);
      expect(terrainRenderer.material).toBeInstanceOf(THREE.MeshLambertMaterial);
    });

    it('should position mesh at world origin', () => {
      expect(terrainRenderer.mesh.position.x).toBe(0);
      expect(terrainRenderer.mesh.position.y).toBe(0);
      expect(terrainRenderer.mesh.position.z).toBe(0);
    });

    it('should configure mesh for shadows', () => {
      expect(terrainRenderer.mesh.receiveShadow).toBe(true);
      expect(terrainRenderer.mesh.castShadow).toBe(false);
    });
  });

  describe('mesh creation', () => {
    it('should create geometry with correct size', () => {
      // Verify PlaneGeometry was created with terrain dimensions
      expect(THREE.PlaneGeometry).toHaveBeenCalledWith(
        mockTerrain.width,
        mockTerrain.height,
        mockTerrain.segments,
        mockTerrain.segments
      );
    });

    it('should apply heightmap data to vertices', () => {
      // Check that heightmap data was used
      expect(mockTerrain.getHeightmapData).toHaveBeenCalled();
      
      // Verify vertices array exists and has been modified
      const vertices = terrainRenderer.geometry.attributes.position.array;
      expect(vertices).toBeDefined();
      expect(vertices.length).toBeGreaterThan(0);
    });

    it('should compute vertex normals', () => {
      // Mock the computeVertexNormals method to verify it was called
      const computeNormalsSpy = vi.spyOn(terrainRenderer.geometry, 'computeVertexNormals');
      terrainRenderer.createTerrainMesh();
      expect(computeNormalsSpy).toHaveBeenCalled();
    });
  });

  describe('material creation', () => {
    it('should create material with vertex colors', () => {
      expect(terrainRenderer.material.vertexColors).toBe(true);
    });

    it('should add vertex colors based on texture weights', () => {
      // Verify that texture weights were requested
      expect(mockTerrain.getTextureWeights).toHaveBeenCalled();
      
      // Check that color attribute was set
      const colorAttribute = terrainRenderer.geometry.attributes.color;
      expect(colorAttribute).toBeDefined();
      expect(colorAttribute.array.length).toBeGreaterThan(0);
    });
  });

  describe('terrain updates', () => {
    it('should update terrain mesh when heightmap changes', () => {
      const initialVertices = [...terrainRenderer.geometry.attributes.position.array];
      
      // Mock new heightmap data
      mockTerrain.getHeightmapData.mockReturnValue([]);
      
      terrainRenderer.updateTerrain();
      
      // Verify that heightmap was requested again
      expect(mockTerrain.getHeightmapData).toHaveBeenCalledTimes(2); // Once in constructor, once in update
    });

    it('should mark geometry for update', () => {
      terrainRenderer.updateTerrain();
      
      expect(terrainRenderer.geometry.attributes.position.needsUpdate).toBe(true);
      expect(terrainRenderer.geometry.attributes.color.needsUpdate).toBe(true);
    });
  });

  describe('mesh access', () => {
    it('should return mesh for scene addition', () => {
      const mesh = terrainRenderer.getMesh();
      expect(mesh).toBe(terrainRenderer.mesh);
      expect(mesh).toBeInstanceOf(THREE.Mesh);
    });
  });

  describe('raycasting', () => {
    it('should perform raycast on mesh', () => {
      const mockRaycaster = {
        intersectObject: vi.fn()
      };
      const intersects = [];
      
      terrainRenderer.raycast(mockRaycaster, intersects);
      
      expect(mockRaycaster.intersectObject).toHaveBeenCalledWith(terrainRenderer.mesh, false, intersects);
    });

    it('should handle null mesh gracefully', () => {
      terrainRenderer.mesh = null;
      const mockRaycaster = {
        intersectObject: vi.fn()
      };
      const intersects = [];
      
      expect(() => {
        terrainRenderer.raycast(mockRaycaster, intersects);
      }).not.toThrow();
      
      expect(mockRaycaster.intersectObject).not.toHaveBeenCalled();
    });
  });

  describe('disposal', () => {
    it('should dispose geometry and material', () => {
      const geometryDisposeSpy = vi.spyOn(terrainRenderer.geometry, 'dispose');
      const materialDisposeSpy = vi.spyOn(terrainRenderer.material, 'dispose');
      
      terrainRenderer.dispose();
      
      expect(geometryDisposeSpy).toHaveBeenCalled();
      expect(materialDisposeSpy).toHaveBeenCalled();
    });

    it('should clear references', () => {
      terrainRenderer.dispose();
      
      expect(terrainRenderer.geometry).toBeNull();
      expect(terrainRenderer.material).toBeNull();
      expect(terrainRenderer.mesh).toBeNull();
      expect(terrainRenderer.terrain).toBeNull();
    });

    it('should handle multiple dispose calls', () => {
      terrainRenderer.dispose();
      
      expect(() => {
        terrainRenderer.dispose();
      }).not.toThrow();
    });
  });
});