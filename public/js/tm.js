
let classLabels;
let listening = false;
let recognizerInstance = null;
let selectedDeviceId = null;

// audio store
let audioStream = null;
let audioCtx;
let actualSampleRate;
const bufferLength = 16000 * 5; 
let writeIndex = 0;
let recentBuffer;

const Allowedcontainer = document.getElementById("AlowedCategoryContainer");
const resultContainer = document.getElementById('resultContainer');
const otherResults = document.getElementById('otherResults');
const realtimeLogsContainer = document.getElementById('realtimeLogsContainer');
const predictionsLogsContainer = document.getElementById('predictionsLogsContainer');
const microBt = document.getElementById('microBt');
const el = document.getElementById('pass-data');
const settings = JSON.parse(el.dataset.settings || {});
const animalphotos = JSON.parse(el.dataset.classphoto || {});


// Allowedcontainer.innerHTML = "";
realtimeLogsContainer.innerHTML = '';
predictionsLogsContainer.innerHTML = '';

microBt.onclick = function() {
    if (listening) {
        stopListening();
        microBt.querySelector("#btntext").textContent = "Start Listening"

    } else {
        if (!selectedDeviceId){
            alert("Please select a mic.");
            return;
            
        }
        microBt.querySelector("#btntext").textContent = "Stop"
        init();
    }
};

async function listMicrophones() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter(device => device.kind === 'audioinput');

    const micList = document.getElementById('microphoneList');
    micList.innerHTML = '';

    mics.forEach(mic => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = "#";
        a.textContent = mic.label || `Microphone ${mic.deviceId}`;
        a.className = "block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white";
        a.onclick = () => {
            
            selectedDeviceId = mic.deviceId;
            dropdownDefaultButton.querySelector("#micselectedTXT").textContent = mic.label;
        };
        li.appendChild(a);
        micList.appendChild(li);
    });
}

const dropdownDefaultButton = document.getElementById('dropdownDefaultButton');
dropdownDefaultButton.onclick = function() {
    listMicrophones();
};


let modelURL;
const modelValue = settings.find(s => s.name === 'model')?.value;

if (modelValue) {
    modelURL = `http://localhost:3000/machinelearning/${modelValue}/`;
    // use modelURL here
    console.log(modelURL);
}

console.log();
async function createModel() {
    const checkpointURL = modelURL + "model.json"; // model topology
    const metadataURL = modelURL + "metadata.json"; // model metadata

    const recognizer = speechCommands.create(
        "BROWSER_FFT", // fourier transform type, not useful to change
        undefined, // speech commands vocabulary feature, not useful for your models
        checkpointURL,
        metadataURL);

    // check that model and metadata are loaded via HTTPS requests.
    await recognizer.ensureModelLoaded();

    return recognizer;
}

