import { FC } from "react"
import { TouchableOpacity, ViewStyle, ActivityIndicator, TextStyle } from "react-native"

import { Text } from "@/components/Text"
import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"

interface SendButtonProps {
  loading: boolean
  disabled: boolean
  onPress: () => void
}

export const SendButton: FC<SendButtonProps> = ({ loading, disabled, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[$sendButton, disabled && $sendButtonDisabled]}
    activeOpacity={0.7}
  >
    {loading ? (
      <ActivityIndicator size="small" color={colors.palette.neutral100} />
    ) : (
      <Text style={$sendButtonText}>↑</Text>
    )}
  </TouchableOpacity>
)

const $sendButton: ViewStyle = {
  width: 44,
  height: 44,
  borderRadius: 22,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: colors.tint,
  marginRight: spacing.xs,
  marginTop: spacing.xs,
}

const $sendButtonDisabled: ViewStyle = {
  backgroundColor: colors.palette.neutral400,
}

const $sendButtonText: TextStyle = {
  color: colors.palette.neutral100,
  fontSize: 20,
  fontWeight: "bold",
}
