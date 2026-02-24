<template>
  <div class="page-container">
    <el-card>
      <div slot="header" class="card-header">
        <span>友链管理</span>
      </div>

      <el-form :inline="true" :model="queryParams" class="search-form" size="small">
        <el-form-item label="网站名称">
          <el-input v-model="queryParams.name" placeholder="网站名称" clearable/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-toolbar">
        <el-button v-perm="PERMS.link.add" type="primary" size="small" icon="el-icon-plus" @click="handleAdd">新增</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="name" label="网站名称" min-width="130"/>
        <el-table-column label="网站地址" min-width="200" show-overflow-tooltip>
          <template slot-scope="scope">
            <a
              v-if="isValidUrl(scope.row.url)"
              :href="scope.row.url"
              target="_blank"
              rel="noopener noreferrer"
              class="link-url"
            >{{ scope.row.url }}</a>
            <span v-else>{{ scope.row.url }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Logo" width="70" align="center">
          <template slot-scope="scope">
            <el-image
              v-if="scope.row.logo"
              :src="scope.row.logo"
              :preview-src-list="[scope.row.logo]"
              fit="contain"
              style="width:36px;height:36px;border-radius:4px;vertical-align:middle"
            >
              <div slot="error" style="font-size:11px;color:#c0c4cc;line-height:36px">无</div>
            </el-image>
            <span v-else style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip/>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'info'" size="mini">
              {{ scope.row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" align="center"/>
        <el-table-column prop="createTime" label="创建时间" width="155"/>
        <el-table-column label="操作" min-width="100" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-tooltip v-perm="PERMS.link.update" content="编辑" placement="top" popper-class="action-tooltip">
                <el-button type="text" size="mini" icon="el-icon-edit" class="action-icon is-primary" @click="handleEdit(scope.row)"/>
              </el-tooltip>
              <el-tooltip v-perm="PERMS.link.delete" content="删除" placement="top" popper-class="action-tooltip">
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

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="560px" :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="网站名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入网站名称"/>
        </el-form-item>
        <el-form-item label="网站地址" prop="url">
          <el-input v-model="form.url" placeholder="https://example.com"/>
        </el-form-item>
        <el-form-item label="Logo URL">
          <el-input v-model="form.logo" placeholder="Logo 图片地址"/>
          <div v-if="form.logo" style="margin-top:8px">
            <el-image
              :src="form.logo"
              fit="contain"
              style="width:48px;height:48px;border:1px solid #ebeef5;border-radius:4px"
            >
              <div slot="error" style="font-size:11px;color:#c0c4cc;text-align:center;line-height:48px">加载失败</div>
            </el-image>
          </div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="网站描述"/>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" style="width:100%"/>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {getLinkPageList, addLink, updateLink, deleteLink} from '@/api/link'
import {PERMS} from '@/utils/permCode'

export default {
  name: 'LinkPage',
  data() {
    return {
      PERMS,
      loading: false,
      submitting: false,
      tableData: [],
      total: 0,
      queryParams: {pageNum: 1, pageSize: 10, name: ''},
      dialogVisible: false,
      dialogTitle: '新增友链',
      form: {id: null, name: '', url: '', logo: '', description: '', status: '0', sort: 0},
      rules: {
        name: [{required: true, message: '请输入网站名称', trigger: 'blur'}],
        url: [{required: true, message: '请输入网站地址', trigger: 'blur'}]
      }
    }
  },
  created() { this.fetchList() },
  methods: {
    async fetchList() {
      this.loading = true
      try {
        const res = await getLinkPageList(this.queryParams)
        this.tableData = res.records || []
        this.total = Number(res.total || 0)
      } finally { this.loading = false }
    },
    handleSearch() { this.queryParams.pageNum = 1; this.fetchList() },
    handleReset() { this.queryParams = {pageNum: 1, pageSize: 10, name: ''}; this.fetchList() },
    handleAdd() {
      this.dialogTitle = '新增友链'
      this.form = {id: null, name: '', url: '', logo: '', description: '', status: '0', sort: 0}
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    handleEdit(row) {
      this.dialogTitle = '编辑友链'
      this.form = {id: row.id, name: row.name, url: row.url, logo: row.logo || '', description: row.description || '', status: row.status, sort: row.sort || 0}
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    async handleSubmit() {
      this.$refs.form.validate(async valid => {
        if (!valid) return
        this.submitting = true
        try {
          if (this.form.id) {
            await updateLink(this.form); this.$message.success('修改成功')
          } else {
            await addLink(this.form); this.$message.success('新增成功')
          }
          this.dialogVisible = false; this.fetchList()
        } finally { this.submitting = false }
      })
    },
    handleDelete(row) {
      this.$confirm(`确认删除友链「${row.name}」？`, '删除确认', {type: 'warning'}).then(async () => {
        await deleteLink(row.id)
        this.$message.success('删除成功')
        this.fetchList()
      }).catch(() => {})
    },
    /** 判断是否为合法 http/https 链接 */
    isValidUrl(url) {
      return url && /^https?:\/\/.+/.test(url)
    }
  }
}
</script>

<style scoped>
.link-url {
  color: #409EFF;
  text-decoration: none;
}
.link-url:hover {
  text-decoration: underline;
}
</style>
