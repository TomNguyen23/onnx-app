import { Image } from "react-native"
import * as ImageManipulator from "expo-image-manipulator"

interface CropBox {
  x1: number
  y1: number
  x2: number
  y2: number
}

const FRAME_WIDTH = 1920
const FRAME_HEIGHT = 1080

export async function cropImage(
  uri: string,
  box: [number, number, number, number] | CropBox,
  quality: number = 0.9,
) {
  try {
    const { width: originalWidth, height: originalHeight } = await getImageSize(uri)

    const boxObj = Array.isArray(box) ? { x1: box[0], y1: box[1], x2: box[2], y2: box[3] } : box

    // Boxes are already normalized [0,1] from model output
    // Scale directly to original image size
    // let x1 = boxObj.x1 * originalWidth
    // let y1 = boxObj.y1 * originalHeight
    // let x2 = boxObj.x2 * originalWidth
    // let y2 = boxObj.y2 * originalHeight

    let x1 = boxObj.x1 * FRAME_WIDTH
    let y1 = boxObj.y1 * originalHeight
    let x2 = boxObj.x2 * FRAME_WIDTH
    let y2 = boxObj.y2 * originalHeight

    // Clamp to ensure within image bounds
    x1 = Math.max(0, Math.min(x1, originalWidth))
    y1 = Math.max(0, Math.min(y1, originalHeight))
    x2 = Math.max(0, Math.min(x2, originalWidth))
    y2 = Math.max(0, Math.min(y2, originalHeight))

    // Calculate crop dimensions
    const originX = Math.round(x1)
    const originY = Math.round(y1)
    const width = Math.round(x2 - x1)
    const height = Math.round(y2 - y1)

    // Validate crop size
    if (width <= 0 || height <= 0) {
      console.warn("Invalid crop dimensions:", { width, height, box: boxObj })
      return null
    }

    // Perform crop using expo-image-manipulator
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          crop: {
            originX,
            originY,
            width,
            height,
          },
        },
      ],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
    )

    return result.uri
  } catch (error) {
    console.error("Face crop error:", error)
    throw error
  }
}

export function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error),
    )
  })
}
