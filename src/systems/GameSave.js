export class GameSave {
  constructor() {
    this.storageKey = 'tiger-evolution-3d-save';
    this.autosaveEnabled = true;
  }

  saveGame(gameState) {
    try {
      const saveData = {
        version: '1.0',
        timestamp: Date.now(),
        tiger: {
          position: {
            x: gameState.tiger.position.x,
            y: gameState.tiger.position.y,
            z: gameState.tiger.position.z
          },
          rotation: gameState.tiger.rotation ? {
            x: gameState.tiger.rotation.x,
            y: gameState.tiger.rotation.y,
            z: gameState.tiger.rotation.z
          } : { x: 0, y: 0, z: 0 },
          gender: gameState.tiger.gender || 'male',
          health: gameState.tiger.health,
          maxHealth: gameState.tiger.maxHealth,
          stamina: gameState.tiger.stamina,
          maxStamina: gameState.tiger.maxStamina,
          hunger: gameState.tiger.hunger,
          maxHunger: gameState.tiger.maxHunger,
          thirst: gameState.tiger.thirst,
          level: gameState.tiger.level,
          experience: gameState.tiger.experience,
          evolutionStage: gameState.tiger.evolutionStage,
          state: gameState.tiger.state,
          huntsSuccessful: gameState.tiger.huntsSuccessful || 0,
          totalKills: gameState.tiger.totalKills || 0,
          totalDistance: gameState.tiger.totalDistance || 0,
          timeAlive: gameState.tiger.timeAlive || 0
        },
        terrain: {
          seed: gameState.terrain?.seed || 12345,
          isUnderwater: gameState.isUnderwater || false
        },
        gameStats: {
          totalPlayTime: gameState.totalPlayTime || 0,
          gamesPlayed: this.getGamesPlayed() + 1,
          lastSaveReason: gameState.lastSaveReason || 'manual'
        }
      };

      localStorage.setItem(this.storageKey, JSON.stringify(saveData));
      console.log('🎮 Game saved successfully!', saveData.gameStats.lastSaveReason);
      return true;
    } catch (error) {
      console.error('❌ Failed to save game:', error);
      return false;
    }
  }

  loadGame() {
    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (!savedData) {
        console.log('🎮 No saved game found');
        return null;
      }

      const saveData = JSON.parse(savedData);
      console.log('🎮 Game loaded successfully!');
      return saveData;
    } catch (error) {
      console.error('❌ Failed to load game:', error);
      return null;
    }
  }

  hasSavedGame() {
    const savedData = localStorage.getItem(this.storageKey);
    return savedData !== null;
  }

  deleteSavedGame() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('🎮 Saved game deleted');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete saved game:', error);
      return false;
    }
  }

  getSaveInfo() {
    const savedData = localStorage.getItem(this.storageKey);
    if (!savedData) return null;

    try {
      const saveData = JSON.parse(savedData);
      return {
        version: saveData.version,
        timestamp: saveData.timestamp,
        lastSaved: new Date(saveData.timestamp).toLocaleString(),
        tigerGender: saveData.tiger.gender || 'male',
        tigerLevel: saveData.tiger.level,
        evolutionStage: saveData.tiger.evolutionStage,
        experience: saveData.tiger.experience,
        huntsSuccessful: saveData.tiger.huntsSuccessful || 0,
        totalPlayTime: saveData.gameStats.totalPlayTime || 0,
        gamesPlayed: saveData.gameStats.gamesPlayed || 0
      };
    } catch (error) {
      console.error('❌ Failed to get save info:', error);
      return null;
    }
  }

  getGamesPlayed() {
    const savedData = localStorage.getItem(this.storageKey);
    if (!savedData) return 0;

    try {
      const saveData = JSON.parse(savedData);
      return saveData.gameStats.gamesPlayed || 0;
    } catch (error) {
      return 0;
    }
  }

  autosave(gameState, reason = 'hunt_success') {
    if (!this.autosaveEnabled) return false;

    gameState.lastSaveReason = reason;
    return this.saveGame(gameState);
  }

  setAutosaveEnabled(enabled) {
    this.autosaveEnabled = enabled;
    console.log(`🎮 Autosave ${enabled ? 'enabled' : 'disabled'}`);
  }

  exportSave() {
    const savedData = localStorage.getItem(this.storageKey);
    if (!savedData) return null;

    try {
      const saveData = JSON.parse(savedData);
      const exportData = {
        ...saveData,
        exportedAt: Date.now(),
        exportVersion: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tiger-evolution-save-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      console.log('🎮 Save exported successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to export save:', error);
      return false;
    }
  }

  importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          // Validate save data structure
          if (!importData.version || !importData.tiger || !importData.terrain) {
            throw new Error('Invalid save file format');
          }

          // Remove export metadata
          delete importData.exportedAt;
          delete importData.exportVersion;

          // Save the imported data
          localStorage.setItem(this.storageKey, JSON.stringify(importData));
          console.log('🎮 Save imported successfully');
          resolve(true);
        } catch (error) {
          console.error('❌ Failed to import save:', error);
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}