const express = require('express');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Function to read Excel file and convert to JSON
function readExcelToJSON(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        return XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        throw error;
    }
}

// API endpoint to get client data
app.get('/api/clients', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'ILDO Clients.xlsx');
        const data = readExcelToJSON(filePath);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read clients file', message: error.message });
    }
});

// API endpoint to get telco data
app.get('/api/telcos', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'ILDO Telcos.xlsx');
        const data = readExcelToJSON(filePath);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read telcos file', message: error.message });
    }
});

// API endpoint to get summary data (finds the most recent file)
app.get('/api/summary', (req, res) => {
    try {
        const misFilesDir = path.join(__dirname, 'mis_files');

        // Find all summary files
        const files = fs.readdirSync(misFilesDir);
        const summaryFiles = files.filter(file =>
            file.startsWith('ILDO_Client_Summary_') && file.endsWith('.xlsx')
        );

        if (summaryFiles.length === 0) {
            return res.status(404).json({ error: 'No summary files found in mis_files folder' });
        }

        // Sort by date (assuming filename format ILDO_Client_Summary_YYYY-MM-DD.xlsx)
        summaryFiles.sort().reverse();
        const latestFile = summaryFiles[0];

        const filePath = path.join(misFilesDir, latestFile);
        const data = readExcelToJSON(filePath);

        res.json({
            filename: latestFile,
            data: data
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read summary file', message: error.message });
    }
});

// API endpoint to list all available summary files
app.get('/api/summary/list', (req, res) => {
    try {
        const misFilesDir = path.join(__dirname, 'mis_files');
        const files = fs.readdirSync(misFilesDir);
        const summaryFiles = files.filter(file =>
            file.startsWith('ILDO_Client_Summary_') && file.endsWith('.xlsx')
        );

        summaryFiles.sort().reverse();
        res.json({ files: summaryFiles });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list summary files', message: error.message });
    }
});

// API endpoint to get specific summary file by name
app.get('/api/summary/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, 'mis_files', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const data = readExcelToJSON(filePath);
        res.json({
            filename: filename,
            data: data
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read file', message: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n==========================================`);
    console.log(`🚀 ILDO Report Automation Server Running`);
    console.log(`==========================================`);
    console.log(`📊 Server URL: http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`==========================================\n`);
    console.log(`Available endpoints:`);
    console.log(`  - http://localhost:${PORT}/              (Main Application)`);
    console.log(`  - http://localhost:${PORT}/api/clients   (Client Data)`);
    console.log(`  - http://localhost:${PORT}/api/telcos    (Telco Data)`);
    console.log(`  - http://localhost:${PORT}/api/summary   (Latest Summary)`);
    console.log(`  - http://localhost:${PORT}/api/summary/list (All Summary Files)`);
    console.log(`==========================================\n`);
});
