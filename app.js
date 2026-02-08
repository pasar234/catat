// Database
let database = JSON.parse(localStorage.getItem('stok_app_db')) || [];
let currentCategory = '';
let deferredPrompt = null;

// DOM Elements
const pageHome = document.getElementById('page-home');
const pageList = document.getElementById('page-list');
const listContainer = document.getElementById('list-container');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('cari');
const navBtns = document.querySelectorAll('.nav-btn');
const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmCancel = document.getElementById('confirmCancel');
const confirmOk = document.getElementById('confirmOk');
const toast = document.getElementById('toast');
const themeToggle = document.getElementById('themeToggle');
const installBtn = document.getElementById('installBtn');

// Debug info
console.log('Aplikasi Stok Pintar dimuat');
console.log('Jumlah produk:', database.length);
console.log('Path:', window.location.href);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM siap, inisialisasi...');
    initializeTheme();
    initializeNavigation();
    initializeEventListeners();
    renderData();
    
    // Check for PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA install prompt tersedia');
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'flex';
        showToast('Aplikasi bisa diinstall!', 'success');
    });
    
    // Listen for app installed
    window.addEventListener('appinstalled', () => {
        console.log('Aplikasi terinstall');
        deferredPrompt = null;
        installBtn.style.display = 'none';
        showToast('Aplikasi berhasil diinstal!', 'success');
    });
    
    // Cek jika running sebagai PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('Running sebagai PWA');
    }
});

// Initialize Theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// Initialize Navigation
function initializeNavigation() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            showPage(page);
        });
    });
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Save Product
    document.getElementById('simpanProduk').addEventListener('click', simpanData);
    
    // Backup/Restore
    document.getElementById('backupBtn').addEventListener('click', exportData);
    document.getElementById('fileInput').addEventListener('change', importData);
    
    // Search
    searchInput.addEventListener('input', renderData);
    
    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Install App
    installBtn.addEventListener('click', installApp);
    
    // Modal
    confirmCancel.addEventListener('click', () => confirmModal.classList.remove('show'));
    confirmOk.addEventListener('click', handleConfirm);
    
    // Enter key to save product
    document.getElementById('nama').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') simpanData();
    });
    document.getElementById('jual').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') simpanData();
    });
}

// Show Page
function showPage(page) {
    // Update active nav button
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === page) {
            btn.classList.add('active');
        }
    });
    
    // Show page
    if (page === 'home') {
        pageHome.classList.add('active');
        pageList.classList.remove('active');
        // Focus on nama input
        document.getElementById('nama').focus();
    } else {
        currentCategory = page;
        pageHome.classList.remove('active');
        pageList.classList.add('active');
        document.title = `Stok ${page.toUpperCase()} - Stok Pintar`;
        renderData();
    }
}

// Save Product
function simpanData() {
    const nama = document.getElementById('nama').value.trim();
    const kode = document.getElementById('kode').value.trim();
    const beli = document.getElementById('beli').value;
    const jual = document.getElementById('jual').value;
    const kategori = document.getElementById('kategori').value;
    
    if (!nama || !jual) {
        showToast('Nama dan Harga Jual wajib diisi!', 'error');
        document.getElementById('nama').focus();
        return;
    }
    
    const produkBaru = {
        id: Date.now(),
        nama: nama,
        kode: kode || `PROD-${Date.now().toString().slice(-6)}`,
        beli: parseInt(beli) || 0,
        jual: parseInt(jual),
        kategori: kategori,
        stok: 0,
        createdAt: new Date().toISOString()
    };
    
    database.push(produkBaru);
    saveToLocalStorage();
    
    showToast(`✅ "${nama}" ditambahkan ke ${kategori.toUpperCase()}`, 'success');
    
    // Clear form
    document.getElementById('nama').value = '';
    document.getElementById('kode').value = '';
    document.getElementById('beli').value = '';
    document.getElementById('jual').value = '';
    
    // Focus on nama input
    document.getElementById('nama').focus();
}

