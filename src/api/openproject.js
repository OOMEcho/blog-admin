import {getRequest, postRequest, putRequest, deleteRequest} from "@/utils/request"

/**
 * 分页查询开源项目列表
 * @param {Object} params 查询参数
 * @param {string} params.name 项目名称（模糊查询）
 * @param {number} params.pageNum 页数
 * @param {number} params.pageSize 每页大小
 * @param {string} params.sortField 排序字段
 * @param {string} params.sortOrder 排序方式 ASC DESC
 */
export function getOpenProjectPageList(params) {
  return getRequest('/openProject/pageList', params)
}

/**
 * 新增开源项目
 * @param {Object} data 项目数据
 * @param {string} data.name 项目名称
 * @param {string} data.url 项目地址
 * @param {string} data.logo Logo图片地址
 * @param {string} data.description 项目描述
 * @param {string} data.techStack 技术栈
 * @param {string} data.status 状态(0=正常,1=停用)
 * @param {number} data.sort 排序
 */
export function addOpenProject(data) {
  return postRequest('/openProject/add', data)
}

/**
 * 修改开源项目
 * @param {Object} data 项目数据
 * @param {number} data.id 项目ID
 * @param {string} data.name 项目名称
 * @param {string} data.url 项目地址
 * @param {string} data.logo Logo图片地址
 * @param {string} data.description 项目描述
 * @param {string} data.techStack 技术栈
 * @param {string} data.status 状态(0=正常,1=停用)
 * @param {number} data.sort 排序
 */
export function updateOpenProject(data) {
  return putRequest('/openProject/update', data)
}

/**
 * 删除开源项目
 * @param {number} id 项目ID
 */
export function deleteOpenProject(id) {
  return deleteRequest(`/openProject/delete/${id}`)
}
