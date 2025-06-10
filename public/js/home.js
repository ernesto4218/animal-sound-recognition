import audio from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@0.10.0";

    const { AudioClassifier, FilesetResolver } = audio;
    let audioClassifier;
    let isListening = false;
    const allowedCategories = ["Dog", "Cat", "Cow", "Domestic animals, pets", "Birds", "Bird", "Wild Animals", "Oink", "Pig", "Livestock, farm animals, working animals"];

    // audio store
    let audioCtx;
    const bufferLength = 16000 * 5; // 10 seconds @ 16kHz
    let recentBuffer = new Float32Array(bufferLength);
    let writeIndex = 0;


    const button = document.getElementById("microBt");
    const output = document.getElementById("microResult");
    const Allowedcontainer = document.getElementById("AlowedCategoryContainer");
    const resultContainer = document.getElementById("resultContainer");
    const otherResults = document.getElementById("otherResults");
    const realtimeLogsContainer = document.getElementById('realtimeLogsContainer');
    const predictionsLogsContainer = document.getElementById('predictionsLogsContainer');
    realtimeLogsContainer.innerHTML = '';
    predictionsLogsContainer.innerHTML = '';
    Allowedcontainer.innerHTML = "";

    allowedCategories.forEach(category => {
        const span = document.createElement("span");
        span.className = "bg-gray-600 text-gray-400 text-xs font-medium mt-2 me-2 px-2.5 py-0.5 rounded-sm border border-gray-500";
        span.textContent = category;
        Allowedcontainer.appendChild(span);
    });

    const createAudioClassifier = async () => {
      const audioFileset = await FilesetResolver.forAudioTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@0.10.0/wasm"
      );

      audioClassifier = await AudioClassifier.createFromOptions(audioFileset, {
        baseOptions: {
          modelAssetPath:
            "/models/yamnet.tflite"
        }
      });
    };

    await createAudioClassifier();

    button.addEventListener("click", async () => {
      if (!isListening) {
        await startClassification();
        button.innerText = "Stop Listening";
        isListening = true;
        resultContainer.innerHTML = "";
        otherResults.innerHTML = "";
      } else {
        await audioCtx.suspend();
        button.innerText = "Start Listening";
        isListening = false;
        resultContainer.innerHTML = "";
        otherResults.innerHTML = "";
      }
    });

    async function startClassification() {
        const constraints = { audio: true };
        let stream;

        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            alert("Microphone access error: " + err.message);
            return;
        }

        if (!audioCtx) {
            audioCtx = new AudioContext({ sampleRate: 16000 });
        } else {
            await audioCtx.resume();
        }

        const source = audioCtx.createMediaStreamSource(stream);
        const scriptNode = audioCtx.createScriptProcessor(16384, 1, 1);

        scriptNode.onaudioprocess = async function (audioProcessingEvent) {
            const inputBuffer = audioProcessingEvent.inputBuffer;
            const inputData = inputBuffer.getChannelData(0);

            // Copy to avoid mutation
            const copiedData = new Float32Array(inputData.length);
            copiedData.set(inputData);

            for (let i = 0; i < copiedData.length; i++) {
                recentBuffer[writeIndex] = copiedData[i];
                writeIndex = (writeIndex + 1) % bufferLength;
            }


            const result = await audioClassifier.classify(inputData);
            const categories = result[0].classifications[0].categories;

            // Split into filtered and others
            const filtered = categories
            .filter(c => allowedCategories.map(cat => cat.toLowerCase()).includes(c.categoryName.toLowerCase()))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);


            const others = categories
                .filter(c => !allowedCategories.includes(c.categoryName))
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

            // Clear containers
            resultContainer.innerHTML = "";
            otherResults.innerHTML = "";

            // Render allowed top 3
            filtered.forEach(category => {
                const percent = (category.score * 100).toFixed(1);

                const label = document.createElement("div");
                label.className = "text-[14px] font-medium text-black";
                label.innerText = `${category.categoryName} (${percent}%)`;

                const barBackground = document.createElement("div");
                barBackground.className = "mb-3 w-full h-6 bg-gray-200 rounded-full dark:bg-gray-700";

                const barFill = document.createElement("div");
                barFill.className = "h-6 bg-blue-500 rounded-full transition-all duration-300";
                barFill.style.width = `${percent}%`;

                barBackground.appendChild(barFill);
                resultContainer.appendChild(label);
                resultContainer.appendChild(barBackground);

            const lowerName = category.categoryName.toLowerCase();

                if (
                    (lowerName === 'wild animals' && percent >= 30) || // higher threshold for wild animals
                    (lowerName !== 'wild animals' && percent >= 13)    // normal threshold for others
                ) {
                    const audioData = getLast10SecondsAudio(); // Float32Array
                    const wavBlob = exportWav(audioData, 16000); // Blob
                    const wavURL = URL.createObjectURL(wavBlob);

                    console.log(category.categoryName);
                    addIdentifiedClip(category.categoryName, wavURL, percent);
                }
                
                if (percent >= 10) {
                    const logsel = document.createElement('span');
                    logsel.innerText = new Date().toLocaleString() + " | " + category.categoryName;
                    realtimeLogsContainer.appendChild(logsel);
                    
                    // Scroll to bottom
                    realtimeLogsContainer.scrollTop = realtimeLogsContainer.scrollHeight;
                }

                
            });

            // Render top 3 other results
            others.forEach(category => {
                const percent = (category.score * 100).toFixed(1);

                // Create a wrapper for label + bar (in column)
                const wrapper = document.createElement("div");
                wrapper.className = "flex flex-col w-[300px]";

                // Label above the bar
                const label = document.createElement("div");
                label.className = "text-xs text-black text-left mb-1";
                label.innerText = `${category.categoryName} (${percent}%)`;

                // Bar background
                const barBackground = document.createElement("div");
                barBackground.className = "w-full h-4 bg-gray-100 rounded-full dark:bg-gray-700";

                // Bar fill
                const barFill = document.createElement("div");
                barFill.className = "h-4 bg-gray-400 rounded-full transition-all duration-300";
                barFill.style.width = `${percent}%`;

                // Assemble
                barBackground.appendChild(barFill);
                wrapper.appendChild(label);
                wrapper.appendChild(barBackground);
                otherResults.appendChild(wrapper);


                // Limit number of logs to 50
                if (predictionsLogsContainer.children.length >= 50) {
                    predictionsLogsContainer.innerHTML = ''; // Remove all logs
                }

                const logsel = document.createElement('span');
                logsel.innerText = new Date().toLocaleString() + " | " + category.categoryName;
                predictionsLogsContainer.appendChild(logsel);

                // Scroll to bottom
                predictionsLogsContainer.scrollTop = predictionsLogsContainer.scrollHeight;

            });

            };

        source.connect(scriptNode);
        scriptNode.connect(audioCtx.destination);
    }

    // visualizer
    async function setupWaveformVisualizer() {
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 200;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();

    analyser.fftSize = 2048; // High for smoother waveform
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = '#111828'; // Tailwind's gray-800 background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#3b82f6'; // Tailwind blue-500

        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // normalize 0-255 to ~0-2
        const y = (v * canvas.height) / 2;

        if(i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
    }

    draw();
}

