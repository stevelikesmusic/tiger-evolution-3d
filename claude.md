# Tiger Evolution 3D

A 3D jungle survival game where you play as a tiger navigating through a procedurally generated jungle environment with water systems, wildlife, and evolution mechanics.

## Workflow

Follow this flow when performing your tasks

1. Read the [spec](.claude/spec.md)
2. Read the progress.md and project.md in .claude
3. Checkout a new branch for the feature
4. Use TDD to write tests first based on your goals
5. Make regular commits
6. Update documentation with new context and/or tools you added

### Docs

- claude.md: This file. Should only describe how claude should operate in this repo
- README.md: How to setup the project and get it running locally
- progress.md: Current status of planned work, what's in flight, and what's waiting to be completed

### Testing

- **Run Tests**: `npm test` - Run tests with Vitest
- **Watch Tests**: `npm run test:watch` - Run tests in watch mode
- **Coverage**: `npm run test:coverage` - Run tests with coverage report
- **Test UI**: `npm run test:ui` - Open Vitest UI for interactive testing

### Browser Testing

- **Playwright MCP**: Available for automated browser testing and debugging
- **Navigation**: `mcp__playwright__browser_navigate` to visit localhost
- **Screenshots**: `mcp__playwright__browser_take_screenshot` for visual verification
- **Console Logs**: `mcp__playwright__browser_console_messages` to view debug output
- **Interaction**: `mcp__playwright__browser_click`, `mcp__playwright__browser_type`, `mcp__playwright__browser_press_key` for user simulation
- **Usage**: Start dev server first (`npm run dev`), then use Playwright tools to test game controls and movement

## Current Status

**Latest Session**: Complete gender selection system and tiger interaction mechanics including mating, territorial fighting, and red tiger trace system.

## Features

### Core Gameplay
- **3D Jungle Environment**: Procedural terrain with realistic water systems and vegetation
- **Tiger Gender System**: Choose male or female tiger with different stats and abilities
- **Wildlife Ecosystem**: Hunt prey animals with realistic AI behaviors
- **Swimming & Underwater**: Complete underwater terrain with unique controls and elements
- **Save System**: Auto-save functionality with persistent game state

### Controls

#### Surface Movement (Tank Controls)
- **W/S**: Move forward/backward in tiger's facing direction
- **A/D**: Rotate tiger left/right
- **Space**: Jump on land, return to surface from underwater
- **Shift**: Run (disabled while swimming)

#### Interaction
- **Z**: Hunt nearby animals
- **E**: Eat dead animals (triggers auto-save)
- **R**: Create red trace to nearest wild tiger
- **M**: Create purple scent trail to nearest animal
- **Escape**: Show main menu

#### Underwater (T/G/F/H + Q/E)
- **T/G**: Swim forward/backward
- **F/H**: Swim left/right
- **Q/E**: Rotate left/right
- **Space**: Return to surface

### Camera
- **Mouse**: Look around (click canvas for pointer lock)
- **Mouse Wheel**: Zoom in/out

## Quick Start

```bash
npm run dev          # Start development server
```

Navigate to the URL shown in console and click "New Game" to start.

## Architecture

### Key Systems
- **GameController.js**: Main game orchestrator and system management
- **MainMenu.js**: Professional menu with save/load functionality
- **GameSave.js**: Complete save/load system with localStorage
- **TerrainRenderer.js**: 3D terrain mesh with procedural generation
- **WaterSystem.js**: Professional water bodies with lily pads
- **UnderwaterSystem.js**: Complete underwater terrain with interactive elements
- **VegetationSystem.js**: Water-aware vegetation placement system
- **AnimalSystem.js**: Wildlife management with AI behaviors
- **MovementSystem.js**: Dual-mode movement (surface/underwater)
- **CameraSystem.js**: Third-person camera with smooth following
- **TigerTraceSystem.js**: Red trace system for finding wild tigers
- **ScentTrailSystem.js**: Purple scent trail system for finding prey

### Data Flow
1. MainMenu handles game initialization and save/load
2. Gender selection for new games
3. Terrain and water system generation
4. Wildlife and vegetation placement
5. Dual-mode movement and camera systems
6. Auto-save on prey consumption

## Development

### Scripts
- **npm test**: Run unit tests with Vitest
- **npm run test:watch**: Run tests in watch mode
- **npm run build**: Build for production
- **npm run preview**: Preview production build

### Technology Stack
- **Vite**: Build tool and development server
- **Three.js**: 3D graphics and rendering
- **Cannon-es**: Physics simulation
- **Vitest**: Unit testing with jsdom

## Project Structure

```
src/
├── systems/          # Core game systems
├── entities/         # Game entities (Tiger, Animal)
├── terrain/          # Terrain generation and rendering
├── water/            # Water and underwater systems
├── ui/               # User interface components
└── utils/            # Shared utilities

tests/                # Unit and integration tests
.claude/             # Project documentation and progress
```