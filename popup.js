// Cart management
let cart = [];

// Folders management
let folders = [];
let groupingMode = 'folder'; // 'folder' or 'retailer'

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

// Add after DOM elements
const folderSelect = document.createElement('select');
folderSelect.id = 'item-folder';
folderSelect.className = 'form-select';

// Add grouping toggle UI
const groupingToggle = document.createElement('div');
groupingToggle.className = 'grouping-toggle';
groupingToggle.innerHTML = `
    <label><input type="radio" name="grouping" value="folder" checked> Group by Folder</label>
    <label><input type="radio" name="grouping" value="retailer"> Group by Retailer</label>
`;

// Add after DOM elements
const globalFolderManagement = document.getElementById('global-folder-management');
const cartFolderSelectDiv = document.getElementById('cart-folder-select');
let cartFolderSelect = null;

// Folders Tab Logic
const foldersTab = document.getElementById('folders-tab');
const foldersGrid = document.getElementById('folders-grid');
const addFolderFab = document.getElementById('add-folder-fab');
const folderModalOverlay = document.getElementById('folder-modal-overlay');
const folderModal = document.getElementById('folder-modal');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadCart();
    setupEventListeners();
    updateAllFolderSelects();
    updateCartDisplay();
    setupGroupingToggle();
    renderFoldersGrid();
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

    // Folders Tab Logic
    addFolderFab.addEventListener('click', () => {
        showFolderModal('add');
    });
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

    if (tabName === 'folders') {
        renderFoldersGrid();
    }
}

// Load cart and folders from storage
async function loadCart() {
    try {
        const result = await chrome.storage.local.get(['cart', 'folders']);
        cart = result.cart || [];
        if (Array.isArray(result.folders) && result.folders.length > 0 && typeof result.folders[0] === 'object') {
            folders = result.folders;
        } else {
            // Migrate old string array to object array
            folders = (result.folders || ['Uncategorized']).map(name => ({ name, color: getDefaultFolderColor() }));
        }
        // Ensure 'Uncategorized' always exists
        if (!folders.some(f => f.name === 'Uncategorized')) {
            folders.unshift({ name: 'Uncategorized', color: '#e9ecef' });
        }
        // Ensure all items have a folder
        cart.forEach(item => {
            if (!item.folder) item.folder = 'Uncategorized';
        });
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
        folders = [{ name: 'Uncategorized', color: '#e9ecef' }];
    }
}

// Save cart and folders to storage
async function saveCart() {
    try {
        await chrome.storage.local.set({ cart, folders });
    } catch (error) {
        console.error('Error saving cart:', error);
    }
}

// Add item to cart
function handleAddItem(e) {
    e.preventDefault();
    const folder = addItemFolderSelect?.value || 'Uncategorized';
    const item = {
        id: Date.now().toString(),
        name: document.getElementById('item-name').value,
        price: parseFloat(document.getElementById('item-price').value),
        url: document.getElementById('item-url').value,
        notes: document.getElementById('item-notes').value,
        addedAt: new Date().toISOString(),
        source: 'manual',
        folder
    };
    cart.push(item);
    saveCart();
    updateCartDisplay();
    addItemForm.reset();
    updateAllFolderSelects();
    switchTab('cart');
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
        exportedAt: new Date().toISOString(),
        currency: 'EUR'
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
            const folder = cartFolderSelect?.value || 'Uncategorized';
            const item = {
                id: Date.now().toString(),
                name: response.name || 'Unknown Product',
                price: response.price || 0,
                url: tab.url,
                notes: response.notes || '',
                addedAt: new Date().toISOString(),
                source: 'page-extraction',
                folder
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
    let html = '';
    if (cart.length === 0) {
        html = `
            <div class="empty-cart">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
                <p>Your cart is empty</p>
                <p>Add items from any website to get started!</p>
            </div>
        `;
    } else {
        if (groupingMode === 'folder') {
            // Group by folder
            const grouped = {};
            cart.forEach(item => {
                const folder = item.folder || 'Uncategorized';
                if (!grouped[folder]) grouped[folder] = [];
                grouped[folder].push(item);
            });
            Object.keys(grouped).forEach(folder => {
                html += `<div class="cart-group"><h3>${escapeHtml(folder)}</h3>`;
                html += grouped[folder].map(item => renderCartItem(item)).join('');
                html += '</div>';
            });
        } else if (groupingMode === 'retailer') {
            // Group by retailer (domain)
            const grouped = {};
            cart.forEach(item => {
                let domain = 'Unknown';
                try {
                    if (item.url) domain = new URL(item.url).hostname;
                } catch {}
                if (!grouped[domain]) grouped[domain] = [];
                grouped[domain].push(item);
            });
            Object.keys(grouped).forEach(domain => {
                html += `<div class="cart-group"><h3>${escapeHtml(domain)}</h3>`;
                html += grouped[domain].map(item => renderCartItem(item)).join('');
                html += '</div>';
            });
        }
    }
    cartItemsContainer.innerHTML = html;

    // Update summary
    const totalItems = cart.length;
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
    itemCountElement.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
    totalPriceElement.textContent = `${totalPrice.toFixed(2)} €`;

    // Attach remove button event listeners (event delegation)
    cartItemsContainer.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = btn.getAttribute('data-id');
            cart = cart.filter(item => item.id !== itemId);
            saveCart();
            updateCartDisplay();
            showNotification('Item removed from cart!', 'info');
        });
    });
}

