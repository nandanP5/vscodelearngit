# ILDO Report Automation

A local server-based web application for automating ILDO report generation from Excel files with automatic data loading.

## Overview

This application uses a Python Flask server to automatically read Excel files from your local directories and generate comprehensive ILDO reports with calculated metrics including delivery percentages, telco type breakdowns, and mix percentages.

## Features

- **Automatic File Loading** - No manual uploads required, server reads files directly
- **Python Flask Server** - Local server with REST API endpoints for data access
- **Multiple sections** - ILDO (active), I to I, and D to D sections
- **Automatic calculations** - Delivery %, mix%, and telco type breakdowns
- **Modern UI** - Clean, responsive interface with branded color scheme
- **Real-time status** - Visual indicators showing file loading progress
- **Latest data auto-detection** - Automatically loads the most recent summary file

## Quick Start

### Prerequisites
- Python 3.x installed on your system
- pip (Python package installer)

### Installation & Usage

1. **First time setup:**
   - Double-click `start_server.bat`
   - This will install dependencies and start the server

2. **Daily usage:**
   - Place new `ILDO_Client_Summary_YYYY-MM-DD.xlsx` in `mis_files` folder
   - Update `ILDO Clients.xlsx` or `ILDO Telcos.xlsx` if needed
   - Double-click `start_server.bat` to start the server
   - Open browser to http://localhost:3000
   - Report generates automatically!

## Required Files

The application requires three Excel files:

1. **ILDO Clients.xlsx** - Contains customer information
   - Expected columns: `smpp_id`, `customer_name` (or similar variations)

2. **ILDO Telcos.xlsx** - Contains telco type mappings
   - Expected columns: `operator_name`, `circle_name`, `telcotype`
   - telcotype values: Yulore, Domestic, or Discounting

3. **ILDO_Client_Summary_<date>.xlsx** - Daily MIS file
   - Expected columns: `incoming_date`, `user_id`, `smpp_id`, `porterid`, `operator_name`, `circle_name`, `Submitted`, `Delivered`, `Failed`, `Awaited`

## Server Endpoints

The Flask server provides these API endpoints:

- `GET /` - Main application page
- `GET /api/clients` - Client data from ILDO Clients.xlsx
- `GET /api/telcos` - Telco data from ILDO Telcos.xlsx  
- `GET /api/summary` - Latest summary file from mis_files folder
- `GET /api/summary/list` - List all available summary files
- `GET /api/summary/<filename>` - Get specific summary file

## How It Works

1. Server starts and scans for Excel files in the project directory
2. Browser application loads from http://localhost:3000
3. JavaScript automatically fetches data from API endpoints
4. Data is processed and report is generated instantly
5. No manual file uploads or data entry required

## Report Columns

The generated report includes:

- **Customer** - Customer name from ILDO Clients.xlsx
- **Submitted** - Total submitted count
- **Delivered** - Total delivered count
- **Del %** - Delivery percentage (Delivered / Submitted × 100)
- **Delivered via Yulore** - Delivered count for Yulore telcotype
- **Delivered via Domestic** - Delivered count for Domestic telcotype
- **Discounting** - Submitted count for Discounting telcotype
- **mix%** - Mix percentage ((Yulore + Domestic + Discounting) / Submitted × 100)

## Calculations

### Delivery Percentage
```
Del % = (Sum of Delivered / Sum of Submitted) × 100
```

### Mix Percentage
```
mix% = (Delivered via Yulore + Delivered via Domestic + Discounting) / Sum of Submitted × 100
```

### Telco Type Filtering
- **Delivered via Yulore**: Sum of Delivered where telcotype = "Yulore"
- **Delivered via Domestic**: Sum of Delivered where telcotype = "Domestic"
- **Discounting**: Sum of Submitted where telcotype = "Discounting"

## Technical Details

- **Backend**: Python 3.x with Flask web framework
- **Excel Processing**: openpyxl library for reading Excel files
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **API**: RESTful endpoints with JSON responses
- **Fonts**: Roboto and Roboto Slab from Google Fonts
- **Browser Support**: Modern browsers (Chrome, Edge, Firefox)

## Dependencies

### Python Packages (installed via requirements.txt)
- `flask` - Web server framework
- `flask-cors` - CORS support for API endpoints
- `openpyxl` - Excel file reading library

## File Structure

```
Raghu Report Automation/
├── index.html          # Main application page
├── styles.css          # Styling and color scheme
├── script.js           # Frontend data processing logic
├── server.py           # Python Flask server (PRIMARY)
├── server.js           # Node.js server (alternative)
├── requirements.txt    # Python dependencies
├── package.json        # Node.js dependencies (if using Node)
├── start_server.bat    # Windows startup script
├── README.md           # This file
├── ILDO Clients.xlsx   # Reference file
├── ILDO Telcos.xlsx    # Reference file
└── mis_files/          # Daily MIS files folder
    └── ILDO_Client_Summary_<date>.xlsx
```

## Notes

- Server must be running to access the application
- Files are read directly from disk when server starts or APIs are called
- Server URL: http://localhost:3000 (configurable in server.py)
- The application handles various column name formats (case-insensitive)
- Automatically finds and loads the most recent summary file
- Supports number formatting with thousand separators for better readability

## Color Scheme

- Primary: #6EC1E4 (Light Blue)
- Secondary: #54595F (Dark Gray)
- Accent: #61CE70 (Green)
- Text: #7A7A7A (Medium Gray)
- Error: #DC3B3D (Red)

## Future Enhancements

- I to I section implementation
- D to D section implementation
- Export report to Excel
- Date range filtering
- Custom report templates
