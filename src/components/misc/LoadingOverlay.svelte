<script lang="ts">
  import { onMount } from 'svelte';

  let isLoading = true;
  let progress = 0;
  let statusText = 'Loading';
  let isComplete = false;

  onMount(() => {
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      checkResources();
    }, 200);

    setTimeout(() => {
      if (isLoading) hideOverlay();
    }, 10000);
  });

  const checkResources = () => {
    const imgs = document.querySelectorAll('img');
    const total = imgs.length;

    if (total === 0) {
      completeLoading();
      return;
    }

    let loaded = 0;
    imgs.forEach(img => {
      const checkImg = () => {
        loaded++;
        progress = Math.round((loaded / total) * 100);

        if (loaded >= total || progress >= 100) {
          completeLoading();
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

  const completeLoading = () => {
    progress = 100;
    isComplete = true;
    statusText = 'Complete';
    setTimeout(hideOverlay, 800);
  };

  const hideOverlay = () => {
    isLoading = false;
    document.body.style.overflow = '';
  };
</script>

{#if isLoading}
  <div class="loading-overlay" class:fade-out={isComplete}>
    <div class="content">
      <!-- Percentage -->
      <div class="percentage" class:bright={progress > 50} class:complete={isComplete}>
        {progress}%
      </div>

      <!-- Progress Bar -->
      <div class="progress-wrapper">
        <div class="progress-track"></div>
        <div
          class="progress-fill"
          style="width: {progress}%"
        ></div>
        <div class="progress-glow" class:active={isComplete} style="width: {progress}%"></div>
      </div>

      <!-- Status Text -->
      <div class="status-text">
        {statusText}
      </div>
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
  }

  .loading-overlay.fade-out {
    opacity: 0;
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 320px;
    padding: 0 1rem;
  }

  /* Percentage */
  .percentage {
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 1.5rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.25);
    letter-spacing: -0.02em;
    margin-bottom: 2rem;
    transition: color 0.5s ease;
  }

  .percentage.bright {
    color: rgba(255, 255, 255, 0.95);
  }

  .percentage.complete {
    color: #ffffff;
  }

  /* Progress Bar */
  .progress-wrapper {
    position: relative;
    width: 100%;
    height: 1px;
  }

  .progress-track {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 1px;
  }

  .progress-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: #ffffff;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.12);
    border-radius: 1px;
    transition: width 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  .progress-glow {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 1px;
    opacity: 0;
    pointer-events: none;
    transition: width 0.3s ease, opacity 0.3s ease;
  }

  .progress-glow.active {
    opacity: 1;
    animation: soft-pulse 2s ease-in-out infinite;
  }

  /* Status Text */
  .status-text {
    font-size: 0.625rem;
    color: rgba(255, 255, 255, 0.2);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-top: 1.5rem;
    transition: opacity 0.3s ease;
  }

  /* Animations */
  @keyframes soft-pulse {
    0%, 100% {
      opacity: 0.2;
      filter: blur(4px);
    }
    50% {
      opacity: 0.5;
      filter: blur(8px);
    }
  }
</style>
