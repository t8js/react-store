# T8 React Store

React app state management condensed to the essentials

**Features:** Quickest migration from local state&nbsp;&middot; Single pattern for shared and local state&nbsp;&middot; CSR/SSR without workarounds&nbsp;&middot; Integrable with Immer&nbsp;&middot; Quickly pluggable persistence across page reloads

<!-- docsgen-show-start --
```diff
+ let store = new Store(0);

  let Counter = () => {
-   let [counter, setCounter] = useState(0);
+   let [counter, setCounter] = useStore(store);

    let handleClick = () => {
      setCounter(value => value + 1);
    };

    return <button onClick={handleClick}>+ {counter}</button>;
  };
```
-- docsgen-show-end -->

## Shared state setup

Moving local state to the full-fledged shared state:

```diff
+ import { Store, useStore } from "@t8/react-store";
+
+ let counterStore = new Store(0);

  let Counter = () => {
-   let [counter, setCounter] = useState(0);
+   let [counter, setCounter] = useStore(counterStore);

    let handleClick = () => {
      setCounter(value => value + 1);
    };

    return <button onClick={handleClick}>+ {counter}</button>;
  };

  let ResetButton = () => {
-   let [, setCounter] = useState(0);
+   let [, setCounter] = useStore(counterStore, false);

    let handleClick = () => {
      setCounter(0);
    };

    return <button onClick={handleClick}>×</button>;
  };

  let App = () => <><Counter/>{" "}<ResetButton/></>;
```

[Live counter demo](https://codesandbox.io/p/sandbox/szhdnw?file=%252Fsrc%252FApp.tsx)<br>
[Tic-tac-toe](https://codesandbox.io/p/sandbox/tq852v?file=%252Fsrc%252FApp.tsx)

⬥ The shared state setup shown above is very similar to `useState()` allowing for quick migration from local state to shared state or the other way around.

⬥ The optional `false` parameter in `useStore(store, false)` (as in `<ResetButton>` above) tells the hook not to subscribe the component to tracking the store updates. The common use case is when a component makes use of the store value setter without using the store value.

⬥ With SSR, it's common practice to put shared values into React Context rather than module-level variables to avoid cross-request data sharing. The same applies to stores, see the examples in the [Sharing state via Context](#sharing-state-via-context) section below.

⬥ Similarly to instances of the built-in data container classes, such as `Set` and `Map`, stores are created as `new Store(data)` rather than with a factory function.

## Single store or multiple stores

An application can have as many stores as needed.

⬥ Splitting data into multiple stores is one of the strategies to maintain more targeted subscriptions to data changes in components. The other strategy is filtering store updates at the component level, which is discussed below.

## Filtering store updates

When only the store value setter is required, without the store value, we can opt out from subscription to store changes by passing `false` as the parameter of `useStore()`:

```js
let [, setValue] = useStore(store, false);
```

Apart from a boolean, `useStore(store, shouldUpdate)` accepts a function of `(nextValue, prevValue) => boolean` as the optional second parameter to filter store value updates to respond to:

```jsx
import { useStore } from "@t8/react-store";

let ItemCard = ({ id }) => {
  let [items, setItems] = useStore(itemStore, (nextItems, prevItems) => {
    // Assuming that items have a `revision` property
    return nextItems[id].revision !== prevItems[id].revision;
  });

  return (
    // Content
  );
};
```

While `useStore(itemStore)` in this component would trigger a re-render in response to any changes in the `itemStore` (which can be fine with a small store), with `useStore(itemStore, shouldUpdate)` the `ItemCard` component has a more targeted subscription to the store: in this example, a re-render will only be triggered if the `revision` property of the item with the given `id` has changed.

## Sharing state via Context

Shared state can be provided to the app by means of a regular React Context provider:

```diff
+ import { createContext, useContext } from "react";
  import { Store, useStore } from "@t8/react-store";

- let counterStore = new Store(0);
+ let AppContext = createContext(new Store(0));

  let Counter = () => {
-   let [counter, setCounter] = useStore(counterStore);
+   let [counter, setCounter] = useStore(useContext(AppContext));

    // Rendering
  };

  let App = () => (
-   <>
+   <AppContext.Provider value={new Store(42)}>
      <PlusButton/>{" "}<Display/>
+   </AppContext.Provider>
-   </>
  );
```

[Live counter demo with Context](https://codesandbox.io/p/sandbox/rtng37?file=%2Fsrc%2FPlusButton.jsx)

⬥ In a multi-store setup, stores can be located in a single Context or split across multiple Contexts, just like any application data.

```jsx
import { createContext, useContext } from "react";
import { Store, useStore } from "@t8/react-store";

// Multiple stores in a single Context
let AppContext = createContext({
  users: new Store(/* ... */),
  items: new Store(/* ... */),
});

let ItemCard = ({ id }) => {
  let [items, setItems] = useStore(useContext(AppContext).items);

  // Rendering
};
```

⬥ Note that updating the store value doesn't change the store reference sitting in the React Context and therefore doesn't cause updates of the entire Context. Only the components subscribed to updates in the particular store by means of `useStore(store)` will be notified to re-render.

## Store data

A store can contain data of any kind, whether of a primitive type or nonprimitive.

Live demos:<br>
[Primitive value state](https://codesandbox.io/p/sandbox/rtng37?file=%2Fsrc%2FPlusButton.jsx)<br>
[Object value state](https://codesandbox.io/p/sandbox/y7wt2j?file=%2Fsrc%2FPlusButton.jsx)

## With Immer

Immer can be used with `useStore()` just the same way as [with `useState()`](https://immerjs.github.io/immer/example-setstate#usestate--immer) to facilitate deeply nested data changes.

[Live demo with Immer](https://codesandbox.io/p/sandbox/rn4qsr?file=%2Fsrc%2FPlusButton.jsx)

## Shared loading state

The ready-to-use hook from [React Pending](https://github.com/t8js/react-pending) helps manage shared async action state without rearranging the app's state management and actions' code.

## Persistence across remounts

A standalone store initialized outside a component can be used by the component as remount-persistent state, whether used by other components or not.

## Persistence across page reloads

Replacing `new Store(data)` with `new PersistentStore(data, storageKey)` as shown below gets the store's value initially restored from and saved whenever updated to `storageKey` in `localStorage`. (Pass `{ session: true }` as the `options` parameter of `new PersistentStore(data, storageKey, options?)` to use `sessionStorage` instead of `localStorage`.) Otherwise, persistent stores work pretty much like regular stores described above.

```js
import { PersistentStore } from "@t8/react-store";

let counterStore = new PersistentStore(0, "counter");
```

⬥ The way data gets saved to and restored from a browser storage entry (including filtering out certain data or otherwise rearranging the saved data) can be redefined by setting `options.serialize` and `options.deserialize` in `new PersistentStore(data, storageKey, options?)`. By default, these options act like `JSON.stringify()` and `JSON.parse()` respectively.

⬥ `PersistentStore` skips interaction with the browser storage in non-browser environments, which makes it equally usable with SSR.