setupWaveformVisualizer().catch(e => {
  alert('Microphone access denied or not supported.');
  console.error(e);
});

// helper
function getLast10SecondsAudio() {
    const output = new Float32Array(bufferLength);
    const firstPart = recentBuffer.subarray(writeIndex);
    const secondPart = recentBuffer.subarray(0, writeIndex);
    output.set(firstPart);
    output.set(secondPart, firstPart.length);
    return output; // Float32Array of 10 seconds at 16kHz
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



function addIdentifiedClip(categoryName, audioBlob, confidence) {
    const container = document.getElementById("IdentifiedCOntainer");

    // Create container element
    const item = document.createElement("div");
    item.className = "bg-gray-100 rounded-xl p-3 flex flex-row gap-0 mt-2";

    // Image/avatar (you can customize based on category)
    const img = document.createElement("img");
    img.className = "w-15 h-15 rounded-full";
    
    if (categoryName.toLowerCase() === 'wild animals') {
        img.src = "/photos/wild_animals.png";
    } else if (categoryName.toLowerCase() === 'domestic animals, pets') {
        img.src = "/photos/domestic_animals.png";
    } else if (categoryName.toLowerCase() === 'cat') {
        img.src = "/photos/cat.png";
    } else if (categoryName.toLowerCase() === 'dog') {
        img.src = "/photos/dog.png";
    } else if (categoryName.toLowerCase() === 'bird') {
        img.src = "/photos/bird.png";
    } else if (categoryName.toLowerCase() === 'birds') {
        img.src = "/photos/birds.png";
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

}