import { useEffect } from "react";

/**
 * Sets the document title and <meta> tags for the current page, and puts them back when the page unmounts.
 * Takes the same array shape the routes used before:
 *   [{ title }, { name: "description", content }, { property: "og:title", content }]
 * Defaults (for first paint and crawlers that don't run JavaScript) live in index.html.
 */
export function usePageMeta(meta) {
  const serialized = JSON.stringify(meta);

  useEffect(() => {
    const items = JSON.parse(serialized);
    const undo = [];

    for (const item of items) {
      if (item.title !== undefined) {
        const previous = document.title;
        document.title = item.title;
        undo.push(() => {
          document.title = previous;
        });
        continue;
      }

      const attr = item.name ? "name" : item.property ? "property" : null;
      if (!attr) continue;
      const key = item[attr];
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (el) {
        const previous = el.getAttribute("content");
        el.setAttribute("content", item.content);
        undo.push(() => el.setAttribute("content", previous ?? ""));
      } else {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        el.setAttribute("content", item.content);
        document.head.appendChild(el);
        undo.push(() => el.remove());
      }
    }

    return () => undo.reverse().forEach((fn) => fn());
  }, [serialized]);
}
