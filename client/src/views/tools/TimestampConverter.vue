<template>
  <div class="timestamp-converter-tools">
    <el-row :gutter="20">
      <!-- 实时时间显示 -->
      <el-col :span="24">
        <div class="card-container">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>实时时间</span>
                <el-button-group>
                  <el-button @click="startRealTime" size="small" type="primary" :disabled="realTimeActive">
                    <el-icon><VideoPlay /></el-icon>
                    开始
                  </el-button>
                  <el-button @click="stopRealTime" size="small" type="warning" :disabled="!realTimeActive">
                    <el-icon><VideoPause /></el-icon>
                    停止
                  </el-button>
                  <el-button @click="updateCurrentTime" size="small">刷新</el-button>
                </el-button-group>
              </div>
            </template>
            
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="time-display">
                  <div class="time-value">{{ currentTime.seconds }}</div>
                  <div class="time-label">秒级时间戳</div>
                </div>
              </el-col>
              
              <el-col :span="6">
                <div class="time-display">
                  <div class="time-value">{{ currentTime.milliseconds }}</div>
                  <div class="time-label">毫秒级时间戳</div>
                </div>
              </el-col>
              
              <el-col :span="6">
                <div class="time-display">
                  <div class="time-value">{{ currentTime.local }}</div>
                  <div class="time-label">本地时间</div>
                </div>
              </el-col>
              
              <el-col :span="6">
                <div class="time-display">
                  <div class="time-value">{{ currentTime.utc }}</div>
                  <div class="time-label">UTC时间</div>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </div>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 24px;">
      <!-- 时间戳转日期 -->
      <el-col :span="12">
        <div class="card-container">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>时间戳转日期</span>
                <el-button-group>
                  <el-button @click="clearTimestampInput" size="small">清空</el-button>
                  <el-button @click="useCurrentTimestamp" size="small">使用当前时间戳</el-button>
                </el-button-group>
              </div>
            </template>
            
            <div class="convert-section">
              <el-form :model="timestampForm" label-width="80px">
                <el-form-item label="时间戳">
                  <el-input
                    v-model="timestampForm.timestamp"
                    placeholder="请输入时间戳"
                    @input="convertTimestampToDate"
                  >
                    <template #append>
                      <el-select v-model="timestampForm.precision" size="small" style="width: 80px;">
                        <el-option label="秒" value="seconds" />
                        <el-option label="毫秒" value="milliseconds" />
                      </el-select>
                    </template>
                  </el-input>
                </el-form-item>
                
                <el-form-item label="时区">
                  <el-select v-model="timestampForm.timezone" style="width: 100%;">
                    <el-option
                      v-for="tz in timezones"
                      :key="tz.value"
                      :label="tz.label"
                      :value="tz.value"
                    />
                  </el-select>
                </el-form-item>
              </el-form>
              
              <div v-if="convertedDate" class="result-section">
                <el-divider>转换结果</el-divider>
                <div class="date-info">
                  <div class="date-item">
                    <label>完整日期时间：</label>
                    <span class="date-value">{{ convertedDate.full }}</span>
                    <el-button @click="copyDateValue(convertedDate.full)" size="small" text>复制</el-button>
                  </div>
                  
                  <div class="date-item">
                    <label>日期：</label>
                    <span class="date-value">{{ convertedDate.date }}</span>
                    <el-button @click="copyDateValue(convertedDate.date)" size="small" text>复制</el-button>
                  </div>
                  
                  <div class="date-item">
                    <label>时间：</label>
                    <span class="date-value">{{ convertedDate.time }}</span>
                    <el-button @click="copyDateValue(convertedDate.time)" size="small" text>复制</el-button>
                  </div>
                  
                  <div class="date-item">
                    <label>星期：</label>
                    <span class="date-value">{{ convertedDate.weekday }}</span>
                    <el-button @click="copyDateValue(convertedDate.weekday)" size="small" text>复制</el-button>
                  </div>
                  
                  <div class="date-item">
                    <label>相对时间：</label>
                    <span class="date-value">{{ convertedDate.relative }}</span>
                    <el-button @click="copyDateValue(convertedDate.relative)" size="small" text>复制</el-button>
                  </div>
                </div>
              </div>
            </div>
            </el-card>
          </div>
        </el-col>
        
        <!-- 日期转时间戳 -->
        <el-col :span="12">
          <div class="card-container">
            <el-card>
            <template #header>
              <div class="card-header">
                <span>日期转时间戳</span>
                <el-button-group>
                  <el-button @click="clearDateInput" size="small">清空</el-button>
                  <el-button @click="useCurrentDate" size="small">使用当前时间</el-button>
                </el-button-group>
              </div>
            </template>
            
            <div class="convert-section">
              <el-form :model="dateForm" label-width="80px">
                <el-form-item label="日期">
                  <el-date-picker
                    v-model="dateForm.date"
                    type="datetime"
                    placeholder="选择日期时间"
                    style="width: 100%;"
                    @change="convertDateToTimestamp"
                  />
                </el-form-item>
                
                <el-form-item label="格式">
                  <el-select v-model="dateForm.format" style="width: 100%;">
                    <el-option label="YYYY-MM-DD HH:mm:ss" value="YYYY-MM-DD HH:mm:ss" />
                    <el-option label="YYYY/MM/DD HH:mm:ss" value="YYYY/MM/DD HH:mm:ss" />
                    <el-option label="MM/DD/YYYY HH:mm:ss" value="MM/DD/YYYY HH:mm:ss" />
                    <el-option label="DD/MM/YYYY HH:mm:ss" value="DD/MM/YYYY HH:mm:ss" />
                    <el-option label="Unix时间戳(秒)" value="unix-seconds" />
                    <el-option label="Unix时间戳(毫秒)" value="unix-milliseconds" />
                  </el-select>
                </el-form-item>
              </el-form>
              
              <div v-if="convertedTimestamp" class="result-section">
                <el-divider>转换结果</el-divider>
                <div class="timestamp-info">
                  <div class="timestamp-item">
                    <label>秒级时间戳：</label>
                    <span class="timestamp-value">{{ convertedTimestamp.seconds }}</span>
                    <el-button @click="copyTimestampValue(convertedTimestamp.seconds)" size="small" text>复制</el-button>
                  </div>
                  
                  <div class="timestamp-item">
                    <label>毫秒级时间戳：</label>
                    <span class="timestamp-value">{{ convertedTimestamp.milliseconds }}</span>
                    <el-button @click="copyTimestampValue(convertedTimestamp.milliseconds)" size="small" text>复制</el-button>
                  </div>
                  
                  <div class="timestamp-item">
                    <label>格式化日期：</label>
                    <span class="timestamp-value">{{ convertedTimestamp.formatted }}</span>
                    <el-button @click="copyTimestampValue(convertedTimestamp.formatted)" size="small" text>复制</el-button>
                  </div>
                </div>
              </div>
            </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
      
      <!-- 时区转换 -->
      <el-row :gutter="20" style="margin-top: 24px;">
        <el-col :span="24">
          <div class="card-container">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>时区转换</span>
                <el-button-group>
                  <el-button @click="useCurrentTimeForConversion" size="small">使用当前时间</el-button>
                  <el-button @click="swapTimezones" size="small">交换时区</el-button>
                </el-button-group>
              </div>
            </template>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="timezone-section">
                  <h4>源时区</h4>
                  <el-form :model="timezoneForm.source" label-width="60px">
                    <el-form-item label="时区">
                      <el-select v-model="timezoneForm.source.timezone" style="width: 100%;">
                        <el-option
                          v-for="tz in timezones"
                          :key="tz.value"
                          :label="tz.label"
                          :value="tz.value"
                        />
                      </el-select>
                    </el-form-item>
                    
                    <el-form-item label="时间">
                      <el-date-picker
                        v-model="timezoneForm.source.datetime"
                        type="datetime"
                        placeholder="选择时间"
                        style="width: 100%;"
                        @change="convertTimezone"
                      />
                    </el-form-item>
                  </el-form>
                  
                  <div v-if="timezoneForm.source.datetime" class="timezone-result">
                    <el-tag type="info" size="large">{{ timezoneForm.source.datetime.toLocaleString('zh-CN', { timeZone: timezoneForm.source.timezone }) }}</el-tag>
                  </div>
                </div>
              </el-col>
              
              <el-col :span="12">
                <div class="timezone-section">
                  <h4>目标时区</h4>
                  <el-form :model="timezoneForm.target" label-width="60px">
                    <el-form-item label="时区">
                      <el-select v-model="timezoneForm.target.timezone" style="width: 100%;" @change="convertTimezone">
                        <el-option
                          v-for="tz in timezones"
                          :key="tz.value"
                          :label="tz.label"
                          :value="tz.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-form>
                  
                  <div v-if="timezoneForm.target.datetime" class="timezone-result">
                    <el-tag type="success" size="large">{{ timezoneForm.target.datetime.toLocaleString('zh-CN', { timeZone: timezoneForm.target.timezone }) }}</el-tag>
                  </div>
                </div>
              </el-col>
            </el-row>
            
            <div v-if="timezoneConversionResult" class="conversion-result">
              <el-divider>转换结果</el-divider>
              <div class="result-info">
                <div class="result-item">
                  <label>时间差：</label>
                  <span class="result-value">{{ timezoneConversionResult.diff }}</span>
                </div>
                
                <div class="result-item">
                  <label>相对时间：</label>
                  <span class="result-value">{{ timezoneConversionResult.relative }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>
    
    <!-- 日期计算 -->
      <el-row :gutter="20" style="margin-top: 24px;">
        <el-col :span="12">
          <div class="card-container">
            <el-card>
              <template #header>
                <span>时间差计算</span>
              </template>
            
            <div class="calc-section">
              <el-form :model="diffForm" label-width="80px">
                <el-form-item label="开始时间">
                  <el-date-picker
                    v-model="diffForm.start"
                    type="datetime"
                    placeholder="选择开始时间"
                    style="width: 100%;"
                  />
                </el-form-item>
                
                <el-form-item label="结束时间">
                  <el-date-picker
                    v-model="diffForm.end"
                    type="datetime"
                    placeholder="选择结束时间"
                    style="width: 100%;"
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="calculateTimeDiff" :loading="calculating">计算时间差</el-button>
                </el-form-item>
              </el-form>
              
              <div v-if="timeDiffResult" class="diff-result">
                <el-divider>计算结果</el-divider>
                <div class="diff-info">
                  <div class="diff-item">
                    <label>相差天数：</label>
                    <span class="diff-value">{{ timeDiffResult.days }} 天</span>
                  </div>
                  
                  <div class="diff-item">
                    <label>相差小时：</label>
                    <span class="diff-value">{{ timeDiffResult.hours }} 小时</span>
                  </div>
                  
                  <div class="diff-item">
                    <label>相差分钟：</label>
                    <span class="diff-value">{{ timeDiffResult.minutes }} 分钟</span>
                  </div>
                  
                  <div class="diff-item">
                    <label>相差秒数：</label>
                    <span class="diff-value">{{ timeDiffResult.seconds }} 秒</span>
                  </div>
                  
                  <div class="diff-item">
                    <label>相差毫秒：</label>
                    <span class="diff-value">{{ timeDiffResult.milliseconds }} 毫秒</span>
                  </div>
                </div>
              </div>
            </div>
            </el-card>
          </div>
        </el-col>
        
        <el-col :span="12">
          <div class="card-container">
            <el-card>
              <template #header>
                <span>日期加减</span>
              </template>
            
            <div class="calc-section">
              <el-form :model="calcForm" label-width="80px">
                <el-form-item label="基准时间">
                  <el-date-picker
                    v-model="calcForm.baseDate"
                    type="datetime"
                    placeholder="选择基准时间"
                    style="width: 100%;"
                  />
                </el-form-item>
                
                <el-form-item label="操作">
                  <el-select v-model="calcForm.operation" style="width: 100%;">
                    <el-option label="加" value="add" />
                    <el-option label="减" value="subtract" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="数值">
                  <el-input-number v-model="calcForm.value" :min="0" style="width: 100%;" />
                </el-form-item>
                
                <el-form-item label="单位">
                  <el-select v-model="calcForm.unit" style="width: 100%;">
                    <el-option label="年" value="years" />
                    <el-option label="月" value="months" />
                    <el-option label="日" value="days" />
                    <el-option label="小时" value="hours" />
                    <el-option label="分钟" value="minutes" />
                    <el-option label="秒" value="seconds" />
                    <el-option label="毫秒" value="milliseconds" />
                  </el-select>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="calculateDateOffset" :loading="calculating">计算结果</el-button>
                </el-form-item>
              </el-form>
              
              <div v-if="dateOffsetResult" class="calc-result">
                <el-divider>计算结果</el-divider>
                <div class="offset-info">
                  <div class="offset-item">
                    <label>结果日期：</label>
                    <span class="offset-value">{{ dateOffsetResult.date }}</span>
                    <el-button @click="copyDateValue(dateOffsetResult.date)" size="small" text>复制</el-button>
                  </div>
                  
                  <div class="offset-item">
                    <label>时间戳：</label>
                    <span class="offset-value">{{ dateOffsetResult.timestamp }}</span>
                    <el-button @click="copyTimestampValue(dateOffsetResult.timestamp)" size="small" text>复制</el-button>
                  </div>
                </div>
              </div>
            </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
      
      <!-- 预设配置 -->
      <el-row :gutter="20" style="margin-top: 24px;">
        <el-col :span="24">
          <div class="card-container">
            <el-card>
            <template #header>
              <div class="card-header">
                <span>常用时间戳示例</span>
                <el-button-group>
                  <el-button @click="loadTimestampExample('unix-zero')" size="small">Unix零时</el-button>
                  <el-button @click="loadTimestampExample('current')" size="small">当前时间</el-button>
                  <el-button @click="loadTimestampExample('year-2000')" size="small">2000年</el-button>
                  <el-button @click="loadTimestampExample('covid-start')" size="small">2020年疫情开始</el-button>
                </el-button-group>
              </div>
            </template>
            
            <el-row :gutter="20">
              <el-col :span="6" v-for="example in timestampExamples" :key="example.label">
                <div class="example-card" @click="loadExampleTimestamp(example.timestamp)">
                  <h4>{{ example.label }}</h4>
                  <div class="example-timestamp">{{ example.timestamp }}</div>
                  <div class="example-date">{{ example.date }}</div>
                </div>
              </el-col>
            </el-row>
            </el-card>
          </div>
        </el-col>
      </el-row>
      
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, VideoPause } from '@element-plus/icons-vue'

