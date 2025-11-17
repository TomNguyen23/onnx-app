import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { Text } from "@/components/Text"
import { colors } from "@/theme/colors"

interface FaceGuideBoxProps {
  width: number
  height: number
  icon: keyof typeof Ionicons.glyphMap
  title: string
  instruction: string
  color: string
}

export const FaceGuideBox: FC<FaceGuideBoxProps> = ({
  width,
  height,
  icon,
  title,
  instruction,
  color,
}) => {
  return (
    <View style={[$container, { width, height, borderColor: color }]}>
      {/* Corner Indicators */}
      {CORNER_POSITIONS.map((corner) => (
        <View key={corner.key} style={[$corner, corner.style, { borderColor: color }]} />
      ))}

      {/* Icon & Text */}
      <Ionicons name={icon} size={80} color={color} style={$icon} />
      <Text style={$title} text={title} weight="bold" size="lg" />
      <Text style={$instruction} text={instruction} size="sm" />
    </View>
  )
}

const CORNER_POSITIONS = [
  {
    key: "topLeft",
    style: {
      top: -2,
      left: -2,
      borderBottomWidth: 0,
      borderRightWidth: 0,
      borderTopLeftRadius: 20,
    },
  },
  {
    key: "topRight",
    style: {
      top: -2,
      right: -2,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      borderTopRightRadius: 20,
    },
  },
  {
    key: "bottomLeft",
    style: {
      bottom: -2,
      left: -2,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomLeftRadius: 20,
    },
  },
  {
    key: "bottomRight",
    style: {
      bottom: -2,
      right: -2,
      borderTopWidth: 0,
      borderLeftWidth: 0,
      borderBottomRightRadius: 20,
    },
  },
]

const $container: ViewStyle = {
  borderWidth: 2,
  borderRadius: 20,
  justifyContent: "center",
  alignItems: "center",
}

const $corner: ViewStyle = {
  position: "absolute",
  width: 30,
  height: 30,
  borderWidth: 4,
}

const $icon: ViewStyle = {
  marginBottom: 12,
}

const $title: TextStyle = {
  color: colors.palette.neutral100,
  textAlign: "center",
  marginBottom: 8,
}

const $instruction: TextStyle = {
  color: colors.palette.neutral100,
  textAlign: "center",
  opacity: 0.9,
}
