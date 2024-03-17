# bloody-use-url

> A simple router for React applications

```tsx
import { useUrl, route } from "bloody-use-url";
import { match } from "ts-pattern";

const App = () => {
  const url = useUrl();

  return match(url.path)
    .with(route("/"), () => <h1>{`Home`}</h1>)
    .with(route("/users"), () => <h1>{`Users`}</h1>)
    .with(route("/users/:userId/*"), ({ userId, rest }) => (
      <>
        <h1>{`User ${userId}`}</h1>
        <UserDetails path={rest} />
      </>
    ));
};
```

## Installation

```console
$ yarn add bloody-use-url ts-pattern
```

## API

### useUrl()

Hook to get the current URL:

```tsx
const url = useUrl();
```

The returned value has the following type:

```tsx
type Url = {
  path: string[];
  search: URLSearchParams;
  hash: string;
  pathname: string;
};
```

### push(to)

Pushes the page URL

```tsx
push("/users/bloodyowl");
```

### replace(to)

Replaces the page URL

```tsx
push("/users/bloodyowl");
```

### getUrl()

Returns the current URL

```tsx
const url = getUrl();
```

### watchUrl()

Returns the current URL

```tsx
const unwatchUrl = watchUrl((url) => {
  console.log(url);
});

// ...
unwatchUrl();
```

### useNavigationBlocker(shouldBlock, message)

Blocks page navigation if `shouldBlock` is `true`.

```tsx
useNavigationBlocker(
  formStatus === "editing",
  "Are you sure you want to leave this page?"
);
```

### useIsActivePath(path)

Returns whether the provided path is active

```tsx
const isActive = useIsActivePath("/foo/bar");
```

### route(path)

Generates a pattern to be consumed by [ts-pattern](https://github.com/gvergnaud/ts-pattern):

- Route params like `:paramName` are selected.
- Rest params like `*` are selected as `rest`.

```ts
return (
  match(url.path)
    .with(route("/"), () => <h1>{`Home`}</h1>)
    .with(route("/users"), () => <h1>{`Users`}</h1>)
    // `userId` & `rest` are correctly typed
    .with(route("/users/:userId/*"), ({ userId, rest }) => (
      <>
        <h1>{`User ${userId}`}</h1>
        <UserDetails path={rest} />
      </>
    ))
);
```

## Inspirations

- [Rescript React Router](https://rescript-lang.org/docs/react/latest/router) for the whole API
- [Chicane](https://swan-io.github.io/chicane/) for the TypeScript wizardy logic

## [License](./LICENSE)
