import { FC, useState, useMemo } from "react"
import { View, ViewStyle, TextStyle, SectionList, ImageStyle } from "react-native"
import { FontAwesome5 } from "@expo/vector-icons"

import { AutoImage } from "@/components/AutoImage"
import { Header } from "@/components/Header"
import { Screen } from "@/components/Screen"
import { TagRadio } from "@/components/TagRadio"
import { Text } from "@/components/Text"
import { AppStackScreenProps } from "@/navigators/AppNavigator"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"
import { formatDate } from "@/utils/formatDate"

interface CheckinHistoryScreenProps extends AppStackScreenProps<"CheckinHistory"> {}

interface CheckinRecord {
  id: number
  time: string
  employeeName: string
  checkIn: boolean
  employeeAvt?: string
}

interface GroupedData {
  title: string
  data: CheckinRecord[]
}

const groupByDate = (records: CheckinRecord[]): GroupedData[] => {
  const grouped = records.reduce(
    (acc, record) => {
      const date = record.time
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(record)
      return acc
    },
    {} as Record<string, CheckinRecord[]>,
  )

  return Object.keys(grouped)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map((date) => ({
      title: date,
      data: grouped[date],
    }))
}

const checkinData: CheckinRecord[] = [
  {
    id: 1,
    time: "2024-11-16",
    employeeName: "Goreway",
    checkIn: true,
    employeeAvt:
      "https://user-images.githubusercontent.com/1775841/184508739-f90d0ce5-7219-42fd-a91f-3382d016eae0.png",
  },
  {
    id: 2,
    time: "2025-01-28",
    employeeName: "Fisbey",
    checkIn: true,
    employeeAvt:
      "https://user-images.githubusercontent.com/1775841/184508739-f90d0ce5-7219-42fd-a91f-3382d016eae0.png",
  },
  {
    id: 3,
    time: "2025-01-28",
    employeeName: "Thickins",
    checkIn: false,
    employeeAvt:
      "https://user-images.githubusercontent.com/1775841/184508739-f90d0ce5-7219-42fd-a91f-3382d016eae0.png",
  },
  {
    id: 4,
    time: "2025-04-21",
    employeeName: "Cottell",
    checkIn: true,
    employeeAvt:
      "https://user-images.githubusercontent.com/1775841/184508739-f90d0ce5-7219-42fd-a91f-3382d016eae0.png",
  },
  {
    id: 5,
    time: "2025-04-21",
    employeeName: "Thornthwaite",
    checkIn: true,
    employeeAvt:
      "https://user-images.githubusercontent.com/1775841/184508739-f90d0ce5-7219-42fd-a91f-3382d016eae0.png",
  },
  {
    id: 6,
    time: "2025-04-25",
    employeeName: "Tadgell",
    checkIn: false,
    employeeAvt:
      "https://user-images.githubusercontent.com/1775841/184508739-f90d0ce5-7219-42fd-a91f-3382d016eae0.png",
  },
  {
    id: 7,
    time: "2025-07-08",
    employeeName: "Walesby",
    checkIn: false,
    employeeAvt:
      "https://user-images.githubusercontent.com/1775841/184508739-f90d0ce5-7219-42fd-a91f-3382d016eae0.png",
  },
  {
    id: 8,
    time: "2025-04-25",
    employeeName: "Hemphrey",
    checkIn: true,
    employeeAvt:
      "https://user-images.githubusercontent.com/1775841/184508739-f90d0ce5-7219-42fd-a91f-3382d016eae0.png",
  },
]

export const CheckinHistoryScreen: FC<CheckinHistoryScreenProps> = ({ navigation }) => {
  const { themed } = useAppTheme()
  const [dateOption, setDateOption] = useState<string>("")

  const groupedData = useMemo(() => groupByDate(checkinData), [])

  return (
    <Screen style={$root} preset="fixed">
      <View>
        <Header
          titleTx="historyHeader:title"
          leftIcon="caretLeft"
          RightActionComponent={
            <FontAwesome5 name="calendar-alt" size={20} style={$headerRightIcon} />
          }
          onLeftPress={() => navigation.goBack()}
        />

        <TagRadio
          options={[
            { label: "Today", value: "today" },
            { label: "This Week", value: "this_week" },
            { label: "This Month", value: "this_month" },
            { label: "This Year", value: "this_year" },
            { label: "All Time", value: "all_time" },
          ]}
          value={dateOption}
          onValueChange={setDateOption}
          size="small"
          containerStyle={$tagRadioContainer}
          tagStyle={themed($tag)}
          selectedTagStyle={themed($selectedTag)}
          scrollable
        />
      </View>

      <SectionList
        sections={groupedData}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={({ section: { title } }) => (
          <View style={themed($sectionHeader)}>
            <Text
              style={themed($sectionHeaderText)}
              text={formatDate(title, "E, dd/MM/yyyy")}
              weight="bold"
            />
          </View>
        )}
        renderItem={({ item }) => (
          <View style={themed($recordItem)}>
            <AutoImage source={{ uri: item.employeeAvt }} style={$employeeAvt} />
            <View style={$recordInfo}>
              <Text style={themed($employeeName)}>{item.employeeName}</Text>
              <Text style={themed($checkInTime)}>{item.time}</Text>
            </View>
            <View
              style={[
                $checkInStatus,
                item.checkIn ? themed($checkInStatusSuccess) : themed($checkInStatusError),
              ]}
            >
              <Text style={$statusText}>{item.checkIn ? "Check In" : "Check Out"}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={$listContent}
        stickySectionHeadersEnabled={true}
      />
    </Screen>
  )
}

const $root: ViewStyle = {
  flex: 1,
}

const $headerRightIcon: ViewStyle = {
  marginRight: 20,
}

const $listContent: ViewStyle = {
  paddingHorizontal: 10,
  paddingBottom: 20,
}

const $sectionHeader: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral200,
  paddingVertical: 8,
  marginBottom: 8,
  borderRadius: 6,
})

const $sectionHeaderText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.palette.neutral600,
})

const $recordItem: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: colors.palette.neutral100,
  padding: 12,
  marginBottom: 8,
  borderRadius: 8,
})

const $recordInfo: ViewStyle = {
  flex: 1,
}

const $employeeName: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "500",
  color: colors.text,
  marginBottom: 4,
})

const $employeeAvt: ImageStyle = {
  width: 40,
  height: "100%",
  borderRadius: 7,
  marginRight: 12,
}

const $checkInTime: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 10,
  color: colors.palette.neutral600,
})

const $statusText: TextStyle = {
  fontSize: 12,
  color: "white",
  fontWeight: "600",
}

const $checkInStatus: ViewStyle = {
  paddingHorizontal: 5,
  paddingVertical: 1,
  borderRadius: 4,
}

const $checkInStatusSuccess: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.grantedSoft,
})

const $checkInStatusError: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.accent300,
})

const $tagRadioContainer: ViewStyle = {
  gap: 4,
  marginBottom: 25,
}

const $tag: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderRadius: 8,
  backgroundColor: colors.palette.secondary100,
  borderWidth: 0,
})

const $selectedTag: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.baseSoft,
})
