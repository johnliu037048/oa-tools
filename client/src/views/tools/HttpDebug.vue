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
                  <el-button @click="openBulkImportDialog" size="small">导入URL</el-button>
                  <el-button @click="openSaveModal" size="small" type="primary">保存</el-button>
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
              
              <el-form-item label="超时时间">
                <el-input-number
                  v-model="requestConfig.timeout"
                  :min="1000"
                  :max="300000"
                  :step="1000"
                  style="width: 150px;"
                  controls-position="right"
                />
                <span class="timeout-unit">毫秒</span>
                <el-text size="small" type="info" style="margin-left: 8px;">
                  默认30秒，范围1-300秒
                </el-text>
              </el-form-item>
              
              <!-- Params 和 Headers 标签页 -->
              <el-form-item label="参数设置">
                <el-tabs v-model="activeParamTab" type="card" size="small">
                  <el-tab-pane label="Query Params" name="params">
                    <div class="params-section">
                      <div v-for="(param, index) in requestConfig.params" :key="index" class="param-item">
                        <el-input
                          v-model="param.key"
                          placeholder="参数名"
                          style="width: 40%;"
                          @input="updateParamKey(index)"
                        />
                        <span class="colon">=</span>
                        <el-input
                          v-model="param.value"
                          placeholder="参数值"
                          style="width: 40%;"
                        />
                        <el-button
                          type="danger"
                          size="small"
                          @click="removeParam(index)"
                          :disabled="requestConfig.params.length === 1"
                          circle
                        >
                          <el-icon><Close /></el-icon>
                        </el-button>
                      </div>
                      <el-button @click="addParam" size="small" type="primary" plain>
                        <el-icon><Plus /></el-icon>
                        添加参数
                      </el-button>
                    </div>
                  </el-tab-pane>
                  
                  <el-tab-pane label="Headers" name="headers">
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
                  </el-tab-pane>
                </el-tabs>
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

    <el-dialog v-model="saveModalVisible" title="保存请求配置" width="400px">
      <el-form :model="saveForm" label-width="80px" style="margin-top: 12px;">
        <el-form-item label="名称" required>
          <el-input v-model="saveForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="目录">
          <el-input v-model="saveForm.category" placeholder="请输入目录（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCurrentRequest">保存</el-button>
      </template>
    </el-dialog>

    <div class="card-container" style="margin-top: 24px;">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>已保存请求</span>
            <el-button-group>
              <el-button @click="clearSavedRequests" size="small" type="danger" :disabled="!savedRequests.length">清空全部</el-button>
            </el-button-group>
          </div>
        </template>

        <div v-if="!savedRequests.length" style="padding: 16px;">暂无已保存请求，使用“保存”按钮持久化当前配置。</div>

        <el-collapse v-else v-model="activeSavedCategory" accordion>
          <el-collapse-item v-for="(items, category) in groupedSavedRequests" :key="category" :title="category" :name="category">
            <el-table :data="items" size="small" style="width: 100%;" border>
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="method" label="方法" width="80" />
              <el-table-column prop="url" label="URL" />
              <el-table-column label="操作" width="170">
                <template #default="{ row }">
                  <el-button size="mini" type="primary" @click="loadSavedRequest(row)">加载</el-button>
                  <el-button size="mini" type="danger" @click="deleteSavedRequest(row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </el-card>
    </div>
  </div>

  <el-dialog v-model="bulkImportDialogVisible" title="批量导入 URL / cURL" width="600px">
    <div>
      <p>支持粘贴多行 URL、cURL 命令或自定义格式：</p>
      <el-input
        v-model="bulkImportText"
        type="textarea"
        :rows="8"
        placeholder="格式示例：

1. 简单URL：
https://api.example.com/foo

2. cURL命令：
curl -X POST -H 'Content-Type: application/json' https://api.example.com/foo

3. 自定义多行格式：
POST https://api.example.com/foo
Content-Type: application/json
Authorization: Bearer token

{&quot;key&quot;: &quot;value&quot;}"
      />
    </div>
    <template #footer>
      <el-button @click="bulkImportDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleBulkImport">导入并加载</el-button>
      <el-button type="success" @click="pasteFromClipboard">从剪贴板粘贴</el-button>
    </template>
  </el-dialog>
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
  data: '',
  timeout: 30000,
  params: [{ key: '', value: '' }]
})

const formData = ref([{ key: '', value: '' }])
const requestBodyType = ref('json')
const sending = ref(false)
const response = ref(null)
const responseTime = ref(0)
const errorMessage = ref('')
const activeResponseTab = ref('body')

