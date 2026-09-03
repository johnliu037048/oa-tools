<template>
  <div class="tools-page">
    <div class="page-header">
      <h2>图片 / 视频 转换</h2>
    </div>
    <div class="page-body">
      <el-card class="media-generator">
        <template #header>
          <div class="card-header">
            <span>AI 生成工具 - 文字生成图片/视频</span>
            <el-tooltip content="使用 DeepSeek 大模型通过文字描述生成图片或视频" placement="top">
              <i class="el-icon-info"></i>
            </el-tooltip>
          </div>
        </template>

        <!-- 标签页切换 -->
        <el-tabs v-model="activeTab" @tab-change="onTabChange">
          <!-- 图片生成标签页 -->
          <el-tab-pane label="图片生成" name="image">
            <div class="generator-panel">
              <el-form :model="imageForm" label-width="100px" class="form-container">
                <!-- 提示词输入 -->
                <el-form-item label="图片描述">
                  <el-input
                    v-model="imageForm.prompt"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入图片的详细描述文字（例如：一只可爱的猫咪坐在书堆上，阳光环境）"
                    show-word-limit
                    maxlength="500"
                  />
                </el-form-item>

                <!-- 参数配置 -->
                <el-form-item label="模型选择">
                  <el-select v-model="imageForm.model" placeholder="选择模型">
                    <el-option label="DeepSeek Vision" value="deepseek-vision" />
                    <el-option label="DeepSeek Vision Pro" value="deepseek-vision-pro" />
                  </el-select>
                </el-form-item>

                <el-row :gutter="20">
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="分辨率">
                      <el-select v-model="imageForm.resolution" placeholder="选择分辨率" @change="updateImageResolution">
                        <el-option label="512 × 512" value="512" />
                        <el-option label="768 × 768" value="768" />
                        <el-option label="1024 × 1024" value="1024" />
                        <el-option label="1440 × 1440" value="1440" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="比例">
                      <el-select v-model="imageForm.aspectRatio" placeholder="选择宽高比">
                        <el-option label="正方形 (1:1)" value="square" />
                        <el-option label="横屏 (16:9)" value="landscape" />
                        <el-option label="竖屏 (9:16)" value="portrait" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="质量">
                      <el-select v-model="imageForm.quality" placeholder="选择质量">
                        <el-option label="标清 (Standard)" value="standard" />
                        <el-option label="高清 (HD)" value="hd" />
                        <el-option label="超清 (Ultra)" value="ultra" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="风格">
                      <el-select v-model="imageForm.style" placeholder="选择风格">
                        <el-option label="自然风格" value="natural" />
                        <el-option label="油画风格" value="oil-painting" />
                        <el-option label="卡通风格" value="cartoon" />
                        <el-option label="摄影风格" value="photography" />
                        <el-option label="动画风格" value="anime" />
                        <el-option label="概念艺术" value="concept-art" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <!-- 生成按钮 -->
                <el-form-item>
                  <el-button 
                    type="primary" 
                    @click="handleGenerateImage"
                    :loading="imageLoading"
                    size="large"
                  >
                    🎨 生成图片
                  </el-button>
                  <el-button @click="resetImageForm">重置</el-button>
                </el-form-item>
              </el-form>

              <!-- 结果展示 -->
              <div v-if="imageResult" class="result-container">
                <el-divider>生成结果</el-divider>
                <div class="result-content">
                  <div v-if="imageResult.imageUrl" class="image-preview">
                    <h4>生成的图片：</h4>
                    <img :src="imageResult.imageUrl" alt="生成的图片" class="preview-image" />
                    <el-button type="primary" size="small" @click="downloadImage">
                      ⬇️ 下载图片
                    </el-button>
                  </div>
                  <div v-if="imageResult.revised_prompt" class="revised-prompt">
                    <h4>优化后的提示词：</h4>
                    <el-alert 
                      :title="imageResult.revised_prompt" 
                      type="info"
                      :closable="false"
                    />
                  </div>
                  <div class="parameters-info">
                    <h4>使用的参数：</h4>
                    <el-descriptions :column="2" border size="small">
                      <el-descriptions-item label="模型">
                        {{ imageResult.model }}
                      </el-descriptions-item>
                      <el-descriptions-item label="分辨率">
                        {{ imageResult.parameters?.width }}x{{ imageResult.parameters?.height }}
                      </el-descriptions-item>
                      <el-descriptions-item label="质量">
                        {{ imageResult.parameters?.quality }}
                      </el-descriptions-item>
                      <el-descriptions-item label="风格">
                        {{ imageResult.parameters?.style }}
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 视频生成标签页 -->
          <el-tab-pane label="视频生成" name="video">
            <div class="generator-panel">
              <el-form :model="videoForm" label-width="100px" class="form-container">
                <!-- 提示词输入 -->
                <el-form-item label="视频描述">
                  <el-input
                    v-model="videoForm.prompt"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入视频的详细描述文字（例如：一个机器人在未来城市里行走，科幻风格，4K质量）"
                    show-word-limit
                    maxlength="500"
                  />
                </el-form-item>

                <!-- 参数配置 -->
                <el-form-item label="模型选择">
                  <el-select v-model="videoForm.model" placeholder="选择模型">
                    <el-option label="DeepSeek Video" value="deepseek-video" />
                    <el-option label="DeepSeek Video Pro" value="deepseek-video-pro" />
                  </el-select>
                </el-form-item>

                <el-row :gutter="20">
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="时长(秒)">
                      <el-slider
                        v-model="videoForm.duration"
                        :min="1"
                        :max="10"
                        :step="1"
                        show-stops
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="帧率">
                      <el-select v-model="videoForm.fps" placeholder="选择帧率">
                        <el-option label="24 FPS" value="24" />
                        <el-option label="30 FPS" value="30" />
                        <el-option label="60 FPS" value="60" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="分辨率">
                      <el-select v-model="videoForm.resolution" placeholder="选择分辨率">
                        <el-option label="720p" value="720p" />
                        <el-option label="1080p" value="1080p" />
                        <el-option label="2K" value="2k" />
                        <el-option label="4K" value="4k" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item label="质量">
                      <el-select v-model="videoForm.quality" placeholder="选择质量">
                        <el-option label="标清 (Standard)" value="standard" />
                        <el-option label="高清 (HD)" value="hd" />
                        <el-option label="超清 (Ultra)" value="ultra" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <!-- 生成按钮 -->
                <el-form-item>
                  <el-button 
                    type="primary" 
                    @click="handleGenerateVideo"
                    :loading="videoLoading"
                    size="large"
                  >
                    🎬 生成视频
                  </el-button>
                  <el-button @click="resetVideoForm">重置</el-button>
                </el-form-item>
              </el-form>

              <!-- 结果展示 -->
              <div v-if="videoResult" class="result-container">
                <el-divider>生成结果</el-divider>
                <div class="result-content">
                  <div class="status-info">
                    <el-alert
                      title="视频生成已提交"
                      type="success"
                      :closable="false"
                    >
                      <template #default>
                        <p>任务已提交到 DeepSeek 服务器，请稍候...</p>
                        <p v-if="videoResult.videoId">任务ID: {{ videoResult.videoId }}</p>
                        <p v-if="videoResult.status">状态: {{ videoResult.status }}</p>
                      </template>
                    </el-alert>
                  </div>
                  <div v-if="videoResult.videoUrl" class="video-preview">
                    <h4>生成的视频：</h4>
                    <video :src="videoResult.videoUrl" controls class="preview-video"></video>
                    <el-button type="primary" size="small" @click="downloadVideo">
                      ⬇️ 下载视频
                    </el-button>
                  </div>
                  <div v-if="videoResult.revised_prompt" class="revised-prompt">
                    <h4>优化后的提示词：</h4>
                    <el-alert 
                      :title="videoResult.revised_prompt" 
                      type="info"
                      :closable="false"
                    />
                  </div>
                  <div class="parameters-info">
                    <h4>使用的参数：</h4>
                    <el-descriptions :column="2" border size="small">
                      <el-descriptions-item label="模型">
                        {{ videoResult.model }}
                      </el-descriptions-item>
                      <el-descriptions-item label="时长">
                        {{ videoResult.parameters?.duration }} 秒
                      </el-descriptions-item>
                      <el-descriptions-item label="帧率">
                        {{ videoResult.parameters?.fps }} FPS
                      </el-descriptions-item>
                      <el-descriptions-item label="分辨率">
                        {{ videoResult.parameters?.resolution }}
                      </el-descriptions-item>
                      <el-descriptions-item label="质量">
                        {{ videoResult.parameters?.quality }}
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <!-- 提示信息 -->
      <el-card class="tips-card" style="margin-top: 20px">
        <template #header>
          <span>📝 使用说明</span>
        </template>
        <ul class="tips-list">
          <li>请在 <strong>DEEPSEEK_API_KEY</strong> 环境变量中配置您的 DeepSeek API 密钥</li>
          <li>提示词越详细，生成结果质量越好（建议20-100个汉字）</li>
          <li>生成过程需要时间，请耐心等待</li>
          <li>图片支持 PNG 和 JPEG 格式下载</li>
          <li>视频支持 MP4 格式下载，处理时间较长</li>
          <li>参数说明：
            <ul>
              <li>质量：standard（标清）→ hd（高清）→ ultra（超清），质量越好处理时间越长</li>
              <li>风格：可选不同的艺术风格来改变生成结果的外观</li>
              <li>分辨率：更高的分辨率会提高生成时间</li>
            </ul>
          </li>
        </ul>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as toolsApi from '@/api/tools'

