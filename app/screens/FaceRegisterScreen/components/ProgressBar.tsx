import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"

import { Text } from "@/components/Text"
import { colors } from "@/theme/colors"

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  completedSteps: boolean[]
}

export const ProgressBar: FC<ProgressBarProps> = ({ currentStep, totalSteps, completedSteps }) => {
  return (
    <View style={$container}>
      <View style={$bar}>
        {completedSteps.map((isCompleted, index) => (
          <View
            key={index}
            style={[$dot, isCompleted && $dotCompleted, index === currentStep && $dotActive]}
          />
        ))}
      </View>
      <Text style={$text} text={`Step ${currentStep + 1}/${totalSteps}`} />
    </View>
  )
}

const $container: ViewStyle = {
  position: "absolute",
  top: 60,
  alignSelf: "center",
  alignItems: "center",
  zIndex: 10,
}

const $bar: ViewStyle = {
  flexDirection: "row",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
  marginBottom: 8,
}

const $dot: ViewStyle = {
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: colors.palette.neutral600,
  marginHorizontal: 4,
}

const $dotActive: ViewStyle = {
  width: 16,
  height: 16,
  borderRadius: 8,
}

const $dotCompleted: ViewStyle = {
  backgroundColor: colors.palette.accent500,
}

const $text: TextStyle = {
  color: colors.palette.neutral100,
  fontSize: 14,
  fontWeight: "600",
}
