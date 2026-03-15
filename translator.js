// State aplikasi
let currentTargetLang = 'en'; // Default ke Inggris
let isTranslating = false;

// Elemen DOM
const inputText = document.getElementById('inputText');
const englishOutput = document.getElementById('englishOutput');
const arabicOutput = document.getElementById('arabicOutput');
const translateBtn = document.getElementById('translateBtn');
const clearBtn = document.getElementById('clearBtn');
const swapBtn = document.getElementById('swapBtn');
const charCounter = document.getElementById('charCounter');
const copyEnglishBtn = document.getElementById('copyEnglishBtn');
const copyArabicBtn = document.getElementById('copyArabicBtn');
const speakIndonesian = document.getElementById('speakIndonesian');
const speakEnglish = document.getElementById('speakEnglish');
const speakArabic = document.getElementById('speakArabic');
const apiStatus = document.getElementById('apiStatus');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAPIStatus();
});

inputText.addEventListener('input', updateCharCounter);
translateBtn.addEventListener('click', translate);
clearBtn.addEventListener('click', clearInput);
swapBtn.addEventListener('click', swapLanguages);

copyEnglishBtn.addEventListener('click', () => copyToClipboard('english'));
copyArabicBtn.addEventListener('click', () => copyToClipboard('arabic'));

speakIndonesian.addEventListener('click', () => speakText(inputText.value, 'id'));
speakEnglish.addEventListener('click', () => speakText(getEnglishText(), 'en'));
speakArabic.addEventListener('click', () => speakText(getArabicText(), 'ar'));

// Update karakter counter
function updateCharCounter() {
    const length = inputText.value.length;
    charCounter.textContent = `${length} karakter`;
}

// Clear input
function clearInput() {
    inputText.value = '';
    englishOutput.innerHTML = '<p class="placeholder">Hasil terjemahan Inggris akan muncul di sini...</p>';
    arabicOutput.innerHTML = '<p class="placeholder">نتيجة الترجمة العربية ستظهر هنا...</p>';
    updateCharCounter();
}

// Swap bahasa target
function swapLanguages() {
    currentTargetLang = currentTargetLang === 'en' ? 'ar' : 'en';
    swapBtn.style.transform = 'rotate(180deg)';
    setTimeout(() => {
        swapBtn.style.transform = 'rotate(0deg)';
    }, 300);
    showToast(`Target language: ${currentTargetLang === 'en' ? 'Inggris' : 'Arab'}`);
}

// Fungsi utama terjemahan
async function translate() {
    const text = inputText.value.trim();
    
    if (!text) {
        showError(ERROR_MESSAGES.id.empty);
        return;
    }
    
    if (isTranslating) return;
    
    isTranslating = true;
    showLoading();
    
    try {
        // Terjemahkan ke Inggris
        const englishResult = await translateText(text, 'en');
        updateOutput(englishOutput, englishResult);
        
        // Terjemahkan ke Arab
        const arabicResult = await translateText(text, 'ar');
        updateOutput(arabicOutput, arabicResult, true);
        
        apiStatus.textContent = 'Status: Berhasil diterjemahkan';
        apiStatus.style.color = '#28a745';
    } catch (error) {
        console.error('Translation error:', error);
        showError(error.message);
        apiStatus.textContent = 'Status: Gagal';
        apiStatus.style.color = '#dc3545';
    } finally {
        isTranslating = false;
        hideLoading();
    }
}

// Fungsi untuk memanggil API terjemahan
async function translateText(text, targetLang) {
    try {
        // Gunakan MyMemory Translation API
        const url = `${CONFIG.MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=id|${targetLang}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.responseStatus === 200) {
            return data.responseData.translatedText;
        } else {
            throw new Error(data.responseDetails || ERROR_MESSAGES.id.api);
        }
    } catch (error) {
        console.error('API Error:', error);
        
        // Fallback: Gunakan terjemahan sederhana untuk kata umum (demo)
        return getFallbackTranslation(text, targetLang);
    }
}

// Fallback translation untuk demo
function getFallbackTranslation(text, targetLang) {
    const dictionary = {
        'halo': { en: 'hello', ar: 'مرحبا' },
        'selamat pagi': { en: 'good morning', ar: 'صباح الخير' },
        'selamat malam': { en: 'good evening', ar: 'مساء الخير' },
        'terima kasih': { en: 'thank you', ar: 'شكرا' },
        'sama sama': { en: 'you\'re welcome', ar: 'عفوا' },
        'apa kabar': { en: 'how are you', ar: 'كيف حالك' },
        'baik': { en: 'fine', ar: 'جيد' },
        'iya': { en: 'yes', ar: 'نعم' },
        'tidak': { en: 'no', ar: 'لا' },
        'maaf': { en: 'sorry', ar: 'آسف' }
    };
    
    const lowerText = text.toLowerCase();
    if (dictionary[lowerText]) {
        return dictionary[lowerText][targetLang];
    }
    
    // Jika tidak ada di kamus, kembalikan teks asli dengan catatan
    return `[${targetLang === 'en' ? 'English' : 'Arabic'} translation] ${text}`;
}

// Update output
function updateOutput(element, text, isArabic = false) {
    element.innerHTML = text ? `<p>${text}</p>` : '<p class="placeholder">Hasil terjemahan akan muncul di sini...</p>';
}

// Copy ke clipboard
function copyToClipboard(target) {
    let text = '';
    if (target === 'english') {
        text = getEnglishText();
    } else {
        text = getArabicText();
    }
    
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Teks berhasil disalin!');
        }).catch(() => {
            showToast('Gagal menyalin teks');
        });
    }
}

// Mendapatkan teks dari output
function getEnglishText() {
    const p = englishOutput.querySelector('p');
    return p && !p.classList.contains('placeholder') ? p.textContent : '';
}

function getArabicText() {
    const p = arabicOutput.querySelector('p');
    return p && !p.classList.contains('placeholder') ? p.textContent : '';
}

// Text-to-speech
function speakText(text, lang) {
    if (!text) {
        showToast('Tidak ada teks untuk dibacakan');
        return;
    }
    
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        window.speechSynthesis.cancel(); // Hentikan yang sedang berjalan
        window.speechSynthesis.speak(utterance);
    } else {
        showToast('Browser tidak mendukung text-to-speech');
    }
}

// UI Helpers
function showLoading() {
    translateBtn.innerHTML = '<span class="loading"></span> Menerjemahkan...';
    translateBtn.disabled = true;
}

function hideLoading() {
    translateBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Terjemahkan';
    translateBtn.disabled = false;
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.background = '#dc3545';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// Cek status API
async function checkAPIStatus() {
    try {
        const response = await fetch(`${CONFIG.MYMEMORY_API}?q=test&langpair=id|en`);
        if (response.ok) {
            apiStatus.textContent = 'Status: API Terhubung';
            apiStatus.style.color = '#28a745';
        } else {
            throw new Error('API tidak merespons');
        }
    } catch (error) {
        apiStatus.textContent = 'Status: API Offline (Menggunakan mode demo)';
        apiStatus.style.color = '#ffc107';
    }
}

// Tambahkan shortcut keyboard
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter untuk menerjemahkan
    if (e.ctrlKey && e.key === 'Enter') {
        translate();
    }
    
    // Escape untuk clear
    if (e.key === 'Escape') {
        clearInput();
    }
});
