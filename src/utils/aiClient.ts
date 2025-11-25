// -------------------------- 通义千问 非流式调用（确保显示） --------------------------
async function streamChatWithDashScope(messages: { role: string; content: string }[]) {
    const apiUrl = import.meta.env.DEV ? '/api/dashscope' : 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_DASHSCOPE_API_KEY}`
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          input: { messages },
          stream: false, // 非流式，直接返回完整文本
          result_format: 'text'
        })
      });
  
      if (!response.ok) throw new Error(`HTTP 错误：${response.status}`);
      const data = await response.json();
      const fullContent = data.output?.text || 'AI 未返回内容';
  
      // 模拟迭代器，兼容原组件的 for await 逻辑
      return (async function* () {
        yield fullContent;
      })();
    } catch (error) {
      throw new Error('通义千问调用失败，请检查 API Key 或网络');
    }
  }
  
  // 统一调用入口（只保留通义千问）
  export async function streamChat(
    messages: { role: string; content: string }[],
    model: 'dashscope' = 'dashscope'
  ) {
    return streamChatWithDashScope(messages);
  }