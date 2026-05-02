document.addEventListener('DOMContentLoaded', () => {
    // Sidebar Logic
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const body = document.body;

    // Load sidebar state
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
        body.classList.add('sidebar-collapsed');
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            body.classList.toggle('sidebar-collapsed');
            localStorage.setItem('sidebar-collapsed', body.classList.contains('sidebar-collapsed'));
        });
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            body.classList.toggle('sidebar-active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            body.classList.remove('sidebar-active');
        });
    }

    // Tabs Logic
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            const parent = btn.closest('.tabs-container') || document;
            
            parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const content = document.getElementById(tabId);
            if (content) content.classList.add('active');
        });
    });
});

const SVG_FILES = [
    "barat-bendan-kergon-3.svg","barat-medono-5.svg","barat-pasirkratonkramat-1.svg",
    "barat-podosugih-4.svg","barat-pringrejo-6.svg","barat-sapuro-kebulen-7.svg","barat-tirto-2.svg",
    "selatan-banyurip-8.svg","selatan-buaran-kradenan-7.svg","selatan-jenggot-6.svg",
    "selatan-kosong-3.svg","selatan-kosong-4.svg","selatan-kuripan-kertoharjo-5.svg",
    "selatan-kuripan-yosorejo-2.svg","selatan-sokoduwet-1.svg","timur-gamer-5.svg",
    "timur-kalibaros-4.svg","timur-kauman-1.svg","timur-klego-2.svg","timur-noyontaansari-7.svg",
    "timur-poncol-3.svg","timur-setono-6.svg","utara-bandengan-2.svg","utara-degayu-7.svg",
    "utara-kandang-panjang-3.svg","utara-kosong-1.svg","utara-kosong-8.svg","utara-kosong-9.svg",
    "utara-krapyak-6.svg","utara-padukuhan-kraton-10.svg","utara-panjang-baru-4.svg","utara-panjang-wetan-5.svg"
];

const KECAMATAN_NAMES = {
    "utara": "Kec. Pekalongan Utara",
    "timur": "Kec. Pekalongan Timur",
    "selatan": "Kec. Pekalongan Selatan",
    "barat": "Kec. Pekalongan Barat"
};

// Generate dummy data for each region
const regionData = {};

SVG_FILES.forEach(filename => {
    // Parse filename: "utara-bandengan-2.svg"
    const parts = filename.replace('.svg', '').split('-');
    const region = parts[0];
    const index = parts.pop(); // Remove number
    parts.shift(); // Remove region
    const nameStr = parts.join(' ');
    
    // Format name nicely
    let formattedName = nameStr.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (formattedName.startsWith('Kosong')) {
        formattedName = `Area Kosong (${formattedName})`;
    } else {
        formattedName = `Kel. ${formattedName}`;
    }

    const total = Math.floor(Math.random() * 8000) + 2000;
    const compliance = Math.random() * 0.5 + 0.4; // 40% to 90%
    const paid = Math.floor(total * compliance);
    const unpaid = total - paid;
    const potentialRaw = unpaid * 850000; // rough tax per vehicle
    
    let complianceStatus = "";
    let statusColor = "";
    if (compliance >= 0.8) {
        complianceStatus = "Kepatuhan Tinggi";
        statusColor = "green"; // Green
    } else if (compliance >= 0.5) {
        complianceStatus = "Kepatuhan Sedang";
        statusColor = "yellow"; // Yellow
    } else {
        complianceStatus = "Kepatuhan Rendah";
        statusColor = "red"; // Red
    }

    regionData[filename] = {
        id: filename,
        name: formattedName,
        kecamatan: KECAMATAN_NAMES[region],
        total: total,
        paid: paid,
        unpaid: unpaid,
        compliance: compliance,
        potential: potentialRaw,
        complianceStatus: complianceStatus,
        statusColor: statusColor
    };
});

function formatCurrency(val) {
    if (val >= 1000000000) {
        return 'Rp ' + (val / 1000000000).toFixed(1) + 'M';
    } else if (val >= 1000000) {
        return 'Rp ' + Math.floor(val / 1000000) + ' Juta';
    }
    return 'Rp ' + val.toLocaleString('id-ID');
}

