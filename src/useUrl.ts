import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useSyncExternalStore,
} from "react";

/**
 * `watchUrl` lets to subscribe to URL changes
 *
 * @param func: callback to run when URL changes, receives the new URL
 * @returns `unwatch` function
 */
export const watchUrl = (func: (url: URL) => void) => {
  const onChange = () => {
    func(getUrl());
  };
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
  };
};

let lastLocation: string | undefined;
let lastUrl: URL | undefined;

export const getUrl = (serverUrl?: string): URL => {
  const currentLocation = serverUrl ?? window.location.href;

  // Memoizes last URL as expected by useSyncExternalStore
  if (currentLocation === lastLocation && lastUrl !== undefined) {
    return lastUrl;
  }

  const parsedUrl = new URL(currentLocation);

  lastLocation = currentLocation;
  lastUrl = parsedUrl;

  return parsedUrl;
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
  ? (Head extends `:${infer Name}`
      ? Record<Name, string>
      : Head extends "*"
        ? Record<"rest", string>
        : Record<never, never>) &
      ToPattern<Tail>
  : Record<never, never>;

type MatchConfig<T extends string> = {
  [Key in T]: (value: ToPattern<SplitSegments<Key>>) => unknown;
} & { _: () => unknown };

export const route = <S extends string, T extends MatchConfig<S>>(
  url: string,
  config: T
): {
  [Key in keyof T]: ReturnType<T[Key]>;
}[keyof T] => {
  const pathnameSegments = url === "/" ? [] : url.slice(1).split("/");

  const defaultCase = config._;
  for (const [pattern, handler] of Object.entries(config)) {
    const patternSegments = pattern === "/" ? [] : pattern.slice(1).split("/");

    let index = -1;
    let params: Record<string, string> = {};
    let matches = true;
    const length = Math.max(patternSegments.length, pathnameSegments.length);
    while (++index < length) {
      const patternSegment = patternSegments[index];
      if (patternSegment == null) {
        matches = false;
        break;
      }

      if (patternSegment === "*" && index === patternSegments.length - 1) {
        params.rest = "/" + pathnameSegments.slice(index).join("/");
        break;
      }
      const pathnameSegment = pathnameSegments[index];
      if (patternSegment.charAt(0) === ":" && pathnameSegment != null) {
        params[patternSegment.slice(1)] = pathnameSegment;
        continue;
      }
      if (patternSegment !== pathnameSegment) {
        matches = false;
        break;
      }
    }

    if (matches) {
      // @ts-expect-error
      return handler(params);
    }
  }

  // @ts-expect-error
  return defaultCase();
};
