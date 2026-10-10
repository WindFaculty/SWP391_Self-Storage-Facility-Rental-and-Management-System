import { useEffect, useState } from 'react'
import { listUnitTypes } from '../api/facilityUnitsApi'
import type { UnitType } from '../types'

export function useUnitTypes() {
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([])

  useEffect(() => {
    let cancelled = false
    void listUnitTypes().then((types) => {
      if (!cancelled) {
        setUnitTypes(types)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { unitTypes }
}
