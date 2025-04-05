# rhums

> React Hook for URL Matching and Subscription

```tsx
import { useUrl, route } from "rhums";

const App = () => {
  const url = useUrl();

  return route(url.pathname, {
    "/": () => <h1>{`Home`}</h1>,
    "/users": () => <h1>{`Users`}</h1>,
    "/users/:userId/*": ({ userId, rest }) => (
      <>
        <h1>{`User ${userId}`}</h1>
        <UserDetails path={rest} />
      </>
    ),
    _: () => <h1>Not found</h1>,
  });
};
```

## Installation

```console
$ yarn add bloody-use-url
```

## API

### useUrl()

Hook to get the current URL:

```tsx
const url = useUrl();
```

The returned value is a [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL)

### push(to)

Pushes the page URL

```tsx
push("/users/bloodyowl");
```

### replace(to)

Replaces the page URL

```tsx
replace("/users/bloodyowl");
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

### route(path, config)

Matches the pathname to the config

- Route params like `:paramName` are selected.
- Rest params like `*` are selected as `rest`.

```tsx
route(url.pathname, {
  "/": () => <h1>{`Home`}</h1>,
  "/users": () => <h1>{`Users`}</h1>,
  "/users/:userId/*": ({ userId, rest }) => (
    <>
      <h1>{`User ${userId}`}</h1>
      <UserDetails path={rest} />
    </>
  ),
  _: () => <h1>Not found</h1>,
});
```

## Inspirations

- [Rescript React Router](https://rescript-lang.org/docs/react/latest/router) for the whole API
- [Chicane](https://swan-io.github.io/chicane/) for the TypeScript wizardy logic

## [License](./LICENSE)
