<template>
  <div class="http-debug-tools">
    <el-row :gutter="20">
      <!-- 请求配置区域 -->
      <el-col :span="10">
        <div class="card-container">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>请求配置</span>
                <el-button-group>
                  <el-button @click="loadExample" size="small">加载示例</el-button>
                  <el-button @click="importRequest" size="small">导入</el-button>
                  <el-button @click="exportRequest" size="small">导出</el-button>
                  <el-button @click="clearRequest" size="small">清空</el-button>
                </el-button-group>
              </div>
            </template>
            
            <!-- HTTP方法和URL -->
            <el-form :model="requestConfig" label-width="80px" size="small">
              <el-form-item label="HTTP方法">
                <el-select v-model="requestConfig.method" style="width: 120px;">
                  <el-option label="GET" value="GET" />
                  <el-option label="POST" value="POST" />
                  <el-option label="PUT" value="PUT" />
                  <el-option label="DELETE" value="DELETE" />
                  <el-option label="PATCH" value="PATCH" />
                  <el-option label="HEAD" value="HEAD" />
                  <el-option label="OPTIONS" value="OPTIONS" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="请求URL">
                <el-input
                  v-model="requestConfig.url"
                  placeholder="请输入请求URL"
                  @input="validateUrl"
                />
              </el-form-item>
              
              <!-- 请求头 -->
              <el-form-item label="请求头">
                <div class="headers-section">
                  <div v-for="(header, index) in requestConfig.headers" :key="index" class="header-item">
                    <el-input
                      v-model="header.key"
                      placeholder="Header名称"
                      style="width: 40%;"
                      @input="updateHeaderKey(index)"
                    />
                    <span class="colon">:</span>
                    <el-input
                      v-model="header.value"
                      placeholder="Header值"
                      style="width: 40%;"
                    />
                    <el-button
                      type="danger"
                      size="small"
                      @click="removeHeader(index)"
                      :disabled="requestConfig.headers.length === 1"
                      circle
                    >
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                  <el-button @click="addHeader" size="small" type="primary" plain>
                    <el-icon><Plus /></el-icon>
                    添加请求头
                  </el-button>
                </div>
              </el-form-item>
              
              <!-- 请求体 -->
              <el-form-item label="请求体" v-if="requestConfig.method !== 'GET' && requestConfig.method !== 'HEAD'">
                <el-tabs v-model="requestBodyType">
                  <el-tab-pane label="JSON" name="json">
                    <el-input
                      v-model="requestConfig.data"
                      type="textarea"
                      :rows="8"
                      placeholder='{"key": "value"}'
                      @input="validateRequestBody"
                    />
                  </el-tab-pane>
                  <el-tab-pane label="Form" name="form">
                    <div class="form-data-section">
                      <div v-for="(item, index) in formData" :key="index" class="form-item">
                        <el-input
                          v-model="item.key"
                          placeholder="参数名"
                          style="width: 40%;"
                        />
                        <span class="colon">=</span>
                        <el-input
                          v-model="item.value"
                          placeholder="参数值"
                          style="width: 40%;"
                        />
                        <el-button
                          type="danger"
                          size="small"
                          @click="removeFormItem(index)"
                          :disabled="formData.length === 1"
                          circle
                        >
                          <el-icon><Close /></el-icon>
                        </el-button>
                      </div>
                      <el-button @click="addFormItem" size="small" type="primary" plain>
                        <el-icon><Plus /></el-icon>
                        添加参数
                      </el-button>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </el-form-item>
              
              <!-- 发送按钮 -->
              <el-form-item>
                <el-button
                  type="primary"
                  @click="sendRequest"
                  :loading="sending"
                  :disabled="!isValidRequest"
                  block
                >
                  <el-icon><Right /></el-icon>
                  发送请求
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </el-col>
      
      <!-- 响应显示区域 -->
      <el-col :span="14">
        <div class="card-container">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>响应结果</span>
                <el-button-group>
                  <el-button @click="copyResponse" size="small" :disabled="!response">复制</el-button>
                  <el-button @click="clearResponse" size="small">清空</el-button>
                </el-button-group>
              </div>
            </template>
            
            <div v-if="!response" class="no-response">
              <el-empty description="暂无响应数据，请发送请求" />
            </div>
            
            <div v-else class="response-content">
              <!-- 响应状态 -->
              <div class="response-status">
                <el-tag :type="getStatusType(response.status)">
                  {{ response.status }} {{ response.statusText }}
                </el-tag>
                <span class="response-time">耗时: {{ responseTime }}ms</span>
                <el-button @click="downloadResponse" size="small">下载响应</el-button>
              </div>
              
              <!-- 响应信息标签页 -->
              <el-tabs v-model="activeResponseTab">
                <el-tab-pane label="响应体" name="body">
                  <div class="response-body">
                    <div class="response-meta">
                      <el-tag type="info">大小: {{ formatSize(response.dataSize) }}</el-tag>
                      <el-tag v-if="isJsonResponse" type="success">JSON</el-tag>
                      <el-tag v-else type="warning">文本</el-tag>
                    </div>
                    
                    <div class="body-content">
                      <pre v-if="isJsonResponse" class="json-content">{{ formatJson(response.data) }}</pre>
                      <pre v-else class="text-content">{{ response.data }}</pre>
                    </div>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="响应头" name="headers">
                  <div class="response-headers">
                    <div v-for="(value, key) in response.headers" :key="key" class="header-line">
                      <span class="header-key">{{ key }}:</span>
                      <span class="header-value">{{ value }}</span>
                    </div>
                  </div>
                </el-tab-pane>
                
                <el-tab-pane label="请求信息" name="request">
                  <div class="request-info">
                    <div class="request-line">
                      <el-tag type="info">{{ requestConfig.method }}</el-tag>
                      <code class="request-url">{{ requestConfig.url }}</code>
                    </div>
                    
                    <h4>请求头:</h4>
                    <div class="headers-display">
                      <div v-for="(header, index) in effectiveHeaders" :key="index" class="header-line">
                        <span class="header-key">{{ header.key }}:</span>
                        <span class="header-value">{{ header.value }}</span>
                      </div>
                    </div>
                    
                    <h4 v-if="requestConfig.data">请求体:</h4>
                    <pre v-if="requestConfig.data" class="request-body">{{ requestConfig.data }}</pre>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>
    
    <!-- 错误信息 -->
    <div v-if="errorMessage" class="card-container" style="margin-top: 24px;">
      <el-card>
        <el-alert :title="errorMessage" type="error" :closable="false" />
      </el-card>
    </div>
    
    <!-- 预设配置 -->
    <div class="card-container" style="margin-top: 24px;">
      <el-card>
        <template #header>
          <span>快速配置</span>
        </template>
        
        <el-row :gutter="10">
          <el-col :span="6">
            <el-button-group>
              <el-button @click="addCommonHeader('Content-Type', 'application/json')" size="small">
                JSON
              </el-button>
              <el-button @click="addCommonHeader('Content-Type', 'application/x-www-form-urlencoded')" size="small">
                Form
              </el-button>
            </el-button-group>
          </el-col>
          
          <el-col :span="6">
            <el-button-group>
              <el-button @click="addCommonHeader('Accept', 'application/json')" size="small">
                接受JSON
              </el-button>
              <el-button @click="addCommonHeader('User-Agent', 'Mozilla/5.0')" size="small">
                浏览器UA
              </el-button>
            </el-button-group>
          </el-col>
          
          <el-col :span="12">
            <el-button-group>
              <el-button @click="loadRestApiExample" size="small">
                REST API示例
              </el-button>
              <el-button @click="loadGraphQLExample" size="small">
                GraphQL示例
              </el-button>
              <el-button @click="loadWebhookExample" size="small">
                Webhook示例
              </el-button>
            </el-button-group>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Close, Right } from '@element-plus/icons-vue'
