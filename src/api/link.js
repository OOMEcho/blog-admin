import {getRequest, postRequest, putRequest, deleteRequest} from "@/utils/request"

/**
 * 分页查询友链列表
 * @param {Object} params 查询参数
 * @param {string} params.name 网站名称（模糊查询）
 * @param {number} params.pageNum 页数
 * @param {number} params.pageSize 每页大小
 * @param {string} params.sortField 排序字段
 * @param {string} params.sortOrder 排序方式 ASC DESC
 */
export function getLinkPageList(params) {
  return getRequest('/link/pageList', params)
}

/**
 * 新增友链
 * @param {Object} data 友链数据
 * @param {string} data.name 网站名称
 * @param {string} data.url 网站地址
 * @param {string} data.logo Logo图片地址
 * @param {string} data.description 网站描述
 * @param {string} data.status 状态(0=正常,1=停用)
 * @param {number} data.sort 排序
 */
export function addLink(data) {
  return postRequest('/link/add', data)
}

/**
 * 修改友链
 * @param {Object} data 友链数据
 * @param {number} data.id 友链ID
 * @param {string} data.name 网站名称
 * @param {string} data.url 网站地址
 * @param {string} data.logo Logo图片地址
 * @param {string} data.description 网站描述
 * @param {string} data.status 状态(0=正常,1=停用)
 * @param {number} data.sort 排序
 */
export function updateLink(data) {
  return putRequest('/link/update', data)
}

/**
 * 删除友链
 * @param {number} id 友链ID
 */
export function deleteLink(id) {
  return deleteRequest(`/link/delete/${id}`)
}
