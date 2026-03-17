<template>
  <div class="page-container">
    <el-card>
      <div slot="header" class="card-header">
        <span>文章管理</span>
      </div>

      <el-form :inline="true" :model="queryParams" class="search-form" size="small">
        <el-form-item label="标题">
          <el-input v-model="queryParams.title" placeholder="文章标题" clearable/>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" value="0"/>
            <el-option label="已发布" value="1"/>
            <el-option label="待审核" value="2"/>
            <el-option label="审核拒绝" value="3"/>
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="queryParams.categoryId" placeholder="请选择分类" clearable>
            <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id"/>
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="yyyy-MM-dd"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-toolbar">
        <el-button v-perm="PERMS.article.add" type="primary" size="small" icon="el-icon-plus" @click="handleAdd">新增</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip/>
        <el-table-column prop="categoryName" label="分类" width="100"/>
        <el-table-column label="标签" width="160">
          <template slot-scope="scope">
            <el-tag
              v-for="tag in (scope.row.tagList || [])"
              :key="tag.id"
              size="mini"
              style="margin-right:4px;margin-bottom:2px"
              :style="tag.color ? `background-color:${tag.color};border-color:${tag.color};color:#fff` : ''"
            >{{ tag.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTagType(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="浏览量" width="80" align="center"/>
        <el-table-column label="置顶" width="70" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.isTop ? 'danger' : 'info'" size="mini">{{ scope.row.isTop ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="155"/>
        <el-table-column label="操作" min-width="160" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-tooltip v-perm="PERMS.article.update" content="编辑" placement="top" popper-class="action-tooltip">
                <el-button type="text" size="mini" icon="el-icon-edit" class="action-icon is-primary" @click="handleEdit(scope.row)"/>
              </el-tooltip>
              <el-tooltip v-if="scope.row.status === '2'" v-perm="PERMS.article.audit" content="审核通过" placement="top" popper-class="action-tooltip">
                <el-button type="text" size="mini" icon="el-icon-check" class="action-icon is-success" @click="handleAudit(scope.row, '1')"/>
              </el-tooltip>
              <el-tooltip v-if="scope.row.status === '2'" v-perm="PERMS.article.audit" content="审核拒绝" placement="top" popper-class="action-tooltip">
                <el-button type="text" size="mini" icon="el-icon-close" class="action-icon is-warning" @click="handleAudit(scope.row, '3')"/>
              </el-tooltip>
              <el-tooltip v-perm="PERMS.article.delete" content="删除" placement="top" popper-class="action-tooltip">
                <el-button type="text" size="mini" icon="el-icon-delete" class="action-icon is-danger" @click="handleDelete(scope.row)"/>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top:16px;text-align:right"
        :current-page="queryParams.pageNum"
        :page-size="queryParams.pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @size-change="val => { queryParams.pageSize = val; fetchList() }"
        @current-change="val => { queryParams.pageNum = val; fetchList() }"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="80%" top="5vh" :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入文章标题"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分类" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="请选择分类" style="width:100%">
                <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="标签">
          <el-select v-model="form.tagIds" multiple placeholder="请选择标签" style="width:100%">
            <el-option v-for="item in tagList" :key="item.id" :label="item.name" :value="item.id">
              <el-tag
                size="mini"
                :style="item.color ? `background-color:${item.color};border-color:${item.color};color:#fff` : ''"
              >{{ item.name }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="封面图">
              <div style="display:flex;align-items:center;gap:8px;">
                <el-input v-model="form.coverImage" placeholder="封面图URL"/>
                <el-upload
                  action="#"
                  :show-file-list="false"
                  :http-request="handleCoverUpload">
                  <el-button size="small">上传封面</el-button>
                </el-upload>
              </div>
              <img
                v-if="form.coverImage"
                :src="form.coverImage"
                alt="封面预览"
                style="margin-top:10px;max-width:220px;max-height:120px;border:1px solid #ebeef5;border-radius:4px;object-fit:cover;"
              >
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="置顶">
              <el-switch v-model="form.isTop" :active-value="1" :inactive-value="0"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="排序">
              <el-input-number v-model="form.sort" :min="0" style="width:100%"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="摘要">
          <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="文章摘要"/>
        </el-form-item>
        <el-form-item label="正文" prop="content">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <el-button size="small" icon="el-icon-upload2" @click="triggerMarkdownImport">导入 Markdown</el-button>
            <span style="font-size:12px;color:#909399;">支持 .md / .markdown / .txt，最大 5MB</span>
            <input
              ref="markdownInput"
              type="file"
              accept=".md,.markdown,.txt,text/markdown,text/plain"
              style="display:none"
              @change="handleMarkdownImport"
            >
          </div>
          <mavon-editor
            v-model="form.content"
            style="min-height:400px"
            ref="mavonEditor"
            @imgAdd="handleImageAdd"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button :loading="submitting" @click="handleSubmit('0')">保存草稿</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit('2')">提交审核</el-button>
      </div>
    </el-dialog>

    <!-- 审核拒绝弹窗 -->
    <el-dialog title="审核拒绝" :visible.sync="rejectDialogVisible" width="500px">
        <el-form ref="rejectForm" :model="rejectForm" label-width="80px">
          <el-form-item label="拒绝原因">
            <el-input v-model="rejectForm.rejectReason" type="textarea" :rows="3" placeholder="请输入拒绝原因"/>
          </el-form-item>
        </el-form>
      <div slot="footer">
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="confirmReject">确认拒绝</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {getArticlePageList, addArticle, updateArticle, deleteArticle, auditArticle} from '@/api/article'
import {getCategoryList} from '@/api/category'
import {getTagList} from '@/api/tag'
import {uploadFile} from '@/api/file'
import {PERMS} from '@/utils/permCode'
import mavonEditor from 'mavon-editor'
import 'mavon-editor/dist/css/index.css'

export default {
  name: 'ArticlePage',
  components: {mavonEditor: mavonEditor.mavonEditor},
  data() {
    return {
      PERMS,
      loading: false,
      submitting: false,
      tableData: [],
      total: 0,
      dateRange: [],
      queryParams: {pageNum: 1, pageSize: 10, title: '', status: '', categoryId: null},
      categoryList: [],
      tagList: [],
      dialogVisible: false,
      dialogTitle: '新增文章',
      form: {id: null, authorId: null, title: '', categoryId: null, tagIds: [], status: '', coverImage: '', isTop: 0, sort: 0, summary: '', content: ''},
      maxMarkdownSize: 5 * 1024 * 1024,
      rules: {
        title: [{required: true, message: '请输入文章标题', trigger: 'blur'}],
        categoryId: [{required: true, message: '请选择分类', trigger: 'change'}],
        content: [{required: true, message: '请输入文章正文', trigger: 'blur'}]
      },
      rejectDialogVisible: false,
      rejectForm: {id: null, rejectReason: ''}
    }
  },
  created() {
    this.fetchList()
    this.fetchOptions()
  },
  methods: {
    async fetchList() {
      this.loading = true
      try {
        const params = {...this.queryParams}
        if (this.dateRange && this.dateRange.length === 2) {
          params.beginTime = this.dateRange[0]
          params.endTime = this.dateRange[1]
        }
        const res = await getArticlePageList(params)
        this.tableData = res.records || []
        this.total = Number(res.total || 0)
      } finally {
        this.loading = false
      }
    },
    async fetchOptions() {
      const [catRes, tagRes] = await Promise.all([getCategoryList(), getTagList()])
      this.categoryList = catRes || []
      this.tagList = tagRes || []
    },
    handleSearch() {
      this.queryParams.pageNum = 1
      this.fetchList()
    },
    handleReset() {
      this.queryParams = {pageNum: 1, pageSize: 10, title: '', status: '', categoryId: null}
      this.dateRange = []
      this.fetchList()
    },
    handleAdd() {
      this.dialogTitle = '新增文章'
      this.form = {id: null, authorId: null, title: '', categoryId: null, tagIds: [], status: '', coverImage: '', isTop: 0, sort: 0, summary: '', content: ''}
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    handleEdit(row) {
      this.dialogTitle = '编辑文章'
      this.form = {
        id: row.id, authorId: row.authorId, title: row.title, categoryId: row.categoryId,
        tagIds: (row.tagList || []).map(t => t.id), status: '',
        coverImage: row.coverImage || '', isTop: row.isTop || 0,
        sort: row.sort || 0, summary: row.summary || '', content: row.content || ''
      }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    resolveAccessUrl(fileMeta) {
      if (!fileMeta) {
        return ''
      }
      return fileMeta.accessUrl || ''
    },
    triggerMarkdownImport() {
      if (this.$refs.markdownInput) {
        this.$refs.markdownInput.click()
      }
    },
    isMarkdownFile(file) {
      const lowerName = ((file && file.name) || '').toLowerCase()
      return lowerName.endsWith('.md') || lowerName.endsWith('.markdown') || lowerName.endsWith('.txt')
    },
    resetMarkdownInput() {
      if (this.$refs.markdownInput) {
        this.$refs.markdownInput.value = ''
      }
    },
    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result || '')
        reader.onerror = () => reject(new Error('读取文件失败'))
        reader.readAsText(file, 'utf-8')
      })
    },
    async handleMarkdownImport(event) {
      const file = event.target && event.target.files && event.target.files[0]
      if (!file) {
        return
      }

      try {
        if (!this.isMarkdownFile(file)) {
          this.$message.warning('仅支持 .md / .markdown / .txt 文件')
          return
        }

        if (file.size > this.maxMarkdownSize) {
          this.$message.warning('文件大小不能超过 5MB')
          return
        }

        if ((this.form.content || '').trim()) {
          try {
            await this.$confirm('导入将覆盖当前正文内容，是否继续？', '覆盖确认', {type: 'warning'})
          } catch (e) {
            return
          }
        }

        let text = await this.readFileAsText(file)
        if (typeof text !== 'string') {
          text = String(text || '')
        }

        text = text.replace(/^\uFEFF/, '')
        this.form.content = text

        this.$nextTick(() => {
          if (this.$refs.form) {
            this.$refs.form.validateField('content')
          }
        })

        this.$message.success(`已导入：${file.name}`)
      } catch (error) {
        console.error(error)
        this.$message.error('Markdown 导入失败')
      } finally {
        this.resetMarkdownInput()
      }
    },
    async handleImageAdd(pos, file) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        const data = await uploadFile(formData, 'article')
        const imageUrl = this.resolveAccessUrl(data)
        if (!imageUrl) {
          throw new Error('上传成功但未返回访问地址')
        }
        this.$refs.mavonEditor.$img2Url(pos, imageUrl)
        this.$message.success('图片上传成功')
      } catch (error) {
        console.error(error)
        this.$message.error('图片上传失败')
      }
    },
    async handleCoverUpload(option) {
      const formData = new FormData()
      formData.append('file', option.file)
      try {
        const data = await uploadFile(formData, 'article/cover')
        const coverUrl = this.resolveAccessUrl(data)
        if (!coverUrl) {
          throw new Error('上传成功但未返回访问地址')
        }
        this.form.coverImage = coverUrl
        this.$message.success('封面上传成功')
        if (option.onSuccess) {
          option.onSuccess(data)
        }
      } catch (error) {
        console.error(error)
        this.$message.error('封面上传失败')
        if (option.onError) {
          option.onError(error)
        }
      }
    },
    async handleSubmit(status) {
      this.$refs.form.validate(async valid => {
        if (!valid) return
        this.submitting = true
        try {
          const data = {...this.form, status}
          if (data.id) {
            await updateArticle(data)
            this.$message.success('修改成功')
          } else {
            await addArticle(data)
            this.$message.success(status === '2' ? '提交审核成功' : '保存草稿成功')
          }
          this.dialogVisible = false
          this.fetchList()
        } finally {
          this.submitting = false
        }
      })
    },
    handleAudit(row, status) {
      if (status === '1') {
        this.$confirm(`确认审核通过文章《${row.title}》？`, '审核确认', {type: 'success'}).then(async () => {
          await auditArticle(row.id, {status, rejectReason: ''})
          this.$message.success('审核通过')
          this.fetchList()
        }).catch(() => {})
      } else {
        this.rejectForm = {id: row.id, rejectReason: ''}
        this.rejectDialogVisible = true
      }
    },
    async confirmReject() {
      if (!this.rejectForm.rejectReason || !this.rejectForm.rejectReason.trim()) {
        this.$message.warning('请填写拒绝原因')
        return
      }
      this.submitting = true
      try {
        await auditArticle(this.rejectForm.id, {
          status: '3',
          rejectReason: this.rejectForm.rejectReason.trim()
        })
        this.$message.success('已拒绝')
        this.rejectDialogVisible = false
        this.fetchList()
      } finally {
        this.submitting = false
      }
    },
    handleDelete(row) {
      this.$confirm(`确认删除文章《${row.title}》？`, '删除确认', {type: 'warning'}).then(async () => {
        await deleteArticle(row.id)
        this.$message.success('删除成功')
        this.fetchList()
      }).catch(() => {})
    },
    statusLabel(status) {
      const map = {'0': '草稿', '1': '已发布', '2': '待审核', '3': '审核拒绝'}
      return map[status] || status
    },
    statusTagType(status) {
      const map = {'0': 'info', '1': 'success', '2': 'warning', '3': 'danger'}
      return map[status] || 'info'
    }
  }
}
</script>
