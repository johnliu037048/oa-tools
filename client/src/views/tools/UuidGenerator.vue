<template>
  <div class="uuid-generator-tools">
    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card-container">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>UUID 生成配置</span>
              </div>
            </template>

            <el-form label-width="120px" size="small">
              <el-form-item label="生成数量">
                <el-input-number v-model="count" :min="1" :max="5000" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="去掉横杆">
                <el-switch v-model="removeDashes" />
              </el-form-item>
              <el-form-item label="输出模式">
                <el-radio-group v-model="formatType">
                  <el-radio label="text">文本（每行一个）</el-radio>
                  <el-radio label="json">JSON 数组</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="generateUuids" block>
                  <el-icon><Document /></el-icon> 生成 UUID
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </el-col>

      <el-col :span="12">
        <div class="card-container">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>生成结果</span>
                <el-button-group>
                  <el-button @click="copyOutput" size="small" :disabled="!output">复制</el-button>
                  <el-button @click="clearOutput" size="small">清空</el-button>
                  <el-button @click="downloadOutput" size="small" :disabled="!output">下载</el-button>
                </el-button-group>
              </div>
            </template>

            <el-input
              v-model="output"
              type="textarea"
              :rows="20"
              placeholder="生成的 UUID 将显示在这里"
              readonly
            />
          </el-card>
        </div>
      </el-col>
    </el-row>

    <div v-if="message" class="card-container" style="margin-top: 16px;">
      <el-card>
        <el-alert :title="message" :type="messageType" :closable="false" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'

const count = ref(10)
const removeDashes = ref(false)
const formatType = ref('text')
const output = ref('')
const message = ref('')
const messageType = ref('success')

const generateUUIDOne = () => {
  let d = new Date().getTime()
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now()
  }
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (d + Math.random() * 16) % 16 | 0
    d = Math.floor(d / 16)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
  return uuid
}

const generateUuids = () => {
  if (!count.value || count.value < 1) {
    ElMessage.warning('生成数量必须大于 0')
    return
  }
  if (count.value > 5000) {
    ElMessage.warning('生成数量最多 5000 个')
    return
  }

  const uuids = []
  for (let i = 0; i < count.value; i++) {
    let u = generateUUIDOne()
    if (removeDashes.value) {
      u = u.replace(/-/g, '')
    }
    uuids.push(u)
  }

  if (formatType.value === 'json') {
    output.value = JSON.stringify(uuids, null, 2)
  } else {
    output.value = uuids.join('\n')
  }

  message.value = `已生成 ${uuids.length} 个 UUID` 
  messageType.value = 'success'
  ElMessage.success(message.value)
}

const clearOutput = () => {
  output.value = ''
  message.value = ''
}

const copyOutput = async () => {
  if (!output.value) {
    ElMessage.warning('没有内容可复制')
    return
  }
  try {
    await navigator.clipboard.writeText(output.value)
    ElMessage.success('已复制到剪贴板')
  } catch (err) {
    message.value = '复制失败: ' + err.message
    messageType.value = 'error'
    ElMessage.error('复制失败')
  }
}

const downloadOutput = () => {
  if (!output.value) {
    ElMessage.warning('没有内容可下载')
    return
  }

  const blob = new Blob([output.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `uuid-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.uuid-generator-tools .card-container {
  margin-bottom: 24px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
