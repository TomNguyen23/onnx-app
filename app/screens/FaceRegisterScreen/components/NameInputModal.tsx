import { FC, useState } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"

import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { colors } from "@/theme/colors"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"

interface NameInputModalProps {
  visible: boolean
  isLoading?: boolean
  onClose: () => void
  onSubmit: (name: string) => void
}

export const NameInputModal: FC<NameInputModalProps> = ({
  visible,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const { themed } = useAppTheme()
  const [name, setName] = useState("")

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim())
      setName("")
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setName("")
      onClose()
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={$overlay}>
        <View style={themed($content)}>
          <Text text="Register Face" preset="heading" style={$title} />
          <Text text="Enter your name to complete registration" size="sm" style={$subtitle} />

          <TextField
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            editable={!isLoading}
            autoFocus
            maxLength={50}
            containerStyle={$inputContainer}
            inputWrapperStyle={themed($inputWrapper)}
            style={themed($inputText)}
          />

          <View style={$actions}>
            <TouchableOpacity onPress={handleClose} style={themed($button)} disabled={isLoading}>
              <Text text="Cancel" style={$buttonText} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[themed($button), $primaryButton]}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.palette.neutral100} />
              ) : (
                <Text text="Submit" style={$buttonText} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const $overlay: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  justifyContent: "center",
  alignItems: "center",
}

const $content: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral800,
  borderRadius: 20,
  padding: spacing.lg,
  width: "85%",
  maxWidth: 400,
})

const $title: TextStyle = {
  color: colors.palette.neutral100,
  marginBottom: 8,
  textAlign: "center",
}

const $subtitle: TextStyle = {
  color: colors.palette.neutral400,
  marginBottom: 24,
  textAlign: "center",
}

const $inputContainer: ViewStyle = {
  marginBottom: 0,
}

const $inputWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral900,
  borderColor: colors.palette.neutral700,
  borderRadius: 12,
  minHeight: 48,
})

const $inputText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontSize: 16,
})

const $actions: ViewStyle = {
  flexDirection: "row",
  gap: 12,
  marginTop: 20,
}

const $button: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flex: 1,
  paddingVertical: spacing.sm,
  borderRadius: 12,
  alignItems: "center",
  backgroundColor: colors.palette.neutral700,
  minHeight: 44,
  justifyContent: "center",
})

const $primaryButton: ViewStyle = {
  backgroundColor: colors.palette.accent500,
}

const $buttonText: TextStyle = {
  color: colors.palette.neutral100,
  fontWeight: "600",
  fontSize: 16,
}
