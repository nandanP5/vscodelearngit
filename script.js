// Global state to store loaded data
let clientData = null;
let telcoData = null;
let summaryData = null;

// Global normalization helper
window.norm = function (str) {
    if (str === null || str === undefined) return '';
    return str.toString().replace(/[\s\u00a0]+/g, ' ').trim();
};

document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    loadAllData();
});

function initializeTabs() {
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            const target = document.getElementById(`${section}-section`);
            if (target) target.classList.add('active');
        });
    });
    const genBtn = document.getElementById('generateBtn');
    if (genBtn) genBtn.addEventListener('click', generateReport);
}

async function loadAllData() {
    showLoading('Syncing...');
    try {
        const [c, t, s] = await Promise.all([
            fetch('/api/clients').then(r => r.json()),
            fetch('/api/telcos').then(r => r.json()),
            fetch('/api/summary').then(r => r.json())
        ]);
        clientData = c;
        telcoData = t;
        summaryData = s.data;

        window.clientData = c; window.telcoData = t; window.summaryData = s.data;

        updateStatusDisplay();
        hideLoading();
        showSuccess('Loaded');
        setTimeout(generateReport, 300);
    } catch (e) {
        hideLoading();
        showError('Load Error');
    }
}

function updateStatusDisplay() {
    if (clientData) updBox('clientStatus', 'loaded', `Clients: ${clientData.length}`);
    if (telcoData) updBox('telcoStatus', 'loaded', `Telcos: ${telcoData.length}`);
    if (summaryData) updBox('summaryStatus', 'loaded', `Records: ${summaryData.length}`);
}

function updBox(id, status, label) {
    const b = document.getElementById(id);
    if (!b) return;
    b.className = 'status-box ' + status;
    const l = b.querySelector('.status-label');
    if (l) l.textContent = label;
}

function generateReport() {
    if (!clientData || !summaryData) return;
    showLoading('Generating...');
    try {
        const report = processAllData();
        renderTable(report);
        hideLoading();
    } catch (e) {
        hideLoading();
        showError('Error');
    }
}

function processAllData() {
    const cMap = {};
    clientData.forEach(r => {
        const id = window.norm(r.smpp_id || r.SMPP_ID || r.user_id || r['smpp id']);
        const name = window.norm(r['Customer Name'] || r['CUSTOMER NAME'] || r.customer_name || r.Client || r.client);
        if (id && name) cMap[id] = name;
    });

    const tMap = {};
    if (telcoData) {
        telcoData.forEach(r => {
            const name = window.norm(r.telconame || r['Operator Name'] || r.operator_name || r.Operator).toLowerCase();
            const typeValue = window.norm(r.telcotype || r.TelcoType || r.Type).toLowerCase();
            if (name && typeValue) tMap[name] = typeValue;
        });
    }

    const grouped = {};
    summaryData.forEach(row => {
        const id = window.norm(row.smpp_id || row.SMPP_ID || row['smpp id'] || '');
        if (!id) return;
        if (!grouped[id]) {
            grouped[id] = { id: id, name: cMap[id] || id, sub: 0, del: 0, yulore: 0, domestic: 0, discount: 0 };
        }
        const s = parseFloat(row.Submitted || row.submitted || 0);
        const d = parseFloat(row.Delivered || row.delivered || 0);
        grouped[id].sub += s;
        grouped[id].del += d;

        const opRaw = window.norm(row.operator_name || row.OPERATOR_NAME || '').toLowerCase();
        let type = 'other';
        if (tMap[opRaw]) type = tMap[opRaw];
        else {
            for (let k in tMap) { if (opRaw.includes(k) || k.includes(opRaw)) { type = tMap[k]; break; } }
        }

        if (type === 'other') {
            if (opRaw.includes('yulore')) type = 'yulore';
            else if (['airtel', 'jio', 'vodafone', 'idea', 'bsnl', 'docomo', 'indicom', 'reliance', 'tata', 'uninor', 'aircel', 'mts', 'cellone', 'videocon'].some(k => opRaw.includes(k))) type = 'domestic';
            else if (opRaw.includes('discount') || opRaw.includes('internal')) type = 'discounting';
        }

        if (type === 'yulore') grouped[id].yulore += d;
        else if (type === 'domestic' || type.includes('domestic')) grouped[id].domestic += d;
        else if (type.includes('discounting') || type.includes('discount')) grouped[id].discount += s;
    });

    const results = Object.values(grouped).map(g => {
        return {
            name: g.name, sub: g.sub, subF: g.sub.toLocaleString(), delF: g.del.toLocaleString(),
            dPct: g.sub > 0 ? ((g.del / g.sub) * 100).toFixed(2) + '%' : '0.00%',
            yuloreF: g.yulore.toLocaleString(), domesticF: g.domestic.toLocaleString(), discountF: g.discount.toLocaleString(),
            mPct: g.sub > 0 ? (((g.yulore + g.domestic + g.discount) / g.sub) * 100).toFixed(2) + '%' : '0.00%',
            isTotal: false
        };
    });
    results.sort((a, b) => b.sub - a.sub);

    // Total Row
    const t = { sub: 0, del: 0, yulore: 0, domestic: 0, discount: 0 };
    Object.values(grouped).forEach(g => { t.sub += g.sub; t.del += g.del; t.yulore += g.yulore; t.domestic += g.domestic; t.discount += g.discount; });

    results.push({
        name: '<strong>TOTAL</strong>', sub: t.sub, subF: t.sub.toLocaleString(), delF: t.del.toLocaleString(),
        dPct: t.sub > 0 ? ((t.del / t.sub) * 100).toFixed(2) + '%' : '0.00%',
        yuloreF: t.yulore.toLocaleString(), domesticF: t.domestic.toLocaleString(), discountF: t.discount.toLocaleString(),
        mPct: t.sub > 0 ? (((t.yulore + t.domestic + t.discount) / t.sub) * 100).toFixed(2) + '%' : '0.00%',
        isTotal: true
    });
    return results;
}

function renderTable(data) {
    const tb = document.getElementById('reportBody');
    if (!tb) return;
    tb.innerHTML = '';
    data.forEach(r => {
        const tr = document.createElement('tr');
        if (r.isTotal) { tr.style.backgroundColor = '#f8faff'; tr.style.fontWeight = '700'; }
        tr.innerHTML = `<td class="cust-cell">${r.name}</td><td>${r.subF}</td><td>${r.delF}</td><td class="stat-cell">${r.dPct}</td><td>${r.yuloreF}</td><td>${r.domesticF}</td><td>${r.discountF}</td><td class="stat-cell">${r.mPct}</td>`;
        tb.appendChild(tr);
    });
    const container = document.getElementById('reportContainer');
    if (container) container.classList.add('show');
}

function showError(m) { const e = document.getElementById('errorMessage'); if (e) { e.textContent = m; e.classList.add('show'); setTimeout(() => e.classList.remove('show'), 5000); } }
function showSuccess(m) { const l = document.getElementById('loadingMessage'); if (l) { l.textContent = '✓ ' + m; l.classList.add('show'); setTimeout(() => l.classList.remove('show'), 3000); } }
function showLoading(m) { const l = document.getElementById('loadingMessage'); if (l) { l.textContent = m; l.classList.add('show'); } }
function hideLoading() { const l = document.getElementById('loadingMessage'); if (l) l.classList.remove('show'); }