import { httpRequest } from '@/api/tools'

// 响应式数据
const requestConfig = ref({
  method: 'GET',
  url: '',
  headers: [{ key: '', value: '' }],
  data: ''
})

const formData = ref([{ key: '', value: '' }])
const requestBodyType = ref('json')
const sending = ref(false)
const response = ref(null)
const responseTime = ref(0)
const errorMessage = ref('')
const activeResponseTab = ref('body')

// 计算属性
const isValidRequest = computed(() => {
  return requestConfig.value.url && 
         requestConfig.value.url.startsWith('http')
})

const isJsonResponse = computed(() => {
  if (!response.value?.headers?.['content-type']) return false
  return response.value.headers['content-type'].includes('application/json')
})

const effectiveHeaders = computed(() => {
  return requestConfig.value.headers.filter(h => h.key && h.value)
})

// 方法
const validateUrl = () => {
  // URL验证逻辑已在计算属性中实现
}

const validateRequestBody = () => {
  if (requestBodyType.value === 'json' && requestConfig.value.data) {
    try {
      JSON.parse(requestConfig.value.data)
    } catch (error) {
      // 静默处理，错误会在发送时显示
    }
  }
}

const addHeader = () => {
  requestConfig.value.headers.push({ key: '', value: '' })
}

const removeHeader = (index) => {
  if (requestConfig.value.headers.length > 1) {
    requestConfig.value.headers.splice(index, 1)
  }
}

