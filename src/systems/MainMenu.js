export class MainMenu {
  constructor() {
    this.isVisible = false;
    this.selectedOption = 'newgame';
    this.menuContainer = null;
    this.onNewGame = null;
    this.onContinueGame = null;
    this.onSettings = null;
    this.saveInfo = null;
    this.keys = {};
    
    this.initializeMenu();
    this.bindEvents();
  }

  initializeMenu() {
    // Create menu container
    this.menuContainer = document.createElement('div');
    this.menuContainer.id = 'main-menu';
    this.menuContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a4f3a 0%, #2d5a2d 50%, #0d2818 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      font-family: 'Courier New', monospace;
      color: #e6f3e6;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;

    // Create title
    const title = document.createElement('h1');
    title.textContent = 'Tiger Evolution 3D';
    title.style.cssText = `
      font-size: 3.5rem;
      margin-bottom: 1rem;
      color: #ff6b35;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.9);
      letter-spacing: 2px;
    `;

    // Create subtitle
    const subtitle = document.createElement('h2');
    subtitle.textContent = 'Survive, Hunt, Evolve';
    subtitle.style.cssText = `
      font-size: 1.2rem;
      margin-bottom: 3rem;
      color: #b8d4b8;
      font-weight: normal;
      letter-spacing: 1px;
    `;

    // Create menu options container
    const menuOptions = document.createElement('div');
    menuOptions.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 300px;
    `;

    // Create New Game button
    this.newGameButton = this.createMenuButton('New Game', 'newgame');
    
    // Create Continue Game button
    this.continueGameButton = this.createMenuButton('Continue Game', 'continue');
    
    // Create Settings button
    this.settingsButton = this.createMenuButton('Settings', 'settings');
    
    // Create Exit button
    this.exitButton = this.createMenuButton('Exit', 'exit');

    // Add save info display
    this.saveInfoDisplay = document.createElement('div');
    this.saveInfoDisplay.style.cssText = `
      margin-top: 2rem;
      padding: 1rem;
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
      max-width: 400px;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.1);
    `;

    // Add controls info
    const controlsInfo = document.createElement('div');
    controlsInfo.innerHTML = `
      <p style="margin: 0.5rem 0; font-size: 0.9rem; color: #a0c4a0;">
        Use <strong>↑↓</strong> or <strong>WS</strong> keys to navigate, <strong>Enter</strong> to select
      </p>
    `;
    controlsInfo.style.cssText = `
      margin-top: 2rem;
      font-size: 0.9rem;
      color: #8fbc8f;
    `;

    // Assemble menu
    menuOptions.appendChild(this.newGameButton);
    menuOptions.appendChild(this.continueGameButton);
    menuOptions.appendChild(this.settingsButton);
    menuOptions.appendChild(this.exitButton);
    
    this.menuContainer.appendChild(title);
    this.menuContainer.appendChild(subtitle);
    this.menuContainer.appendChild(menuOptions);
    this.menuContainer.appendChild(this.saveInfoDisplay);
    this.menuContainer.appendChild(controlsInfo);
    
    // Add to document
    document.body.appendChild(this.menuContainer);
    
    // Initially hidden
    this.hide();
  }

  createMenuButton(text, value) {
    const button = document.createElement('div');
    button.textContent = text;
    button.dataset.value = value;
    button.style.cssText = `
      padding: 1rem 2rem;
      font-size: 1.3rem;
      background: rgba(255,255,255,0.1);
      border: 2px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      user-select: none;
    `;
    
    button.addEventListener('mouseenter', () => {
      if (this.selectedOption !== value) {
        this.selectOption(value);
      }
    });
    
    button.addEventListener('click', () => {
      this.selectOption(value);
      this.confirmSelection();
    });
    
    return button;
  }

  bindEvents() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isVisible) return;
      
      this.keys[e.key] = true;
      
      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          this.navigateUp();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          this.navigateDown();
          break;
        case 'Enter':
          e.preventDefault();
          this.confirmSelection();
          break;
        case 'Escape':
          e.preventDefault();
          if (this.selectedOption === 'settings') {
            this.selectOption('newgame');
          }
          break;
      }
    });

    document.addEventListener('keyup', (e) => {
      delete this.keys[e.key];
    });
  }

  navigateUp() {
    const options = ['newgame', 'continue', 'settings', 'exit'];
    const currentIndex = options.indexOf(this.selectedOption);
    const prevIndex = (currentIndex - 1 + options.length) % options.length;
    this.selectOption(options[prevIndex]);
  }

  navigateDown() {
    const options = ['newgame', 'continue', 'settings', 'exit'];
    const currentIndex = options.indexOf(this.selectedOption);
    const nextIndex = (currentIndex + 1) % options.length;
    this.selectOption(options[nextIndex]);
  }

  selectOption(option) {
    // Update selected option
    this.selectedOption = option;
    
    // Update visual states
    this.updateButtonStates();
    
    // Update save info display
    this.updateSaveInfoDisplay();
  }

  updateButtonStates() {
    const buttons = [this.newGameButton, this.continueGameButton, this.settingsButton, this.exitButton];
    
    buttons.forEach(button => {
      const isSelected = button.dataset.value === this.selectedOption;
      const isDisabled = button.dataset.value === 'continue' && !this.saveInfo;
      
      if (isSelected && !isDisabled) {
        button.style.background = 'rgba(255,107,53,0.8)';
        button.style.borderColor = '#ff6b35';
        button.style.color = '#ffffff';
        button.style.transform = 'scale(1.05)';
        button.style.cursor = 'pointer';
      } else if (isSelected && isDisabled) {
        button.style.background = 'rgba(100,100,100,0.5)';
        button.style.borderColor = 'rgba(100,100,100,0.7)';
        button.style.color = '#999999';
        button.style.transform = 'scale(1.02)';
        button.style.cursor = 'not-allowed';
      } else if (isDisabled) {
        button.style.background = 'rgba(100,100,100,0.3)';
        button.style.borderColor = 'rgba(100,100,100,0.5)';
        button.style.color = '#666666';
        button.style.transform = 'scale(1)';
        button.style.cursor = 'not-allowed';
      } else {
        button.style.background = 'rgba(255,255,255,0.1)';
        button.style.borderColor = 'rgba(255,255,255,0.2)';
        button.style.color = '#e6f3e6';
        button.style.transform = 'scale(1)';
        button.style.cursor = 'pointer';
      }
    });
  }

  updateSaveInfoDisplay() {
    if (this.selectedOption === 'continue' && this.saveInfo) {
      this.saveInfoDisplay.innerHTML = `
        <h3 style="margin: 0 0 1rem 0; color: #ff6b35;">Save Game Info</h3>
        <p><strong>Level:</strong> ${this.saveInfo.tigerLevel}</p>
        <p><strong>Evolution:</strong> ${this.saveInfo.evolutionStage}</p>
        <p><strong>Experience:</strong> ${this.saveInfo.experience}</p>
        <p><strong>Hunts:</strong> ${this.saveInfo.huntsSuccessful}</p>
        <p><strong>Last Saved:</strong> ${this.saveInfo.lastSaved}</p>
        <p><strong>Play Time:</strong> ${this.formatTime(this.saveInfo.totalPlayTime)}</p>
      `;
      this.saveInfoDisplay.style.display = 'block';
    } else if (this.selectedOption === 'continue' && !this.saveInfo) {
      this.saveInfoDisplay.innerHTML = `
        <h3 style="margin: 0 0 1rem 0; color: #888;">Continue Game</h3>
        <p style="color: #888;">No saved game found.</p>
        <p style="color: #888;">Start a new game to begin your tiger evolution journey.</p>
        <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
          Your progress will be automatically saved when you eat prey.
        </p>
      `;
      this.saveInfoDisplay.style.display = 'block';
    } else if (this.selectedOption === 'newgame') {
      this.saveInfoDisplay.innerHTML = `
        <h3 style="margin: 0 0 1rem 0; color: #ff6b35;">New Game</h3>
        <p>Start your journey as a young tiger cub in the jungle.</p>
        <p>Hunt prey, gain experience, and evolve to become the apex predator.</p>
        <p style="margin-top: 1rem; font-size: 0.9rem; color: #a0c4a0;">
          <strong>Controls:</strong> WASD to move, Mouse to look, Z to hunt, E to eat
        </p>
      `;
      this.saveInfoDisplay.style.display = 'block';
    } else if (this.selectedOption === 'settings') {
      this.saveInfoDisplay.innerHTML = `
        <h3 style="margin: 0 0 1rem 0; color: #ff6b35;">Settings</h3>
        <p>• Graphics Quality: High</p>
        <p>• Sound Volume: 80%</p>
        <p>• Autosave: Enabled</p>
        <p>• Mouse Sensitivity: Medium</p>
        <p style="margin-top: 1rem; font-size: 0.9rem; color: #a0c4a0;">
          Settings panel coming soon...
        </p>
      `;
      this.saveInfoDisplay.style.display = 'block';
    } else {
      this.saveInfoDisplay.style.display = 'none';
    }
  }

  formatTime(seconds) {
    if (!seconds || seconds < 60) return '< 1 minute';
    
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  }

  confirmSelection() {
    switch(this.selectedOption) {
      case 'newgame':
        if (this.onNewGame) {
          this.onNewGame();
        }
        break;
      case 'continue':
        if (this.saveInfo && this.onContinueGame) {
          this.onContinueGame();
        } else if (!this.saveInfo) {
          console.log('🎮 No saved game available');
          // You could show a message here or play a sound
        }
        break;
      case 'settings':
        if (this.onSettings) {
          this.onSettings();
        }
        break;
      case 'exit':
        if (confirm('Are you sure you want to exit?')) {
          window.close();
        }
        break;
    }
  }

  show(saveInfo = null) {
    this.saveInfo = saveInfo;
    this.isVisible = true;
    this.menuContainer.style.display = 'flex';
    
    // Reset to appropriate default selection
    // Always default to 'newgame' - continue will be visually disabled if no save
    this.selectOption('newgame');
    
    // Always show continue button, but disable it if no save
    this.continueGameButton.style.display = 'block';
    
    console.log('🎮 Main menu displayed');
  }

  hide() {
    this.isVisible = false;
    this.menuContainer.style.display = 'none';
    console.log('🎮 Main menu hidden');
  }

  dispose() {
    if (this.menuContainer) {
      document.body.removeChild(this.menuContainer);
      this.menuContainer = null;
    }
    
    // Remove event listeners
    document.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('keyup', this.boundKeyUp);
    
    console.log('🎮 Main menu disposed');
  }

  // Callback setters
  setOnNewGame(callback) {
    this.onNewGame = callback;
  }

  setOnContinueGame(callback) {
    this.onContinueGame = callback;
  }

  setOnSettings(callback) {
    this.onSettings = callback;
  }
}