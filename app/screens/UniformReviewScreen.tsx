import { FC, useState, useEffect, useRef } from "react"
import {
  ViewStyle,
  View,
  Image,
  ImageStyle,
  TextStyle,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { initLlama } from "llama.rn"

import { MtmdModelDownloadCard } from "@/components/ModelDownloadCard"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { ModelDownloader } from "@/services/modelDownloader"
import { MODELS } from "@/utils/modelConstants"
import { PROMPT_ARRAY } from "@/utils/promptsConstant"

interface UniformReviewScreenProps extends AppStackScreenProps<"UniformReview"> {}

interface ImageReview {
  id: string
  imageUri: string
  prompt: string
  score: number
  status: "pass" | "fail" | "warning"
  issues: string[]
  response?: string
}

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

const FAKE_DATA: ImageReview[] = []

// Pre-defined prompts array

export const UniformReviewScreen: FC<UniformReviewScreenProps> = () => {
  const [reviews, setReviews] = useState<ImageReview[]>(FAKE_DATA)
  const [isProcessing, setIsProcessing] = useState(false)
  const [modelInitialized, setModelInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [showModelDownload, setShowModelDownload] = useState(false)
  const [isModelDownloaded, setIsModelDownloaded] = useState(false)
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0)
  const [totalImages, setTotalImages] = useState(0)

  const contextRef = useRef<any>(null)
  const chatHistoryRef = useRef<ChatMessage[]>([
    {
      role: "system",
      content: "You are an assistant that evaluates employee attire based on an image.",
    },
  ])

  // Auto-initialize model when screen is accessed
  useEffect(() => {
    let isMounted = true

    const checkAndInitializeModel = async () => {
      setModelInitialized(false)
      setIsInitializing(false)
      setShowModelDownload(false)

      if (contextRef.current) {
        try {
          await contextRef.current.release()
          contextRef.current = null
        } catch (error) {
          console.error("Error releasing previous context:", error)
        }
      }

      try {
        const modelDownloaded = await ModelDownloader.isModelDownloaded(MODELS.LFM_2_VL_3B.filename)
        const mmprojDownloaded = await ModelDownloader.isModelDownloaded(MODELS.LFM_2_VL_3B.mmproj!)

        if (!isMounted) return

        if (modelDownloaded && mmprojDownloaded) {
          setIsModelDownloaded(true)

          const modelPath = await ModelDownloader.getModelPath(MODELS.LFM_2_VL_3B.filename)
          const mmprojPath = await ModelDownloader.getModelPath(MODELS.LFM_2_VL_3B.mmproj!)

          if (!isMounted) return

          if (modelPath && mmprojPath) {
            await handleInitializeModel(modelPath, mmprojPath)
          }
        } else {
          if (isMounted) {
            setShowModelDownload(true)
          }
        }
      } catch (error) {
        console.error("Error checking model status:", error)
        if (isMounted) {
          setShowModelDownload(true)
        }
      }
    }

    checkAndInitializeModel()

    return () => {
      isMounted = false
      if (contextRef.current) {
        contextRef.current.release().catch((error: any) => {
          console.error("Error releasing context on unmount:", error)
        })
        contextRef.current = null
      }
    }
  }, [])

  const getStatusColor = (status: ImageReview["status"]) => {
    switch (status) {
      case "pass":
        return "#4CAF50"
      case "warning":
        return "#FF9800"
      case "fail":
        return "#F44336"
      default:
        return "#999"
    }
  }

  const getStatusText = (status: ImageReview["status"]) => {
    switch (status) {
      case "pass":
        return "Pass"
      case "warning":
        return "Warning"
      case "fail":
        return "Fail"
      default:
        return "Not evaluated"
    }
  }

  const handleInitializeModel = async (modelPath: string, mmprojPath: string) => {
    try {
      setIsInitializing(true)
      console.log("Initializing model:", modelPath)
      const fullModelPath = `file://${modelPath}`

      const context = await initLlama({
        model: fullModelPath,
        use_mlock: true,
        n_ctx: 2048,
        n_gpu_layers: 99,
        ctx_shift: false,
      })

      const multimodalInitialized = await context.initMultimodal({
        path: mmprojPath,
        use_gpu: true,
      })

      if (!multimodalInitialized) {
        throw new Error("Failed to initialize multimodal support")
      }

      console.log("Llama context initialized:", context)

      contextRef.current = context
      setModelInitialized(true)
      setShowModelDownload(false)

      chatHistoryRef.current = [
        {
          role: "system",
          content: "You are an assistant that evaluates employee attire based on an image.",
        },
      ]
    } catch (error) {
      console.error("Error initializing model:", error)
      Alert.alert("Error", "Failed to initialize model. Please try again.")
    } finally {
      setIsInitializing(false)
    }
  }

  const evaluateImage = async (
    imageUri: string,
    imageId: string,
    prompt: string,
  ): Promise<ImageReview> => {
    try {
      if (!contextRef.current) {
        throw new Error("Model not initialized")
      }

      console.log(`Evaluating image ${imageId} with prompt...`)

      const userMessage: ChatMessage = {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: imageUri,
            },
          },
          {
            type: "text",
            text: prompt,
          },
        ],
      }

      let fullResponse = ""

      await contextRef.current.completion(
        {
          messages: [
            {
              role: "system",
              content: "You are an assistant that evaluates employee attire based on an image.",
            },
            userMessage,
          ],
          n_predict: 400,
          stop: ["<|im_end|>", "<|endoftext|>"],
          temperature: 0.1,
          top_p: 0.9,
        },
        (data: any) => {
          const { token } = data
          fullResponse += token
        },
      )

      console.log(`Full response for ${imageId}:`, fullResponse)

      // Parse response
      let result: { score: number; status: string; issues: string[] }

      try {
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        } else {
          const scoreMatch = fullResponse.match(/score["\s:]+(\d+)/i)
          const score = scoreMatch ? parseInt(scoreMatch[1]) : 70

          result = {
            score,
            status: score > 80 ? "pass" : score >= 60 ? "warning" : "fail",
            issues: fullResponse.includes("issue")
              ? fullResponse
                  .split("\n")
                  .filter((line) => line.includes("-") || line.includes("•"))
                  .map((line) => line.replace(/^[-•]\s*/, "").trim())
              : [],
          }
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError)
        result = {
          score: 75,
          status: "warning",
          issues: ["Unable to parse detailed evaluation"],
        }
      }

      return {
        id: imageId,
        imageUri,
        prompt,
        score: result.score,
        status: result.status as "pass" | "warning" | "fail",
        issues: result.issues || [],
        response: fullResponse,
      }
    } catch (error) {
      console.error(`Error evaluating image ${imageId}:`, error)
      return {
        id: imageId,
        imageUri,
        prompt,
        score: 0,
        status: "fail",
        issues: ["Error during evaluation: " + (error as Error).message],
        response: "",
      }
    }
  }

  const pickImages = async () => {
    if (!modelInitialized) {
      Alert.alert(
        "Model Not Ready",
        "Please wait for the model to initialize or download it first.",
      )
      return
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "You need to grant camera roll permissions to upload images.",
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
      })

      if (!result.canceled && result.assets) {
        setIsProcessing(true)
        setTotalImages(result.assets.length)
        setCurrentProcessingIndex(0)

        // Process images sequentially with prompts from PROMPT_ARRAY
        for (let i = 0; i < result.assets.length; i++) {
          const asset = result.assets[i]
          const imageId = `${Date.now()}-${i}`

          // Get prompt from array, cycle if more images than prompts
          const prompt = PROMPT_ARRAY[i % PROMPT_ARRAY.length]

          setCurrentProcessingIndex(i + 1)
          console.log(
            `Processing image ${i + 1}/${result.assets.length} with prompt #${(i % PROMPT_ARRAY.length) + 1}`,
          )

          // Add temporary review with loading state
          const tempReview: ImageReview = {
            id: imageId,
            imageUri: asset.uri,
            prompt,
            score: 0,
            status: "warning",
            issues: ["Evaluating..."],
          }

          setReviews((prev) => [tempReview, ...prev])

          // Evaluate image with AI model using predefined prompt
          const evaluation = await evaluateImage(asset.uri, imageId, prompt)

          // Update the review with actual results
          setReviews((prev) => prev.map((r) => (r.id === imageId ? evaluation : r)))

          console.log(`Image ${i + 1}/${result.assets.length} completed:`, evaluation)
        }

        setIsProcessing(false)
        setCurrentProcessingIndex(0)
        setTotalImages(0)
        Alert.alert("Success", `Evaluated ${result.assets.length} image(s) successfully!`)
      }
    } catch (error) {
      console.error("Error picking images:", error)
      Alert.alert("Error", "Failed to pick or evaluate images")
      setIsProcessing(false)
      setCurrentProcessingIndex(0)
      setTotalImages(0)
    }
  }

  const renderItem = ({ item }: { item: ImageReview }) => (
    <View style={$itemContainer}>
      <Image source={{ uri: item.imageUri }} style={$image} />

      <View style={$infoContainer}>
        <View style={$headerRow}>
          <Text style={$itemTitle}>Image #{item.id.slice(-4)}</Text>
          <View style={[$statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={$statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={$scoreContainer}>
          <Text style={$scoreLabel}>Score:</Text>
          <Text style={[$scoreValue, { color: getStatusColor(item.status) }]}>
            {item.score}/100
          </Text>
        </View>

        {item.prompt && (
          <View style={$promptContainer}>
            <Text style={$promptLabel}>Prompt Used:</Text>
            <Text style={$promptText} numberOfLines={3}>
              {item.prompt}
            </Text>
          </View>
        )}

        {item.issues.length > 0 && item.issues[0] !== "Evaluating..." && (
          <View style={$issuesContainer}>
            <Text style={$issuesTitle}>Issues detected:</Text>
            {item.issues.map((issue, index) => (
              <Text key={index} style={$issueItem}>
                • {issue}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  )

  const renderEmptyState = () => (
    <View style={$emptyState}>
      <Text style={$emptyText}>No images uploaded yet</Text>
      <Text style={$emptySubtext}>
        {modelInitialized
          ? "Tap the button below to upload images"
          : "Waiting for model to initialize..."}
      </Text>
      <Text style={$promptInfoText}>Using {PROMPT_ARRAY.length} pre-defined prompts</Text>
    </View>
  )

  return (
    <Screen style={$root} preset="fixed" safeAreaEdges={["top"]}>
      {/* Loading Overlay */}
      {isInitializing && (
        <View style={$loadingOverlay}>
          <View style={$loadingCard}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={$loadingText}>Initializing Model...</Text>
          </View>
        </View>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={$loadingOverlay}>
          <View style={$loadingCard}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={$loadingText}>Evaluating Images...</Text>
            <Text style={$loadingSubtext}>
              Processing {currentProcessingIndex} of {totalImages}
            </Text>
            <Text style={$promptInfoText}>
              Using prompt #{((currentProcessingIndex - 1) % PROMPT_ARRAY.length) + 1}
            </Text>
          </View>
        </View>
      )}

      {/* Model Download Card */}
      {showModelDownload && (
        <View style={$modelDownloadOverlay}>
          <View style={$modelDownloadCard}>
            <MtmdModelDownloadCard
              title={MODELS.LFM_2_VL_3B.name}
              repo={MODELS.LFM_2_VL_3B.repo}
              filename={MODELS.LFM_2_VL_3B.filename}
              mmproj={MODELS.LFM_2_VL_3B.mmproj!}
              size={MODELS.LFM_2_VL_3B.size}
              onInitialize={handleInitializeModel}
              initializeButtonText="Initialize Model"
            />
          </View>
        </View>
      )}

      <View style={$header}>
        <View>
          <Text style={$title}>Uniform Review</Text>
          <Text style={$subtitle}>Total: {reviews.length} images</Text>
        </View>
        <View
          style={[$modelStatusBadge, modelInitialized ? $modelStatusReady : $modelStatusLoading]}
        >
          <Text style={$modelStatusText}>{modelInitialized ? "Ready" : "Loading"}</Text>
        </View>
      </View>

      <FlatList
        data={reviews}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={$listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      <View style={$uploadButtonContainer}>
        <TouchableOpacity
          style={[$uploadButton, (isProcessing || !modelInitialized) && $uploadButtonDisabled]}
          onPress={pickImages}
          disabled={isProcessing || !modelInitialized}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={$uploadButtonText}>
              {modelInitialized ? "📷 Upload Images" : "⏳ Initializing Model..."}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Screen>
  )
}

const $root: ViewStyle = {
  flex: 1,
  backgroundColor: "#f5f5f5",
}

const $header: ViewStyle = {
  padding: 16,
  backgroundColor: "#fff",
  borderBottomWidth: 1,
  borderBottomColor: "#e0e0e0",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
}

const $title: TextStyle = {
  fontSize: 24,
  fontWeight: "bold",
  marginBottom: 4,
}

const $subtitle: TextStyle = {
  fontSize: 14,
  color: "#666",
}

const $listContent: ViewStyle = {
  padding: 16,
  gap: 16,
  paddingBottom: 100,
}

const $itemContainer: ViewStyle = {
  backgroundColor: "#fff",
  borderRadius: 12,
  overflow: "hidden",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}

const $image: ImageStyle = {
  width: "100%",
  height: 200,
  backgroundColor: "#e0e0e0",
}

const $infoContainer: ViewStyle = {
  padding: 16,
}

const $headerRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
}

const $itemTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
}

const $statusBadge: ViewStyle = {
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderRadius: 12,
}

const $statusText: TextStyle = {
  color: "#fff",
  fontSize: 12,
  fontWeight: "600",
}

const $scoreContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 12,
}

const $scoreLabel: TextStyle = {
  fontSize: 14,
  color: "#666",
  marginRight: 8,
}

const $scoreValue: TextStyle = {
  fontSize: 20,
  fontWeight: "bold",
}

const $issuesContainer: ViewStyle = {
  // padding: 12,
  borderRadius: 8,
}

const $issuesTitle: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  marginBottom: 8,
  color: "#856404",
}

const $issueItem: TextStyle = {
  fontSize: 13,
  color: "#856404",
  marginBottom: 4,
}

const $emptyState: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: 60,
}

const $emptyText: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
  color: "#666",
  marginBottom: 8,
}

const $emptySubtext: TextStyle = {
  fontSize: 14,
  color: "#999",
}

const $uploadButtonContainer: ViewStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  padding: 16,
  backgroundColor: "#fff",
  borderTopWidth: 1,
  borderTopColor: "#e0e0e0",
}

const $uploadButton: ViewStyle = {
  backgroundColor: "#2196F3",
  padding: 16,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
}

const $uploadButtonDisabled: ViewStyle = {
  backgroundColor: "#999",
}

const $uploadButtonText: TextStyle = {
  color: "#fff",
  fontSize: 16,
  fontWeight: "600",
}

const $loadingOverlay: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
}

