<template>
  <div class="encoding-tools">
    <!-- 输入输出区域 -->
    <div class="input-output-section">
      <el-row :gutter="20">
        <!-- 输入区域 -->
        <el-col :span="12">
          <div class="card-container">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>输入文本</span>
                  <el-button-group>
                    <el-button @click="loadSample" size="small">加载示例</el-button>
                    <el-button @click="clearInput" size="small">清空</el-button>
                    <el-button @click="pasteFromClipboard" size="small">粘贴</el-button>
                  </el-button-group>
                </div>
              </template>
              
              <el-input
                v-model="inputText"
                type="textarea"
                :rows="18"
                placeholder="请输入要编码/解码的文本..."
                @input="handleInput"
              />
              
              <div class="input-info">
                <el-row :gutter="10">
                  <el-col :span="8">
                    <el-tag type="info">字符数: {{ inputChars }}</el-tag>
                  </el-col>
                  <el-col :span="8">
                    <el-tag type="info">字节数: {{ inputBytes }}</el-tag>
                  </el-col>
                  <el-col :span="8">
                    <el-tag type="info">编码: {{ inputEncoding }}</el-tag>
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </div>
        </el-col>
        
        <!-- 输出区域 -->
        <el-col :span="12">
          <div class="card-container">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>输出结果</span>
                  <el-button-group>
                    <el-button @click="copyOutput" size="small" :disabled="!outputText">复制</el-button>
                    <el-button @click="downloadOutput" size="small" :disabled="!outputText">下载</el-button>
                    <el-button @click="clearOutput" size="small">清空</el-button>
                  </el-button-group>
                </div>
              </template>
              
              <el-tabs v-model="activeOutputTab">
                <el-tab-pane label="结果文本" name="result">
                  <el-input
                    v-model="outputText"
                    type="textarea"
                    :rows="14"
                    placeholder="编码/解码结果将显示在这里..."
                    readonly
                  />
                  <div class="output-info" v-if="outputText">
                    <el-row :gutter="10">
                      <el-col :span="8">
                        <el-tag type="success">字符数: {{ outputChars }}</el-tag>
                      </el-col>
                      <el-col :span="8">
                        <el-tag type="success">字节数: {{ outputBytes }}</el-tag>
                      </el-col>
                    </el-row>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="哈希值" name="hash">
                  <div class="hash-section">
                    <div class="hash-item">
                      <label>MD5:</label>
                      <el-input v-model="md5HashValue" readonly>
                        <template #append>
                          <el-button @click="copyHash('md5')" size="small">复制</el-button>
                        </template>
                      </el-input>
                    </div>
                    
                    <div class="hash-item">
                      <label>SHA1:</label>
                      <el-input v-model="sha1Hash" readonly>
                        <template #append>
                          <el-button @click="copyHash('sha1')" size="small">复制</el-button>
                        </template>
                      </el-input>
                    </div>
                    
                    <div class="hash-item">
                      <label>SHA256:</label>
                      <el-input v-model="sha256Hash" readonly>
                        <template #append>
                          <el-button @click="copyHash('sha256')" size="small">复制</el-button>
                        </template>
                      </el-input>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 编码解码操作区域 -->
    <div class="operations-section">
      <div class="card-container">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>编码解码操作</span>
            </div>
          </template>
          
          <el-row :gutter="20">
            <!-- Base64 -->
            <el-col :span="6">
              <div class="operation-item">
                <div class="operation-title">Base64</div>
                <el-button-group style="width: 100%">
                  <el-button @click="encodeBase64" :loading="base64Encoding" style="width: 50%">编码</el-button>
                  <el-button @click="decodeBase64" :loading="base64Decoding" style="width: 50%">解码</el-button>
                </el-button-group>
              </div>
            </el-col>
            
            <!-- URL -->
            <el-col :span="6">
              <div class="operation-item">
                <div class="operation-title">URL</div>
                <el-button-group style="width: 100%">
                  <el-button @click="encodeURL" :loading="urlEncoding" style="width: 50%">编码</el-button>
                  <el-button @click="decodeURL" :loading="urlDecoding" style="width: 50%">解码</el-button>
                </el-button-group>
              </div>
            </el-col>
            
            <!-- HTML -->
            <el-col :span="6">
              <div class="operation-item">
                <div class="operation-title">HTML</div>
                <el-button-group style="width: 100%">
                  <el-button @click="encodeHTML" :loading="htmlEncoding" style="width: 50%">编码</el-button>
                  <el-button @click="decodeHTML" :loading="htmlDecoding" style="width: 50%">解码</el-button>
                </el-button-group>
              </div>
            </el-col>
            
            <!-- Unicode -->
            <el-col :span="6">
              <div class="operation-item">
                <div class="operation-title">Unicode</div>
                <el-button-group style="width: 100%">
                  <el-button @click="encodeUnicode" :loading="unicodeEncoding" style="width: 50%">编码</el-button>
                  <el-button @click="decodeUnicode" :loading="unicodeDecoding" style="width: 50%">解码</el-button>
                </el-button-group>
              </div>
            </el-col>
          </el-row>
          
          <el-row :gutter="20" style="margin-top: 20px;">
            <!-- ASCII -->
            <el-col :span="6">
              <div class="operation-item">
                <div class="operation-title">ASCII</div>
                <el-button-group style="width: 100%">
                  <el-button @click="encodeASCII" :loading="asciiEncoding" style="width: 50%">编码</el-button>
                  <el-button @click="decodeASCII" :loading="asciiDecoding" style="width: 50%">解码</el-button>
                </el-button-group>
              </div>
            </el-col>
            
            <!-- 进制转换 -->
            <el-col :span="6">
              <div class="operation-item">
                <div class="operation-title">进制转换</div>
                <el-button-group style="width: 100%">
                  <el-button @click="convertToBase" :loading="baseConverting" style="width: 50%">转十进制</el-button>
                  <el-button @click="convertFromBase" :loading="baseConverting" style="width: 50%">从十进制</el-button>
                </el-button-group>
              </div>
            </el-col>
            
            <!-- 哈希计算 -->
            <el-col :span="6">
              <div class="operation-item">
                <div class="operation-title">哈希计算</div>
                <el-button-group style="width: 100%">
                  <el-button @click="calculateMD5" :loading="hashing" style="width: 50%">MD5</el-button>
                  <el-button @click="calculateSHA256" :loading="hashing" style="width: 50%">SHA256</el-button>
                </el-button-group>
              </div>
            </el-col>
            
            <!-- 其他工具 -->
            <el-col :span="6">
              <div class="operation-item">
                <div class="operation-title">其他工具</div>
                <el-button-group style="width: 100%">
                  <el-button @click="detectEncoding" :loading="detecting" style="width: 50%">检测编码</el-button>
                  <el-button @click="reverseText" style="width: 50%">反转文本</el-button>
                </el-button-group>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { md5Hash } from '@/api/tools'

