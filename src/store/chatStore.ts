import { defineStore } from 'pinia';

// 聊天消息类型定义
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// 定义 Pinia 仓库
export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [] as Message[], // 聊天历史
    inputContent: '', // 输入框内容
    isStreaming: false // 流式加载状态
  }),
  actions: {
    // 添加消息到历史
    addMessage(message: Message) {
      this.messages.push(message);
      localStorage.setItem('chatMessages', JSON.stringify(this.messages));
    },
    // 清空聊天历史
    clearChat() {
      this.messages = [];
      localStorage.removeItem('chatMessages');
    },
    // 更新输入框内容
    updateInput(content: string) {
      this.inputContent = content;
    },
    // 切换流式状态
    setStreaming(status: boolean) {
      this.isStreaming = status;
    },
    // 从本地存储恢复聊天历史
    initChat() {
      const saved = localStorage.getItem('chatMessages');
      if (saved) this.messages = JSON.parse(saved);
    }
  }
});