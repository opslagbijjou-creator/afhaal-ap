export const Routes = {
  DASHBOARD: "dashboard",
  INTAKE: "intake",
  PICKUP: "pickup",
  SEARCH: "search",
  RACKS: "racks",
  LOGS: "logs"
};

export function setRoute(route) {
  window.location.hash = `#${route}`;
}

export function getRoute() {
  const raw = (window.location.hash || "").replace("#","").trim();
  return raw || Routes.DASHBOARD;
}
