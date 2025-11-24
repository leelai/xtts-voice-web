from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from TTS.api import TTS
import os
import uuid
from datetime import datetime
import numpy as np
import soundfile as sf

app = Flask(__name__)
CORS(app)

# Initialize TTS model
print("Loading Coqui XTTS-v2 model...")
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
print("Model loaded successfully!")

# Audio output directory
AUDIO_DIR = os.path.join(app.static_folder, 'audio')
VOICES_DIR = os.path.join(app.static_folder, 'audio', 'voices')
CLONED_VOICES_DIR = os.path.join(app.static_folder, 'audio', 'cloned')
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(VOICES_DIR, exist_ok=True)
os.makedirs(CLONED_VOICES_DIR, exist_ok=True)

# Voice presets configuration with VCTK model for diversity
VOICE_PRESETS = {
    'female_soft': {
        'name': '女聲 - 溫柔',
        'file': 'female_soft.wav',
        'model': 'tts_models/en/vctk/vits',
        'speaker': 'p225',  # Female speaker
        'text': 'Hello, I am a gentle and soft female voice for your text to speech application.'
    },
    'female_bright': {
        'name': '女聲 - 活潑',
        'file': 'female_bright.wav',
        'model': 'tts_models/en/vctk/vits',
        'speaker': 'p234',  # Female speaker
        'text': 'Hi there! I am an energetic and bright female voice ready to help you!'
    },
    'male_deep': {
        'name': '男聲 - 深沉',
        'file': 'male_deep.wav',
        'model': 'tts_models/en/vctk/vits',
        'speaker': 'p226',  # Male speaker
        'text': 'Greetings, I am a deep male voice with a professional and authoritative tone.'
    },
    'neutral': {
        'name': '中性聲音',
        'file': 'neutral.wav',
        'model': 'tts_models/en/vctk/vits',
        'speaker': 'p230',  # Neutral/Male speaker
        'text': 'Hello, I am a neutral voice suitable for general purposes and various applications.'
    }
}

def create_voice_presets():
    """Create voice preset files if they don't exist"""
    for preset_id, preset_info in VOICE_PRESETS.items():
        voice_path = os.path.join(VOICES_DIR, preset_info['file'])
        if not os.path.exists(voice_path):
            try:
                print(f"Creating voice preset: {preset_info['name']}...")
                temp_tts = TTS(preset_info['model'])
                
                # Generate with specific speaker
                temp_tts.tts_to_file(
                    text=preset_info['text'],
                    speaker=preset_info['speaker'],
                    file_path=voice_path
                )
                print(f"✓ Created: {preset_info['name']} (Speaker: {preset_info['speaker']})")
            except Exception as e:
                print(f"Error creating {preset_info['name']}: {e}")
                # Create silent audio as fallback
                sample_rate = 22050
                duration = 3
                samples = np.zeros(int(sample_rate * duration))
                sf.write(voice_path, samples, sample_rate)

# Create voice presets on startup
create_voice_presets()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/voices', methods=['GET'])
def get_voices():
    """Return available voice presets and cloned voices"""
    voices = {
        'presets': {},
        'cloned': {}
    }
    
    # Add presets
    for preset_id, preset_info in VOICE_PRESETS.items():
        voices['presets'][preset_id] = {
            'name': preset_info['name'],
            'id': preset_id
        }
        
    # Add cloned voices
    try:
        cloned_files = os.listdir(CLONED_VOICES_DIR)
        for file in cloned_files:
            if file.endswith('.wav'):
                # Filename format: name_id.wav
                name_part = file.rsplit('_', 1)[0]
                voice_id = file
                voices['cloned'][voice_id] = {
                    'name': name_part,
                    'id': voice_id
                }
    except Exception as e:
        print(f"Error listing cloned voices: {e}")
        
    return jsonify(voices)

