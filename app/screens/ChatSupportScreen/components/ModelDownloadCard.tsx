import { FC, useState, useEffect, useCallback } from "react"
import { View, ViewStyle, TextStyle, Alert, ActivityIndicator } from "react-native"
import { observer } from "mobx-react-lite"

import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
import { DownloadProgress, ModelDownloader } from "@/services/modelDownloader"
import { colors } from "@/theme/colors"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import { ThemedStyle } from "@/theme/types"

/**
 * Model file configuration
 */
export interface ModelFile {
  repo: string
  filename: string
  size?: string
  label?: string
}

/**
 * Base props for model download cards
 */
export interface BaseModelDownloadCardProps {
  title: string
  size: string
  files: ModelFile[]
  onInitialize?: (...paths: string[]) => void
  onDownloaded?: (...paths: string[]) => void
  onDelete?: () => void
  downloadButtonText?: string
  initializeButtonText?: string
  isLocalFile?: boolean
  style?: ViewStyle
}

/**
 * Single model download card props
 */
export interface ModelDownloadCardProps {
  title: string
  repo: string
  filename: string
  size: string
  onDownloaded?: (path: string) => void
  onInitialize?: (path: string) => void
  initializeButtonText?: string
  isLocalFile?: boolean
  style?: ViewStyle
}

/**
 * Multi-modal model props
 */
export interface MtmdModelDownloadCardProps {
  title: string
  repo: string
  filename: string
  mmproj: string
  size: string
  onInitialize: (modelPath: string, mmprojPath: string) => void
  onDownloaded?: (modelPath: string, mmprojPath: string) => void
  onDelete?: () => void
  initializeButtonText?: string
  isLocalFile?: boolean
  style?: ViewStyle
}

/**
 * Format bytes to human readable size
 */
const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

/**
 * BaseModelDownloadCard component
 *
 * A reusable card component for downloading and managing AI models
 */
