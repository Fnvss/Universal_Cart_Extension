// Content script for Universal Shopping Cart

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractProductInfo') {
        const productInfo = extractProductInfo();
        sendResponse(productInfo);
    }
});

// Extract product information from the current page
function extractProductInfo() {
    const info = {
        success: false,
        name: '',
        price: 0,
        notes: ''
    };

    try {
        // Try to find product name
        info.name = findProductName();
        
        // Try to find product price
        info.price = findProductPrice();
        
        // Try to find additional notes/description
        info.notes = findProductNotes();
        
        // Mark as successful if we found at least a name
        if (info.name) {
            info.success = true;
        }
        
    } catch (error) {
        console.error('Error extracting product info:', error);
    }

    return info;
}

// Find product name using various selectors
function findProductName() {
    const selectors = [
        'h1[class*="product"]',
        'h1[class*="title"]',
        'h1[class*="name"]',
        '.product-title',
        '.product-name',
        '.item-title',
        '.item-name',
        'h1',
        '.title',
        '.name',
        'meta[property="og:title"]',
        'meta[name="twitter:title"]'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            let text = '';
            if (element.tagName === 'META') {
                text = element.getAttribute('content');
            } else {
                text = element.textContent.trim();
            }
            if (text && text.length > 0 && text.length < 200) {
                return text;
            }
        }
    }

    return '';
}

// Find product price using various selectors
function findProductPrice() {
    const selectors = [
        '[class*="price"]',
        '[class*="Price"]',
        '.price',
        '.Price',
        '.product-price',
        '.item-price',
        '[data-testid*="price"]',
        '[class*="currency"]',
        '.currency'
    ];

    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const text = element.textContent.trim();
            const price = extractPriceFromText(text);
            if (price > 0) {
                return price;
            }
        }
    }

    return 0;
}

// Extract price from text
function extractPriceFromText(text) {
    const cleanText = text.replace(/price|cost|total|amount/gi, '').trim();
    
    const patterns = [
        /\$[\d,]+\.?\d*/g,
        /€[\d,]+\.?\d*/g,
        /£[\d,]+\.?\d*/g,
        /[\d,]+\.?\d*\s*(dollars?|euros?|pounds?)/gi,
        /[\d,]+\.?\d*/g
    ];

    for (const pattern of patterns) {
        const matches = cleanText.match(pattern);
        if (matches) {
            for (const match of matches) {
                const num = parseFloat(match.replace(/[$,€£]/g, ''));
                if (!isNaN(num) && num > 0 && num < 1000000) {
                    return num;
                }
            }
        }
    }

    return 0;
}

// Find product notes/description
function findProductNotes() {
    const selectors = [
        '.product-description',
        '.item-description',
        '.description',
        '.summary',
        '.details',
        '[class*="description"]',
        '[class*="summary"]',
        'meta[name="description"]',
        'meta[property="og:description"]'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            let text = '';
            if (element.tagName === 'META') {
                text = element.getAttribute('content');
            } else {
                text = element.textContent.trim();
            }
            if (text && text.length > 0 && text.length < 500) {
                return text.substring(0, 200) + (text.length > 200 ? '...' : '');
            }
        }
    }

    return '';
} 