// 响应式数据
const realTimeActive = ref(false)
const realTimeInterval = ref(null)

const currentTime = ref({
  seconds: '',
  milliseconds: '',
  local: '',
  utc: ''
})

// 时间戳转日期表单
const timestampForm = ref({
  timestamp: '',
  precision: 'seconds',
  timezone: 'Asia/Shanghai'
})

// 日期转时间戳表单
const dateForm = ref({
  date: null,
  format: 'YYYY-MM-DD HH:mm:ss'
})

// 时区转换表单
const timezoneForm = ref({
  source: {
    timezone: 'Asia/Shanghai',
    datetime: null
  },
  target: {
    timezone: 'UTC',
    datetime: null
  }
})

// 时间差计算表单
const diffForm = ref({
  start: null,
  end: null
})

// 日期加减表单
const calcForm = ref({
  baseDate: null,
  operation: 'add',
  value: 1,
  unit: 'days'
})

// 计算状态
const calculating = ref(false)

// 转换结果
const convertedDate = ref(null)
const convertedTimestamp = ref(null)
const timezoneConversionResult = ref(null)
const timeDiffResult = ref(null)
const dateOffsetResult = ref(null)

// 错误和成功消息
const errorMessage = ref('')
const successMessage = ref('')

// 时区列表
const timezones = ref([
  { label: '中国标准时间 (CST)', value: 'Asia/Shanghai' },
  { label: '协调世界时 (UTC)', value: 'UTC' },
  { label: '美国东部时间 (EST)', value: 'America/New_York' },
  { label: '美国西部时间 (PST)', value: 'America/Los_Angeles' },
  { label: '欧洲伦敦时间 (GMT)', value: 'Europe/London' },
  { label: '欧洲巴黎时间 (CET)', value: 'Europe/Paris' },
  { label: '日本标准时间 (JST)', value: 'Asia/Tokyo' },
  { label: '韩国标准时间 (KST)', value: 'Asia/Seoul' },
  { label: '澳大利亚东部时间 (AEST)', value: 'Australia/Sydney' }
])

