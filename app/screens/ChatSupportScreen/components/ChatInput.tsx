import { FC, useState, useEffect } from "react"
import { View, ViewStyle, TouchableOpacity, Image, ImageStyle, TextStyle } from "react-native"

import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"

import { ImagePickerButton } from "./ImagePickerButton"
import { SendButton } from "./SendButton"

interface ChatInputProps {
  input: string
  loading: boolean
  ready: boolean
  selectedImage: string | null
  maxLength?: number
  onChangeText: (text: string) => void
  onSend: () => void
  onImageSelected: (uri: string) => void
  onRemoveImage: () => void
}

const MAX_PREVIEW_WIDTH = 150
const MAX_PREVIEW_HEIGHT = 150

export const ChatInput: FC<ChatInputProps> = ({
  input,
  loading,
  ready,
  selectedImage,
  maxLength = 300,
  onChangeText,
  onSend,
  onImageSelected,
  onRemoveImage,
}) => {
  const isDisabled = !input.trim() || loading || !ready
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    if (selectedImage) {
      Image.getSize(
        selectedImage,
        (width, height) => {
          // Tính toán kích thước preview giữ nguyên tỷ lệ
          const aspectRatio = width / height
          let previewWidth = MAX_PREVIEW_WIDTH
          let previewHeight = MAX_PREVIEW_HEIGHT

          if (aspectRatio > 1) {
            // Ảnh ngang
            previewHeight = MAX_PREVIEW_WIDTH / aspectRatio
          } else {
            // Ảnh dọc hoặc vuông
            previewWidth = MAX_PREVIEW_HEIGHT * aspectRatio
          }

          setImageSize({ width: previewWidth, height: previewHeight })
        },
        (error) => {
          console.error("Error getting image size:", error)
          setImageSize({ width: MAX_PREVIEW_WIDTH, height: MAX_PREVIEW_HEIGHT })
        },
      )
    } else {
      setImageSize(null)
    }
  }, [selectedImage])

  return (
    <>
      {selectedImage && imageSize && (
        <View style={$selectedImageContainer}>
          <Image
            source={{ uri: selectedImage }}
            style={[$selectedImage, { width: imageSize.width, height: imageSize.height }]}
            resizeMode="contain"
          />
          <TouchableOpacity style={$removeImageButton} onPress={onRemoveImage}>
            <Text style={$removeImageButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={$inputContainer}>
        <ImagePickerButton onImageSelected={onImageSelected} disabled={loading || !ready} />

        <TextField
          value={input}
          onChangeText={onChangeText}
          placeholder="Type a message..."
          containerStyle={$textFieldContainer}
          inputWrapperStyle={$textFieldInputWrapper}
          style={$textFieldInput}
          editable={!loading && ready}
          multiline
          maxLength={maxLength}
          RightAccessory={() => (
            <SendButton loading={loading} disabled={isDisabled} onPress={onSend} />
          )}
        />
      </View>

      {loading && (
        <Text preset="formHelper" style={$generatingText}>
          Generating...
        </Text>
      )}
    </>
  )
}

const $inputContainer: ViewStyle = {
  marginTop: spacing.md,
  marginBottom: spacing.xs,
  flexDirection: "row",
  alignItems: "center",
}

const $textFieldContainer: ViewStyle = {
  marginBottom: 0,
  flex: 1,
}

const $textFieldInputWrapper: ViewStyle = {
  borderRadius: spacing.lg,
  paddingRight: 0,
  minHeight: 44,
  maxHeight: 120,
}

const $textFieldInput: TextStyle = {
  fontSize: 15,
  lineHeight: 22,
  minHeight: 44,
  maxHeight: 120,
}

const $selectedImageContainer: ViewStyle = {
  position: "relative",
  marginBottom: spacing.sm,
  alignSelf: "flex-start",
}

const $selectedImage: ImageStyle = {
  borderRadius: spacing.sm,
  borderWidth: 2,
  borderColor: colors.palette.neutral300,
}

const $removeImageButton: ViewStyle = {
  position: "absolute",
  top: -8,
  right: -8,
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: colors.palette.angry500,
  justifyContent: "center",
  alignItems: "center",
}

const $removeImageButtonText: TextStyle = {
  color: colors.palette.neutral100,
  fontSize: 14,
  fontWeight: "bold",
}

const $generatingText: TextStyle = {
  textAlign: "center",
  marginTop: spacing.xs,
}
