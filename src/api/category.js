import {getRequest, postRequest, putRequest, deleteRequest} from "@/utils/request"

/**
 * 分页查询分类列表
 * @param {Object} params 查询参数
 * @param {string} params.name 分类名称
 * @param {number} params.pageNum 页数
 * @param {number} params.pageSize 每页大小
 * @param {string} params.sortField 排序字段
 * @param {string} params.sortOrder 排序方式 ASC DESC
 */
export function getCategoryPageList(params) {
  return getRequest('/category/pageList', params)
}

/**
 * 查询所有分类（下拉用）
 */
export function getCategoryList() {
  return getRequest('/category/list')
}

/**
 * 新增分类
 * @param {Object} data 分类数据
 * @param {string} data.name 分类名称
 * @param {string} data.description 分类描述
 * @param {number} data.sort 排序
 */
export function addCategory(data) {
  return postRequest('/category/add', data)
}

/**
 * 修改分类
 * @param {Object} data 分类数据
 * @param {number} data.id 分类ID
 * @param {string} data.name 分类名称
 * @param {string} data.description 分类描述
 * @param {number} data.sort 排序
 */
export function updateCategory(data) {
  return putRequest('/category/update', data)
}

/**
 * 删除分类
 * @param {number} id 分类ID
 */
export function deleteCategory(id) {
  return deleteRequest(`/category/delete/${id}`)
}
