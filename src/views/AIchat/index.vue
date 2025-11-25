<template>
    <div class="ai-chat-container">
      <!-- 聊天头部 - 玻璃拟态+渐变 -->
      <div class="chat-header">
        <div class="header-left">
          <n-avatar :src="aiAvatar" class="header-avatar" />
          <div class="header-info">
            <span class="chat-title">智能助手（通义千问）</span>
            <span class="online-status">在线</span>
          </div>
        </div>
        <div class="header-actions">
          <n-button 
            circle 
            size="tiny" 
            @click="minimizeChat" 
            class="header-btn"
            :style="{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }"
          >
            <n-icon size="16"><minus-outlined /></n-icon>
          </n-button>
          <n-button 
            circle 
            size="tiny" 
            @click="maximizeChat" 
            class="header-btn"
            :style="{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }"
          >
            <n-icon size="16"><expand-outlined /></n-icon>
          </n-button>
          <n-button 
            circle 
            size="tiny" 
            @click="chatStore.clearChat" 
            class="header-btn close-btn"
            :style="{ background: 'rgba(239,68,68,0.2)', border: 'none', color: '#fca5a5' }"
          >
            <n-icon size="16"><delete-outlined /></n-icon>
          </n-button>
        </div>
      </div>
  
      <!-- 聊天内容区域 - 暗色背景+消息卡片 -->
      <div class="chat-content" ref="chatHistoryRef">
        <div class="message-list">
          <!-- 欢迎语卡片（仅无消息时显示） -->
          <div class="welcome-card" v-if="chatStore.messages.length === 0">
            <div class="welcome-title">👋 欢迎使用智能助手</div>
            <div class="welcome-desc">我是基于通义千问的智能助手，可帮你解答问题、提供建议，随时为你服务！</div>
          </div>
  
          <!-- 聊天消息 -->
          <div 
            v-for="msg in chatStore.messages" 
            :key="msg.id" 
            :class="`message-item ${msg.role}`"
          >
            <!-- <n-avatar 
              v-if="msg.role === 'assistant'" 
              :src="aiAvatar" 
              class="message-avatar ai-avatar" 
            /> -->
            <div :class="`message-bubble ${msg.role}-bubble`">
              <div class="message-content">{{ msg.content }}</div>
              <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
            </div>
            <!-- <n-avatar 
              v-if="msg.role === 'user'" 
              :src="userAvatar" 
              class="message-avatar user-avatar" 
            /> -->
          </div>
  
          <!-- 加载中动画 -->
          <div class="loading-item" v-if="chatStore.isStreaming">
            <n-avatar :src="aiAvatar" class="message-avatar ai-avatar" />
            <div class="message-bubble assistant-bubble loading-bubble">
              <div class="loading-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 输入区域 - 悬浮玻璃效果 + 业务逻辑 -->
      <div class="chat-input-area">
        <div class="input-wrapper">
          <n-button 
            circle 
            size="small" 
            class="input-btn emoji-btn"
            :style="{ background: 'transparent', border: 'none', color: '#a5b4fc' }"
            :disabled="chatStore.isStreaming"
          >
            <n-icon size="18"><smile-outlined /></n-icon>
          </n-button>
          <textarea
            v-model="chatStore.inputContent"
            placeholder="输入你的问题，按回车发送..."
            :disabled="chatStore.isStreaming"
            @keydown.enter.prevent="handleSend"
            @keydown.shift.enter="handleNewLine"
            class="message-input"
          ></textarea>
          <div class="button-group">
            <n-button 
              type="primary" 
              circle 
              size="small" 
              class="send-btn"
              @click="handleSend"
              :disabled="!chatStore.inputContent.trim() || chatStore.isStreaming"
              :style="{ 
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                border: 'none',
                width: '44px',
                height: '44px'
              }"
            >
              <n-icon size="18"><send-outlined /></n-icon>
            </n-button>
            <n-button 
              circle 
              size="small" 
              class="clear-btn"
              @click="chatStore.clearChat"
              :style="{ 
                background: 'rgba(239,68,68,0.2)', 
                border: 'none',
                width: '44px',
                height: '44px',
                color: '#fca5a5'
              }"
            >
              <n-icon size="18"><delete-outlined /></n-icon>
            </n-button>
          </div>
        </div>
  
        <!-- 模型切换（保留通义千问） -->
        <div class="model-switch">
          <label>
            <input type="radio" v-model="selectedModel" value="dashscope" checked disabled /> 
            <span>通义千问</span>
          </label>
        </div>
  
        <div class="tip-text">支持回车发送，Shift+回车换行</div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, nextTick, onUnmounted } from 'vue';
  import { useChatStore } from '@/store/chatStore';
  import { streamChat } from '@/utils/aiClient';
  import { NAvatar, NButton, NIcon } from 'naive-ui';
  import { 
    MinusOutlined, ExpandOutlined, DeleteOutlined, 
    SmileOutlined, SendOutlined 
  } from '@vicons/antd';
  
  // 头像地址（放public根目录）
  const aiAvatar = ref('/ai-avatar.png');
  const userAvatar = ref('/user-avatar.png');
  
  // 状态管理与DOM引用
  const chatStore = useChatStore();
  const chatHistoryRef = ref<HTMLDivElement | null>(null);
  const selectedModel = ref<'dashscope'>('dashscope');
  
  // 页面加载初始化
  onMounted(() => {
    chatStore.initChat();
    nextTick(() => scrollToBottom());
  });
  
  // 发送消息（复用你的业务逻辑）
  const handleSend = async () => {
    const content = chatStore.inputContent.trim();
    if (!content) return;
  
    // 1. 添加用户消息
    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: Date.now()
    };
    chatStore.messages = [...chatStore.messages, userMsg];
    localStorage.setItem('chatMessages', JSON.stringify(chatStore.messages));
  
    // 2. 初始化AI消息（占位）
    const aiMsgId = Date.now().toString() + '-ai';
    const aiMsg = {
      id: aiMsgId,
      role: 'assistant' as const,
      content: '加载中...',
      timestamp: Date.now()
    };
    chatStore.messages = [...chatStore.messages, aiMsg];
  
    // 3. 开启流式状态 + 清空输入框 + 滚动到底部
    chatStore.isStreaming = true;
    chatStore.inputContent = '';
    nextTick(() => scrollToBottom());
  
    try {
      // 4. 调用AI流式接口
      const validMessages = chatStore.messages
        .slice(0, -1) // 排除占位AI消息
        .map(msg => ({ role: msg.role, content: msg.content }));
      const messageIterator = await streamChat(validMessages, selectedModel.value);
  
      // 5. 流式接收回复（这里保留你的完整接收逻辑，也可改为实时流式更新）
      let fullAiContent = '';
      for await (const chunk of messageIterator) {
        fullAiContent += chunk;
        // 实时更新（可选，如需流式打字效果，解开下面注释）
        // chatStore.messages = chatStore.messages.map(msg => 
        //   msg.id === aiMsgId ? { ...msg, content: fullAiContent } : msg
        // );
        // nextTick(() => scrollToBottom());
      }
  
      // 6. 最终更新AI消息
      chatStore.messages = chatStore.messages.map(msg => {
        if (msg.id === aiMsgId) {
          return { ...msg, content: fullAiContent };
        }
        return msg;
      });
      localStorage.setItem('chatMessages', JSON.stringify(chatStore.messages));
  
    } catch (error: any) {
      // 错误处理
      chatStore.messages = chatStore.messages.map(msg => {
        if (msg.id === aiMsgId) {
          return { ...msg, content: error.message || 'AI回复失败，请重试~' };
        }
        return msg;
      });
    } finally {
      chatStore.isStreaming = false;
      nextTick(() => scrollToBottom());
    }
  };
  
  // Shift+Enter 换行
  const handleNewLine = () => {
    chatStore.inputContent += '\n';
  };
  
  // 滚动到底部
  const scrollToBottom = () => {
    if (chatHistoryRef.value) {
      chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
    }
  };
  
  // 窗口大小变化监听
  const handleResize = () => {
    nextTick(() => scrollToBottom());
  };
  
  // 窗口控制方法
  const minimizeChat = () => {
    // 可添加最小化逻辑（如隐藏窗口）
  };
  
  const maximizeChat = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log('退出全屏失败:', err));
    } else {
      document.documentElement.requestFullscreen().catch(err => console.log('全屏失败:', err));
    }
  };
  
  // 时间格式化
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // 清理监听
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });
  </script>
  
  <style scoped>
  /* 全局容器 - 全屏+暗色渐变背景 */
  .ai-chat-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: linear-gradient(180deg, #1e1b4b, #0f172a);
    font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }
  
  /* 头部样式 - 玻璃拟态 */
  .chat-header {
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    height: 64px;
    box-sizing: border-box;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .header-avatar {
    width: 32px;
    height: 32px;
    border: 2px solid rgba(255, 255, 255, 0.1);
  }
  
  .header-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .chat-title {
    font-size: 16px;
    font-weight: 600;
    color: #f8fafc;
  }
  
  .online-status {
    font-size: 12px;
    color: #4ade80;
  }
  
  .header-actions {
    display: flex;
    gap: 8px;
  }
  
  .header-btn {
    width: 32px;
    height: 32px;
    transition: all 0.2s ease;
  }
  
  .header-btn:hover {
    background: rgba(255, 255, 255, 0.2) !important;
  }
  
  .close-btn:hover {
    background: rgba(239, 68, 68, 0.3) !important;
  }
  
  /* 内容区域 - 暗色背景+柔和滚动 */
  .chat-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #334155 #1e293b;
  }
  
  .chat-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .chat-content::-webkit-scrollbar-track {
    background: #1e293b;
    border-radius: 3px;
  }
  
  .chat-content::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 3px;
  }
  
  .chat-content::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }
  
  .message-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 800px;
    margin: 0 auto;
    padding-bottom: 20px;
  }
  
  /* 欢迎卡片 */
  .welcome-card {
    padding: 20px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    text-align: center;
    margin-top: 20px;
  }
  
  .welcome-title {
    font-size: 18px;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 8px;
  }
  
  .welcome-desc {
    font-size: 14px;
    color: #94a3b8;
  }
  
  /* 消息项样式 */
  .message-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  
  .message-item.user {
    flex-direction: row-reverse;
  }
  
  .message-avatar {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }
  
  .ai-avatar {
    background: rgba(99, 102, 241, 0.1);
  }
  
  .user-avatar {
    background: rgba(139, 92, 246, 0.1);
  }
  
  /* 消息气泡 - 玻璃拟态+圆角 */
  .message-bubble {
    padding: 14px 18px;
    border-radius: 18px;
    max-width: 75%;
    position: relative;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }
  
  .assistant-bubble {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-top-left-radius: 6px;
  }
  
  .user-bubble {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-top-right-radius: 6px;
  }
  
  .message-content {
    line-height: 1.6;
    font-size: 14px;
    margin-bottom: 6px;
    white-space: pre-wrap;
    word-break: break-word;
    color: #e2e8f0;
  }
  
  .user-bubble .message-content {
    color: #ffffff;
  }
  
  .message-time {
    font-size: 11px;
    color: #94a3b8;
    text-align: right;
  }
  
  .user-bubble .message-time {
    color: rgba(255, 255, 255, 0.7);
  }
  
  /* 加载动画 - 圆点跳动 */
  .loading-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  
  .loading-bubble {
    padding: 14px 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .loading-dots {
    display: flex;
    gap: 4px;
  }
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #94a3b8;
    animation: dotPulse 1.4s infinite ease-in-out both;
  }
  
  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes dotPulse {
    0% { transform: scale(0); }
    50% { transform: scale(1); }
    100% { transform: scale(0); }
  }
  
  /* 输入区域 - 悬浮玻璃效果 */
  .chat-input-area {
    padding: 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(12px);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
  }
  
  .message-input {
    flex: 1;
    min-height: 48px;
    padding: 12px;
    background: transparent;
    border: none;
    color: #e2e8f0;
    font-size: 14px;
    resize: none;
    outline: none;
    white-space: pre-wrap;
  }
  
  .message-input::placeholder {
    color: #64748b;
  }
  
  .message-input:disabled {
    background: transparent;
    cursor: not-allowed;
    opacity: 0.8;
  }
  
  .emoji-btn {
    width: 44px;
    height: 44px;
  }
  
  .button-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .send-btn, .clear-btn {
    transition: all 0.2s ease;
  }
  
  .send-btn:hover:not(:disabled) {
    transform: scale(1.05);
  }
  
  .send-btn:disabled {
    background: #334155 !important;
    cursor: not-allowed;
    transform: none;
  }
  
  .clear-btn:hover {
    background: rgba(239, 68, 68, 0.3) !important;
  }
  
  /* 模型切换 */
  .model-switch {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #94a3b8;
    font-size: 14px;
    margin-left: 12px;
  }
  
  .model-switch input {
    margin-right: 4px;
    cursor: pointer;
    accent-color: #8b5cf6;
  }
  
  /* 提示文字 */
  .tip-text {
    font-size: 12px;
    color: #64748b;
    text-align: center;
  }
  
  /* 响应式适配 */
  @media (max-width: 768px) {
    .chat-header {
      padding: 12px 16px;
    }
  
    .chat-content {
      padding: 16px;
    }
  
    .message-list {
      max-width: 100%;
      gap: 16px;
    }
  
    .message-bubble {
      max-width: 80%;
      padding: 12px 16px;
    }
  
    .chat-input-area {
      padding: 12px 16px;
    }
  
    .input-wrapper {
      padding: 10px 12px;
    }
  
    .model-switch {
      margin-left: 0;
      margin-top: 8px;
      justify-content: center;
    }
  }
  </style>