export const blobToUrlWithFileReader = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const fr = new FileReader()

    fr.addEventListener('error', reject)
    fr.addEventListener('load', e => {
      if (!e?.target?.result) {
        return reject(new Error('Failed to load protable history blob.'))
      }

      const fileUrl =
        e.target.result instanceof ArrayBuffer
          ? new TextDecoder('utf-8').decode(e.target.result)
          : e.target.result

      return resolve(fileUrl)
    })

    fr.readAsDataURL(blob)
  })
