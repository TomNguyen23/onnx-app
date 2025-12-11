export interface Message {
  id: string
  text: string
  isBot: boolean
  imageUri?: string
}

export const CONSTANTS = {
  MAX_MESSAGE_LENGTH: 300,
  LOADING_FIRST_TIME_TEXT: "First time load takes 30-60 seconds",
} as const
