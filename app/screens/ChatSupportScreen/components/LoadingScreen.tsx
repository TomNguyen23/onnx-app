import { FC } from "react"
import { ViewStyle, ActivityIndicator, TextStyle } from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"

interface LoadingScreenProps {
  initStatus: string
  loadingText?: string
}

export const LoadingScreen: FC<LoadingScreenProps> = ({
  initStatus,
  loadingText = "First time load takes 30-60 seconds",
}) => (
  <Screen preset="fixed" contentContainerStyle={$loadingContainer}>
    <ActivityIndicator size="large" color={colors.tint} />
    <Text preset="subheading" style={$loadingText}>
      {initStatus}
    </Text>
    <Text preset="formHelper" style={$loadingSubText}>
      {loadingText}
    </Text>
  </Screen>
)

const $loadingContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
}

const $loadingText: TextStyle = {
  marginTop: spacing.md,
}

const $loadingSubText: TextStyle = {
  marginTop: spacing.xs,
  textAlign: "center",
}
