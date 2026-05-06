const routeCounters = new Map<string, number>()

export function incrementRouteCounter(route: string): void {
  routeCounters.set(route, (routeCounters.get(route) ?? 0) + 1)
}

export function getRouteCounters(): ReadonlyMap<string, number> {
  return routeCounters
}
