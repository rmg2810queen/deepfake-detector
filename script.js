const MODEL_BASE = "https://teachablemachine.withgoogle.com/models/TYncT1qs0/";
const modelURL = MODEL_BASE + "model.json";
const metadataURL = MODEL_BASE + "metadata.json";

let model;

const statusEl = document.getElementById("status");
const uploadEl = document.getElementById("upload");
const previewEl = document.getElementById("preview");
const resultsEl = document.getElementById("results");

async function loadModel() {
  statusEl.textContent = "Loading model…";
  model = await tmImage.load(modelURL, metadataURL);
  statusEl.textContent = "Model loaded. Upload an image.";
}

function pct(n) {
  return Math.round(n * 100);
}

function renderRow(label, probability) {
  const p = pct(probability);
  return `
    <div>
      <div class="label">${label}: ${p}%</div>
      <div class="bar"><div class="fill" style="width:${p}%"></div></div>
    </div>
  `;
}

uploadEl.addEventListener("change", (e) => {
  if (!model) return;

  const file = e.target.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  previewEl.src = url;
  previewEl.style.display = "block";
  statusEl.textContent = "Analyzing…";

  previewEl.onload = async () => {
    const predictions = await model.predict(previewEl);

    // sort so the top result is first
    predictions.sort((a, b) => b.probability - a.probability);

    resultsEl.innerHTML =
      renderRow(predictions[0].className, predictions[0].probability) +
      renderRow(predictions[1].className, predictions[1].probability);

    statusEl.textContent = "Done.";
  };
});

loadModel();