// 活跃标签页
const activeTab = ref('image')

// 图片生成表单
const imageForm = ref({
  prompt: '',
  model: 'deepseek-vision',
  resolution: '1024',
  aspectRatio: 'square',
  width: 1024,
  height: 1024,
  quality: 'hd',
  style: 'natural'
})

// 视频生成表单
const videoForm = ref({
  prompt: '',
  model: 'deepseek-video',
  duration: 5,
  fps: '24',
  resolution: '1080p',
  quality: 'hd'
})

// 加载状态
const imageLoading = ref(false)
const videoLoading = ref(false)

// 结果
const imageResult = ref(null)
const videoResult = ref(null)

// 更新图片分辨率（根据尺寸和比例计算宽高）
const updateImageResolution = () => {
  const resolution = parseInt(imageForm.value.resolution)
  const aspectRatio = imageForm.value.aspectRatio
  
  if (aspectRatio === 'square') {
    imageForm.value.width = resolution
    imageForm.value.height = resolution
  } else if (aspectRatio === 'landscape') {
    // 16:9 横屏
    imageForm.value.width = Math.round(resolution * 16 / 9)
    imageForm.value.height = resolution
  } else if (aspectRatio === 'portrait') {
    // 9:16 竖屏
    imageForm.value.width = resolution
    imageForm.value.height = Math.round(resolution * 16 / 9)
  }
}

