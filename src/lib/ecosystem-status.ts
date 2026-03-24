import { useEcosystemStatus, useStipeRepairPlan } from './queries'

export function useEcosystemStatusController() {
  const statusQuery = useEcosystemStatus()
  const repairPlanQuery = useStipeRepairPlan()

  function refreshAll() {
    statusQuery.refetch()
    repairPlanQuery.refetch()
  }

  return {
    refreshAll,
    repairPlanQuery,
    statusQuery,
  }
}
