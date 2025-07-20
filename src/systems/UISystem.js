export class UISystem {
  constructor() {
    this.elements = {};
    this.isVisible = true;
    
    // Create UI container
    this.createUI();
  }
  
  createUI() {
    // Create main UI container
    const uiContainer = document.createElement('div');
    uiContainer.id = 'ui-container';
    uiContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 1000;
      pointer-events: none;
      font-family: Arial, sans-serif;
      color: white;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    
    // Create stats panel
    const statsPanel = document.createElement('div');
    statsPanel.id = 'stats-panel';
    statsPanel.style.cssText = `
      background: rgba(0,0,0,0.7);
      padding: 15px;
      border-radius: 10px;
      border: 2px solid rgba(255,255,255,0.3);
      min-width: 200px;
    `;
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = 'Tiger Stats';
    title.style.cssText = `
      margin: 0 0 10px 0;
      color: #FFA500;
      font-size: 16px;
    `;
    
    // Create health bar
    const healthContainer = this.createStatBar('Health', '#FF4444', 'health');
    
    // Create stamina bar
    const staminaContainer = this.createStatBar('Stamina', '#4444FF', 'stamina');
    
    // Create XP bar
    const xpContainer = this.createStatBar('Experience', '#44FF44', 'experience');
    
    // Create level display
    const levelDisplay = document.createElement('div');
    levelDisplay.id = 'level-display';
    levelDisplay.style.cssText = `
      margin-top: 10px;
      font-size: 14px;
      color: #FFA500;
    `;
    
    // Create evolution stage display
    const evolutionDisplay = document.createElement('div');
    evolutionDisplay.id = 'evolution-display';
    evolutionDisplay.style.cssText = `
      margin-top: 5px;
      font-size: 12px;
      color: #FFFF88;
    `;
    
    // Create hunger display
    const hungerContainer = this.createStatBar('Hunger', '#FF8800', 'hunger');
    
    // Assemble UI
    statsPanel.appendChild(title);
    statsPanel.appendChild(healthContainer);
    statsPanel.appendChild(staminaContainer);
    statsPanel.appendChild(xpContainer);
    statsPanel.appendChild(hungerContainer);
    statsPanel.appendChild(levelDisplay);
    statsPanel.appendChild(evolutionDisplay);
    
    uiContainer.appendChild(statsPanel);
    
    // Add controls info
    const controlsPanel = document.createElement('div');
    controlsPanel.id = 'controls-panel';
    controlsPanel.style.cssText = `
      background: rgba(0,0,0,0.7);
      padding: 10px;
      border-radius: 10px;
      border: 2px solid rgba(255,255,255,0.3);
      margin-top: 10px;
      font-size: 11px;
    `;
    
    controlsPanel.innerHTML = `
      <div style="color: #FFA500; font-weight: bold; margin-bottom: 5px;">Controls:</div>
      <div>WASD: Move/Turn</div>
      <div>Shift: Run (pounce)</div>
      <div>Ctrl: Crouch (stealth)</div>
      <div>Z: Hunt nearby animals</div>
      <div>E: Eat prey</div>
      <div>M: Scent trail (find animals)</div>
      <div>MM: Tiger trail (find tigers)</div>
      <div>R: Dive underwater</div>
      <div>Space: Jump/Surface</div>
      <div>Esc: Menu</div>
    `;
    
    uiContainer.appendChild(controlsPanel);
    
    // Add to page
    document.body.appendChild(uiContainer);
    
    // Create save status indicator
    const saveStatus = document.createElement('div');
    saveStatus.id = 'save-status';
    saveStatus.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0,0,0,0.8);
      padding: 10px 15px;
      border-radius: 5px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #4CAF50;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 1100;
      pointer-events: none;
    `;
    saveStatus.textContent = 'Game Saved';
    document.body.appendChild(saveStatus);
    
    // Store references
    this.elements.container = uiContainer;
    this.elements.statsPanel = statsPanel;
    this.elements.levelDisplay = levelDisplay;
    this.elements.evolutionDisplay = evolutionDisplay;
    this.elements.saveStatus = saveStatus;
  }
  
  createStatBar(label, color, id) {
    const container = document.createElement('div');
    container.style.cssText = `
      margin-bottom: 8px;
    `;
    
    const labelElement = document.createElement('div');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      font-size: 12px;
      margin-bottom: 2px;
    `;
    
    const barContainer = document.createElement('div');
    barContainer.style.cssText = `
      width: 180px;
      height: 16px;
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 8px;
      overflow: hidden;
    `;
    
    const barFill = document.createElement('div');
    barFill.id = `${id}-bar`;
    barFill.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, ${color}, ${color}AA);
      transition: width 0.3s ease;
      border-radius: 8px;
    `;
    
    const barText = document.createElement('div');
    barText.id = `${id}-text`;
    barText.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
    `;
    
    barContainer.style.position = 'relative';
    barContainer.appendChild(barFill);
    barContainer.appendChild(barText);
    
    container.appendChild(labelElement);
    container.appendChild(barContainer);
    
    // Store references
    this.elements[`${id}Bar`] = barFill;
    this.elements[`${id}Text`] = barText;
    
    return container;
  }
  
  updateStats(tiger) {
    if (!tiger) return;
    
    // Update health
    const healthPercent = (tiger.health / tiger.maxHealth) * 100;
    this.elements.healthBar.style.width = `${healthPercent}%`;
    this.elements.healthText.textContent = `${Math.round(tiger.health)}/${tiger.maxHealth}`;
    
    // Update stamina
    const staminaPercent = (tiger.stamina / tiger.maxStamina) * 100;
    this.elements.staminaBar.style.width = `${staminaPercent}%`;
    this.elements.staminaText.textContent = `${Math.round(tiger.stamina)}/${tiger.maxStamina}`;
    
    // Update experience
    const xpPercent = (tiger.experience / tiger.experienceToNextLevel) * 100;
    this.elements.experienceBar.style.width = `${xpPercent}%`;
    this.elements.experienceText.textContent = `${Math.round(tiger.experience)}/${tiger.experienceToNextLevel}`;
    
    // Update hunger
    const hungerPercent = (tiger.hunger / tiger.maxHunger) * 100;
    this.elements.hungerBar.style.width = `${hungerPercent}%`;
    this.elements.hungerText.textContent = `${Math.round(tiger.hunger)}/${tiger.maxHunger}`;
    
    // Update level
    this.elements.levelDisplay.textContent = `Level: ${tiger.level}`;
    
    // Update evolution stage
    this.elements.evolutionDisplay.textContent = `Evolution: ${tiger.evolutionStage}`;
    
    // Change bar colors based on values
    if (healthPercent < 30) {
      this.elements.healthBar.style.background = 'linear-gradient(90deg, #FF0000, #FF0000AA)';
    } else if (healthPercent < 60) {
      this.elements.healthBar.style.background = 'linear-gradient(90deg, #FFAA00, #FFAA00AA)';
    } else {
      this.elements.healthBar.style.background = 'linear-gradient(90deg, #FF4444, #FF4444AA)';
    }
    
    if (staminaPercent < 20) {
      this.elements.staminaBar.style.background = 'linear-gradient(90deg, #FF0000, #FF0000AA)';
    } else {
      this.elements.staminaBar.style.background = 'linear-gradient(90deg, #4444FF, #4444FFAA)';
    }
    
    if (hungerPercent < 30) {
      this.elements.hungerBar.style.background = 'linear-gradient(90deg, #FF0000, #FF0000AA)';
    } else {
      this.elements.hungerBar.style.background = 'linear-gradient(90deg, #FF8800, #FF8800AA)';
    }
  }
  
  toggle() {
    this.isVisible = !this.isVisible;
    this.elements.container.style.display = this.isVisible ? 'block' : 'none';
  }
  
  show() {
    this.isVisible = true;
    this.elements.container.style.display = 'block';
  }
  
  hide() {
    this.isVisible = false;
    this.elements.container.style.display = 'none';
  }
  
  showSaveStatus(message = 'Game Saved') {
    if (this.elements.saveStatus) {
      this.elements.saveStatus.textContent = message;
      this.elements.saveStatus.style.opacity = '1';
      
      // Hide after 3 seconds
      setTimeout(() => {
        if (this.elements.saveStatus) {
          this.elements.saveStatus.style.opacity = '0';
        }
      }, 3000);
    }
  }

  dispose() {
    if (this.elements.container && this.elements.container.parentNode) {
      this.elements.container.parentNode.removeChild(this.elements.container);
    }
    if (this.elements.saveStatus && this.elements.saveStatus.parentNode) {
      this.elements.saveStatus.parentNode.removeChild(this.elements.saveStatus);
    }
    this.elements = {};
  }
}