// 时间戳示例
const timestampExamples = ref([
  {
    label: 'Unix零时',
    timestamp: '0',
    date: '1970-01-01 00:00:00 UTC'
  },
  {
    label: '2000年1月1日',
    timestamp: '946684800',
    date: '2000-01-01 00:00:00 UTC'
  },
  {
    label: '2020年1月1日',
    timestamp: '1577836800',
    date: '2020-01-01 00:00:00 UTC'
  },
  {
    label: '当前时间',
    timestamp: Math.floor(Date.now() / 1000).toString(),
    date: new Date().toLocaleString('zh-CN')
  }
])

// 方法
const updateCurrentTime = () => {
  const now = new Date()
  const timestamp = Math.floor(now.getTime())
  
  currentTime.value = {
    seconds: Math.floor(timestamp / 1000).toString(),
    milliseconds: timestamp.toString(),
    local: now.toLocaleString('zh-CN'),
    utc: now.toUTCString()
  }
}

const startRealTime = () => {
  if (realTimeActive.value) return
  
  realTimeActive.value = true
  updateCurrentTime()
  
  realTimeInterval.value = setInterval(() => {
    updateCurrentTime()
  }, 1000)
  
  successMessage.value = '已开始实时时间显示'
  ElMessage.success('已开始实时时间显示')
}

