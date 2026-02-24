import {getRequest, putRequest} from "@/utils/request"

/**
 * 查询所有博客配置
 */
export function getBlogConfigList() {
  return getRequest('/blogConfig/list')
}

/**
 * 按 key 查询配置
 * @param {string} key 配置键名
 */
export function getBlogConfigByKey(key) {
  return getRequest('/blogConfig/getByKey', {key})
}

/**
 * 修改单条配置
 * @param {Object} data 配置数据
 * @param {number} data.id 配置ID
 * @param {string} data.configKey 配置键名
 * @param {string} data.configValue 配置值
 * @param {string} data.description 配置描述
 */
export function updateBlogConfig(data) {
  return putRequest('/blogConfig/update', data)
}

/**
 * 批量修改配置
 * @param {Object[]} data 配置列表
 * @param {number} data[].id 配置ID
 * @param {string} data[].configKey 配置键名
 * @param {string} data[].configValue 配置值
 * @param {string} data[].description 配置描述
 */
export function batchUpdateBlogConfig(data) {
  return putRequest('/blogConfig/batchUpdate', data)
}
