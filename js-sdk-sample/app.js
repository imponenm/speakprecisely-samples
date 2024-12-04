// app.js
// Initialize the SDK with your public key
const client = new SpeakPrecisely('YOUR_PUBLIC_KEY');

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

// Set up event handlers for the SpeakPrecisely client
client.on(TranscriptionEvents.Connected, () => {
    console.log('Connected to transcription service');
    isRecording = true;
    updateUI(true);
});

client.on(TranscriptionEvents.Disconnected, () => {
    console.log('Disconnected from transcription service');
    isRecording = false;
    updateUI(false);
});

client.on(TranscriptionEvents.Error, (error) => {
    console.error('Transcription error:', error);
    alert('An error occurred with the transcription service');
    isRecording = false;
    updateUI(false);
});

client.on(TranscriptionEvents.MaxConnectionsReached, () => {
    alert('Maximum connections reached. Please try again later.');
    isRecording = false;
    updateUI(false);
});

client.on(TranscriptionEvents.Transcript, (result) => {
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
});

// Handle record button clicks
recordButton.addEventListener('click', async () => {
    if (!isRecording) {
        try {
            await client.start({
                spokenLanguage: 'en-US',
                targetLanguages: ['es', 'fr']
            });
        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Failed to start recording. Please make sure you have given microphone permissions.');
        }
    } else {
        client.stop();
        isRecording = false;
        updateUI(false);
    }
});

