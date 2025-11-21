<template>
  <div class="text-replace-tools">
    <el-row :gutter="20">
        <!-- 文本输入区域 -->
        <el-col :span="12">
          <div class="card-container">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>原始文本</span>
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
                :rows="20"
                placeholder="请输入要处理的文本..."
                @input="analyzeText"
              />
              
              <div class="text-info">
                <el-row :gutter="10">
                  <el-col :span="8">
                    <el-tag type="info">字符数: {{ inputChars }}</el-tag>
                  </el-col>
                  <el-col :span="8">
                    <el-tag type="info">行数: {{ inputLines }}</el-tag>
                  </el-col>
                  <el-col :span="8">
                    <el-tag type="info">单词数: {{ inputWords }}</el-tag>
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </div>
        </el-col>
        
        <!-- 文本输出区域 -->
        <el-col :span="12">
          <div class="card-container">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>处理结果</span>
                <el-button-group>
                  <el-button @click="copyOutput" size="small" :disabled="!outputText">复制</el-button>
                  <el-button @click="downloadOutput" size="small" :disabled="!outputText">下载</el-button>
                  <el-button @click="clearOutput" size="small">清空</el-button>
                </el-button-group>
                </div>
              </template>
              
              <el-input
                v-model="outputText"
                type="textarea"
                :rows="20"
                placeholder="处理后的文本将显示在这里..."
                readonly
              />
              
              <div class="text-info" v-if="outputText">
                <el-row :gutter="10">
                  <el-col :span="8">
                    <el-tag type="success">字符数: {{ outputChars }}</el-tag>
                  </el-col>
                  <el-col :span="8">
                    <el-tag type="success">行数: {{ outputLines }}</el-tag>
                  </el-col>
                  <el-col :span="8">
                    <el-tag type="success">单词数: {{ outputWords }}</el-tag>
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
      
      <!-- 替换配置区域 -->
      <div class="card-container" style="margin-top: 24px;">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>替换配置</span>
            <el-button-group>
              <el-button @click="addReplaceRule" size="small" type="primary">
                <el-icon><Plus /></el-icon>
                添加规则
              </el-button>
              <el-button @click="loadPresetRules" size="small">预设规则</el-button>
              <el-button @click="clearAllRules" size="small">清空规则</el-button>
            </el-button-group>
            </div>
          </template>
          
          <div class="replace-rules">
          <div
            v-for="(rule, index) in replaceRules"
            :key="index"
            class="replace-rule"
          >
            <el-row :gutter="10" align="middle">
              <el-col :span="4">
                <el-select v-model="rule.type" size="small">
                  <el-option label="文本替换" value="text" />
                  <el-option label="正则替换" value="regex" />
                  <el-option label="行处理" value="line" />
                </el-select>
              </el-col>
              
              <el-col :span="4">
                <el-input
                  v-model="rule.search"
                  size="small"
                  :placeholder="rule.type === 'regex' ? '正则表达式' : '搜索文本'"
                />
              </el-col>
              
              <el-col :span="4">
                <el-input
                  v-model="rule.replace"
                  size="small"
                  placeholder="替换文本"
                />
              </el-col>
              
              <el-col :span="4">
                <el-checkbox-group v-model="rule.options" size="small">
                  <el-checkbox label="g">全局</el-checkbox>
                  <el-checkbox label="i">忽略大小写</el-checkbox>
                  <el-checkbox label="m">多行</el-checkbox>
                </el-checkbox-group>
              </el-col>
              
              <el-col :span="4">
                <el-button-group>
                  <el-button
                    size="small"
                    @click="testRule(index)"
                    :disabled="!rule.search"
                  >
                    测试
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="removeRule(index)"
                    :disabled="replaceRules.length === 1"
                  >
                    删除
                  </el-button>
                </el-button-group>
              </el-col>
              
              <el-col :span="4">
                <el-tag size="small" :type="rule.enabled ? 'success' : 'info'">
                  {{ rule.enabled ? '已启用' : '已禁用' }}
                </el-tag>
              </el-col>
            </el-row>
            
            <!-- 测试结果 -->
            <div v-if="rule.testResult" class="test-result">
              <el-alert
                :title="`测试结果: 替换了 ${rule.testResult.count} 处`"
                :type="rule.testResult.success ? 'success' : 'warning'"
                :closable="false"
                show-icon
              />
            </div>
          </div>
          </div>
        </el-card>
      </div>
      
      <!-- 操作按钮区域 -->
      <div class="card-container" style="margin-top: 24px;">
        <el-card>
          <template #header>
            <span>文本处理操作</span>
          </template>
        
        <el-row :gutter="20">
          <el-col :span="6">
            <el-button type="primary" @click="applyReplacements" :loading="processing" block>
              <el-icon><Operation /></el-icon>
              应用替换规则
            </el-button>
          </el-col>
          
          <el-col :span="6">
            <el-button type="success" @click="formatText" :loading="formatting" block>
              <el-icon><EditPen /></el-icon>
              格式化文本
            </el-button>
          </el-col>
          
          <el-col :span="6">
            <el-button type="warning" @click="removeDuplicates" :loading="removing" block>
              <el-icon><Remove /></el-icon>
              去除重复行
            </el-button>
          </el-col>
          
          <el-col :span="6">
            <el-button type="info" @click="sortLines" :loading="sorting" block>
              <el-icon><Sort /></el-icon>
              排序行
            </el-button>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 16px;">
          <el-col :span="6">
            <el-button type="danger" @click="trimWhitespace" :loading="trimming" block>
              <el-icon><Scissor /></el-icon>
              去除空白字符
            </el-button>
          </el-col>
          
          <el-col :span="6">
            <el-button type="primary" @click="convertCase" :loading="converting" block>
              <el-icon><Refresh /></el-icon>
              大小写转换
            </el-button>
          </el-col>
          
          <el-col :span="6">
            <el-button type="success" @click="addLineNumbers" :loading="numbering" block>
              <el-icon><List /></el-icon>
              添加行号
            </el-button>
          </el-col>
          
          <el-col :span="6">
            <el-button type="info" @click="removeLineNumbers" :loading="unnumbering" block>
              <el-icon><DeleteFilled /></el-icon>
              去除行号
            </el-button>
          </el-col>
        </el-row>
        </el-card>
      </div>
      
      <!-- 预设规则对话框 -->
      <el-dialog v-model="showPresetDialog" title="选择预设规则" width="600px">
        <div class="preset-rules">
          <el-row :gutter="10">
            <el-col :span="8">
              <el-button @click="loadTextReplacePresets" block>文本替换</el-button>
            </el-col>
            <el-col :span="8">
              <el-button @click="loadFormatPresets" block>格式化</el-button>
            </el-col>
            <el-col :span="8">
              <el-button @click="loadCleanPresets" block>清理</el-button>
            </el-col>
          </el-row>
        </div>
      </el-dialog>
      
      <!-- 错误和成功信息 -->
      <div v-if="errorMessage" class="card-container" style="margin-top: 24px;">
        <el-card>
          <el-alert :title="errorMessage" type="error" :closable="false" />
        </el-card>
      </div>
      
      <div v-if="successMessage" class="card-container" style="margin-top: 24px;">
        <el-card>
          <el-alert :title="successMessage" type="success" :closable="false" />
        </el-card>
      </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Plus, Operation, EditPen, Remove, Sort, Scissor, 
  Refresh, List, DeleteFilled 
} from '@element-plus/icons-vue'
import { replaceText } from '@/api/tools'