const saveModalVisible = ref(false)
const saveForm = ref({ name: '', category: '' })
const savedRequests = ref([])
const activeSavedCategory = ref('')
const activeParamTab = ref('params')

const bulkImportDialogVisible = ref(false)
const bulkImportText = ref('')

const STORAGE_KEY = 'oa-tools-http-debug-saved-requests'

const loadSavedRequests = () => {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (Array.isArray(data)) {
      savedRequests.value = data
    } else {
      savedRequests.value = []
    }
  } catch (e) {
    savedRequests.value = []
  }
}

const persistSavedRequests = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRequests.value))
}

const groupedSavedRequests = computed(() => {
  return savedRequests.value.reduce((acc, item) => {
    const category = item.category || '未分类'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {})
})

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
  return requestConfig.value.headers
    .filter(h => h.key)
    .map(h => ({ key: h.key, value: h.value == null ? '' : h.value }))
})

const effectiveParams = computed(() => {
  return requestConfig.value.params
    .filter(p => p.key)
    .map(p => ({ key: p.key, value: p.value == null ? '' : p.value }))
})

// 方法
const parseUrlParams = (url) => {
  try {
    const urlObj = new URL(url)
    const params = []
    
    for (const [key, value] of urlObj.searchParams) {
      params.push({ key, value })
    }
    
    // 如果没有参数，至少保留一个空行
    if (params.length === 0) {
      params.push({ key: '', value: '' })
    }
    
    return params
  } catch (error) {
    // URL无效时返回空参数
    return [{ key: '', value: '' }]
  }
}

const buildUrlWithParams = (baseUrl, params) => {
  try {
    const urlObj = new URL(baseUrl)
    
    // 清除现有的查询参数
    urlObj.search = ''
    
    // 添加有效的参数（key必需，value允许空）
    params.forEach(param => {
      if (param.key != null && param.key !== '') {
        urlObj.searchParams.append(param.key, param.value == null ? '' : param.value)
      }
    })
    
    return urlObj.toString()
  } catch (error) {
    // 如果URL无效，返回原URL
    return baseUrl
  }
}

