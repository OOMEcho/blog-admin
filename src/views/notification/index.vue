<template>
  <div class="page-container">
    <el-card>
      <div slot="header" class="card-header">
        <span>我的通知</span>
      </div>

      <el-form :inline="true" :model="queryParams" class="search-form" size="small">
        <el-form-item label="类型">
          <el-select v-model="queryParams.type" placeholder="通知类型" clearable>
            <el-option label="审核通知" value="AUDIT"/>
            <el-option label="系统通知" value="SYSTEM"/>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.isRead" placeholder="读取状态" clearable>
            <el-option label="未读" :value="0"/>
            <el-option label="已读" :value="1"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-toolbar">
        <el-button type="primary" size="small" icon="el-icon-check" @click="handleReadAll">全部标记已读</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe :row-class-name="rowClassName">
        <el-table-column label="类型" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="typeTagType(scope.row.type)" size="mini">{{ typeLabel(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="150"/>
        <el-table-column prop="content" label="内容" min-width="250" show-overflow-tooltip/>
        <el-table-column label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.isRead ? 'info' : 'warning'" size="mini">
              {{ scope.row.isRead ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="时间" width="155"/>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-tooltip v-if="!scope.row.isRead" content="标为已读" placement="top" popper-class="action-tooltip">
                <el-button type="text" size="mini" icon="el-icon-check" class="action-icon is-success" @click="handleRead(scope.row)"/>
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
import {getNotificationPageList, readNotification, readAllNotification} from '@/api/notification'

export default {
  name: 'NotificationPage',
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      queryParams: {pageNum: 1, pageSize: 10, type: null, isRead: null}
    }
  },
  created() { this.fetchList() },
  methods: {
    async fetchList() {
      this.loading = true
      try {
        const res = await getNotificationPageList(this.queryParams)
        this.tableData = res.records || []
        this.total = Number(res.total || 0)
      } finally { this.loading = false }
    },
    handleSearch() { this.queryParams.pageNum = 1; this.fetchList() },
    handleReset() { this.queryParams = {pageNum: 1, pageSize: 10, type: null, isRead: null}; this.fetchList() },
    async handleRead(row) {
      await readNotification(row.id)
      row.isRead = 1
    },
    async handleReadAll() {
      await readAllNotification()
      this.$message.success('已全部标记为已读')
      this.fetchList()
    },
    rowClassName({row}) {
      return row.isRead ? '' : 'unread-row'
    },
    typeLabel(type) {
      const map = {'AUDIT': '审核通知', 'SYSTEM': '系统通知'}
      return map[type] || type
    },
    typeTagType(type) {
      const map = {'AUDIT': 'warning', 'SYSTEM': 'info'}
      return map[type] || 'info'
    }
  }
}
</script>

<style scoped>
::v-deep .unread-row {
  font-weight: 600;
  background-color: #fdfaf3 !important;
}
</style>
