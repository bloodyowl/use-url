import { P, match } from "ts-pattern";
import { expect, test } from "vitest";
import { push, useUrl } from "../src/useUrl";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const App = () => {
  const url = useUrl();

  return (
    <div>
      <button onClick={() => push("/")}>Go to home</button>
      <button onClick={() => push("/users?search=John+Doe")}>
        Go to users
      </button>
      <button onClick={() => push("/users/1234")}>Go to user</button>
      <button onClick={() => push("/users/1234/friends/list")}>
        Go to user with deeper link
      </button>

      <main>
        {match(url.path)
          .with([], () => `Home`)
          .with(["users"], () => `Users (search: ${url.search.get("search")})`)
          .with(
            ["users", P.select("userId"), ...P.array(P.select("rest"))],
            ({ userId, rest }) =>
              `User ${userId} (rest: ${JSON.stringify(rest)})`
          )
          .otherwise(() => `Not found`)}
      </main>
    </div>
  );
};

test("Router", async () => {
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
