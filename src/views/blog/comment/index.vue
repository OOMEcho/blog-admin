<template>
  <div class="page-container">
    <el-card>
      <div slot="header" class="card-header">
        <span>评论管理</span>
      </div>

      <el-form :inline="true" :model="queryParams" class="search-form" size="small">
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="审核状态" clearable>
            <el-option label="待审核" value="0"/>
            <el-option label="已通过" value="1"/>
            <el-option label="已拒绝" value="2"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="nickname" label="评论用户" width="120"/>
        <el-table-column prop="articleTitle" label="所属文章" min-width="180" show-overflow-tooltip/>
        <el-table-column prop="content" label="评论内容" min-width="220" show-overflow-tooltip/>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTagType(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="120"/>
        <el-table-column prop="location" label="归属地" width="100"/>
        <el-table-column prop="createTime" label="评论时间" width="155"/>
        <el-table-column label="操作" min-width="120" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-tooltip v-if="scope.row.status === '0'" v-perm="PERMS.comment.audit" content="审核通过" placement="top" popper-class="action-tooltip">
                <el-button type="text" size="mini" icon="el-icon-check" class="action-icon is-success" @click="handleAudit(scope.row, '1')"/>
              </el-tooltip>
              <el-tooltip v-if="scope.row.status === '0'" v-perm="PERMS.comment.audit" content="审核拒绝" placement="top" popper-class="action-tooltip">
                <el-button type="text" size="mini" icon="el-icon-close" class="action-icon is-warning" @click="handleAudit(scope.row, '2')"/>
              </el-tooltip>
              <el-tooltip v-perm="PERMS.comment.delete" content="删除" placement="top" popper-class="action-tooltip">
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
  </div>
</template>

<script>
import {getCommentPageList, updateCommentStatus, deleteComment} from '@/api/comment'
import {PERMS} from '@/utils/permCode'

export default {
  name: 'CommentPage',
  data() {
    return {
      PERMS,
      loading: false,
      tableData: [],
      total: 0,
      queryParams: {pageNum: 1, pageSize: 10, status: ''}
    }
  },
  created() { this.fetchList() },
  methods: {
    async fetchList() {
      this.loading = true
      try {
        const res = await getCommentPageList(this.queryParams)
        this.tableData = res.records || []
        this.total = Number(res.total || 0)
      } finally { this.loading = false }
    },
    handleSearch() { this.queryParams.pageNum = 1; this.fetchList() },
    handleReset() { this.queryParams = {pageNum: 1, pageSize: 10, status: ''}; this.fetchList() },
    handleAudit(row, status) {
      const action = status === '1' ? '通过' : '拒绝'
      this.$confirm(`确认${action}该评论？`, `审核${action}`, {type: status === '1' ? 'success' : 'warning'}).then(async () => {
        await updateCommentStatus(row.id, status)
        this.$message.success(`已${action}`)
        this.fetchList()
      }).catch(() => {})
    },
    handleDelete(row) {
      this.$confirm('确认删除该评论？', '删除确认', {type: 'warning'}).then(async () => {
        await deleteComment(row.id)
        this.$message.success('删除成功')
        this.fetchList()
      }).catch(() => {})
    },
    statusLabel(status) {
      const map = {'0': '待审核', '1': '已通过', '2': '已拒绝'}
      return map[status] || status
    },
    statusTagType(status) {
      const map = {'0': 'warning', '1': 'success', '2': 'danger'}
      return map[status] || 'info'
    }
  }
}
</script>