// 响应式数据
const inputText = ref('')
const outputText = ref('')
const activeOutputTab = ref('result')

// 哈希值
const md5HashValue = ref('')
const sha1Hash = ref('')
const sha256Hash = ref('')

// 加载状态
const base64Encoding = ref(false)
const base64Decoding = ref(false)
const urlEncoding = ref(false)
const urlDecoding = ref(false)
const htmlEncoding = ref(false)
const htmlDecoding = ref(false)
const unicodeEncoding = ref(false)
const unicodeDecoding = ref(false)
const asciiEncoding = ref(false)
const asciiDecoding = ref(false)
const baseConverting = ref(false)
const detecting = ref(false)
const hashing = ref(false)

// 计算属性
const inputChars = computed(() => inputText.value.length)
const inputBytes = computed(() => new TextEncoder().encode(inputText.value).length)
const inputEncoding = computed(() => {
  try {
    new TextEncoder().encode(inputText.value)
    return 'UTF-8'
  } catch (error) {
    return 'Unknown'
  }
})

const outputChars = computed(() => outputText.value.length)
const outputBytes = computed(() => new TextEncoder().encode(outputText.value).length)

// 方法
const handleInput = () => {
  // 输入变化时的处理
}

const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
}

const clearOutput = () => {
  outputText.value = ''
}

const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    ElMessage.success('已从剪贴板粘贴文本')
  } catch (error) {
    ElMessage.error('粘贴失败')
  }
}

