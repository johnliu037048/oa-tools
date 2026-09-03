import request from './request'

// JSON格式化工具API
export const formatJson = (data) => {
  return request({
    url: '/tools/format-json',
    method: 'post',
    data: { data, pretty: true }
  })
}

// JSON验证API
export const validateJson = (data) => {
  return request({
    url: '/tools/validate-json',
    method: 'post',
    data: { data }
  })
}

// 添加缺失的工具API
export const apiFormatJson = (jsonData) => {
  return formatJson(jsonData);
}

export const apiValidateJson = (jsonData) => {
  return validateJson(jsonData);
}

// HTTP请求API
export const httpRequest = (config) => {
  return request({
    url: '/tools/http-request',
    method: 'post',
    data: config,
    timeout: config.timeout || 30000
  })
}

// 文件搜索API
export const searchFiles = (searchConfig) => {
  return request({
    url: '/tools/search-files',
    method: 'post',
    data: searchConfig
  })
}

// 文本替换API
export const replaceText = (replaceConfig) => {
  return request({
    url: '/tools/replace-text',
    method: 'post',
    data: replaceConfig
  })
}

// Base64编码API
export const base64Encode = (text) => {
  return request({
    url: '/tools/base64-encode',
    method: 'post',
    data: { text }
  })
}

// Base64解码API
export const base64Decode = (encoded) => {
  return request({
    url: '/tools/base64-decode',
    method: 'post',
    data: { encoded }
  })
}

// URL编码API
export const urlEncode = (text) => {
  return request({
    url: '/tools/url-encode',
    method: 'post',
    data: { text }
  })
}

// URL解码API
export const urlDecode = (encoded) => {
  return request({
    url: '/tools/url-decode',
    method: 'post',
    data: { encoded }
  })
}

// 时间戳转日期API
export const timestampToDate = (timestamp) => {
  return request({
    url: '/tools/timestamp-to-date',
    method: 'post',
    data: { timestamp }
  })
}

// 日期转时间戳API
export const dateToTimestamp = (date) => {
  return request({
    url: '/tools/date-to-timestamp',
    method: 'post',
    data: { date }
  })
}

// HTML编码API
export const htmlEncode = (text) => {
  return request({
    url: '/tools/html-encode',
    method: 'post',
    data: { text }
  })
}

// HTML解码API
export const htmlDecode = (encoded) => {
  return request({
    url: '/tools/html-decode',
    method: 'post',
    data: { encoded }
  })
}

// Unicode编码API
export const unicodeEncode = (text) => {
  return request({
    url: '/tools/unicode-encode',
    method: 'post',
    data: { text }
  })
}

// Unicode解码API
export const unicodeDecode = (encoded) => {
  return request({
    url: '/tools/unicode-decode',
    method: 'post',
    data: { encoded }
  })
}

// MD5哈希API
export const md5Hash = (text) => {
  return request({
    url: '/tools/md5-hash',
    method: 'post',
    data: { text }
  })
}

// SHA哈希API
export const shaHash = (text, algorithm = 'sha256') => {
  return request({
    url: '/tools/sha-hash',
    method: 'post',
    data: { text, algorithm }
  })
}

// 进制转换API
export const baseConverter = (number, fromBase, toBase) => {
  return request({
    url: '/tools/base-converter',
    method: 'post',
    data: { number, fromBase, toBase }
  })
}

// ========== AI 生成工具 - DeepSeek API ==========

// 生成图片 API
export const generateImage = (params) => {
  return request({
    url: '/tools/generate-image',
    method: 'post',
    data: {
      prompt: params.prompt,
      model: params.model || 'deepseek-vision',
      width: params.width || 1024,
      height: params.height || 1024,
      quality: params.quality || 'hd',
      style: params.style || 'natural'
    },
    timeout: 60000
  })
}

// 生成视频 API
export const generateVideo = (params) => {
  return request({
    url: '/tools/generate-video',
    method: 'post',
    data: {
      prompt: params.prompt,
      model: params.model || 'deepseek-video',
      duration: params.duration || 5,
      fps: params.fps || 24,
      resolution: params.resolution || '1080p',
      quality: params.quality || 'hd'
    },
    timeout: 120000
  })
}

// 获取生成任务状态 API
export const getGenerationStatus = (taskId, type = 'image') => {
  return request({
    url: '/tools/generation-status',
    method: 'post',
    data: { taskId, type },
    timeout: 30000
  })
}