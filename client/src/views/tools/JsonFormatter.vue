<template>
  <div class="json-formatter-tools">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>JSON 输入</span>
              <el-button-group>
                <el-button size="small" @click="loadSample">加载示例</el-button>
                <el-button size="small" @click="pasteInput">粘贴</el-button>
                <el-button size="small" @click="clearInput">清空</el-button>
              </el-button-group>
            </div>
          </template>
          <el-input
            v-model="inputJson"
            type="textarea"
            :rows="20"
            placeholder="请输入 JSON 字符串..."
            @input="validateInput"
          />
          <div class="info-bar">
            <el-tag :type="validationStatus.type">{{ validationStatus.text }}</el-tag>
            <span v-if="inputSize" class="size-info">字符数：{{ inputSize }}</span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>处理结果</span>
              <el-button-group>
                <el-button size="small" :disabled="!outputText" @click="copyOutput">复制</el-button>
                <el-button size="small" :disabled="!outputText" @click="downloadOutput">下载</el-button>
                <el-button size="small" @click="clearOutput">清空</el-button>
              </el-button-group>
            </div>
          </template>
          <el-input
            v-model="outputText"
            type="textarea"
            :rows="20"
            placeholder="处理结果将显示在这里..."
            readonly
          />
          <div v-if="outputSize" class="info-bar">
            <el-tag type="success">字符数：{{ outputSize }}</el-tag>
            <el-tag v-if="inputSize && inputSize !== outputSize" type="warning">
              大小变化：{{ sizeChange }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="operation-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="格式化" name="format">
          <div class="button-row">
            <el-button type="primary" @click="formatJson">格式化 JSON</el-button>
            <el-button type="warning" @click="compressJson">压缩 JSON</el-button>
            <el-button @click="removeLineBreaks">去换行</el-button>
            <el-button @click="validateInput(true)">验证 JSON</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="格式转换" name="convert">
          <div class="button-row">
            <el-button type="primary" @click="convertToXml">JSON → XML</el-button>
            <el-button type="primary" @click="convertToYaml">JSON → YAML</el-button>
            <el-button type="primary" @click="convertToCsv">JSON → CSV</el-button>
          </div>
          <el-alert
            title="CSV 仅支持对象数组；嵌套值将保留为 JSON 字符串。"
            type="info"
            :closable="false"
            show-icon
          />
        </el-tab-pane>

        <el-tab-pane label="编码转义" name="escape">
          <div class="button-row">
            <el-button @click="encodeUrl">URL 编码</el-button>
            <el-button @click="decodeUrl">URL 解码</el-button>
            <el-button @click="escapeJsonString">JSON 转义</el-button>
            <el-button @click="unescapeJsonString">JSON 去转义</el-button>
            <el-button @click="encodeUnicode">Unicode 编码</el-button>
            <el-button @click="decodeUnicode">Unicode 解码</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="查询地图" name="query">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-input v-model="jsonPath" placeholder="如 $.address.city 或 $.items[0]">
                <template #append>
                  <el-button @click="queryJsonPath">查询</el-button>
                </template>
              </el-input>
              <div class="query-tip">点击树节点可自动填入 JSONPath 并查看该节点。</div>
            </el-col>
            <el-col :span="12">
              <div class="tree-container">
                <el-tree
                  v-if="treeData.length"
                  :data="treeData"
                  node-key="path"
                  default-expand-all
                  @node-click="handleTreeNodeClick"
                />
                <el-empty v-else description="请输入有效 JSON" :image-size="60" />
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="JSON 对比" name="compare">
          <el-input
            v-model="compareJson"
            type="textarea"
            :rows="8"
            placeholder="请输入要与上方 JSON 对比的内容..."
          />
          <div class="button-row compare-actions">
            <el-button type="primary" @click="compareJsonValues">开始对比</el-button>
            <el-button @click="compareJson = ''">清空对比内容</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="时间戳" name="timestamp">
          <div class="button-row">
            <el-button type="primary" @click="scanTimestamps">扫描时间戳</el-button>
            <el-button :disabled="!timestampResults.length" @click="replaceTimestamps">
              替换为本地时间
            </el-button>
          </div>
          <el-table v-if="timestampResults.length" :data="timestampResults" size="small" max-height="280">
            <el-table-column prop="path" label="字段路径" min-width="200" />
            <el-table-column prop="value" label="原值" min-width="150" />
            <el-table-column prop="date" label="本地时间" min-width="200" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-alert
      v-if="errorMessage"
      class="message-alert"
      :title="errorMessage"
      type="error"
      :closable="false"
      show-icon
    />
    <el-alert
      v-if="successMessage"
      class="message-alert"
      :title="successMessage"
      type="success"
      :closable="false"
      show-icon
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

const inputJson = ref('')
const outputText = ref('')
const compareJson = ref('')
const jsonPath = ref('$')
const errorMessage = ref('')
const successMessage = ref('')
const isValidJson = ref(null)
const activeTab = ref('format')
const timestampResults = ref([])

const inputSize = computed(() => inputJson.value.length)
const outputSize = computed(() => outputText.value.length)
const sizeChange = computed(() => {
  const percent = ((outputSize.value - inputSize.value) / inputSize.value) * 100
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`
})
const validationStatus = computed(() => {
  if (isValidJson.value === true) return { type: 'success', text: '有效的 JSON' }
  if (isValidJson.value === false) return { type: 'danger', text: '无效的 JSON' }
  return { type: 'info', text: '待验证' }
})

const parseInput = () => {
  if (!inputJson.value.trim()) throw new Error('请输入 JSON 内容')
  return JSON.parse(inputJson.value)
}

const getJsonError = (error, source = inputJson.value) => {
  const position = error.message.match(/position\s+(\d+)/i)
  if (!position) return error.message
  const offset = Number(position[1])
  const prefix = source.slice(0, offset)
  const line = prefix.split('\n').length
  const column = offset - prefix.lastIndexOf('\n')
  return `${error.message}（第 ${line} 行，第 ${column} 列）`
}

const setResult = (result, message) => {
  outputText.value = typeof result === 'string' ? result : JSON.stringify(result, null, 2)
  errorMessage.value = ''
  successMessage.value = message
  ElMessage.success(message)
}

const handleError = (prefix, error, source = inputJson.value) => {
  successMessage.value = ''
  errorMessage.value = `${prefix}：${getJsonError(error, source)}`
  ElMessage.error(prefix)
}

const validateInput = (showMessage = false) => {
  if (!inputJson.value.trim()) {
    isValidJson.value = null
    errorMessage.value = ''
    return
  }
  try {
    JSON.parse(inputJson.value)
    isValidJson.value = true
    errorMessage.value = ''
    if (showMessage === true) ElMessage.success('JSON 格式有效')
  } catch (error) {
    isValidJson.value = false
    errorMessage.value = `JSON 语法错误：${getJsonError(error)}`
    if (showMessage === true) ElMessage.error('JSON 格式无效')
  }
}

const formatJson = () => {
  try {
    setResult(JSON.stringify(parseInput(), null, 2), 'JSON 格式化成功')
  } catch (error) {
    handleError('格式化失败', error)
  }
}

const compressJson = () => {
  try {
    setResult(JSON.stringify(parseInput()), 'JSON 压缩成功')
  } catch (error) {
    handleError('压缩失败', error)
  }
}

const removeLineBreaks = () => {
  if (!inputJson.value) return ElMessage.warning('请输入内容')
  setResult(inputJson.value.replace(/\r?\n/g, ''), '换行已移除')
}

const xmlEscape = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

const toXml = (value, nodeName = 'root', level = 0) => {
  const indent = '  '.repeat(level)
  const safeName = String(nodeName).replace(/[^A-Za-z0-9_.-]/g, '_') || 'item'
  if (value === null) return `${indent}<${safeName} null="true" />`
  if (Array.isArray(value)) {
    const items = value.map(item => toXml(item, 'item', level + 1)).join('\n')
    return `${indent}<${safeName}>\n${items}\n${indent}</${safeName}>`
  }
  if (typeof value === 'object') {
    const children = Object.entries(value)
      .map(([key, item]) => toXml(item, key, level + 1))
      .join('\n')
    return `${indent}<${safeName}>\n${children}\n${indent}</${safeName}>`
  }
  return `${indent}<${safeName}>${xmlEscape(value)}</${safeName}>`
}

const convertToXml = () => {
  try {
    setResult(`<?xml version="1.0" encoding="UTF-8"?>\n${toXml(parseInput())}`, '已转换为 XML')
  } catch (error) {
    handleError('XML 转换失败', error)
  }
}

const yamlScalar = value => {
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value)
  return String(value)
}

const toYaml = (value, level = 0) => {
  const indent = '  '.repeat(level)
  if (Array.isArray(value)) {
    if (!value.length) return `${indent}[]`
    return value.map(item => {
      if (item !== null && typeof item === 'object') return `${indent}-\n${toYaml(item, level + 1)}`
      return `${indent}- ${yamlScalar(item)}`
    }).join('\n')
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value)
    if (!entries.length) return `${indent}{}`
    return entries.map(([key, item]) => {
      const yamlKey = /^[A-Za-z_][\w-]*$/.test(key) ? key : JSON.stringify(key)
      if (item !== null && typeof item === 'object') return `${indent}${yamlKey}:\n${toYaml(item, level + 1)}`
      return `${indent}${yamlKey}: ${yamlScalar(item)}`
    }).join('\n')
  }
  return `${indent}${yamlScalar(value)}`
}

const convertToYaml = () => {
  try {
    setResult(toYaml(parseInput()), '已转换为 YAML')
  } catch (error) {
    handleError('YAML 转换失败', error)
  }
}

const csvEscape = value => {
  const text = value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const convertToCsv = () => {
  try {
    const data = parseInput()
    const invalid = !Array.isArray(data) || data.some(item => !item || Array.isArray(item) || typeof item !== 'object')
    if (invalid) throw new Error('CSV 转换要求顶层数据为对象数组')
    const headers = [...new Set(data.flatMap(item => Object.keys(item)))]
    const rows = data.map(item => headers.map(header => csvEscape(item[header])).join(','))
    setResult([headers.map(csvEscape).join(','), ...rows].join('\n'), '已转换为 CSV')
  } catch (error) {
    handleError('CSV 转换失败', error)
  }
}

const encodeUrl = () => {
  if (!inputJson.value) return ElMessage.warning('请输入内容')
  setResult(encodeURIComponent(inputJson.value), 'URL 编码成功')
}

const decodeUrl = () => {
  try {
    setResult(decodeURIComponent(inputJson.value), 'URL 解码成功')
  } catch (error) {
    handleError('URL 解码失败', error)
  }
}

const escapeJsonString = () => {
  if (!inputJson.value) return ElMessage.warning('请输入内容')
  setResult(JSON.stringify(inputJson.value).slice(1, -1), 'JSON 转义成功')
}

const unescapeJsonString = () => {
  try {
    setResult(JSON.parse(`"${inputJson.value}"`), 'JSON 去转义成功')
  } catch (error) {
    handleError('JSON 去转义失败', error)
  }
}

const encodeUnicode = () => {
  if (!inputJson.value) return ElMessage.warning('请输入内容')
  const result = [...inputJson.value].map(char => {
    const code = char.codePointAt(0)
    if (code <= 0x7f) return char
    if (code <= 0xffff) return `\\u${code.toString(16).padStart(4, '0')}`
    const adjusted = code - 0x10000
    const high = 0xd800 + (adjusted >> 10)
    const low = 0xdc00 + (adjusted & 0x3ff)
    return `\\u${high.toString(16)}\\u${low.toString(16)}`
  }).join('')
  setResult(result, 'Unicode 编码成功')
}

const decodeUnicode = () => {
  const result = inputJson.value.replace(
    /\\u([\da-fA-F]{4})/g,
    (_, hex) => String.fromCharCode(parseInt(hex, 16))
  )
  setResult(result, 'Unicode 解码成功')
}

const buildTree = (value, path = '$', key = '$') => {
  const isContainer = value !== null && typeof value === 'object'
  const summary = Array.isArray(value)
    ? `Array(${value.length})`
    : isContainer ? 'Object' : JSON.stringify(value)
  const node = { label: `${key}: ${summary}`, path }
  if (isContainer) {
    node.children = Object.entries(value).map(([childKey, childValue]) => {
      const childPath = Array.isArray(value)
        ? `${path}[${childKey}]`
        : /^[A-Za-z_$][\w$]*$/.test(childKey)
          ? `${path}.${childKey}`
          : `${path}[${JSON.stringify(childKey)}]`
      return buildTree(childValue, childPath, childKey)
    })
  }
  return node
}

const treeData = computed(() => {
  try {
    return [buildTree(parseInput())]
  } catch {
    return []
  }
})

const tokenizeJsonPath = path => {
  if (!path.startsWith('$')) throw new Error('路径必须以 $ 开头')
  const tokens = []
  const pattern = /\.([A-Za-z_$][\w$]*)|\[(\d+)\]|\["((?:\\.|[^"])*)"\]|\['((?:\\.|[^'])*)'\]/g
  let cursor = 1
  let match
  while ((match = pattern.exec(path)) !== null) {
    if (match.index !== cursor) throw new Error(`路径在位置 ${cursor + 1} 无效`)
    const key = match[1] ?? (match[2] !== undefined ? Number(match[2]) : match[3] ?? match[4])
    tokens.push(key)
    cursor = pattern.lastIndex
  }
  if (cursor !== path.length) throw new Error(`路径在位置 ${cursor + 1} 无效`)
  return tokens
}

const queryJsonPath = () => {
  try {
    const value = tokenizeJsonPath(jsonPath.value).reduce((current, key) => {
      const missing = current === null
        || current === undefined
        || !Object.prototype.hasOwnProperty.call(current, key)
      if (missing) throw new Error(`未找到路径：${jsonPath.value}`)
      return current[key]
    }, parseInput())
    setResult(value, `已查询 ${jsonPath.value}`)
  } catch (error) {
    handleError('查询失败', error)
  }
}

const handleTreeNodeClick = node => {
  jsonPath.value = node.path
  queryJsonPath()
}

const compareValues = (left, right, path = '$', changes = []) => {
  if (Object.is(left, right)) return changes
  const leftObject = left !== null && typeof left === 'object'
  const rightObject = right !== null && typeof right === 'object'
  if (!leftObject || !rightObject || Array.isArray(left) !== Array.isArray(right)) {
    changes.push({ type: '修改', path, left, right })
    return changes
  }
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  keys.forEach(key => {
    const childPath = Array.isArray(left) ? `${path}[${key}]` : `${path}.${key}`
    if (!Object.prototype.hasOwnProperty.call(left, key)) {
      changes.push({ type: '新增', path: childPath, right: right[key] })
    } else if (!Object.prototype.hasOwnProperty.call(right, key)) {
      changes.push({ type: '删除', path: childPath, left: left[key] })
    } else {
      compareValues(left[key], right[key], childPath, changes)
    }
  })
  return changes
}

const compareJsonValues = () => {
  try {
    if (!compareJson.value.trim()) throw new Error('请输入用于对比的 JSON')
    const changes = compareValues(parseInput(), JSON.parse(compareJson.value))
    const result = changes.length ? changes : '两个 JSON 内容一致'
    const message = changes.length ? `发现 ${changes.length} 处差异` : '两个 JSON 内容一致'
    setResult(result, message)
  } catch (error) {
    handleError('对比失败', error, compareJson.value)
  }
}

const isTimestamp = value => /^\d{10}$/.test(String(value)) || /^\d{13}$/.test(String(value))

const timestampToDate = value => {
  const milliseconds = String(value).length === 10 ? Number(value) * 1000 : Number(value)
  const date = new Date(milliseconds)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString()
}

const collectTimestamps = (value, path = '$', results = []) => {
  if (isTimestamp(value)) {
    const date = timestampToDate(value)
    if (date) results.push({ path, value, date })
  }
  if (value !== null && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      const childPath = Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`
      collectTimestamps(item, childPath, results)
    })
  }
  return results
}

