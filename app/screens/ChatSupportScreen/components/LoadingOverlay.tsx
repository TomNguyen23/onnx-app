import { FC } from "react"
import { View, ViewStyle, ActivityIndicator, TextStyle } from "react-native"

import { Text } from "@/components/Text"
import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"

interface LoadingOverlayProps {
  title?: string
  subtitle?: string
}

export const LoadingOverlay: FC<LoadingOverlayProps> = ({
  title = "Initializing Model...",
  subtitle = "This may take a moment",
}) => (
  <View style={$loadingOverlay}>
    <View style={$loadingCard}>
      <ActivityIndicator size="large" color={colors.tint} />
      <Text preset="subheading" style={$loadingOverlayText}>
        {title}
      </Text>
      <Text preset="formHelper" style={$loadingOverlaySubText}>
        {subtitle}
      </Text>
    </View>
  </View>
)

const $loadingOverlay: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
}

const $loadingCard: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
  borderRadius: spacing.lg,
  padding: spacing.xl,
  alignItems: "center",
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
  minWidth: 200,
}

const $loadingOverlayText: TextStyle = {
  marginTop: spacing.md,
  textAlign: "center",
}

const $loadingOverlaySubText: TextStyle = {
  marginTop: spacing.xs,
  textAlign: "center",
  color: colors.textDim,
}
