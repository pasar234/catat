// State aplikasi
let currentTargetLang = 'en';
let isTranslating = false;
let isSpeaking = false;
let currentUtterance = null;
let speechSupported = false;
let voicesLoaded = false;

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

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    checkAPIStatus();
    checkSpeechSupport();
});

// CEK DUKUNGAN SPEECH
function checkSpeechSupport() {
    if ('speechSynthesis' in window) {
        speechSupported = true;
        console.log('✅ Speech synthesis didukung');
        
        // Load voices
        loadVoices();
        
        // Event listener untuk voices changed
        window.speechSynthesis.onvoiceschanged = function() {
            console.log('🔄 Voices berubah, total:', speechSynthesis.getVoices().length);
            voicesLoaded = true;
        };
    } else {
        speechSupported = false;
        console.log('❌ Speech synthesis TIDAK didukung');
        showToast('Browser Anda tidak mendukung text-to-speech', 'error');
        disableSpeechButtons();
    }
}

// LOAD VOICES
function loadVoices() {
    if (!speechSupported) return;
    
    const voices = window.speechSynthesis.getVoices();
    console.log('🎤 Voices tersedia:', voices.length);
    
    if (voices.length > 0) {
        voicesLoaded = true;
        voices.forEach(v => {
            console.log(`- ${v.name} (${v.lang})`);
        });
    }
}

// Nonaktifkan tombol speech
function disableSpeechButtons() {
    [speakIndonesian, speakEnglish, speakArabic].forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.title = 'Tidak didukung di browser ini';
    });
}

// Event listeners
inputText.addEventListener('input', updateCharCounter);
translateBtn.addEventListener('click', translate);
clearBtn.addEventListener('click', clearInput);
swapBtn.addEventListener('click', swapLanguages);

copyEnglishBtn.addEventListener('click', () => copyToClipboard('english'));
copyArabicBtn.addEventListener('click', () => copyToClipboard('arabic'));

// SPEECH INDONESIA - VERSI SEDERHANA DAN PASTI JALAN
speakIndonesian.addEventListener('click', function(e) {
    e.preventDefault();
    const text = inputText.value.trim();
    
    if (!text) {
        showToast('Tidak ada teks Indonesia untuk dibacakan', 'warning');
        return;
    }
    
    // Cek dukungan
    if (!speechSupported) {
        showToast('Browser tidak mendukung text-to-speech', 'error');
        return;
    }
    
    // Jika sedang berbicara, hentikan
    if (isSpeaking) {
        stopSpeech();
        return;
    }
    
    // Batasi teks (maks 150 karakter)
    let textToSpeak = text;
    if (text.length > 150) {
        textToSpeak = text.substring(0, 150) + '...';
        showToast('Teks dipotong (maks 150 karakter)', 'warning');
    }
    
    // Buat utterance dengan konfigurasi sederhana
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Set bahasa Indonesia
    utterance.lang = 'id-ID';
    utterance.rate = 0.9; // Sedikit lebih lambat
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Event handlers
    utterance.onstart = function() {
        isSpeaking = true;
        updateAllSpeechButtons(true);
        console.log('🔊 Mulai bicara Indonesia');
    };
    
    utterance.onend = function() {
        isSpeaking = false;
        updateAllSpeechButtons(false);
        console.log('🔇 Selesai bicara');
    };
    
    utterance.onerror = function(event) {
        console.error('❌ Speech error:', event);
        isSpeaking = false;
        updateAllSpeechButtons(false);
        
        // Coba metode alternatif
        fallbackSpeak(textToSpeak, 'id');
    };
    
    // Hentikan yang sedang berjalan
    window.speechSynthesis.cancel();
    
    // Mulai bicara
    try {
        window.speechSynthesis.speak(utterance);
        currentUtterance = utterance;
    } catch (error) {
        console.error('Gagal memulai speech:', error);
        showToast('Gagal memulai text-to-speech', 'error');
    }
});