// 生成图片
const handleGenerateImage = async () => {
  if (!imageForm.value.prompt.trim()) {
    ElMessage.warning('请输入图片描述')
    return
  }

  imageLoading.value = true
  try {
    const response = await toolsApi.generateImage({
      prompt: imageForm.value.prompt,
      model: imageForm.value.model,
      width: imageForm.value.width,
      height: imageForm.value.height,
      quality: imageForm.value.quality,
      style: imageForm.value.style
    })

    if (response.data?.success) {
      imageResult.value = response.data.data
      ElMessage.success('图片生成成功！')
    } else {
      ElMessage.error(response.data?.message || '生成失败，请检查 API Key 配置')
    }
  } catch (error) {
    console.error('生成图片错误:', error)
    ElMessage.error(error.response?.data?.message || error.message || '生成失败，请稍后重试')
  } finally {
    imageLoading.value = false
  }
}

// 生成视频
const handleGenerateVideo = async () => {
  if (!videoForm.value.prompt.trim()) {
    ElMessage.warning('请输入视频描述')
    return
  }

  videoLoading.value = true
  try {
    const response = await toolsApi.generateVideo({
      prompt: videoForm.value.prompt,
      model: videoForm.value.model,
      duration: videoForm.value.duration,
      fps: parseInt(videoForm.value.fps),
      resolution: videoForm.value.resolution,
      quality: videoForm.value.quality
    })

    if (response.data?.success) {
      videoResult.value = response.data.data
      ElMessage.success('视频生成已提交，请等待处理...')
    } else {
      ElMessage.error(response.data?.message || '生成失败，请检查 API Key 配置')
    }
  } catch (error) {
    console.error('生成视频错误:', error)
    ElMessage.error(error.response?.data?.message || error.message || '生成失败，请稍后重试')
  } finally {
    videoLoading.value = false
  }
}

