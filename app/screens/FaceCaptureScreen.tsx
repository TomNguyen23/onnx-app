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
import { useStores } from "@/models/RootContext"
import { AppStackScreenProps } from "@/navigators/AppNavigator"
import { colors } from "@/theme/colors"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"
import { detectFaceScores } from "@/utils/faceDetectionInference"
import { ProcessedFrame, useFaceDetectionProcessor } from "@/utils/useFaceDetectionProccessor"

interface FaceCaptureScreenProps extends AppStackScreenProps<"FaceCapture"> {}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const GUIDE_BOX_WIDTH = SCREEN_WIDTH * 0.75
const GUIDE_BOX_HEIGHT = SCREEN_HEIGHT * 0.5
const AUTO_COOLDOWN_MS = 4000
const FACE_SCORE_THRESHOLD = 0.75

export const FaceCaptureScreen: FC<FaceCaptureScreenProps> = () => {
  const { themed } = useAppTheme()
  const { faceCapture } = useStores()

  // Refs
  const modelRef = useRef<InferenceSession | null>(null)
  const cameraRef = useRef<Camera>(null)
  const lastAutoCaptureRef = useRef(0)
  const isProcessingRef = useRef(false)
  const isUploadingRef = useRef(false)

  // States
  const [hasPermission, setHasPermission] = useState(false)
  const [isFront, setIsFront] = useState(true)
  const [status, setStatus] = useState("Ready")
  const [matchName, setMatchName] = useState<string | null>(null)
  const [similarity, setSimilarity] = useState<number | null>(null)

  const device = useCameraDevice(isFront ? "front" : "back")
  const format = useMemo(
    () => device?.formats.find((f) => f.maxFps >= 25 && f.videoWidth >= 1280) ?? device?.formats[0],
    [device],
  )

  // ============== Setup ==============
  useEffect(() => {
    Camera.requestCameraPermission().then((result) => {
      setHasPermission(result === "granted")
      if (result !== "granted") {
        Alert.alert("Camera Permission", "Camera permission is required")
      }
    })
  }, [])

  useEffect(() => {
    if (!hasPermission) return

    const loadModel = async () => {
      try {
        const [modelAsset, dataAsset] = await Asset.loadAsync([
          require("@assets/models/blazeface.onnx"),
          require("@assets/models/blazeface.onnx.data"),
        ])

        const modelUri = modelAsset.localUri ?? modelAsset.uri
        const dataSrcUri = dataAsset.localUri ?? dataAsset.uri

        if (!modelUri || !dataSrcUri) throw new Error("Failed to load model URIs")

        const dir = modelUri.substring(0, modelUri.lastIndexOf("/"))
        const dataDst = `${dir}/blazeface.onnx.data`

        const dstInfo = await FileSystem.getInfoAsync(dataDst)
        if (!dstInfo.exists) {
          await FileSystem.copyAsync({ from: dataSrcUri, to: dataDst })
        }

        modelRef.current = await InferenceSession.create(modelUri)
        console.log("Model loaded:", modelRef.current?.inputNames, modelRef.current?.outputNames)
      } catch (e) {
        console.error("Failed to load model:", e)
      }
    }

    loadModel()
  }, [hasPermission])

  // ============== Upload Logic ==============
  const uploadPhoto = useCallback(
    async (photoPath: string) => {
      const uri = `file://${photoPath}`
      isUploadingRef.current = true
      setStatus("Uploading...")

      try {
        const result = await faceCapture.uploadFaceDetected(uri)

        if (result) {
          setStatus("Upload successful!")
          console.log("Upload result:", result)

          // Sử dụng các field từ API: match & similarity
          setMatchName(result.match ?? "Guest")
          setSimilarity(typeof result.similarity === "number" ? result.similarity : null)

          // Auto clear sau 2 giây
          setTimeout(() => {
            setMatchName(null)
            setSimilarity(null)
          }, 2000)

          await FileSystem.deleteAsync(uri, { idempotent: true })
        } else {
          setStatus("Upload failed")
          setMatchName(null)
          setSimilarity(null)
        }

        setTimeout(() => setStatus("Ready"), 2000)
        return result
      } catch (error) {
        console.error("Upload error:", error)
        setStatus("Upload error")
        setMatchName(null)
        setSimilarity(null)
        setTimeout(() => setStatus("Ready"), 2000)
        return null
      } finally {
        setTimeout(() => {
          isUploadingRef.current = false
        }, 2000)
      }
    },
    [faceCapture],
  )

  // ============== Capture Logic ==============
  const capturePhoto = useCallback(
    async (isAuto = false) => {
      if (!cameraRef.current || isUploadingRef.current) return

      // Cooldown check for auto capture
      if (isAuto) {
        const now = Date.now()
        if (now - lastAutoCaptureRef.current < AUTO_COOLDOWN_MS) return
        lastAutoCaptureRef.current = now
      }

      try {
        setStatus("Capturing...")
        const photo = await cameraRef.current.takePhoto({})
        await uploadPhoto(photo.path)
      } catch (error) {
        console.warn("Capture error:", error)
        setStatus("Capture failed")
        setTimeout(() => setStatus("Ready"), 2000)
      }
    },
    [uploadPhoto],
  )

  // ============== Face Detection ==============
  const handleFrameProcessed = useCallback(
    async (result: ProcessedFrame) => {
      if (isProcessingRef.current || !modelRef.current || isUploadingRef.current) return

      try {
        isProcessingRef.current = true

        const detection = await detectFaceScores(modelRef.current, result.imageData, result.shape)
        const hasHighConfidenceFace = detection.allScores.some(
          (score) => score >= FACE_SCORE_THRESHOLD,
        )

        if (hasHighConfidenceFace) {
          console.log("High confidence face detected")
          await capturePhoto(true)
        }
      } catch (error) {
        console.error("Inference error:", error)
      } finally {
        isProcessingRef.current = false
      }
    },
    [capturePhoto],
  )

  const { frameProcessor } = useFaceDetectionProcessor({
    width: 256,
    height: 256,
    onFrameProcessed: handleFrameProcessed,
    throttleMs: 1000,
  })

  // ============== UI Handlers ==============
  const handleManualCapture = useCallback(() => capturePhoto(false), [capturePhoto])

  const toggleCamera = useCallback(() => {
    if (isUploadingRef.current) return
    setIsFront((prev) => !prev)
  }, [])

  // ✅ Helper để xác định icon và màu dựa trên match name
  const isGuest = matchName === "Guest"
  const tagIcon = isGuest ? "help-circle" : "person-circle"
  // const tagColor = isGuest ? colors.palette.neutral400 : colors.palette.accent500

  // ============== Render ==============
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

  const isDisabled = status !== "Ready"

  return (
    <View style={themed($container)}>
      <Camera
        style={$camera}
        ref={cameraRef}
        device={device}
        isActive
        photo
        format={format}
        frameProcessor={frameProcessor}
        fps={25}
      />

      {/* Face Guide Overlay */}
      <View style={$overlay}>
        <View style={$overlaySection} />

        <View style={$middleRow}>
          <View style={$overlaySection} />

          <View style={$guideBox}>
            <View style={[$corner, $topLeft]} />
            <View style={[$corner, $topRight]} />
            <View style={[$corner, $bottomLeft]} />
            <View style={[$corner, $bottomRight]} />

            <Ionicons
              name="person-outline"
              size={80}
              color={colors.palette.neutral100}
              style={$guideIcon}
            />
            <Text style={$guideText} text="Position your face within the frame" size="xs" />
          </View>

          <View style={$overlaySection} />
        </View>

        <View style={$overlaySection} />
      </View>

      {/* ✅ Match Tag - Hiển thị tên hoặc Guest */}
      {matchName && (
        <View style={[themed($matchTag), isGuest && $guestTag]}>
          <Ionicons name={tagIcon} size={24} color={colors.palette.accent500} />
          <Text
            style={[$matchName, isGuest && $guestText]}
            text={
              similarity != null ? `${matchName} (${(similarity * 100).toFixed(1)}%)` : matchName
            }
            weight="bold"
            size="md"
          />
        </View>
      )}

      {/* Controls */}
      <View style={themed($controls)}>
        <Text style={themed($statusText)} text={status} size="xs" />

        <View style={$actionsRow}>
          <TouchableOpacity
            onPress={handleManualCapture}
            style={[themed($captureButton), isDisabled && $disabledOpacity]}
            disabled={isDisabled}
          >
            <Ionicons
              name={isDisabled ? "hourglass" : "camera"}
              size={26}
              color={colors.palette.neutral900}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleCamera}
            style={[themed($iconButton), isDisabled && $disabledOpacity]}
            disabled={isDisabled}
          >
            <Ionicons name="camera-reverse" size={22} color={colors.palette.neutral100} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

// ============== Styles ==============
const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral900,
  justifyContent: "center",
  alignItems: "center",
})

const $camera: ViewStyle = StyleSheet.absoluteFillObject

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

const $matchTag: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  position: "absolute",
  top: spacing.xl,
  alignSelf: "center",
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  backgroundColor: colors.palette.neutral800,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderRadius: 16,
  borderWidth: 2,
  borderColor: colors.palette.accent500,
})

// ✅ Style cho Guest tag
const $guestTag: ViewStyle = {
  borderColor: colors.palette.neutral600,
  opacity: 0.9,
}

const $matchName: TextStyle = {
  color: colors.palette.neutral100,
}

// ✅ Style cho Guest text
const $guestText: TextStyle = {
  color: colors.palette.neutral400,
  fontStyle: "italic",
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
