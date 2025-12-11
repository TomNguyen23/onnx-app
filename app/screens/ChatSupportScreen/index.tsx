import { FC, useCallback, useState, useRef } from "react"
import { ViewStyle, View, FlatList, TouchableOpacity, TextStyle } from "react-native"
import Feather from "@expo/vector-icons/Feather"
import { initLlama } from "llama.rn"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { colors } from "@/theme/colors"
import { spacing } from "@/theme/spacing"
import { MODELS } from "@/utils/modelConstants"

import {
  MessageBubble,
  ChatInput,
  LoadingOverlay,
  MtmdModelDownloadCard,
  TypingIndicator,
} from "./components"
import { Message, CONSTANTS } from "./types"

interface ChatSupportScreenProps extends AppStackScreenProps<"ChatSupport"> {}

// Định nghĩa kiểu cho chat messages
interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

export const ChatSupportScreen: FC<ChatSupportScreenProps> = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm Qwen running locally. Ask me anything!",
      isBot: true,
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [ready, setReady] = useState(false)
  const [showModelDownload, setShowModelDownload] = useState(false)
  const [modelInitialized, setModelInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Lưu trữ lịch sử chat để gửi context cho model
  const chatHistoryRef = useRef<ChatMessage[]>([
    {
      role: "system",
      content: "You are a helpful AI assistant. Be concise and helpful in your responses.",
    },
  ])

  const contextRef = useRef<any>(null)
  const flatListRef = useRef<FlatList>(null)

  const handleSend = async () => {
    if (!input.trim() || !contextRef.current) return

    const userText = input.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      isBot: false,
      imageUri: selectedImage || undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setSelectedImage(null)
    setLoading(true)
    setIsGenerating(true)

    try {
      const botMessageId = (Date.now() + 1).toString()

      // Tạo user message cho chat history
      let userChatMessage: ChatMessage
      if (selectedImage) {
        userChatMessage = {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: selectedImage,
              },
            },
            { type: "text", text: userText },
          ],
        }
      } else {
        userChatMessage = {
          role: "user",
          content: userText,
        }
      }

      // Thêm user message vào chat history
      chatHistoryRef.current.push(userChatMessage)

      let isFirstToken = true
      let fullResponse = ""

      // Sử dụng chat completion API
      const result = await contextRef.current.completion(
        {
          messages: chatHistoryRef.current,
          n_predict: 400,
          stop: ["<|im_end|>", "<|endoftext|>"],
          temperature: 0.7,
          top_p: 0.9,
        },
        (data: any) => {
          const { token } = data

          if (isFirstToken) {
            // Khi nhận được token đầu tiên, tắt typing indicator và thêm message
            setIsGenerating(false)
            setMessages((prev) => [...prev, { id: botMessageId, text: token, isBot: true }])
            isFirstToken = false
          } else {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === botMessageId ? { ...msg, text: msg.text + token } : msg,
              ),
            )
          }
          fullResponse += token
        },
      )

      // Thêm assistant response vào chat history để giữ context
      chatHistoryRef.current.push({
        role: "assistant",
        content: fullResponse,
      })

      // Giới hạn chat history để tránh vượt quá context length
      // Giữ lại system message + 10 cặp messages gần nhất
      const maxHistory = 21 // 1 system + 20 messages (10 cặp user/assistant)
      if (chatHistoryRef.current.length > maxHistory) {
        const systemMessage = chatHistoryRef.current[0]
        chatHistoryRef.current = [systemMessage, ...chatHistoryRef.current.slice(-(maxHistory - 1))]
      }

      console.log("Completion result:", result)
    } catch (error) {
      console.error("Error generating response:", error)
      setIsGenerating(false)
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: "Sorry, I encountered an error.", isBot: true },
      ])

      // Xóa user message khỏi history nếu có lỗi
      chatHistoryRef.current.pop()
    } finally {
      setLoading(false)
      setIsGenerating(false)
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
      setReady(true)
      setShowModelDownload(false)

      // Reset chat history khi khởi tạo model mới
      chatHistoryRef.current = [
        {
          role: "system",
          content: "You are a helpful AI assistant. Be concise and helpful in your responses.",
        },
      ]
    } catch (error) {
      console.error("Error initializing model:", error)
      alert("Failed to initialize model. Please try again.")
    } finally {
      setIsInitializing(false)
    }
  }

  const handleModelDownloaded = (modelPath: string, mmprojPath: string) => {
    console.log("Model downloaded successfully:", modelPath, mmprojPath)
  }

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => <MessageBubble item={item} />,
    [],
  )

  const keyExtractor = useCallback((item: Message) => item.id, [])

  const handleImageSelected = (uri: string) => {
    setSelectedImage(uri)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
  }

  const renderFooter = useCallback(() => {
    return <TypingIndicator isVisible={isGenerating} />
  }, [isGenerating])

  // Hàm để clear chat history
  const handleClearChat = useCallback(() => {
    setMessages([
      {
        id: "1",
        text: "Hi! I'm Qwen running locally. Ask me anything!",
        isBot: true,
      },
    ])
    chatHistoryRef.current = [
      {
        role: "system",
        content: "You are a helpful AI assistant. Be concise and helpful in your responses.",
      },
    ]
  }, [])

  return (
    <Screen preset="fixed" contentContainerStyle={$root} safeAreaEdges={["bottom", "top"]}>
      <View style={$container}>
        {showModelDownload && (
          <View style={$modelDownloadSection}>
            <MtmdModelDownloadCard
              title={MODELS.LFM_2_VL_3B.name}
              repo={MODELS.LFM_2_VL_3B.repo}
              filename={MODELS.LFM_2_VL_3B.filename}
              mmproj={MODELS.LFM_2_VL_3B.mmproj!}
              size={MODELS.LFM_2_VL_3B.size}
              onInitialize={handleInitializeModel}
              onDownloaded={handleModelDownloaded}
              initializeButtonText="Initialize Model"
            />
            <TouchableOpacity style={$closeButton} onPress={() => setShowModelDownload(false)}>
              <Text style={$closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}

        {isInitializing && <LoadingOverlay />}

        <View style={$header}>
          <Text preset="heading" style={$headerTitle}>
            Chat Support
          </Text>
          <View style={$headerButtons}>
            {modelInitialized && (
              <TouchableOpacity style={$clearButton} onPress={handleClearChat}>
                <Feather name="edit" size={24} color="black" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={$modelButton}
              onPress={() => setShowModelDownload(!showModelDownload)}
            >
              <Text style={$modelButtonText}>
                {modelInitialized ? "✓ Model Ready" : "📥 Download Model"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          style={$messageList}
          contentContainerStyle={$messageListContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={renderFooter}
        />

        <ChatInput
          input={input}
          loading={loading}
          ready={ready}
          selectedImage={selectedImage}
          maxLength={CONSTANTS.MAX_MESSAGE_LENGTH}
          onChangeText={setInput}
          onSend={handleSend}
          onImageSelected={handleImageSelected}
          onRemoveImage={handleRemoveImage}
        />
      </View>
    </Screen>
  )
}

// Styles
const $root: ViewStyle = {
  flex: 1,
}

const $container: ViewStyle = {
  flex: 1,
  paddingHorizontal: spacing.md,
  paddingTop: spacing.md,
}

const $header: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.md,
  paddingHorizontal: spacing.xs,
}

const $headerTitle: TextStyle = {
  flex: 1,
}

const $headerButtons: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
}

const $clearButton: ViewStyle = {
  backgroundColor: colors.palette.neutral300,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.sm,
  borderRadius: spacing.sm,
}

const $modelButton: ViewStyle = {
  backgroundColor: colors.tint,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: spacing.sm,
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}

const $modelButtonText: TextStyle = {
  color: colors.palette.neutral100,
  fontSize: 14,
  fontWeight: "600",
}

const $modelDownloadSection: ViewStyle = {
  marginBottom: spacing.md,
  backgroundColor: colors.palette.neutral100,
  borderRadius: spacing.md,
  padding: spacing.sm,
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 5,
}

const $closeButton: ViewStyle = {
  marginTop: spacing.sm,
  padding: spacing.sm,
  backgroundColor: colors.palette.neutral300,
  borderRadius: spacing.sm,
  alignItems: "center",
}

const $closeButtonText: TextStyle = {
  color: colors.text,
  fontSize: 14,
  fontWeight: "500",
}

const $messageList: ViewStyle = {
  flex: 1,
}

const $messageListContent: ViewStyle = {
  paddingBottom: spacing.md,
}
