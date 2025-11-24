// DOM Elements
const ttsForm = document.getElementById('ttsForm');
const textInput = document.getElementById('textInput');
const languageSelect = document.getElementById('languageSelect');
const voiceSelect = document.getElementById('voiceSelect');
const generateBtn = document.getElementById('generateBtn');
const outputSection = document.getElementById('outputSection');
const audioPlayer = document.getElementById('audioPlayer');
const downloadBtn = document.getElementById('downloadBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const alertBox = document.getElementById('alertBox');
const alertMessage = document.getElementById('alertMessage');
const charCount = document.getElementById('charCount');
const parametersInfo = document.getElementById('parametersInfo');

// Sliders
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const temperatureSlider = document.getElementById('temperatureSlider');
const temperatureValue = document.getElementById('temperatureValue');
const repetitionSlider = document.getElementById('repetitionSlider');
const repetitionValue = document.getElementById('repetitionValue');
const topPSlider = document.getElementById('topPSlider');
const topPValue = document.getElementById('topPValue');

// Advanced toggle
const advancedToggle = document.getElementById('advancedToggle');
const advancedContent = document.getElementById('advancedContent');

// Preset buttons
const presetButtons = document.querySelectorAll('.preset-btn');

// State
let currentAudioUrl = '';
let currentFilename = '';

// Quick presets configuration
const PRESETS = {
    formal: {
        speed: 0.9,
        temperature: 0.5,
        repetition_penalty: 2.5,
        top_p: 0.7
    },
    casual: {
        speed: 1.1,
        temperature: 0.75,
        repetition_penalty: 2.0,
        top_p: 0.85
    },
    excited: {
        speed: 1.3,
        temperature: 0.8,
        repetition_penalty: 1.8,
        top_p: 0.9
    },
    calm: {
        speed: 0.8,
        temperature: 0.4,
        repetition_penalty: 3.0,
        top_p: 0.6
    }
};

// Character count update
textInput.addEventListener('input', () => {
    charCount.textContent = textInput.value.length;
});

// Slider value updates
speedSlider.addEventListener('input', (e) => {
    speedValue.textContent = parseFloat(e.target.value).toFixed(1) + 'x';
});

temperatureSlider.addEventListener('input', (e) => {
    temperatureValue.textContent = parseFloat(e.target.value).toFixed(2);
});

repetitionSlider.addEventListener('input', (e) => {
    repetitionValue.textContent = parseFloat(e.target.value).toFixed(1);
});

topPSlider.addEventListener('input', (e) => {
    topPValue.textContent = parseFloat(e.target.value).toFixed(2);
});

// Advanced section toggle
advancedToggle.addEventListener('click', () => {
    advancedToggle.classList.toggle('active');
    advancedContent.classList.toggle('show');
});

// Preset buttons
presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        if (PRESETS[preset]) {
            applyPreset(PRESETS[preset]);
            
            // Visual feedback
            presetButtons.forEach(b => b.style.borderColor = 'rgba(102, 126, 234, 0.3)');
            btn.style.borderColor = 'rgba(102, 126, 234, 1)';
            
            setTimeout(() => {
                btn.style.borderColor = 'rgba(102, 126, 234, 0.3)';
            }, 2000);
        }
    });
});

function applyPreset(preset) {
    speedSlider.value = preset.speed;
    speedValue.textContent = preset.speed.toFixed(1) + 'x';
    
    temperatureSlider.value = preset.temperature;
    temperatureValue.textContent = preset.temperature.toFixed(2);
    
    repetitionSlider.value = preset.repetition_penalty;
    repetitionValue.textContent = preset.repetition_penalty.toFixed(1);
    
    topPSlider.value = preset.top_p;
    topPValue.textContent = preset.top_p.toFixed(2);
}

// Form submission
ttsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const text = textInput.value.trim();
    const language = languageSelect.value;
    const voice_preset = voiceSelect.value;
    const speed = parseFloat(speedSlider.value);
    const temperature = parseFloat(temperatureSlider.value);
    const repetition_penalty = parseFloat(repetitionSlider.value);
    const top_p = parseFloat(topPSlider.value);
    
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
                language: language,
                voice_preset: voice_preset,
                speed: speed,
                temperature: temperature,
                repetition_penalty: repetition_penalty,
                top_p: top_p
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
            
            // Display parameters
            if (data.parameters) {
                displayParameters(data.parameters);
            }
            
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

function displayParameters(params) {
    parametersInfo.innerHTML = `
        <strong>使用參數：</strong> 
        語音: ${params.voice} | 
        語速: ${params.speed}x | 
        創造性: ${params.temperature} | 
        重複懲罰: ${params.repetition_penalty} | 
        Top-P: ${params.top_p}
    `;
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
console.log('TTS App initialized with voice customization');

// Load available voices from API (optional enhancement)
async function loadVoices() {
    try {
        const response = await fetch('/api/voices');
        const voices = await response.json();
        console.log('Available voices:', voices);
        
        // Optionally populate voice select dynamically
        // This code keeps the hardcoded options but validates them
    } catch (error) {
        console.log('Could not load voices:', error);
    }
}

loadVoices();
