/**
 * NMS (Non-Maximum Suppression) Utility
 * Format box: [x1, y1, x2, y2]
 */

/**
 * Tính IoU giữa 2 boxes
 */
function calculateIoU(boxes: number[], i: number, j: number): number {
  const x1a = boxes[i * 4]
  const y1a = boxes[i * 4 + 1]
  const x2a = boxes[i * 4 + 2]
  const y2a = boxes[i * 4 + 3]

  const x1b = boxes[j * 4]
  const y1b = boxes[j * 4 + 1]
  const x2b = boxes[j * 4 + 2]
  const y2b = boxes[j * 4 + 3]

  const xx1 = Math.max(x1a, x1b)
  const yy1 = Math.max(y1a, y1b)
  const xx2 = Math.min(x2a, x2b)
  const yy2 = Math.min(y2a, y2b)

  const w = Math.max(0, xx2 - xx1)
  const h = Math.max(0, yy2 - yy1)
  const intersection = w * h

  const area1 = (x2a - x1a) * (y2a - y1a)
  const area2 = (x2b - x1b) * (y2b - y1b)
  const union = area1 + area2 - intersection

  return union === 0 ? 0 : intersection / union
}

/**
 * Thực hiện NMS trên boxes và scores
 * @param boxes - Mảng boxes liên tục [x1,y1,x2,y2, x1,y1,x2,y2, ...]
 * @param scores - Mảng confidence scores
 * @param iouThreshold - IoU threshold (default: 0.3)
 * @returns Indices được giữ lại
 */
export function nms(boxes: number[], scores: number[], iouThreshold: number = 0.3): number[] {
  const numBoxes = boxes.length / 4
  if (numBoxes === 0) return []

  // Tạo indices và sắp xếp theo score giảm dần
  const indices = scores
    .map((score, idx) => ({ score, idx }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.idx)

  const keep: number[] = []
  const suppressed = new Set<number>()

  for (const i of indices) {
    if (suppressed.has(i)) continue

    keep.push(i)

    // So sánh với các boxes còn lại
    for (const j of indices) {
      if (j <= i || suppressed.has(j)) continue

      const iou = calculateIoU(boxes, i, j)
      if (iou > iouThreshold) {
        suppressed.add(j)
      }
    }
  }

  return keep
}

/**
 * Thực hiện NMS và trả về boxes + scores đã lọc
 * @returns boxes dạng flat array, scores dạng array
 */
export function applyNMS(
  boxes: number[],
  scores: number[],
  iouThreshold: number = 0.3,
): { boxes: number[]; scores: number[] } {
  const keep = nms(boxes, scores, iouThreshold)

  const filteredBoxes: number[] = []
  const filteredScores: number[] = []

  for (const i of keep) {
    // Lấy 4 giá trị của box
    filteredBoxes.push(boxes[i * 4], boxes[i * 4 + 1], boxes[i * 4 + 2], boxes[i * 4 + 3])
    filteredScores.push(scores[i])
  }

  return { boxes: filteredBoxes, scores: filteredScores }
}
