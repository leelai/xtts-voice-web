// DOM Elements
const ttsForm = document.getElementById('ttsForm');
const textInput = document.getElementById('textInput');
const languageSelect = document.getElementById('languageSelect');
const generateBtn = document.getElementById('generateBtn');
const outputSection = document.getElementById('outputSection');
const audioPlayer = document.getElementById('audioPlayer');
const downloadBtn = document.getElementById('downloadBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const alertBox = document.getElementById('alertBox');
const alertMessage = document.getElementById('alertMessage');
const charCount = document.getElementById('charCount');

// State
let currentAudioUrl = '';
let currentFilename = '';

// Character count update
textInput.addEventListener('input', () => {
    charCount.textContent = textInput.value.length;
});

// Form submission
ttsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const text = textInput.value.trim();
    const language = languageSelect.value;
    
    if (!text) {
        showAlert('請輸入文字', 'error');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    hideAlert();
    hideOutput();
    
    try {
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                language: language
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '發生未知錯誤');
        }
        
        if (data.success) {
            currentAudioUrl = data.audio_url;
            currentFilename = data.filename;
            
            // Load and play audio
            audioPlayer.src = currentAudioUrl;
            audioPlayer.load();
            
            // Show output section with animation
            showOutput();
            showAlert('語音生成成功！', 'success');
            
            // Auto play after a short delay
            setTimeout(() => {
                audioPlayer.play().catch(err => {
                    console.log('Auto-play prevented:', err);
                });
            }, 300);
        }
        
    } catch (error) {
        console.error('Error:', error);
        showAlert(error.message || '生成語音時發生錯誤，請稍後再試', 'error');
    } finally {
        setLoadingState(false);
    }
});

// Download button
downloadBtn.addEventListener('click', () => {
    if (currentAudioUrl) {
        const link = document.createElement('a');
        link.href = currentAudioUrl;
        link.download = currentFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showAlert('開始下載音訊檔案', 'success');
    }
});

// Helper functions
function setLoadingState(isLoading) {
    if (isLoading) {
        loadingIndicator.style.display = 'block';
        generateBtn.disabled = true;
        generateBtn.querySelector('span').textContent = '生成中...';
    } else {
        loadingIndicator.style.display = 'none';
        generateBtn.disabled = false;
        generateBtn.querySelector('span').textContent = '生成語音';
    }
}

function showOutput() {
    outputSection.style.display = 'block';
    outputSection.style.animation = 'fadeInUp 0.5s ease';
}

function hideOutput() {
    outputSection.style.display = 'none';
}

function showAlert(message, type = 'error') {
    alertMessage.textContent = message;
    alertBox.style.display = 'block';
    alertBox.className = type === 'success' ? 'alert success' : 'alert';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideAlert();
    }, 5000);
}

function hideAlert() {
    alertBox.style.display = 'none';
}

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// Initialize
console.log('TTS App initialized');
