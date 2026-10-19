import {getRequest, postRequest, putRequest} from '@/utils/request'

/**
 * 分页查询摄影相册
 * @param {Object} params 查询参数
 * @param {number} params.pageNum 页数
 * @param {number} params.pageSize 每页大小
 */
export function getPhotographyPageList(params) {
  return getRequest('/photography/pageList', params)
}

/**
 * 获取摄影相册草稿详情
 * @param {string} id 相册ID
 */
export function getPhotographyDetail(id) {
  return getRequest(`/photography/detail/${id}`)
}

/**
 * 新增摄影相册
 * @param {Object} content 相册内容
 */
export function addPhotography(content) {
  return postRequest('/photography/add', content)
}

/**
 * 保存摄影相册草稿
 * @param {string} id 相册ID
 * @param {number} revision 当前修订版本
 * @param {Object} content 相册草稿内容
 */
export function updatePhotography(id, revision, content) {
  return putRequest('/photography/update', {id, revision, content})
}

/**
 * 发布摄影相册
 * @param {string} id 相册ID
 * @param {number} revision 当前修订版本
 */
export function publishPhotography(id, revision) {
  return postRequest(`/photography/publish/${id}`, {revision})
}

/**
 * 下架摄影相册
 * @param {string} id 相册ID
 * @param {number} revision 当前修订版本
 */
export function unpublishPhotography(id, revision) {
  return postRequest(`/photography/unpublish/${id}`, {revision})
}

/**
 * 上传单张摄影照片
 * @param {string} id 相册ID
 * @param {File} file JPEG照片
 * @param {Function} onUploadProgress 上传进度回调
 */
export function uploadPhotographyPhoto(id, file, onUploadProgress) {
  const data = new FormData()
  data.append('file', file)
  return postRequest(`/photography/upload/${id}`, data, {timeout: 300000, onUploadProgress})
}

/**
 * 获取需要管理权限的照片预览或原图数据
 * @param {string} id 相册ID
 * @param {string} photoId 照片ID
 * @param {string} variant 图片版本：thumbnail、display、original
 */
export async function getPhotographyPhotoPreview(id, photoId, variant = 'thumbnail') {
  const blob = await getRequest(`/photography/preview/${id}/${photoId}/${variant}`, null, {responseType: 'blob', timeout: 120000})
  if (!blob || !blob.type.startsWith('image/jpeg')) {
    throw new Error('照片加载失败，请检查登录状态后重试')
  }
  return blob
}