const scanTimestamps = () => {
  try {
    timestampResults.value = collectTimestamps(parseInput())
    errorMessage.value = ''
    successMessage.value = timestampResults.value.length
      ? `发现 ${timestampResults.value.length} 个时间戳`
      : ''
    if (!timestampResults.value.length) ElMessage.info('未发现 10 位或 13 位时间戳')
  } catch (error) {
    handleError('扫描失败', error)
  }
}

const replaceTimestampValues = value => {
  if (isTimestamp(value)) return timestampToDate(value) || value
  if (Array.isArray(value)) return value.map(replaceTimestampValues)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceTimestampValues(item)])
    )
  }
  return value
}

const replaceTimestamps = () => {
  try {
    setResult(replaceTimestampValues(parseInput()), '时间戳已替换为本地时间')
  } catch (error) {
    handleError('替换失败', error)
  }
}

const loadSample = () => {
  inputJson.value = JSON.stringify({
    name: '张三',
    createdAt: 1788421200000,
    address: { city: '北京', zipCode: '100000' },
    hobbies: ['阅读', '游泳', '编程'],
    active: true
  })
  validateInput()
  ElMessage.success('已加载示例数据')
}

const pasteInput = async () => {
  try {
    inputJson.value = await navigator.clipboard.readText()
    validateInput()
  } catch {
    ElMessage.error('无法读取剪贴板，请检查浏览器权限')
  }
}

const clearInput = () => {
  inputJson.value = ''
  isValidJson.value = null
  errorMessage.value = ''
  timestampResults.value = []
}

const clearOutput = () => {
  outputText.value = ''
  successMessage.value = ''
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const downloadOutput = () => {
  const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `json-result.${activeTab.value === 'format' ? 'json' : 'txt'}`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.operation-card,
.message-alert {
  margin-top: 24px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}

.compare-actions {
  margin-top: 14px;
  margin-bottom: 0;
}

.query-tip {
  margin-top: 10px;
  color: #909399;
  font-size: 12px;
}

.tree-container {
  min-height: 150px;
  max-height: 280px;
  padding: 10px;
  overflow: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.info-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.size-info {
  color: #909399;
  font-size: 12px;
}

:deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>
