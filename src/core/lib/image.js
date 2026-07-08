/**
 * Compresses an image client-side before uploading.
 * Resizes the image to fit a maximum width/height while keeping the aspect ratio (long-edge fitting).
 * Converts the image to JPEG and applies quality compression (0.8 / 80%).
 * 
 * @param {File} file The original file object.
 * @param {Object} options Compression configuration.
 * @returns {Promise<File>} A promise resolving to the compressed File object.
 */
export async function compressImage(file, { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = {}) {
  if (!file || !file.type.startsWith('image/')) return file

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions keeping aspect ratio (mimics "Long edge" fit)
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            // Create a new File from the blob, renaming the extension to .jpg
            const name = file.name.replace(/\.[^/.]+$/, "") + ".jpg"
            const compressedFile = new File([blob], name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => resolve(file)
    }
    reader.onerror = () => resolve(file)
  })
}
