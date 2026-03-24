import type { AllowedStipeAction } from './onboarding'
import { useRunStipeAction } from './queries'

export function useStipeActionController() {
  const runStipe = useRunStipeAction()

  function actionIsRunning(actionKey?: AllowedStipeAction) {
    return Boolean(runStipe.isPending && actionKey && runStipe.variables === actionKey)
  }

  function actionWasLastRun(actionKey?: AllowedStipeAction) {
    return Boolean(runStipe.isSuccess && actionKey && runStipe.data.action === actionKey)
  }

  function runAction(actionKey: AllowedStipeAction) {
    runStipe.mutate(actionKey)
  }

  return {
    actionIsRunning,
    actionWasLastRun,
    runAction,
    runStipe,
  }
}