async function init(mic) {
    listening = true;

    recognizerInstance = await createModel();

    classLabels = recognizerInstance.wordLabels();
    console.log(classLabels);

    // Allowedcontainer.innerHTML = "";

    // classLabels.forEach(category => {
    //     const span = document.createElement("span");
    //     span.className = "bg-gray-600 text-gray-400 text-xs font-medium mt-2 me-2 px-2.5 py-0.5 rounded-sm border border-gray-500";
    //     span.textContent = category;
    //     Allowedcontainer.appendChild(span);
    // });

    if (recognizerInstance){
        console.log("Model is ready.");
    }

    // 👇 Tell the recognizer to use a specific mic by overriding the global audio context (workaround)
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: { selectedDeviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined }
    });

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    recognizerInstance.audioContext = audioContext;
    recognizerInstance.stream = stream;
    recognizerInstance.source = source;

    recognizerInstance.listen(result => {
        /// Convert scores object into array sorted by index keys
        const scores = Object.keys(result.scores)
            .sort((a, b) => Number(a) - Number(b))
            .map(key => result.scores[key]);

        // Map labels to scores
        const scoredLabels = classLabels.map((label, i) => ({
            label,
            score: scores[i]
        }));

        // Sort descending by score and take top 3
        const top3 = scoredLabels
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        const top4to6 = scoredLabels
            .sort((a, b) => b.score - a.score)
            .slice(3, 6);

        
        // Clear container once before appending new results
        resultContainer.innerHTML = "";
        otherResults.innerHTML = "";


        // Display or log top 3
        top3.forEach(({ label, score }) => {
            // console.log(`${label}: ${(score * 100).toFixed(2)}%`);

            const percent = (score * 100).toFixed(2);

            const labelDiv = document.createElement("div");
            labelDiv.className = "text-[14px] font-medium text-black";
            labelDiv.innerText = `${label} (${percent}%)`;

            const barBackground = document.createElement("div");
            barBackground.className = "mb-3 w-full h-6 bg-gray-200 rounded-full dark:bg-gray-700";

            const barFill = document.createElement("div");
            barFill.className = "h-6 bg-blue-500 rounded-full transition-all duration-300";
            barFill.style.width = `${percent}%`;

            barBackground.appendChild(barFill);
            resultContainer.appendChild(labelDiv);
            resultContainer.appendChild(barBackground);
            const allowList = settings.find(s => s.name === 'filter_allow')?.value
                ?.toLowerCase()
                .split(',')
                .map(s => s.trim()) || [];

            const allowedPercent = Number(settings.find(setting => setting.name === 'percent')?.value) || 50;

            if (percent >= allowedPercent && allowList.includes(label.toLowerCase())) {
                setTimeout(() => {
                    const audioData = getLast10SecondsAudio(); // Float32Array
                    const wavBlob = exportWav(audioData, actualSampleRate); // Blob
                    const wavURL = URL.createObjectURL(wavBlob);

                    // Audio playback
                    const audioDiv = document.createElement("div");
                    audioDiv.className = "text-sm font-medium text-black";
                    const audio = document.createElement("audio");
                    audio.controls = true;
                    audio.src = wavURL;
                    audioDiv.appendChild(audio);

                    addIdentifiedClip(label, wavURL, percent);

                    const logsel = document.createElement('span');
                    logsel.innerText = new Date().toLocaleString() + " | " + label + " | " + percent + "%";
                    realtimeLogsContainer.appendChild(logsel);
                    realtimeLogsContainer.scrollTop = realtimeLogsContainer.scrollHeight;
                }, 750); // Delay allows buffer to fully catch up (~750ms is a safe value)
            }

        });

        top4to6.forEach(({ label, score }) => {
            // console.log(`${label}: ${(score * 100).toFixed(2)}%`);

            const percent = (score * 100).toFixed(1);

            // Create a wrapper for label + bar (in column)
            const wrapper = document.createElement("div");
            wrapper.className = "flex flex-col w-[300px]";

            // Label above the bar
            const labelDiv = document.createElement("div");
            labelDiv.className = "text-xs text-black text-left mb-1";
            labelDiv.innerText = `${label} (${percent}%)`;

            // Bar background
            const barBackground = document.createElement("div");
            barBackground.className = "w-full h-4 bg-gray-100 rounded-full dark:bg-gray-700";

            // Bar fill
            const barFill = document.createElement("div");
            barFill.className = "h-4 bg-gray-400 rounded-full transition-all duration-300";
            barFill.style.width = `${percent}%`;

            // Assemble
            barBackground.appendChild(barFill);
            wrapper.appendChild(labelDiv);
            wrapper.appendChild(barBackground);
            otherResults.appendChild(wrapper);

            // Limit number of logs to 50
            if (predictionsLogsContainer.children.length >= 70) {
                predictionsLogsContainer.innerHTML = ''; // Remove all logs
            }

            const logsel = document.createElement('span');
            logsel.innerText = new Date().toLocaleString() + " | " + label + " | " + percent + "%";
            predictionsLogsContainer.appendChild(logsel);

            // Scroll to bottom
            predictionsLogsContainer.scrollTop = predictionsLogsContainer.scrollHeight;
        });
    }, {
        includeSpectrogram: true,
        probabilityThreshold: Number(settings.find(setting => setting.name === 'probability')?.value) || 0.75,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: Number(settings.find(s => s.name === 'overlap')?.value) || 0.5,
    });

    console.log(Number(settings.find(setting => setting.name === 'probability')?.value) || 0.75);
    console.log(Number(settings.find(s => s.name === 'overlap')?.value) || 0.5);


    // 👇 Your audio buffering logic
    audioStream = stream;
    audioCtx = audioContext;
    actualSampleRate = audioCtx.sampleRate;

    const secondsToStore = 5;
    recentBuffer = new Float32Array(actualSampleRate * secondsToStore);
    writeIndex = 0;

    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    processor.connect(audioCtx.destination);

    processor.onaudioprocess = e => {
        const input = e.inputBuffer.getChannelData(0);
        for (let i = 0; i < input.length; i++) {
            recentBuffer[writeIndex] = input[i];
            writeIndex = (writeIndex + 1) % recentBuffer.length;
        }
    };
}

