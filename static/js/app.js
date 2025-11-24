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

// Voice Cloning Elements
const cloningToggle = document.getElementById('cloningToggle');
const cloningContent = document.getElementById('cloningContent');
const recordBtn = document.getElementById('recordBtn');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const recordingTimer = document.getElementById('recordingTimer');
const recordingPreview = document.getElementById('recordingPreview');
const previewPlayer = document.getElementById('previewPlayer');
const voiceNameInput = document.getElementById('voiceNameInput');
const saveVoiceBtn = document.getElementById('saveVoiceBtn');
const customVoicesGroup = document.getElementById('customVoicesGroup');

// Recording State
let mediaRecorder;
let audioChunks = [];
let recordingStartTime;
let timerInterval;
let currentRecordedBlob;

// Voice Cloning Toggle
cloningToggle.addEventListener('click', () => {
    cloningToggle.classList.toggle('active');
    if (cloningContent.style.display === 'none' || !cloningContent.style.display) {
        cloningContent.style.display = 'block';
        cloningContent.style.animation = 'fadeIn 0.5s ease';
    } else {
        cloningContent.style.display = 'none';
    }
});

// Start Recording
recordBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            currentRecordedBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(currentRecordedBlob);
            previewPlayer.src = audioUrl;
            recordingPreview.style.display = 'block';
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        
        // UI Updates
        recordBtn.disabled = true;
        recordBtn.classList.add('recording');
        recordBtn.querySelector('#recordText').textContent = '錄音中...';
        stopRecordBtn.disabled = false;
        recordingPreview.style.display = 'none';
        
        // Timer
        recordingStartTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
        
    } catch (err) {
        console.error('Error accessing microphone:', err);
        showAlert('無法存取麥克風，請檢查權限設定', 'error');
    }
});

// Stop Recording
stopRecordBtn.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        
        // UI Updates
        recordBtn.disabled = false;
        recordBtn.classList.remove('recording');
        recordBtn.querySelector('#recordText').textContent = '重新錄音';
        stopRecordBtn.disabled = true;
        
        clearInterval(timerInterval);
    }
});

function updateTimer() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    recordingTimer.textContent = `${minutes}:${seconds}`;
}

// Save Voice
saveVoiceBtn.addEventListener('click', async () => {
    if (!currentRecordedBlob) {
        showAlert('沒有可保存的錄音', 'error');
        return;
    }
    
    const name = voiceNameInput.value.trim();
    if (!name) {
        showAlert('請輸入聲音名稱', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('audio', currentRecordedBlob, 'recording.wav');
    formData.append('name', name);
    
    saveVoiceBtn.disabled = true;
    saveVoiceBtn.textContent = '上傳中...';
    
    try {
        const response = await fetch('/api/upload_voice', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(`聲音 "${data.name}" 保存成功！`, 'success');
            
            // Add to select list
            addCustomVoiceOption(data.name, data.voice_id);
            
            // Select the new voice
            voiceSelect.value = data.voice_id;
            
            // Reset UI
            voiceNameInput.value = '';
            recordingPreview.style.display = 'none';
            recordingTimer.textContent = '00:00';
            recordBtn.querySelector('#recordText').textContent = '開始錄音';
        } else {
            throw new Error(data.error);
        }
        
    } catch (error) {
        console.error('Error uploading voice:', error);
        showAlert('保存聲音失敗: ' + error.message, 'error');
    } finally {
        saveVoiceBtn.disabled = false;
        saveVoiceBtn.textContent = '💾 保存聲音';
    }
});

function addCustomVoiceOption(name, id) {
    // Remove "No custom voices" option if it exists
    const placeholder = customVoicesGroup.querySelector('option[disabled]');
    if (placeholder) {
        placeholder.remove();
    }
    
    const option = document.createElement('option');
    option.value = id;
    option.textContent = `👤 ${name}`;
    customVoicesGroup.appendChild(option);
}

// Load available voices from API
async function loadVoices() {
    try {
        const response = await fetch('/api/voices');
        const data = await response.json();
        
        if (data.cloned && Object.keys(data.cloned).length > 0) {
            // Clear placeholder
            customVoicesGroup.innerHTML = '';
            
            Object.values(data.cloned).forEach(voice => {
                addCustomVoiceOption(voice.name, voice.id);
            });
        }
        
    } catch (error) {
        console.log('Could not load voices:', error);
    }
}

loadVoices();
