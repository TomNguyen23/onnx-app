import { FC, useCallback, useEffect, useRef, useState, useMemo } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native"
import { Asset } from "expo-asset"
import * as FileSystem from "expo-file-system"
import { Ionicons } from "@expo/vector-icons"
import { InferenceSession } from "onnxruntime-react-native"
import { Camera, useCameraDevice } from "react-native-vision-camera"

import { Text } from "@/components/Text"
import { AppStackScreenProps } from "@/navigators/AppNavigator"
import { colors } from "@/theme/colors"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"
import { detectFaceScores } from "@/utils/faceDetectionInference"
import { ProcessedFrame, useFaceDetectionProcessor } from "@/utils/useFaceDetectionProccessor"

interface FaceCaptureScreenProps extends AppStackScreenProps<"FaceCapture"> {}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const GUIDE_BOX_WIDTH = SCREEN_WIDTH * 0.7
const GUIDE_BOX_HEIGHT = SCREEN_HEIGHT * 0.5

export const FaceCaptureScreen: FC<FaceCaptureScreenProps> = () => {
  const modelRef = useRef<InferenceSession | null>(null)
  const { themed } = useAppTheme()
  const AUTO_COOLDOWN_MS = 4000
  const cameraRef = useRef<Camera>(null)
  const lastAutoCaptureAtRef = useRef(0)
  const isAutoCapturingRef = useRef(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [isTaking, setIsTaking] = useState(false)
  const [isFront, setIsFront] = useState<boolean>(true)

  const device = useCameraDevice(isFront ? "front" : "back")

  // Add format selection
  const format = useMemo(() => {
    if (!device?.formats) return undefined

    return (
      device.formats.find((f) => {
        return f.maxFps >= 10 && f.videoWidth >= 1280 && f.videoHeight >= 720
      }) ?? device.formats[0]
    )
  }, [device])

  useEffect(() => {
    const requestPermission = async () => {
      const result = await Camera.requestCameraPermission()
      setHasPermission(result === "granted")

      if (result !== "granted") {
        Alert.alert("Camera Permission", "Camera permission is required to use this feature")
      }
    }

    requestPermission()
  }, [])

  useEffect(() => {
    async function loadModel() {
      try {
        // 1) Load cả .onnx và .onnx.data
        const assets = await Asset.loadAsync([
          require("@assets/models/blazeface.onnx"),
          require("@assets/models/blazeface.onnx.data"),
        ])

        const modelAsset = assets[0]
        const dataAsset = assets[1]

        const modelUri = modelAsset.localUri ?? modelAsset.uri
        const dataSrcUri = dataAsset.localUri ?? dataAsset.uri

        if (!modelUri || !dataSrcUri) {
          console.log("failed to get local URIs", { modelUri, dataSrcUri })
          return
        }

        // 2) Đảm bảo .onnx.data tồn tại cạnh file .onnx với tên chính xác
        const dir = modelUri.substring(0, modelUri.lastIndexOf("/"))
        const dataDst = `${dir}/blazeface.onnx.data`

        const dstInfo = await FileSystem.getInfoAsync(dataDst)
        if (!dstInfo.exists) {
          await FileSystem.copyAsync({ from: dataSrcUri, to: dataDst })
        }

        // 3) Tạo session
        modelRef.current = await InferenceSession.create(modelUri)
        const model = modelRef.current
        console.log(
          "model loaded successfully",
          `input names: ${model?.inputNames}, output names: ${model?.outputNames}`,
        )
      } catch (e) {
        console.log("failed to load model", `${e}`)
        throw e
      }
    }

    if (hasPermission) {
      loadModel()
    }
  }, [hasPermission])

  const isProcessingInference = useRef(false)

  const handleFrameProcessed = useCallback(async (result: ProcessedFrame) => {
    if (isProcessingInference.current || !modelRef.current) {
      return
    }

    try {
      isProcessingInference.current = true

      // Chạy inference để lấy tất cả scores
      const detection = await detectFaceScores(modelRef.current, result.imageData, result.shape)

      // Log scores
      console.log("Total scores:", detection.allScores.length)
    } catch (error) {
      console.error("Inference error:", error)
    } finally {
      isProcessingInference.current = false
    }
  }, [])

  const { frameProcessor } = useFaceDetectionProcessor({
    width: 256,
    height: 256,
    onFrameProcessed: handleFrameProcessed,
    throttleMs: 500, // Tăng lên 200ms để giảm giật
  })

  const uploadPhoto = async (photo: { path: string }) => {
    console.log("Captured Photo:", {
      uri: photo.path,
    })
  }

  const AutoCapture = useCallback(async () => {
    if (!cameraRef.current) return
    if (isTaking || isAutoCapturingRef.current) return

    const now = Date.now()
    if (now - lastAutoCaptureAtRef.current < AUTO_COOLDOWN_MS) return

    try {
      isAutoCapturingRef.current = true
      setIsTaking(true)
      const photo = await cameraRef.current.takePhoto({})
      lastAutoCaptureAtRef.current = Date.now()
      await uploadPhoto(photo)
    } catch (error) {
      console.warn("[VisionAutoCapture] Auto-capture error:", error)
    } finally {
      setIsTaking(false)
      // Add a small delay before allowing the next auto-capture
      setTimeout(() => {
        isAutoCapturingRef.current = false
      }, 500)
    }
  }, [isTaking])

  const handleManualCapture = useCallback(async () => {
    if (!cameraRef.current || isTaking) return

    try {
      setIsTaking(true)
      const photo = await cameraRef.current.takePhoto({})
      await uploadPhoto(photo)
    } catch (error) {
      console.warn("[VisionAutoCapture] Error capturing:", error)
      Alert.alert("Capture Error", "An error occurred while capturing the photo.")
    } finally {
      setIsTaking(false)
    }
  }, [isTaking])

  const toggleCamera = useCallback(() => {
    if (isTaking) return
    setIsFront((prev) => !prev)
  }, [isTaking])

  if (!device) {
    return (
      <View style={themed($container)}>
        <Text preset="subheading" text="Loading camera..." />
      </View>
    )
  }

  if (!hasPermission) {
    return (
      <View style={themed($container)}>
        <Text preset="subheading" text="Waiting for camera access..." />
      </View>
    )
  }

  return (
    <View style={themed($container)}>
      <Camera
        style={$camera}
        ref={cameraRef}
        device={device}
        isActive
        photo={true}
        pixelFormat="yuv"
        // format={format}
        frameProcessor={frameProcessor}
        // fps={10}
      />

      {/* Face Guide Overlay */}
      <View style={$overlay}>
        {/* Top Dark Area */}
        <View style={$overlaySection} />

        <View style={$middleRow}>
          {/* Left Dark Area */}
          <View style={$overlaySection} />

          {/* Guide Box */}
          <View style={$guideBox}>
            <View style={[$corner, $topLeft]} />
            <View style={[$corner, $topRight]} />
            <View style={[$corner, $bottomLeft]} />
            <View style={[$corner, $bottomRight]} />

            <View style={$guideContent}>
              <Ionicons
                name="person-outline"
                size={80}
                color={colors.palette.neutral100}
                style={$guideIcon}
              />
              <Text style={$guideText} text="Position your face within the frame" size="xs" />
            </View>
          </View>

          {/* Right Dark Area */}
          <View style={$overlaySection} />
        </View>

        {/* Bottom Dark Area */}
        <View style={$overlaySection} />
      </View>

      <View style={themed($controls)}>
        <Text
          style={themed($statusText)}
          text={isTaking ? "Capturing..." : "Ready - Auto-capture when face is detected"}
          size="xs"
        />

        <View style={$actionsRow}>
          <TouchableOpacity
            onPress={handleManualCapture}
            style={[themed($captureButton), isTaking && $disabledOpacity]}
            disabled={isTaking}
            accessibilityRole="button"
            accessibilityLabel="Capture Photo"
          >
            <Ionicons
              name={isTaking ? "hourglass" : "camera"}
              size={26}
              color={colors.palette.neutral900}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleCamera}
            style={[themed($iconButton), isTaking && $disabledOpacity]}
            disabled={isTaking}
            accessibilityRole="button"
            accessibilityLabel="Switch Camera"
          >
            <Ionicons name="camera-reverse" size={22} color={colors.palette.neutral100} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral900,
  justifyContent: "center",
  alignItems: "center",
})

