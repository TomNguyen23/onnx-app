import { FC, useEffect, useRef } from "react"
import { View, ViewStyle, Animated, Easing } from "react-native"

import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"

interface TypingIndicatorProps {
  isVisible: boolean
}

export const TypingIndicator: FC<TypingIndicatorProps> = ({ isVisible }) => {
  const dot1 = useRef(new Animated.Value(0)).current
  const dot2 = useRef(new Animated.Value(0)).current
  const dot3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!isVisible) return

    const createAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      )
    }

    const animation1 = createAnimation(dot1, 0)
    const animation2 = createAnimation(dot2, 150)
    const animation3 = createAnimation(dot3, 300)

    animation1.start()
    animation2.start()
    animation3.start()

    return () => {
      animation1.stop()
      animation2.stop()
      animation3.stop()
      dot1.setValue(0)
      dot2.setValue(0)
      dot3.setValue(0)
    }
  }, [isVisible, dot1, dot2, dot3])

  if (!isVisible) return null

  const createDotStyle = (dot: Animated.Value) => ({
    transform: [
      {
        translateY: dot.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -6],
        }),
      },
      {
        scale: dot.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        }),
      },
    ],
    opacity: dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    }),
  })

  return (
    <View style={$container}>
      <View style={$bubble}>
        <View style={$dotsContainer}>
          <Animated.View style={[$dot, createDotStyle(dot1)]} />
          <Animated.View style={[$dot, createDotStyle(dot2)]} />
          <Animated.View style={[$dot, createDotStyle(dot3)]} />
        </View>
      </View>
    </View>
  )
}

const $container: ViewStyle = {
  alignItems: "flex-start",
  marginVertical: spacing.xs,
}

const $bubble: ViewStyle = {
  backgroundColor: colors.palette.neutral200,
  borderRadius: spacing.md,
  borderBottomLeftRadius: spacing.xxs,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  maxWidth: "80%",
}

const $dotsContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  height: 20,
  gap: 6,
}

const $dot: ViewStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.tint,
}
