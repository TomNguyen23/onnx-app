import { api } from "./api"

export async function uploadFaceDetect(formData: FormData) {
  const response = await api.axios.post("/face/inference", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data ?? null
}

export async function uploadFaceRegister(formData: FormData) {
  const response = await api.axios.post("/register-faces", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data ?? null
}
