import {getRequest, putRequest} from "@/utils/request"

/**
 * 分页查询通知列表
 * @param {Object} params 查询参数
 * @param {string} params.type 通知类型(AUDIT=文章审核,COMMENT=评论通知,SYSTEM=系统通知)
 * @param {number} params.isRead 是否已读(0=未读,1=已读)
 * @param {number} params.pageNum 页数
 * @param {number} params.pageSize 每页大小
 * @param {string} params.sortField 排序字段
 * @param {string} params.sortOrder 排序方式 ASC DESC
 */
export function getNotificationPageList(params) {
  return getRequest('/notification/pageList', params)
}

/**
 * 获取未读通知数量
 */
export function getUnreadCount() {
  return getRequest('/notification/unreadCount')
}

/**
 * 标记单条通知已读
 * @param {number} id 通知ID
 */
export function readNotification(id) {
  return putRequest(`/notification/read/${id}`)
}

/**
 * 全部标记已读
 */
export function readAllNotification() {
  return putRequest('/notification/readAll')
}
