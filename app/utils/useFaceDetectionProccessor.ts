import { useCallback, useMemo, useRef } from "react"
import { useFrameProcessor } from "react-native-vision-camera"
import { Worklets } from "react-native-worklets-core"
import { useResizePlugin } from "vision-camera-resize-plugin"

export interface ProcessedFrame {
  shape: [number, number, number, number]
  timestamp: number
  preview?: number[]
  imageData: number[] // Đổi từ Float32Array thành number[]
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
          scale: {
            width,
            height,
          },
          pixelFormat: "rgb",
          dataType: "uint8",
        })

        // Step 2: Normalize pixel values to [0, 1] và chuyển thành array
        const normalized: number[] = []
        for (let i = 0; i < resized.length; i++) {
          normalized.push(resized[i] / 255.0)
        }

        // Step 3: Create tensor shape
        const channels = 3
        const pixels = resized.length / channels
        const size = Math.round(Math.sqrt(pixels))

        // Step 4: Tạo preview từ first 10 values
        const preview: number[] = []
        for (let i = 0; i < Math.min(10, normalized.length); i++) {
          preview.push(normalized[i])
        }

        const result: ProcessedFrame = {
          shape: [1, channels, size, size],
          timestamp: now,
          preview,
          imageData: normalized, // Giờ đây là number[] thay vì Float32Array
        }

        // Step 5: Send to JS thread
        handleProcessedFrameWorklet(result)
      } catch (error) {
        console.error("Frame processing error:", error)
      }
    },
    [width, height, throttleMs, handleProcessedFrameWorklet, resize],
  )

  return {
    frameProcessor,
  }
}