async function loadMapElements(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const loader = document.getElementById('map-loader');
    if (loader) loader.classList.add('active');

    // Fetch all SVGs in parallel
    const promises = SVG_FILES.map(filename => 
        fetch(`assets/peta_pisah/${filename}`).then(res => res.text())
    );

    try {
        const svgContents = await Promise.all(promises);
        
        svgContents.forEach((content, i) => {
            const filename = SVG_FILES[i];
            const data = regionData[filename];
            
            // Create wrapper for SVG
            const wrapper = document.createElement('div');
            wrapper.innerHTML = content;
            const svg = wrapper.querySelector('svg');
            
            if (svg) {
                // Remove inline styles to allow CSS to control it
                svg.removeAttribute('width');
                svg.removeAttribute('height');
                
                // Color based on compliance if on dashboard, else keep original or interactive
                if (containerId === 'dashboard-map') {
                    // Force color based on compliance
                    let fillColor = "#10B981"; // green
                    if (data.statusColor === "yellow") fillColor = "#F59E0B";
                    if (data.statusColor === "red") fillColor = "#EF4444";
                    
                    const shapes = svg.querySelectorAll('path, polygon');
                    shapes.forEach(s => {
                        s.style.fill = fillColor;
                        s.style.stroke = "white";
                        s.style.strokeWidth = "25";
                    });
                }
                
                // Assign metadata to shapes
                const shapes = svg.querySelectorAll('path, polygon');
                shapes.forEach(s => {
                    s.setAttribute('data-filename', filename);
                    s.classList.add('map-interactive-shape');
                });

                container.appendChild(svg);
            }
        });
        
        if (loader) loader.classList.remove('active');
        
        setupInteractions(containerId);
        
    } catch (e) {
        console.error("Error loading SVGs:", e);
        container.innerHTML = "<p>Gagal memuat peta.</p>";
    }
}

let activeSvgShape = null;

function setupInteractions(containerId) {
    const container = document.getElementById(containerId);
    const tooltip = document.getElementById('map-tooltip');
    const shapes = container.querySelectorAll('.map-interactive-shape');
    
    const isDetailMap = containerId === 'main-map';

    shapes.forEach(shape => {
        shape.addEventListener('mouseenter', (e) => {
            const filename = shape.getAttribute('data-filename');
            const data = regionData[filename];
            
            if (data) {
                // Tooltip
                tooltip.innerHTML = `
                    <div style="font-weight: 600; margin-bottom: 4px;">${data.name}</div>
                    <div style="font-size: 0.75rem; color: #aaa; margin-bottom: 8px;">${data.kecamatan}</div>
                    <div style="font-size: 0.8rem; display: flex; justify-content: space-between;">
                        <span>Kepatuhan:</span>
                        <strong class="${data.statusColor === 'red' ? 'text-danger' : ''}">${(data.compliance * 100).toFixed(1)}%</strong>
                    </div>
                `;
                tooltip.classList.add('visible');
                
                // Dim other shapes slightly if we want
            }
        });

        shape.addEventListener('mousemove', (e) => {
            tooltip.style.left = e.clientX + 'px';
            tooltip.style.top = e.clientY - 20 + 'px';
        });

        shape.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });

        if (isDetailMap) {
            shape.addEventListener('click', (e) => {
                const filename = shape.getAttribute('data-filename');
                const data = regionData[filename];
                
                // Reset previous active
                if (activeSvgShape) {
                    activeSvgShape.closest('svg').classList.remove('active-region');
                }
                
                activeSvgShape = shape;
                shape.closest('svg').classList.add('active-region');
                
                updateDetailPanel(data);
            });
        }
    });
}

function updateDetailPanel(data) {
    document.getElementById('region-details').classList.add('hidden');
    const content = document.getElementById('region-content');
    content.classList.remove('hidden');
    
    document.getElementById('panel-region-name').textContent = data.name;
    document.getElementById('panel-kecamatan').textContent = data.kecamatan;
    
    document.getElementById('panel-total').textContent = data.total.toLocaleString('id-ID');
    document.getElementById('panel-paid').textContent = data.paid.toLocaleString('id-ID');
    document.getElementById('panel-unpaid').textContent = data.unpaid.toLocaleString('id-ID');
    
    const paidPct = (data.compliance * 100).toFixed(1);
    const unpaidPct = (100 - (data.compliance * 100)).toFixed(1);
    
    document.getElementById('bar-paid').style.width = `${paidPct}%`;
    document.getElementById('bar-unpaid').style.width = `${unpaidPct}%`;
    
    document.getElementById('panel-compliance-text').textContent = data.complianceStatus;
    
    const circle = document.getElementById('panel-compliance-circle');
    let circleColor = "var(--success)";
    if (data.statusColor === "yellow") circleColor = "var(--warning)";
    if (data.statusColor === "red") circleColor = "var(--danger)";
    
    circle.style.background = `conic-gradient(${circleColor} ${paidPct}%, var(--background) 0deg)`;
    document.getElementById('panel-compliance-val').textContent = `${paidPct}%`;
    
    document.getElementById('panel-potential').textContent = formatCurrency(data.potential);
}

document.addEventListener('DOMContentLoaded', () => {
    // Check which page we are on
    if (document.getElementById('dashboard-map')) {
        loadMapElements('dashboard-map');
    }
    
    if (document.getElementById('main-map')) {
        loadMapElements('main-map');
    }
});
