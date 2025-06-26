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
const updatePricesBtn = document.getElementById('update-prices');

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

// Settings logic
const settingsBtn = document.getElementById('settings-btn');
const settingsModalOverlay = document.getElementById('settings-modal-overlay');
const settingsModal = document.getElementById('settings-modal');
const currencySelect = document.getElementById('currency-select');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const cancelSettingsBtn = document.getElementById('cancel-settings-btn');

let currency = 'EUR';
const currencySymbols = {
    'EUR': '€',
    'USD': '$',
    'JPY': '¥',
    'GBP': '£'
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    // Hide all tab panels except the active one
    document.querySelectorAll('.tab-panel').forEach(panel => {
        if (!panel.classList.contains('active')) {
            panel.style.display = 'none';
        } else {
            panel.style.display = '';
        }
    });
    await loadCart();
    await loadCurrency();
    if (!currency) {
        currency = 'EUR';
        if (currencySelect) currencySelect.value = currency;
        await chrome.storage.local.set({ currency });
    }
    setupEventListeners();
    updateAllFolderSelects();
    console.log('Before updateCartDisplay:', { cart, currency });
    updateCartDisplay();
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
    updatePricesBtn.addEventListener('click', updateAllPrices);

    // Folders Tab Logic
    addFolderFab.addEventListener('click', () => {
        showFolderModal('add');
    });

    // Settings logic
    settingsBtn.addEventListener('click', () => {
        settingsModalOverlay.style.display = 'flex';
        currencySelect.value = currency;
    });

    cancelSettingsBtn.addEventListener('click', () => {
        settingsModalOverlay.style.display = 'none';
    });

    saveSettingsBtn.addEventListener('click', async () => {
        currency = currencySelect.value;
        await chrome.storage.local.set({ currency });
        updateCartDisplay();
        settingsModalOverlay.style.display = 'none';
        showNotification('Settings saved!', 'success');
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
        if (panel.id === `${tabName}-tab`) {
            panel.classList.add('active');
            panel.style.display = '';
        } else {
            panel.classList.remove('active');
            panel.style.display = 'none';
        }
    });
    // Hide quick add button in folders tab
    if (tabName === 'folders') {
        quickAddBtn.style.display = 'none';
    } else {
        quickAddBtn.style.display = '';
    }
    if (tabName === 'folders') {
        renderFoldersGrid();
    }
    // Reload cart from storage when switching to Cart tab
    if (tabName === 'cart') {
        loadCart().then(updateCartDisplay);
    }
}

// Load cart, folders, and currency from storage
async function loadCart() {
    try {
        const result = await chrome.storage.local.get(['cart', 'folders', 'currency']);
        cart = result.cart || [];
        if (Array.isArray(result.folders) && result.folders.length > 0 && typeof result.folders[0] === 'object') {
            folders = result.folders;
        } else {
            folders = (result.folders || ['Uncategorized']).map(name => ({ name, color: getDefaultFolderColor() }));
        }
        if (!folders.some(f => f.name === 'Uncategorized')) {
            folders.unshift({ name: 'Uncategorized', color: '#e9ecef' });
        }
        cart.forEach(item => {
            if (!item.folder) item.folder = 'Uncategorized';
        });
        if (result.currency) {
            currency = result.currency;
            if (currencySelect) currencySelect.value = currency;
        }
        console.log('Loaded from storage:', { cart, folders, currency });
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
        folders = [{ name: 'Uncategorized', color: '#e9ecef' }];
    }
}

