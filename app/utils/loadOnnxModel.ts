import { Asset } from "expo-asset"
import * as FileSystem from "expo-file-system"
import { InferenceSession } from "onnxruntime-react-native"

interface ModelAssets {
  modelFile: any // require() result
  dataFile: any // require() result
}

interface LoadModelOptions {
  modelName?: string
  logPrefix?: string
}

/**
 * Load ONNX model with its data file
 * @param assets - Object containing model and data file requires
 * @param options - Optional configuration
 * @returns InferenceSession or null if failed
 */
export async function loadOnnxModel(
  assets: ModelAssets,
  options: LoadModelOptions = {},
): Promise<InferenceSession | null> {
  const { modelName = "model", logPrefix = "ONNX" } = options

  try {
    console.log(`[${logPrefix}] Loading ${modelName}...`)

    // Load assets
    const [modelAsset, dataAsset] = await Asset.loadAsync([assets.modelFile, assets.dataFile])

    const modelUri = modelAsset.localUri ?? modelAsset.uri
    const dataSrcUri = dataAsset.localUri ?? dataAsset.uri

    if (!modelUri || !dataSrcUri) {
      throw new Error(`Failed to load ${modelName} URIs`)
    }

    // Setup data file path
    const dir = modelUri.substring(0, modelUri.lastIndexOf("/"))
    const dataFileName = modelUri
      .substring(modelUri.lastIndexOf("/") + 1)
      .replace(".onnx", ".onnx.data")
    const dataDst = `${dir}/${dataFileName}`

    // Copy data file if not exists
    const dstInfo = await FileSystem.getInfoAsync(dataDst)
    if (!dstInfo.exists) {
      console.log(`[${logPrefix}] Copying ${modelName} data file...`)
      await FileSystem.copyAsync({ from: dataSrcUri, to: dataDst })
    }

    // Create inference session
    const session = await InferenceSession.create(modelUri)

    console.log(`[${logPrefix}] ${modelName} loaded successfully`)

    return session
  } catch (error) {
    console.error(`[${logPrefix}] Failed to load ${modelName}:`, error)
    return null
  }
}

/**
 * Load BlazeFace model specifically
 * @param logPrefix - Optional log prefix
 * @returns InferenceSession or null
 */
export async function loadBlazeFaceModel(
  logPrefix = "BlazeFace",
): Promise<InferenceSession | null> {
  return loadOnnxModel(
    {
      modelFile: require("@assets/models/blazeface.onnx"),
      dataFile: require("@assets/models/blazeface.onnx.data"),
    },
    {
      modelName: "BlazeFace",
      logPrefix,
    },
  )
}
