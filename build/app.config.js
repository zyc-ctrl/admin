// public/app.config.js
// 挂载全局变量，匹配代码中解构的字段
window.rn = {
    VITE_GLOB_APP_TITLE: '你的项目标题', // 必填：解决解构失败
    // 可选：补充其他环境变量（如接口地址、APP版本等）
    VITE_APP_API_BASE_URL: 'https://xxx.com/api',
    VITE_APP_BASE_URL: '/'
  }