const stopRealTime = () => {
  if (!realTimeActive.value) return
  
  realTimeActive.value = false
  
  if (realTimeInterval.value) {
    clearInterval(realTimeInterval.value)
    realTimeInterval.value = null
  }
  
  successMessage.value = '已停止实时时间显示'
  ElMessage.success('已停止实时时间显示')
}

// 时间戳转日期
const convertTimestampToDate = () => {
  if (!timestampForm.value.timestamp) {
    convertedDate.value = null
    return
  }
  
  try {
    let timestamp = parseInt(timestampForm.value.timestamp, 10)
    
    if (timestampForm.value.precision === 'milliseconds') {
      timestamp = Math.floor(timestamp / 1000)
    }
    
    const date = new Date(timestamp * 1000)
    
    if (isNaN(date.getTime())) {
      throw new Error('无效的时间戳')
    }
    
    const options = {
      timeZone: timestampForm.value.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }
    
    const formatter = new Intl.DateTimeFormat('en-CA', options)
    const parts = formatter.formatToParts(date)
    
    const full = parts.reduce((acc, part) => {
      if (part.type === 'year') acc += part.value + '-'
      else if (part.type === 'month') acc += part.value + '-'
      else if (part.type === 'day') acc += part.value + ' '
      else if (part.type === 'hour') acc += part.value + ':'
      else if (part.type === 'minute') acc += part.value + ':'
      else if (part.type === 'second') acc += part.value
      return acc
    }, '')
    
    const dateOnly = full.split(' ')[0]
    const timeOnly = full.split(' ')[1] || ''
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const weekday = weekdays[date.getDay()]
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    let relative = ''
    if (diffDays > 0) {
      relative = `${diffDays}天后`
    } else if (diffDays < 0) {
      relative = `${Math.abs(diffDays)}天前`
    } else {
      relative = '今天'
    }
    
    convertedDate.value = {
      full,
      date: dateOnly,
      time: timeOnly,
      weekday,
      relative
    }
    
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = `时间戳转换失败: ${error.message}`
    ElMessage.error('时间戳转换失败')
    convertedDate.value = null
  }
}

