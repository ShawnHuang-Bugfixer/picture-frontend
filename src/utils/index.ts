import { saveAs } from 'file-saver'

/**
 * 格式化文件大小
 * @param size
 */
export const formatSize = (size?: number) => {
  if (!size) return '未知'
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  return (size / (1024 * 1024)).toFixed(2) + ' MB'
}

/**
 * 下载图片
 * @param url 图片下载地址
 * @param fileName 要保存为的文件名
 */
export function downloadImage(url?: string, fileName?: string) {
  if (!url) {
    return
  }
  return fetch(url, {
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`)
      }
      const blob = await response.blob()
      const resolvedFileName =
        fileName || getFileNameFromHeader(response.headers.get('content-disposition')) || getFileNameFromUrl(url)
      saveAs(blob, resolvedFileName)
    })
    .catch((error) => {
      // Fallback to the original URL-based behavior when blob download is blocked.
      saveAs(url, fileName)
      throw error
    })
}

function getFileNameFromHeader(contentDisposition?: string | null) {
  if (!contentDisposition) {
    return undefined
  }
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }
  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  if (asciiMatch?.[1]) {
    return asciiMatch[1]
  }
  return undefined
}

function getFileNameFromUrl(url: string) {
  try {
    const urlObject = new URL(url, window.location.href)
    const fileName = urlObject.pathname.split('/').filter(Boolean).pop()
    return fileName || 'download'
  } catch {
    return 'download'
  }
}

/**
 * 将颜色值转换为标准 #RRGGBB 格式
 * @param input
 */
export function toHexColor(input: string) {
  // 去掉 0x 前缀
  const colorValue = input.startsWith('0x') ? input.slice(2) : input

  // 将剩余部分解析为十六进制数，再转成 6 位十六进制字符串
  const hexColor = parseInt(colorValue, 16).toString(16).padStart(6, '0')

  // 返回标准 #RRGGBB 格式
  return `#${hexColor}`
}