async function stopListening() {
    listening = false;

    if (recognizerInstance) {
        recognizerInstance.stopListening();
    }

    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
    }

    if (audioCtx) {
        audioCtx.close();
    }

    console.log("Listening stopped.");
}


function getLast10SecondsAudio() {
    const output = new Float32Array(recentBuffer.length);
    const firstPart = recentBuffer.subarray(writeIndex);
    const secondPart = recentBuffer.subarray(0, writeIndex);
    output.set(firstPart);
    output.set(secondPart, firstPart.length);
    return output;
}

function exportWav(float32Array, sampleRate = 16000) {
    const buffer = new ArrayBuffer(44 + float32Array.length * 2);
    const view = new DataView(buffer);

    function writeString(view, offset, str) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }

    function floatTo16BitPCM(output, offset, input) {
        for (let i = 0; i < input.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, input[i]));
            s = s < 0 ? s * 0x8000 : s * 0x7FFF;
            view.setInt16(offset, s, true);
        }
    }

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + float32Array.length * 2, true); // file length
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(view, 36, 'data');
    view.setUint32(40, float32Array.length * 2, true); // data chunk length

    // Audio samples
    floatTo16BitPCM(view, 44, float32Array);

    return new Blob([view], { type: 'audio/wav' });
}


async function addIdentifiedClip(categoryName, audioBlob, confidence) {
    const container = document.getElementById("IdentifiedCOntainer");

    // Create container element
    const item = document.createElement("div");
    item.className = "bg-gray-100 rounded-xl p-3 flex flex-row gap-0 mt-2";

    // Image/avatar (you can customize based on category)
    const img = document.createElement("img");
    img.className = "w-15 h-15 rounded-full";

    const categoryLower = categoryName.toLowerCase();
    const match = animalphotos.find(animal =>
        animal.class_name.toLowerCase() === categoryLower
    );

    if (match) {
        img.src = `/photoclass/${match.image_name}`;
    } else {
        img.src = "https://placehold.co/400";
    }


    // Content wrapper
    const content = document.createElement("div");
    content.className = "flex flex-col pl-3";

    // Name
    const nameDiv = document.createElement("div");
    nameDiv.className = "text-sm font-medium text-black";
    nameDiv.innerText = categoryName;

    // confidence
    const confidenceDiv = document.createElement("div");
    confidenceDiv.className = "flex flex-row gap-2";
    confidenceDiv.innerHTML = `
    <p class="text-xs font-medium text-black">Confidence : </p>
    <span class="text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm bg-blue-900 text-blue-300">${confidence}</span>
    `;

    // Audio playback
    const audioDiv = document.createElement("div");
    audioDiv.className = "text-sm font-medium text-black";

    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = audioBlob;

    audioDiv.appendChild(audio);

    // Date
    const dateDiv = document.createElement("div");
    dateDiv.className = "text-xs font-normal text-gray-500";
    const now = new Date();
    dateDiv.innerText = now.toLocaleString();

    // Assemble
    content.appendChild(nameDiv);
    content.appendChild(confidenceDiv);
    content.appendChild(audioDiv);
    content.appendChild(dateDiv);

    item.appendChild(img);
    item.appendChild(content);

    // Add to the top of the container
    container.prepend(item);

    // record data
    const payload = {
      name: categoryName,
      img_path: match?.image_name ? `/photoclass/${match.image_name}` : '',
      percentage: confidence
    };

    try {
      const response = await fetch('/api/insert-logs-rt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer YOUR_TOKEN', // Optional: if auth is needed
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings.');
      }

      const result = await response.json();
      console.log(result);
      playSound(categoryName, `/photoclass/${match.image_name}`);
    } catch (error) {
      console.error('Error:', error);
      showToast('error', error)
    }
}

// notify sound
let alertSound;
function playSound(name, img) {
    microBt.click();

    const alertContainer = document.getElementById('alertContainer');
    alertContainer.classList.remove('hidden');
    alertContainer.classList.add('flex');

    alertContainer.querySelector('.animalIMG').src = img;
    alertContainer.querySelector('.animalnameTXT').textContent = name;

    if (!alertSound) {
        alertSound = new Audio('audio/system-notification-2-352442.mp3');
        alertSound.loop = true;
    }

    // If it's already playing, don't start again
    if (!alertSound.paused) return;

    alertSound.play();

    setTimeout(() => {
        alertSound.pause();
        alertSound.currentTime = 0;

        alertContainer.classList.add('hidden');
        alertContainer.classList.remove('flex');
        microBt.click();

    }, 7000);
}