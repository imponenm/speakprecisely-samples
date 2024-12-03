// app.js
class TranslationClient {
    constructor() {
        this.ws = null;
        this.mediaRecorder = null;
        this.stream = null;
        this.isConnected = false;
    }

    async connect(publicKey, spokenLanguage, targetLanguages) {
        try {
            // Get microphone access first
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Build WebSocket URL with parameters
            const params = new URLSearchParams({
                spokenLanguage,
                targetLanguages: targetLanguages.join(','),
                publicKey
            });
            
            // Connect to WebSocket server
            this.ws = new WebSocket(`wss://prod.speakprecisely.com/subtitles?${params}`);
            
            // Set up WebSocket event handlers
            this.ws.onopen = () => {
                this.isConnected = true;
                this.setupMediaRecorder();
                this.onConnected?.();
            };

            this.ws.onclose = () => {
                this.isConnected = false;
                this.onDisconnected?.();
            };

            this.ws.onerror = (error) => {
                this.onError?.(error);
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === "MAX_CONNECTIONS_REACHED") {
                    this.onMaxConnectionsReached?.();
                    this.disconnect();
                    return;
                }

                if (data.type === "Results") {
                    this.onTranscript?.(data);
                }
            };

        } catch (error) {
            this.onError?.(error);
            throw error;
        }
    }

    setupMediaRecorder() {
        if (!this.stream) return;

        this.mediaRecorder = new MediaRecorder(this.stream);
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(event.data);
            }
        };

        this.mediaRecorder.start(250); // Send audio chunks every 250ms
    }

    disconnect() {
        // Stop media recorder
        if (this.mediaRecorder?.state !== 'inactive') {
            this.mediaRecorder?.stop();
        }

        // Stop all tracks in the stream
        this.stream?.getTracks().forEach(track => track.stop());

        // Close WebSocket connection
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.close();
        }

        // Clear references
        this.mediaRecorder = null;
        this.stream = null;
        this.ws = null;
        this.isConnected = false;
    }
}

// Initialize the translation client
const client = new TranslationClient();

// DOM Elements
const recordButton = document.getElementById('recordButton');
const recordingIndicator = document.getElementById('recordingIndicator');
const transcriptBoxes = {
    'en-US': document.getElementById('en-US-transcript'),
    'es': document.getElementById('es-transcript'),
    'fr': document.getElementById('fr-transcript')
};

// State
let isRecording = false;

// Keep only the last 3 transcripts for each language
const transcriptHistory = {
    'en-US': [],
    'es': [],
    'fr': []
};

// Update the transcript display for a given language
function updateTranscriptDisplay(language) {
    const box = transcriptBoxes[language];
    if (!box) return;

    box.innerHTML = transcriptHistory[language]
        .map(text => `<p>${text}</p>`)
        .join('');
}

// Update UI to reflect recording state
function updateUI(recording) {
    const buttonText = recording ? 'Stop Recording' : 'Start Recording';
    const buttonIcon = recording ? '⏹️' : '🎤';
    
    recordButton.querySelector('.button-text').textContent = buttonText;
    recordButton.querySelector('.mic-icon').textContent = buttonIcon;
    recordButton.classList.toggle('recording', recording);
    recordingIndicator.classList.toggle('hidden', !recording);
}

// Set up event handlers for the translation client
client.onConnected = () => {
    console.log('Connected to transcription service');
    isRecording = true;
    updateUI(true);
};

client.onDisconnected = () => {
    console.log('Disconnected from transcription service');
    isRecording = false;
    updateUI(false);
};

client.onError = (error) => {
    console.error('Transcription error:', error);
    alert('An error occurred with the transcription service');
    isRecording = false;
    updateUI(false);
};

client.onMaxConnectionsReached = () => {
    alert('Maximum connections reached. Please try again later.');
    isRecording = false;
    updateUI(false);
};

client.onTranscript = (result) => {
    if (result.is_final || result.speech_final) {
        // Update English transcript
        transcriptHistory['en-US'].push(result.spokenLanguage);
        if (transcriptHistory['en-US'].length > 3) {
            transcriptHistory['en-US'].shift();
        }
        updateTranscriptDisplay('en-US');

        // Update translations
        Object.entries(result.targetLanguages).forEach(([lang, text]) => {
            if (transcriptHistory[lang]) {
                transcriptHistory[lang].push(text);
                if (transcriptHistory[lang].length > 3) {
                    transcriptHistory[lang].shift();
                }
                updateTranscriptDisplay(lang);
            }
        });
    }
};

// Handle record button clicks
recordButton.addEventListener('click', async () => {
    if (!isRecording) {
        try {
            await client.connect('YOUR_PUBLIC_KEY', 'en-US', ['es', 'fr']);
        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Failed to start recording. Please make sure you have given microphone permissions.');
        }
    } else {
        client.disconnect();
        isRecording = false;
        updateUI(false);
    }
});