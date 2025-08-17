// src/lib/routeTransition.ts
export function withRouteTransition(
  leaveSelector: string,     // element that should animate out (Hub root)
  leaveClass: string,        // CSS class for leave animation
  onDone: () => void,        // call navigate() after animation
  durationMs = 380           // must match CSS .38s
){
  const node = document.querySelector<HTMLElement>(leaveSelector);
  if (!node) { onDone(); return; }
  node.classList.add(leaveClass);

  // Hard stop in case animationend doesn't fire
  let ended = false;
  const cleanup = () => {
    if (ended) return;
    ended = true;
    node.classList.remove(leaveClass);
    onDone();
  };

  node.addEventListener('animationend', cleanup, { once: true });
  setTimeout(cleanup, durationMs + 50);
}
