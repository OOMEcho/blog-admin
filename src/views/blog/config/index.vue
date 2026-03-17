<template>
  <div class="page-container">
    <div v-loading="loading">
      <!-- 站点信息 -->
      <el-card class="config-card">
        <div slot="header" class="card-header">
          <span><i class="el-icon-setting" style="margin-right:6px"/>站点信息</span>
        </div>
        <el-form :model="siteForm" label-width="110px" size="small">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="站点名称">
                <el-input v-model="siteForm.site_name" placeholder="请输入站点名称" clearable/>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="站点作者">
                <el-input v-model="siteForm.site_author" placeholder="请输入作者名称" clearable/>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="站点描述">
            <el-input v-model="siteForm.site_description" type="textarea" :rows="2" placeholder="请输入站点描述"/>
          </el-form-item>
          <el-form-item label="站点公告">
            <el-input v-model="siteForm.site_notice" type="textarea" :rows="2" placeholder="请输入站点公告内容"/>
          </el-form-item>
          <el-form-item label="关于内容">
            <el-input v-model="siteForm.site_about" type="textarea" :rows="4" placeholder="支持 HTML 内容"/>
          </el-form-item>
          <el-row :gutter="24">
            <el-col :span="16">
              <el-form-item label="站点头像">
                <el-input v-model="siteForm.site_avatar" placeholder="请输入头像图片URL" clearable/>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <div v-if="siteForm.site_avatar" class="avatar-preview">
                <el-image
                  :src="siteForm.site_avatar"
                  :preview-src-list="[siteForm.site_avatar]"
                  fit="cover"
                  style="width:48px;height:48px;border-radius:50%;border:1px solid #ebeef5"
                >
                  <div slot="error" class="avatar-error">无效</div>
                </el-image>
              </div>
            </el-col>
          </el-row>
          <el-form-item label="页脚文案">
            <el-input v-model="siteForm.site_footer" placeholder="例如：© 2026 我的博客" clearable/>
          </el-form-item>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="ICP备案号">
                <el-input v-model="siteForm.site_record_number" placeholder="例如：蜀ICP备2020025692号-2" clearable/>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="ICP备案链接">
                <el-input v-model="siteForm.site_record_url" placeholder="https://beian.miit.gov.cn" clearable/>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="公安备案号">
                <el-input v-model="siteForm.site_public_security_record_number" placeholder="例如：川公网安备 xxxxxxxxxxx号" clearable/>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="公安备案链接">
                <el-input v-model="siteForm.site_public_security_record_url" placeholder="https://www.beian.gov.cn/..." clearable/>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <!-- 社交链接 -->
      <el-card class="config-card">
        <div slot="header" class="card-header">
          <span><i class="el-icon-share" style="margin-right:6px"/>社交链接</span>
        </div>
        <el-form :model="socialForm" label-width="110px" size="small">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="GitHub">
                <el-input v-model="socialForm.social_github" placeholder="https://github.com/xxx" clearable>
                  <i slot="prefix" class="el-icon-link"/>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Gitee">
                <el-input v-model="socialForm.social_gitee" placeholder="https://gitee.com/xxx" clearable>
                  <i slot="prefix" class="el-icon-link"/>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="联系邮箱">
                <el-input v-model="socialForm.social_email" placeholder="example@email.com" clearable>
                  <i slot="prefix" class="el-icon-message"/>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="QQ号码">
                <el-input v-model="socialForm.social_qq" placeholder="请输入QQ号码" clearable>
                  <i slot="prefix" class="el-icon-chat-dot-round"/>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <!-- 保存按钮 -->
      <div class="save-bar">
        <el-button v-perm="PERMS.config.batchUpdate" type="primary" size="medium" icon="el-icon-check" :loading="saving" @click="handleSaveAll">保存全部</el-button>
        <el-button size="medium" icon="el-icon-refresh-left" @click="fetchList">重置</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import {getBlogConfigList, batchUpdateBlogConfig} from '@/api/blogconfig'
import {PERMS} from '@/utils/permCode'

/** 配置键与所属分组映射 */
const SITE_KEYS = [
  'site_name',
  'site_description',
  'site_author',
  'site_avatar',
  'site_notice',
  'site_about',
  'site_record_number',
  'site_record_url',
  'site_public_security_record_number',
  'site_public_security_record_url',
  'site_footer'
]
const SOCIAL_KEYS = ['social_github', 'social_gitee', 'social_email', 'social_qq']

export default {
  name: 'BlogConfigPage',
  data() {
    return {
      PERMS,
      loading: false,
      saving: false,
      configList: [],
      siteForm: this.getDefaultSiteForm(),
      socialForm: this.getDefaultSocialForm()
    }
  },
  created() { this.fetchList() },
  methods: {
    getDefaultSiteForm() {
      return {
        site_name: '',
        site_description: '',
        site_author: '',
        site_avatar: '',
        site_notice: '',
        site_about: '',
        site_record_number: '',
        site_record_url: '',
        site_public_security_record_number: '',
        site_public_security_record_url: '',
        site_footer: ''
      }
    },
    getDefaultSocialForm() {
      return {
        social_github: '',
        social_gitee: '',
        social_email: '',
        social_qq: ''
      }
    },
    getConfigValue(configKey) {
      if (Object.prototype.hasOwnProperty.call(this.siteForm, configKey)) {
        return this.siteForm[configKey]
      }
      if (Object.prototype.hasOwnProperty.call(this.socialForm, configKey)) {
        return this.socialForm[configKey]
      }
      return ''
    },
    async fetchList() {
      this.loading = true
      try {
        const data = await getBlogConfigList()
        this.configList = data || []
        this.siteForm = this.getDefaultSiteForm()
        this.socialForm = this.getDefaultSocialForm()
        this.configList.forEach(item => {
          if (SITE_KEYS.includes(item.configKey)) {
            this.siteForm[item.configKey] = item.configValue || ''
          } else if (SOCIAL_KEYS.includes(item.configKey)) {
            this.socialForm[item.configKey] = item.configValue || ''
          }
        })
      } finally {
        this.loading = false
      }
    },
    async handleSaveAll() {
      this.saving = true
      try {
        const managedKeys = [...SITE_KEYS, ...SOCIAL_KEYS]
        const payload = managedKeys.map(configKey => ({
          configKey,
          configValue: this.getConfigValue(configKey)
        }))
        await batchUpdateBlogConfig(payload)
        this.$message.success('保存成功')
        await this.fetchList()
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.config-card {
  margin-bottom: 16px;
}
.save-bar {
  text-align: center;
  padding: 8px 0 16px;
}
.avatar-preview {
  display: flex;
  align-items: center;
  height: 32px;
}
.avatar-error {
  font-size: 11px;
  color: #c0c4cc;
  text-align: center;
  line-height: 48px;
}
</style>
