<template>
  <div class="talent-pool-management">
    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索姓名、邮箱或手机号"
            clearable
            @keyup.enter="loadData"
          />
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="searchForm.source" placeholder="选择来源" clearable
            style="width: 200px"
            :popper-append-to-body="false">
            <el-option label="手动添加" value="manual" />
            <el-option label="文件导入" value="import" />
            <el-option label="网站爬取" value="crawl" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable
            style="width: 200px"
            :popper-append-to-body="false">
            <el-option label="待处理" value="1" />
            <el-option label="已入职" value="2" />
            <el-option label="已拒绝" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作按钮 -->
    <div class="button-group">
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        手动添加
      </el-button>
      <el-button type="success" @click="showUploadDialog = true">
        <el-icon><Upload /></el-icon>
        文件导入
      </el-button>
      <el-button type="warning" @click="showCrawlDialog = true">
        <el-icon><Link /></el-icon>
        网站爬取
      </el-button>
    </div>

    <!-- 人才列表 -->
    <div class="table-container">
      <el-table :data="talents" v-loading="loading" stripe border
        table-layout="fixed">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="education" label="学历" width="100" />
        <el-table-column prop="experience_years" label="工作经验" width="100">
          <template #default="{ row }">
            {{ row.experience_years ? `${row.experience_years}年` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="current_position" label="当前职位" width="150" />
        <el-table-column prop="expected_salary" label="期望薪资" width="120" />
        <el-table-column prop="source" label="来源" width="100">
          <template #default="{ row }">
            <el-tag :type="getSourceType(row.source)">
              {{ getSourceText(row.source) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="recruitment_position_title" label="关联职位" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button size="small" @click="viewTalent(row)">查看</el-button>
              <el-button size="small" type="primary" @click="editTalent(row)">编辑</el-button>
              <el-button size="small" type="success" @click="linkRecruitment(row)">关联职位</el-button>
              <el-button size="small" type="warning" @click="convertOnboarding(row)">转为入职</el-button>
              <el-button size="small" type="danger" @click="deleteTalentRow(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>

    <!-- 创建/编辑人才对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingTalent ? '编辑人才' : '手动添加人才'"
      width="800px"
    >
      <el-form :model="talentForm" :rules="talentRules" ref="talentFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="talentForm.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="talentForm.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="talentForm.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-select v-model="talentForm.gender" placeholder="选择性别" style="width: 100%">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年龄">
              <el-input-number v-model="talentForm.age" :min="18" :max="65" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学历">
              <el-select v-model="talentForm.education" placeholder="选择学历" style="width: 100%">
                <el-option label="高中" value="高中" />
                <el-option label="专科" value="专科" />
                <el-option label="本科" value="本科" />
                <el-option label="硕士" value="硕士" />
                <el-option label="博士" value="博士" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工作经验">
              <el-input-number v-model="talentForm.experience_years" :min="0" :max="50" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="期望薪资">
              <el-input v-model="talentForm.expected_salary" placeholder="如：8K-15K" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="当前职位">
              <el-input v-model="talentForm.current_position" placeholder="请输入当前职位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前公司">
              <el-input v-model="talentForm.current_company" placeholder="请输入当前公司" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="技能">
          <el-input
            v-model="talentForm.skills"
            type="textarea"
            :rows="2"
            placeholder="请输入技能，多个技能用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="工作经历">
          <el-input
            v-model="talentForm.work_experience"
            type="textarea"
            :rows="4"
            placeholder="请输入工作经历"
          />
        </el-form-item>
        <el-form-item label="教育背景">
          <el-input
            v-model="talentForm.education_background"
            type="textarea"
            :rows="3"
            placeholder="请输入教育背景"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="talentForm.notes"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTalent">保存</el-button>
      </template>
    </el-dialog>

    <!-- 文件上传对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="文件导入"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 PDF、Word、Excel 格式，文件大小不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="关联职位" v-if="allPositions.length > 0">
          <el-select v-model="uploadForm.recruitment_position_id" placeholder="选择招聘职位（可选）" style="width: 100%" clearable>
            <el-option
              v-for="position in allPositions"
              :key="position.id"
              :label="position.title"
              :value="position.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading">上传并解析</el-button>
      </template>
    </el-dialog>

    <!-- 网站爬取对话框 -->
    <el-dialog
      v-model="showCrawlDialog"
      title="网站爬取"
      width="600px"
    >
      <el-form :model="crawlForm" label-width="100px">
        <el-form-item label="网站URL">
          <el-input v-model="crawlForm.url" placeholder="请输入招聘网站URL" />
        </el-form-item>
        <el-form-item label="职位关键词">
          <el-input v-model="crawlForm.position_keywords" placeholder="请输入职位关键词（可选）" />
        </el-form-item>
        <el-alert
          title="提示"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            <div>爬取功能需要安装相关爬虫库（如 puppeteer）并实现具体逻辑</div>
          </template>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="showCrawlDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCrawl" :loading="crawling">开始爬取</el-button>
      </template>
    </el-dialog>

    <!-- 查看人才详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="人才详情"
      width="800px"
    >
      <el-descriptions :column="2" border v-if="currentTalent">
        <el-descriptions-item label="姓名">{{ currentTalent.name }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentTalent.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentTalent.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ currentTalent.gender || '-' }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ currentTalent.age || '-' }}</el-descriptions-item>
        <el-descriptions-item label="学历">{{ currentTalent.education || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工作经验">{{ currentTalent.experience_years ? `${currentTalent.experience_years}年` : '-' }}</el-descriptions-item>
        <el-descriptions-item label="期望薪资">{{ currentTalent.expected_salary || '-' }}</el-descriptions-item>
        <el-descriptions-item label="当前职位">{{ currentTalent.current_position || '-' }}</el-descriptions-item>
        <el-descriptions-item label="当前公司">{{ currentTalent.current_company || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源">
          <el-tag :type="getSourceType(currentTalent.source)">
            {{ getSourceText(currentTalent.source) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentTalent.status)">
            {{ getStatusText(currentTalent.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关联职位" :span="2">{{ currentTalent.recruitment_position_title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="技能" :span="2">{{ currentTalent.skills || '-' }}</el-descriptions-item>
        <el-descriptions-item label="工作经历" :span="2">{{ currentTalent.work_experience || '-' }}</el-descriptions-item>
        <el-descriptions-item label="教育背景" :span="2">{{ currentTalent.education_background || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentTalent.notes || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentTalent.created_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 关联招聘职位对话框 -->
    <el-dialog
      v-model="showLinkDialog"
      title="关联招聘职位"
      width="500px"
    >
      <el-form :model="linkForm" label-width="100px">
        <el-form-item label="选择职位">
          <el-select v-model="linkForm.recruitment_position_id" placeholder="选择招聘职位" style="width: 100%">
            <el-option
              v-for="position in allPositions"
              :key="position.id"
              :label="position.title"
              :value="position.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLinkDialog = false">取消</el-button>
        <el-button type="primary" @click="saveLink">确认</el-button>
      </template>
    </el-dialog>

    <!-- 转为入职申请对话框 -->
    <el-dialog
      v-model="showOnboardingDialog"
      title="转为入职申请"
      width="600px"
    >
      <el-form :model="onboardingForm" :rules="onboardingRules" ref="onboardingFormRef" label-width="100px">
        <el-form-item label="岗位" prop="position_id">
          <el-select v-model="onboardingForm.position_id" placeholder="选择岗位" style="width: 100%">
            <el-option
              v-for="position in allSystemPositions"
              :key="position.id"
              :label="position.name"
              :value="position.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属组织" prop="org_id">
          <el-select v-model="onboardingForm.org_id" placeholder="选择组织" style="width: 100%">
            <el-option
              v-for="org in allOrganizations"
              :key="org.id"
              :label="org.name"
              :value="org.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="入职日期" prop="start_date">
          <el-date-picker
            v-model="onboardingForm.start_date"
            type="date"
            placeholder="选择入职日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="薪资">
          <el-input v-model="onboardingForm.salary" placeholder="请输入薪资" />
        </el-form-item>
        <el-form-item label="合同类型">
          <el-select v-model="onboardingForm.contract_type" placeholder="选择合同类型" style="width: 100%">
            <el-option label="正式" value="正式" />
            <el-option label="实习" value="实习" />
            <el-option label="兼职" value="兼职" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="onboardingForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showOnboardingDialog = false">取消</el-button>
        <el-button type="primary" @click="saveOnboarding">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Link } from '@element-plus/icons-vue'
import { 
  getTalents, 
  createTalent, 
  updateTalent,
  deleteTalent,
  uploadTalentFile,
  crawlJobSite,
  linkToRecruitment,
  convertToOnboarding
} from '@/api/hr'
import { getRecruitmentPositions } from '@/api/hr'
import { getAllPositions } from '@/api/position'
import { getAllOrganizations } from '@/api/organization'

// 响应式数据
const loading = ref(false)
const talents = ref([])
const showCreateDialog = ref(false)
const showUploadDialog = ref(false)
const showCrawlDialog = ref(false)
const showDetailDialog = ref(false)
const showLinkDialog = ref(false)
const showOnboardingDialog = ref(false)
const editingTalent = ref(null)
const currentTalent = ref(null)
const allPositions = ref([])
const allSystemPositions = ref([])
const allOrganizations = ref([])
const uploading = ref(false)
const crawling = ref(false)
const uploadRef = ref()
const selectedFile = ref(null)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  source: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 人才表单
const talentForm = reactive({
  name: '',
  email: '',
  phone: '',
  gender: '',
  age: null,
  education: '',
  experience_years: null,
  current_position: '',
  current_company: '',
  expected_salary: '',
  skills: '',
  work_experience: '',
  education_background: '',
  notes: ''
})

// 上传表单
const uploadForm = reactive({
  recruitment_position_id: null
})

// 爬取表单
const crawlForm = reactive({
  url: '',
  position_keywords: ''
})

// 关联表单
const linkForm = reactive({
  recruitment_position_id: null
})

// 入职表单
const onboardingForm = reactive({
  position_id: '',
  org_id: '',
  start_date: '',
  salary: '',
  contract_type: '',
  notes: ''
})

// 表单验证规则
const talentRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

const onboardingRules = {
  position_id: [{ required: true, message: '请选择岗位', trigger: 'change' }],
  org_id: [{ required: true, message: '请选择组织', trigger: 'change' }],
  start_date: [{ required: true, message: '请选择入职日期', trigger: 'change' }]
}

const talentFormRef = ref()
const onboardingFormRef = ref()

// 获取来源类型
const getSourceType = (source) => {
  const types = { manual: '', import: 'success', crawl: 'warning' }
  return types[source] || ''
}

// 获取来源文本
const getSourceText = (source) => {
  const texts = { manual: '手动添加', import: '文件导入', crawl: '网站爬取' }
  return texts[source] || '未知'
}

// 获取状态类型
const getStatusType = (status) => {
  const types = { 1: 'info', 2: 'success', 3: 'danger' }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = { 1: '待处理', 2: '已入职', 3: '已拒绝' }
  return texts[status] || '待处理'
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    const response = await getTalents(params)
    talents.value = response.data
    pagination.total = response.total
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.source = ''
  searchForm.status = ''
  pagination.page = 1
  loadData()
}

// 保存人才
const saveTalent = async () => {
  try {
    await talentFormRef.value.validate()
    if (editingTalent.value) {
      await updateTalent(editingTalent.value.id, talentForm)
      ElMessage.success('更新成功')
    } else {
      await createTalent(talentForm)
      ElMessage.success('创建成功')
    }
    showCreateDialog.value = false
    resetForm()
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('保存失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(talentForm, {
    name: '',
    email: '',
    phone: '',
    gender: '',
    age: null,
    education: '',
    experience_years: null,
    current_position: '',
    current_company: '',
    expected_salary: '',
    skills: '',
    work_experience: '',
    education_background: '',
    notes: ''
  })
  editingTalent.value = null
}

// 编辑人才
const editTalent = (row) => {
  editingTalent.value = row
  Object.assign(talentForm, {
    name: row.name,
    email: row.email,
    phone: row.phone,
    gender: row.gender,
    age: row.age,
    education: row.education,
    experience_years: row.experience_years,
    current_position: row.current_position,
    current_company: row.current_company,
    expected_salary: row.expected_salary,
    skills: row.skills,
    work_experience: row.work_experience,
    education_background: row.education_background,
    notes: row.notes
  })
  showCreateDialog.value = true
}

// 删除人才
const deleteTalentRow = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个人才吗？', '提示', {
      type: 'warning'
    })
    await deleteTalent(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 查看人才详情
const viewTalent = (row) => {
  currentTalent.value = row
  showDetailDialog.value = true
}

// 文件选择
const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

// 文件上传
const handleUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    if (uploadForm.recruitment_position_id) {
      formData.append('recruitment_position_id', uploadForm.recruitment_position_id)
    }

    await uploadTalentFile(formData)
    ElMessage.success('上传并解析成功')
    showUploadDialog.value = false
    selectedFile.value = null
    uploadForm.recruitment_position_id = null
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
    loadData()
  } catch (error) {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

// 网站爬取
const handleCrawl = async () => {
  if (!crawlForm.url) {
    ElMessage.warning('请输入网站URL')
    return
  }

  crawling.value = true
  try {
    await crawlJobSite(crawlForm)
    ElMessage.info('爬取功能待实现，需要安装相关爬虫库')
    showCrawlDialog.value = false
    crawlForm.url = ''
    crawlForm.position_keywords = ''
  } catch (error) {
    ElMessage.error('爬取失败')
  } finally {
    crawling.value = false
  }
}

// 关联招聘职位
const linkRecruitment = (row) => {
  currentTalent.value = row
  linkForm.recruitment_position_id = row.recruitment_position_id
  showLinkDialog.value = true
}

// 保存关联
const saveLink = async () => {
  try {
    await linkToRecruitment(currentTalent.value.id, linkForm)
    ElMessage.success('关联成功')
    showLinkDialog.value = false
    loadData()
  } catch (error) {
    ElMessage.error('关联失败')
  }
}

// 转为入职申请
const convertOnboarding = (row) => {
  currentTalent.value = row
  showOnboardingDialog.value = true
}

// 保存入职申请
const saveOnboarding = async () => {
  try {
    await onboardingFormRef.value.validate()
    await convertToOnboarding(currentTalent.value.id, onboardingForm)
    ElMessage.success('已转为入职申请')
    showOnboardingDialog.value = false
    Object.assign(onboardingForm, {
      position_id: '',
      org_id: '',
      start_date: '',
      salary: '',
      contract_type: '',
      notes: ''
    })
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('转换失败')
    }
  }
}

// 加载基础数据
const loadBaseData = async () => {
  try {
    const [positionsRes, systemPositionsRes, orgsRes] = await Promise.all([
      getRecruitmentPositions({ page: 1, limit: 1000 }),
      getAllPositions(),
      getAllOrganizations()
    ])
    allPositions.value = positionsRes.data || positionsRes
    allSystemPositions.value = systemPositionsRes.data || systemPositionsRes
    allOrganizations.value = orgsRes.data || orgsRes
  } catch (error) {
    ElMessage.error('加载基础数据失败')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadData()
  loadBaseData()
})
</script>

<style scoped>
.talent-pool-management {
  padding: 0;
}

.search-form {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #f7fafc;
}

.button-group {
  margin-bottom: 24px;
}

.table-container {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 24px;
  border: 1px solid #f7fafc;
  overflow: hidden;
}

.pagination {
  margin-top: 24px;
  text-align: right;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  width: 100% !important;
}

:deep(.el-table th) {
  background-color: #f8fafc;
  color: #4a5568;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f7fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-table tr:hover > td) {
  background-color: #f7fafc;
}

/* 按钮样式优化 */
:deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

:deep(.el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
}

:deep(.el-button--success) {
  background: linear-gradient(135deg, #68d391 0%, #48bb78 100%);
  border: none;
  box-shadow: 0 2px 4px rgba(104, 211, 145, 0.3);
}

:deep(.el-button--success:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(104, 211, 145, 0.4);
}

:deep(.el-button--warning) {
  background: linear-gradient(135deg, #f6e05e 0%, #d69e2e 100%);
  border: none;
  box-shadow: 0 2px 4px rgba(246, 224, 94, 0.3);
}

:deep(.el-button--warning:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(246, 224, 94, 0.4);
}

:deep(.el-button--danger) {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  border: none;
  box-shadow: 0 2px 4px rgba(245, 101, 101, 0.3);
}

:deep(.el-button--danger:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 101, 101, 0.4);
}

/* 标签样式优化 */
:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
}

:deep(.el-tag--success) {
  background: linear-gradient(135deg, #68d391 0%, #48bb78 100%);
  border: none;
  color: white;
}

:deep(.el-tag--danger) {
  background: linear-gradient(135deg, #fc8181 0%, #f56565 100%);
  border: none;
  color: white;
}

:deep(.el-tag--warning) {
  background: linear-gradient(135deg, #f6e05e 0%, #d69e2e 100%);
  border: none;
  color: white;
}

:deep(.el-tag--info) {
  background: linear-gradient(135deg, #90cdf4 0%, #63b3ed 100%);
  border: none;
  color: white;
}

/* 输入框样式优化 */
:deep(.el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: #cbd5e0;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 对话框样式优化 */
:deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

:deep(.el-dialog__title) {
  font-weight: 600;
  color: #2d3748;
}

/* 操作按钮组样式 */
.operation-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.operation-buttons .el-button {
  flex-shrink: 0;
  white-space: nowrap;
}
</style>

