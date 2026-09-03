<template>
  <div class="convert-documents">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文档转换（PDF / Word / PPT / 图片）</span>
          <el-tag :type="statusReady ? 'success' : 'warning'">
            {{ statusText }}
          </el-tag>
        </div>
      </template>

      <el-alert
        title="使用本机免费的 LibreOffice 转换。Word/PPT/图片转 PDF 效果较好；PDF 转 Word/PPT 可能无法完美保留排版。不支持 Word 与 PPT 互转。"
        type="info"
        :closable="false"
        show-icon
        class="hint"
      />

      <el-form label-width="100px">
        <el-form-item label="源文件">
          <el-upload
            drag
            :auto-upload="false"
            :limit="1"
            accept=".doc,.docx,.ppt,.pptx,.pdf,.png,.jpg,.jpeg"
            :on-change="handleFileChange"
            :on-remove="clearFile"
            :file-list="fileList"
          >
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持 doc/docx、ppt/pptx、pdf、png/jpg，最大 20MB</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="目标格式">
          <el-radio-group v-model="target" :disabled="!targetOptions.length">
            <el-radio
              v-for="option in targetOptions"
              :key="option.value"
              :label="option.value"
            >
              {{ option.label }}
            </el-radio>
          </el-radio-group>
          <div v-if="sourceExt && !targetOptions.length" class="empty-target">当前文件类型不支持转换</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="converting" :disabled="!canConvert" @click="handleConvert">
            开始转换
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { convertDocument, getConvertDocumentStatus } from '@/api/tools'

const TARGET_MAP = {
  doc: [{ value: 'pdf', label: 'PDF' }],
  docx: [{ value: 'pdf', label: 'PDF' }],
  ppt: [{ value: 'pdf', label: 'PDF' }],
  pptx: [{ value: 'pdf', label: 'PDF' }],
  png: [{ value: 'pdf', label: 'PDF' }],
  jpg: [{ value: 'pdf', label: 'PDF' }],
  jpeg: [{ value: 'pdf', label: 'PDF' }],
  pdf: [
    { value: 'docx', label: 'Word（docx）' },
    { value: 'pptx', label: 'PPT（pptx）' }
  ]
}

const statusReady = ref(false)
const statusText = ref('正在检测 LibreOffice...')
const fileList = ref([])
const selectedFile = ref(null)
const target = ref('')
const converting = ref(false)

const sourceExt = computed(() => {
  const name = selectedFile.value?.name || ''
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : ''
  return ext
})

const targetOptions = computed(() => TARGET_MAP[sourceExt.value] || [])
const canConvert = computed(() => Boolean(selectedFile.value && target.value && statusReady.value))

const loadStatus = async () => {
  try {
    const response = await getConvertDocumentStatus()
    statusReady.value = Boolean(response.ready)
    statusText.value = response.message || (statusReady.value ? 'LibreOffice 已就绪' : '未检测到 LibreOffice')
  } catch {
    statusReady.value = false
    statusText.value = '无法检测转换服务'
  }
}

const handleFileChange = (uploadFile, uploadFiles) => {
  selectedFile.value = uploadFile.raw || null
  fileList.value = uploadFiles.slice(-1)
  target.value = TARGET_MAP[sourceExt.value]?.[0]?.value || ''
}

const clearFile = () => {
  selectedFile.value = null
  fileList.value = []
  target.value = ''
}

const resetForm = () => {
  converting.value = false
  clearFile()
}

const handleConvert = async () => {
  if (!canConvert.value) {
    ElMessage.warning(statusReady.value ? '请选择文件和目标格式' : '请先安装 LibreOffice')
    return
  }

  converting.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('target', target.value)
    const { blob, fileName } = await convertDocument(formData)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('转换完成，已开始下载')
  } catch (error) {
    ElMessage.error(error.message || '文档转换失败')
  } finally {
    converting.value = false
  }
}

onMounted(loadStatus)
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hint {
  margin-bottom: 20px;
}

.empty-target {
  color: #909399;
  font-size: 12px;
}

:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
}
</style>
