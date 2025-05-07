const staticAudio = document.getElementById("static");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const consoleOutput = document.getElementById("console");
const downloadBtn = document.getElementById("downloadLog");
const themeToggle = document.getElementById("themeToggle");

let messageLog = "";
let shouldStop = false;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioBuffers = { digits: {}, lifted: {}, ding: null, dong: null, tune: null };

// Load WAV into audio buffer
async function loadAudioBuffer(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

// Preload all sounds into buffers
async function preloadSounds() {
  for (let i = 0; i <= 9; i++) {
    audioBuffers.digits[i] = await loadAudioBuffer(`audio/${i}.wav`);
    audioBuffers.lifted[i] = await loadAudioBuffer(`audio/${i}_lifted.wav`);
  }
  audioBuffers.ding = await loadAudioBuffer("audio/ding.wav");
  audioBuffers.dong = await loadAudioBuffer("audio/dong.wav");
  audioBuffers.tune = await loadAudioBuffer("audio/tune.wav");
}

function log(line) {
  const newLine = document.createElement("div");
  newLine.className = "line";
  newLine.textContent = line;
  consoleOutput.appendChild(newLine);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;

  messageLog += line + "\n";
}


function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function playBuffer(buffer, delay = 0) {
  return new Promise(resolve => {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
    const totalTime = (buffer.duration * 1000) + delay;
    setTimeout(resolve, totalTime);
  });
}

function fadeAudio(audio, type = 'in', duration = 3000) {
  let vol = type === 'in' ? 0 : 1;
  audio.volume = vol;
  audio.play();

  const step = 50;
  const interval = setInterval(() => {
    vol += (type === 'in' ? 1 : -1) * (step / duration);
    vol = Math.min(Math.max(vol, 0), 1);
    audio.volume = vol;

    if ((type === 'in' && vol >= 1) || (type === 'out' && vol <= 0)) {
      clearInterval(interval);
      if (type === 'out') audio.pause();
    }
  }, step);
}

function generateGroup() {
  return [...Array(5)].map(() => Math.floor(Math.random() * 10));
}

async function playGroup(group) {
  for (let i = 0; i < 4; i++) {
    if (shouldStop) return;
    await playBuffer(audioBuffers.digits[group[i]], 500);
  }
  if (!shouldStop) {
    await playBuffer(audioBuffers.lifted[group[4]], 1000);
  }
}

async function playChimes(times = 6) {
  for (let i = 1; i <= times; i++) {
    if (shouldStop) return;
    log(`Chime ${i}/${times}`);
    await playBuffer(audioBuffers.ding, 500);
    await playBuffer(audioBuffers.dong, 1000);
  }
}

async function playTune(times = 12) {
  for (let i = 1; i <= times; i++) {
    if (shouldStop) return;
    log(`Interval Signal: Lincolnshire Poacher (${i}/${times})`);
    await playBuffer(audioBuffers.tune, 500);
  }
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

themeToggle.addEventListener('change', () => {
  document.body.classList.toggle("bunker", themeToggle.checked);
});

stopBtn.addEventListener("click", () => {
  shouldStop = true;
  stopBtn.disabled = true;
  startBtn.disabled = false;
  fadeAudio(staticAudio, 'out', 2000);
  log(">>> Transmission Aborted");
});

startBtn.addEventListener("click", async () => {
  shouldStop = false;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  downloadBtn.disabled = true;
  await audioContext.resume();

  log(">>> Lincolnshire Poacher Transmission Initiated");
  log(">>> WARNING: This emulator is for educational and entertainment purposes only.");
  await wait(2000);

  fadeAudio(staticAudio, 'in', 3000);
  await wait(3000);
  await preloadSounds();

  const agentId = generateGroup();
  const message = Array.from({ length: 200 }, () => generateGroup());

  log(`AGENT ID: ${agentId.join(" ")}`);
  await playTune(12);

  for (let i = 0; i < 10 && !shouldStop; i++) {
    log(`Agent ID Repeat ${i + 1}/10`);
    await playGroup(agentId);
  }

  await playChimes();

  for (let i = 0; i < message.length && !shouldStop; i++) {
    const group = message[i];
    log(`Group ${i + 1}/200: ${group.join(" ")}`);
    await playGroup(group);
    if (!shouldStop) await playGroup(group);
  }

  if (!shouldStop) {
    await playChimes();
    await playTune(6);
    log(">>> Transmission Complete");
  }

  fadeAudio(staticAudio, 'out', 3000);
  stopBtn.disabled = true;
  startBtn.disabled = false;
  downloadBtn.disabled = false;

  downloadBtn.addEventListener("click", () => {
    downloadTextFile("lincolnshire_poacher_log.txt", messageLog);
  });
});