function renderCartItem(item) {
    return `
        <div class="cart-item" data-id="${item.id}">
            <div class="item-info">
                <div class="item-name">${escapeHtml(item.name)}</div>
                <div class="item-price">${item.price.toFixed(2)} €</div>
                ${item.url ? `<a href="${item.url}" target="_blank" class="item-url">${new URL(item.url).hostname}</a>` : ''}
                ${item.notes ? `<div class="item-notes">${escapeHtml(item.notes)}</div>` : ''}
            </div>
            <div class="item-actions">
                <button class="btn btn-danger remove-btn" data-id="${item.id}">Remove</button>
            </div>
        </div>
    `;
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

// Listen for changes in chrome.storage and update cart if needed
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.cart) {
        cart = changes.cart.newValue || [];
        updateCartDisplay();
    }
});

function updateFolderSelect() {
    if (!addItemForm) return;
    let select = document.getElementById('item-folder');
    if (!select) {
        select = folderSelect;
        const group = document.createElement('div');
        group.className = 'form-group';
        group.innerHTML = '<label for="item-folder">Folder</label>';
        group.appendChild(select);
        addItemForm.insertBefore(group, addItemForm.querySelector('button'));
    }
    select.innerHTML = '';
    folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.name;
        option.textContent = folder.name;
        select.appendChild(option);
    });
}

function setupGroupingToggle() {
    const cartTab = document.getElementById('cart-tab');
    if (!cartTab.querySelector('.grouping-toggle')) {
        cartTab.insertBefore(groupingToggle, cartTab.firstChild);
    }
    groupingToggle.querySelectorAll('input[name="grouping"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            groupingMode = e.target.value;
            updateCartDisplay();
        });
    });
}

function renderGlobalFolderManagement() {
    globalFolderManagement.innerHTML = `
        <div class="folder-management-global">
            <select id="manage-folder-select" class="form-select" style="margin-right:5px;"></select>
            <input type="text" id="new-folder-name-global" placeholder="New folder name" class="form-input" style="margin-right:5px;">
            <button type="button" id="add-folder-btn-global" class="btn btn-secondary" style="margin-right:5px;">Add Folder</button>
            <input type="text" id="rename-folder-name" placeholder="Rename to..." class="form-input" style="margin-right:5px;">
            <button type="button" id="rename-folder-btn" class="btn btn-primary" style="margin-right:5px;">Rename</button>
            <button type="button" id="delete-folder-btn" class="btn btn-danger">Delete</button>
        </div>
    `;
    updateManageFolderSelect();
    document.getElementById('add-folder-btn-global').onclick = () => {
        const name = document.getElementById('new-folder-name-global').value.trim();
        if (name && !folders.some(f => f.name === name)) {
            folders.push({ name, color: getDefaultFolderColor() });
            updateFolderSelect();
            updateCartFolderSelect();
            updateManageFolderSelect();
            saveCart();
            document.getElementById('new-folder-name-global').value = '';
            showNotification('Folder added!', 'success');
        }
    };
    document.getElementById('rename-folder-btn').onclick = () => {
        const select = document.getElementById('manage-folder-select');
        const oldName = select.value;
        const newName = document.getElementById('rename-folder-name').value.trim();
        if (!oldName || !newName || oldName === 'Uncategorized' || folders.some(f => f.name === newName)) {
            showNotification('Invalid folder name or folder already exists!', 'error');
            return;
        }
        // Rename folder in folders array
        folders = folders.map(f => (f.name === oldName ? { name: newName, color: f.color } : f));
        // Update all items in cart
        cart.forEach(item => {
            if (item.folder === oldName) item.folder = newName;
        });
        updateFolderSelect();
        updateCartFolderSelect();
        updateManageFolderSelect();
        saveCart();
        updateCartDisplay();
        document.getElementById('rename-folder-name').value = '';
        showNotification('Folder renamed!', 'success');
    };
    document.getElementById('delete-folder-btn').onclick = () => {
        const select = document.getElementById('manage-folder-select');
        const delName = select.value;
        if (!delName || delName === 'Uncategorized') {
            showNotification('Cannot delete this folder!', 'error');
            return;
        }
        // Remove from folders array
        folders = folders.filter(f => f.name !== delName);
        // Move all items in this folder to Uncategorized
        cart.forEach(item => {
            if (item.folder === delName) item.folder = 'Uncategorized';
        });
        updateFolderSelect();
        updateCartFolderSelect();
        updateManageFolderSelect();
        saveCart();
        updateCartDisplay();
        showNotification('Folder deleted! Items moved to Uncategorized.', 'success');
    };
}