// 重置图片表单
const resetImageForm = () => {
  imageForm.value = {
    prompt: '',
    model: 'deepseek-vision',
    resolution: '1024',
    aspectRatio: 'square',
    width: 1024,
    height: 1024,
    quality: 'hd',
    style: 'natural'
  }
  imageResult.value = null
}

// 重置视频表单
const resetVideoForm = () => {
  videoForm.value = {
    prompt: '',
    model: 'deepseek-video',
    duration: 5,
    fps: '24',
    resolution: '1080p',
    quality: 'hd'
  }
  videoResult.value = null
}

// 下载图片
const downloadImage = () => {
  if (imageResult.value?.imageUrl) {
    const link = document.createElement('a')
    link.href = imageResult.value.imageUrl
    link.download = `generated-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('开始下载图片...')
  }
}

// 下载视频
const downloadVideo = () => {
  if (videoResult.value?.videoUrl) {
    const link = document.createElement('a')
    link.href = videoResult.value.videoUrl
    link.download = `generated-video-${Date.now()}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('开始下载视频...')
  }
}

// 标签页切换
const onTabChange = (tabName) => {
  console.log('切换到标签页:', tabName)
}
</script>

<style scoped>
.tools-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.media-generator {
  background-color: #f5f7fa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.card-header i {
  cursor: help;
  color: #909399;
  margin-left: 8px;
}

.generator-panel {
  padding: 20px 0;
}

.form-container {
  background: white;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.result-container {
  margin-top: 30px;
}

.result-content {
  background: white;
  padding: 20px;
  border-radius: 4px;
}

.image-preview,
.video-preview {
  text-align: center;
  margin-bottom: 20px;
}

.image-preview h4,
.video-preview h4,
.revised-prompt h4,
.parameters-info h4 {
  margin-top: 0;
  color: #333;
  font-weight: 600;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
  margin-bottom: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.preview-video {
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
  margin-bottom: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.revised-prompt {
  margin: 20px 0;
}

.parameters-info {
  margin-top: 20px;
}

.status-info {
  margin-bottom: 20px;
}

.tips-card {
  background-color: #f0f9ff;
  border: 1px solid #b3d8ff;
}

.tips-list {
  line-height: 1.8;
  color: #333;
}

.tips-list li {
  margin-bottom: 10px;
}

.tips-list ul {
  margin-top: 5px;
  padding-left: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-body {
    padding: 0;
  }

  .form-container {
    padding: 15px;
  }

  .preview-image,
  .preview-video {
    max-height: 300px;
  }
}
</style>