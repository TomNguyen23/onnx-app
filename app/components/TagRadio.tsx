import {
  Pressable,
  PressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
  View,
  ScrollView,
} from "react-native"

import { Text } from "@/components/Text"
import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"

export interface TagRadioOption {
  label: string
  value: string
}

export interface TagRadioProps extends Omit<PressableProps, "onPress"> {
  /**
   * List of options to display
   */
  options: TagRadioOption[]
  /**
   * Currently selected value
   */
  value?: string
  /**
   * Callback when an option is selected
   */
  onValueChange?: (value: string) => void
  /**
   * Override container style
   */
  containerStyle?: StyleProp<ViewStyle>
  /**
   * Override style for each tag
   */
  tagStyle?: StyleProp<ViewStyle>
  /**
   * Override style for selected tag
   */
  selectedTagStyle?: StyleProp<ViewStyle>
  /**
   * Override text style
   */
  textStyle?: StyleProp<TextStyle>
  /**
   * Override text style for selected tag
   */
  selectedTextStyle?: StyleProp<TextStyle>
  /**
   * Size of the tags
   */
  size?: "small" | "medium" | "large"
  /**
   * Disable the component
   */
  disabled?: boolean
  /**
   * Enable horizontal scrolling instead of wrapping
   */
  scrollable?: boolean
  /**
   * Show scroll indicators when scrollable is true
   */
  showScrollIndicator?: boolean
}

export function TagRadio(props: TagRadioProps) {
  const {
    options,
    value,
    onValueChange,
    containerStyle: $containerStyleOverride,
    tagStyle: $tagStyleOverride,
    selectedTagStyle: $selectedTagStyleOverride,
    textStyle: $textStyleOverride,
    selectedTextStyle: $selectedTextStyleOverride,
    size = "medium",
    disabled = false,
    scrollable = false,
    showScrollIndicator = false,
    ...rest
  } = props

  const handlePress = (optionValue: string) => {
    if (!disabled && onValueChange) {
      onValueChange(optionValue)
    }
  }

  const $sizeStyles = SIZE_STYLES[size]

  const renderTags = () => (
    <>
      {options.map((option) => {
        const isSelected = value === option.value
        const $tagStyles = [
          $tagBase,
          $sizeStyles.tag,
          $tagStyleOverride,
          isSelected && $tagSelected,
          isSelected && $selectedTagStyleOverride,
          disabled && $tagDisabled,
        ]
        const $textStyles = [
          $textBase,
          $sizeStyles.text,
          $textStyleOverride,
          isSelected && $textSelected,
          isSelected && $selectedTextStyleOverride,
          disabled && $textDisabled,
        ]

        return (
          <Pressable
            key={option.value}
            style={({ pressed }) => [$tagStyles, pressed && !disabled && $tagPressed]}
            onPress={() => handlePress(option.value)}
            disabled={disabled}
            {...rest}
          >
            <Text style={$textStyles} text={option.label} />
          </Pressable>
        )
      })}
    </>
  )

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={showScrollIndicator}
        contentContainerStyle={[$scrollContentContainer, $containerStyleOverride]}
        style={$scrollContainer}
      >
        {renderTags()}
      </ScrollView>
    )
  }

  return <View style={[$containerBase, $containerStyleOverride]}>{renderTags()}</View>
}

const $containerBase: ViewStyle = {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
}

const $scrollContainer: ViewStyle = {
  flexGrow: 0,
}

const $scrollContentContainer: ViewStyle = {
  flexDirection: "row",
  gap: spacing.xs,
  paddingHorizontal: spacing.xs,
}

const $tagBase: ViewStyle = {
  borderRadius: 20,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.background,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
}

const $tagSelected: ViewStyle = {
  backgroundColor: colors.palette.primary500,
  borderColor: colors.palette.primary500,
}

const $tagPressed: ViewStyle = {
  opacity: 0.7,
}

const $tagDisabled: ViewStyle = {
  opacity: 0.5,
}

const $textBase: TextStyle = {
  color: colors.text,
}

const $textSelected: TextStyle = {
  color: colors.palette.neutral100,
  fontWeight: "600",
}

const $textDisabled: TextStyle = {
  opacity: 0.5,
}

const SIZE_STYLES: Record<"small" | "medium" | "large", { tag: ViewStyle; text: TextStyle }> = {
  small: {
    tag: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
    },
    text: {
      fontSize: 12,
    },
  },
  medium: {
    tag: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    text: {
      fontSize: 14,
    },
  },
  large: {
    tag: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    text: {
      fontSize: 16,
    },
  },
}