function updateManageFolderSelect() {
    const select = document.getElementById('manage-folder-select');
    if (!select) return;
    select.innerHTML = '';
    folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.name;
        option.textContent = folder.name;
        select.appendChild(option);
    });
}

function updateCartFolderSelect() {
    if (!cartFolderSelectDiv) return;
    if (!cartFolderSelect) {
        cartFolderSelect = document.createElement('select');
        cartFolderSelect.id = 'cart-folder-select-dropdown';
        cartFolderSelect.className = 'form-select';
        cartFolderSelectDiv.appendChild(cartFolderSelect);
    }
    cartFolderSelect.innerHTML = '';
    folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.name;
        option.textContent = folder.name;
        option.style.background = folder.color;
        cartFolderSelect.appendChild(option);
    });
}

function renderFoldersGrid() {
    foldersGrid.innerHTML = '';
    folders.forEach(folder => {
        const count = cart.filter(item => item.folder === folder.name).length;
        const card = document.createElement('div');
        card.className = 'folder-card';
        card.textContent = folder.name;
        card.style.borderColor = folder.color;
        card.style.background = folder.color + '22';
        if (folder.name !== 'Uncategorized') {
            card.tabIndex = 0;
        }
        const countSpan = document.createElement('span');
        countSpan.className = 'folder-count';
        countSpan.textContent = `${count} item${count !== 1 ? 's' : ''}`;
        card.appendChild(countSpan);
        // Right-click context menu
        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (folder.name === 'Uncategorized') return;
            showFolderContextMenu(e, folder.name);
        });
        foldersGrid.appendChild(card);
    });
}

