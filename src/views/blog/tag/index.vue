<template>
  <div class="page-container">
    <el-card>
      <div slot="header" class="card-header">
        <span>标签管理</span>
      </div>

      <el-form :inline="true" :model="queryParams" class="search-form" size="small">
        <el-form-item label="标签名称">
          <el-input v-model="queryParams.name" placeholder="标签名称" clearable/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-toolbar">
        <el-button v-perm="PERMS.tag.add" type="primary" size="small" icon="el-icon-plus" @click="handleAdd">新增</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="name" label="标签名称" min-width="150">
          <template slot-scope="scope">
            <el-tag
              :style="scope.row.color ? `background-color:${scope.row.color};border-color:${scope.row.color};color:#fff` : ''"
              size="small"
            >{{ scope.row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="颜色" width="130" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.color" class="color-dot" :style="`background:${scope.row.color}`"/>
            <span v-if="scope.row.color" class="color-text">{{ scope.row.color }}</span>
            <span v-else style="color:#c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="155"/>
        <el-table-column label="操作" min-width="100" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-tooltip v-perm="PERMS.tag.update" content="编辑" placement="top" popper-class="action-tooltip">
                <el-button type="text" size="mini" icon="el-icon-edit" class="action-icon is-primary" @click="handleEdit(scope.row)"/>
              </el-tooltip>
              <el-tooltip v-perm="PERMS.tag.delete" content="删除" placement="top" popper-class="action-tooltip">
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

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="420px" :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入标签名称"/>
        </el-form-item>
        <el-form-item label="标签颜色">
          <div class="color-picker-row">
            <el-color-picker v-model="form.color" :predefine="predefineColors"/>
            <el-input v-model="form.color" placeholder="#409EFF（可手动输入）" style="margin-left:12px"/>
            <el-button
              v-if="form.color"
              type="text"
              style="margin-left:8px;color:#909399"
              @click="form.color = ''"
            >清除</el-button>
          </div>
          <div v-if="form.name || form.color" class="tag-preview">
            预览：
            <el-tag
              :style="form.color ? `background-color:${form.color};border-color:${form.color};color:#fff` : ''"
              size="small"
            >{{ form.name || '标签名称' }}</el-tag>
          </div>
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
import {getTagPageList, addTag, updateTag, deleteTag} from '@/api/tag'
import {PERMS} from '@/utils/permCode'

export default {
  name: 'TagPage',
  data() {
    return {
      PERMS,
      loading: false,
      submitting: false,
      tableData: [],
      total: 0,
      queryParams: {pageNum: 1, pageSize: 10, name: ''},
      dialogVisible: false,
      dialogTitle: '新增标签',
      form: {id: null, name: '', color: ''},
      rules: {name: [{required: true, message: '请输入标签名称', trigger: 'blur'}]},
      predefineColors: [
        '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
        '#9B59B6', '#1ABC9C', '#E67E22', '#E74C3C', '#3498DB',
        '#2ECC71', '#F39C12', '#D35400', '#C0392B', '#16A085'
      ]
    }
  },
  created() { this.fetchList() },
  methods: {
    async fetchList() {
      this.loading = true
      try {
        const res = await getTagPageList(this.queryParams)
        this.tableData = res.records || []
        this.total = Number(res.total || 0)
      } finally { this.loading = false }
    },
    handleSearch() { this.queryParams.pageNum = 1; this.fetchList() },
    handleReset() { this.queryParams = {pageNum: 1, pageSize: 10, name: ''}; this.fetchList() },
    handleAdd() {
      this.dialogTitle = '新增标签'
      this.form = {id: null, name: '', color: ''}
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    handleEdit(row) {
      this.dialogTitle = '编辑标签'
      this.form = {id: row.id, name: row.name, color: row.color || ''}
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    /** 将颜色值统一转为十六进制格式，兼容 rgba/rgb 输入 */
    normalizeColor(color) {
      if (!color) return ''
      // 已是 hex 格式直接返回
      if (/^#[0-9a-fA-F]{3,6}$/.test(color)) return color
      // rgba / rgb → hex
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, '0')
        const g = parseInt(match[2]).toString(16).padStart(2, '0')
        const b = parseInt(match[3]).toString(16).padStart(2, '0')
        return `#${r}${g}${b}`
      }
      return color
    },
    async handleSubmit() {
      this.$refs.form.validate(async valid => {
        if (!valid) return
        this.submitting = true
        try {
          const data = {...this.form, color: this.normalizeColor(this.form.color)}
          if (data.id) {
            await updateTag(data); this.$message.success('修改成功')
          } else {
            await addTag(data); this.$message.success('新增成功')
          }
          this.dialogVisible = false; this.fetchList()
        } finally { this.submitting = false }
      })
    },
    handleDelete(row) {
      this.$confirm(`确认删除标签「${row.name}」？`, '删除确认', {type: 'warning'}).then(async () => {
        await deleteTag(row.id)
        this.$message.success('删除成功')
        this.fetchList()
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.color-picker-row {
  display: flex;
  align-items: center;
}
.color-dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
  border: 1px solid rgba(0,0,0,.1);
}
.color-text {
  font-size: 12px;
  color: #606266;
  vertical-align: middle;
}
.tag-preview {
  margin-top: 10px;
  font-size: 13px;
  color: #606266;
}
</style>