@app.route('/api/upload_voice', methods=['POST'])
def upload_voice():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
            
        audio_file = request.files['audio']
        name = request.form.get('name', 'Custom Voice')
        
        # Sanitize name
        safe_name = "".join([c for c in name if c.isalpha() or c.isdigit() or c==' ']).rstrip()
        safe_name = safe_name.replace(' ', '_')
        if not safe_name:
            safe_name = "custom_voice"
            
        # Generate unique filename
        voice_id = f"{safe_name}_{uuid.uuid4().hex[:8]}"
        filename = f"{voice_id}.wav"
        
        # Save to temp file first
        temp_path = os.path.join(CLONED_VOICES_DIR, f"temp_{filename}")
        final_path = os.path.join(CLONED_VOICES_DIR, filename)
        
        audio_file.save(temp_path)
        
        # Convert to WAV using ffmpeg
        import subprocess
        try:
            # Convert to 22050Hz mono 16-bit PCM WAV (standard for TTS)
            command = [
                'ffmpeg', '-y',
                '-i', temp_path,
                '-acodec', 'pcm_s16le',
                '-ac', '1',
                '-ar', '22050',
                final_path
            ]
            subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Remove temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg conversion error: {e.stderr.decode()}")
            # If conversion fails, try to use the original file (rename it)
            if os.path.exists(temp_path):
                os.rename(temp_path, final_path)
            return jsonify({'error': 'Audio conversion failed'}), 500
        
        return jsonify({
            'success': True,
            'voice_id': filename,
            'name': safe_name
        })
        
    except Exception as e:
        print(f"Error uploading voice: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    try:
        data = request.get_json()
        text = data.get('text', '')
        language = data.get('language', 'zh-cn')
        
        # Voice customization parameters
        voice_preset = data.get('voice_preset', 'female_soft')
        speed = float(data.get('speed', 1.0))
        temperature = float(data.get('temperature', 0.65))
        repetition_penalty = float(data.get('repetition_penalty', 2.0))
        top_p = float(data.get('top_p', 0.8))
        
        # Validate parameters
        speed = max(0.5, min(2.0, speed))
        temperature = max(0.1, min(1.0, temperature))
        repetition_penalty = max(1.0, min(10.0, repetition_penalty))
        top_p = max(0.1, min(1.0, top_p))
        
        if not text:
            return jsonify({'error': '請輸入文字'}), 400
        
        # Get speaker wav path
        speaker_wav = None
        voice_name = "Unknown"
        
        # Check if it's a preset
        if voice_preset in VOICE_PRESETS:
            speaker_wav = os.path.join(VOICES_DIR, VOICE_PRESETS[voice_preset]['file'])
            voice_name = VOICE_PRESETS[voice_preset]['name']
        # Check if it's a cloned voice (filename)
        else:
            potential_path = os.path.join(CLONED_VOICES_DIR, voice_preset)
            if os.path.exists(potential_path):
                speaker_wav = potential_path
                voice_name = voice_preset.rsplit('_', 1)[0]
            else:
                # Fallback
                speaker_wav = os.path.join(VOICES_DIR, VOICE_PRESETS['female_soft']['file'])
                voice_name = "Fallback (Female Soft)"
        
        if not os.path.exists(speaker_wav):
            return jsonify({'error': '語音檔案不存在'}), 500
        
        # Generate unique filename
        filename = f"speech_{uuid.uuid4().hex[:8]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
        output_path = os.path.join(AUDIO_DIR, filename)
        
        # Generate speech using XTTS-v2 with custom parameters
        print(f"Generating speech:")
        print(f"  Text: {text[:50]}...")
        print(f"  Voice: {voice_name}")
        print(f"  Speed: {speed}x")
        print(f"  Temperature: {temperature}")
        
        # Generate with all parameters
        tts.tts_to_file(
            text=text,
            speaker_wav=speaker_wav,
            language=language,
            file_path=output_path,
            speed=speed,
            temperature=temperature,
            repetition_penalty=repetition_penalty,
            top_p=top_p
        )
        
        print(f"✓ Speech generated successfully: {filename}")
        
        # Return the audio file URL
        audio_url = f"/static/audio/{filename}"
        
        return jsonify({
            'success': True,
            'audio_url': audio_url,
            'filename': filename,
            'parameters': {
                'voice': voice_name,
                'speed': speed,
                'temperature': temperature,
                'repetition_penalty': repetition_penalty,
                'top_p': top_p
            }
        })
        
    except Exception as e:
        print(f"Error generating speech: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'生成語音時發生錯誤: {str(e)}'}), 500

@app.route('/static/audio/<filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_DIR, filename)

# Clean up old audio files on startup (optional)
def cleanup_old_files():
    try:
        files = os.listdir(AUDIO_DIR)
        for file in files:
            # Skip voice presets directory
            if file == 'voices':
                continue
                
            file_path = os.path.join(AUDIO_DIR, file)
            if os.path.isfile(file_path):
                # Delete files older than 1 hour
                file_age = datetime.now().timestamp() - os.path.getmtime(file_path)
                if file_age > 3600:  # 1 hour in seconds
                    os.remove(file_path)
                    print(f"Cleaned up old file: {file}")
    except Exception as e:
        print(f"Error cleaning up files: {e}")

if __name__ == '__main__':
    cleanup_old_files()
    app.run(debug=True, host='0.0.0.0', port=5001)
