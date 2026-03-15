// State aplikasi
let currentTargetLang = 'en'; // Default ke Inggris
let isTranslating = false;
let speechSynthesisUtterance = null;

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
    initializeSpeechSynthesis();
});

inputText.addEventListener('input', updateCharCounter);
translateBtn.addEventListener('click', translate);
clearBtn.addEventListener('click', clearInput);
swapBtn.addEventListener('click', swapLanguages);

copyEnglishBtn.addEventListener('click', () => copyToClipboard('english'));
copyArabicBtn.addEventListener('click', () => copyToClipboard('arabic'));

// Perbaikan fungsi text-to-speech
speakIndonesian.addEventListener('click', () => speakTextWithVoice(inputText.value, 'id', 'Indonesia'));
speakEnglish.addEventListener('click', () => speakTextWithVoice(getEnglishText(), 'en', 'Inggris'));
speakArabic.addEventListener('click', () => speakTextWithVoice(getArabicText(), 'ar', 'Arab'));

// Inisialisasi speech synthesis
function initializeSpeechSynthesis() {
    if (!('speechSynthesis' in window)) {
        showToast('Browser Anda tidak mendukung text-to-speech');
        disableSpeechButtons();
        return;
    }

    // Pastikan voice siap
    if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
            console.log('Voices loaded:', speechSynthesis.getVoices().length);
        });
    }
}

// Nonaktifkan tombol speech jika tidak didukung
function disableSpeechButtons() {
    speakIndonesian.disabled = true;
    speakEnglish.disabled = true;
    speakArabic.disabled = true;
    
    speakIndonesian.style.opacity = '0.5';
    speakEnglish.style.opacity = '0.5';
    speakArabic.style.opacity = '0.5';
    
    speakIndonesian.title = 'Tidak didukung di browser ini';
    speakEnglish.title = 'Tidak didukung di browser ini';
    speakArabic.title = 'Tidak didukung di browser ini';
}

// Fungsi utama text-to-speech yang diperbaiki
function speakTextWithVoice(text, lang, languageName) {
    // Validasi teks
    if (!text || text.trim() === '') {
        showToast(`Tidak ada teks ${languageName} untuk dibacakan`);
        return;
    }

    // Cek dukungan browser
    if (!('speechSynthesis' in window)) {
        showToast('Browser Anda tidak mendukung text-to-speech');
        return;
    }

    // Hentikan speech yang sedang berlangsung
    stopSpeaking();

    // Buat utterance baru
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageCode(lang);
    utterance.rate = 0.9; // Kecepatan bicara (0.1 - 10)
    utterance.pitch = 1; // Nada suara (0 - 2)
    utterance.volume = 1; // Volume (0 - 1)

    // Pilih voice yang sesuai
    const voice = getAppropriateVoice(lang);
    if (voice) {
        utterance.voice = voice;
    }

    // Event handlers untuk debugging
    utterance.onstart = () => {
        console.log(`Memulai pembacaan bahasa ${languageName}`);
        updateButtonState(lang, true);
    };

    utterance.onend = () => {
        console.log(`Selesai membaca bahasa ${languageName}`);
        updateButtonState(lang, false);
    };

    utterance.onerror = (event) => {
        console.error(`Error membaca bahasa ${languageName}:`, event);
        showToast(`Gagal membaca teks ${languageName}`);
        updateButtonState(lang, false);
    };

    // Simpan utterance untuk referensi
    speechSynthesisUtterance = utterance;

    // Mulai membaca
    try {
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.error('Speech synthesis error:', error);
        showToast('Gagal memulai text-to-speech');
    }
}

// Hentikan pembacaan
function stopSpeaking() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    // Reset semua tombol
    updateButtonState('id', false);
    updateButtonState('en', false);
    updateButtonState('ar', false);
}

// Update status tombol
function updateButtonState(lang, isSpeaking) {
    const buttons = {
        'id': speakIndonesian,
        'en': speakEnglish,
        'ar': speakArabic
    };

    const button = buttons[lang];
    if (button) {
        if (isSpeaking) {
            button.classList.add('speaking');
            button.innerHTML = '<i class="fas fa-stop"></i> Berhenti';
            // Ubah fungsi klik untuk berhenti
            button.onclick = stopSpeaking;
        } else {
            button.classList.remove('speaking');
            button.innerHTML = `<i class="fas fa-volume-up"></i> Dengarkan ${lang === 'id' ? 'Indonesia' : lang === 'en' ? 'Inggris' : 'Arab'}`;
            // Kembalikan fungsi semula
            button.onclick = () => speakTextWithVoice(
                lang === 'id' ? inputText.value : lang === 'en' ? getEnglishText() : getArabicText(),
                lang,
                lang === 'id' ? 'Indonesia' : lang === 'en' ? 'Inggris' : 'Arab'
            );
        }
    }
}

// Mendapatkan kode bahasa yang tepat
function getLanguageCode(lang) {
    const codes = {
        'id': 'id-ID',
        'en': 'en-US',
        'ar': 'ar-SA'
    };
    return codes[lang] || lang;
}

