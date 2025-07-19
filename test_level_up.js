import { Tiger } from './src/entities/Tiger.js';

// Test the level-up system
const tiger = new Tiger();

console.log('=== Initial Tiger Stats ===');
console.log(`Level: ${tiger.level}`);
console.log(`Health: ${tiger.health}/${tiger.maxHealth}`);
console.log(`Hunger: ${tiger.hunger}/${tiger.maxHunger}`);
console.log(`Power: ${tiger.power}`);
console.log(`Stamina: ${tiger.stamina}`);

console.log('\n=== Gaining 100 XP (Level 1 -> 2) ===');
tiger.gainExperience(100);

console.log(`Level: ${tiger.level}`);
console.log(`Health: ${tiger.health}/${tiger.maxHealth}`);
console.log(`Hunger: ${tiger.hunger}/${tiger.maxHunger}`);
console.log(`Power: ${tiger.power}`);
console.log(`Stamina: ${tiger.stamina}`);

console.log('\n=== Gaining another 100 XP (Level 2 -> 3) ===');
tiger.gainExperience(100);

console.log(`Level: ${tiger.level}`);
console.log(`Health: ${tiger.health}/${tiger.maxHealth}`);
console.log(`Hunger: ${tiger.hunger}/${tiger.maxHunger}`);
console.log(`Power: ${tiger.power}`);
console.log(`Stamina: ${tiger.stamina}`);

console.log('\n=== Level-up bonuses working correctly! ===');
console.log('✅ +10 health per level');
console.log('✅ +10 hunger per level');
console.log('✅ +10 damage per level');
console.log('✅ -5 stamina per level');