// Save cart, folders, and currency to storage
async function saveCart() {
    try {
        await chrome.storage.local.set({ cart, folders, currency });
        console.log('Saved to storage:', { cart, folders, currency });
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
                notes: '',
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
let collapsedFolders = {};
function updateCartDisplay() {
    console.log('Rendering cart:', { cart, currency });
    let html = '';
    let filteredCart = cart;
    if (folderFilter) {
        filteredCart = cart.filter(item => item.folder === folderFilter);
    }
    if (filteredCart.length === 0) {
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
        // Always group by folder, center folder name, and add collapse/expand
        const grouped = {};
        filteredCart.forEach(item => {
            const folder = item.folder || 'Uncategorized';
            if (!grouped[folder]) grouped[folder] = [];
            grouped[folder].push(item);
        });
        Object.keys(grouped).forEach(folder => {
            const isCollapsed = collapsedFolders[folder];
            html += `<div class="cart-group">
                <div class="cart-group-header" style="text-align:center; margin: 18px 0 8px 0; cursor:pointer; font-size:18px; font-weight:600;">${escapeHtml(folder)}</div>
                <div class="cart-group-items" data-folder-items="${folder}" style="overflow:hidden; transition:max-height 0.35s cubic-bezier(.4,0,.2,1), opacity 0.35s cubic-bezier(.4,0,.2,1); max-height:${isCollapsed ? '0' : '1000px'}; opacity:${isCollapsed ? '0' : '1'};">
                    ${grouped[folder].map(item => renderCartItem(item)).join('')}
                </div>
            </div>`;
        });
    }
    cartItemsContainer.innerHTML = html;
    // Add clear filter button if filtering
    if (folderFilter) {
        const clearBtn = document.createElement('button');
        clearBtn.className = 'btn btn-secondary';
        clearBtn.textContent = 'Show All Folders';
        clearBtn.onclick = () => {
            folderFilter = null;
            console.log('Clear filter, before updateCartDisplay:', { cart, currency });
            updateCartDisplay();
        };
        cartItemsContainer.prepend(clearBtn);
    }
    // Attach collapse/expand listeners (on folder name)
    cartItemsContainer.querySelectorAll('.cart-group-header').forEach(header => {
        header.addEventListener('click', e => {
            const folder = header.textContent;
            collapsedFolders[folder] = !collapsedFolders[folder];
            console.log('Collapse/expand, before updateCartDisplay:', { cart, currency });
            updateCartDisplay();
        });
    });
    // Update summary
    const totalItems = filteredCart.length;
    const totalPrice = filteredCart.reduce((sum, item) => sum + item.price, 0);
    itemCountElement.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
    totalPriceElement.textContent = `${totalPrice.toFixed(2)} ${currencySymbols[currency] || '€'}`;

    // Attach remove button event listeners (event delegation)
    cartItemsContainer.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = btn.getAttribute('data-id');
            cart = cart.filter(item => item.id !== itemId);
            saveCart();
            console.log('Remove item, before updateCartDisplay:', { cart, currency });
            updateCartDisplay();
            showNotification('Item removed from cart!', 'info');
        });
    });

    // Attach edit button event listeners
    cartItemsContainer.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = btn.getAttribute('data-id');
            const item = cart.find(i => i.id === itemId);
            if (item) showEditModal(item);
        });
    });
}