// 日期转时间戳
const convertDateToTimestamp = () => {
  if (!dateForm.value.date) {
    convertedTimestamp.value = null
    return
  }
  
  try {
    const date = new Date(dateForm.value.date)
    
    if (isNaN(date.getTime())) {
      throw new Error('无效的日期')
    }
    
    const timestamp = Math.floor(date.getTime() / 1000)
    const millisecondTimestamp = date.getTime()
    
    const formatted = date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    
    convertedTimestamp.value = {
      seconds: timestamp.toString(),
      milliseconds: millisecondTimestamp.toString(),
      formatted
    }
    
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = `日期转换失败: ${error.message}`
    ElMessage.error('日期转换失败')
    convertedTimestamp.value = null
  }
}

// 时区转换
const convertTimezone = () => {
  if (!timezoneForm.value.source.datetime) {
    timezoneConversionResult.value = null
    return
  }
  
  try {
    const sourceTime = new Date(timezoneForm.value.source.datetime)
    const targetTime = new Date(sourceTime.toLocaleString('en-US', { timeZone: timezoneForm.value.target.timezone }))
    
    timezoneForm.value.target.datetime = targetTime
    
    const diffMs = targetTime.getTime() - sourceTime.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    let diff = ''
    if (diffHours > 0) {
      diff = `早${diffHours}小时${diffMinutes}分钟`
    } else if (diffHours < 0) {
      diff = `晚${Math.abs(diffHours)}小时${diffMinutes}分钟`
    } else {
      diff = '同时'
    }
    
    const now = new Date()
    const diffToNow = Math.abs(targetTime.getTime() - now.getTime())
    const daysDiff = Math.floor(diffToNow / (1000 * 60 * 60 * 24))
    
    let relative = ''
    if (daysDiff === 0) {
      relative = '今天'
    } else if (daysDiff === 1) {
      relative = '明天'
    } else if (daysDiff === -1) {
      relative = '昨天'
    } else if (daysDiff > 1) {
      relative = `${daysDiff}天后`
    } else {
      relative = `${Math.abs(daysDiff)}天前`
    }
    
    timezoneConversionResult.value = {
      diff,
      relative
    }
    
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = `时区转换失败: ${error.message}`
    ElMessage.error('时区转换失败')
    timezoneConversionResult.value = null
  }
}

