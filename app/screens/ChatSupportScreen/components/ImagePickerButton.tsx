import { FC } from "react"
import { TouchableOpacity, ViewStyle, Alert } from "react-native"
import * as ImagePicker from "expo-image-picker"
import Ionicons from "@expo/vector-icons/Ionicons"

import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"

interface ImagePickerButtonProps {
  onImageSelected: (uri: string) => void
  disabled: boolean
}

export const ImagePickerButton: FC<ImagePickerButtonProps> = ({ onImageSelected, disabled }) => {
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permissionResult.granted) {
        Alert.alert("Permission required", "Please allow access to your photo library")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        quality: 1,
      })

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image")
    }
  }

  return (
    <TouchableOpacity
      onPress={pickImage}
      disabled={disabled}
      style={[$imageButton, disabled && $imageButtonDisabled]}
      activeOpacity={0.7}
    >
      <Ionicons name="attach" size={24} color="black" />
    </TouchableOpacity>
  )
}

const $imageButton: ViewStyle = {
  width: 44,
  height: 44,
  borderRadius: 22,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: colors.palette.neutral300,
  marginRight: spacing.xs,
}

const $imageButtonDisabled: ViewStyle = {
  backgroundColor: colors.palette.neutral400,
  opacity: 0.5,
}
