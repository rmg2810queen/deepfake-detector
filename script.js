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
  try {
    model = await tmImage.load(modelURL, metadataURL);
    statusEl.textContent = "Model loaded. Upload an image.";
  } catch (err) {
    console.error("Model load failed:", err);
    statusEl.textContent = "Model failed to load. Open console for error.";
  }
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

function buildTrustReport(predictions) {
  // Find AI-ish class (works even if your class name is "AI Face", "Fake", etc.)
  const aiItem = predictions.find(p => {
    const name = p.className.toLowerCase();
    return name.includes("ai") || name.includes("fake");
  });

  const aiProb = aiItem ? aiItem.probability : 0;
  const aiPct = pct(aiProb);

  let level = "LOW";
  let msg = "Looks more like a real photo, but still be cautious online.";
  let tips = [
    "Check the source of the image/profile.",
    "Be cautious if the account is new or has few posts."
  ];

  if (aiProb >= 0.70) {
    level = "HIGH";
    msg = "High chance this image is AI-generated. Use extra caution.";
    tips = [
      "Reverse image search the profile picture.",
      "Ask for a live photo/verification if it’s someone you don’t know.",
      "Watch for odd ears, weird hair edges, or overly smooth skin."
    ];
  } else if (aiProb >= 0.40) {
    level = "MEDIUM";
    msg = "Uncertain result. This image has some AI-like signs.";
    tips = [
      "Zoom in on eyes, teeth, hairline, and ears for distortions.",
      "Look for mismatched lighting or blurry edges.",
      "Cross-check the account with other info (posts/history)."
    ];
  }

  return `
    <hr />
    <h2>Trust Report</h2>
    <p><strong>AI-Likelihood:</strong> ${level}</p>
    <p><strong>AI Probability:</strong> ${aiPct}%</p>
    <p>${msg}</p>
    <ul>${tips.map(t => `<li>${t}</li>`).join("")}</ul>
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
    try {
      const predictions = await model.predict(previewEl);

      // Sort high → low
      predictions.sort((a, b) => b.probability - a.probability);

      resultsEl.innerHTML =
        renderRow(predictions[0].className, predictions[0].probability) +
        renderRow(predictions[1].className, predictions[1].probability) +
        buildTrustReport(predictions);

      statusEl.textContent = "Done.";
    } catch (err) {
      console.error("Prediction failed:", err);
      statusEl.textContent = "Prediction failed. Open console for error.";
    }
  };
});

loadModel();