const copyOutput = async () => {
  if (!outputText.value) {
    ElMessage.warning('没有输出文本可复制')
    return
  }

  try {
    await navigator.clipboard.writeText(outputText.value)
    ElMessage.success('文本已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const downloadOutput = () => {
  if (!outputText.value) {
    ElMessage.warning('没有文本可下载')
    return
  }

  const blob = new Blob([outputText.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `encoded-text-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('文本已下载')
}

// Base64 编码解码
const encodeBase64 = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要编码的文本')
    return
  }
  
  base64Encoding.value = true
  try {
    const encoded = btoa(unescape(encodeURIComponent(inputText.value)))
    outputText.value = encoded
    ElMessage.success('Base64编码完成')
  } catch (error) {
    ElMessage.error('Base64编码失败')
  } finally {
    base64Encoding.value = false
  }
}

const decodeBase64 = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要解码的Base64文本')
    return
  }
  
  base64Decoding.value = true
  try {
    const decoded = decodeURIComponent(escape(atob(inputText.value)))
    outputText.value = decoded
    ElMessage.success('Base64解码完成')
  } catch (error) {
    ElMessage.error('Base64解码失败')
  } finally {
    base64Decoding.value = false
  }
}

// URL 编码解码
const encodeURL = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要编码的文本')
    return
  }
  
  urlEncoding.value = true
  try {
    const encoded = encodeURIComponent(inputText.value)
    outputText.value = encoded
    ElMessage.success('URL编码完成')
  } catch (error) {
    ElMessage.error('URL编码失败')
  } finally {
    urlEncoding.value = false
  }
}

const decodeURL = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要解码的URL文本')
    return
  }
  
  urlDecoding.value = true
  try {
    const decoded = decodeURIComponent(inputText.value)
    outputText.value = decoded
    ElMessage.success('URL解码完成')
  } catch (error) {
    ElMessage.error('URL解码失败')
  } finally {
    urlDecoding.value = false
  }
}

// HTML 编码解码
const encodeHTML = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要编码的文本')
    return
  }
  
  htmlEncoding.value = true
  try {
    const encoded = inputText.value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
    
    outputText.value = encoded
    ElMessage.success('HTML编码完成')
  } catch (error) {
    ElMessage.error('HTML编码失败')
  } finally {
    htmlEncoding.value = false
  }
}

const decodeHTML = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要解码的HTML文本')
    return
  }
  
  htmlDecoding.value = true
  try {
    const decoded = inputText.value
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
    
    outputText.value = decoded
    ElMessage.success('HTML解码完成')
  } catch (error) {
    ElMessage.error('HTML解码失败')
  } finally {
    htmlDecoding.value = false
  }
}

// Unicode 编码解码
const encodeUnicode = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要编码的文本')
    return
  }
  
  unicodeEncoding.value = true
  try {
    let encoded = ''
    for (let char of inputText.value) {
      encoded += '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0')
    }
    outputText.value = encoded
    ElMessage.success('Unicode编码完成')
  } catch (error) {
    ElMessage.error('Unicode编码失败')
  } finally {
    unicodeEncoding.value = false
  }
}

const decodeUnicode = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要解码的Unicode文本')
    return
  }
  
  unicodeDecoding.value = true
  try {
    const decoded = inputText.value.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16))
    })
    outputText.value = decoded
    ElMessage.success('Unicode解码完成')
  } catch (error) {
    ElMessage.error('Unicode解码失败')
  } finally {
    unicodeDecoding.value = false
  }
}

// ASCII 编码解码
const encodeASCII = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要编码的文本')
    return
  }
  
  asciiEncoding.value = true
  try {
    let encoded = []
    for (let char of inputText.value) {
      encoded.push(char.charCodeAt(0))
    }
    outputText.value = encoded.join(' ')
    ElMessage.success('ASCII编码完成')
  } catch (error) {
    ElMessage.error('ASCII编码失败')
  } finally {
    asciiEncoding.value = false
  }
}

const decodeASCII = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要解码的ASCII数值')
    return
  }
  
  asciiDecoding.value = true
  try {
    const numbers = inputText.value.split(/\s+/).map(n => parseInt(n))
    let decoded = ''
    for (let num of numbers) {
      decoded += String.fromCharCode(num)
    }
    outputText.value = decoded
    ElMessage.success('ASCII解码完成')
  } catch (error) {
    ElMessage.error('ASCII解码失败')
  } finally {
    asciiDecoding.value = false
  }
}

// 进制转换
const convertToBase = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要转换的数字')
    return
  }
  
  baseConverting.value = true
  try {
    const number = parseInt(inputText.value, 10)
    if (isNaN(number)) {
      throw new Error('请输入有效的数字')
    }
    
    const binary = number.toString(2)
    const octal = number.toString(8)
    const hex = number.toString(16).toUpperCase()
    
    outputText.value = `二进制: ${binary}\n八进制: ${octal}\n十六进制: ${hex}`
    ElMessage.success('进制转换完成')
  } catch (error) {
    ElMessage.error('进制转换失败')
  } finally {
    baseConverting.value = false
  }
}

const convertFromBase = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要转换的数字')
    return
  }
  
  baseConverting.value = true
  try {
    const number = parseInt(inputText.value, 10)
    if (isNaN(number)) {
      throw new Error('请输入有效的数字')
    }
    
    outputText.value = number.toString(10)
    ElMessage.success('进制转换完成')
  } catch (error) {
    ElMessage.error('进制转换失败')
  } finally {
    baseConverting.value = false
  }
}

// 其他工具
const detectEncoding = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要检测的文本')
    return
  }
  
  detecting.value = true
  try {
    const detections = []
    
    if (/^[A-Za-z0-9+/]*={0,2}$/.test(inputText.value) && inputText.value.length % 4 === 0) {
      detections.push('Base64')
    }
    
    if (/%[0-9A-Fa-f]{2}/.test(inputText.value)) {
      detections.push('URL编码')
    }
    
    if (/&[a-zA-Z]+;/.test(inputText.value)) {
      detections.push('HTML实体')
    }
    
    if (/\\u[0-9A-Fa-f]{4}/.test(inputText.value)) {
      detections.push('Unicode转义')
    }
    
    outputText.value = `检测到的编码: ${detections.length > 0 ? detections.join(', ') : '未检测到特定编码'}`
    ElMessage.success('编码检测完成')
  } catch (error) {
    ElMessage.error('编码检测失败')
  } finally {
    detecting.value = false
  }
}

const reverseText = () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要反转的文本')
    return
  }
  
  outputText.value = inputText.value.split('').reverse().join('')
  ElMessage.success('文本反转完成')
}

// 哈希计算
const calculateMD5 = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要计算哈希的文本')
    return
  }
  
  hashing.value = true
  try {
    const response = await md5Hash(inputText.value)
    md5HashValue.value = response.data || response
    activeOutputTab.value = 'hash'
    ElMessage.success('MD5计算完成')
  } catch (error) {
    console.error('MD5计算失败:', error)
    ElMessage.error('MD5计算失败')
  } finally {
    hashing.value = false
  }
}

const calculateSHA256 = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要计算哈希的文本')
    return
  }
  
  hashing.value = true
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(inputText.value)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    sha256Hash.value = bufferToHex(hashBuffer)
    
    // 同时计算SHA1
    const sha1Buffer = await crypto.subtle.digest('SHA-1', data)
    sha1Hash.value = bufferToHex(sha1Buffer)
    
    activeOutputTab.value = 'hash'
    ElMessage.success('SHA256计算完成')
  } catch (error) {
    console.error('SHA256计算失败:', error)
    ElMessage.error('SHA256计算失败')
  } finally {
    hashing.value = false
  }
}

const bufferToHex = (buffer) => {
  const bytes = new Uint8Array(buffer)
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return hex.toUpperCase()
}

const copyHash = async (type) => {
  const hashMap = {
    'md5': md5HashValue.value,
    'sha1': sha1Hash.value,
    'sha256': sha256Hash.value
  }
  
  const text = hashMap[type]
  if (!text) {
    ElMessage.warning('没有可复制的哈希值')
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const loadSample = () => {
  inputText.value = 'Hello 世界! 你好世界 🌍'
  ElMessage.success('已加载示例文本')
}
</script>

<style scoped>
.encoding-tools {
  padding: 0;
}

.input-output-section {
  margin-bottom: 24px;
}

.operations-section {
  margin-bottom: 24px;
}

.card-container {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #f7fafc;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-info,
.output-info {
  margin-top: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.operation-item {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  text-align: center;
}

.operation-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  font-size: 14px;
}

:deep(.el-card__header) {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-button-group) {
  display: flex;
}

:deep(.el-button-group .el-button) {
  margin-left: 0;
}

.hash-section {
  padding: 10px 0;
}

.hash-item {
  margin-bottom: 16px;
}

.hash-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #606266;
  font-size: 14px;
}

:deep(.el-input-group__append .el-button) {
  margin-left: 0;
}
</style>