// SPEECH INGGRIS
speakEnglish.addEventListener('click', function(e) {
    e.preventDefault();
    const text = getEnglishText();
    
    if (!text) {
        showToast('Tidak ada teks Inggris untuk dibacakan', 'warning');
        return;
    }
    
    if (!speechSupported) {
        showToast('Browser tidak mendukung text-to-speech', 'error');
        return;
    }
    
    if (isSpeaking) {
        stopSpeech();
        return;
    }
    
    let textToSpeak = text;
    if (text.length > 150) {
        textToSpeak = text.substring(0, 150) + '...';
        showToast('Teks dipotong (maks 150 karakter)', 'warning');
    }
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = function() {
        isSpeaking = true;
        updateAllSpeechButtons(true);
        console.log('🔊 Mulai bicara Inggris');
    };
    
    utterance.onend = function() {
        isSpeaking = false;
        updateAllSpeechButtons(false);
    };
    
    utterance.onerror = function(event) {
        console.error('❌ Speech error:', event);
        isSpeaking = false;
        updateAllSpeechButtons(false);
        fallbackSpeak(textToSpeak, 'en');
    };
    
    window.speechSynthesis.cancel();
    
    try {
        window.speechSynthesis.speak(utterance);
        currentUtterance = utterance;
    } catch (error) {
        console.error('Gagal memulai speech:', error);
        showToast('Gagal memulai text-to-speech', 'error');
    }
});

// SPEECH ARAB
speakArabic.addEventListener('click', function(e) {
    e.preventDefault();
    const text = getArabicText();
    
    if (!text) {
        showToast('Tidak ada teks Arab untuk dibacakan', 'warning');
        return;
    }
    
    if (!speechSupported) {
        showToast('Browser tidak mendukung text-to-speech', 'error');
        return;
    }
    
    if (isSpeaking) {
        stopSpeech();
        return;
    }
    
    let textToSpeak = text;
    if (text.length > 150) {
        textToSpeak = text.substring(0, 150) + '...';
        showToast('Teks dipotong (maks 150 karakter)', 'warning');
    }
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8; // Lebih lambat untuk Arab
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = function() {
        isSpeaking = true;
        updateAllSpeechButtons(true);
        console.log('🔊 Mulai bicara Arab');
    };
    
    utterance.onend = function() {
        isSpeaking = false;
        updateAllSpeechButtons(false);
    };
    
    utterance.onerror = function(event) {
        console.error('❌ Speech error:', event);
        isSpeaking = false;
        updateAllSpeechButtons(false);
        fallbackSpeak(textToSpeak, 'ar');
    };
    
    window.speechSynthesis.cancel();
    
    try {
        window.speechSynthesis.speak(utterance);
        currentUtterance = utterance;
    } catch (error) {
        console.error('Gagal memulai speech:', error);
        showToast('Gagal memulai text-to-speech', 'error');
    }
});

// FALLBACK SPEECH - menggunakan metode alternatif
function fallbackSpeak(text, lang) {
    console.log('Mencoba fallback speech untuk', lang);
    
    // Metode 1: Gunakan responsivevoice (jika tersedia)
    if (typeof responsiveVoice !== 'undefined') {
        if (lang === 'id') responsiveVoice.speak(text, 'Indonesian Female');
        else if (lang === 'en') responsiveVoice.speak(text, 'UK English Female');
        else if (lang === 'ar') responsiveVoice.speak(text, 'Arabic Male');
        return;
    }
    
    // Metode 2: Coba lagi dengan konfigurasi berbeda
    setTimeout(() => {
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            
            if (lang === 'id') utterance.lang = 'ms-MY'; // Coba Malaysia
            else if (lang === 'en') utterance.lang = 'en-GB';
            else if (lang === 'ar') utterance.lang = 'ar-EG';
            
            utterance.rate = 0.8;
            
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            showToast('Tidak dapat membaca teks', 'error');
        }
    }, 500);
}

// Hentikan semua speech
function stopSpeech() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    isSpeaking = false;
    updateAllSpeechButtons(false);
    currentUtterance = null;
    console.log('⏹️ Speech dihentikan');
}

// Update semua tombol speech
function updateAllSpeechButtons(isActive) {
    const buttons = [speakIndonesian, speakEnglish, speakArabic];
    
    buttons.forEach(btn => {
        if (isActive) {
            btn.classList.add('speaking');
            btn.innerHTML = '<i class="fas fa-stop"></i> Berhenti';
        } else {
            btn.classList.remove('speaking');
            // Kembalikan teks asli
            if (btn.id === 'speakIndonesian') {
                btn.innerHTML = '<i class="fas fa-volume-up"></i> Dengarkan Indonesia';
            } else if (btn.id === 'speakEnglish') {
                btn.innerHTML = '<i class="fas fa-volume-up"></i> Dengarkan Inggris';
            } else if (btn.id === 'speakArabic') {
                btn.innerHTML = '<i class="fas fa-volume-up"></i> Dengarkan Arab';
            }
        }
    });
}

