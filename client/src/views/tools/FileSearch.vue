<template>
  <div class="file-search-tools">
    <el-row :gutter="20">
      <!-- 搜索配置区域 -->
      <el-col :span="8">
        <div class="card-container">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>搜索配置</span>
                <el-button-group>
                  <el-button @click="loadExample" size="small">加载示例</el-button>
                  <el-button @click="clearForm" size="small">清空</el-button>
                </el-button-group>
              </div>
            </template>
            
            <el-form :model="searchConfig" label-width="80px" size="small">
              <el-form-item label="搜索路径">
                <el-input
                  v-model="searchConfig.searchPath"
                  placeholder="请输入搜索路径"
                />
              </el-form-item>
              
              <el-form-item label="搜索模式">
                <el-input
                  v-model="searchConfig.pattern"
                  placeholder="请输入文件名模式 (*.js)"
                />
              </el-form-item>
              
              <el-form-item label="搜索内容">
                <el-input
                  v-model="searchConfig.content"
                  placeholder="请输入文件内容搜索词"
                />
              </el-form-item>
              
              <el-form-item label="编码">
                <el-select v-model="searchConfig.encoding" style="width: 100%;">
                  <el-option label="UTF-8" value="utf8" />
                  <el-option label="GBK" value="gbk" />
                  <el-option label="ASCII" value="ascii" />
                  <el-option label="Base64" value="base64" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="选项">
                <el-checkbox v-model="searchConfig.caseSensitive">区分大小写</el-checkbox>
                <el-checkbox v-model="searchConfig.useRegex">使用正则</el-checkbox>
                <el-checkbox v-model="searchConfig.searchContent">搜索文件内容</el-checkbox>
              </el-form-item>
              
              <el-form-item>
                <el-button
                  type="primary"
                  @click="startSearch"
                  :loading="searching"
                  block
                >
                  <el-icon><Search /></el-icon>
                  开始搜索
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </el-col>
      
      <!-- 搜索结果区域 -->
      <el-col :span="16">
        <div class="card-container">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>搜索结果</span>
                <el-button-group>
                  <el-button @click="exportResults" size="small" :disabled="!results.length">导出</el-button>
                  <el-button @click="clearResults" size="small">清空</el-button>
                </el-button-group>
              </div>
            </template>
            
            <div v-if="!searching && !results.length" class="no-results">
              <el-empty description="暂无搜索结果" />
            </div>
            
            <div v-else class="results-container">
              <!-- 搜索进度 -->
              <div v-if="searching" class="search-progress">
                <el-progress :percentage="progress" :status="progressStatus" />
                <div class="progress-info">
                  <span>正在搜索: {{ searchConfig.searchPath }}</span>
                  <span>找到 {{ results.length }} 个匹配项</span>
                </div>
              </div>
              
              <!-- 结果统计 -->
              <div v-if="results.length" class="results-summary">
                <el-row :gutter="10">
                  <el-col :span="6">
                    <el-statistic title="文件总数" :value="stats.totalFiles" />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic title="匹配文件" :value="stats.matchedFiles" />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic title="匹配行数" :value="stats.totalMatches" />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic title="搜索耗时" :value="stats.searchTime" suffix="ms" />
                  </el-col>
                </el-row>
              </div>
              
              <!-- 结果列表 -->
              <div v-if="results.length" class="results-list">
                <el-collapse v-model="activeResult">
                  <el-collapse-item
                    v-for="(result, index) in results"
                    :key="index"
                    :name="index.toString()"
                  >
                    <template #title>
                      <div class="result-header">
                        <div class="file-info">
                          <el-icon><Document /></el-icon>
                          <span class="file-path">{{ result.filePath }}</span>
                          <el-tag size="small" type="info">{{ result.lineCount }} 行</el-tag>
                        </div>
                        <div class="match-info">
                          <el-tag size="small" type="success">{{ result.matches.length }} 匹配</el-tag>
                        </div>
                      </div>
                    </template>
                    
                    <div class="result-content">
                      <div class="file-meta">
                        <el-row :gutter="10">
                          <el-col :span="8">
                            <el-tag type="info">大小: {{ formatFileSize(result.size) }}</el-tag>
                          </el-col>
                          <el-col :span="8">
                            <el-tag type="warning">修改时间: {{ formatDate(result.modified) }}</el-tag>
                          </el-col>
                          <el-col :span="8">
                            <el-button size="small" @click="openFile(result.filePath)">
                              打开文件
                            </el-button>
                          </el-col>
                        </el-row>
                      </div>
                      
                      <div class="matches-container">
                        <h4>匹配内容:</h4>
                        <div
                          v-for="match in result.matches"
                          :key="match.lineNumber"
                          class="match-item"
                        >
                          <div class="match-header">
                            <el-tag size="small" type="primary">第 {{ match.lineNumber }} 行</el-tag>
                            <span v-if="match.context" class="context">
                              {{ match.context }}
                            </span>
                          </div>
                          <pre class="match-content">{{ match.content }}</pre>
                        </div>
                      </div>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>
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
              <el-button @click="setConfig('js')" size="small">JavaScript</el-button>
              <el-button @click="setConfig('vue')" size="small">Vue</el-button>
              <el-button @click="setConfig('python')" size="small">Python</el-button>
            </el-button-group>
          </el-col>
          
          <el-col :span="6">
            <el-button-group>
              <el-button @click="setConfig('css')" size="small">CSS</el-button>
              <el-button @click="setConfig('html')" size="small">HTML</el-button>
              <el-button @click="setConfig('json')" size="small">JSON</el-button>
            </el-button-group>
          </el-col>
          
          <el-col :span="6">
            <el-button-group>
              <el-button @click="setConfig('config')" size="small">配置文件</el-button>
              <el-button @click="setConfig('log')" size="small">日志文件</el-button>
            </el-button-group>
          </el-col>
          
          <el-col :span="6">
            <el-button @click="setCurrentPath" size="small">
              使用当前路径
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Document } from '@element-plus/icons-vue'
import { searchFiles } from '@/api/tools'