const updateHeaderKey = (index) => {
  // 可以在这里添加特殊头部处理逻辑
}

const addFormItem = () => {
  formData.value.push({ key: '', value: '' })
}

const removeFormItem = (index) => {
  if (formData.value.length > 1) {
    formData.value.splice(index, 1)
  }
}

const getStatusType = (status) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'danger'
  return 'info'
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatJson = (data) => {
  try {
    return JSON.stringify(JSON.parse(data), null, 2)
  } catch {
    return data
  }
}

const sendRequest = async () => {
  if (!isValidRequest.value) {
    ElMessage.warning('请输入有效的请求URL')
    return
  }

  sending.value = true
  errorMessage.value = ''

  try {
    const startTime = Date.now()
    
    // 构建请求配置
    const config = {
      method: requestConfig.value.method,
      url: requestConfig.value.url,
      headers: {}
    }

    // 添加请求头
    effectiveHeaders.value.forEach(header => {
      config.headers[header.key] = header.value
    })

    // 添加请求体
    if (requestConfig.value.method !== 'GET' && requestConfig.value.method !== 'HEAD') {
      if (requestBodyType.value === 'json') {
        if (requestConfig.value.data) {
          config.data = JSON.parse(requestConfig.value.data)
        }
      } else if (requestBodyType.value === 'form') {
        const formObj = {}
        formData.value.forEach(item => {
          if (item.key && item.value) {
            formObj[item.key] = item.value
          }
        })
        config.data = formObj
      }
    }

    const response_data = await httpRequest(config)
    responseTime.value = Date.now() - startTime

    response.value = {
      status: response_data.data.status,
      statusText: response_data.data.statusText,
      headers: response_data.data.headers,
      data: typeof response_data.data.data === 'string' 
        ? response_data.data.data 
        : JSON.stringify(response_data.data.data, null, 2),
      dataSize: JSON.stringify(response_data.data.data).length,
      request: response_data.data.request
    }

    ElMessage.success('请求发送成功')
  } catch (error) {
    errorMessage.value = error.message || '请求发送失败'
    ElMessage.error('请求发送失败')
  } finally {
    sending.value = false
  }
}

const clearRequest = () => {
  requestConfig.value = {
    method: 'GET',
    url: '',
    headers: [{ key: '', value: '' }],
    data: ''
  }
  formData.value = [{ key: '', value: '' }]
  requestBodyType.value = 'json'
  errorMessage.value = ''
}

