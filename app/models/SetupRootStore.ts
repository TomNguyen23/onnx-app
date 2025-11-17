import { RootStore, RootStoreInstance } from "./RootStore"

export async function setupRootStore(): Promise<RootStoreInstance> {
  const rootStore = RootStore.create({
    faceCapture: {},
  })
  return rootStore
}