function renderCartItem(item) {
    return `
        <div class="cart-item" data-id="${item.id}">
            <div class="item-info">
                <div class="item-name">${escapeHtml(item.name)}</div>
                <div class="item-price">${item.price.toFixed(2)} ${currencySymbols[currency] || '€'}</div>
                ${item.url ? `<a href="${item.url}" target="_blank" class="item-url">${new URL(item.url).hostname}</a>` : ''}
                ${item.notes ? `<div class="item-notes">${escapeHtml(item.notes)}</div>` : ''}
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary edit-btn" data-id="${item.id}">Edit</button>
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
        // Double-click to filter
        card.addEventListener('dblclick', () => {
            folderFilter = folder.name;
            switchTab('cart');
            updateCartDisplay();
        });
        foldersGrid.appendChild(card);
    });
    // Render the add-folder FAB as the last card in the grid
    const fab = document.createElement('button');
    fab.id = 'add-folder-fab';
    fab.className = 'fab';
    fab.type = 'button';
    fab.textContent = 'Create a Folder';
    fab.onclick = () => showFolderModal('add');
    foldersGrid.appendChild(fab);
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

// Load currency from storage and update UI
async function loadCurrency() {
    const result = await chrome.storage.local.get(['currency']);
    if (result.currency) {
        currency = result.currency;
        if (currencySelect) currencySelect.value = currency;
    } else {
        currency = 'EUR';
        if (currencySelect) currencySelect.value = currency;
        await chrome.storage.local.set({ currency });
    }
    console.log('Loaded currency:', currency);
}

async function updateAllPrices() {
    if (cart.length === 0) {
        showNotification('Cart is empty!', 'info');
        return;
    }
    showNotification('Updating prices...', 'info');
    let updatedCount = 0;
    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        if (!item.url) continue;
        let tab = null;
        try {
            // Open the product page in a new background tab
            tab = await new Promise((resolve, reject) => {
                chrome.tabs.create({ url: item.url, active: false }, resolve);
            });
            // Wait a short, fixed delay (2 seconds)
            await new Promise(res => setTimeout(res, 2000));
            // Try to extract price
            let response = null;
            try {
                response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProductInfo' });
            } catch (err) {
                // Ignore extraction errors
            }
            if (response && response.success && response.price > 0) {
                item.price = response.price;
                updatedCount++;
            }
        } catch (err) {
            // If any error, skip this item
            console.error('Error updating price for', item.name, err);
        } finally {
            // Always close the tab if it was opened
            if (tab && tab.id) {
                chrome.tabs.remove(tab.id);
            }
        }
    }
    await saveCart();
    updateCartDisplay();
    if (updatedCount > 0) {
        showNotification(`Prices updated for ${updatedCount} item${updatedCount !== 1 ? 's' : ''}!`, 'success');
    } else {
        showNotification('No prices were updated.', 'info');
    }
}

// Add edit modal logic
let editModalOverlay = null;
let editModal = null;
function ensureEditModal() {
    if (!editModalOverlay) {
        editModalOverlay = document.createElement('div');
        editModalOverlay.className = 'modal-overlay';
        editModalOverlay.style.display = 'none';
        editModalOverlay.id = 'edit-modal-overlay';
        editModal = document.createElement('div');
        editModal.className = 'modal';
        editModal.id = 'edit-modal';
        editModalOverlay.appendChild(editModal);
        document.body.appendChild(editModalOverlay);
    }
}
function showEditModal(item) {
    ensureEditModal();
    editModal.innerHTML = `
        <h2>Edit Item</h2>
        <div class="form-group">
            <label for="edit-item-name">Name</label>
            <input type="text" id="edit-item-name" value="${escapeHtml(item.name)}" required>
        </div>
        <div class="form-group">
            <label for="edit-item-price">Price</label>
            <input type="number" id="edit-item-price" step="0.01" min="0" value="${item.price}" required>
        </div>
        <div class="form-group">
            <label for="edit-item-url">Website URL</label>
            <input type="url" id="edit-item-url" value="${item.url || ''}" placeholder="https://...">
        </div>
        <div class="form-group">
            <label for="edit-item-notes">Notes</label>
            <textarea id="edit-item-notes" rows="2">${escapeHtml(item.notes || '')}</textarea>
            <button type="button" class="btn btn-secondary" id="clear-notes-btn">Clear Notes</button>
        </div>
        <div class="form-group">
            <label for="edit-item-folder">Folder</label>
            <select id="edit-item-folder" class="form-select"></select>
        </div>
        <div class="modal-actions">
            <button class="btn btn-primary" id="save-edit-btn">Save</button>
            <button class="btn btn-secondary" id="cancel-edit-btn">Cancel</button>
        </div>
    `;
    // Populate folder select
    const folderSelect = editModal.querySelector('#edit-item-folder');
    folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.name;
        option.textContent = folder.name;
        if (item.folder === folder.name) option.selected = true;
        folderSelect.appendChild(option);
    });
    // Clear notes button
    editModal.querySelector('#clear-notes-btn').onclick = () => {
        editModal.querySelector('#edit-item-notes').value = '';
    };
    // Cancel button
    editModal.querySelector('#cancel-edit-btn').onclick = () => {
        editModalOverlay.style.display = 'none';
    };
    // Save button
    editModal.querySelector('#save-edit-btn').onclick = () => {
        const newName = editModal.querySelector('#edit-item-name').value.trim();
        const newPrice = parseFloat(editModal.querySelector('#edit-item-price').value);
        const newUrl = editModal.querySelector('#edit-item-url').value.trim();
        const newNotes = editModal.querySelector('#edit-item-notes').value;
        const newFolder = editModal.querySelector('#edit-item-folder').value;
        if (!newName || isNaN(newPrice)) {
            showNotification('Name and price are required!', 'error');
            return;
        }
        item.name = newName;
        item.price = newPrice;
        item.url = newUrl;
        item.notes = newNotes;
        item.folder = newFolder;
        saveCart();
        updateCartDisplay();
        editModalOverlay.style.display = 'none';
        showNotification('Item updated!', 'success');
    };
    editModalOverlay.style.display = 'flex';
}

// Add folder filtering feature
let folderFilter = null;
function updateCartDisplay() {
    console.log('Rendering cart:', { cart, currency });
    let html = '';
    let filteredCart = cart;
    if (folderFilter) {
        filteredCart = cart.filter(item => item.folder === folderFilter);
    }
    if (filteredCart.length === 0) {
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
        // Always group by folder, center folder name, and add collapse/expand
        const grouped = {};
        filteredCart.forEach(item => {
            const folder = item.folder || 'Uncategorized';
            if (!grouped[folder]) grouped[folder] = [];
            grouped[folder].push(item);
        });
        Object.keys(grouped).forEach(folder => {
            const isCollapsed = collapsedFolders[folder];
            html += `<div class="cart-group">
                <div class="cart-group-header" style="text-align:center; margin: 18px 0 8px 0; cursor:pointer; font-size:18px; font-weight:600;">${escapeHtml(folder)}</div>
                <div class="cart-group-items" data-folder-items="${folder}" style="overflow:hidden; transition:max-height 0.35s cubic-bezier(.4,0,.2,1), opacity 0.35s cubic-bezier(.4,0,.2,1); max-height:${isCollapsed ? '0' : '1000px'}; opacity:${isCollapsed ? '0' : '1'};">
                    ${grouped[folder].map(item => renderCartItem(item)).join('')}
                </div>
            </div>`;
        });
    }
    cartItemsContainer.innerHTML = html;
    // Add clear filter button if filtering
    if (folderFilter) {
        const clearBtn = document.createElement('button');
        clearBtn.className = 'btn btn-secondary';
        clearBtn.textContent = 'Show All Folders';
        clearBtn.onclick = () => {
            folderFilter = null;
            console.log('Clear filter, before updateCartDisplay:', { cart, currency });
            updateCartDisplay();
        };
        cartItemsContainer.prepend(clearBtn);
    }
    // Attach collapse/expand listeners (on folder name)
    cartItemsContainer.querySelectorAll('.cart-group-header').forEach(header => {
        header.addEventListener('click', e => {
            const folder = header.textContent;
            collapsedFolders[folder] = !collapsedFolders[folder];
            console.log('Collapse/expand, before updateCartDisplay:', { cart, currency });
            updateCartDisplay();
        });
    });
    // Update summary
    const totalItems = filteredCart.length;
    const totalPrice = filteredCart.reduce((sum, item) => sum + item.price, 0);
    itemCountElement.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
    totalPriceElement.textContent = `${totalPrice.toFixed(2)} ${currencySymbols[currency] || '€'}`;

    // Attach remove button event listeners (event delegation)
    cartItemsContainer.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = btn.getAttribute('data-id');
            cart = cart.filter(item => item.id !== itemId);
            saveCart();
            console.log('Remove item, before updateCartDisplay:', { cart, currency });
            updateCartDisplay();
            showNotification('Item removed from cart!', 'info');
        });
    });

    // Attach edit button event listeners
    cartItemsContainer.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = btn.getAttribute('data-id');
            const item = cart.find(i => i.id === itemId);
            if (item) showEditModal(item);
        });
    });
} 