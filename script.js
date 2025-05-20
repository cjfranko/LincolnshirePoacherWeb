const staticAudio = document.getElementById("static");
const stopBtn = document.getElementById("stopBtn");
const consoleOutput = document.getElementById("console");
const themeToggleIcon = document.getElementById("themeToggleIcon");

let messageLog = "";
let shouldStop = false;
let transmissionStarted = false;
let staticStarted = false;
let transmitterPoweredOn = false;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioBuffers = { digits: {}, lifted: {}, ding: null, dong: null, tune: null };

async function loadAudioBuffer(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

async function preloadSounds() {
  for (let i = 0; i <= 9; i++) {
    audioBuffers.digits[i] = await loadAudioBuffer(`audio/${i}.wav`);
    audioBuffers.lifted[i] = await loadAudioBuffer(`audio/${i}_lifted.wav`);
  }
  audioBuffers.ding = await loadAudioBuffer("audio/ding.wav");
  audioBuffers.dong = await loadAudioBuffer("audio/dong.wav");
  audioBuffers.tune = await loadAudioBuffer("audio/tune.wav");
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
    setTimeout(resolve, (buffer.duration * 1000) + delay);
  });
}

function fadeAudio(audio, type = 'in', duration = 3000) {
  let vol = type === 'in' ? 0 : 1;
  audio.volume = vol;

  if (type === 'in') audio.play();

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

let logQueue = Promise.resolve();

function log(text) {
  logQueue = logQueue.then(() => typeLine(text));
}

async function typeLine(text) {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const previousCaret = document.querySelector(".line.typing");
    if (previousCaret) {
      previousCaret.classList.remove("typing");
      previousCaret.style.borderRight = "none";
    }

    const newLine = document.createElement("div");
    newLine.className = "line typing";
    newLine.textContent = "";
    consoleOutput.appendChild(newLine);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;

    messageLog += line + "\n";

    for (let i = 0; i < line.length; i++) {
      newLine.textContent += line[i];
      await wait(20);
    }

    await wait(250);
    newLine.classList.remove("typing");
    newLine.style.borderRight = "none";
  }
}

function showIdleCursor() {
  const cursor = document.createElement("div");
  cursor.className = "line typing";
  cursor.textContent = "> Press Enter to Start Transmission";
  consoleOutput.appendChild(cursor);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// 🌙 / ☀️ Theme toggle icon logic
themeToggleIcon.addEventListener("click", () => {
  const isBunker = document.body.classList.toggle("bunker");
  themeToggleIcon.textContent = isBunker ? "☀️" : "🌙";
});

// Stop button remains visible and works
stopBtn.addEventListener("click", () => {
  shouldStop = true;
  stopBtn.disabled = true;
  fadeAudio(staticAudio, 'out', 2000);
  log(">>> Transmission Aborted");
});

async function startTransmission() {
  if (transmissionStarted) return;
  transmissionStarted = true;

  stopBtn.disabled = false;
  await audioContext.resume();
  await preloadSounds();

  log(">>> Lincolnshire Poacher Transmission Initiated");
  log(">>> WARNING: This emulator is for educational and entertainment purposes only.");
  await wait(2000);

  const agentId = generateGroup();
  const message = Array.from({ length: 200 }, () => generateGroup());

  await playTune(12);
  log(`AGENT ID: ${agentId.join(" ")}`);

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
}

window.addEventListener("DOMContentLoaded", async () => {
  await wait(1000);
  await log("control login:");
  await wait(1000);

  const userId = "user" + Math.floor(Math.random() * 9000 + 1000);
  await log("> " + userId);
  await wait(500);

  const password = "*".repeat(8 + Math.floor(Math.random() * 4));
  await log("> " + password);
  await wait(700);

  await log("> ...");
  await wait(800);

  await log("Access Granted.");
  await wait(1000);

  await log("Press Enter to Turn on Transmitter");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const cursor = document.querySelector(".line.typing");
    if (cursor) cursor.remove();

    if (!transmitterPoweredOn) {
      transmitterPoweredOn = true;
      handleTransmitterInit();
    } else if (!transmissionStarted) {
      startTransmission();
    }
  }
});

async function handleTransmitterInit() {
  await log("Transmitter Initialising...");
  fadeAudio(staticAudio, 'in', 3000);
  await wait(5000);
  document.getElementById("mainControls").style.display = "flex";
  await log("Ready.");
  showIdleCursor();
}
// Toggle info dropdown
document.addEventListener("DOMContentLoaded", () => {
  const infoToggle = document.querySelector(".info-toggle");
  const infoContent = document.getElementById("e03Info");

  infoToggle.addEventListener("click", () => {
    infoContent.style.display = infoContent.style.display === "block" ? "none" : "block";
  });
});
