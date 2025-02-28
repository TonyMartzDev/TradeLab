# Changelog

## [0.1.2] - 2025-02-27

### Added
- Backend Implementation
  - Express server setup with SQLite database
  - RESTful API endpoints for trades:
    - GET /api/trades (all trades)
    - GET /api/trades/recent (last 10 trades)
    - GET /api/trades/:id (single trade)
    - POST /api/trades (create trade)
    - PUT /api/trades/:id (update trade)
    - DELETE /api/trades/:id (delete trade)
  - Database features:
    - SQLite setup with trades table
    - Automatic timestamps for created_at and updated_at
    - Promise-based database operations
  - Development tools:
    - nodemon for auto-reloading
    - morgan for HTTP request logging
    - cors for handling cross-origin requests
  - Error handling middleware
  - Organized project structure with separate routes, controllers, and models

## [0.1.1] - 2025-02-27

### Added
- Recent Trades Table
  - Display of 10 most recent trades
  - Proper formatting for dates, numbers, currency, and percentages
  - Edit and Delete functionality for each trade
  - Error handling for missing or invalid data
- Custom Confirmation Dialog
  - Styled modal for delete confirmations
  - Theme-aware colors and styling
  - Multiple close options (buttons, click-outside)
  - Promise-based implementation for async/await usage
  - Event listener cleanup

### Enhanced
- Form Validation
  - Real-time numeric input validation
  - Visual feedback with success/error states
  - Support for decimal numbers
  - Validation state persistence

## [0.1.0] - 2025-02-27

### Added
- Initial project setup with front-end and back-end structure
  - Front-end folder containing styles, JavaScript, HTML, and assets
  - Empty back-end folder prepared for future development
  - Data templates for Trade, User, and Account data handling
  - Database setup files:
    - IndexedDB implementation
    - SQLite for prototyping
    - Postgres templates for production launch

### Features
- Trade Entry Form
  - Real-time form validation for numeric inputs (entry price, exit price, quantity)
  - Visual feedback with success/error states
  - Validation persists when switching between fields
  - Support for both integer and decimal number inputs

### UI/UX Improvements
- Form Validation Styling
  - Added success state with green border and background (rgba(63, 176, 118, 0.2))
  - Added error state with red border and background (rgba(255, 0, 0, 0.05))
  - Implemented focus states with matching validation colors
  - Added smooth transitions for validation state changes

### Layout & Responsiveness
- Fixed horizontal scrollbar issues
  - Added width:100% to container elements
  - Added overflow-x:hidden to prevent unwanted scrolling
  - Optimized footer grid layout for better responsiveness
  - Adjusted minimum column widths from 250px to 200px

### Data Management
- Added Recent Trades Table
  - Dynamic table generation from trade data
  - Columns for date, symbol, direction, market, prices, quantity, investment, PNL, ROI, and notes
  - Edit and Delete buttons for each trade entry
  - Integration with Trade Manager for data handling

### Technical Improvements
- Implemented proper numeric input validation
  - Regex pattern for validating integers and decimals
  - Empty value handling
  - Immediate feedback on input
  - Validation state persistence
