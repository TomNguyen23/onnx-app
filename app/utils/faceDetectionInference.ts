import { InferenceSession, Tensor } from "onnxruntime-react-native"

export interface FaceDetectionResult {
  allScores: number[]
  timestamp: number
  outputShape?: readonly number[]
}

/**
 * Chạy inference và trả về tất cả scores
 */
export async function detectFaceScores(
  session: InferenceSession,
  imageData: number[],
  shape: [number, number, number, number],
): Promise<FaceDetectionResult> {
  try {
    const inputName = session.inputNames[0]

    // Chuyển number[] thành Float32Array
    const float32Data = new Float32Array(imageData)

    // DEBUG: Kiểm tra input data
    // console.log("=== INPUT DEBUG ===")
    // console.log("Input name:", inputName)
    // console.log("Input shape:", shape)
    // console.log("Input data length:", float32Data.length)
    // console.log("Expected length:", shape[0] * shape[1] * shape[2] * shape[3])
    // console.log("First 10 values:", Array.from(float32Data.slice(0, 10)))
    // console.log("==================")

    // Tạo tensor
    const inputTensor = new Tensor("float32", float32Data, shape)

    // Chạy inference
    const outputs = await session.run({ [inputName]: inputTensor })

    // Lấy cả 2 outputs để debug
    const boxesOutputName = session.outputNames[0]
    const scoresOutputName = session.outputNames[1]

    const boxesOutput = outputs[boxesOutputName]
    const scoresOutput = outputs[scoresOutputName]

    // console.log("=== OUTPUT DEBUG ===")
    // console.log("Boxes data:", boxesOutput)
    // console.log("Scores data:", scoresOutput)
    // console.log("===================")

    // Chuyển scores thành array
    const allScores = Array.from(scoresOutput.data as Float32Array)

    return {
      allScores,
      timestamp: Date.now(),
      outputShape: scoresOutput.dims,
    }
  } catch (error) {
    console.error("Face detection inference error:", error)
    throw error
  }
}