const $camera: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
}

// Overlay styles
const $overlay: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  justifyContent: "center",
  alignItems: "center",
}

const $overlaySection: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  width: "100%",
}

const $middleRow: ViewStyle = {
  flexDirection: "row",
  height: GUIDE_BOX_HEIGHT,
}

const $guideBox: ViewStyle = {
  width: GUIDE_BOX_WIDTH,
  height: GUIDE_BOX_HEIGHT,
  borderWidth: 2,
  borderColor: colors.palette.neutral100,
  borderRadius: 20,
  position: "relative",
  justifyContent: "center",
  alignItems: "center",
}

const $corner: ViewStyle = {
  position: "absolute",
  width: 30,
  height: 30,
  borderColor: colors.palette.accent500,
  borderWidth: 3,
}

const $topLeft: ViewStyle = {
  top: -2,
  left: -2,
  borderBottomWidth: 0,
  borderRightWidth: 0,
  borderTopLeftRadius: 20,
}

const $topRight: ViewStyle = {
  top: -2,
  right: -2,
  borderBottomWidth: 0,
  borderLeftWidth: 0,
  borderTopRightRadius: 20,
}

const $bottomLeft: ViewStyle = {
  bottom: -2,
  left: -2,
  borderTopWidth: 0,
  borderRightWidth: 0,
  borderBottomLeftRadius: 20,
}

const $bottomRight: ViewStyle = {
  bottom: -2,
  right: -2,
  borderTopWidth: 0,
  borderLeftWidth: 0,
  borderBottomRightRadius: 20,
}

const $guideContent: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
}

const $guideIcon: ViewStyle = {
  opacity: 0.7,
  marginBottom: 8,
}

const $guideText: TextStyle = {
  color: colors.palette.neutral100,
  textAlign: "center",
  opacity: 0.9,
  fontWeight: "500",
}

const $controls: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  bottom: spacing.lg,
  left: spacing.md,
  right: spacing.md,
  alignItems: "center",
})

const $statusText: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  color: colors.palette.neutral100,
  marginBottom: spacing.sm,
})

const $actionsRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
}

const $iconButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginHorizontal: spacing.xs,
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: colors.palette.neutral800,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: colors.palette.neutral700,
})

const $captureButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginHorizontal: spacing.xs,
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: colors.palette.neutral100,
  alignItems: "center",
  justifyContent: "center",
})

const $disabledOpacity: ViewStyle = {
  opacity: 0.6,
}
