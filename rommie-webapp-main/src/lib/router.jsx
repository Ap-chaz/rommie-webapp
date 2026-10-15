/**
 * Thin layer over React Router so the rest of the app can keep using
 *   <Link to="/rooms/$id" params={{ id }} search={{ area: "Rongai" }} />
 *   navigate({ to: "/login", search: { redirect }, replace: true })
 * Search params are encoded the same way the previous router did (JSON for non-string values),
 * so existing shared URLs such as /rooms?maxRent=6000&amenities=["WiFi"] keep working.
 */
import { forwardRef, useCallback, useMemo } from "react";
import { Link as RouterLink, useLocation, useNavigate as useRouterNavigate } from "react-router-dom";

/* ---------- search params <-> plain objects ---------- */

/** "?a=1&b=x" -> { a: 1, b: "x" }. Values that are valid JSON (numbers, booleans, arrays) are decoded. */
export function parseSearch(searchString) {
  const out = {};
  for (const [key, raw] of new URLSearchParams(searchString)) {
    try {
      out[key] = JSON.parse(raw);
    } catch {
      out[key] = raw;
    }
  }
  return out;
}

function encodeValue(v) {
  if (typeof v === "string") {
    try {
      JSON.parse(v);
      return JSON.stringify(v); // e.g. the string "123" must stay a string after a round trip
    } catch {
      return v;
    }
  }
  return JSON.stringify(v);
}

/** { a: 1, b: undefined, c: "x" } -> "?a=1&c=x" (empty string when there is nothing to add). */
export function stringifySearch(search) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(search ?? {})) {
    if (v === undefined || v === null) continue;
    sp.set(k, encodeValue(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Fills `$param` placeholders and appends the search string. */
export function buildTo(to, params, search) {
  const path = params
    ? to.replace(/\$(\w+)/g, (_m, k) => encodeURIComponent(String(params[k])))
    : to;
  return path + stringifySearch(search);
}

/* ---------- components & hooks ---------- */

export const Link = forwardRef(function Link({ to, params, search, disabled, ...rest }, ref) {
  if (disabled) {
    return (
      <a
        ref={ref}
        role="link"
        aria-disabled="true"
        {...rest}
        onClick={(e) => e.preventDefault()}
      />
    );
  }
  return <RouterLink ref={ref} to={buildTo(to, params, search)} {...rest} />;
});

/** navigate({ to, params?, search?, replace? }) */
export function useNavigate() {
  const navigate = useRouterNavigate();
  return useCallback(
    ({ to, params, search, replace } = {}) =>
      navigate(buildTo(to, params, search), { replace: !!replace }),
    [navigate],
  );
}

/** Current search params, run through `validate` (a module-level function so the result can be memoised). */
export function useSearch(validate = (s) => s) {
  const { search } = useLocation();
  return useMemo(() => validate(parseSearch(search)), [search, validate]);
}

export function usePathname() {
  return useLocation().pathname;
}

/** pathname + search + hash, e.g. "/rooms?area=Rongai". Used as the post-login `redirect` target. */
export function useCurrentHref() {
  const { pathname, search, hash } = useLocation();
  return pathname + search + hash;
}
