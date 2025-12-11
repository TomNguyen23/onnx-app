import { FC } from "react"
import { View, ViewStyle, Image, ImageStyle } from "react-native"

import { Text } from "@/components/Text"
import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"

interface Message {
  id: string
  text: string
  isBot: boolean
  imageUri?: string
}

interface MessageBubbleProps {
  item: Message
}

export const MessageBubble: FC<MessageBubbleProps> = ({ item }) => (
  <View style={[$messageBubble, item.isBot ? $messageBubbleBot : $messageBubbleUser]}>
    {item.imageUri && (
      <Image source={{ uri: item.imageUri }} style={$messageImage} resizeMode="cover" />
    )}
    <Text style={item.isBot ? $messageTextBot : $messageTextUser}>{item.text}</Text>
  </View>
)

const $messageBubble: ViewStyle = {
  padding: spacing.sm,
  borderRadius: spacing.md,
  marginVertical: spacing.xxs,
  maxWidth: "80%",
}

const $messageBubbleBot: ViewStyle = {
  alignSelf: "flex-start",
  backgroundColor: colors.palette.neutral200,
}

const $messageBubbleUser: ViewStyle = {
  alignSelf: "flex-end",
  backgroundColor: colors.palette.base,
}

const $messageTextBot = {
  fontSize: 15,
  lineHeight: 22,
  color: colors.text,
}

const $messageTextUser = {
  fontSize: 15,
  lineHeight: 22,
  color: colors.palette.neutral100,
}

const $messageImage: ImageStyle = {
  width: 200,
  height: 150,
  borderRadius: spacing.sm,
  marginBottom: spacing.xs,
}