const $loadingCard: ViewStyle = {
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 24,
  alignItems: "center",
  gap: 16,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
}

const $loadingText: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: "#333",
}

const $modelDownloadOverlay: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
  padding: 16,
}

const $modelDownloadCard: ViewStyle = {
  width: "100%",
}
const $modelStatusBadge: ViewStyle = {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
}

const $modelStatusReady: ViewStyle = {
  backgroundColor: "#4CAF50",
}

const $modelStatusLoading: ViewStyle = {
  backgroundColor: "#FF9800",
}

const $modelStatusText: TextStyle = {
  color: "#fff",
  fontSize: 12,
  fontWeight: "600",
}

const $loadingSubtext: TextStyle = {
  fontSize: 14,
  color: "#666",
  marginTop: 8,
  textAlign: "center",
}

const $promptInfoText: TextStyle = {
  fontSize: 12,
  color: "#999",
  marginTop: 4,
  textAlign: "center",
  fontStyle: "italic",
}

const $promptContainer: ViewStyle = {
  backgroundColor: "#f0f0f0",
  padding: 12,
  borderRadius: 8,
  marginBottom: 12,
}

const $promptLabel: TextStyle = {
  fontSize: 12,
  fontWeight: "600",
  color: "#666",
  marginBottom: 4,
}

const $promptText: TextStyle = {
  fontSize: 12,
  color: "#333",
  fontStyle: "italic",
  lineHeight: 16,
}
