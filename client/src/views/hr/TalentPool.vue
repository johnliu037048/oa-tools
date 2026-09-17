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
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable
            style="width: 200px"
            :popper-append-to-body="false">
            <el-option label="待处理" value="1" />
            <el-option label="已入职" value="2" />
            <el-option label="已拒绝" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item class="search-actions">
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="action-card">
      <div class="action-card__left">
        <el-button plain @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          手动添加
        </el-button>
        <el-button type="primary" @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon>
          文件导入
        </el-button>
        <el-button plain @click="showCrawlDialog = true">
          <el-icon><Link /></el-icon>
          网站爬取
        </el-button>
      </div>
      <el-segmented
        v-model="searchForm.source"
        :options="sourceSegmentOptions"
        @change="onSourceTabChange"
      />
    </div>

    <div class="ai-screen-card">
      <div class="ai-screen-card__title">岗位匹配打分</div>
      <div class="ai-screen-card__body">
        <el-select
          v-model="screeningBar.recruitment_position_id"
          placeholder="选择对标招聘职位"
          filterable
          clearable
          style="width: 280px"
          @change="persistScreeningPosition"
        >
          <el-option
            v-for="position in allPositions"
            :key="position.id"
            :label="position.title"
            :value="position.id"
          />
        </el-select>
        <el-button
          type="primary"
          :loading="batchScreening"
          :disabled="!screeningBar.recruitment_position_id"
          @click="runBatchScreen(false)"
        >
          全部打分
        </el-button>
        <el-button
          plain
          :loading="batchScreening"
          :disabled="!screeningBar.recruitment_position_id"
          @click="runBatchScreen(true)"
        >
          仅未评分
        </el-button>
        <el-checkbox v-model="screeningBar.autoOnImport">导入后自动打分</el-checkbox>
        <el-checkbox v-model="screeningBar.autoOnEnter">进入页面自动打分（未评分）</el-checkbox>
      </div>
      <p class="ai-screen-card__hint">打分在列表外统一执行，列表仅展示匹配度结果。</p>
    </div>

    <!-- 人才列表 -->
    <div class="table-container">
      <el-table :data="talents" v-loading="loading" stripe border height="520">
        <el-table-column prop="name" label="姓名" min-width="90" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" min-width="120" show-overflow-tooltip />
        <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />
        <el-table-column prop="education" label="学历" min-width="80" />
        <el-table-column prop="experience_years" label="工作年限" min-width="90">
          <template #default="{ row }">
            {{ row.experience_years != null ? `${row.experience_years}年` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="current_position" label="当前职位" min-width="120" show-overflow-tooltip />
        <el-table-column prop="expected_salary" label="期望薪资" min-width="100" show-overflow-tooltip />
        <el-table-column prop="source" label="来源" min-width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getSourceType(row.source)">
              {{ getSourceText(row.source) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="AI 匹配" min-width="100">
          <template #default="{ row }">
            <el-tag v-if="row.ai_match_score != null" size="small" :type="getAiScoreType(row.ai_match_score)">
              {{ formatAiScore(row.ai_match_score) }}
            </el-tag>
            <span v-else class="text-muted">未评分</span>
          </template>
        </el-table-column>
        <el-table-column prop="recruitment_position_title" label="关联职位" min-width="120" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" min-width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="108" fixed="right" align="center" class-name="col-actions">
          <template #default="{ row }">
            <div class="table-row-actions">
              <el-dropdown trigger="click" @command="(cmd) => handleRowCommand(cmd, row)">
                <el-button size="small" type="primary" plain>
                  操作
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="view">查看详情</el-dropdown-item>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="reparse" divided>重新解析简历</el-dropdown-item>
                    <el-dropdown-item command="link">关联职位</el-dropdown-item>
                    <el-dropdown-item command="onboard">转为入职</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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
      width="860px"
      class="talent-form-dialog"
      destroy-on-close
      @closed="resetForm"
    >
      <div class="dialog-scroll-body">
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
              <div class="number-with-unit">
                <el-input-number v-model="talentForm.age" :min="18" :max="65" controls-position="right" />
                <span class="number-unit">岁</span>
              </div>
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
              <div class="number-with-unit">
                <el-input-number v-model="talentForm.experience_years" :min="0" :max="50" controls-position="right" />
                <span class="number-unit">年</span>
              </div>
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
      </div>
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
          <el-select
            v-model="uploadForm.recruitment_position_id"
            placeholder="选择招聘职位（建议必选，用于自动打分）"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="position in allPositions"
              :key="position.id"
              :label="position.title"
              :value="position.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="自动打分">
          <el-switch v-model="uploadForm.auto_screen" />
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

    <el-dialog
      v-model="showDetailDialog"
      width="920px"
      class="talent-detail-dialog"
      :show-close="true"
    >
      <template #header>
        <div class="detail-header" v-if="currentTalent">
          <div class="detail-header__main">
            <h3>{{ currentTalent.name }}</h3>
            <p class="detail-header__sub">
              {{ currentTalent.job_intention || currentTalent.current_position || '求职意向未填' }}
              · {{ currentTalent.expected_city || '城市未定' }}
              · {{ currentTalent.expected_salary || '薪资面议' }}
            </p>
          </div>
          <div class="detail-header__tags">
            <el-tag size="small">{{ getSourceText(currentTalent.source) }}</el-tag>
            <el-tag size="small" :type="getStatusType(currentTalent.status)">{{ getStatusText(currentTalent.status) }}</el-tag>
            <el-tag v-if="currentTalent.ai_match_score != null" size="small" :type="getAiScoreType(currentTalent.ai_match_score)">
              匹配 {{ formatAiScore(currentTalent.ai_match_score) }}
            </el-tag>
          </div>
        </div>
      </template>

      <div v-if="currentTalent" class="detail-body">
        <section class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-grid">
            <div><span>手机</span>{{ currentTalent.phone || '-' }}</div>
            <div><span>邮箱</span>{{ currentTalent.email || '-' }}</div>
            <div><span>性别</span>{{ currentTalent.gender || '-' }}</div>
            <div><span>年龄</span>{{ currentTalent.age ? `${currentTalent.age}岁` : '-' }}</div>
            <div><span>学历</span>{{ currentTalent.education || '-' }}</div>
            <div><span>工作年限</span>{{ currentTalent.experience_years != null ? `${currentTalent.experience_years}年` : '-' }}</div>
            <div><span>当前公司</span>{{ currentTalent.current_company || '-' }}</div>
            <div><span>当前职位</span>{{ currentTalent.current_position || '-' }}</div>
            <div><span>关联招聘</span>{{ currentTalent.recruitment_position_title || '-' }}</div>
            <div><span>入库时间</span>{{ currentTalent.created_at || '-' }}</div>
          </div>
        </section>

        <section v-if="currentTalent.personal_advantages" class="detail-section">
          <h4>个人优势</h4>
          <p class="detail-text">{{ currentTalent.personal_advantages }}</p>
        </section>

        <section v-if="currentTalent.skills" class="detail-section">
          <h4>专业技能</h4>
          <div v-if="skillTags.length" class="skill-tags">
            <el-tag v-for="(tag, i) in skillTags" :key="i" size="small" effect="plain">{{ tag }}</el-tag>
          </div>
          <p v-else class="detail-text">{{ currentTalent.skills }}</p>
        </section>

        <section v-if="currentTalent.work_experience" class="detail-section">
          <h4>工作经历</h4>
          <pre class="detail-pre">{{ currentTalent.work_experience }}</pre>
        </section>

        <section v-if="currentTalent.project_experience" class="detail-section">
          <h4>项目经历</h4>
          <pre class="detail-pre">{{ currentTalent.project_experience }}</pre>
        </section>

        <section v-if="currentTalent.education_background" class="detail-section">
          <h4>教育经历</h4>
          <p class="detail-text">{{ currentTalent.education_background }}</p>
        </section>

        <section v-if="currentTalent.certificates" class="detail-section">
          <h4>资格证书</h4>
          <p class="detail-text">{{ currentTalent.certificates }}</p>
        </section>

        <section v-if="currentTalent.ai_match_summary || aiScreenDetail" class="detail-section detail-section--highlight">
          <h4>岗位匹配评估</h4>
          <p class="detail-text">{{ currentTalent.ai_match_summary || aiScreenDetail?.summary }}</p>
          <div v-if="aiScreenDetail" class="skill-tags">
            <el-tag v-for="(s, i) in aiScreenDetail.matched_skills || []" :key="'m'+i" size="small" type="success">{{ s }}</el-tag>
            <el-tag v-for="(g, i) in aiScreenDetail.gaps || []" :key="'g'+i" size="small" type="warning">{{ g }}</el-tag>
          </div>
        </section>
      </div>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Link, ArrowDown } from '@element-plus/icons-vue'
import { 
  getTalents, 
  createTalent, 
  updateTalent,
  deleteTalent,
  uploadTalentFile,
  crawlJobSite,
  linkToRecruitment,
  convertToOnboarding,
  batchAiScreenTalents,
  reparseTalentResume
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
const aiScreenDetail = ref(null)
const batchScreening = ref(false)
const autoBatchRanThisSession = ref(false)

const SCREEN_POS_KEY = 'talent_pool_screen_position_id'

const sourceSegmentOptions = [
  { label: '全部', value: '' },
  { label: '手动添加', value: 'manual' },
  { label: '文件导入', value: 'import' },
  { label: '网站爬取', value: 'crawl' }
]

const screeningBar = reactive({
  recruitment_position_id: null,
  autoOnImport: true,
  autoOnEnter: true
})

const skillTags = computed(() => {
  const raw = currentTalent.value?.skills
  if (!raw) return []
  return raw.split(/[,，;；\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 24)
})

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
  recruitment_position_id: null,
  auto_screen: true
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

const formatAiScore = (score) => {
  const n = Number(score)
  if (Number.isNaN(n)) return '-'
  return `${Math.round(n * 100)}%`
}

const getAiScoreType = (score) => {
  const n = Number(score)
  if (n >= 0.75) return 'success'
  if (n >= 0.5) return 'warning'
  return 'danger'
}

const onSourceTabChange = () => {
  pagination.page = 1
  loadData()
}

const openCreateDialog = () => {
  editingTalent.value = null
  resetForm()
  showCreateDialog.value = true
}

const persistScreeningPosition = () => {
  if (screeningBar.recruitment_position_id) {
    localStorage.setItem(SCREEN_POS_KEY, String(screeningBar.recruitment_position_id))
  }
}

const runBatchScreen = async (onlyUnscored) => {
  if (!screeningBar.recruitment_position_id) {
    ElMessage.warning('请先选择对标招聘职位')
    return
  }
  batchScreening.value = true
  try {
    await batchAiScreenTalents({
      recruitment_position_id: screeningBar.recruitment_position_id,
      only_unscored: onlyUnscored
    })
    await loadData()
  } catch (_) {
    // handled by interceptor
  } finally {
    batchScreening.value = false
  }
}

const maybeAutoBatchOnEnter = async () => {
  if (autoBatchRanThisSession.value) return
  if (!screeningBar.autoOnEnter || !screeningBar.recruitment_position_id) return
  const hasUnscored = talents.value.some((t) => t.ai_match_score == null)
  if (!hasUnscored) return
  autoBatchRanThisSession.value = true
  await runBatchScreen(true)
}

const handleRowCommand = async (command, row) => {
  if (command === 'view') {
    viewTalent(row)
  } else if (command === 'edit') {
    editTalent(row)
  } else if (command === 'reparse') {
    try {
      await reparseTalentResume(row.id)
      await loadData()
    } catch (_) {}
  } else if (command === 'link') {
    linkRecruitment(row)
  } else if (command === 'onboard') {
    convertOnboarding(row)
  } else if (command === 'delete') {
    deleteTalentRow(row)
  }
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
    await maybeAutoBatchOnEnter()
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
  aiScreenDetail.value = null
  if (row.ai_screen_result) {
    try {
      aiScreenDetail.value = JSON.parse(row.ai_screen_result)
    } catch (_) {
      aiScreenDetail.value = null
    }
  }
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
    const positionId = uploadForm.recruitment_position_id || screeningBar.recruitment_position_id
    if (positionId) {
      formData.append('recruitment_position_id', positionId)
      formData.append('screen_recruitment_position_id', positionId)
    }
    formData.append('auto_screen', uploadForm.auto_screen ? 'true' : 'false')

    const res = await uploadTalentFile(formData)
    if (res.parsedData?.name) {
      ElMessage.success(`解析成功：${res.parsedData.name}`)
    }
    showUploadDialog.value = false
    selectedFile.value = null
    uploadForm.recruitment_position_id = screeningBar.recruitment_position_id
    uploadForm.auto_screen = screeningBar.autoOnImport
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
onMounted(async () => {
  const saved = localStorage.getItem(SCREEN_POS_KEY)
  if (saved) {
    screeningBar.recruitment_position_id = parseInt(saved, 10)
  }
  await loadBaseData()
  await loadData()
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

.search-actions {
  margin-left: 8px;
}

.action-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.action-card__left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ai-screen-card {
  margin-bottom: 16px;
  padding: 16px 20px;
  background: #f5f8ff;
  border: 1px solid #d9e5ff;
  border-radius: 8px;
}

.ai-screen-card__title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.ai-screen-card__body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.ai-screen-card__hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: #909399;
}

.text-muted {
  color: #a0aec0;
  font-size: 12px;
}

.dialog-scroll-body {
  max-height: 62vh;
  overflow-y: auto;
  padding-right: 8px;
}

.ai-screen-panel {
  margin-top: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.ai-screen-panel h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #4a5568;
}

.tag-gap {
  margin: 4px 6px 0 0;
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

:deep(.el-table td.col-actions .cell) {
  overflow: visible;
  text-overflow: clip;
  padding: 8px 6px;
}

.table-row-actions {
  display: inline-flex;
  justify-content: center;
  width: 100%;
}

.table-row-actions .el-button {
  min-width: 72px;
}

.number-with-unit {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.number-with-unit .el-input-number {
  flex: 1;
}

.number-unit {
  color: #606266;
  font-size: 14px;
  flex-shrink: 0;
}

.talent-pool-management :deep(.table-row-actions .el-button--primary.is-plain) {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}

:deep(.el-table tr:hover > td) {
  background-color: #f7fafc;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.detail-header h3 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.detail-header__sub {
  margin: 6px 0 0;
  color: #606266;
  font-size: 13px;
}

.detail-header__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-body {
  max-height: 68vh;
  overflow-y: auto;
  padding-right: 4px;
}

.detail-section {
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f2f5;
}

.detail-section h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #303133;
}

.detail-section--highlight {
  background: #f8fbff;
  border: 1px solid #e5efff;
  border-radius: 8px;
  padding: 12px;
  border-bottom: none;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  font-size: 13px;
  color: #303133;
}

.detail-grid span {
  display: inline-block;
  width: 72px;
  color: #909399;
}

.detail-text {
  margin: 0;
  line-height: 1.7;
  color: #606266;
  white-space: pre-wrap;
}

.detail-pre {
  margin: 0;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

</style>

