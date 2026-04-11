<script lang="ts">
  import { onMount } from 'svelte';

  let isLoading = $state(true);
  let progress = $state(0);
  let statusText = $state('Loading');
  let isComplete = $state(false);
  let isEntering = $state(false);

  let loadedResources = $state(0);
  let totalResources = $state(0);

  const stages = [
    { at: 0, text: 'Loading' },
    { at: 30, text: 'Connecting' },
    { at: 60, text: 'Fetching' },
    { at: 85, text: 'Finalizing' }
  ];

  onMount(() => {
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      collectAndCheckResources();
    }, 300);

    setTimeout(() => {
      if (isLoading) {
        forceComplete();
      }
    }, 15000);
  });

  function updateStatus(currentProgress: number) {
    const currentStage = [...stages].reverse().find(s => currentProgress >= s.at);
    if (currentStage && statusText !== currentStage.text) {
      statusText = currentStage.text;
    }
  }

  function collectAndCheckResources() {
    const resources: { type: string; url?: string; element?: Element; check?: () => Promise<void> }[] = [];

    const bgImage = document.getElementById('fixed-bg');
    if (bgImage) {
      const imgElement = bgImage.querySelector('img');
      if (imgElement && imgElement.src) {
        resources.push({
          type: 'background-image',
          url: imgElement.src,
          element: imgElement
        });
      }
    }

    const imgs = document.querySelectorAll('img');
    imgs.forEach((img) => {
      if (img.src && !img.src.startsWith('data:')) {
        const isDuplicate = resources.some(r => r.url === img.src);
        if (!isDuplicate) {
          resources.push({
            type: 'image',
            url: img.src,
            element: img
          });
        }
      }
    });

    const elementsWithBg = document.querySelectorAll('[style*="background"], [class*="bg-"]');
    elementsWithBg.forEach((el) => {
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;
      if (bgImage && bgImage !== 'none' && !bgImage.startsWith('linear-gradient') && !bgImage.startsWith('radial-gradient')) {
        const match = bgImage.match(/url\("([^"]+)"\)/) || bgImage.match(/url\('([^']+)'\)/) || bgImage.match(/url\(([^)]+)\)/);
        if (match && match[1]) {
          const isDuplicate = resources.some(r => r.url === match[1]);
          if (!isDuplicate) {
            resources.push({
              type: 'css-background',
              url: match[1],
              element: el
            });
          }
        }
      }
    });

    const iconElements = document.querySelectorAll('svg[data-icon], [data-iconify]');
    if (iconElements.length > 0) {
      resources.push({
        type: 'icons',
        check: () => waitForIcons(iconElements.length)
      });
    }

    const swupContainer = document.querySelector('[data-swup]') || document.getElementById('swup');
    if (swupContainer) {
      resources.push({
        type: 'swup-container',
        check: () => waitForSwup()
      });
    }

    resources.push({
      type: 'fonts',
      check: () => waitForFonts()
    });

    resources.push({
      type: 'dom-ready',
      check: () => waitForDomReady()
    });

    totalResources = resources.length;

    if (totalResources === 0) {
      completeLoading();
      return;
    }

    let loaded = 0;

    const checkComplete = () => {
      loaded++;
      loadedResources = loaded;
      progress = Math.round((loaded / totalResources) * 100);
      updateStatus(progress);

      if (loaded >= totalResources) {
        completeLoading();
      }
    };

    resources.forEach((resource) => {
      if (resource.check) {
        resource.check().then(() => checkComplete()).catch(() => checkComplete());
      } else if (resource.element && resource.element instanceof HTMLImageElement) {
        if (resource.element.complete || resource.element.naturalWidth > 0) {
          checkComplete();
        } else {
          const handleLoad = () => {
            resource.element?.removeEventListener('load', handleLoad);
            resource.element?.removeEventListener('error', handleError);
            checkComplete();
          };
          const handleError = () => {
            resource.element?.removeEventListener('load', handleLoad);
            resource.element?.removeEventListener('error', handleError);
            checkComplete();
          };
          resource.element.addEventListener('load', handleLoad, { once: true });
          resource.element.addEventListener('error', handleError, { once: true });
        }
      } else if ((resource.type === 'css-background' || resource.type === 'background-image') && resource.url) {
        const img = new Image();
        img.onload = () => checkComplete();
        img.onerror = () => checkComplete();
        img.src = resource.url;
      } else {
        checkComplete();
      }
    });
  }

  function waitForIcons(expectedCount: number): Promise<void> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50;

      const checkIcons = () => {
        attempts++;
        const svgIcons = document.querySelectorAll('svg[data-icon]');
        const iconifyElements = document.querySelectorAll('[data-iconify]');
        const totalIcons = svgIcons.length + iconifyElements.length;

        if (totalIcons >= expectedCount || attempts >= maxAttempts) {
          setTimeout(resolve, 200);
        } else {
          setTimeout(checkIcons, 100);
        }
      };

      setTimeout(checkIcons, 100);
    });
  }

  function waitForSwup(): Promise<void> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 30;

      const checkSwup = () => {
        attempts++;
        if (window.swup) {
          if (!window.swup.isLoading || attempts >= maxAttempts) {
            setTimeout(resolve, 300);
          } else {
            setTimeout(checkSwup, 100);
          }
        } else if (attempts >= maxAttempts) {
          resolve();
        } else {
          setTimeout(checkSwup, 100);
        }
      };

      checkSwup();
    });
  }

  function waitForFonts(): Promise<void> {
    return new Promise((resolve) => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          setTimeout(resolve, 100);
        }).catch(() => resolve());
      } else {
        setTimeout(resolve, 500);
      }
    });
  }

  function waitForDomReady(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        setTimeout(resolve, 100);
      } else {
        const handleLoad = () => {
          window.removeEventListener('load', handleLoad);
          setTimeout(resolve, 200);
        };
        window.addEventListener('load', handleLoad);
      }
    });
  }

  function completeLoading() {
    if (isComplete) return;
    progress = 100;
    isComplete = true;
    statusText = 'Ready';
    // 自动触发进入动画，无需用户点击
    setTimeout(() => {
      autoEnter();
    }, 500);
  }

  function forceComplete() {
    progress = 100;
    isComplete = true;
    statusText = 'Ready';
    autoEnter();
  }

  function autoEnter() {
    isEntering = true;
    setTimeout(() => {
      isLoading = false;
      document.body.style.overflow = '';
    }, 1500);
  }