// 响应式数据
const inputText = ref('')
const outputText = ref('')
const replaceRules = ref([
  {
    type: 'text',
    search: '',
    replace: '',
    options: ['g'],
    enabled: true,
    testResult: null
  }
])

const processing = ref(false)
const formatting = ref(false)
const removing = ref(false)
const sorting = ref(false)
const trimming = ref(false)
const converting = ref(false)
const numbering = ref(false)
const unnumbering = ref(false)

const errorMessage = ref('')
const successMessage = ref('')
const showPresetDialog = ref(false)

// 计算属性
const inputChars = computed(() => inputText.value.length)
const inputLines = computed(() => inputText.value.split('\n').length)
const inputWords = computed(() => {
  return inputText.value.trim() ? inputText.value.trim().split(/\s+/).length : 0
})

const outputChars = computed(() => outputText.value.length)
const outputLines = computed(() => outputText.value.split('\n').length)
const outputWords = computed(() => {
  return outputText.value.trim() ? outputText.value.trim().split(/\s+/).length : 0
})

// 方法
const analyzeText = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

const clearInput = () => {
  inputText.value = ''
  analyzeText()
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
  a.download = `replaced-text-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('文本已下载')
}

const addReplaceRule = () => {
  replaceRules.value.push({
    type: 'text',
    search: '',
    replace: '',
    options: ['g'],
    enabled: true,
    testResult: null
  })
}

const removeRule = (index) => {
  if (replaceRules.value.length > 1) {
    replaceRules.value.splice(index, 1)
  }
}

const clearAllRules = () => {
  replaceRules.value = [{
    type: 'text',
    search: '',
    replace: '',
    options: ['g'],
    enabled: true,
    testResult: null
  }]
  ElMessage.success('已清空所有规则')
}

const testRule = (index) => {
  const rule = replaceRules.value[index]
  if (!rule.search) {
    ElMessage.warning('请输入搜索内容')
    return
  }

  try {
    let pattern = rule.search
    let flags = rule.options.join('')
    
    if (rule.type === 'text') {
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
    
    const regex = new RegExp(pattern, flags)
    const matches = inputText.value.match(regex) || []
    
    rule.testResult = {
      success: true,
      count: matches.length
    }
    
    ElMessage.success(`找到 ${matches.length} 个匹配项`)
  } catch (error) {
    rule.testResult = {
      success: false,
      count: 0,
      error: error.message
    }
    ElMessage.error(`规则测试失败: ${error.message}`)
  }
}

const applyReplacements = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要处理的文本')
    return
  }

  const enabledRules = replaceRules.value.filter(rule => rule.enabled && rule.search)
  if (enabledRules.length === 0) {
    ElMessage.warning('没有启用的替换规则')
    return
  }

  processing.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    let result = inputText.value
    
    for (const rule of enabledRules) {
      let pattern = rule.search
      let flags = rule.options.join('')
      
      if (rule.type === 'text') {
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }
      
      const regex = new RegExp(pattern, flags)
      result = result.replace(regex, rule.replace)
    }
    
    outputText.value = result
    successMessage.value = `替换完成，共应用 ${enabledRules.length} 条规则`
    ElMessage.success('文本替换完成')
  } catch (error) {
    errorMessage.value = `替换失败: ${error.message}`
    ElMessage.error('替换失败')
  } finally {
    processing.value = false
  }
}

const formatText = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要格式化的文本')
    return
  }

  formatting.value = true
  
  try {
    const response = await replaceText({
      action: 'format',
      text: inputText.value
    })
    
    if (response.success) {
      outputText.value = response.data
      successMessage.value = '文本格式化完成'
      ElMessage.success('格式化完成')
    } else {
      errorMessage.value = response.message || '格式化失败'
      ElMessage.error('格式化失败')
    }
  } catch (error) {
    errorMessage.value = error.message || '格式化请求失败'
    ElMessage.error('格式化失败')
  } finally {
    formatting.value = false
  }
}

const removeDuplicates = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要处理的文本')
    return
  }

  removing.value = true
  
  try {
    const lines = inputText.value.split('\n')
    const uniqueLines = [...new Set(lines)]
    outputText.value = uniqueLines.join('\n')
    
    successMessage.value = `去除重复完成，从 ${lines.length} 行减少到 ${uniqueLines.length} 行`
    ElMessage.success('去除重复完成')
  } catch (error) {
    errorMessage.value = `去除重复失败: ${error.message}`
    ElMessage.error('去除重复失败')
  } finally {
    removing.value = false
  }
}

const sortLines = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要排序的文本')
    return
  }

  sorting.value = true
  
  try {
    const lines = inputText.value.split('\n')
    lines.sort()
    outputText.value = lines.join('\n')
    
    successMessage.value = `排序完成，共 ${lines.length} 行`
    ElMessage.success('排序完成')
  } catch (error) {
    errorMessage.value = `排序失败: ${error.message}`
    ElMessage.error('排序失败')
  } finally {
    sorting.value = false
  }
}

const trimWhitespace = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要处理的文本')
    return
  }

  trimming.value = true
  
  try {
    const lines = inputText.value.split('\n')
    const trimmedLines = lines.map(line => line.trim())
    outputText.value = trimmedLines.join('\n')
    
    successMessage.value = '去除空白字符完成'
    ElMessage.success('去除空白字符完成')
  } catch (error) {
    errorMessage.value = `去除空白字符失败: ${error.message}`
    ElMessage.error('去除空白字符失败')
  } finally {
    trimming.value = false
  }
}

const convertCase = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要转换的文本')
    return
  }

  converting.value = true
  
  try {
    outputText.value = inputText.value.toUpperCase()
    successMessage.value = '大小写转换完成'
    ElMessage.success('大小写转换完成')
  } catch (error) {
    errorMessage.value = `大小写转换失败: ${error.message}`
    ElMessage.error('大小写转换失败')
  } finally {
    converting.value = false
  }
}

const addLineNumbers = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要添加行号的文本')
    return
  }

  numbering.value = true
  
  try {
    const lines = inputText.value.split('\n')
    const numberedLines = lines.map((line, index) => `${index + 1}: ${line}`)
    outputText.value = numberedLines.join('\n')
    
    successMessage.value = `添加行号完成，共 ${lines.length} 行`
    ElMessage.success('添加行号完成')
  } catch (error) {
    errorMessage.value = `添加行号失败: ${error.message}`
    ElMessage.error('添加行号失败')
  } finally {
    numbering.value = false
  }
}

const removeLineNumbers = async () => {
  if (!inputText.value) {
    ElMessage.warning('请输入要处理的文本')
    return
  }

  unnumbering.value = true
  
  try {
    const lines = inputText.value.split('\n')
    const unnumberedLines = lines.map(line => {
      // 匹配 "数字: " 格式的行号
      return line.replace(/^\d+:\s*/, '')
    })
    outputText.value = unnumberedLines.join('\n')
    
    successMessage.value = '去除行号完成'
    ElMessage.success('去除行号完成')
  } catch (error) {
    errorMessage.value = `去除行号失败: ${error.message}`
    ElMessage.error('去除行号失败')
  } finally {
    unnumbering.value = false
  }
}

const loadPresetRules = () => {
  showPresetDialog.value = true
}

const loadTextReplacePresets = () => {
  replaceRules.value = [
    {
      type: 'text',
      search: 'console.log',
      replace: 'logger.info',
      options: ['g'],
      enabled: true,
      testResult: null
    },
    {
      type: 'regex',
      search: '\\bvar\\b',
      replace: 'let',
      options: ['g'],
      enabled: true,
      testResult: null
    }
  ]
  showPresetDialog.value = false
  ElMessage.success('已加载文本替换预设规则')
}

const loadFormatPresets = () => {
  replaceRules.value = [
    {
      type: 'text',
      search: '\t',
      replace: '  ',
      options: ['g'],
      enabled: true,
      testResult: null
    },
    {
      type: 'text',
      search: '  ',
      replace: ' ',
      options: ['g'],
      enabled: true,
      testResult: null
    }
  ]
  showPresetDialog.value = false
  ElMessage.success('已加载格式化预设规则')
}

const loadCleanPresets = () => {
  replaceRules.value = [
    {
      type: 'regex',
      search: '^\\s*$',
      replace: '',
      options: ['g', 'm'],
      enabled: true,
      testResult: null
    },
    {
      type: 'text',
      search: '//',
      replace: '#',
      options: ['g'],
      enabled: true,
      testResult: null
    }
  ]
  showPresetDialog.value = false
  ElMessage.success('已加载清理预设规则')
}

const loadSample = () => {
  inputText.value = `function greetUser(name) {
    console.log("Hello, " + name + "!");
    console.log("Welcome to our application.");
    console.log("Have a great day!");
}

var message = "This is a test message";
var user = "John Doe";

greetUser(user);

console.log("Script completed");`
  ElMessage.success('已加载示例文本')
}
</script>

<style scoped>
.text-replace-tools {
  padding: 0;
}

.input-output-section {
  margin-bottom: 24px;
}

.card-container {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #f7fafc;
  overflow: hidden;
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-info {
  margin-top: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.replace-rules {
  max-height: 300px;
  overflow-y: auto;
}

.replace-rule {
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fafafa;
}

.test-result {
  margin-top: 10px;
}

.preset-rules {
  padding: 20px;
}

:deep(.el-card__header) {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-row) {
  margin-bottom: 10px;
}

:deep(.el-col) {
  padding: 5px;
}

:deep(.el-checkbox) {
  margin-right: 8px;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-button-group .el-button) {
  margin-left: 0;
}
</style>