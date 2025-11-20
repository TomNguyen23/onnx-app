import { FC } from "react"
import { View, ViewStyle, TouchableOpacity, TextStyle } from "react-native"
import { Ionicons, MaterialIcons, FontAwesome5, FontAwesome6 } from "@expo/vector-icons"

import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"
// import { useNavigation } from "@react-navigation/native"

interface HomeScreenProps extends AppStackScreenProps<"Home"> {}

export const HomeScreen: FC<HomeScreenProps> = ({ navigation }) => {
  // Pull in navigation via hook
  // const navigation = useNavigation()
  const { themed } = useAppTheme()

  return (
    <Screen style={$root} preset="scroll">
      <Header titleTx="homeHeader:welcome" />

      <View style={themed($checkInWrapper)}>
        <TouchableOpacity
          style={themed($checkInButton)}
          onPress={() => navigation.navigate("FaceCapture")}
        >
          <Ionicons name="scan-sharp" size={60} color="white" />
          <Text
            tx="homeContent:checkInButton"
            size="lg"
            weight="bold"
            style={themed($checkInButtonText)}
          />
        </TouchableOpacity>

        <Text tx="homeContent:checkInContent" size="xs" />
      </View>
      <Text tx="homeContent:menuTitle" size="md" weight="medium" />

      <View style={themed($menuWrapper)}>
        <TouchableOpacity
          style={themed($menuItem)}
          onPress={() => navigation.navigate("CheckinHistory")}
        >
          <MaterialIcons name="history" size={23} style={themed($menuIcon)} />
          <Text tx="homeContent:checkInHistory" size="xs" weight="semiBold" />
          <Text tx="homeContent:checkInHistoryDetails" size="xxs" weight="light" />
        </TouchableOpacity>

        <TouchableOpacity style={themed($menuItem)}>
          <FontAwesome5 name="calendar-alt" size={23} style={themed($menuIcon)} />
          <Text tx="homeContent:myWorkSchedule" size="xs" weight="semiBold" />
          <Text tx="homeContent:myWorkScheduleDetails" size="xxs" weight="light" />
        </TouchableOpacity>

        <TouchableOpacity
          style={themed($menuItem)}
          onPress={() => navigation.navigate("FaceRegister")}
        >
          <FontAwesome6 name="face-smile" size={23} style={themed($menuIcon)} />
          <Text tx="homeContent:registerFace" size="xs" weight="semiBold" />
          <Text tx="homeContent:registerFaceDetails" size="xxs" weight="light" />
        </TouchableOpacity>

        <TouchableOpacity style={themed($menuItem)}>
          <FontAwesome5 name="question-circle" size={23} style={themed($menuIcon)} />
          <Text tx="homeContent:questionsAndSupport" size="xs" weight="semiBold" />
          <Text tx="homeContent:questionsAndSupportDetails" size="xxs" weight="light" />
        </TouchableOpacity>
      </View>
    </Screen>
  )
}

const $root: ViewStyle = {
  flex: 1,
  paddingHorizontal: 16,
}

const $checkInWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  justifyContent: "center",
  alignItems: "center",
  marginTop: spacing.md,
  marginBottom: spacing.lg,
})

const $checkInButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.base,
  width: 140,
  height: 140,
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 999,
  marginBottom: spacing.sm,
})

const $checkInButtonText: TextStyle = {
  color: "white",
  marginTop: 2,
}

const $menuWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.md,
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: spacing.sm,
})

const $menuItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.sm,
  borderColor: colors.palette.neutral300,
  borderWidth: 0.2,
  borderRadius: 8,
  backgroundColor: colors.palette.neutral100,
  width: "48%",
  minHeight: 120,
})

const $menuIcon: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginBottom: spacing.sm,
  color: colors.palette.base,
})
