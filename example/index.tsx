import { match, replace, useNavigationBlocker, useUrl } from "../src/useUrl";
import { createRoot } from "react-dom/client";
import { useState } from "react";
import { Link } from "./Link";

const Blocker = () => {
  const [shouldBlock, setShouldBlock] = useState(false);

  useNavigationBlocker(
    shouldBlock,
    "Are you sure you want to leave this page?"
  );

  return (
    <label>
      <input
        type="checkbox"
        onChange={(event) => setShouldBlock(event.target.checked)}
      />
      Should block
    </label>
  );
};

const SubSection = ({ path }: { path: string }) => {
  return (
    <main>
      {match(path, {
        "/": () => <h2>{`User home`}</h2>,
        "/friends": () => <h2>{`User friends home`}</h2>,
        "/friends/list": () => <h2>{`User friends list`}</h2>,
        _: () => `Not found`,
      })}
    </main>
  );
};

const App = () => {
  const url = useUrl();

  return (
    <div>
      <nav>
        <Link
          href="/"
          className={({ active }) => (active ? "active" : undefined)}
        >
          Go to home
        </Link>
        <Link
          href="/users"
          className={({ active }) => (active ? "active" : undefined)}
        >
          Go to users
        </Link>
        <Link
          href="/users/1234"
          className={({ active }) => (active ? "active" : undefined)}
        >
          Go to user
        </Link>
        <Link
          href="/users/1234/friends/list"
          className={({ active }) => (active ? "active" : undefined)}
        >
          Go to user with deeper link
        </Link>
        <Link
          href="/viewer"
          className={({ active }) => (active ? "active" : undefined)}
        >
          Go to viewer
        </Link>
      </nav>

      <Blocker />

      <main>
        {match(url.pathname, {
          "/": () => <h1>{`Home`}</h1>,
          "/users": () => (
            <>
              <h1>{`Users (search: ${url.searchParams.get("search")})`}</h1>
              <input
                type="search"
                value={url.searchParams.get("search") ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "") {
                    replace("/users");
                  } else {
                    const search = new URLSearchParams();
                    search.append("search", value);
                    replace(`?${search.toString()}`);
                  }
                }}
              />
            </>
          ),
          "/users/:userId/*": ({ userId, rest }) => (
            <>
              <h1>{`User ${userId} (rest: ${JSON.stringify(rest)})`}</h1>

              <SubSection path={rest} />
            </>
          ),
          "/viewer/*": ({ rest }) => (
            <>
              <h1>{`Viewer (rest: ${JSON.stringify(rest)})`}</h1>

              <SubSection path={rest} />
            </>
          ),
          _: () => `Not found`,
        })}
      </main>
    </div>
  );
};

const root = document.querySelector("#root");
if (root != null) {
  createRoot(root).render(<App />);
}