// Render Data
function renderData() {
    if (!currentCategory) return;
    
    const search = searchInput.value.toLowerCase();
    const filteredData = database.filter(item => 
        item.kategori === currentCategory && 
        (item.nama.toLowerCase().includes(search) || 
         item.kode.toLowerCase().includes(search))
    );
    
    if (filteredData.length === 0) {
        emptyState.style.display = 'block';
        listContainer.innerHTML = '';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Sort by name
    filteredData.sort((a, b) => a.nama.localeCompare(b.nama));
    
    listContainer.innerHTML = filteredData.map(item => `
        <div class="product-card" data-id="${item.id}">
            <div class="product-header">
                <div class="product-info">
                    <h3 class="product-title">${escapeHtml(item.nama)}</h3>
                    <div class="product-code">Kode: ${escapeHtml(item.kode)}</div>
                    <div class="product-harga">
                        <span class="harga-label">Beli:</span> ${formatRupiah(item.beli)}<br>
                        <span class="harga-label">Jual:</span> <strong>${formatRupiah(item.jual)}</strong>
                    </div>
                    <button class="delete-btn" onclick="showDeleteConfirm(${item.id})">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
                <div class="stock-control">
                    <div class="stock-label">STOK</div>
                    <div class="stock-value">${item.stok}</div>
                    <div class="stock-buttons">
                        <button class="stock-btn" onclick="ubahStok(${item.id}, -1)">-</button>
                        <button class="stock-btn" onclick="ubahStok(${item.id}, 1)">+</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Change Stock
function ubahStok(id, val) {
    const index = database.findIndex(x => x.id === id);
    if (index !== -1) {
        const newStock = Math.max(0, database[index].stok + val);
        database[index].stok = newStock;
        saveToLocalStorage();
        renderData();
        
        // Show stock change notification
        const produk = database[index];
        const action = val > 0 ? 'ditambah' : 'dikurangi';
        showToast(`📦 ${produk.nama} ${action} menjadi ${newStock}`, 'success');
    }
}

// Show Delete Confirmation
function showDeleteConfirm(id) {
    const produk = database.find(x => x.id === id);
    if (!produk) return;
    
    confirmTitle.textContent = 'Hapus Produk';
    confirmMessage.textContent = `Yakin hapus "${produk.nama}"?`;
    confirmOk.dataset.id = id;
    confirmModal.classList.add('show');
}

// Handle Confirm
function handleConfirm() {
    const id = parseInt(confirmOk.dataset.id);
    database = database.filter(x => x.id !== id);
    saveToLocalStorage();
    renderData();
    confirmModal.classList.remove('show');
    showToast('🗑️ Produk dihapus', 'success');
}

// Export Data
function exportData() {
    if (database.length === 0) {
        showToast('❌ Tidak ada data untuk dibackup!', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(database, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_stok_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('✅ Backup berhasil didownload!', 'success');
}

// Import Data
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                // Show confirmation before overwriting
                if (confirm('Data lama akan diganti dengan data backup. Lanjutkan?')) {
                    database = importedData;
                    saveToLocalStorage();
                    showToast('✅ Data berhasil dipulihkan!', 'success');
                    setTimeout(() => location.reload(), 1000);
                }
            } else {
                showToast('❌ Format file tidak valid!', 'error');
            }
        } catch (err) {
            showToast('❌ Gagal membaca file backup', 'error');
            console.error(err);
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// Save to Local Storage
function saveToLocalStorage() {
    localStorage.setItem('stok_app_db', JSON.stringify(database));
}

// Toggle Theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    showToast(`🌓 Tema ${newTheme === 'dark' ? 'gelap' : 'terang'} diaktifkan`, 'success');
}

// Update Theme Icon
function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Install App
async function installApp() {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        showToast('📱 Aplikasi sedang diinstal...', 'success');
    }
    
    deferredPrompt = null;
    installBtn.style.display = 'none';
}

// Show Toast
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Format Rupiah
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        simpanData();
    }
    
    // Esc to close modal
    if (e.key === 'Escape') {
        confirmModal.classList.remove('show');
    }
    
    // Ctrl+F to focus search
    if (e.ctrlKey && e.key === 'f' && pageList.classList.contains('active')) {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Ctrl+B to backup
    if (e.ctrlKey && e.key === 'b' && pageHome.classList.contains('active')) {
        e.preventDefault();
        exportData();
    }
});

// Offline Detection
window.addEventListener('online', () => {
    showToast('🌐 Koneksi internet kembali', 'success');
});

window.addEventListener('offline', () => {
    showToast('📴 Anda sedang offline. Data disimpan secara lokal.', 'warning');
});

// Auto-focus on page load
window.addEventListener('load', () => {
    const namaInput = document.getElementById('nama');
    if (namaInput && pageHome.classList.contains('active')) {
        setTimeout(() => namaInput.focus(), 500);
    }
});
