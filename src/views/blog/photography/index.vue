<template>
  <div class="page-container photography-admin">
    <el-card v-if="!album">
      <div slot="header" class="card-header">摄影管理</div>
      <div class="table-toolbar album-list-toolbar">
        <el-button v-perm="PERMS.photography.add" type="primary" size="small" icon="el-icon-plus" aria-label="新建相册" @click="newAlbum">新建相册</el-button>
        <span class="muted">按旅行或拍摄主题整理照片，保存草稿后发布。</span>
      </div>
      <el-alert v-if="listError" :title="listError" type="error" :closable="false" />
      <el-table v-loading="loading" :data="albums" border stripe>
        <el-table-column prop="title" label="相册" min-width="220">
          <template slot-scope="scope"><div class="album-list-title">{{ scope.row.title }}</div><p v-if="scope.row.description" class="album-list-description">{{ scope.row.description }}</p></template>
        </el-table-column>
        <el-table-column prop="date" label="拍摄日期" width="120" />
        <el-table-column prop="photoCount" label="照片数" width="90" align="center" />
        <el-table-column label="状态" min-width="170"><template slot-scope="scope"><el-tag size="small" :type="scope.row.status === 'PUBLISHED' ? 'success' : 'info'">{{ statusText(scope.row.status) }}</el-tag> <span v-if="scope.row.hasUnpublishedChanges" class="muted">有未发布内容</span></template></el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-tooltip :content="canUpdate ? '编辑相册' : '查看相册'" placement="top" popper-class="action-tooltip">
                <el-button v-perm="[PERMS.photography.update, PERMS.photography.preview, PERMS.photography.upload, PERMS.photography.publish, PERMS.photography.unpublish]" type="text" size="mini" :icon="canUpdate ? 'el-icon-edit' : 'el-icon-view'" class="action-icon is-primary" :aria-label="canUpdate ? '编辑相册' : '查看相册'" @click="openAlbum(scope.row.id)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination :current-page="page" :page-size="12" :total="total" layout="total, prev, pager, next" @current-change="changePage" />
      <el-button v-if="listError" size="small" icon="el-icon-refresh" @click="fetchList">重新加载</el-button>
    </el-card>

    <div v-else class="album-editor">
      <div class="editor-commandbar">
        <div class="editor-heading">
          <el-button type="text" icon="el-icon-back" aria-label="全部相册" :disabled="busy" @click="back">全部相册</el-button>
          <div class="editor-title"><strong :title="album.title">{{ album.title }}</strong><span class="muted">{{ dirty ? '有未保存修改' : '草稿已保存' }} · {{ content.photos.length }} 张照片</span></div>
          <el-tag size="small" :type="album.status === 'PUBLISHED' ? 'success' : 'info'">{{ statusText(album.status) }}</el-tag>
        </div>
        <div class="album-actions">
          <el-button v-perm="PERMS.photography.update" size="small" icon="el-icon-document-checked" aria-label="保存草稿" :disabled="busy" :loading="saving" @click="save">保存草稿</el-button>
          <el-button v-perm="PERMS.photography.preview" size="small" icon="el-icon-view" aria-label="预览草稿" :disabled="busy" @click="preview">预览草稿</el-button>
          <el-button v-perm="PERMS.photography.publish" type="primary" size="small" :aria-label="album.status === 'PUBLISHED' ? '发布更新' : '发布相册'" icon="el-icon-upload2" :disabled="busy || !content.photos.length" @click="publish">{{ album.status === 'PUBLISHED' ? '发布更新' : '发布相册' }}</el-button>
          <el-button v-if="album.status === 'PUBLISHED'" v-perm="PERMS.photography.unpublish" type="warning" plain size="small" icon="el-icon-switch-button" aria-label="下架相册" :disabled="busy" @click="unpublish">下架相册</el-button>
          <el-tooltip content="重新加载" placement="top"><el-button size="small" icon="el-icon-refresh" aria-label="重新加载" :disabled="busy" @click="reload" /></el-tooltip>
        </div>
      </div>

      <el-card class="album-details">
        <div slot="header" class="card-header">相册信息</div>
        <el-form @submit.native.prevent label-width="90px" size="small" class="album-form" :disabled="busy || !canUpdate">
          <el-form-item label="相册标题"><el-input v-model="content.title" maxlength="120" show-word-limit /></el-form-item>
          <el-form-item label="拍摄日期"><el-date-picker v-model="content.date" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" /></el-form-item>
          <el-form-item label="相册介绍"><el-input v-model="content.description" type="textarea" :rows="3" maxlength="4000" show-word-limit /></el-form-item>
        </el-form>
      </el-card>

      <el-card class="album-photos">
        <div slot="header" class="card-header photo-section-heading"><span>照片管理 <span class="section-count">{{ content.photos.length }}</span></span><span class="muted">调整顺序、选择封面，并为照片补充说明</span></div>
        <section v-perm="PERMS.photography.upload" class="photo-upload">
          <div class="upload-copy"><i class="el-icon-upload" aria-hidden="true" /><div><strong>批量上传照片</strong><p>支持 JPEG，每张不超过 50MB。未保存的修改会先保存为草稿。</p></div></div>
          <el-button type="primary" plain size="small" icon="el-icon-folder-opened" aria-label="选择照片" :disabled="busy" @click="$refs.picker.click()">选择照片</el-button>
          <input ref="picker" class="photo-picker" type="file" accept="image/jpeg,.jpg,.jpeg" multiple :disabled="busy" aria-label="选择 JPEG 照片" @change="selectFiles">
        </section>
        <p class="photo-publish-hint"><i class="el-icon-info" aria-hidden="true" /> 修改先保存为草稿，发布后才会展示给访客。原图下载保留上传文件中的拍摄信息。</p>
        <div v-if="queue.length" class="upload-queue" aria-live="polite">
          <div class="queue-heading"><strong>上传进度 <span class="muted">共 {{ queue.length }} 张</span></strong><el-button v-if="!uploading" type="text" size="small" @click="clearQueue">清除已完成记录</el-button></div>
          <div class="queue-items">
            <div v-for="item in queue" :key="item.key" class="queue-row">
              <span class="queue-name" :title="item.file.name">{{ item.file.name }}</span>
              <el-progress :percentage="item.progress" :color="item.status === 'failed' || item.status === 'done' ? undefined : 'var(--brand-primary)'" :status="item.status === 'done' ? 'success' : item.status === 'failed' ? 'exception' : undefined" />
              <span class="queue-message">{{ item.message }}</span><el-button v-if="item.status === 'failed'" v-perm="PERMS.photography.upload" type="text" size="small" :disabled="busy" @click="retry(item)">重试</el-button>
            </div>
          </div>
        </div>
        <el-empty v-if="!content.photos.length" :image-size="70" description="上传照片后，可选择封面并发布相册" />
        <div class="edit-photo-grid">
          <article v-for="(entry, i) in content.photos" :key="entry.photoId" class="edit-photo">
            <div class="photo-card-heading"><span class="photo-sequence">第 {{ i + 1 }} 张</span><el-tag v-if="String(content.coverPhotoId) === String(entry.photoId)" size="mini" type="success">相册封面</el-tag></div>
            <div class="edit-photo-image"><img v-if="thumbnails[entry.photoId]" :src="thumbnails[entry.photoId]" :alt="entry.caption || '照片预览'"><el-button v-else-if="canPreview" size="mini" icon="el-icon-picture-outline" :disabled="thumbnailLoading[entry.photoId]" @click="loadThumbnail(entry.photoId)">{{ thumbnailLoading[entry.photoId] ? '加载中…' : '加载预览' }}</el-button><i v-else class="el-icon-picture-outline" aria-hidden="true" /></div>
            <div class="photo-card-body">
              <p class="photo-filename" :title="photoInfo(entry.photoId).originalName">{{ photoInfo(entry.photoId).originalName }}</p>
              <p class="muted photo-exif">{{ exif(photoInfo(entry.photoId)) }}</p>
              <label class="photo-field-label" :for="`caption-${entry.photoId}`">照片说明</label>
              <el-input :id="`caption-${entry.photoId}`" v-model="entry.caption" :disabled="busy || !canUpdate" type="textarea" :rows="2" maxlength="1000" placeholder="记录这张照片的故事（可选）" />
              <label class="photo-field-label" :for="`taken-at-${entry.photoId}`">拍摄时间</label>
              <el-input :id="`taken-at-${entry.photoId}`" v-model="entry.takenAt" :disabled="busy || !canUpdate" maxlength="32" placeholder="拍摄时间（可选）" size="small" />
            </div>
            <div v-perm="PERMS.photography.update" class="photo-controls">
              <el-button size="mini" icon="el-icon-star-off" aria-label="设为封面" :disabled="busy" @click="content.coverPhotoId = entry.photoId">设为封面</el-button>
              <div class="action-buttons">
                <el-tooltip content="向前移动" placement="top" popper-class="action-tooltip"><el-button type="text" size="mini" icon="el-icon-top" class="action-icon is-neutral" :disabled="busy || i === 0" aria-label="向前移动" @click="move(i, -1)" /></el-tooltip>
                <el-tooltip content="向后移动" placement="top" popper-class="action-tooltip"><el-button type="text" size="mini" icon="el-icon-bottom" class="action-icon is-neutral" :disabled="busy || i === content.photos.length - 1" aria-label="向后移动" @click="move(i, 1)" /></el-tooltip>
                <el-tooltip content="从相册移出" placement="top" popper-class="action-tooltip"><el-button type="text" size="mini" icon="el-icon-delete" class="action-icon is-danger" :disabled="busy" aria-label="移出照片" @click="remove(i)" /></el-tooltip>
              </div>
            </div>
          </article>
        </div>
      </el-card>
    </div>

    <el-dialog title="相册草稿预览" :visible.sync="previewVisible" width="92%" top="4vh" append-to-body>
      <div class="draft-preview"><h1>{{ content.title }}</h1><p class="muted">{{ content.date }}</p><p class="preview-description">{{ content.description }}</p>
        <div class="preview-grid"><figure v-for="(entry, i) in content.photos" :key="entry.photoId"><button class="preview-photo" :aria-label="`打开照片 ${i + 1}`" @click="viewPhoto(i)"><img v-if="thumbnails[entry.photoId]" :src="thumbnails[entry.photoId]" :alt="entry.caption || '摄影作品'" :width="photoInfo(entry.photoId).width" :height="photoInfo(entry.photoId).height"><span v-else>点击查看照片</span></button><figcaption>{{ entry.caption }}</figcaption></figure></div>
      </div>
    </el-dialog>
    <el-dialog title="照片预览" :visible.sync="viewerVisible" fullscreen append-to-body @closed="releaseDisplay">
      <div v-loading="viewerLoading" class="admin-viewer" @touchstart="viewerTouchStart" @touchend="viewerTouchEnd">
        <div class="viewer-nav"><el-button size="small" icon="el-icon-arrow-left" aria-label="上一张" :disabled="viewerIndex <= 0 || viewerLoading" @click="viewPhoto(viewerIndex - 1)">上一张</el-button><span>{{ viewerIndex + 1 }} / {{ content.photos.length }}</span><el-button size="small" aria-label="下一张" :disabled="viewerIndex + 1 >= content.photos.length || viewerLoading" @click="viewPhoto(viewerIndex + 1)">下一张 <i class="el-icon-arrow-right" /></el-button><el-button size="small" icon="el-icon-download" aria-label="下载原图" :disabled="viewerLoading" @click="downloadOriginal">下载原图</el-button></div>
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
.album-list-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 16px; }
.album-list-title { font-weight: 500; color: var(--text-primary); overflow-wrap: anywhere; }
.album-list-description { margin: 5px 0 0; color: var(--text-muted); font-size: 12px; line-height: 1.6; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
.muted { color: var(--text-muted); font-size: 12px; }
.editor-commandbar { position: sticky; top: 0; z-index: 10; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; padding: 14px 18px; margin-bottom: 16px; border: 1px solid var(--brand-border); border-radius: var(--radius-medium); background: var(--surface); box-shadow: 0 4px 16px rgba(32, 45, 77, .06); }
.editor-heading { display: flex; align-items: center; gap: 16px; min-width: 0; }
.editor-heading > .el-button { flex-shrink: 0; color: var(--brand-primary); }
.editor-title { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.editor-title strong { max-width: 320px; font-size: 15px; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.editor-heading > .el-tag { flex-shrink: 0; }
.album-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.album-actions .el-button { margin-left: 0; }
.album-details { margin-bottom: 16px; }
.album-form { max-width: 860px; padding: 4px 0; }
.album-form .el-form-item:last-child { margin-bottom: 0; }
.photo-section-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; }
.photo-section-heading .muted { font-weight: 400; }
.section-count { margin-left: 6px; color: var(--brand-primary); font-size: 12px; }
.photo-upload { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; padding: 18px 20px; border: 1px solid var(--brand-border); border-radius: var(--radius-medium); background: var(--surface-soft); }
.upload-copy { display: flex; align-items: center; gap: 14px; min-width: 0; }
.upload-copy > i { color: var(--brand-primary); font-size: 30px; }
.upload-copy strong { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.upload-copy p { margin: 6px 0 0; font-size: 12px; line-height: 1.7; color: var(--text-secondary); }
.photo-upload > .el-button { color: var(--brand-primary); border-color: var(--brand-border); background: var(--brand-soft); }
.photo-upload > .el-button:not(.is-disabled):hover { color: var(--surface); border-color: var(--brand-primary); background: var(--brand-primary); }
.photo-upload > .el-button.is-disabled { opacity: .6; }
.photo-picker { display: none; }
.photo-publish-hint { margin: 12px 0 20px; color: var(--text-muted); font-size: 12px; line-height: 1.8; }
.photo-publish-hint > i { margin-right: 4px; }
.upload-queue { padding: 0 16px; border: 1px solid var(--brand-border); border-radius: var(--radius-medium); margin-bottom: 20px; }
.queue-heading { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; min-height: 46px; border-bottom: 1px solid var(--brand-border); }
.queue-heading strong { font-size: 13px; font-weight: 500; }
.queue-heading .muted { margin-left: 8px; }
.queue-items { max-height: 224px; overflow-y: auto; }
.queue-row { display: grid; grid-template-columns: minmax(100px, 1fr) minmax(110px, 160px) minmax(100px, 1fr) 40px; gap: 16px; align-items: center; min-height: 46px; font-size: 12px; }
.queue-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.queue-message { color: var(--text-secondary); overflow-wrap: anywhere; }
.edit-photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
.edit-photo { min-width: 0; border: 1px solid var(--brand-border); border-radius: var(--radius-medium); overflow: hidden; background: var(--surface); }
.photo-card-heading { display: flex; justify-content: space-between; align-items: center; gap: 8px; min-height: 40px; padding: 8px 14px; background: var(--surface-soft); }
.photo-sequence { font-size: 12px; color: var(--text-secondary); }
.edit-photo-image { height: 200px; background: var(--surface-muted); display: flex; align-items: center; justify-content: center; }
.edit-photo-image img { width: 100%; height: 100%; object-fit: contain; }
.edit-photo-image > i { color: var(--text-muted); font-size: 32px; }
.photo-card-body { padding: 14px; }
.photo-filename { margin: 0; color: var(--text-primary); font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.photo-exif { min-height: 30px; line-height: 1.6; margin: 6px 0 12px; overflow-wrap: anywhere; }
.photo-field-label { display: block; margin: 12px 0 6px; color: var(--text-secondary); font-size: 12px; }
.photo-controls { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; padding: 12px 14px; border-top: 1px solid var(--brand-border); }
.photo-controls .el-button { margin-left: 0; }
.el-pagination { margin-top: 16px; text-align: right; }
.draft-preview { max-width: 1100px; margin: auto; color: var(--text-primary); }
.draft-preview h1 { font-size: 24px; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; }
.preview-description { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.9; margin: 20px 0; color: var(--text-secondary); }
.preview-grid { columns: 3; column-gap: 20px; }
.preview-grid figure { break-inside: avoid; margin: 0 0 20px; }
.preview-photo { padding: 0; border: 0; border-radius: 6px; overflow: hidden; width: 100%; background: var(--surface-muted); cursor: zoom-in; }
.preview-photo img { width: 100%; height: auto; display: block; }
.preview-photo > span { display: block; padding: 24px; color: var(--brand-primary); }
.preview-grid figcaption { padding-top: 8px; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--text-secondary); }
.admin-viewer { text-align: center; min-height: 70vh; }
.admin-viewer > img { display: block; max-width: 100%; height: 70vh; object-fit: contain; margin: 20px auto; }
.viewer-nav { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; align-items: center; }
.viewer-nav .el-button { margin-left: 0; }
.admin-viewer p { white-space: pre-wrap; line-height: 1.8; }
.photography-admin :focus-visible { outline: 2px solid var(--brand-primary); outline-offset: 3px; }
@media (max-width: 800px) { .preview-grid { columns: 2; } }
@media (max-width: 640px) {
  .editor-commandbar { padding: 12px; gap: 12px; }
  .editor-heading { width: 100%; gap: 10px; }
  .editor-title { flex: 1; }
  .editor-title strong { max-width: 100%; font-size: 14px; }
  .album-actions { gap: 6px; }
  .photo-upload { padding: 16px; }
  .album-form ::v-deep .el-form-item__label { float: none; display: block; width: auto !important; text-align: left; padding-bottom: 6px; }
  .album-form ::v-deep .el-form-item__content { margin-left: 0 !important; }
  .album-form ::v-deep .el-date-editor { width: 100%; }
  .el-pagination { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px; white-space: normal; }
  .upload-copy { align-items: flex-start; }
  .queue-row { grid-template-columns: minmax(0, 1fr) 40px; gap: 6px 12px; padding: 10px 0; }
  .queue-name { grid-column: 1 / -1; }
  .queue-row .el-progress { grid-column: 1; }
  .queue-message { grid-column: 1; }
  .queue-row > .el-button { grid-column: 2; grid-row: span 2; }
  .edit-photo-grid { grid-template-columns: minmax(0, 1fr); }
  .preview-grid { columns: 1; }
}
</style>
