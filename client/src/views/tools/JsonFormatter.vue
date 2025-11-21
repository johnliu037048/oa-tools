<template>
  <div class="json-formatter-tools">
      <el-row :gutter="20">
        <!-- 输入区域 -->
        <el-col :span="12">
          <div class="card-container">
            <el-card>
            <template #header>
              <div class="card-header">
                <span>JSON 输入</span>
                <el-button-group>
                  <el-button @click="loadSample" size="small">加载示例</el-button>
                  <el-button @click="clearInput" size="small">清空</el-button>
                </el-button-group>
              </div>
            </template>
            
            <el-input
              v-model="inputJson"
              type="textarea"
              :rows="20"
              placeholder="请输入要格式化的 JSON 字符串..."
              @input="validateInput"
            />
            
            <div class="input-info">
              <el-tag :type="validationStatus.type">{{ validationStatus.text }}</el-tag>
              <span v-if="inputSize > 0" class="size-info">字符数: {{ inputSize }}</span>
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
                <span>格式化结果</span>
                <el-button-group>
                  <el-button @click="copyOutput" size="small" :disabled="!formattedJson">复制</el-button>
                  <el-button @click="clearOutput" size="small">清空</el-button>
                </el-button-group>
              </div>
            </template>
            
            <el-input
              v-model="formattedJson"
              type="textarea"
              :rows="20"
              placeholder="格式化后的 JSON 将显示在这里..."
              readonly
            />
            
            <div class="output-info" v-if="outputSize > 0">
              <el-tag type="success">字符数: {{ outputSize }}</el-tag>
              <el-tag v-if="inputSize !== outputSize" type="warning">
                压缩率: {{ ((1 - outputSize / inputSize) * 100).toFixed(1) }}%
              </el-tag>
            </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
      
      <!-- 操作按钮区域 -->
      <div class="card-container" style="margin-top: 24px;">
        <el-card>
        <template #header>
          <span>操作工具</span>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-button type="primary" @click="handleFormatJson" :loading="formatting" block>
              <el-icon><Document /></el-icon>
              格式化 JSON
            </el-button>
          </el-col>
          
          <el-col :span="8">
            <el-button type="warning" @click="compressJson" :loading="compressing" block>
              <el-icon><Remove /></el-icon>
              压缩 JSON
            </el-button>
          </el-col>
          
          <el-col :span="8">
            <el-button type="info" @click="minifyJson" :loading="minifying" block>
              <el-icon><Remove /></el-icon>
              最小化
            </el-button>
          </el-col>
        </el-row>
        </el-card>
      </div>
      
      <!-- 错误信息显示 -->
      <div v-if="errorMessage" class="card-container" style="margin-top: 24px;">
        <el-card>
          <el-alert :title="errorMessage" type="error" :closable="false" />
        </el-card>
      </div>
      
      <!-- 成功信息显示 -->
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
import { Document, Remove } from '@element-plus/icons-vue'
import { formatJson, validateJson, apiFormatJson } from '@/api/tools'

// 响应式数据
const inputJson = ref('')
const formattedJson = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const formatting = ref(false)
const compressing = ref(false)
const minifying = ref(false)
const isValidJson = ref(null)

// 计算属性
const inputSize = computed(() => inputJson.value.length)
const outputSize = computed(() => formattedJson.value.length)

const validationStatus = computed(() => {
  if (isValidJson.value === true) {
    return { type: 'success', text: '有效的 JSON' }
  } else if (isValidJson.value === false) {
    return { type: 'error', text: '无效的 JSON' }
  } else {
    return { type: 'info', text: '待验证' }
  }
})

// 方法
const validateInput = () => {
  if (!inputJson.value.trim()) {
    isValidJson.value = null
    errorMessage.value = ''
    return
  }
  
  try {
    JSON.parse(inputJson.value)
    isValidJson.value = true
    errorMessage.value = ''
  } catch (error) {
    isValidJson.value = false
    errorMessage.value = `JSON 语法错误: ${error.message}`
  }
}

const handleFormatJson = async () => {
  if (!inputJson.value.trim()) {
    ElMessage.warning('请输入要格式化的 JSON')
    return
  }
  
  formatting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const response = await apiFormatJson(inputJson.value)
    if (response.success) {
      formattedJson.value = response.data
      successMessage.value = 'JSON 格式化成功'
      ElMessage.success('格式化成功')
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



const compressJson = () => {
  if (!inputJson.value.trim()) {
    ElMessage.warning('请输入要压缩的 JSON')
    return
  }
  
  compressing.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const parsed = JSON.parse(inputJson.value)
    formattedJson.value = JSON.stringify(parsed)
    successMessage.value = 'JSON 压缩成功'
    ElMessage.success('压缩成功')
  } catch (error) {
    errorMessage.value = `压缩失败: ${error.message}`
    ElMessage.error('压缩失败，请检查 JSON 格式')
  } finally {
    compressing.value = false
  }
}

const minifyJson = () => {
  if (!inputJson.value.trim()) {
    ElMessage.warning('请输入要最小化的 JSON')
    return
  }
  
  minifying.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const parsed = JSON.parse(inputJson.value)
    formattedJson.value = JSON.stringify(parsed).replace(/ /g, '').replace(/\n/g, '')
    successMessage.value = 'JSON 最小化成功'
    ElMessage.success('最小化成功')
  } catch (error) {
    errorMessage.value = `最小化失败: ${error.message}`
    ElMessage.error('最小化失败，请检查 JSON 格式')
  } finally {
    minifying.value = false
  }
}

const loadSample = () => {
  const sampleData = {
    name: "张三",
    age: 30,
    email: "zhangsan@example.com",
    address: {
      street: "123 Main St",
      city: "北京",
      zipCode: "100000"
    },
    hobbies: ["阅读", "游泳", "编程"],
    isMarried: true,
    children: null
  }
  
  inputJson.value = JSON.stringify(sampleData)
  validateInput()
  ElMessage.success('已加载示例数据')
}

const clearInput = () => {
  inputJson.value = ''
  isValidJson.value = null
  errorMessage.value = ''
}

const clearOutput = () => {
  formattedJson.value = ''
  successMessage.value = ''
}

const copyOutput = async () => {
  if (!formattedJson.value) {
    ElMessage.warning('没有内容可复制')
    return
  }
  
  try {
    await navigator.clipboard.writeText(formattedJson.value)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped>

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-info, .output-info {
  margin-top: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  gap: 10px;
  align-items: center;
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
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-row) {
  margin-bottom: 10px;
}

:deep(.el-col) {
  padding: 5px;
}
</style>