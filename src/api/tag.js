import {getRequest, postRequest, putRequest, deleteRequest} from "@/utils/request"

/**
 * 分页查询标签列表
 * @param {Object} params 查询参数
 * @param {string} params.name 标签名称
 * @param {number} params.pageNum 页数
 * @param {number} params.pageSize 每页大小
 * @param {string} params.sortField 排序字段
 * @param {string} params.sortOrder 排序方式 ASC DESC
 */
export function getTagPageList(params) {
  return getRequest('/tag/pageList', params)
}

/**
 * 查询所有标签（下拉用）
 */
export function getTagList() {
  return getRequest('/tag/list')
}

/**
 * 新增标签
 * @param {Object} data 标签数据
 * @param {string} data.name 标签名称
 * @param {string} data.color 标签颜色（十六进制，如 #409EFF）
 */
export function addTag(data) {
  return postRequest('/tag/add', data)
}

/**
 * 修改标签
 * @param {Object} data 标签数据
 * @param {number} data.id 标签ID
 * @param {string} data.name 标签名称
 * @param {string} data.color 标签颜色（十六进制，如 #409EFF）
 */
export function updateTag(data) {
  return putRequest('/tag/update', data)
}

/**
 * 删除标签
 * @param {number} id 标签ID
 */
export function deleteTag(id) {
  return deleteRequest(`/tag/delete/${id}`)
}