// Update karakter counter
function updateCharCounter() {
    const length = inputText.value.length;
    charCounter.textContent = `${length} karakter`;
    charCounter.classList.remove('warning', 'danger');
    
    if (length > 500) {
        charCounter.classList.add('danger');
    } else if (length > 300) {
        charCounter.classList.add('warning');
    }
}

// Clear input
function clearInput() {
    inputText.value = '';
    englishOutput.innerHTML = '<p class="placeholder">Hasil terjemahan Inggris akan muncul di sini...</p>';
    arabicOutput.innerHTML = '<p class="placeholder">نتيجة الترجمة العربية ستظهر هنا...</p>';
    updateCharCounter();
    stopSpeech();
    showToast('Teks telah dihapus', 'success');
}

// Swap bahasa target
function swapLanguages() {
    currentTargetLang = currentTargetLang === 'en' ? 'ar' : 'en';
    swapBtn.style.transform = 'rotate(180deg) scale(1.2)';
    setTimeout(() => {
        swapBtn.style.transform = 'rotate(0deg) scale(1)';
    }, 300);
    showToast(`Target language: ${currentTargetLang === 'en' ? 'Inggris' : 'Arab'}`, 'success');
}

// Fungsi utama terjemahan
async function translate() {
    const text = inputText.value.trim();
    
    if (!text) {
        showToast('Masukkan teks untuk diterjemahkan', 'warning');
        inputText.classList.add('error');
        setTimeout(() => inputText.classList.remove('error'), 500);
        return;
    }
    
    if (isTranslating) return;
    
    isTranslating = true;
    showLoading();
    stopSpeech();
    
    try {
        englishOutput.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
        arabicOutput.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
        
        const englishResult = await translateText(text, 'en');
        updateOutput(englishOutput, englishResult);
        
        const arabicResult = await translateText(text, 'ar');
        updateOutput(arabicOutput, arabicResult, true);
        
        apiStatus.innerHTML = '<i class="fas fa-check-circle"></i> Status: Berhasil diterjemahkan';
        apiStatus.style.color = '#28a745';
        showToast('Terjemahan berhasil!', 'success');
    } catch (error) {
        console.error('Translation error:', error);
        showToast('Gagal menerjemahkan. Coba lagi.', 'error');
        apiStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Status: Gagal';
        apiStatus.style.color = '#dc3545';
    } finally {
        isTranslating = false;
        hideLoading();
    }
}

// Fungsi untuk memanggil API terjemahan
async function translateText(text, targetLang) {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=id|${targetLang}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData.translatedText) {
            return data.responseData.translatedText;
        } else {
            throw new Error('Terjemahan tidak ditemukan');
        }
    } catch (error) {
        console.log('API Error, using fallback:', error);
        return getFallbackTranslation(text, targetLang);
    }
}

// Fallback translation
function getFallbackTranslation(text, targetLang) {
    const dictionary = {
        'halo': { en: 'Hello', ar: 'مرحبا' },
        'hai': { en: 'Hi', ar: 'مرحبا' },
        'selamat pagi': { en: 'Good morning', ar: 'صباح الخير' },
        'selamat siang': { en: 'Good afternoon', ar: 'مساء الخير' },
        'selamat sore': { en: 'Good evening', ar: 'مساء الخير' },
        'selamat malam': { en: 'Good night', ar: 'تصبح على خير' },
        'terima kasih': { en: 'Thank you', ar: 'شكرا' },
        'terimakasih': { en: 'Thank you', ar: 'شكرا' },
        'makasih': { en: 'Thanks', ar: 'شكرا' },
        'sama sama': { en: 'You\'re welcome', ar: 'عفوا' },
        'apa kabar': { en: 'How are you?', ar: 'كيف حالك؟' },
        'kabar baik': { en: 'I\'m fine', ar: 'بخير' },
        'baik': { en: 'Good', ar: 'جيد' },
        'iya': { en: 'Yes', ar: 'نعم' },
        'ya': { en: 'Yes', ar: 'نعم' },
        'tidak': { en: 'No', ar: 'لا' },
        'maaf': { en: 'Sorry', ar: 'آسف' },
        'permisi': { en: 'Excuse me', ar: 'عفوا' },
        'selamat jalan': { en: 'Goodbye', ar: 'مع السلامة' },
        'sampai jumpa': { en: 'See you', ar: 'أراك لاحقا' },
        'saya cinta kamu': { en: 'I love you', ar: 'أحبك' },
        'aku cinta kamu': { en: 'I love you', ar: 'أحبك' }
    };
    
    const lowerText = text.toLowerCase().trim();
    
    if (dictionary[lowerText]) {
        return dictionary[lowerText][targetLang];
    }
    
    for (const [key, value] of Object.entries(dictionary)) {
        if (lowerText.includes(key)) {
            return `${value[targetLang]} (${text})`;
        }
    }
    
    const prefix = targetLang === 'en' ? '[English]' : '[Arabic]';
    return `${prefix} ${text}`;
}

