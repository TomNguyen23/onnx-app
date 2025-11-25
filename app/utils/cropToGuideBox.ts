import { Dimensions } from "react-native"
import * as ImageManipulator from "expo-image-manipulator"

interface GuideBoxRegion {
  x: number
  y: number
  width: number
  height: number
}

export async function cropToGuideBox(
  photoUri: string,
  guideBox: GuideBoxRegion,
  quality: number = 0.8,
  // targetSize: { width: number; height: number } = { width: 112, height: 112 },
): Promise<string> {
  try {
    const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

    // Get actual photo dimensions
    const photoInfo = await ImageManipulator.manipulateAsync(photoUri, [], {
      format: ImageManipulator.SaveFormat.JPEG,
    })

    console.log("Screen dimensions:", { screenWidth, screenHeight })
    console.log("Photo dimensions:", { width: photoInfo.width, height: photoInfo.height })
    console.log("Guide box on screen:", guideBox)

    // Calculate aspect ratios
    const screenAspect = screenWidth / screenHeight
    const photoAspect = photoInfo.width / photoInfo.height

    let scale: number
    let offsetX = 0
    let offsetY = 0

    if (photoAspect > screenAspect) {
      // Photo is wider - camera fills height, crops width
      // Scale based on height
      scale = photoInfo.height / screenHeight
      // Calculate horizontal offset (camera preview is centered)
      const scaledScreenWidth = screenWidth * scale
      offsetX = (photoInfo.width - scaledScreenWidth) / 2
    } else {
      // Photo is taller - camera fills width, crops height
      // Scale based on width
      scale = photoInfo.width / screenWidth
      // Calculate vertical offset (camera preview is centered)
      const scaledScreenHeight = screenHeight * scale
      offsetY = (photoInfo.height - scaledScreenHeight) / 2
    }

    console.log("Scale and offset:", { scale, offsetX, offsetY })

    // Map guide box coordinates to photo coordinates
    const cropX = Math.round(guideBox.x * scale + offsetX)
    const cropY = Math.round(guideBox.y * scale + offsetY)
    const cropWidth = Math.round(guideBox.width * scale)
    const cropHeight = Math.round(guideBox.height * scale)

    console.log("Calculated crop region:", { cropX, cropY, cropWidth, cropHeight })

    // Ensure crop region is within photo bounds
    const finalX = Math.max(0, Math.min(cropX, photoInfo.width - 1))
    const finalY = Math.max(0, Math.min(cropY, photoInfo.height - 1))
    const finalWidth = Math.min(cropWidth, photoInfo.width - finalX)
    const finalHeight = Math.min(cropHeight, photoInfo.height - finalY)

    console.log("Final crop region:", { finalX, finalY, finalWidth, finalHeight })

    // Perform crop and resize
    const result = await ImageManipulator.manipulateAsync(
      photoUri,
      [
        {
          crop: {
            originX: finalX,
            originY: finalY,
            width: finalWidth,
            height: finalHeight,
          },
        },
        // {
        //   resize: targetSize,
        // },
      ],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
    )

    return result.uri
  } catch (error) {
    console.error("Crop to guide box error:", error)
    throw error
  }
}
