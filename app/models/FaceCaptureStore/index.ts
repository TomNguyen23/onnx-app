import { cast, Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"

import { uploadFaceDetect, uploadFaceRegister } from "@/services/faceService"

export const PhotoModel = types.model("Photo", {
  uri: types.string,
  timestamp: types.number,
  uploaded: types.optional(types.boolean, false),
  uploadedAt: types.maybeNull(types.number),
})

export const FaceCaptureStore = types
  .model("FaceCaptureStore", {
    photos: types.array(PhotoModel),
    uploading: types.optional(types.boolean, false),
    error: types.maybeNull(types.string),
  })
  .views((self) => ({
    getAll() {
      return self.photos
    },
    getByUri(uri: string) {
      return self.photos.find((p) => p.uri === uri) ?? null
    },
    getUploadedPhotos() {
      return self.photos.filter((p) => p.uploaded)
    },
    getPendingPhotos() {
      return self.photos.filter((p) => !p.uploaded)
    },
  }))
  .actions((self) => ({
    setUploading(v: boolean) {
      self.uploading = v
    },
    setError(msg: string | null) {
      self.error = msg
    },
    addPhoto(photo: PhotoSnapshotIn) {
      if (PhotoModel.is(photo)) {
        self.photos.push(cast(photo))
      } else {
        console.warn("[FaceCaptureStore] Invalid photo data", photo)
      }
    },
    addPhotos(photos: PhotoSnapshotIn[]) {
      photos.forEach((photo) => {
        if (PhotoModel.is(photo)) {
          self.photos.push(cast(photo))
        } else {
          console.warn("[FaceCaptureStore] Invalid photo data", photo)
        }
      })
    },
    removePhoto(uri: string) {
      const index = self.photos.findIndex((p) => p.uri === uri)
      if (index >= 0) {
        self.photos.splice(index, 1)
      }
    },
    updatePhoto(uri: string, data: Partial<PhotoSnapshotIn>) {
      const photo = self.photos.find((p) => p.uri === uri)
      if (photo) {
        Object.assign(photo, data)
      }
    },
    markAsUploaded(uri: string) {
      const photo = self.photos.find((p) => p.uri === uri)
      if (photo) {
        photo.uploaded = true
        photo.uploadedAt = Date.now()
      }
    },
    markMultipleAsUploaded(uris: string[]) {
      uris.forEach((uri) => {
        const photo = self.photos.find((p) => p.uri === uri)
        if (photo) {
          photo.uploaded = true
          photo.uploadedAt = Date.now()
        }
      })
    },
    clearPhotos() {
      self.photos.clear()
      self.uploading = false
      self.error = null
    },
  }))
  .actions((self) => ({
    async uploadFaceDetected(uri: string) {
      if (!uri) {
        self.setError("Photo not found")
        return false
      }

      self.setUploading(true)
      self.setError(null)

      try {
        const formData = new FormData()

        const filename = uri.split("/").pop() || "photo.jpg"
        const match = /\.(\w+)$/.exec(filename)
        const type = match ? `image/${match[1]}` : "image/jpeg"

        formData.append("file", {
          uri: uri,
          name: filename,
          type: type,
        } as any)

        formData.append("threshold", "0.2")

        const res = await uploadFaceDetect(formData)

        self.markAsUploaded(uri)
        return res
      } catch (e: any) {
        self.setError(e?.message ?? "Failed to upload photo")
        return false
      } finally {
        self.setUploading(false)
      }
    },

    async uploadFaceRegistration(uris: string[], personName: string) {
      const normalizedUris = uris.map((uri) => (uri.startsWith("file://") ? uri : `file://${uri}`))

      if (normalizedUris.length === 0) {
        self.setError("No photos provided")
        return false
      }

      self.setUploading(true)
      self.setError(null)

      try {
        const formData = new FormData()

        // ✅ Create list of file objects
        const files = normalizedUris.map((uri, index) => {
          const filename = uri.split("/").pop() || `photo_${index}.jpg`
          const match = /\.(\w+)$/.exec(filename)
          const type = match ? `image/${match[1]}` : "image/jpeg"

          return {
            uri: uri,
            name: filename,
            type: type,
          }
        })

        // ✅ Append files array to FormData
        files.forEach((file) => {
          formData.append("files", file as any)
        })

        formData.append("person_name", personName)

        await uploadFaceRegister(formData)

        console.log("[FaceCaptureStore] Upload successful")
        self.markMultipleAsUploaded(normalizedUris)
        return true
      } catch (e: any) {
        console.error("[FaceCaptureStore] Upload failed:", e)
        self.setError(e?.message ?? "Failed to upload photos")
        return false
      } finally {
        self.setUploading(false)
      }
    },
  }))

export interface PhotoInstance extends Instance<typeof PhotoModel> {}
export interface PhotoSnapshotIn extends SnapshotIn<typeof PhotoModel> {}
export interface PhotoSnapshotOut extends SnapshotOut<typeof PhotoModel> {}
