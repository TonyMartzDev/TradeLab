// Notification System
class NotificationSystem {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', duration = 3000, isLoading = false) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Icon based on type and loading state
        const icon = this.getIcon(type, isLoading);
        
        notification.innerHTML = `
            <div class="notification-content">
                ${icon}
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close">×</button>
        `;

        // Add to DOM
        this.container.appendChild(notification);

        // Add styles dynamically
        this.addStyles();

        // Setup close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.hide(notification));

        // Auto-remove after duration
        setTimeout(() => this.hide(notification), duration);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });
    }

    hide(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }

    getIcon(type, isLoading = false) {
        if (isLoading) {
            return '<i class="fas fa-spinner fa-spin"></i>';
        }
        switch(type) {
            case 'success':
                return '<i class="fas fa-check-circle"></i>';
            case 'error':
                return '<i class="fas fa-exclamation-circle"></i>';
            case 'warning':
                return '<i class="fas fa-exclamation-triangle"></i>';
            default:
                return '<i class="fas fa-info-circle"></i>';
        }
    }

    addStyles() {
        // Only add styles once
        if (document.getElementById('notification-styles')) return;

        const styleSheet = document.createElement('style');
        styleSheet.id = 'notification-styles';
        styleSheet.textContent = `
            .notification {
                background: var(--card-bg);
                border-left: 4px solid;
                padding: 15px 20px;
                margin-bottom: 10px;
                border-radius: 4px;
                box-shadow: var(--shadow);
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 450px;
                transform: translateX(100%);
                opacity: 0;
                transition: transform 0.3s ease, opacity 0.3s ease;
            }

            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .notification i {
                font-size: 1.2em;
            }

            .notification-success {
                border-left-color: var(--success-color);
            }

            .notification-success i {
                color: var(--success-color);
            }

            .notification-error {
                border-left-color: var(--error-color);
            }

            .notification-error i {
                color: var(--error-color);
            }

            .notification-warning {
                border-left-color: var(--accent-secondary);
            }

            .notification-warning i {
                color: var(--accent-secondary);
            }

            .notification-info {
                border-left-color: var(--accent-primary);
            }

            .notification-info i {
                color: var(--accent-primary);
            }

            .notification-message {
                color: var(--text-color);
                font-size: 0.95em;
            }

            .notification-close {
                background: none;
                border: none;
                color: var(--text-color);
                cursor: pointer;
                font-size: 1.5em;
                padding: 0 5px;
                opacity: 0.5;
                transition: opacity 0.2s;
            }

            .notification-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(styleSheet);
    }
}

// Create global instance
const notifications = new NotificationSystem();

// Helper functions
function showSuccessMessage(message) {
    notifications.show(message, 'success');
}

function showErrorMessage(message) {
    notifications.show(message, 'error');
}

function showWarningMessage(message) {
    notifications.show(message, 'warning');
}

function showInfoMessage(message, isLoading = false) {
    if (isLoading) {
        return notifications.show(message, 'info', 0, true); // Duration 0 means it won't auto-dismiss
    }
    return notifications.show(message, 'info');
}

// Export for module usage
export {
    notifications as default,
    showSuccessMessage,
    showErrorMessage,
    showWarningMessage,
    showInfoMessage
};