// 响应式数据
const searchConfig = ref({
  searchPath: '',
  pattern: '*.js',
  content: '',
  encoding: 'utf8',
  caseSensitive: false,
  useRegex: false,
  searchContent: true
})

const results = ref([])
const searching = ref(false)
const errorMessage = ref('')
const progress = ref(0)
const activeResult = ref('')

// 计算属性
const stats = computed(() => {
  const totalFiles = results.value.length
  const matchedFiles = results.value.filter(r => r.matches.length > 0).length
  const totalMatches = results.value.reduce((sum, r) => sum + r.matches.length, 0)
  
  return {
    totalFiles,
    matchedFiles,
    totalMatches,
    searchTime: searching.value ? 0 : Date.now() - startTime
  }
})

const progressStatus = computed(() => {
  if (progress.value >= 100) return 'success'
  if (progress.value > 0) return undefined
  return 'exception'
})

let startTime = 0

// 方法
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

const openFile = (filePath) => {
  ElMessage.info(`打开文件: ${filePath}`)
  // 这里可以集成文件编辑器或系统默认程序
}

const clearForm = () => {
  searchConfig.value = {
    searchPath: '',
    pattern: '*.js',
    content: '',
    encoding: 'utf8',
    caseSensitive: false,
    useRegex: false,
    searchContent: true
  }
  clearResults()
}

const clearResults = () => {
  results.value = []
  progress.value = 0
  errorMessage.value = ''
  activeResult.value = ''
}

