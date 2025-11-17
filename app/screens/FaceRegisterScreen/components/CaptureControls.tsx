import { FC } from "react"
import { View, ViewStyle, TextStyle, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { Text } from "@/components/Text"
import { colors } from "@/theme/colors"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"

interface CaptureControlsProps {
  statusText: string
  canGoBack: boolean
  canRetake: boolean
  canComplete: boolean
  isCapturing: boolean
  captureButtonColor: string
  onPrevious: () => void
  onRetake: () => void
  onCapture: () => void
  onComplete: () => void
}

export const CaptureControls: FC<CaptureControlsProps> = ({
  statusText,
  canGoBack,
  canRetake,
  canComplete,
  isCapturing,
  captureButtonColor,
  onPrevious,
  onRetake,
  onCapture,
  onComplete,
}) => {
  const { themed } = useAppTheme()

  return (
    <View style={themed($container)}>
      <Text style={themed($statusText)} text={statusText} size="xs" />

      <View style={$actionsRow}>
        {/* Previous Button */}
        <TouchableOpacity
          onPress={onPrevious}
          style={[themed($iconButton), !canGoBack && $disabled]}
          disabled={!canGoBack}
        >
          <Ionicons name="arrow-back" size={22} color={colors.palette.neutral100} />
        </TouchableOpacity>

        {/* Retake Button */}
        {canRetake && (
          <TouchableOpacity
            onPress={onRetake}
            style={[themed($iconButton), isCapturing && $disabled]}
            disabled={isCapturing}
          >
            <Ionicons name="refresh" size={22} color={colors.palette.neutral100} />
          </TouchableOpacity>
        )}

        {/* Capture Button */}
        <TouchableOpacity
          onPress={onCapture}
          style={[
            themed($captureButton),
            { backgroundColor: captureButtonColor },
            isCapturing && $disabled,
          ]}
          disabled={isCapturing}
        >
          <Ionicons
            name={isCapturing ? "hourglass" : "camera"}
            size={28}
            color={colors.palette.neutral100}
          />
        </TouchableOpacity>

        {/* Complete Button */}
        {canComplete && (
          <TouchableOpacity
            onPress={onComplete}
            style={[themed($completeButton), isCapturing && $disabled]}
            disabled={isCapturing}
          >
            <Ionicons name="checkmark" size={22} color={colors.palette.neutral100} />
            <Text text="Complete" size="xs" style={$completeText} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  bottom: spacing.xl,
  left: spacing.md,
  right: spacing.md,
  alignItems: "center",
})

const $statusText: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  color: colors.palette.neutral100,
  marginBottom: spacing.sm,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  borderRadius: 12,
})

const $actionsRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
}

const $iconButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: colors.palette.neutral800,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: colors.palette.neutral700,
})

const $captureButton: ThemedStyle<ViewStyle> = () => ({
  width: 70,
  height: 70,
  borderRadius: 35,
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
})

const $completeButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: 24,
  backgroundColor: colors.palette.accent500,
  gap: 6,
})

const $completeText: TextStyle = {
  color: colors.palette.neutral100,
  fontWeight: "600",
}

const $disabled: ViewStyle = {
  opacity: 0.5,
}