// 导出请求配置（类似 Postman）
const exportRequest = () => {
  const exportData = {
    name: 'HTTP Request',
    request: {
      method: requestConfig.value.method,
      url: requestConfig.value.url,
      header: requestConfig.value.headers
        .filter(h => h.key && h.value)
        .map(h => ({ key: h.key, value: h.value })),
      body: {}
    },
    _postman_variable_scope: 'environment',
    _postman_exported_at: new Date().toISOString(),
    _postman_exported_using: 'OA Tools HTTP Debug'
  }

  // 添加请求体
  if (requestConfig.value.method !== 'GET' && requestConfig.value.method !== 'HEAD') {
    if (requestBodyType.value === 'json' && requestConfig.value.data) {
      try {
        exportData.request.body.mode = 'raw'
        exportData.request.body.raw = requestConfig.value.data
        exportData.request.body.options = {
          raw: {
            language: 'json'
          }
        }
      } catch (error) {
        ElMessage.warning('JSON 格式错误，导出时可能不完整')
      }
    } else if (requestBodyType.value === 'form') {
      const formDataArray = formData.value
        .filter(item => item.key && item.value)
        .map(item => ({ key: item.key, value: item.value }))
      
      if (formDataArray.length > 0) {
        exportData.request.body.mode = 'urlencoded'
        exportData.request.body.urlencoded = formDataArray
      }
    }
  }

  // 下载文件
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `http-request-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('请求配置已导出')
}

// 导入请求配置（支持 Postman 格式和自定义格式）
const importRequest = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        
        // 支持 Postman Collection v2.1 格式
        if (data.request) {
          requestConfig.value.method = data.request.method || 'GET'
          requestConfig.value.url = data.request.url?.raw || data.request.url || ''
          
          // 导入请求头
          if (data.request.header && Array.isArray(data.request.header)) {
            requestConfig.value.headers = data.request.header.map(h => ({
              key: h.key || h.name || '',
              value: h.value || ''
            }))
          } else if (data.request.header && typeof data.request.header === 'object') {
            requestConfig.value.headers = Object.entries(data.request.header).map(([key, value]) => ({
              key,
              value: String(value)
            }))
          }
          
          // 导入请求体
          if (data.request.body) {
            if (data.request.body.mode === 'raw' && data.request.body.raw) {
              requestBodyType.value = 'json'
              requestConfig.value.data = data.request.body.raw
            } else if (data.request.body.mode === 'urlencoded' && data.request.body.urlencoded) {
              requestBodyType.value = 'form'
              formData.value = data.request.body.urlencoded.map(item => ({
                key: item.key || '',
                value: item.value || ''
              }))
            } else if (data.request.body.mode === 'formdata' && data.request.body.formdata) {
              requestBodyType.value = 'form'
              formData.value = data.request.body.formdata.map(item => ({
                key: item.key || '',
                value: item.value || ''
              }))
            }
          }
        }
        // 支持自定义格式
        else if (data.method && data.url) {
          requestConfig.value.method = data.method
          requestConfig.value.url = data.url
          
          if (data.headers && Array.isArray(data.headers)) {
            requestConfig.value.headers = data.headers.map(h => ({
              key: h.key || '',
              value: h.value || ''
            }))
          }
          
          if (data.data) {
            requestBodyType.value = 'json'
            requestConfig.value.data = typeof data.data === 'string' 
              ? data.data 
              : JSON.stringify(data.data, null, 2)
          }
        }
        // 支持 Postman Collection 格式（包含多个请求）
        else if (data.item && Array.isArray(data.item)) {
          // 导入第一个请求
          const firstItem = data.item[0]
          if (firstItem.request) {
            requestConfig.value.method = firstItem.request.method || 'GET'
            requestConfig.value.url = firstItem.request.url?.raw || firstItem.request.url || ''
            
            if (firstItem.request.header && Array.isArray(firstItem.request.header)) {
              requestConfig.value.headers = firstItem.request.header.map(h => ({
                key: h.key || h.name || '',
                value: h.value || ''
              }))
            }
            
            if (firstItem.request.body) {
              if (firstItem.request.body.mode === 'raw' && firstItem.request.body.raw) {
                requestBodyType.value = 'json'
                requestConfig.value.data = firstItem.request.body.raw
              }
            }
          }
        }
        else {
          throw new Error('不支持的导入格式')
        }

        // 确保至少有一个空的请求头
        if (requestConfig.value.headers.length === 0) {
          requestConfig.value.headers = [{ key: '', value: '' }]
        }

        ElMessage.success('请求配置已导入')
      } catch (error) {
        console.error('导入失败:', error)
        ElMessage.error(`导入失败: ${error.message}`)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

const clearResponse = () => {
  response.value = null
  responseTime.value = 0
}

const copyResponse = async () => {
  if (!response.value) {
    ElMessage.warning('没有响应数据可复制')
    return
  }

  try {
    await navigator.clipboard.writeText(response.value.data)
    ElMessage.success('响应数据已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const downloadResponse = () => {
  if (!response.value) return

  const blob = new Blob([response.value.data], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `response_${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

const addCommonHeader = (key, value) => {
  const existingIndex = requestConfig.value.headers.findIndex(h => h.key === key)
  if (existingIndex >= 0) {
    requestConfig.value.headers[existingIndex].value = value
  } else {
    requestConfig.value.headers.push({ key, value })
  }
}

const loadExample = () => {
  requestConfig.value = {
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    headers: [
      { key: 'Accept', value: 'application/json' },
      { key: 'Content-Type', value: 'application/json' }
    ],
    data: ''
  }
  ElMessage.success('已加载示例配置')
}

const loadRestApiExample = () => {
  requestConfig.value = {
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Accept', value: 'application/json' }
    ],
    data: JSON.stringify({
      title: '测试标题',
      body: '测试内容',
      userId: 1
    }, null, 2)
  }
  requestBodyType.value = 'json'
  ElMessage.success('已加载REST API示例')
}

const loadGraphQLExample = () => {
  requestConfig.value = {
    method: 'POST',
    url: 'https://api.github.com/graphql',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer YOUR_TOKEN_HERE' }
    ],
    data: JSON.stringify({
      query: `
        query {
          viewer {
            login
            name
          }
        }
      `
    }, null, 2)
  }
  requestBodyType.value = 'json'
  ElMessage.success('已加载GraphQL示例')
}

