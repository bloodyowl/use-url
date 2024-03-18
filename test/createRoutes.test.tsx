import { match } from "ts-pattern";
import { expect, test } from "vitest";
import { push, useUrl } from "../src/useUrl";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { createRoutes } from "../src/createRoutes";

const routes = createRoutes({
  Home: "/",
  Users: "/users",
  UserArea: "/users/:userId/*",
  UserRoot: "/users/:userId",
  UserFriendsList: "/users/:userId/friends/list",
});

const App = () => {
  const url = useUrl();

  return (
    <div>
      <button onClick={() => push(routes.Home())}>Go to home</button>
      <button onClick={() => push(routes.Users() + "?search=John+Doe")}>
        Go to users
      </button>
      <button onClick={() => push(routes.UserRoot({ userId: "1234" }))}>
        Go to user
      </button>
      <button onClick={() => push(routes.UserFriendsList({ userId: "1234" }))}>
        Go to user with deeper link
      </button>

      <main>
        {match(url.path)
          .with(routes.P.Home, () => `Home`)
          .with(
            routes.P.Users,
            () => `Users (search: ${url.search.get("search")})`
          )
          .with(
            routes.P.UserArea,
            ({ userId, rest }) =>
              `User ${userId} (rest: ${JSON.stringify(rest)})`
          )
          .otherwise(() => `Not found`)}
      </main>
    </div>
  );
};

test("createRoutes", async () => {
  render(<App />);

  expect(screen.getByRole("main")).toHaveTextContent("Home");

  await userEvent.click(screen.getByText("Go to users"));
  expect(screen.getByRole("main")).toHaveTextContent(
    `Users (search: John Doe)`
  );

  await userEvent.click(screen.getByText("Go to user"));
  expect(screen.getByRole("main")).toHaveTextContent(`User 1234 (rest: [])`);

  await userEvent.click(screen.getByText("Go to user with deeper link"));
  expect(screen.getByRole("main")).toHaveTextContent(
    `User 1234 (rest: ["friends","list"])`
  );

  await userEvent.click(screen.getByText("Go to home"));
  expect(screen.getByRole("main")).toHaveTextContent("Home");
});
