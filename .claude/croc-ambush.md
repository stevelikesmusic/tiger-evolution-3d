# Crocodile Ambush System Enhancement

## Overview
This document tracks the implementation of enhanced crocodile ambush mechanics, including tiger thirst system, improved spawning, grab mechanics, and retreat behavior.

## Requirements
1. Tiger needs to drink water (thirst system)
2. Crocodiles spawn near edges of water
3. Crocodiles quickly emerge with mouth open
4. Grab mechanic with mouth closing animation
5. 5-second hold with health loss (no escape)
6. Pull tiger into water terrain (no drowning damage)
7. Crocodile retreats after attack

## Implementation Plan

### Phase 1: Tiger Thirst System
- [ ] Add thirst properties to Tiger class
  - `thirst`: Current thirst level (0-100)
  - `maxThirst`: Maximum thirst (100)
  - `thirstDecayRate`: How fast thirst decreases
- [ ] Update Tiger update method to decrease thirst over time
- [ ] Add `drink()` method to restore thirst
- [ ] Thirst affects stamina regeneration when low

### Phase 2: UI Updates
- [ ] Add thirst bar to UISystem
  - Color: Light blue (#44CCFF)
  - Position: Below hunger bar
- [ ] Update controls display
  - Change "E: Eat prey" to context-sensitive
  - Show "E: Drink" when near water
  - Show "E: Eat" when near dead prey

### Phase 3: Drinking Mechanic
- [ ] Detect when tiger is near water in GameController
- [ ] Handle 'E' key press near water
  - Check distance to water bodies
  - Trigger drink animation
  - Restore thirst over 2-3 seconds
  - Make tiger vulnerable during drinking

### Phase 4: Crocodile Spawning Improvements
- [ ] Modify `createCrocodileAmbusher()` in AmbushSystem
  - Position at 90-95% of water radius (edge placement)
  - Ensure partially submerged (eyes only visible)
  - Face toward water center for ambush angle

### Phase 5: Attack Animation Enhancement
- [ ] Add mouth mesh components to CrocodileAmbush
  - Upper jaw and lower jaw as separate meshes
  - Teeth visibility during attack
- [ ] Implement mouth opening during emergence
  - Jaw rotation animation
  - Wide gape for intimidation
- [ ] Mouth closing animation on grab

### Phase 6: Grab and Hold Mechanic
- [ ] Add new state: "grabbing" to CrocodileAmbush
- [ ] Implement grab mechanics:
  - 5-second hold duration
  - Disable tiger movement (set flag in Tiger)
  - Continuous damage (scaled by evolution stage):
    - Young: 10 damage/second
    - Adult: 15 damage/second
    - Alpha: 20 damage/second
  - Initial bite damage: 30/50/70 by stage

### Phase 7: Water Pull Effect
- [ ] After grab, pull tiger toward water center
  - Smooth position interpolation
  - No teleportation or sudden movements
  - Pull speed: 5 units/second
- [ ] Visual effects:
  - Water splash particles
  - Struggle animation
  - Ripple effects

### Phase 8: Crocodile Retreat
- [ ] After 5-second grab, release tiger
- [ ] Crocodile submerges and moves to new position
- [ ] 30-second cooldown before next attack
- [ ] Reposition logic:
  - Find new edge position
  - Avoid last attack location

### Phase 9: Integration and Polish
- [ ] Add thirst warnings (visual/audio)
- [ ] Water ripple effects during movement
- [ ] Struggle sound effects
- [ ] Camera shake during grab
- [ ] Test balance with different tiger stages

## Technical Details

### State Machine Updates
CrocodileAmbush states:
- `hidden`: Submerged, watching
- `alert`: Detected tiger, preparing
- `attacking`: Lunging with mouth open
- `grabbing`: NEW - Holding tiger for 5 seconds
- `retreating`: NEW - Moving away after attack
- `cooldown`: Recovery period

### Damage Scaling
```javascript
const damageByStage = {
  'Young': { bite: 30, holdPerSecond: 10 },
  'Adult': { bite: 50, holdPerSecond: 15 },
  'Alpha': { bite: 70, holdPerSecond: 20 }
};
```

### Key Methods to Add/Modify
1. `Tiger.drink()` - Restore thirst
2. `Tiger.setMovementLocked(locked)` - Disable movement during grab
3. `CrocodileAmbush.startGrab(tiger)` - Initiate grab sequence
4. `CrocodileAmbush.updateGrabbing(deltaTime, tiger)` - Handle grab state
5. `GameController.checkDrinkingAction()` - Handle E key near water

## Testing Checklist
- [ ] Thirst decreases over time
- [ ] E key works for both drinking and eating (context-sensitive)
- [ ] Crocodiles spawn at water edges
- [ ] Attack animation looks natural
- [ ] 5-second grab cannot be escaped
- [ ] Damage scales with tiger evolution
- [ ] Pull effect doesn't break physics
- [ ] Crocodile retreats properly
- [ ] 30-second cooldown works
- [ ] Young tigers survive attacks (no instant death)

## Progress Tracking
- Started: 2025-07-27
- Phase 1: [x] Complete - Thirst system added
- Phase 2: [x] Complete - Thirst bar in UI
- Phase 3: [x] Complete - Drinking mechanic with E key
- Phase 4: [x] Complete - Crocodiles spawn at water edges
- Phase 5: [x] Complete - Mouth opening animation
- Phase 6: [x] Complete - 5-second grab mechanic
- Phase 7: [x] Complete - Water pull effect
- Phase 8: [x] Complete - Retreat behavior
- Phase 9: [x] Complete - Context-sensitive controls

## Notes
- No drowning damage to protect young tigers
- Focus on dramatic tension without unfair difficulty
- Ensure all animations are smooth and believable
- Test thoroughly with different tiger stages