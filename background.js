// Background service worker for Universal Shopping Cart

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Initialize storage with empty cart
        chrome.storage.local.set({ cart: [] });
        console.log('Universal Shopping Cart extension installed');
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Universal Shopping Cart extension started');
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getCart') {
        chrome.storage.local.get(['cart'], (result) => {
            sendResponse({ cart: result.cart || [] });
        });
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'addToCart') {
        chrome.storage.local.get(['cart'], (result) => {
            const cart = result.cart || [];
            cart.push(request.item);
            chrome.storage.local.set({ cart }, () => {
                sendResponse({ success: true });
            });
        });
        return true;
    }
    
    if (request.action === 'removeFromCart') {
        chrome.storage.local.get(['cart'], (result) => {
            const cart = result.cart || [];
            const updatedCart = cart.filter(item => item.id !== request.itemId);
            chrome.storage.local.set({ cart: updatedCart }, () => {
                sendResponse({ success: true });
            });
        });
        return true;
    }
    
    if (request.action === 'clearCart') {
        chrome.storage.local.set({ cart: [] }, () => {
            sendResponse({ success: true });
        });
        return true;
    }
});

// Handle browser action click (extension icon)
chrome.action.onClicked.addListener((tab) => {
    // This will open the popup automatically due to manifest configuration
    console.log('Extension icon clicked');
});

// Optional: Add context menu for quick access
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'addToUniversalCart',
        title: 'Add to Universal Cart',
        contexts: ['page', 'selection']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'addToUniversalCart') {
        // Send message to content script to extract product info
        chrome.tabs.sendMessage(tab.id, { action: 'extractProductInfo' }, (response) => {
            if (response && response.success) {
                // Add to cart
                chrome.storage.local.get(['cart'], (result) => {
                    const cart = result.cart || [];
                    const item = {
                        id: Date.now().toString(),
                        name: response.name,
                        price: response.price,
                        url: tab.url,
                        notes: response.notes,
                        addedAt: new Date().toISOString(),
                        source: 'context-menu'
                    };
                    cart.push(item);
                    chrome.storage.local.set({ cart });
                });
            }
        });
    }
}); 