// Update output
function updateOutput(element, text, isArabic = false) {
    if (!text) {
        element.innerHTML = '<p class="placeholder">Terjemahan tidak tersedia</p>';
        return;
    }
    
    element.innerHTML = `<p>${escapeHtml(text)}</p>`;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Copy ke clipboard
function copyToClipboard(target) {
    let text = '';
    let language = '';
    
    if (target === 'english') {
        text = getEnglishText();
        language = 'Inggris';
    } else {
        text = getArabicText();
        language = 'Arab';
    }
    
    if (!text) {
        showToast(`Tidak ada teks ${language} untuk disalin`, 'warning');
        return;
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showToast(`✓ Teks ${language} berhasil disalin!`, 'success');
                
                const btn = target === 'english' ? copyEnglishBtn : copyArabicBtn;
                btn.style.transform = 'scale(1.2)';
                btn.style.color = '#28a745';
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                    btn.style.color = '';
                }, 200);
            })
            .catch(() => {
                copyTextFallback(text, language);
            });
    } else {
        copyTextFallback(text, language);
    }
}

// Fallback copy
function copyTextFallback(text, language) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        const success = document.execCommand('copy');
        if (success) {
            showToast(`✓ Teks ${language} berhasil disalin!`, 'success');
        } else {
            showToast(`Gagal menyalin teks ${language}`, 'error');
        }
    } catch (err) {
        console.error('Copy failed:', err);
        showToast(`Gagal menyalin teks ${language}`, 'error');
    }
    
    document.body.removeChild(textarea);
}

// Mendapatkan teks dari output
function getEnglishText() {
    const p = englishOutput.querySelector('p');
    if (!p || p.classList.contains('placeholder')) return '';
    return p.textContent || '';
}

function getArabicText() {
    const p = arabicOutput.querySelector('p');
    if (!p || p.classList.contains('placeholder')) return '';
    return p.textContent || '';
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

// Toast notification
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// Cek status API
async function checkAPIStatus() {
    try {
        const response = await fetch('https://api.mymemory.translated.net/get?q=test&langpair=id|en');
        if (response.ok) {
            apiStatus.innerHTML = '<i class="fas fa-wifi"></i> Status: API Terhubung';
            apiStatus.style.color = '#28a745';
        } else {
            throw new Error('API tidak merespons');
        }
    } catch (error) {
        apiStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Status: Mode Demo';
        apiStatus.style.color = '#ffc107';
        showToast('Menggunakan mode demo (terjemahan terbatas)', 'warning');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        translate();
    }
    
    if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement === inputText || activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            clearInput();
        }
    }
    
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        stopSpeech();
        showToast('Speech dihentikan', 'info');
    }
});

// Double click pada output untuk copy
englishOutput.addEventListener('dblclick', () => {
    const text = getEnglishText();
    if (text) {
        copyToClipboard('english');
    }
});

arabicOutput.addEventListener('dblclick', () => {
    const text = getArabicText();
    if (text) {
        copyToClipboard('arabic');
    }
});

// Hentikan speech saat pindah halaman
window.addEventListener('beforeunload', () => {
    stopSpeech();
});

// Test speech di console (untuk debugging)
console.log('📢 Aplikasi siap, speech supported:', speechSupported);
