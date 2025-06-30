# TDD Implementation Plan for Tiger Evolution 3D

## Testing Framework Setup

### Core Testing Stack
- **Jest**: Primary testing framework
- **Testing Library**: DOM testing utilities  
- **WebGL Mock**: Mock WebGL contexts for testing
- **Canvas Mock**: Mock HTML5 Canvas for headless testing

### Test Structure
```
tests/
├── setup/
│   ├── jest.config.js      # Jest configuration
│   ├── webgl-mock.js       # WebGL context mocking
│   └── test-utils.js       # Common test utilities
├── unit/
│   ├── core/
│   │   ├── Engine.test.js
│   │   ├── Scene.test.js
│   │   └── Renderer.test.js
│   ├── entities/
│   │   ├── Tiger.test.js
│   │   ├── Animal.test.js
│   │   └── Terrain.test.js
│   ├── systems/
│   │   ├── Physics.test.js
│   │   ├── AI.test.js
│   │   ├── Camera.test.js
│   │   └── Input.test.js
│   └── ui/
│       ├── HUD.test.js
│       └── Menu.test.js
├── integration/
│   ├── game-flow.test.js
│   ├── physics-integration.test.js
│   └── rendering-pipeline.test.js
└── performance/
    ├── frame-rate.test.js
    └── memory-usage.test.js
```

## TDD Workflow for Each Feature

### Red-Green-Refactor Cycle

#### 1. RED Phase - Write Failing Test
```javascript
// Example: Tiger movement test
describe('Tiger Movement', () => {
  test('should move forward when W key pressed', () => {
    const tiger = new Tiger();
    const initialPosition = tiger.position.clone();
    
    tiger.handleInput({ key: 'w', pressed: true });
    tiger.update(1000/60); // 60fps delta
    
    expect(tiger.position.z).toBeGreaterThan(initialPosition.z);
  });
});
```

#### 2. GREEN Phase - Make Test Pass
```javascript
// Minimal implementation to pass test
class Tiger {
  constructor() {
    this.position = { x: 0, y: 0, z: 0 };
    this.speed = 12;
    this.inputState = {};
  }
  
  handleInput(input) {
    this.inputState[input.key] = input.pressed;
  }
  
  update(deltaTime) {
    if (this.inputState['w']) {
      this.position.z += this.speed * (deltaTime / 1000);
    }
  }
}
```

#### 3. REFACTOR Phase - Improve Code
```javascript
// Refactored with better structure
class Tiger extends Entity {
  constructor() {
    super();
    this.addComponent(new MovementComponent(12));
    this.addComponent(new InputComponent());
  }
}
```

## Testing Strategies by System

### Core Engine Testing
```javascript
describe('Game Engine', () => {
  let engine;
  
  beforeEach(() => {
    engine = new Engine();
  });
  
  test('should initialize Three.js scene', () => {
    expect(engine.scene).toBeDefined();
    expect(engine.renderer).toBeDefined();
    expect(engine.camera).toBeDefined();
  });
  
  test('should maintain 60fps target', () => {
    const frameTime = engine.getAverageFrameTime();
    expect(frameTime).toBeLessThan(16.67); // 60fps = 16.67ms
  });
});
```

### Physics System Testing
```javascript
describe('Physics System', () => {
  test('should detect collision between tiger and prey', () => {
    const tiger = createTiger({ x: 0, y: 0, z: 0 });
    const deer = createDeer({ x: 1, y: 0, z: 0 });
    
    const collision = physicsSystem.checkCollision(tiger, deer);
    expect(collision).toBeTruthy();
  });
});
```

### AI System Testing
```javascript
describe('Animal AI', () => {
  test('deer should flee when tiger approaches', () => {
    const deer = new Deer();
    const tiger = new Tiger();
    
    deer.perceiveThreat(tiger, 5); // 5 units away
    
    expect(deer.state).toBe('FLEEING');
    expect(deer.targetDirection).toPointAwayFrom(tiger.position);
  });
});
```

### Camera System Testing
```javascript
describe('Third Person Camera', () => {
  test('should follow tiger smoothly', () => {
    const camera = new ThirdPersonCamera();
    const tiger = new Tiger();
    
    tiger.position.set(10, 0, 10);
    camera.update(tiger, 1000/60);
    
    expect(camera.position.distanceTo(tiger.position)).toBeCloseTo(15, 1);
  });
});
```

## Mock Strategies

### WebGL Context Mocking
```javascript
// webgl-mock.js
class MockWebGLRenderingContext {
  constructor() {
    this.VERTEX_SHADER = 35633;
    this.FRAGMENT_SHADER = 35632;
    // ... other WebGL constants
  }
  
  createShader() { return {}; }
  createProgram() { return {}; }
  // ... other WebGL methods
}

global.WebGLRenderingContext = MockWebGLRenderingContext;
```

### Three.js Mocking
```javascript
// three-mock.js
jest.mock('three', () => ({
  Scene: jest.fn(() => ({
    add: jest.fn(),
    remove: jest.fn()
  })),
  WebGLRenderer: jest.fn(() => ({
    render: jest.fn(),
    setSize: jest.fn()
  })),
  PerspectiveCamera: jest.fn()
}));
```

## Performance Testing

### Frame Rate Testing
```javascript
describe('Performance', () => {
  test('should maintain 60fps with 100 animals', async () => {
    const game = new Game();
    
    // Spawn 100 animals
    for (let i = 0; i < 100; i++) {
      game.spawnAnimal(getRandomAnimalType());
    }
    
    const frameRates = [];
    for (let frame = 0; frame < 300; frame++) { // 5 seconds at 60fps
      const start = performance.now();
      game.update();
      const end = performance.now();
      frameRates.push(1000 / (end - start));
    }
    
    const avgFrameRate = frameRates.reduce((a, b) => a + b) / frameRates.length;
    expect(avgFrameRate).toBeGreaterThan(55); // Allow 5fps buffer
  });
});
```

## Test Utilities

### Common Test Helpers
```javascript
// test-utils.js
export function createMockTiger(position = {x: 0, y: 0, z: 0}) {
  return new Tiger({
    position,
    health: 100,
    speed: 12
  });
}

export function createMockScene() {
  return {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    renderer: new THREE.WebGLRenderer()
  };
}

export function simulateGameLoop(game, frames = 60) {
  for (let i = 0; i < frames; i++) {
    game.update(1000/60);
  }
}
```

## CI/CD Integration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ]
};
```

### Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:performance": "jest --testPathPattern=performance"
  }
}
```

## Development Workflow

### Feature Development Process
1. **Write Test**: Create failing test for new feature
2. **Implement**: Write minimal code to pass test
3. **Refactor**: Improve code quality while keeping tests green
4. **Integration**: Run full test suite to ensure no regressions
5. **Performance**: Check performance impact with relevant tests

### Continuous Testing
- Run unit tests on every file save
- Run integration tests before commits
- Run performance tests on major changes
- Full test suite on CI/CD pipeline

This TDD approach ensures robust, testable code while maintaining development velocity and code quality throughout the project lifecycle.