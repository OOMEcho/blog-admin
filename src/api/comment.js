import {getRequest, putRequest, deleteRequest} from "@/utils/request"

/**
 * 分页查询评论列表
 * @param {Object} params 查询参数
 * @param {string} params.status 审核状态(0=待审核,1=已通过,2=已拒绝)
 * @param {number} params.pageNum 页数
 * @param {number} params.pageSize 每页大小
 * @param {string} params.sortField 排序字段
 * @param {string} params.sortOrder 排序方式 ASC DESC
 */
export function getCommentPageList(params) {
  return getRequest('/comment/pageList', params)
}

/**
 * 审核评论
 * @param {number} id 评论ID
 * @param {string} status 审核结果(1=通过,2=拒绝)
 */
export function updateCommentStatus(id, status) {
  return putRequest(`/comment/updateStatus/${id}`, null, {params: {status}})
}

/**
 * 删除评论
 * @param {number} id 评论ID
 */
export function deleteComment(id) {
  return deleteRequest(`/comment/delete/${id}`)
}
