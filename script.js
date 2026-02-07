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
    console.log("Trying to load:", modelURL, metadataURL);

    model = await tmImage.load(modelURL, metadataURL);

    statusEl.textContent = "Model loaded. Upload an image.";
    console.log("Model loaded OK");
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
  // Find the AI class probability (tries common names)
  const ai = predictions.find(p =>
    p.className.toLowerCase().includes("ai") ||
    p.className.toLowerCase().includes("fake")
  );

  const aiProb = ai ? ai.probability : 0;
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
      "Ask for a live photo/verification if it’s a person you don’t know.",
      "Watch for too-perfect skin, odd ears, or weird hair edges."
    ];
  } else if (aiProb >= 0.40) {
    level = "MEDIUM";
    msg = "Uncertain result. This image has some AI-like signs.";
    tips = [
      "Zoom in on eyes, teeth, hairline, and ears for distortions.",
      "Look for mismatched lighting or blurry edges.",
      "Cross-check the account with other info (friends, posts, history)."
    ];
  }

  return `
    <hr />
    <h2>Trust Report</h2>
    <p><strong>AI-Likelihood:</strong> ${level}</p>
    <p><strong>AI Probability:</strong> ${aiPct}%</p>
    <p>${msg}</p>
    <ul>
      ${tips.map(t => `<li>${t}</li>`).join("")}
    </ul>
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
      renderRow(predictions[1].className, predictions[1].probability) +
      buildTrustReport(predictions);

    statusEl.textContent = "Done.";
";
  };
});

loadModel();
