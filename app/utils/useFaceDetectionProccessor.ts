import { useCallback, useMemo, useRef } from "react"
import { useFrameProcessor } from "react-native-vision-camera"
import { Worklets } from "react-native-worklets-core"
import { useResizePlugin } from "vision-camera-resize-plugin"

export interface ProcessedFrame {
  shape: [number, number, number, number]
  timestamp: number
  preview?: number[]
  imageData: number[] // CHW format
}

interface UseFaceDetectionProcessorOptions {
  width?: number
  height?: number
  onFrameProcessed?: (result: ProcessedFrame) => void
  throttleMs?: number
}

export function useFaceDetectionProcessor(options: UseFaceDetectionProcessorOptions = {}) {
  const { width = 256, height = 256, onFrameProcessed, throttleMs = 200 } = options
  const { resize } = useResizePlugin()
  const lastProcessedRef = useRef(0)

  const handleProcessedFrame = useCallback(
    (result: ProcessedFrame) => {
      onFrameProcessed?.(result)
    },
    [onFrameProcessed],
  )

  // Create worklet callback
  const handleProcessedFrameWorklet = useMemo(
    () => Worklets.createRunOnJS(handleProcessedFrame),
    [handleProcessedFrame],
  )

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet"

      // Throttle processing
      const now = Date.now()
      if (now - lastProcessedRef.current < throttleMs) {
        return
      }
      lastProcessedRef.current = now

      try {
        // Step 1: Resize frame
        const resized = resize(frame, {
          scale: { width, height },
          pixelFormat: "rgb",
          dataType: "uint8",
        })

        // Step 2: Normalize và transpose từ HWC sang CHW
        const channels = 3
        const H = height
        const W = width

        // Tạo mảng CHW format
        const chw: number[] = []

        // Transpose: HWC -> CHW
        // HWC format: [R0, G0, B0, R1, G1, B1, ...]
        // CHW format: [R0, R1, R2, ..., G0, G1, G2, ..., B0, B1, B2, ...]

        for (let c = 0; c < channels; c++) {
          for (let h = 0; h < H; h++) {
            for (let w = 0; w < W; w++) {
              const hwcIndex = (h * W + w) * channels + c
              const pixelValue = resized[hwcIndex] / 255.0
              chw.push(pixelValue)
            }
          }
        }

        // Step 3: Tạo preview từ first 10 values
        const preview: number[] = []
        for (let i = 0; i < Math.min(10, chw.length); i++) {
          preview.push(chw[i])
        }

        const result: ProcessedFrame = {
          shape: [1, channels, H, W],
          timestamp: now,
          preview,
          imageData: chw, // CHW format
        }

        // Step 4: Send to JS thread
        handleProcessedFrameWorklet(result)
      } catch (error) {
        console.error("Frame processing error:", error)
      }
    },
    [width, height, throttleMs, handleProcessedFrameWorklet, resize],
  )

  return { frameProcessor }
}
