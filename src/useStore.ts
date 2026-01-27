import { isStore, type Store } from "@t8/store";
import { useEffect, useMemo, useRef, useState } from "react";

export type SetStoreValue<T> = Store<T>["setValue"];
export type ShouldUpdateCallback<T> = (nextValue: T, prevValue: T) => boolean;
export type ShouldUpdate<T> = boolean | ShouldUpdateCallback<T>;

/**
 * Returns the value of `store` passed as the parameter and a
 * function to update the store state value.
 *
 * @example
 * ```js
 * let [value, setValue] = useStore(store);
 * ```
 *
 * The optional second parameter `shouldUpdate` controls whether
 * the component using this hook should be updated in response to
 * the store updates, which is set to `true` by default.
 *
 * `shouldUpdate` can be set to `false` to prevent subscription
 * to the store updates. Use case: if the component only requires
 * the store value setter but not the store value, the component
 * may not need to respond to the store updates at all:
 *
 * @example
 * ```js
 * let [, setValue] = useStore(store, false);
 * ```
 *
 * `shouldUpdate` can also be a function `(nextValue, prevValue) => boolean`
 * to make the component respond only to specific store value changes,
 * when this function returns `true`.
 */
export function useStore<T>(
  store: Store<T>,
  shouldUpdate: ShouldUpdate<T> = true,
): [T, SetStoreValue<T>] {
  if (!isStore<T>(store))
    throw new Error("'store' is not an instance of Store");

  let [, setRevision] = useState(-1);

  let value = store.getValue();
  let setValue = useMemo(() => store.setValue.bind(store), [store]);
  let initialStoreRevision = useRef(store.revision);

  useEffect(() => {
    // Allow stores to hook into the effect
    store.emit("effect");

    if (!shouldUpdate) return;

    let unsubscribe = store.on("update", ({ current, previous }) => {
      if (typeof shouldUpdate !== "function" || shouldUpdate(current, previous))
        setRevision(Math.random());
    });

    if (store.revision !== initialStoreRevision.current)
      setRevision(Math.random());

    return () => {
      unsubscribe();
      initialStoreRevision.current = store.revision;
    };
  }, [store, shouldUpdate]);

  return [value, setValue];
}