// 时间差计算
const calculateTimeDiff = async () => {
  if (!diffForm.value.start || !diffForm.value.end) {
    ElMessage.warning('请选择开始和结束时间')
    return
  }
  
  calculating.value = true
  
  try {
    const start = new Date(diffForm.value.start)
    const end = new Date(diffForm.value.end)
    
    const diffMs = Math.abs(end.getTime() - start.getTime())
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
    
    timeDiffResult.value = {
      days,
      hours,
      minutes,
      seconds,
      milliseconds: diffMs
    }
    
    successMessage.value = '时间差计算完成'
    ElMessage.success('时间差计算完成')
  } catch (error) {
    errorMessage.value = `时间差计算失败: ${error.message}`
    ElMessage.error('时间差计算失败')
  } finally {
    calculating.value = false
  }
}

// 日期加减
const calculateDateOffset = async () => {
  if (!calcForm.value.baseDate) {
    ElMessage.warning('请选择基准时间')
    return
  }
  
  calculating.value = true
  
  try {
    const date = new Date(calcForm.value.baseDate)
    let result = new Date(date)
    
    const value = calcForm.value.value * (calcForm.value.operation === 'subtract' ? -1 : 1)
    
    switch (calcForm.value.unit) {
      case 'years':
        result.setFullYear(result.getFullYear() + value)
        break
      case 'months':
        result.setMonth(result.getMonth() + value)
        break
      case 'days':
        result.setDate(result.getDate() + value)
        break
      case 'hours':
        result.setHours(result.getHours() + value)
        break
      case 'minutes':
        result.setMinutes(result.getMinutes() + value)
        break
      case 'seconds':
        result.setSeconds(result.getSeconds() + value)
        break
      case 'milliseconds':
        result.setMilliseconds(result.getMilliseconds() + value)
        break
    }
    
    const formatted = result.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    
    const timestamp = Math.floor(result.getTime() / 1000)
    const millisecondTimestamp = result.getTime()
    
    dateOffsetResult.value = {
      date: formatted,
      timestamp: millisecondTimestamp.toString()
    }
    
    successMessage.value = '日期加减计算完成'
    ElMessage.success('日期加减计算完成')
  } catch (error) {
    errorMessage.value = `日期加减计算失败: ${error.message}`
    ElMessage.error('日期加减计算失败')
  } finally {
    calculating.value = false
  }
}