export const BaseModelDownloadCard: FC<BaseModelDownloadCardProps> = observer(
  function BaseModelDownloadCard(props) {
    const {
      title,
      size,
      files,
      onInitialize,
      onDownloaded,
      onDelete,
      downloadButtonText = "Download",
      initializeButtonText = "Initialize",
      isLocalFile = false,
      style: $styleOverride,
    } = props

    const { themed } = useAppTheme()

    // State
    const [isDownloaded, setIsDownloaded] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [progress, setProgress] = useState<DownloadProgress | null>(null)
    const [filePaths, setFilePaths] = useState<string[]>([])
    const [downloadStatus, setDownloadStatus] = useState<string>("")
    const [useRowLayout, setUseRowLayout] = useState(true)

    const downloader = new ModelDownloader()

    /**
     * Check if all files are downloaded
     */
    const checkIfDownloaded = useCallback(async () => {
      try {
        const downloadStatuses = await Promise.all(
          files.map((file) => ModelDownloader.isModelDownloaded(file.filename)),
        )

        const allDownloaded = downloadStatuses.every((status) => status)
        setIsDownloaded(allDownloaded)

        if (allDownloaded) {
          const pathPromises = files.map((file) => ModelDownloader.getModelPath(file.filename))
          const paths = await Promise.all(pathPromises)
          const validPaths = paths.filter((path): path is string => path !== null)

          if (validPaths.length === files.length) {
            setFilePaths(validPaths)
          }
        }
      } catch (error) {
        console.error("Error checking model status:", error)
      }
    }, [files])

    useEffect(() => {
      if (isLocalFile) {
        setIsDownloaded(true)
        setFilePaths([])
      } else {
        checkIfDownloaded()
      }
    }, [checkIfDownloaded, isLocalFile])

    /**
     * Handle model download
     */
    const handleDownload = async () => {
      if (isDownloading) return

      try {
        setIsDownloading(true)
        setProgress({ written: 0, total: 0, percentage: 0 })

        const paths: string[] = []
        const progressWeight = 1 / files.length

        for (let i = 0; i < files.length; i += 1) {
          const file = files[i]
          if (file) {
            const statusText = file.label || `file ${i + 1}`
            setDownloadStatus(`Downloading ${statusText}`)

            const path = await downloader.downloadModel(file.repo, file.filename, (prog) => {
              const baseProgress = i * progressWeight * 100
              const currentProgress = prog.percentage * progressWeight
              setProgress({
                ...prog,
                percentage: Math.round(baseProgress + currentProgress),
              })
            })

            paths.push(path)
          }
        }

        setFilePaths(paths)
        setIsDownloaded(true)
        setProgress(null)
        setDownloadStatus("")

        onDownloaded?.(...paths)

        Alert.alert("Success", `${title} downloaded successfully!`)
      } catch (error: any) {
        Alert.alert("Download Failed", error.message || "Failed to download model(s)")
        setProgress(null)
        setDownloadStatus("")
      } finally {
        setIsDownloading(false)
      }
    }

    /**
     * Handle model initialization
     */
    const handleInitialize = async () => {
      if (isLocalFile) {
        if (onInitialize) {
          onInitialize("")
        } else {
          Alert.alert("Error", "No initialization handler provided.")
        }
      } else {
        if (!isDownloaded || filePaths.length !== files.length) {
          Alert.alert("Error", "Model(s) not downloaded yet.")
          return
        }

        if (onInitialize) {
          onInitialize(...filePaths)
        } else {
          Alert.alert("Error", "No initialization handler provided.")
        }
      }
    }

    /**
     * Handle model deletion
     */
    const handleDelete = async () => {
      const modelText = files.length > 1 ? "Models" : "Model"

      Alert.alert(`Delete ${modelText}`, `Are you sure you want to delete ${title}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all(files.map((file) => ModelDownloader.deleteModel(file.filename)))
              setIsDownloaded(false)
              setFilePaths([])
              onDelete?.()
            } catch (error: any) {
              Alert.alert(
                "Error",
                `Failed to delete ${modelText.toLowerCase()}: ${error.message || ""}`,
              )
            }
          },
        },
      ])
    }

    /**
     * Handle layout changes for responsive design
     */
    const handleLayout = (event: any) => {
      const { width } = event.nativeEvent.layout
      const shouldUseRow = width > 300
      if (shouldUseRow !== useRowLayout) {
        setUseRowLayout(shouldUseRow)
      }
    }

    const repoDisplay = files.length === 1 && files[0] ? files[0].repo : `${files.length} files`

    // Styles
    const $card: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
      backgroundColor: colors.background,
      borderRadius: spacing.lg,
      padding: spacing.lg,
      marginVertical: spacing.xs,
      shadowColor: colors.palette.neutral900,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: colors.border,
      ...$styleOverride,
    })

    const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
      marginBottom: spacing.sm,
      flexDirection: "column",
      gap: spacing.xs,
    })

    const $titleContainer: ViewStyle = {
      width: "100%",
    }

    const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.xxs,
      letterSpacing: -0.3,
    })

    const $sizeBadge: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
      backgroundColor: colors.palette.neutral200,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: spacing.xs,
      alignSelf: "flex-start",
    })

    const $size: ThemedStyle<TextStyle> = ({ colors }) => ({
      fontSize: 13,
      color: colors.textDim,
      fontWeight: "600",
    })

    const $repoContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
      padding: spacing.sm,
      backgroundColor: colors.palette.neutral100,
      borderRadius: spacing.sm,
    })

    const $repoIcon: ThemedStyle<TextStyle> = ({ spacing }) => ({
      fontSize: 14,
      marginRight: spacing.xs,
    })

    const $repoText: ThemedStyle<TextStyle> = ({ colors }) => ({
      fontSize: 13,
      color: colors.textDim,
      flex: 1,
      fontFamily: "monospace",
    })

    const $progressContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
      marginBottom: spacing.lg,
    })

    const $progressHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xs,
    })

    const $progressStatus: ThemedStyle<TextStyle> = ({ colors }) => ({
      fontSize: 13,
      color: colors.text,
      fontWeight: "600",
    })

    const $progressPercentage: ThemedStyle<TextStyle> = ({ colors }) => ({
      fontSize: 13,
      color: colors.palette.base,
      fontWeight: "700",
    })

    const $progressBar: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
      height: 8,
      backgroundColor: colors.palette.neutral200,
      borderRadius: spacing.xs,
      overflow: "hidden",
      marginBottom: spacing.xs,
    })

    const $progressFill: ThemedStyle<ViewStyle> = ({ colors }) => ({
      height: "100%",
      backgroundColor: colors.palette.base,
      borderRadius: spacing.xs,
    })

    const $progressSize: ThemedStyle<TextStyle> = ({ colors }) => ({
      fontSize: 12,
      color: colors.textDim,
      textAlign: "center",
    })

    const $buttonContainer: ViewStyle = {
      marginTop: spacing.xs,
    }

    const $downloadButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
      flex: 1,
      paddingVertical: spacing.sm,
    })

    const $downloadingContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.md,
      backgroundColor: colors.palette.neutral100,
      borderRadius: spacing.md,
      borderWidth: 1,
      borderColor: colors.palette.base,
    })

    const $downloadingText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
      marginLeft: spacing.sm,
      fontSize: 15,
      color: colors.palette.base,
      fontWeight: "600",
    })

    const $downloadedContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
      gap: spacing.sm,
    })

    const $downloadedBanner: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.sm,
      backgroundColor: colors.palette.granted + "15",
      borderRadius: spacing.sm,
      borderWidth: 1,
      borderColor: colors.palette.granted + "30",
      marginBottom: spacing.sm,
    })

    const $checkmark: ThemedStyle<TextStyle> = ({ spacing }) => ({
      fontSize: 18,
      marginRight: spacing.xs,
    })

    const $downloadedText: ThemedStyle<TextStyle> = ({ colors }) => ({
      fontSize: 15,
      color: colors.palette.granted,
      fontWeight: "600",
    })

    const $actionButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
      flexDirection: "row",
      gap: spacing.sm,
    })

    const $deleteButton: ViewStyle = {
      flex: 1,
    }

    const $initializeButton: ViewStyle = {
      flex: 2,
    }

    // Render
    return (
      <View style={themed($card)} onLayout={handleLayout}>
        <View style={themed($header)}>
          <View style={$titleContainer}>
            <Text text={title} style={themed($title)} />
          </View>
          <View style={themed($sizeBadge)}>
            <Text text={size} style={themed($size)} />
          </View>
        </View>

        <View style={themed($repoContainer)}>
          <Text text="📦" style={themed($repoIcon)} />
          <Text text={repoDisplay} style={themed($repoText)} numberOfLines={1} />
        </View>

        {progress && (
          <View style={themed($progressContainer)}>
            <View style={themed($progressHeader)}>
              <Text text={downloadStatus} style={themed($progressStatus)} />
              <Text text={`${progress.percentage}%`} style={themed($progressPercentage)} />
            </View>
            <View style={themed($progressBar)}>
              <View style={[themed($progressFill), { width: `${progress.percentage}%` }]} />
            </View>
            {progress.total > 0 && (
              <Text
                text={`${formatSize(progress.written)} / ${formatSize(progress.total)}`}
                style={themed($progressSize)}
              />
            )}
          </View>
        )}

        <View style={$buttonContainer}>
          {!isDownloaded && !isDownloading && (
            <Button
              text={downloadButtonText}
              onPress={handleDownload}
              preset="filled"
              style={themed($downloadButton)}
            />
          )}

          {isDownloading && (
            <View style={themed($downloadingContainer)}>
              <ActivityIndicator size="small" color={colors.palette.base} />
              <Text text="Downloading..." style={themed($downloadingText)} />
            </View>
          )}

          {isDownloaded && !isDownloading && (
            <View style={themed($downloadedContainer)}>
              <View style={themed($downloadedBanner)}>
                <Text text="✓" style={themed($checkmark)} />
                <Text text="Model Downloaded" style={themed($downloadedText)} />
              </View>
              <View style={themed($actionButtons)}>
                <Button
                  text="Delete"
                  onPress={handleDelete}
                  preset="default"
                  style={$deleteButton}
                />
                <Button
                  text={initializeButtonText}
                  onPress={handleInitialize}
                  preset="filled"
                  style={$initializeButton}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    )
  },
)

// Simple single-model download card
function ModelDownloadCard({
  title,
  repo,
  filename,
  size,
  onDownloaded: _onDownloaded,
  onInitialize,
  initializeButtonText,
  isLocalFile = false,
}: ModelDownloadCardProps) {
  const files: ModelFile[] = [{ repo, filename }]

  return (
    <BaseModelDownloadCard
      title={title}
      size={size}
      files={files}
      onInitialize={onInitialize}
      downloadButtonText="Download"
      initializeButtonText={initializeButtonText}
      isLocalFile={isLocalFile}
    />
  )
}

// Multimodal-specific download card that handles both model and mmproj files
export function MtmdModelDownloadCard({
  title,
  repo,
  filename,
  mmproj,
  size,
  onInitialize,
  onDownloaded,
  onDelete,
  initializeButtonText,
  isLocalFile = false,
}: MtmdModelDownloadCardProps) {
  const files: ModelFile[] = [
    { repo, filename, label: "Model" },
    { repo, filename: mmproj, label: "mmproj" },
  ]

  return (
    <BaseModelDownloadCard
      title={title}
      size={size}
      files={files}
      onInitialize={onInitialize}
      onDownloaded={onDownloaded}
      onDelete={onDelete}
      downloadButtonText="Download Model & MMProj"
      initializeButtonText={initializeButtonText}
      isLocalFile={isLocalFile}
    />
  )
}

export default ModelDownloadCard
