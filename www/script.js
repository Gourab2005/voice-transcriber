const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const clearBtn = document.getElementById('clear-btn');
const transcriptDiv = document.getElementById('transcript');
const interimDiv = document.getElementById('interim');
const deviceNameDisplay = document.getElementById('device-name');
const statusText = document.getElementById('status-text');
const statusDot = document.getElementById('status-dot');
const recordingTime = document.getElementById('recording-time');

let recognition;
let isListening = false;
let startTime;
let timerInterval;

// Initialize Web Speech API
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        updateUI(true);
        startTimer();
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript) {
            const p = document.createElement('p');
            p.className = 'fade-in';
            p.textContent = finalTranscript;
            
            // Remove placeholder if it's the first message
            if (transcriptDiv.querySelector('.italic')) {
                transcriptDiv.innerHTML = '';
            }
            
            transcriptDiv.appendChild(p);
            transcriptDiv.scrollTop = transcriptDiv.scrollHeight;
        }

        interimDiv.textContent = interimTranscript;
    };

    recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
        stopListening();
        statusText.textContent = `Error: ${event.error}`;
        statusText.classList.add('text-rose-400');
    };

    recognition.onend = () => {
        if (isListening) {
            // Restart if it was supposed to be continuous (sometimes it stops)
            recognition.start();
        } else {
            updateUI(false);
            stopTimer();
        }
    };
} else {
    deviceNameDisplay.textContent = "Speech Recognition not supported in this browser.";
    startBtn.disabled = true;
}

// Device Enumeration
async function updateDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        // Find if there's a bluetooth device or just use the first one
        const activeDevice = audioInputs.find(d => d.label.toLowerCase().includes('bluetooth')) || audioInputs[0];
        
        if (activeDevice && activeDevice.label) {
            deviceNameDisplay.textContent = activeDevice.label;
        } else if (audioInputs.length > 0) {
            deviceNameDisplay.textContent = 'Default Microphone';
        } else {
            deviceNameDisplay.textContent = 'No microphone found';
        }
    } catch (err) {
        console.error('Error listing devices:', err);
        deviceNameDisplay.textContent = 'Microphone access denied';
    }
}

// Permissions and Initialization
async function init() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await updateDevices();
    } catch (err) {
        deviceNameDisplay.textContent = 'Microphone permission needed';
    }
}

function startListening() {
    if (recognition && !isListening) {
        recognition.start();
    }
}

function stopListening() {
    if (recognition && isListening) {
        isListening = false;
        recognition.stop();
    }
}

function updateUI(listening) {
    if (listening) {
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        statusDot.classList.replace('bg-slate-600', 'bg-rose-500');
        statusDot.classList.add('pulse');
        statusText.textContent = 'Listening...';
        statusText.classList.remove('text-rose-400');
    } else {
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        statusDot.classList.replace('bg-rose-500', 'bg-slate-600');
        statusDot.classList.remove('pulse');
        statusText.textContent = 'Idle';
    }
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const totalSeconds = Math.floor(elapsed / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        recordingTime.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

startBtn.addEventListener('click', startListening);
stopBtn.addEventListener('click', stopListening);
clearBtn.addEventListener('click', () => {
    transcriptDiv.innerHTML = '<p class="italic text-slate-500 text-base">Transcription cleared...</p>';
    interimDiv.textContent = '';
});

// Watch for device changes (e.g., Bluetooth connected/disconnected)
navigator.mediaDevices.ondevicechange = updateDevices;

// Run initial check
init();
