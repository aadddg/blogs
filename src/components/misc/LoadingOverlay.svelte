<script lang="ts">
  import { onMount } from 'svelte';
  
  let isLoading = true;
  let progress = 0;
  let message = '正在初始化...';
  
  onMount(() => {
    // 显示黑色遮罩
    document.body.style.overflow = 'hidden';
    
    // 强制显示 500ms 确保看到效果
    setTimeout(() => {
      message = '正在加载资源...';
      checkResources();
    }, 500);
    
    // 3秒强制隐藏（开发环境）
    setTimeout(() => {
      if (isLoading) hideOverlay();
    }, 3000);
  });
  
  const checkResources = () => {
    const imgs = document.querySelectorAll('img');
    const total = imgs.length;
    
    if (total === 0) {
      message = '资源加载完成';
      progress = 100;
      setTimeout(hideOverlay, 600);
      return;
    }
    
    let loaded = 0;
    imgs.forEach(img => {
      const checkImg = () => {
        loaded++;
        progress = Math.round((loaded / total) * 100);
        message = `已加载 ${loaded}/${total} 张图片`;
        
        if (loaded >= total || progress >= 100) {
          setTimeout(hideOverlay, 600);
        }
      };
      
      if (img.complete || img.naturalWidth > 0) {
        checkImg();
      } else {
        img.addEventListener('load', checkImg, { once: true });
        img.addEventListener('error', checkImg, { once: true });
      }
    });
  };
  
  const hideOverlay = () => {
    isLoading = false;
    document.body.style.overflow = '';
  };
</script>

{#if isLoading}
  <div class="loading-overlay">
    <div class="spinner-container">
      <div class="spinner"></div>
      {#if progress > 0}
        <div class="progress-text">{progress}%</div>
      {/if}
    </div>
    <p class="loading-message">{message}</p>
  </div>
{/if}

<style>
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999999;
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: opacity 0.6s ease-out;
  }
  
  .spinner-container {
    position: relative;
    width: 80px;
    height: 80px;
    margin-bottom: 24px;
  }
  
  .spinner {
    width: 100%;
    height: 100%;
    border: 4px solid rgba(96, 165, 250, 0.2);
    border-top-color: #60a5fa;
    border-radius: 50%;
    animation: spin 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
  }
  
  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 18px;
    font-weight: 700;
    color: #60a5fa;
    text-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
  }
  
  .loading-message {
    color: #e5e7eb;
    font-size: 14px;
    margin-top: 8px;
    opacity: 0.9;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>