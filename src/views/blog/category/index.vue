<template>
  <div class="page-container">
    <el-card>
      <div slot="header" class="card-header">
        <span>分类管理</span>
      </div>

      <el-form :inline="true" :model="queryParams" class="search-form" size="small">
        <el-form-item label="分类名称">
          <el-input v-model="queryParams.name" placeholder="分类名称" clearable/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-toolbar">
        <el-button v-perm="PERMS.category.add" type="primary" size="small" icon="el-icon-plus" @click="handleAdd">新增</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="name" label="分类名称" min-width="150"/>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip/>
        <el-table-column prop="sort" label="排序" width="80" align="center"/>
        <el-table-column prop="createTime" label="创建时间" width="155"/>
        <el-table-column label="操作" min-width="100" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-tooltip v-perm="PERMS.category.update" content="编辑" placement="top" popper-class="action-tooltip">
                <el-button type="text" size="mini" icon="el-icon-edit" class="action-icon is-primary" @click="handleEdit(scope.row)"/>
              </el-tooltip>
              <el-tooltip v-perm="PERMS.category.delete" content="删除" placement="top" popper-class="action-tooltip">
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

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="500px" :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称"/>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="分类描述（可选）"/>
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
import {getCategoryPageList, addCategory, updateCategory, deleteCategory} from '@/api/category'
import {PERMS} from '@/utils/permCode'

export default {
  name: 'CategoryPage',
  data() {
    return {
      PERMS,
      loading: false,
      submitting: false,
      tableData: [],
      total: 0,
      queryParams: {pageNum: 1, pageSize: 10, name: ''},
      dialogVisible: false,
      dialogTitle: '新增分类',
      form: {id: null, name: '', description: '', sort: 0},
      rules: {name: [{required: true, message: '请输入分类名称', trigger: 'blur'}]}
    }
  },
  created() { this.fetchList() },
  methods: {
    async fetchList() {
      this.loading = true
      try {
        const res = await getCategoryPageList(this.queryParams)
        this.tableData = res.records || []
        this.total = Number(res.total || 0)
      } finally { this.loading = false }
    },
    handleSearch() { this.queryParams.pageNum = 1; this.fetchList() },
    handleReset() { this.queryParams = {pageNum: 1, pageSize: 10, name: ''}; this.fetchList() },
    handleAdd() {
      this.dialogTitle = '新增分类'
      this.form = {id: null, name: '', description: '', sort: 0}
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    handleEdit(row) {
      this.dialogTitle = '编辑分类'
      this.form = {id: row.id, name: row.name, description: row.description || '', sort: row.sort || 0}
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    async handleSubmit() {
      this.$refs.form.validate(async valid => {
        if (!valid) return
        this.submitting = true
        try {
          if (this.form.id) {
            await updateCategory(this.form); this.$message.success('修改成功')
          } else {
            await addCategory(this.form); this.$message.success('新增成功')
          }
          this.dialogVisible = false; this.fetchList()
        } finally { this.submitting = false }
      })
    },
    handleDelete(row) {
      this.$confirm(`确认删除分类「${row.name}」？`, '删除确认', {type: 'warning'}).then(async () => {
        await deleteCategory(row.id)
        this.$message.success('删除成功')
        this.fetchList()
      }).catch(() => {})
    }
  }
}
</script>
