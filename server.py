from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import openpyxl
import os
import glob

app = Flask(__name__, static_folder='.')
CORS(app)

def read_excel_to_json(filepath):
    """Read an Excel file and convert to JSON format"""
    try:
        workbook = openpyxl.load_workbook(filepath, data_only=True)
        sheet = workbook.active
        
        # Get headers from first row and sanitize them
        headers = []
        for cell in sheet[1]:
            val = str(cell.value).strip() if cell.value is not None else ""
            headers.append(val)
        
        # Get data rows
        data = []
        for row in sheet.iter_rows(min_row=2, values_only=True):
            row_dict = {}
            for i, value in enumerate(row):
                if i < len(headers) and headers[i]:
                    # Sanitize value - strip if it's a string
                    if isinstance(value, str):
                        value = value.strip()
                    row_dict[headers[i]] = value
            if any(row_dict.values()):
                data.append(row_dict)
        
        return data
    except Exception as e:
        print(f"Error reading {filepath}: {str(e)}")
        raise

@app.route('/')
def index():
    """Serve the index.html file"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS, etc.)"""
    return send_from_directory('.', path)

@app.route('/api/clients')
def get_clients():
    """Get client data from ILDO Clients.xlsx"""
    try:
        filepath = 'ILDO Clients.xlsx'
        data = read_excel_to_json(filepath)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': 'Failed to read clients file', 'message': str(e)}), 500

@app.route('/api/telcos')
def get_telcos():
    """Get telco data from ILDO Telcos.xlsx"""
    try:
        filepath = 'ILDO Telcos.xlsx'
        data = read_excel_to_json(filepath)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': 'Failed to read telcos file', 'message': str(e)}), 500

@app.route('/api/summary')
def get_summary():
    """Get the most recent summary file from mis_files folder"""
    try:
        mis_folder = 'mis_files'
        
        # Find all ILDO Client Summary files
        pattern = os.path.join(mis_folder, 'ILDO_Client_Summary_*.xlsx')
        files = glob.glob(pattern)
        
        if not files:
            return jsonify({'error': 'No summary files found in mis_files folder'}), 404
        
        # Sort by filename (which includes date) and get the latest
        files.sort(reverse=True)
        latest_file = files[0]
        filename = os.path.basename(latest_file)
        
        data = read_excel_to_json(latest_file)
        
        return jsonify({
            'filename': filename,
            'data': data
        })
    except Exception as e:
        return jsonify({'error': 'Failed to read summary file', 'message': str(e)}), 500

@app.route('/api/summary/list')
def list_summaries():
    """List all available summary files"""
    try:
        mis_folder = 'mis_files'
        pattern = os.path.join(mis_folder, 'ILDO_Client_Summary_*.xlsx')
        files = glob.glob(pattern)
        
        filenames = [os.path.basename(f) for f in files]
        filenames.sort(reverse=True)
        
        return jsonify({'files': filenames})
    except Exception as e:
        return jsonify({'error': 'Failed to list summary files', 'message': str(e)}), 500

@app.route('/api/summary/<filename>')
def get_specific_summary(filename):
    """Get a specific summary file by name"""
    try:
        filepath = os.path.join('mis_files', filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        data = read_excel_to_json(filepath)
        
        return jsonify({
            'filename': filename,
            'data': data
        })
    except Exception as e:
        return jsonify({'error': 'Failed to read file', 'message': str(e)}), 500

if __name__ == '__main__':
    print("\n==========================================")
    print("ILDO Report Automation Server Running")
    print("==========================================")
    print("Server URL: http://localhost:3000")
    print(f"Serving files from: {os.getcwd()}")
    print("==========================================\n")
    print("Available endpoints:")
    print("  - http://localhost:3000/              (Main Application)")
    print("  - http://localhost:3000/api/clients   (Client Data)")
    print("  - http://localhost:3000/api/telcos    (Telco Data)")
    print("  - http://localhost:3000/api/summary   (Latest Summary)")
    print("  - http://localhost:3000/api/summary/list (All Summary Files)")
    print("==========================================\n")
    
    app.run(host='localhost', port=3000, debug=True)
