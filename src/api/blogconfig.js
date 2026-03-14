import {getRequest, putRequest} from "@/utils/request"

/**
 * 查询所有博客配置
 */
export function getBlogConfigList() {
  return getRequest('/blogConfig/list')
}

/**
 * 批量修改配置
 * @param {Object[]} data 配置列表
 * @param {string} data[].configKey 配置键名
 * @param {string} data[].configValue 配置值
 */
export function batchUpdateBlogConfig(data) {
  return putRequest('/blogConfig/batchUpdate', data)
}
