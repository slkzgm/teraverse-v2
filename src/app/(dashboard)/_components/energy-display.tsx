// path: src/app/(dashboard)/_components/energy-display.tsx
import { Battery, BatteryCharging } from 'lucide-react'
import type { EnergyParsedData } from '@slkzgm/gigaverse-sdk'

interface EnergyDisplayProps {
  energyData: EnergyParsedData | null
}

export function EnergyDisplay({ energyData }: EnergyDisplayProps) {
  if (!energyData) {
    return (
      <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm sm:flex-initial">
        <Battery className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Energy: N/A</span>
      </div>
    )
  }

  const currentEnergy = Math.floor(energyData.energy / 1_000_000_000)
  const maxEnergy = energyData.maxEnergy
  const percentage = Math.min(100, Math.round((currentEnergy / maxEnergy) * 100))

  let colorClass = 'text-green-500'
  if (percentage < 30) colorClass = 'text-red-500'
  else if (percentage < 70) colorClass = 'text-amber-500'

  return (
    <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm sm:flex-initial">
      {energyData.isPlayerJuiced ? (
        <BatteryCharging className={`h-4 w-4 ${colorClass}`} />
      ) : (
        <Battery className={`h-4 w-4 ${colorClass}`} />
      )}
      <span className="font-medium">
        Energy: <span className={colorClass}>{currentEnergy}</span>/{maxEnergy}
      </span>
      {energyData.isPlayerJuiced && (
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
          Juiced
        </span>
      )}
    </div>
  )
}
