import { createContext, useContext } from "react"

import type { RootStoreInstance } from "./RootStore"

const RootStoreContext = createContext<RootStoreInstance | null>(null)
export const RootStoreProvider = RootStoreContext.Provider

export function useStores() {
  const rootStore = useContext(RootStoreContext)
  if (!rootStore) throw new Error("useStores must be used within RootStoreProvider")
  return rootStore
}