// Mendapatkan voice yang sesuai untuk bahasa
function getAppropriateVoice(lang) {
    const voices = window.speechSynthesis.getVoices();
    
    // Prioritas voice untuk setiap bahasa
    const preferredVoices = {
        'id': ['id-ID', 'ms-MY'], // Indonesia atau Malaysia
        'en': ['en-US', 'en-GB', 'en-AU'], // US, UK, Australia
        'ar': ['ar-SA', 'ar-EG', 'ar'] // Arab Saudi, Mesir
    };

    // Cari voice yang cocok
    for (const preferred of preferredVoices[lang]) {
        const voice = voices.find(v => v.lang.includes(preferred));
        if (voice) return voice;
    }

    // Fallback: cari voice dengan bahasa yang sama
    const fallback = voices.find(v => v.lang.includes(lang));
    if (fallback) return fallback;

    // Fallback terakhir: voice pertama
    return voices[0];
}

// Update karakter counter
function updateCharCounter() {
    const length = inputText.value.length;
    charCounter.textContent = `${length} karakter`;
    if (length > 500) {
        charCounter.style.color = '#dc3545';
    } else if (length > 300) {
        charCounter.style.color = '#ffc107';
    } else {
        charCounter.style.color = '#888';
    }
}

// Clear input
function clearInput() {
    inputText.value = '';
    englishOutput.innerHTML = '<p class="placeholder">Hasil terjemahan Inggris akan muncul di sini...</p>';
    arabicOutput.innerHTML = '<p class="placeholder">نتيجة الترجمة العربية ستظهر هنا...</p>';
    updateCharCounter();
    stopSpeaking(); // Hentikan speech jika sedang berlangsung
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
        showToast(ERROR_MESSAGES.id.empty);
        return;
    }
    
    if (isTranslating) return;
    
    isTranslating = true;
    showLoading();
    stopSpeaking(); // Hentikan speech jika sedang berlangsung
    
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
        showToast(error.message);
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
        'selamat siang': { en: 'good afternoon', ar: 'مساء الخير' },
        'selamat sore': { en: 'good evening', ar: 'مساء الخير' },
        'selamat malam': { en: 'good night', ar: 'تصبح على خير' },
        'terima kasih': { en: 'thank you', ar: 'شكرا' },
        'terimakasih': { en: 'thank you', ar: 'شكرا' },
        'makasih': { en: 'thanks', ar: 'شكرا' },
        'sama sama': { en: 'you\'re welcome', ar: 'عفوا' },
        'apa kabar': { en: 'how are you', ar: 'كيف حالك' },
        'kabar baik': { en: 'fine', ar: 'بخير' },
        'baik': { en: 'good', ar: 'جيد' },
        'iya': { en: 'yes', ar: 'نعم' },
        'ya': { en: 'yes', ar: 'نعم' },
        'tidak': { en: 'no', ar: 'لا' },
        'maaf': { en: 'sorry', ar: 'آسف' },
        'permisi': { en: 'excuse me', ar: 'عفوا' },
        'selamat jalan': { en: 'goodbye', ar: 'مع السلامة' },
        'sampai jumpa': { en: 'see you', ar: 'أراك لاحقا' },
        'saya cinta kamu': { en: 'i love you', ar: 'أحبك' },
        'aku cinta kamu': { en: 'i love you', ar: 'أحبك' }
    };
    
    const lowerText = text.toLowerCase().trim();
    
    // Cek exact match
    if (dictionary[lowerText]) {
        return dictionary[lowerText][targetLang];
    }
    
    // Cek partial match untuk kalimat yang lebih panjang
    for (const [key, value] of Object.entries(dictionary)) {
        if (lowerText.includes(key)) {
            return `${value[targetLang]} (${text})`;
        }
    }
    
    // Jika tidak ada di kamus, format teks dengan catatan
    return `[${targetLang === 'en' ? 'English' : 'Arabic'}] ${text}`;
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
            showToast('✓ Teks berhasil disalin!');
        }).catch(() => {
            // Fallback copy method
            copyTextFallback(text);
        });
    } else {
        showToast('Tidak ada teks untuk disalin');
    }
}

// Fallback copy untuk browser lama
function copyTextFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showToast('✓ Teks berhasil disalin!');
    } catch (err) {
        showToast('Gagal menyalin teks');
    }
    
    document.body.removeChild(textarea);
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

// UI Helpers
function showLoading() {
    translateBtn.innerHTML = '<span class="loading"></span> Menerjemahkan...';
    translateBtn.disabled = true;
}

function hideLoading() {
    translateBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Terjemahkan';
    translateBtn.disabled = false;
}

function showToast(message) {
    // Hapus toast yang sudah ada
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Buat toast baru
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animasi masuk
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hapus setelah 2 detik
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
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
        e.preventDefault();
        translate();
    }
    
    // Escape untuk clear
    if (e.key === 'Escape') {
        clearInput();
    }
    
    // Ctrl+Shift+S untuk stop speech
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        stopSpeaking();
    }
});

// Bersihkan speech saat pindah halaman
window.addEventListener('beforeunload', () => {
    stopSpeaking();
});