const loadWebhookExample = () => {
  requestConfig.value = {
    method: 'POST',
    url: 'https://webhook.site/your-webhook-url',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'User-Agent', value: 'OA-Tools/1.0' }
    ],
    data: JSON.stringify({
      event: 'user.created',
      timestamp: new Date().toISOString(),
      data: {
        user: {
          id: 12345,
          name: '张三',
          email: 'zhangsan@example.com'
        }
      }
    }, null, 2)
  }
  requestBodyType.value = 'json'
  ElMessage.success('已加载Webhook示例')
}
</script>

<style scoped>
.http-debug-tools {
  padding: 0;
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

.headers-section, .form-data-section {
  width: 100%;
}

.header-item, .form-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.colon {
  color: #606266;
  font-weight: bold;
}

.request-body {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
}

.no-response {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.response-content {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.response-status {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.response-time {
  color: #909399;
  font-size: 12px;
}

.response-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.json-content, .text-content {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
  margin: 0;
}

.response-headers {
  max-height: 400px;
  overflow-y: auto;
}

.header-line {
  display: flex;
  margin-bottom: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.header-key {
  color: #409eff;
  font-weight: bold;
  min-width: 150px;
}

.header-value {
  color: #606266;
  flex: 1;
  word-break: break-all;
}

.headers-display {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.request-line {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.request-url {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  color: #303133;
}

.presets-card {
  margin-top: 20px;
}

.error-card {
  margin-top: 20px;
}

:deep(.el-card__header) {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.el-tab-pane) {
  height: 100%;
  overflow-y: auto;
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
</style>