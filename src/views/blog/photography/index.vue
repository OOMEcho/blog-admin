<template>
  <div class="page-container photography-admin">
    <el-card v-if="!album">
      <div slot="header" class="album-toolbar"><span>摄影管理</span><el-button v-perm="PERMS.photography.add" type="primary" size="small" @click="newAlbum">新建相册</el-button></div>
      <el-alert v-if="listError" :title="listError" type="error" :closable="false" />
      <el-table v-loading="loading" :data="albums" border>
        <el-table-column prop="title" label="相册" min-width="180" />
        <el-table-column prop="date" label="拍摄日期" width="120" />
        <el-table-column prop="photoCount" label="照片数" width="90" />
        <el-table-column label="状态" min-width="170"><template slot-scope="scope"><el-tag :type="scope.row.status === 'PUBLISHED' ? 'success' : 'info'">{{ statusText(scope.row.status) }}</el-tag> <span v-if="scope.row.hasUnpublishedChanges" class="muted">有未发布内容</span></template></el-table-column>
        <el-table-column label="操作" width="100"><template slot-scope="scope"><el-button v-perm="[PERMS.photography.update, PERMS.photography.preview, PERMS.photography.upload, PERMS.photography.publish, PERMS.photography.unpublish]" type="text" @click="openAlbum(scope.row.id)">{{ canUpdate ? '编辑相册' : '查看相册' }}</el-button></template></el-table-column>
      </el-table>
      <el-pagination :current-page="page" :page-size="12" :total="total" layout="total, prev, pager, next" @current-change="changePage" />
      <el-button v-if="listError" size="small" @click="fetchList">重新加载</el-button>
    </el-card>

    <el-card v-else>
      <div slot="header" class="album-toolbar"><div><el-button type="text" :disabled="busy" @click="back">← 全部相册</el-button> <strong>{{ album.title }}</strong></div><el-tag>{{ statusText(album.status) }}</el-tag></div>
      <el-alert title="编辑内容先保存为草稿，点击发布更新后访客才能看到。原图下载保留上传文件中的拍摄信息。" type="info" :closable="false" show-icon />
      <el-form @submit.native.prevent label-width="90px" class="album-form" :disabled="busy || !canUpdate">
        <el-form-item label="相册标题"><el-input v-model="content.title" maxlength="120" show-word-limit /></el-form-item>
        <el-form-item label="拍摄日期"><el-date-picker v-model="content.date" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" /></el-form-item>
        <el-form-item label="相册介绍"><el-input v-model="content.description" type="textarea" :rows="3" maxlength="4000" show-word-limit /></el-form-item>
      </el-form>
      <div class="album-actions">
        <el-button v-perm="PERMS.photography.update" :disabled="busy" :loading="saving" @click="save">保存草稿</el-button>
        <el-button v-perm="PERMS.photography.preview" :disabled="busy" @click="preview">预览草稿</el-button>
        <el-button v-perm="PERMS.photography.publish" type="primary" :disabled="busy || !content.photos.length" @click="publish">{{ album.status === 'PUBLISHED' ? '发布更新' : '发布相册' }}</el-button>
        <el-button v-if="album.status === 'PUBLISHED'" v-perm="PERMS.photography.unpublish" type="warning" :disabled="busy" @click="unpublish">下架相册</el-button>
        <el-button :disabled="busy" @click="reload">重新加载</el-button>
      </div>
      <section v-perm="PERMS.photography.upload" class="photo-upload">
        <label class="upload-label">批量上传 JPEG <input ref="picker" type="file" accept="image/jpeg,.jpg,.jpeg" multiple :disabled="busy" @change="selectFiles"></label>
        <span class="muted">每张不超过 50MB；有未保存的修改时先保存，再依次上传。</span>
      </section>
      <div v-if="queue.length" class="upload-queue" aria-live="polite">
        <div v-for="item in queue" :key="item.key" class="queue-row">
          <span class="queue-name">{{ item.file.name }}</span><el-progress :percentage="item.progress" :status="item.status === 'done' ? 'success' : item.status === 'failed' ? 'exception' : undefined" />
          <span>{{ item.message }}</span><el-button v-if="item.status === 'failed'" v-perm="PERMS.photography.upload" type="text" :disabled="busy" @click="retry(item)">重试</el-button>
        </div>
        <el-button v-if="!uploading" type="text" @click="clearQueue">清除已完成记录</el-button>
      </div>
      <p v-if="!content.photos.length" class="empty-photos">先上传照片，再选择封面和发布相册。</p>
      <div class="edit-photo-grid">
        <article v-for="(entry, i) in content.photos" :key="entry.photoId" class="edit-photo">
          <div class="edit-photo-image"><img v-if="thumbnails[entry.photoId]" :src="thumbnails[entry.photoId]" :alt="entry.caption || '照片预览'"><el-button v-else-if="canPreview" size="mini" :disabled="thumbnailLoading[entry.photoId]" @click="loadThumbnail(entry.photoId)">{{ thumbnailLoading[entry.photoId] ? '加载中…' : '加载预览' }}</el-button></div>
          <el-tag v-if="String(content.coverPhotoId) === String(entry.photoId)" size="mini" type="success">相册封面</el-tag>
          <p class="photo-filename">{{ photoInfo(entry.photoId).originalName }}</p>
          <p class="muted photo-exif">{{ exif(photoInfo(entry.photoId)) }}</p>
          <el-input v-model="entry.caption" :disabled="busy || !canUpdate" type="textarea" :rows="2" maxlength="1000" placeholder="这张照片的故事（可选）" />
          <el-input v-model="entry.takenAt" :disabled="busy || !canUpdate" maxlength="32" placeholder="拍摄时间（可选）" size="small" class="photo-date" />
          <div v-perm="PERMS.photography.update" class="photo-controls">
            <el-button size="mini" :disabled="busy" @click="content.coverPhotoId = entry.photoId">设为封面</el-button>
            <el-button size="mini" :disabled="busy || i === 0" aria-label="向前移动" @click="move(i, -1)">↑</el-button>
            <el-button size="mini" :disabled="busy || i === content.photos.length - 1" aria-label="向后移动" @click="move(i, 1)">↓</el-button>
            <el-button type="text" :disabled="busy" @click="remove(i)">移出</el-button>
          </div>
        </article>
      </div>
    </el-card>

    <el-dialog title="相册草稿预览" :visible.sync="previewVisible" width="92%" top="4vh" append-to-body>
      <div class="draft-preview"><h1>{{ content.title }}</h1><p>{{ content.date }}</p><p class="preview-description">{{ content.description }}</p>
        <div class="preview-grid"><figure v-for="(entry, i) in content.photos" :key="entry.photoId"><button class="preview-photo" :aria-label="`打开照片 ${i + 1}`" @click="viewPhoto(i)"><img v-if="thumbnails[entry.photoId]" :src="thumbnails[entry.photoId]" :alt="entry.caption || '摄影作品'" :width="photoInfo(entry.photoId).width" :height="photoInfo(entry.photoId).height"><span v-else>点击查看照片</span></button><figcaption>{{ entry.caption }}</figcaption></figure></div>
      </div>
    </el-dialog>
    <el-dialog title="照片预览" :visible.sync="viewerVisible" fullscreen append-to-body @closed="releaseDisplay">
      <div v-loading="viewerLoading" class="admin-viewer" @touchstart="viewerTouchStart" @touchend="viewerTouchEnd">
        <div class="viewer-nav"><el-button :disabled="viewerIndex <= 0 || viewerLoading" @click="viewPhoto(viewerIndex - 1)">上一张</el-button><span>{{ viewerIndex + 1 }} / {{ content.photos.length }}</span><el-button :disabled="viewerIndex + 1 >= content.photos.length || viewerLoading" @click="viewPhoto(viewerIndex + 1)">下一张</el-button><el-button :disabled="viewerLoading" @click="downloadOriginal">下载原图</el-button></div>
        <p v-if="viewerError" role="alert">{{ viewerError }}</p><img v-if="displayUrl" :src="displayUrl" :alt="viewerEntry.caption || '照片预览'" /><p>{{ viewerEntry.caption }}</p><p class="muted">{{ exif(photoInfo(viewerEntry.photoId)) }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {PERMS} from '@/utils/permCode'
import {getPhotographyPageList, getPhotographyDetail, addPhotography, updatePhotography, publishPhotography, unpublishPhotography, uploadPhotographyPhoto, getPhotographyPhotoPreview} from '@/api/photography'
const emptyContent = () => ({title: '', description: '', date: '', coverPhotoId: null, photos: []})
export default {
  name: 'PhotographyPage',
  data() {
    return {PERMS, albums: [], page: 1, total: 0, loading: false, listError: '', album: null, content: emptyContent(), saved: '', saving: false, uploading: false, queue: [], thumbnails: {}, thumbnailLoading: {}, previewVisible: false, viewerVisible: false, viewerIndex: 0, viewerLoading: false, viewerError: '', displayUrl: '', generation: 0, touchX: null}
  },
  computed: {
    canUpdate() { return this.$store.state.permission.permissions.includes(PERMS.photography.update) },
    canPreview() { return this.$store.state.permission.permissions.includes(PERMS.photography.preview) },
    busy() { return this.saving || this.uploading || this.loading },
    viewerEntry() { return this.content.photos[this.viewerIndex] || {} },
    dirty() { return !!this.album && JSON.stringify(this.content) !== this.saved }
  },
  created() { this.fetchList() },
  mounted() { window.addEventListener('beforeunload', this.beforeUnload); window.addEventListener('keydown', this.viewerKey) },
  beforeDestroy() { this.generation++; this.releasePhotos(); window.removeEventListener('beforeunload', this.beforeUnload); window.removeEventListener('keydown', this.viewerKey) },
  beforeRouteLeave(to, from, next) {
    if (this.busy) { this.$message.warning('请等待当前操作完成'); next(false); return }
    if (!this.dirty) { next(); return }
    this.$confirm('草稿还未保存，确定离开？', '离开相册').then(() => next()).catch(() => next(false))
  },
  methods: {
    statusText(status) { return {DRAFT: '草稿', PUBLISHED: '已发布', OFFLINE: '已下架'}[status] || status },
    async fetchList() {
      this.loading = true; this.listError = ''
      try { const result = await getPhotographyPageList({pageNum: this.page, pageSize: 12}); this.albums = result.records || []; this.total = Number(result.total) }
      catch (e) { this.listError = '相册加载失败，请重试' }
      finally { this.loading = false }
    },
    changePage(page) { this.page = page; this.fetchList() },
    async newAlbum() {
      try {
        const {value} = await this.$prompt('为这次拍摄起一个名字', '新建相册', {inputPattern: /\S/, inputErrorMessage: '请输入相册标题'})
        if (value.trim().length > 120) { this.$message.error('标题最多 120 字'); return }
        this.loading = true; this.accept(await addPhotography({...emptyContent(), title: value.trim()}))
      } catch (e) { /* Request errors are displayed by the shared client. */ }
      finally { this.loading = false }
    },
    async openAlbum(id) { this.loading = true; try { this.accept(await getPhotographyDetail(id)); this.loadThumbnails() } finally { this.loading = false } },
    accept(result) {
      this.album = result
      this.content = JSON.parse(JSON.stringify(result.content))
      // Fill editable dates with EXIF defaults before recording the saved client state.
      this.content.photos.forEach(entry => { if (entry.takenAt == null) this.$set(entry, 'takenAt', this.photoInfo(entry.photoId).takenAt || '') })
      this.saved = JSON.stringify(this.content)
    },
    async ensureSaved() {
      if (!this.dirty) return true
      if (!this.canUpdate) { this.$message.warning('草稿存在未保存修改，请由有修改权限的用户保存后再操作'); return false }
      return this.save()
    },
    async save() {
      if (!this.content.title || !this.content.title.trim()) { this.$message.error('请输入相册标题'); return false }
      this.saving = true
      try { this.accept(await updatePhotography(this.album.id, this.album.revision, this.content)); this.$message.success('草稿已保存'); return true }
      catch (e) { return false }
      finally { this.saving = false }
    },
    async publish() {
      if (!await this.ensureSaved()) return
      this.saving = true
      try { this.accept(await publishPhotography(this.album.id, this.album.revision)); this.$message.success('相册已发布') }
      finally { this.saving = false }
    },
    async unpublish() {
      try { await this.$confirm('下架后访客将无法查看相册或下载照片，确定下架？', '下架相册') } catch (e) { return }
      this.saving = true
      try {
        const localContent = this.content
        const wasDirty = this.dirty
        this.accept(await unpublishPhotography(this.album.id, this.album.revision))
        if (wasDirty) this.content = localContent
        this.$message.success('相册已下架')
      } finally { this.saving = false }
    },
    async reload() {
      if (this.dirty) { try { await this.$confirm('重新加载将放弃未保存的修改，确定继续？', '重新加载') } catch (e) { return } }
      const id = this.album.id; this.releasePhotos(); await this.openAlbum(id)
    },
    async back() {
      if (this.dirty) { try { await this.$confirm('草稿还未保存，确定返回？', '返回相册列表') } catch (e) { return } }
      this.releasePhotos(); this.album = null; this.content = emptyContent(); this.saved = ''; this.queue = []; await this.fetchList()
    },
    async selectFiles(event) {
      const files = [...event.target.files]; event.target.value = ''
      if (!files.length || this.busy) return
      if (this.content.photos.length + files.length > 500) { this.$message.error('每个相册最多支持 500 张照片'); return }
      const items = files.map(file => ({key: `${Date.now()}-${Math.random()}`, file, progress: 0, status: 'waiting', message: '等待上传'}))
      this.queue.push(...items)
      if (!await this.ensureSaved()) { items.forEach(item => { item.status = 'failed'; item.message = '草稿未保存，请保存后重试' }); return }
      await this.runQueue()
    },
    async runQueue() {
      this.uploading = true
      try {
        for (const item of this.queue.filter(q => q.status === 'waiting')) {
          if (!/\.jpe?g$/i.test(item.file.name) || !item.file.size || item.file.size > 50 * 1024 * 1024) { item.status = 'failed'; item.message = '请选择 50MB 以内的 JPEG'; continue }
          item.status = 'uploading'; item.message = '上传中'
          try {
            const result = await uploadPhotographyPhoto(this.album.id, item.file, e => {
              item.progress = e.total ? Math.min(99, Math.round(e.loaded / e.total * 100)) : 0
              if (e.loaded === e.total) item.message = '正在生成展示图片'
            })
            this.accept(result); item.status = 'done'; item.progress = 100; item.message = '已完成'
            await this.loadThumbnails()
          } catch (e) { item.status = 'failed'; item.message = e.message || '上传失败，请重试' }
        }
      } finally { this.uploading = false }
    },
    async retry(item) { if (this.busy || !await this.ensureSaved()) return; item.status = 'waiting'; item.progress = 0; item.message = '等待上传'; await this.runQueue() },
    clearQueue() { this.queue = this.queue.filter(item => item.status !== 'done') },
    photoInfo(id) { return (this.album && this.album.photos || []).find(p => String(p.id) === String(id)) || {} },
    exif(photo) { return [photo.camera, photo.lens, photo.aperture, photo.shutter, photo.iso ? `ISO ${photo.iso}` : ''].filter(Boolean).join(' · ') },
    move(index, direction) { const entry = this.content.photos.splice(index, 1)[0]; this.content.photos.splice(index + direction, 0, entry) },
    remove(index) { const removed = this.content.photos.splice(index, 1)[0]; if (String(this.content.coverPhotoId) === String(removed.photoId)) this.content.coverPhotoId = this.content.photos.length ? this.content.photos[0].photoId : null },
    async loadThumbnail(id) {
      if (!this.canPreview || this.thumbnails[id] || this.thumbnailLoading[id] || !this.album) return
      const albumId = this.album.id; const generation = this.generation
      this.$set(this.thumbnailLoading, id, true)
      try {
        const blob = await getPhotographyPhotoPreview(albumId, id)
        if (generation === this.generation && this.album && this.album.id === albumId) this.$set(this.thumbnails, id, URL.createObjectURL(blob))
      } catch (e) { /* Keep an explicit retry control on the card. */ }
      finally { if (generation === this.generation) this.$set(this.thumbnailLoading, id, false) }
    },
    async loadThumbnails() { const generation = this.generation; for (const e of this.content.photos) { if (generation !== this.generation) return; await this.loadThumbnail(e.photoId) } },
    preview() { this.previewVisible = true; this.loadThumbnails() },
    async viewPhoto(index) {
      if (index < 0 || index >= this.content.photos.length || this.viewerLoading) return
      this.viewerIndex = index; this.viewerVisible = true; this.viewerLoading = true; this.viewerError = ''; this.releaseDisplay()
      const generation = this.generation
      try { const blob = await getPhotographyPhotoPreview(this.album.id, this.viewerEntry.photoId, 'display'); if (this.viewerVisible && generation === this.generation) this.displayUrl = URL.createObjectURL(blob) }
      catch (e) { this.viewerError = '照片加载失败，请关闭后重试' }
      finally { this.viewerLoading = false }
    },
    async downloadOriginal() {
      try {
        const id = this.viewerEntry.photoId; const blob = await getPhotographyPhotoPreview(this.album.id, id, 'original'); const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = this.photoInfo(id).originalName || 'photo.jpg'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000)
      } catch (e) { this.$message.error('原图下载失败，请重试') }
    },
    viewerKey(event) {
      if (!this.viewerVisible || this.viewerLoading) return
      if (event.key === 'ArrowLeft') { event.preventDefault(); this.viewPhoto(this.viewerIndex - 1) }
      if (event.key === 'ArrowRight') { event.preventDefault(); this.viewPhoto(this.viewerIndex + 1) }
    },
    viewerTouchStart(event) { this.touchX = event.changedTouches[0].clientX },
    viewerTouchEnd(event) { if (this.touchX == null) return; const dx = event.changedTouches[0].clientX - this.touchX; if (Math.abs(dx) > 60) this.viewPhoto(this.viewerIndex + (dx < 0 ? 1 : -1)); this.touchX = null },
    releaseDisplay() { if (this.displayUrl) URL.revokeObjectURL(this.displayUrl); this.displayUrl = '' },
    releasePhotos() { this.generation++; Object.values(this.thumbnails).forEach(URL.revokeObjectURL); this.thumbnails = {}; this.thumbnailLoading = {}; this.releaseDisplay() },
    beforeUnload(event) { if (this.dirty || this.busy) { event.preventDefault(); event.returnValue = '' } }
  }
}
</script>

