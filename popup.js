// Cart management
let cart = [];

// DOM elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const cartItemsContainer = document.getElementById('cart-items');
const itemCountElement = document.getElementById('item-count');
const totalPriceElement = document.getElementById('total-price');
const addItemForm = document.getElementById('add-item-form');
const clearCartBtn = document.getElementById('clear-cart');
const exportCartBtn = document.getElementById('export-cart');
const quickAddBtn = document.getElementById('quick-add-btn');

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    setupEventListeners();
    updateCartDisplay();
});

// Event listeners setup
function setupEventListeners() {
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
        });
    });

    // Add item form
    addItemForm.addEventListener('submit', handleAddItem);

    // Cart actions
    clearCartBtn.addEventListener('click', clearCart);
    exportCartBtn.addEventListener('click', exportCart);
    quickAddBtn.addEventListener('click', quickAddFromPage);
}

// Tab switching
function switchTab(tabName) {
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    tabPanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === `${tabName}-tab`) {
            panel.classList.add('active');
        }
    });
}

// Load cart from storage
async function loadCart() {
    try {
        const result = await chrome.storage.local.get(['cart']);
        cart = result.cart || [];
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
    }
}

// Save cart to storage
async function saveCart() {
    try {
        await chrome.storage.local.set({ cart });
    } catch (error) {
        console.error('Error saving cart:', error);
    }
}

// Add item to cart
function handleAddItem(e) {
    e.preventDefault();
    
    const item = {
        id: Date.now().toString(),
        name: document.getElementById('item-name').value,
        price: parseFloat(document.getElementById('item-price').value),
        url: document.getElementById('item-url').value,
        notes: document.getElementById('item-notes').value,
        addedAt: new Date().toISOString(),
        source: 'manual'
    };

    cart.push(item);
    saveCart();
    updateCartDisplay();
    addItemForm.reset();
    
    // Switch back to cart tab
    switchTab('cart');
    
    // Show success message
    showNotification('Item added to cart!', 'success');
}

// Remove item from cart
function removeItem(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartDisplay();
    showNotification('Item removed from cart!', 'info');
}

// Clear entire cart
function clearCart() {
    if (cart.length === 0) {
        showNotification('Cart is already empty!', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to clear your entire cart?')) {
        cart = [];
        saveCart();
        updateCartDisplay();
        showNotification('Cart cleared!', 'success');
    }
}

// Export cart
function exportCart() {
    if (cart.length === 0) {
        showNotification('Cart is empty!', 'info');
        return;
    }

    const exportData = {
        items: cart,
        totalItems: cart.length,
        totalPrice: cart.reduce((sum, item) => sum + item.price, 0),
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopping-cart-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('Cart exported successfully!', 'success');
}

// Quick add from current page
async function quickAddFromPage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProductInfo' });
        
        if (response && response.success) {
            const item = {
                id: Date.now().toString(),
                name: response.name || 'Unknown Product',
                price: response.price || 0,
                url: tab.url,
                notes: response.notes || '',
                addedAt: new Date().toISOString(),
                source: 'page-extraction'
            };

            cart.push(item);
            saveCart();
            updateCartDisplay();
            switchTab('cart');
            showNotification('Item added from page!', 'success');
        } else {
            showNotification('Could not extract product info from this page', 'error');
        }
    } catch (error) {
        console.error('Error in quick add:', error);
        showNotification('Error adding item from page', 'error');
    }
}

// Update cart display
function updateCartDisplay() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
                <p>Your cart is empty</p>
                <p>Add items from any website to get started!</p>
            </div>
        `;
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="item-info">
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div class="item-price">$${item.price.toFixed(2)}</div>
                    ${item.url ? `<a href="${item.url}" target="_blank" class="item-url">${new URL(item.url).hostname}</a>` : ''}
                    ${item.notes ? `<div class="item-notes">${escapeHtml(item.notes)}</div>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn btn-danger" onclick="removeItem('${item.id}')">Remove</button>
                </div>
            </div>
        `).join('');
    }

    // Update summary
    const totalItems = cart.length;
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
    
    itemCountElement.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
    totalPriceElement.textContent = `$${totalPrice.toFixed(2)}`;
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8',
        warning: '#ffc107'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style); 