const validateUrl = () => {
  if (!requestConfig.value.url) return
  
  // 自动解析URL中的查询参数
  const parsedParams = parseUrlParams(requestConfig.value.url)
  
  // 如果URL中有参数，更新params（但不覆盖用户已设置的参数，除非是空状态）
  const hasExistingParams = requestConfig.value.params.some(p => p.key || p.value)
  if (!hasExistingParams && parsedParams.length > 0 && parsedParams[0].key) {
    requestConfig.value.params = parsedParams
  }
  
  // 移除URL中的查询参数，保持干净的URL
  try {
    const urlObj = new URL(requestConfig.value.url)
    urlObj.search = ''
    requestConfig.value.url = urlObj.toString()
  } catch (error) {
    // URL无效，保持原样
  }
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

const addParam = () => {
  requestConfig.value.params.push({ key: '', value: '' })
}

const removeParam = (index) => {
  if (requestConfig.value.params.length > 1) {
    requestConfig.value.params.splice(index, 1)
  }
}

const updateParamKey = (index) => {
  // 可以在这里添加参数处理逻辑
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
      url: buildUrlWithParams(requestConfig.value.url, effectiveParams.value),
      headers: {},
      timeout: requestConfig.value.timeout
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
          if (item.key != null && item.key !== '') {
            formObj[item.key] = item.value == null ? '' : item.value
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
    params: [{ key: '', value: '' }],
    data: '',
    timeout: 30000
  }
  formData.value = [{ key: '', value: '' }]
  requestBodyType.value = 'json'
  errorMessage.value = ''
}

const openSaveModal = () => {
  saveForm.value = {
    name: requestConfig.value.url ? `${requestConfig.value.method} ${requestConfig.value.url}` : '',
    category: ''
  }
  saveModalVisible.value = true
}

const saveCurrentRequest = () => {
  if (!requestConfig.value.url) {
    ElMessage.warning('请先输入请求 URL 再保存')
    return
  }

  if (!saveForm.value.name.trim()) {
    ElMessage.warning('请输入保存名称')
    return
  }

  const existingIndex = savedRequests.value.findIndex(item => item.name === saveForm.value.name && item.category === saveForm.value.category)

  const record = {
    id: existingIndex >= 0 ? savedRequests.value[existingIndex].id : Date.now(),
    name: saveForm.value.name.trim(),
    category: saveForm.value.category.trim(),
    method: requestConfig.value.method,
    url: requestConfig.value.url,
    headers: requestConfig.value.headers,
    params: requestConfig.value.params,
    requestBodyType: requestBodyType.value,
    data: requestConfig.value.data,
    formData: formData.value,
    timeout: requestConfig.value.timeout
  }

  if (existingIndex >= 0) {
    savedRequests.value.splice(existingIndex, 1, record)
    ElMessage.success('已更新保存配置')
  } else {
    savedRequests.value.push(record)
    ElMessage.success('已保存请求配置')
  }

  persistSavedRequests()
  saveModalVisible.value = false
}

const loadSavedRequest = (item) => {
  requestConfig.value.method = item.method
  requestConfig.value.url = item.url
  requestConfig.value.headers = item.headers && item.headers.length ? item.headers : [{ key: '', value: '' }]
  requestConfig.value.params = item.params && item.params.length ? item.params : [{ key: '', value: '' }]
  requestBodyType.value = item.requestBodyType || 'json'
  requestConfig.value.data = item.data || ''
  requestConfig.value.timeout = item.timeout || 30000
  formData.value = item.formData && item.formData.length ? item.formData : [{ key: '', value: '' }]
  ElMessage.success(`已加载：${item.name}`)
}

const deleteSavedRequest = (id) => {
  savedRequests.value = savedRequests.value.filter(item => item.id !== id)
  persistSavedRequests()
  ElMessage.success('已删除保存配置')
}

const clearSavedRequests = () => {
  savedRequests.value = []
  persistSavedRequests()
  ElMessage.success('已清空所有保存配置')
}

const openBulkImportDialog = () => {
  bulkImportText.value = ''
  bulkImportDialogVisible.value = true
}

// 导出请求配置（类似 Postman）
const exportRequest = () => {
  const exportData = {
    name: 'HTTP Request',
    request: {
      method: requestConfig.value.method,
      url: requestConfig.value.url,
      timeout: requestConfig.value.timeout,
      params: requestConfig.value.params
        .filter(p => p.key && p.value)
        .map(p => ({ key: p.key, value: p.value })),
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
          requestConfig.value.timeout = data.request.timeout || 30000
          
          // 导入查询参数
          if (data.request.params && Array.isArray(data.request.params)) {
            requestConfig.value.params = data.request.params.map(p => ({
              key: p.key || '',
              value: p.value || ''
            }))
          } else {
            requestConfig.value.params = [{ key: '', value: '' }]
          }
          
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
          } else {
            requestConfig.value.headers = [{ key: '', value: '' }]
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
          requestConfig.value.timeout = data.timeout || 30000
          
          if (data.params && Array.isArray(data.params)) {
            requestConfig.value.params = data.params.map(p => ({
              key: p.key || '',
              value: p.value || ''
            }))
          } else {
            requestConfig.value.params = [{ key: '', value: '' }]
          }
          
          if (data.headers && Array.isArray(data.headers)) {
            requestConfig.value.headers = data.headers.map(h => ({
              key: h.key || '',
              value: h.value || ''
            }))
          } else {
            requestConfig.value.headers = [{ key: '', value: '' }]
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

const parseCurlCommand = (text) => {
  // 预处理：移除行尾的反斜杠和多余的空白
  const cleanedText = text
    .replace(/\\\s*$/gm, '') // 移除行尾的反斜杠
    .replace(/\s+/g, ' ') // 将多行合并为一行
    .trim()

  const curlRegex = /curl\s+(.+)/
  const match = cleanedText.match(curlRegex)
  if (!match) return null

  const argsString = match[1]

  // 使用更健壮的方式解析参数，支持单引号和双引号
  const args = []
  let current = ''
  let inSingleQuote = false
  let inDoubleQuote = false
  let escaped = false

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i]

    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote
      continue
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote
      continue
    }

    if (char === ' ' && !inSingleQuote && !inDoubleQuote) {
      if (current.trim()) {
        args.push(current.trim())
        current = ''
      }
      continue
    }

    current += char
  }

  if (current.trim()) {
    args.push(current.trim())
  }

  let method = 'GET'
  let url = ''
  const headers = []
  let data = ''

  for (let i = 0; i < args.length; i++) {
    const token = args[i]

    if (token === '-X' || token === '--request') {
      method = (args[++i] || 'GET').toUpperCase()
    } else if (token === '-H' || token === '--header') {
      const headerText = (args[++i] || '').replace(/^['"]|['"]$/g, '')
      // 改进的header解析：找到第一个冒号作为分隔符
      const colonIndex = headerText.indexOf(':')
      if (colonIndex > 0) {
        const key = headerText.substring(0, colonIndex).trim()
        const value = headerText.substring(colonIndex + 1).trim()
        if (key) {
          headers.push({ key, value })
        }
      }
    } else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary') {
      data = (args[++i] || '').replace(/^['"]|['"]$/g, '')
      if (method === 'GET') method = 'POST'
    } else if (!token.startsWith('-') && !url) {
      url = token.replace(/^['"]|['"]$/g, '')
    }
  }

  return { method, url, headers: headers.length ? headers : [{ key: '', value: '' }], data, params: [{ key: '', value: '' }] }
}

const applyImportedRequest = (imported) => {
  if (!imported || !imported.url) {
    ElMessage.error('无法解析 URL')
    return
  }

  requestConfig.value.method = imported.method || 'GET'
  requestConfig.value.url = imported.url
  requestConfig.value.timeout = imported.timeout || 30000
  requestConfig.value.headers = imported.headers && imported.headers.length ? imported.headers : [{ key: '', value: '' }]
  requestConfig.value.params = imported.params && imported.params.length ? imported.params : [{ key: '', value: '' }]
  requestBodyType.value = imported.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(imported.method) ? 'json' : 'json'
  requestConfig.value.data = imported.data || ''
  formData.value = [{ key: '', value: '' }]

  // 解析URL中的查询参数
  parseUrlParams(requestConfig.value.url)

  bulkImportDialogVisible.value = false
  ElMessage.success('导入并加载完成')
}

const handleBulkImport = async () => {
  const text = bulkImportText.value.trim()
  if (!text) {
    ElMessage.warning('请输入 URL 或 cURL 文本')
    return
  }

  let request = null

  if (text.toLowerCase().startsWith('curl')) {
    request = parseCurlCommand(text)
  } else {
    // 可能是多行 URL 或自定义格式
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) {
      ElMessage.warning('未找到有效 URL')
      return
    }

    const first = lines[0]
    // 检查是否是 "METHOD URL" 格式
    const methodUrlMatch = first.match(/^(\w+)\s+(.+)$/)
    let method = 'GET'
    let url = first

    if (methodUrlMatch) {
      method = methodUrlMatch[1].toUpperCase()
      url = methodUrlMatch[2]
    }

    const headers = []
    let data = ''
    let isHeaderSection = true

    // 解析后续行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]

      if (isHeaderSection) {
        // 检查是否是请求头（包含冒号）
        const headerMatch = line.match(/^([^:]+):\s*(.+)$/)
        if (headerMatch) {
          headers.push({
            key: headerMatch[1].trim(),
            value: headerMatch[2].trim()
          })
        } else if (line.startsWith('{') || line.startsWith('[')) {
          // 可能是JSON数据
          isHeaderSection = false
          data = line
        } else if (line) {
          // 非空行，可能是请求体开始
          isHeaderSection = false
          data = line
        }
      } else {
        // 请求体部分
        data += (data ? '\n' : '') + line
      }
    }

    request = {
      method,
      url,
      headers: headers.length ? headers : [{ key: '', value: '' }],
      data,
      params: [{ key: '', value: '' }]
    }
  }

  applyImportedRequest(request)
}

const pasteFromClipboard = async () => {
  try {
    const clipboard = await navigator.clipboard.readText()
    if (!clipboard) {
      ElMessage.warning('剪贴板内容为空')
      return
    }
    bulkImportText.value = clipboard
    ElMessage.success('已从剪贴板加载内容，可直接点击导入')
  } catch (err) {
    ElMessage.error('读取剪贴板失败，请在浏览器允许剪贴板权限后重试')
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
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: [
      { key: 'Accept', value: 'application/json' },
      { key: 'Content-Type', value: 'application/json' }
    ],
    params: [
      { key: 'userId', value: '1' },
      { key: '_limit', value: '5' }
    ],
    data: '',
    timeout: 30000
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
    }, null, 2),
    timeout: 30000
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
    }, null, 2),
    timeout: 30000
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
    }, null, 2),
    timeout: 30000
  }
  requestBodyType.value = 'json'
  ElMessage.success('已加载Webhook示例')
}

loadSavedRequests()
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

.headers-section, .form-data-section, .params-section {
  width: 100%;
  padding: 6px 0;
}

.header-item, .param-item, .form-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.header-item .el-input, .param-item .el-input, .form-item .el-input {
  flex: 1;
  min-width: 120px;
}

.colon {
  color: #909399;
  font-weight: bold;
  width: 16px;
  text-align: center;
}

.params-section .el-button,
.headers-section .el-button {
  margin-top: 4px;
  min-width: 120px;
}

.param-item .el-button,
.header-item .el-button {
  flex-shrink: 0;
}

.timeout-unit {
  margin-left: 8px;
  color: #606266;
  font-size: 14px;
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