/* ============================================================
   notification.js  —  右上角屏幕通知弹条
   版本：v1.0.1
   ============================================================ */

let _notifContainer = null;

function initNotificationSystem() {
    if (_notifContainer) return;
    _notifContainer = document.createElement('div');
    _notifContainer.id = 'notification-container';
    document.body.appendChild(_notifContainer);
}

/**
 * 屏幕通知
 */
function showNotification(title, message = '', type = 'info', duration = NOTIFICATION_DURATION) {
    if (!_notifContainer) initNotificationSystem();

    const colors = {
        info:    'linear-gradient(to right, #2196f3, #1976d2)',
        success: 'linear-gradient(to right, #4caf50, #388e3c)',
        warning: 'linear-gradient(to right, #ff9800, #f57c00)',
        danger:  'linear-gradient(to right, #f44336, #d32f2f)',
        event:   'linear-gradient(to right, #9c27b0, #7b1fa2)',
    };

    const el = document.createElement('div');
    el.className = 'notification';
    el.style.background = colors[type] || colors.info;
    el.innerHTML = `
        <div style="flex:1;min-width:0">
            <div style="font-weight:bold;margin-bottom:2px">${title}</div>
            ${message ? `<div style="font-size:0.85rem;opacity:0.9">${message}</div>` : ''}
        </div>
        <button class="notification-close" aria-label="${t('notifications.closed')}">&times;</button>
    `;

    const close = () => {
        if (!el.parentNode) return;
        el.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => el.remove(), 300);
    };

    el.querySelector('.notification-close').onclick = close;
    _notifContainer.appendChild(el);

    if (duration > 0) setTimeout(close, duration);
}