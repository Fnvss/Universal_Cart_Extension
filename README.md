# Universal Shopping Cart Chrome Extension

A Chrome extension that helps you manage your shopping cart across different websites. Add items from any website to a centralized cart and view/manage them all in one place.

## Features

- **Universal Cart Management**: Add items from any website to a single, centralized cart
- **Smart Product Detection**: Automatically extracts product names, prices, and descriptions from web pages
- **Manual Item Addition**: Add items manually with custom details
- **Cart Export**: Export your cart as a JSON file for backup or sharing
- **Floating Add Button**: Quick add button appears on product pages
- **Persistent Storage**: Your cart is saved locally and persists between browser sessions
- **Modern UI**: Clean, modern interface with smooth animations

## Installation

### Method 1: Load as Unpacked Extension (Development)

1. **Download or Clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top right corner
4. **Click "Load unpacked"** and select the folder containing this extension
5. **Pin the extension** to your toolbar for easy access

### Method 2: Create Icons (Required)

Before loading the extension, you need to create icon files. You can use any image editor or online tool to create:

- `icons/icon16.png` (16x16 pixels)
- `icons/icon48.png` (48x48 pixels)  
- `icons/icon128.png` (128x128 pixels)

Or use a simple shopping cart emoji converted to PNG format.

## Usage

### Adding Items to Cart

#### Method 1: Quick Add from Page
1. Navigate to any product page
2. Click the extension icon in your toolbar
3. Click "Quick Add from Page" button
4. The extension will automatically extract product information and add it to your cart

#### Method 2: Manual Addition
1. Click the extension icon
2. Go to the "Add Item" tab
3. Fill in the product details:
   - Item Name (required)
   - Price (required)
   - Website URL (optional)
   - Notes (optional)
4. Click "Add to Cart"

#### Method 3: Right-Click Context Menu
1. Right-click on any page
2. Select "Add to Universal Cart" from the context menu

### Managing Your Cart

- **View Items**: Click the extension icon to see all items in your cart
- **Remove Items**: Click the "Remove" button next to any item
- **Clear Cart**: Click "Clear Cart" to remove all items
- **Export Cart**: Click "Export List" to download your cart as a JSON file

### Cart Information

Each cart item includes:
- Product name
- Price
- Source website URL
- Notes/description
- Date added
- Source method (manual, page extraction, or context menu)

## File Structure

```
universal-shopping-cart/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── content.js            # Content script for page interaction
├── content.css           # Content script styling
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Technical Details

### Permissions Used

- `activeTab`: Access to the currently active tab
- `storage`: Store cart data locally
- `tabs`: Access tab information
- `contextMenus`: Add right-click context menu option

### Data Storage

- Cart data is stored locally using Chrome's `chrome.storage.local` API
- Data persists between browser sessions
- No data is sent to external servers

### Product Detection

The extension uses various CSS selectors to detect product information:
- Product names: `h1`, `.product-title`, `.item-name`, etc.
- Prices: `.price`, `[class*="price"]`, currency patterns
- Descriptions: `.description`, `.product-description`, meta tags

## Troubleshooting

### Extension Not Working
1. Make sure Developer Mode is enabled in Chrome extensions
2. Check the browser console for any error messages
3. Try reloading the extension

### Product Detection Issues
- Some websites may use custom structures that the extension can't detect
- Use the manual addition method for such cases
- The extension works best with standard e-commerce sites

### Cart Not Saving
- Check if you have sufficient storage space
- Try clearing browser cache and cookies
- Ensure the extension has the necessary permissions

## Privacy

- All data is stored locally on your device
- No information is transmitted to external servers
- The extension only accesses web pages when you explicitly use it

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension.

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have questions, please create an issue in the repository or contact the developer. 