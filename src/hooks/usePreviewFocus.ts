import { useEffect } from "react";

type Elem = HTMLElement & { inert?: boolean };

export function usePreviewFocus(
  containerRef: React.RefObject<HTMLElement | null>,
  isPreview: boolean
) {
  useEffect(() => {
    const root = containerRef.current as Elem | null;
    if (!root) return;

    const selector =
      'a[href], button, textarea, input, select, iframe, [tabindex]:not([tabindex="-1"])';

    const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));

    const disable = () => {
      root.setAttribute("aria-hidden", "true");
      try {
        (root as Elem).inert = true;
      } catch {}
      nodes.forEach((el) => {
        const prev = el.getAttribute("tabindex");
        if (prev !== null) el.setAttribute("data-prev-tabindex", prev);
        el.setAttribute("tabindex", "-1");
        el.setAttribute("aria-hidden", "true");
      });
    };

    const enable = () => {
      root.removeAttribute("aria-hidden");
      try {
        (root as Elem).inert = false;
      } catch {}
      nodes.forEach((el) => {
        const prev = el.getAttribute("data-prev-tabindex");
        if (prev !== null) {
          el.setAttribute("tabindex", prev);
          el.removeAttribute("data-prev-tabindex");
        } else {
          el.removeAttribute("tabindex");
        }
        el.removeAttribute("aria-hidden");
      });
    };

    if (isPreview) disable();
    else enable();

    return () => enable();
  }, [containerRef, isPreview]);
}

export default usePreviewFocus;
