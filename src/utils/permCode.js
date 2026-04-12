// v-perm 使用和权限检查的集中权限映射.
export const PERMS = Object.freeze({
  // 用户管理
  user: {
    page: 'system:user:page',
    add: 'system:user:add:btn',
    update: 'system:user:update:btn',
    delete: 'system:user:delete:btn',
    status: 'system:user:status:btn',
    resetPwd: 'system:user:resetPwd:btn',
    kick: 'system:user:kick:btn'
  },
  // 角色管理
  role: {
    page: 'system:role:page',
    add: 'system:role:add:btn',
    update: 'system:role:update:btn',
    delete: 'system:role:delete:btn',
    status: 'system:role:status:btn',
    permList: 'system:role:permConfig:btn',
    assignUser: 'system:role:assignUser:btn'
  },
  // 菜单管理
  menu: {
    page: 'system:menu:page',
    add: 'system:menu:add:btn',
    update: 'system:menu:update:btn',
    delete: 'system:menu:delete:btn',
    permList: 'system:menu:permConfig:btn'
  },
  // 权限管理
  permission: {
    page: 'system:permission:page',
    add: 'system:permission:add:btn',
    update: 'system:permission:update:btn',
    effective: 'system:permission:effective:btn'
  },
  // 资源管理
  resource: {
    add: 'system:resource:add:btn',
    update: 'system:resource:update:btn',
    delete: 'system:resource:delete:btn'
  },
  // 字典管理
  dict: {
    add: 'system:dict:add:btn',
    update: 'system:dict:update:btn',
    delete: 'system:dict:delete:btn'
  },
  // 白名单管理
  whitelist: {
    add: 'system:whitelist:add:btn',
    update: 'system:whitelist:update:btn',
    delete: 'system:whitelist:delete:btn'
  },
  // 文件管理
  file: {
    upload: 'system:file:upload:btn',
    uploadBatch: 'system:file:uploadBatch:btn',
    tempDownload: 'system:file:tempDownload:btn',
    download: 'system:file:download:btn',
    delete: 'system:file:delete:btn'
  },
  // 日志管理
  log: {
    loginPage: 'system:loginLog:page',
    loginExport: 'system:loginLog:export:btn',
    operateExport: 'system:operateLog:export:btn'
  },
  // 文章管理
  article: {
    page: 'blog:article:page',
    add: 'blog:article:add:btn',
    update: 'blog:article:update:btn',
    delete: 'blog:article:delete:btn',
    audit: 'blog:article:audit:btn'
  },
  // 分类管理
  category: {
    page: 'blog:category:page',
    add: 'blog:category:add:btn',
    update: 'blog:category:update:btn',
    delete: 'blog:category:delete:btn'
  },
  // 标签管理
  tag: {
    page: 'blog:tag:page',
    add: 'blog:tag:add:btn',
    update: 'blog:tag:update:btn',
    delete: 'blog:tag:delete:btn'
  },
  // 友链管理
  link: {
    page: 'blog:link:page',
    add: 'blog:link:add:btn',
    update: 'blog:link:update:btn',
    delete: 'blog:link:delete:btn'
  },
  // 开源项目管理
  project: {
    page: 'blog:project:page',
    add: 'blog:project:add:btn',
    update: 'blog:project:update:btn',
    delete: 'blog:project:delete:btn'
  },
  // 博客配置
  config: {
    page: 'blog:config:page',
    batchUpdate: 'blog:config:batchUpdate:btn'
  },
  // 我的通知
  notification: {
    page: 'notification:page'
  }
})
