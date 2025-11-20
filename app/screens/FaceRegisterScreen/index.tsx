import { FC, useState, useCallback, useRef, useEffect, useMemo } from "react"
import { View, ViewStyle, Dimensions, StyleSheet, Alert } from "react-native"
import { Camera, useCameraDevice } from "react-native-vision-camera"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useStores } from "@/models/RootContext"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { CaptureControls } from "@/screens/FaceRegisterScreen/components/CaptureControls"
import { FaceGuideBox } from "@/screens/FaceRegisterScreen/components/FaceGuideBox"
import { NameInputModal } from "@/screens/FaceRegisterScreen/components/NameInputModal"
import { ProgressBar } from "@/screens/FaceRegisterScreen/components/ProgressBar"
import { colors } from "@/theme/colors"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"

interface FaceRegisterScreenProps extends AppStackScreenProps<"FaceRegister"> {}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const GUIDE_BOX_SIZE = { width: SCREEN_WIDTH * 0.7, height: SCREEN_HEIGHT * 0.5 }

type FaceDirection = "front" | "up" | "down" | "left" | "right"

const FACE_DIRECTIONS = [
  {
    key: "front",
    title: "Front",
    icon: "person-outline",
    instruction: "Look straight at camera",
    color: colors.palette.accent500,
  },
  {
    key: "up",
    title: "Look Up",
    icon: "arrow-up-outline",
    instruction: "Tilt your head up",
    color: colors.palette.primary500,
  },
  {
    key: "down",
    title: "Look Down",
    icon: "arrow-down-outline",
    instruction: "Tilt your head down",
    color: colors.palette.secondary500,
  },
  {
    key: "left",
    title: "Turn Left",
    icon: "arrow-back-outline",
    instruction: "Turn your face left",
    color: colors.palette.angry500,
  },
  {
    key: "right",
    title: "Turn Right",
    icon: "arrow-forward-outline",
    instruction: "Turn your face right",
    color: "#10B981",
  },
] as const

export const FaceRegisterScreen: FC<FaceRegisterScreenProps> = ({ navigation }) => {
  const { themed } = useAppTheme()
  const { faceCapture } = useStores()
  const cameraRef = useRef<Camera>(null)

  const [hasPermission, setHasPermission] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [capturedPhotos, setCapturedPhotos] = useState<Record<FaceDirection, string | null>>({
    front: null,
    up: null,
    down: null,
    left: null,
    right: null,
  })
  const [isCapturing, setIsCapturing] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const device = useCameraDevice("front")
  const format = useMemo(
    () => device?.formats.find((f) => f.maxFps >= 30 && f.videoWidth >= 1280) ?? device?.formats[0],
    [device],
  )

  const currentDirection = FACE_DIRECTIONS[currentStep]
  const capturedCount = Object.values(capturedPhotos).filter(Boolean).length
  const isCompleted = capturedCount === FACE_DIRECTIONS.length
  const completedSteps = FACE_DIRECTIONS.map((dir) => !!capturedPhotos[dir.key])

  // ============== Effects ==============
  useEffect(() => {
    Camera.requestCameraPermission().then((result) => {
      setHasPermission(result === "granted")
      if (result !== "granted") {
        Alert.alert("Permission Required", "Camera permission is required")
      }
    })
  }, [])

  // ============== Handlers ==============
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return

    try {
      setIsCapturing(true)
      const photo = await cameraRef.current.takePhoto({})

      // ✅ Ensure URI has file:// prefix
      const normalizedUri = photo.path.startsWith("file://") ? photo.path : `file://${photo.path}`

      setCapturedPhotos((prev) => ({ ...prev, [currentDirection.key]: normalizedUri }))
      console.log(`Captured ${currentDirection.title}:`, normalizedUri)

      setTimeout(() => {
        if (currentStep < FACE_DIRECTIONS.length - 1) setCurrentStep((prev) => prev + 1)
        setIsCapturing(false)
      }, 500)
    } catch (error) {
      console.error("Capture error:", error)
      Alert.alert("Error", "Failed to capture photo")
      setIsCapturing(false)
    }
  }, [isCapturing, currentDirection, currentStep])

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1)
  }, [currentStep])

  const handleRetake = useCallback(() => {
    setCapturedPhotos((prev) => ({ ...prev, [currentDirection.key]: null }))
  }, [currentDirection])

  const handleComplete = useCallback(() => {
    if (!isCompleted) {
      Alert.alert("Incomplete", `Please capture all ${FACE_DIRECTIONS.length} photos`)
      return
    }
    setShowNameModal(true)
  }, [isCompleted])

  const handleSubmit = useCallback(
    async (personName: string) => {
      setIsUploading(true)

      try {
        const photoUris = Object.values(capturedPhotos).filter((uri): uri is string => uri !== null)

        // ✅ Log để debug
        console.log("[FaceRegisterScreen] Submitting registration:", {
          personName,
          photoCount: photoUris.length,
          photoUris,
        })

        const success = await faceCapture.uploadFaceRegistration(photoUris, personName)

        if (success) {
          setShowNameModal(false)
          Alert.alert("Success", `Registration completed for ${personName}`, [
            { text: "OK", onPress: () => navigation.navigate("Home") },
          ])
        } else {
          Alert.alert("Error", faceCapture.error || "Failed to register")
        }
      } catch (error) {
        console.error("Registration error:", error)
        Alert.alert("Error", "An error occurred during registration")
      } finally {
        setIsUploading(false)
      }
    },
    [capturedPhotos, faceCapture, navigation],
  )

  // ============== Render ==============
  if (!device || !hasPermission) {
    return (
      <Screen style={themed($container)} preset="scroll">
        <Text
          preset="subheading"
          text={!device ? "Loading camera..." : "Waiting for camera permission..."}
        />
      </Screen>
    )
  }

  const statusText = isCapturing
    ? "Capturing..."
    : `${capturedCount}/${FACE_DIRECTIONS.length} photos captured`

  return (
    <View style={themed($container)}>
      <Camera style={$camera} ref={cameraRef} device={device} isActive photo format={format} />

      <ProgressBar
        currentStep={currentStep}
        totalSteps={FACE_DIRECTIONS.length}
        completedSteps={completedSteps}
      />

      <View style={$overlay}>
        <View style={$overlaySection} />
        <View style={$middleRow}>
          <View style={$overlaySection} />
          <FaceGuideBox
            width={GUIDE_BOX_SIZE.width}
            height={GUIDE_BOX_SIZE.height}
            icon={currentDirection.icon}
            title={currentDirection.title}
            instruction={currentDirection.instruction}
            color={currentDirection.color}
          />
          <View style={$overlaySection} />
        </View>
        <View style={$overlaySection} />
      </View>

      <CaptureControls
        statusText={statusText}
        canGoBack={currentStep > 0 && !isCapturing}
        canRetake={!!capturedPhotos[currentDirection.key]}
        canComplete={isCompleted}
        isCapturing={isCapturing}
        captureButtonColor={currentDirection.color}
        onPrevious={handlePrevious}
        onRetake={handleRetake}
        onCapture={handleCapture}
        onComplete={handleComplete}
      />

      <NameInputModal
        visible={showNameModal}
        isLoading={isUploading}
        onClose={() => setShowNameModal(false)}
        onSubmit={handleSubmit}
      />
    </View>
  )
}

// ============== Styles ==============
const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral900,
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
  height: GUIDE_BOX_SIZE.height,
}