const startSearch = async () => {
  if (!searchConfig.value.searchPath) {
    ElMessage.warning('请输入搜索路径')
    return
  }
  
  if (!searchConfig.value.pattern && !searchConfig.value.content) {
    ElMessage.warning('请至少设置文件模式或搜索内容')
    return
  }
  
  searching.value = true
  errorMessage.value = ''
  clearResults()
  startTime = Date.now()
  progress.value = 0
  
  try {
    const response = await searchFiles(searchConfig.value)
    
    if (response.success) {
      results.value = response.data.results || []
      progress.value = 100
      ElMessage.success(`搜索完成，找到 ${results.value.length} 个匹配文件`)
    } else {
      errorMessage.value = response.message || '搜索失败'
      ElMessage.error('搜索失败')
    }
  } catch (error) {
    errorMessage.value = error.message || '搜索请求失败'
    ElMessage.error('搜索失败')
  } finally {
    searching.value = false
  }
}

const exportResults = () => {
  if (!results.value.length) {
    ElMessage.warning('没有结果可导出')
    return
  }
  
  const exportData = {
    searchConfig: searchConfig.value,
    results: results.value,
    stats: stats.value,
    exportTime: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `file-search-results-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('搜索结果已导出')
}

const setConfig = (type) => {
  const configs = {
    js: {
      pattern: '*.js',
      content: '',
      encoding: 'utf8',
      caseSensitive: false,
      useRegex: false,
      searchContent: false
    },
    vue: {
      pattern: '*.vue',
      content: '',
      encoding: 'utf8',
      caseSensitive: false,
      useRegex: false,
      searchContent: false
    },
    python: {
      pattern: '*.py',
      content: '',
      encoding: 'utf8',
      caseSensitive: false,
      useRegex: false,
      searchContent: false
    },
    css: {
      pattern: '*.css',
      content: '',
      encoding: 'utf8',
      caseSensitive: false,
      useRegex: false,
      searchContent: false
    },
    html: {
      pattern: '*.html',
      content: '',
      encoding: 'utf8',
      caseSensitive: false,
      useRegex: false,
      searchContent: false
    },
    json: {
      pattern: '*.json',
      content: '',
      encoding: 'utf8',
      caseSensitive: false,
      useRegex: false,
      searchContent: true
    },
    config: {
      pattern: '*.{json,xml,yaml,yml,ini,conf}',
      content: '',
      encoding: 'utf8',
      caseSensitive: false,
      useRegex: false,
      searchContent: true
    },
    log: {
      pattern: '*.log',
      content: '',
      encoding: 'utf8',
      caseSensitive: true,
      useRegex: false,
      searchContent: true
    }
  }
  
  const config = configs[type]
  if (config) {
    Object.assign(searchConfig.value, config)
    ElMessage.success(`已加载 ${type.toUpperCase()} 文件搜索配置`)
  }
}

const setCurrentPath = () => {
  searchConfig.value.searchPath = window.location.pathname
  ElMessage.success('已设置当前路径为搜索路径')
}

const loadExample = () => {
  searchConfig.value = {
    searchPath: './src',
    pattern: '*.js',
    content: 'import',
    encoding: 'utf8',
    caseSensitive: false,
    useRegex: false,
    searchContent: true
  }
  ElMessage.success('已加载示例配置')
}
</script>

<style scoped>
.file-search-tools {
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

.no-results {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.results-container {
  min-height: 400px;
}

.search-progress {
  margin-bottom: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: #606266;
}

.results-summary {
  margin-bottom: 20px;
}

.results-list {
  max-height: 600px;
  overflow-y: auto;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-path {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: #303133;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-content {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.file-meta {
  margin-bottom: 16px;
}

.matches-container h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.match-item {
  margin-bottom: 16px;
  padding: 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.match-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.context {
  color: #909399;
  font-size: 12px;
}

.match-content {
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
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

:deep(.el-collapse-item__header) {
  padding: 0 16px;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}

:deep(.el-statistic .el-statistic__content) {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

:deep(.el-row) {
  margin-bottom: 10px;
}

:deep(.el-col) {
  padding: 5px;
}

:deep(.el-checkbox) {
  margin-right: 16px;
}

:deep(.el-progress) {
  margin-bottom: 8px;
}
</style>