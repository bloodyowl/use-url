import { match } from "ts-pattern";
import { replace, route, useNavigationBlocker, useUrl } from "../src/useUrl";
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

const SubSection = ({ path }: { path: string[] }) => {
  return (
    <main>
      {match(path)
        .with(route("/"), () => <h2>{`User home`}</h2>)
        .with(route("/friends"), () => <h2>{`User friends home`}</h2>)
        .with(route("/friends/list"), () => <h2>{`User friends list`}</h2>)
        .otherwise(() => `Not found`)}
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
      </nav>

      <Blocker />

      <main>
        {match(url.path)
          .with(route("/"), () => <h1>{`Home`}</h1>)
          .with(route("/users"), () => (
            <>
              <h1>{`Users (search: ${url.search.get("search")})`}</h1>
              <input
                type="search"
                value={url.search.get("search") ?? ""}
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
          ))
          .with(route("/users/:userId/*"), ({ userId, rest }) => (
            <>
              <h1>{`User ${userId} (rest: ${JSON.stringify(rest)})`}</h1>

              <SubSection path={rest} />
            </>
          ))
          .otherwise(() => `Not found`)}
      </main>
    </div>
  );
};

const root = document.querySelector("#root");
if (root != null) {
  createRoot(root).render(<App />);
}
