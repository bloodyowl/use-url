import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useSyncExternalStore,
} from "react";
import { P } from "ts-pattern";
import { ArrayP, Chainable, SelectP } from "ts-pattern/dist/types/Pattern";

type Url = {
  path: string[];
  search: URLSearchParams;
  hash: string;
  pathname: string;
};

/**
 * `watchUrl` lets to subscribe to URL changes
 *
 * @param func: callback to run when URL changes, receives the new URL
 * @returns `unwatch` function
 */
export const watchUrl = (func: (url: Url) => void) => {
  const onChange = () => {
    func(getUrl());
  };
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
  };
};

let lastLocation: string | undefined;
let lastUrl: Url | undefined;

const parsePathname = (pathname: string) =>
  pathname === "/" ? [] : pathname.slice(1).split("/");

export const getUrl = (serverUrl?: string): Url => {
  const currentLocation = serverUrl ?? window.location.href;

  // Memoizes last URL as expected by useSyncExternalStore
  if (currentLocation === lastLocation && lastUrl !== undefined) {
    return lastUrl;
  }

  const parsedUrl = new URL(currentLocation);
  const pathname = parsedUrl.pathname;
  const hash = parsedUrl.hash;
  const url = {
    path: parsePathname(pathname),
    search: parsedUrl.searchParams,
    hash: hash === "#" ? "" : hash.slice(1),
    pathname,
  };
  lastLocation = currentLocation;
  lastUrl = url;
  return url;
};

const dispatchPopState = () => {
  const event = new Event("popstate");
  window.dispatchEvent(event);
};

const ServerUrlContext = createContext<string | undefined>(undefined);

export const ServerUrlProvider = ServerUrlContext.Provider;

/**
 * `useUrl` return the current URL
 *
 * @returns a `Url` object
 */
export const useUrl = () => {
  const serverUrl = useContext(ServerUrlContext);
  const url = useSyncExternalStore(watchUrl, getUrl);
  return serverUrl != undefined ? getUrl(serverUrl) : url;
};

/**
 * `useNavigationBlocker` blocks the page navigation with `confirm(message)`
 *
 * @param shouldBlock (boolean): should block the navigation
 * @param message (string): message to display to the user
 */
export const useNavigationBlocker = (shouldBlock: boolean, message: string) => {
  const id = useId();

  useEffect(() => {
    if (shouldBlock) {
      const unregister = registerBlocker(id, message);
      return unregister;
    }
  }, [shouldBlock]);
};

/**
 * `useIsActivePath` return if the provided link is active
 *
 * @param path: string
 * @returns boolean
 */
export const useIsActivePath = (path: string) => {
  const serverUrl = useContext(ServerUrlContext);

  const getSnapshot = useCallback(() => {
    const currentPathname = getUrl(serverUrl).pathname;
    const nextPathname = new URL(path, `use-url://${currentPathname}`).pathname;
    return currentPathname === nextPathname;
  }, [serverUrl, path]);

  const isActive = useSyncExternalStore(watchUrl, getSnapshot);
  return isActive;
};

const UNUSED = "";

type Blocker = { id: string; message: string };
let blockers: Blocker[] = [];

const registerBlocker = (id: string, message: string) => {
  blockers = [...blockers, { id, message }];
  return () => {
    blockers = blockers.filter((item) => item.id !== id);
  };
};

const canNavigate = () => {
  const lastBlocker = blockers.at(-1);
  if (lastBlocker === undefined) {
    return true;
  }
  return window.confirm(lastBlocker.message);
};

/**
 * Navigate to URL.
 *
 * @param to URL to navigate to
 */
export const push = (to: string | URL) => {
  if (canNavigate()) {
    window.history.pushState(null, UNUSED, to);
    dispatchPopState();
  }
};

/**
 * Navigate to URL without creating a new `history` entry
 *
 * @param to URL to navigate to
 */
export const replace = (to: string | URL) => {
  if (canNavigate()) {
    window.history.replaceState(null, UNUSED, to);
    dispatchPopState();
  }
};

type SplitSegments<Value extends string> =
  Value extends `${infer Head}/${infer Tail}`
    ? Head extends ""
      ? SplitSegments<Tail>
      : [Head, ...SplitSegments<Tail>]
    : Value extends ""
      ? []
      : [Value];

type ToPattern<Segments> = Segments extends [infer Head, ...infer Tail]
  ? [
      ...(Head extends `:${infer Name}`
        ? [Chainable<SelectP<Name, "select">>]
        : Head extends "*"
          ? ArrayP<unknown, Chainable<SelectP<"rest", "select">>>[]
          : [Head]),
      ...ToPattern<Tail>,
    ]
  : [];

const cache = new Map<string, unknown>();
/**
 * Create a Pattern for ts-pattern to match a URL path
 *
 * @param path the path with params
 * @returns the ts-pattern pattern
 */
export const route = <T extends string>(
  path: T
): ToPattern<SplitSegments<T>> => {
  if (cache.has(path)) {
    return cache.get(path) as unknown as ToPattern<SplitSegments<T>>;
  }
  // @ts-expect-error Yeah, this is messed up
  const pattern = parsePathname(path).reduce((acc, segment) => {
    return [
      ...acc,
      ...(segment.startsWith(":")
        ? [P.select(segment.slice(1))]
        : segment === "*"
          ? P.array(P.select("rest"))
          : [segment]),
    ];
  }, []) as unknown as ToPattern<SplitSegments<T>>;
  cache.set(path, pattern);
  return pattern;
};
