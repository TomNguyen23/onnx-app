import { runOnJS } from "react-native-reanimated"
import { useFrameProcessor } from "react-native-vision-camera"
import { useResizePlugin } from "vision-camera-resize-plugin"

export interface NormalizedTensor {
  data: Float32Array
  shape: [number, number, number, number]
}

export function useResizedFrameProcessor(onFrameProcessed: (tensor: NormalizedTensor) => void) {
  const { resize } = useResizePlugin()

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet"

    // Step 1: Resize frame về 256x256 (đầu vào BlazeFace)
    const resized = resize(frame, {
      scale: {
        width: 192,
        height: 192,
      },
      pixelFormat: "rgb",
      dataType: "uint8",
    })

    // Step 2: Chuẩn hóa pixel values [-1, 1]
    const normalizedTensor = normalizeTensor(resized)

    // Step 3: Gửi tensor về JS thread (chỉ khi cần debug hoặc feed vào model)
    runOnJS(onFrameProcessed)(normalizedTensor)
  }, [])
  return frameProcessor
}

function normalizeTensor(tensor: Uint8Array): NormalizedTensor {
  "worklet"
  const normalized = new Float32Array(tensor.length)

  for (let i = 0; i < tensor.length; i++) {
    normalized[i] = tensor[i] / 127.5 - 1 // scale về [-1, 1]
  }

  const channels = 3
  const pixels = tensor.length / channels
  const size = Math.round(Math.sqrt(pixels))

  return {
    data: normalized,
    shape: [1, channels, size, size],
  }
}
