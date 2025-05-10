/**
 * Utility functions for formatting loot and game move names in a user-friendly way.
 */

/**
 * Maps internal move names to their user-friendly display names.
 */
export const moveDisplayNames = {
  rock: 'Sword',
  paper: 'Shield',
  scissor: 'Spell',
}

/**
 * Maps internal loot type strings to user-friendly display names.
 */
export const lootTypeDisplayNames: Record<string, string> = {
  UpgradeRock: 'Sword Upgrade',
  UpgradePaper: 'Shield Upgrade',
  UpgradeScissor: 'Spell Upgrade',
  Heal: 'Heal',
  AddMaxHealth: 'Health Upgrade',
  AddMaxArmor: 'Armor Upgrade',
}

/**
 * Maps rarity tiers to their corresponding color classes
 */
export const rarityColorMap: Record<number, string> = {
  0: 'bg-gray-500/10 text-gray-500', // Common (Gray)
  1: 'bg-green-500/10 text-green-500', // Uncommon (Green)
  2: 'bg-blue-500/10 text-blue-500', // Rare (Blue)
  3: 'bg-purple-500/10 text-purple-500', // Epic (Purple)
  4: 'bg-orange-500/10 text-orange-500', // Legendary (Orange)
}

/**
 * Gets the color class for a given rarity tier
 *
 * @param rarity The rarity tier (0-4)
 * @returns The corresponding Tailwind color class
 */
export function getRarityColorClass(rarity: number): string {
  return rarityColorMap[rarity] || 'bg-primary/10 text-primary' // Default fallback
}

/**
 * Formats a loot type string to a user-friendly display name.
 *
 * @param lootType The internal loot type string
 * @returns A user-friendly display name
 */
export function formatLootType(lootType: string): string {
  return lootTypeDisplayNames[lootType] || lootType
}

/**
 * Formats loot values based on the loot type.
 *
 * @param lootType The internal loot type string
 * @param val1 The first value (usually ATK for moves)
 * @param val2 The second value (usually DEF for moves)
 * @returns A formatted string representing the loot values
 */
export function formatLootValues(lootType: string, val1: number, val2: number): string {
  // For move upgrades (rock/paper/scissor), format as "+ATK | +DEF"
  if (
    lootType.startsWith('Upgrade') &&
    (lootType.includes('Rock') || lootType.includes('Paper') || lootType.includes('Scissor'))
  ) {
    return `+${val1} | +${val2}`
  }

  // For other upgrades with both values
  if (val1 > 0 && val2 > 0) {
    return `+${val1}, +${val2}`
  }

  // For upgrades with only one value
  if (val1 > 0) {
    return `+${val1}`
  }

  if (val2 > 0) {
    return `+${val2}`
  }

  return ''
}