<style scoped>
.album-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }.album-form { max-width: 860px; margin-top: 24px; }.album-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }.album-actions .el-button { margin-left: 0; }.muted { color: #84909b; font-size: 12px; }.photo-upload { padding: 20px 0; border-top: 1px solid #e8edef; display: flex; flex-wrap: wrap; gap: 16px; align-items: center; }.upload-label { border: 1px solid #409eff; color: #2879cc; border-radius: 4px; padding: 10px 16px; cursor: pointer; }.upload-label input { display: block; max-width: 260px; margin-top: 8px; }.queue-row { display: grid; grid-template-columns: minmax(120px, 1fr) 160px minmax(120px, 1fr) 50px; gap: 16px; align-items: center; padding: 10px 0; font-size: 12px; }.queue-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.edit-photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }.edit-photo { border: 1px solid #e5eaef; padding: 12px; border-radius: 4px; }.edit-photo-image { height: 200px; background: #f1f4f6; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }.edit-photo-image img { width: 100%; height: 100%; object-fit: contain; }.photo-filename { font-size: 12px; overflow-wrap: anywhere; margin: 8px 0; }.photo-exif { min-height: 30px; line-height: 1.6; margin: 8px 0; }.photo-date { margin-top: 10px; }.photo-controls { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }.photo-controls .el-button { margin-left: 0; }.empty-photos { text-align: center; padding: 32px; color: #84909b; }.el-pagination { margin-top: 20px; text-align: right; }.draft-preview { max-width: 1100px; margin: auto; }.draft-preview h1 { font-weight: 500; }.preview-description { white-space: pre-wrap; line-height: 1.9; margin: 20px 0; }.preview-grid { columns: 3; column-gap: 20px; }.preview-grid figure { break-inside: avoid; margin: 0 0 20px; }.preview-photo { padding: 0; border: 0; width: 100%; background: #f0f4f6; cursor: zoom-in; }.preview-photo img { width: 100%; height: auto; display: block; }.preview-grid figcaption { padding-top: 8px; white-space: pre-wrap; }.admin-viewer { text-align: center; min-height: 70vh; }.admin-viewer > img { display: block; max-width: 100%; height: 70vh; object-fit: contain; margin: 20px auto; }.viewer-nav { display: flex; gap: 12px; justify-content: center; align-items: center; }.admin-viewer p { white-space: pre-wrap; line-height: 1.8; }
@media (max-width: 640px) { .queue-row { grid-template-columns: 1fr 80px; gap: 8px; }.preview-grid { columns: 1; }.viewer-nav { flex-wrap: wrap; }.album-toolbar { align-items: flex-start; } }
</style>
