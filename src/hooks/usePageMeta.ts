import { useEffect } from "react";

function formatTitle(title: string) {
  return title.includes("JALSOL") ? title : `${title} | JALSOL`;
}

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = formatTitle(title);

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    let created = false;
    const previousDescription = meta?.getAttribute("content") ?? null;

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
      created = true;
    }

    if (description) {
      meta.setAttribute("content", description);
    }

    return () => {
      document.title = previousTitle;

      if (!meta) return;

      if (description) {
        if (previousDescription !== null) {
          meta.setAttribute("content", previousDescription);
        } else if (created) {
          meta.remove();
        }
      }
    };
  }, [description, title]);
}
