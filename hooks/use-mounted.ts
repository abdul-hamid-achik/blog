import * as React from "react";

const subscribe = () => () => undefined;

export function useMounted() {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
