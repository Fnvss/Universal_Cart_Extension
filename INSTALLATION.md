# Installation Guide - Universal Shopping Cart Extension

## Prerequisites

- Google Chrome browser (version 88 or later)
- Basic knowledge of using Chrome extensions

## Step-by-Step Installation

### Step 1: Prepare the Extension Files

1. **Download or Clone** this repository to your computer
2. **Navigate** to the extension folder in your file explorer
3. **Verify** you have all the required files:
   - `manifest.json`
   - `popup.html`
   - `popup.css`
   - `popup.js`
   - `content.js`
   - `content.css`
   - `background.js`
   - `README.md`

### Step 2: Create Extension Icons

**Option A: Use the Icon Generator**
1. Open `icons/create_icons.html` in your web browser
2. Click the download buttons for each icon size
3. Save the downloaded files as:
   - `icons/icon16.png`
   - `icons/icon48.png`
   - `icons/icon128.png`

**Option B: Create Your Own Icons**
1. Create three PNG images with sizes 16x16, 48x48, and 128x128 pixels
2. Save them in the `icons/` folder with the names above
3. Use any image editor (GIMP, Photoshop, or online tools)

**Option C: Use Simple Placeholder Icons**
1. Create simple colored squares or use shopping cart emojis
2. Convert them to PNG format at the required sizes
3. Save in the `icons/` folder

### Step 3: Load the Extension in Chrome

1. **Open Chrome** and navigate to `chrome://extensions/`
2. **Enable Developer Mode**:
   - Look for the toggle switch in the top-right corner
   - Click it to turn on Developer Mode
3. **Load the Extension**:
   - Click the "Load unpacked" button
   - Select the folder containing your extension files
   - Click "Select Folder"
4. **Verify Installation**:
   - You should see "Universal Shopping Cart" in the extensions list
   - The extension should show as "Enabled"

### Step 4: Pin the Extension (Optional but Recommended)

1. **Find the Extension Icon**:
   - Look for the extension icon in your Chrome toolbar
   - If you don't see it, click the puzzle piece icon (extensions menu)
2. **Pin the Extension**:
   - Click the pin icon next to "Universal Shopping Cart"
   - The extension icon will now always be visible in your toolbar

## Testing the Installation

### Test 1: Basic Functionality
1. Click the extension icon in your toolbar
2. You should see the popup with "Cart" and "Add Item" tabs
3. The cart should be empty initially

### Test 2: Manual Item Addition
1. Click the extension icon
2. Go to the "Add Item" tab
3. Fill in the form with test data:
   - Name: "Test Item"
   - Price: "10.99"
   - URL: "https://example.com"
   - Notes: "Test notes"
4. Click "Add to Cart"
5. Switch to the "Cart" tab to see your item

### Test 3: Quick Add from Page
1. Navigate to any product page (Amazon, eBay, etc.)
2. Click the extension icon
3. Click "Quick Add from Page"
4. Check if the item was added to your cart

## Troubleshooting

### Extension Won't Load
- **Check file structure**: Ensure all files are in the correct location
- **Check manifest.json**: Verify the JSON syntax is valid
- **Check console errors**: Open Developer Tools and look for error messages

### Icons Not Showing
- **Verify icon files**: Make sure all three icon files exist in the `icons/` folder
- **Check file names**: Ensure they're named exactly `icon16.png`, `icon48.png`, `icon128.png`
- **Check file format**: Make sure they're actual PNG files, not renamed files

### Extension Not Working
- **Reload the extension**: Go to `chrome://extensions/` and click the reload button
- **Check permissions**: Ensure the extension has the necessary permissions
- **Clear browser cache**: Try clearing Chrome's cache and cookies

### Product Detection Issues
- **Test on different sites**: Try various e-commerce websites
- **Use manual addition**: If automatic detection fails, use the manual form
- **Check console**: Look for any JavaScript errors in the browser console

## Updating the Extension

When you make changes to the extension files:

1. Go to `chrome://extensions/`
2. Find "Universal Shopping Cart" in the list
3. Click the reload button (🔄) next to the extension
4. The changes will be applied immediately

## Uninstalling the Extension

1. Go to `chrome://extensions/`
2. Find "Universal Shopping Cart" in the list
3. Click "Remove" to uninstall the extension
4. Note: This will delete all stored cart data

## Getting Help

If you encounter issues:

1. **Check the README.md** file for detailed information
2. **Review the console logs** for error messages
3. **Test on different websites** to see if the issue is site-specific
4. **Try reinstalling** the extension if problems persist

## Security Note

This extension:
- Stores all data locally on your device
- Does not send any information to external servers
- Only accesses web pages when you explicitly use it
- Requires minimal permissions for basic functionality 