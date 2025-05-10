// path: src/utils/lootFormatter.ts
/**
 * Utility functions for formatting loot and game move names in a user-friendly way.
 */
export const moveDisplayNames = {
  rock: 'Sword',
  paper: 'Shield',
  scissor: 'Spell',
}

export const lootTypeDisplayNames: Record<string, string> = {
  UpgradeRock: 'Sword Upgrade',
  UpgradePaper: 'Shield Upgrade',
  UpgradeScissor: 'Spell Upgrade',
  Heal: 'Heal',
  AddMaxHealth: 'Health Upgrade',
  AddMaxArmor: 'Armor Upgrade',
}

export const rarityColorMap: Record<number, string> = {
  0: 'bg-gray-500/10 text-gray-500',
  1: 'bg-green-500/10 text-green-500',
  2: 'bg-blue-500/10 text-blue-500',
  3: 'bg-purple-500/10 text-purple-500',
  4: 'bg-orange-500/10 text-orange-500',
}

export function getRarityColorClass(rarity: number): string {
  return rarityColorMap[rarity] || 'bg-primary/10 text-primary'
}

export function formatLootType(lootType: string): string {
  return lootTypeDisplayNames[lootType] || lootType
}

export function formatLootValues(lootType: string, val1: number, val2: number): string {
  if (
    lootType.startsWith('Upgrade') &&
    (lootType.includes('Rock') || lootType.includes('Paper') || lootType.includes('Scissor'))
  ) {
    return `+${val1} | +${val2}`
  }

  if (val1 > 0 && val2 > 0) {
    return `+${val1}, +${val2}`
  }
  if (val1 > 0) {
    return `+${val1}`
  }
  if (val2 > 0) {
    return `+${val2}`
  }
  return ''
}