// 工具方法
const clearTimestampInput = () => {
  timestampForm.value.timestamp = ''
  convertedDate.value = null
}

const clearDateInput = () => {
  dateForm.value.date = null
  convertedTimestamp.value = null
}

const useCurrentTimestamp = () => {
  const now = Date.now()
  timestampForm.value.timestamp = Math.floor(now / 1000).toString()
  timestampForm.value.precision = 'seconds'
  convertTimestampToDate()
}

const useCurrentDate = () => {
  dateForm.value.date = new Date()
  convertDateToTimestamp()
}

const useCurrentTimeForConversion = () => {
  const now = new Date()
  timezoneForm.value.source.datetime = now
  timezoneForm.value.target.datetime = new Date(now.toLocaleString('en-US', { timeZone: timezoneForm.value.target.timezone }))
  convertTimezone()
}

const swapTimezones = () => {
  const temp = timezoneForm.value.source.timezone
  timezoneForm.value.source.timezone = timezoneForm.value.target.timezone
  timezoneForm.value.target.timezone = temp
  convertTimezone()
}

const loadTimestampExample = (type) => {
  const examples = {
    'unix-zero': 0,
    'current': Math.floor(Date.now() / 1000),
    'year-2000': 946684800,
    'covid-start': 1577836800
  }
  
  timestampForm.value.timestamp = examples[type].toString()
  timestampForm.value.precision = 'seconds'
  convertTimestampToDate()
}

const loadExampleTimestamp = (timestamp) => {
  timestampForm.value.timestamp = timestamp
  convertTimestampToDate()
}

const copyDateValue = async (value) => {
  try {
    await navigator.clipboard.writeText(value)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const copyTimestampValue = async (value) => {
  try {
    await navigator.clipboard.writeText(value)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 生命周期
onMounted(() => {
  updateCurrentTime()
})

onUnmounted(() => {
  stopRealTime()
})
</script>

<style scoped>
.timestamp-converter-tools {
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

.realtime-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.time-display {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.time-value {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
  word-break: break-all;
}

.time-label {
  font-size: 12px;
  opacity: 0.8;
}

.convert-section {
  min-height: 300px;
}

.result-section,
.diff-result,
.calc-result,
.conversion-result {
  margin-top: 20px;
}

.date-info,
.timestamp-info,
.diff-info,
.offset-info,
.result-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.date-item,
.timestamp-item,
.diff-item,
.offset-item,
.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-item label,
.timestamp-item label,
.diff-item label,
.offset-item label,
.result-item label {
  font-weight: 600;
  color: #606266;
  min-width: 100px;
}

.date-value,
.timestamp-value,
.diff-value,
.offset-value,
.result-value {
  flex: 1;
  font-family: 'Courier New', monospace;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.timezone-section h4 {
  margin-bottom: 16px;
  color: #303133;
}

.timezone-result {
  margin-top: 16px;
  text-align: center;
}

.calc-section {
  min-height: 400px;
}

.preset-card {
  margin: 20px 0;
}

.example-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.example-card:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.example-card h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.example-timestamp {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #409eff;
  margin-bottom: 4px;
}

.example-date {
  font-size: 12px;
  color: #909399;
}

.error-card,
.success-card {
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

:deep(.realtime-card .el-card__header),
:deep(.realtime-card .el-card__body) {
  background: transparent;
  color: white;
}

:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-form-item__label) {
  font-weight: 600;
}

:deep(.el-divider__text) {
  font-weight: 600;
}

:deep(.el-tag) {
  font-size: 14px;
}

:deep(.el-button-group .el-button) {
  margin-left: 0;
}
</style>