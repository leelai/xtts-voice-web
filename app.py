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
os.makedirs(AUDIO_DIR, exist_ok=True)

# Create default speaker reference if not exists
SPEAKER_WAV_PATH =  os.path.join(AUDIO_DIR, 'default_speaker.wav')

def create_default_speaker():
    """Create a default speaker reference audio file if it doesn't exist"""
    if not os.path.exists(SPEAKER_WAV_PATH):
        try:
            print("Creating default speaker reference...")
            # Use a simple TTS model to generate reference audio
            simple_tts = TTS("tts_models/en/ljspeech/tacotron2-DDC")
            simple_tts.tts_to_file(
                "This is a sample voice for text to speech synthesis.",
                file_path=SPEAKER_WAV_PATH
            )
            print(f"Default speaker reference created at: {SPEAKER_WAV_PATH}")
        except Exception as e:
            print(f"Could not create default speaker: {e}")
            # Create a simple silent audio as fallback
            sample_rate = 22050
            duration = 3  # 3 seconds
            samples = np.zeros(int(sample_rate * duration))
            sf.write(SPEAKER_WAV_PATH, samples, sample_rate)

# Create default speaker on startup
create_default_speaker()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    try:
        data = request.get_json()
        text = data.get('text', '')
        language = data.get('language', 'zh-cn')
        
        if not text:
            return jsonify({'error': '請輸入文字'}), 400
        
        # Generate unique filename
        filename = f"speech_{uuid.uuid4().hex[:8]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
        output_path = os.path.join(AUDIO_DIR, filename)
        
        # Generate speech using XTTS-v2
        print(f"Generating speech for text: {text[:50]}...")
        print(f"Using speaker reference: {SPEAKER_WAV_PATH}")
        
        # Generate with speaker_wav
        tts.tts_to_file(
            text=text,
            speaker_wav=SPEAKER_WAV_PATH,
            language=language,
            file_path=output_path
        )
        
        print(f"Speech generated successfully: {filename}")
        
        # Return the audio file URL
        audio_url = f"/static/audio/{filename}"
        
        return jsonify({
            'success': True,
            'audio_url': audio_url,
            'filename': filename
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
            # Skip the default speaker reference
            if file == 'default_speaker.wav':
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