function showFolderModal(mode, folderName = '') {
    folderModalOverlay.style.display = 'flex';
    let html = '';
    let color = getDefaultFolderColor();
    if (mode === 'add') {
        html = `
            <h2>Create Folder</h2>
            <input type="text" id="modal-folder-name" placeholder="Folder name" autofocus>
            <input type="color" id="modal-folder-color" value="#${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}">
            <div class="modal-actions">
                <button class="btn btn-primary" id="modal-create-folder">Create</button>
                <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
            </div>
        `;
    } else if (mode === 'rename') {
        const folder = getFolderByName(folderName);
        color = folder.color;
        html = `
            <h2>Rename Folder</h2>
            <input type="text" id="modal-folder-name" value="${folderName}" autofocus>
            <input type="color" id="modal-folder-color" value="${color}">
            <div class="modal-actions">
                <button class="btn btn-primary" id="modal-rename-folder">Rename</button>
                <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
            </div>
        `;
    } else if (mode === 'delete') {
        html = `
            <h2>Delete Folder</h2>
            <p>Are you sure you want to delete <b>${folderName}</b>?<br>All items will be moved to <b>Uncategorized</b>.</p>
            <div class="modal-actions">
                <button class="btn btn-danger" id="modal-delete-folder">Delete</button>
                <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
            </div>
        `;
    }
    folderModal.innerHTML = html;
    document.getElementById('modal-cancel').onclick = closeFolderModal;
    if (mode === 'add') {
        document.getElementById('modal-create-folder').onclick = () => {
            const name = document.getElementById('modal-folder-name').value.trim();
            const color = document.getElementById('modal-folder-color').value;
            if (!name || folders.some(f => f.name === name)) {
                showNotification('Invalid or duplicate folder name!', 'error');
                return;
            }
            folders.push({ name, color });
            saveCart();
            updateAllFolderSelects();
            renderFoldersGrid();
            closeFolderModal();
            showNotification('Folder created!', 'success');
        };
    } else if (mode === 'rename') {
        document.getElementById('modal-rename-folder').onclick = () => {
            const newName = document.getElementById('modal-folder-name').value.trim();
            const newColor = document.getElementById('modal-folder-color').value;
            if (!newName || folders.some(f => f.name === newName && f.name !== folderName)) {
                showNotification('Invalid or duplicate folder name!', 'error');
                return;
            }
            // Rename and recolor in folders and cart
            folders = folders.map(f => f.name === folderName ? { name: newName, color: newColor } : f);
            cart.forEach(item => { if (item.folder === folderName) item.folder = newName; });
            saveCart();
            updateAllFolderSelects();
            renderFoldersGrid();
            updateCartDisplay();
            closeFolderModal();
            showNotification('Folder renamed!', 'success');
        };
    } else if (mode === 'delete') {
        document.getElementById('modal-delete-folder').onclick = () => {
            folders = folders.filter(f => f.name !== folderName);
            cart.forEach(item => { if (item.folder === folderName) item.folder = 'Uncategorized'; });
            saveCart();
            updateAllFolderSelects();
            renderFoldersGrid();
            updateCartDisplay();
            closeFolderModal();
            showNotification('Folder deleted!', 'success');
        };
    }
}

function closeFolderModal() {
    folderModalOverlay.style.display = 'none';
    folderModal.innerHTML = '';
}

// Context menu for folder cards
let folderContextMenu = null;
function showFolderContextMenu(e, folderName) {
    if (folderContextMenu) folderContextMenu.remove();
    folderContextMenu = document.createElement('div');
    folderContextMenu.className = 'folder-context-menu';
    folderContextMenu.style.top = `${e.clientY}px`;
    folderContextMenu.style.left = `${e.clientX}px`;
    folderContextMenu.innerHTML = `
        <button id="context-rename">Rename</button>
        <button id="context-delete">Delete</button>
    `;
    document.body.appendChild(folderContextMenu);
    folderContextMenu.style.display = 'block';
    document.getElementById('context-rename').onclick = () => {
        folderContextMenu.remove();
        showFolderModal('rename', folderName);
    };
    document.getElementById('context-delete').onclick = () => {
        folderContextMenu.remove();
        showFolderModal('delete', folderName);
    };
    // Hide on click elsewhere
    document.addEventListener('click', hideFolderContextMenu, { once: true });
}
function hideFolderContextMenu() {
    if (folderContextMenu) {
        folderContextMenu.remove();
        folderContextMenu = null;
    }
}

// Add Item Folder Select
const addItemFolderSelectDiv = document.getElementById('add-item-folder-select');
let addItemFolderSelect = null;
function updateAddItemFolderSelect() {
    if (!addItemFolderSelectDiv) return;
    if (!addItemFolderSelect) {
        addItemFolderSelect = document.createElement('select');
        addItemFolderSelect.id = 'add-item-folder-select-dropdown';
        addItemFolderSelect.className = 'form-select';
        addItemFolderSelectDiv.appendChild(addItemFolderSelect);
    }
    addItemFolderSelect.innerHTML = '';
    folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.name;
        option.textContent = folder.name;
        option.style.background = folder.color;
        addItemFolderSelect.appendChild(option);
    });
}

// Update all folder selects when folders change
function updateAllFolderSelects() {
    updateFolderSelect();
    updateCartFolderSelect();
    updateAddItemFolderSelect();
}

function getDefaultFolderColor() {
    // Generate a random pastel color
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 85%)`;
}

function getFolderByName(name) {
    return folders.find(f => f.name === name) || { name: 'Uncategorized', color: '#e9ecef' };
} 