import { useQuery } from '@tanstack/react-query'
import { listUnitTypes } from '../api/facilityUnitsApi'

export function useUnitTypes() {
  const query = useQuery({
    queryKey: ['ops', 'unit-types'],
    queryFn: listUnitTypes,
  })
  return { unitTypes: query.data ?? [] }
}
