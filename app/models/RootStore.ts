import { Instance, types } from "mobx-state-tree"

import { FaceCaptureStore } from "./FaceCaptureStore"

export const RootStore = types.model("RootStore", {
  faceCapture: FaceCaptureStore,
})

export interface RootStoreInstance extends Instance<typeof RootStore> {}