</script>

{#if isLoading}
  <div class="loading-overlay" class:fade-out={isEntering}>
    <div class="loader-container" class:float-up={isEntering}>
      <!-- 百分比 -->
      <div class="text-center mb-8">
        <span class="percentage" class:bright={progress > 50} class:complete={isComplete}>
          {progress}%
        </span>
      </div>

      <!-- 进度条 -->
      <div class="relative">
        <div class="progress-track"></div>
        <div
          class="progress-fill-bar"
          style="width: {progress}%"
        ></div>
      </div>

      <!-- 状态 -->
      <div class="text-center mt-6 mb-12">
        <span class="status-text" class:ready={isComplete}>
          {statusText}
        </span>
      </div>
    </div>

    <!-- 动画层 -->
    <div class="effect-layer" class:hidden={!isEntering}>
      <div class="expand-line" class:active={isEntering}></div>
      <div class="expand-ring" class:active={isEntering}></div>
      <div class="flash" class:active={isEntering}></div>
    </div>
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
    background: #050505;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.6s ease-out;
    user-select: none;
    overflow: hidden;
  }

  .loading-overlay.fade-out {
    opacity: 0;
  }

  .loader-container {
    width: 100%;
    max-width: 320px;
    padding: 0 1rem;
    position: relative;
  }

  .loader-container.float-up {
    animation: float-up 0.5s ease-out forwards;
  }

  /* 百分比 */
  .percentage {
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 1.5rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.25);
    letter-spacing: -0.02em;
    transition: color 0.5s ease;
  }

  .percentage.bright {
    color: rgba(255, 255, 255, 0.95);
  }

  .percentage.complete {
    color: #ffffff;
  }

  /* 进度条 */
  .progress-track {
    height: 1px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 1px;
  }

  .progress-fill-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 1px;
    background: #ffffff;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.12);
    border-radius: 1px;
    transition: width 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  /* 状态文本 */
  .status-text {
    font-size: 0.625rem;
    color: rgba(255, 255, 255, 0.2);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    transition: all 0.3s ease;
  }

  .status-text.ready {
    color: rgba(255, 255, 255, 0.5);
  }

  /* 动画层 */
  .effect-layer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .effect-layer.hidden {
    display: none;
  }

  /* 横向展开线 */
  .expand-line {
    position: absolute;
    top: 50%;
    left: 50%;
    height: 2px;
    background: linear-gradient(90deg, transparent, white, transparent);
    transform: translate(-50%, -50%);
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
    width: 0%;
    opacity: 0;
  }

  .expand-line.active {
    animation: line-expand 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  }

  /* 扩散圆环 */
  .expand-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100px;
    height: 100px;
    border: 2px solid rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
  }

  .expand-ring.active {
    animation: ring-expand 0.6s ease-out forwards;
  }

  /* 全屏闪光 */
  .flash {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    opacity: 0;
    pointer-events: none;
  }

  .flash.active {
    animation: flash-anim 0.2s ease-out;
  }

  /* 动画定义 */
  @keyframes float-up {
    0% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-60px); }
  }

  @keyframes line-expand {
    0% { width: 0%; opacity: 0; }
    20% { opacity: 1; }
    100% { width: 120%; opacity: 0; }
  }

  @keyframes ring-expand {
    0% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0.8;
      border-width: 2px;
    }
    100% {
      transform: translate(-50%, -50%) scale(3);
      opacity: 0;
      border-width: 0px;
    }
  }

  @keyframes flash-anim {
    0%, 100% { opacity: 0; }
    50% { opacity: 0.3; }
  }
</style>
