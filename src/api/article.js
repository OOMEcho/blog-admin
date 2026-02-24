import {getRequest, postRequest, putRequest, deleteRequest} from "@/utils/request"

/**
 * 分页查询文章列表
 * @param {Object} params 查询参数
 * @param {string} params.title 文章标题
 * @param {string} params.status 状态(0=草稿,1=已发布,2=待审核,3=审核拒绝)
 * @param {number} params.categoryId 分类ID
 * @param {string} params.beginTime 创建开始时间 yyyy-MM-dd
 * @param {string} params.endTime 创建结束时间 yyyy-MM-dd
 * @param {number} params.pageNum 页数
 * @param {number} params.pageSize 每页大小
 * @param {string} params.sortField 排序字段
 * @param {string} params.sortOrder 排序方式 ASC DESC
 */
export function getArticlePageList(params) {
  return getRequest('/article/pageList', params)
}

/**
 * 新增文章
 * @param {Object} data 文章数据
 * @param {string} data.title 文章标题
 * @param {string} data.summary 文章摘要
 * @param {string} data.content 文章内容
 * @param {string} data.coverImage 封面图片URL
 * @param {number} data.categoryId 分类ID
 * @param {number[]} data.tagIds 标签ID列表
 * @param {string} data.status 状态(0=草稿,2=待审核)
 * @param {number} data.isTop 是否置顶(0=否,1=是)
 * @param {number} data.sort 排序
 */
export function addArticle(data) {
  return postRequest('/article/add', data)
}

/**
 * 修改文章
 * @param {Object} data 文章数据
 * @param {number} data.id 文章ID
 * @param {string} data.title 文章标题
 * @param {string} data.summary 文章摘要
 * @param {string} data.content 文章内容
 * @param {string} data.coverImage 封面图片URL
 * @param {number} data.categoryId 分类ID
 * @param {number[]} data.tagIds 标签ID列表
 * @param {string} data.status 状态(0=草稿,2=待审核)
 * @param {number} data.isTop 是否置顶(0=否,1=是)
 * @param {number} data.sort 排序
 */
export function updateArticle(data) {
  return putRequest('/article/update', data)
}

/**
 * 删除文章
 * @param {number} id 文章ID
 */
export function deleteArticle(id) {
  return deleteRequest(`/article/delete/${id}`)
}

/**
 * 审核文章
 * @param {number} id 文章ID
 * @param {string} status 审核结果(1=通过,3=拒绝)
 * @param {string} rejectReason 拒绝原因（拒绝时填写）
 */
export function auditArticle(id, status, rejectReason) {
  const params = new URLSearchParams({status})
  if (rejectReason) params.append('rejectReason', rejectReason)
  return putRequest(`/article/audit/${id}?${params.toString()}`)
}
