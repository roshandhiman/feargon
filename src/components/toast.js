/* ====================================
   Toast Notification Component
   ==================================== */

let toastContainer = null;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Show a toast notification
 * @param {string} message
 * @param {Object} options
 */
export function showToast(message, options = {}) {
  const {
    type = 'info', // 'info' | 'success' | 'warning' | 'error'
    duration = 3000,
  } = options;

  const container = ensureContainer();

  const colors = {
    info: { bg: 'rgba(0, 212, 255, 0.1)', border: 'rgba(0, 212, 255, 0.2)', text: '#00d4ff' },
    success: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
    error: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
  };

  const c = colors[type];

  const toast = document.createElement('div');
  toast.style.cssText = `
    padding: 12px 20px;
    background: ${c.bg};
    backdrop-filter: blur(20px);
    border: 1px solid ${c.border};
    border-radius: 12px;
    color: ${c.text};
    font-size: 14px;
    font-weight: 500;
    pointer-events: auto;
    animation: toast-in 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    cursor: pointer;
    max-width: 360px;
    font-family: 'Inter', sans-serif;
  `;
  toast.textContent = message;

  toast.addEventListener('click', () => removeToast(toast));
  container.appendChild(toast);

  setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
  toast.style.animation = 'toast-out 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards';
  setTimeout(() => toast.remove(), 300);
}
