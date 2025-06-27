# Cryon Cart – Universal Shopping Cart Extension

A modern, privacy-first Chrome extension by Cryon.ai for managing your shopping cart across any website. Organize items into folders, track prices, and enjoy a sleek, futuristic UI—all with your data stored locally.

---

## Features

- **Universal Cart**: Add products from any website to a single, centralized cart.
- **Smart Extraction**: Automatically extract product name and price from most e-commerce pages.
- **Manual Add/Edit**: Add or edit items with custom details (name, price, URL, notes, folder).
- **Folders**: Organize your cart with custom folders (create, rename, delete, move items).
- **Collapsible Groups**: Cart items are grouped by folder, with smooth expand/collapse.
- **Price Tracking (User-Driven)**: Update prices for all items by opening product pages in background tabs and extracting the latest price.
- **Export Cart**: Download your cart as a JSON file for backup or sharing (from the Settings menu).
- **Currency Selection**: Choose your preferred currency (EUR, USD, JPY, GBP) in Settings.
- **Modern UI**: Sleek, dark, and vibrant design with smooth transitions and notifications.
- **Local Privacy**: All data is stored locally in your browser—nothing is sent to external servers.

---

## Installation

1. **Download or Clone** this repository to your computer.
2. **Open Chrome** and go to `chrome://extensions/`.
3. **Enable Developer Mode** (toggle in the top right).
4. **Click "Load unpacked"** and select the folder containing this extension.
5. **Pin Cryon Cart** to your toolbar for easy access.

---

## Usage

### Adding Items
- **Quick Add**: On any product page, click the extension icon and use "Quick Add from Page" to extract product info.
- **Manual Add**: Use the "Add Item" tab to enter details manually.
- **Context Menu**: Right-click a page and select "Add to Universal Cart" (if enabled).

### Organizing with Folders
- Go to the **Folders** tab.
- Create, rename, or delete folders with the "+" button and context menu.
- Double-click a folder to filter the cart by that folder.
- Items can be assigned to folders when adding or editing.

### Cart Management
- View all items in the **Cart** tab, grouped by folder.
- Expand/collapse folder groups for a clean view.
- Edit or remove items with the respective buttons.
- Clear the entire cart with one click.

### Price Tracking
- Click **Update Prices** in the cart to re-extract prices for all items (opens product pages in background tabs).
- **Note:** Due to browser security, price updates only work for pages that allow content script injection and may not work for all sites.

### Exporting & Settings
- Open the **Settings** menu (cogwheel icon).
- Change your preferred currency.
- Export your cart as a JSON file.

---

## Limitations & Privacy
- **No background scraping:** Chrome extensions cannot scrape prices in the background without opening tabs (due to browser security and CORS).
- **No server-side tracking:** All data stays on your device. No external servers, no tracking.
- **Works best on standard e-commerce sites:** Some custom or highly dynamic sites may not be fully supported for auto-extraction.

---

## Brand & Credits
**Cryon Cart** is a product of [Cryon.ai](https://cryon.ai), designed for a modern, privacy-conscious web.

---

## File Structure
```
pac/
  background.js         # Service worker for storage and context menu
  content.js            # Content script for extracting product info
  content.css           # Content script styles
  popup.html            # Main popup UI
  popup.js              # Popup logic and UI
  popup.css             # Popup styles (modern, dark, vibrant)
  manifest.json         # Chrome extension manifest
  icons/                # Extension icons
  README.md             # This file
```

---

## Support & Feedback
- For issues, feature requests, or contributions, please open an issue or PR on the repository.
- For more about Cryon.ai, visit [cryon.ai](https://cryon.ai). 