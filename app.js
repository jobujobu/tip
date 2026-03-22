const amountInput = document.getElementById("amount");
const tipInput = document.getElementById("tipPercent");

const amountMinus = document.getElementById("amountMinus");
const amountPlus = document.getElementById("amountPlus");
const tipMinus = document.getElementById("tipMinus");
const tipPlus = document.getElementById("tipPlus");

const tipAmountEl = document.getElementById("tipAmount");
const totalUsdEl = document.getElementById("totalUsd");
const totalEurEl = document.getElementById("totalEur");
const rateInfoEl = document.getElementById("rateInfo");
const resetBtn = document.getElementById("resetBtn");

const quickTipButtons = document.querySelectorAll(".quick-tip-btn");
const resultsCard = document.querySelector(".results");

const FALLBACK_RATE = 0.92;
let usdToEurRate = FALLBACK_RATE;
let rateDateLabel = "";

function parseValue(value) {
  const normalized = String(value).replace(",", ".");
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : 0;
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function formatEur(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

function saveValues() {
  localStorage.setItem("lastAmount", amountInput.value);
  localStorage.setItem("lastTipPercent", tipInput.value);
}

function loadSavedValues() {
  const savedAmount = localStorage.getItem("lastAmount");
  const savedTip = localStorage.getItem("lastTipPercent");

  if (savedAmount !== null) {
    amountInput.value = savedAmount;
  }

  if (savedTip !== null) {
    tipInput.value = savedTip;
  }
}

function updateCalculation() {
  const amount = Math.max(0, parseValue(amountInput.value));
  const tipPercent = Math.max(0, parseValue(tipInput.value));

  const tipAmount = amount * (tipPercent / 100);
  const totalUsd = amount + tipAmount;
  const totalEur = totalUsd * usdToEurRate;

  tipAmountEl.textContent = formatUsd(tipAmount);
  totalUsdEl.textContent = formatUsd(totalUsd);
  totalEurEl.textContent = formatEur(totalEur);
}

function changeInput(input, delta, decimals = 2) {
  const current = parseValue(input.value);
  const next = Math.max(0, current + delta);
  input.value = next.toFixed(decimals);
  saveValues();
  updateCalculation();
}

amountMinus.addEventListener("click", () => changeInput(amountInput, -0.5, 2));
amountPlus.addEventListener("click", () => changeInput(amountInput, 0.5, 2));
tipMinus.addEventListener("click", () => changeInput(tipInput, -1, 0));
tipPlus.addEventListener("click", () => changeInput(tipInput, 1, 0));

quickTipButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.tip;
    tipInput.value = value;
    localStorage.setItem("lastTipPercent", value);
    updateCalculation();
  });
});

amountInput.addEventListener("input", () => {
  saveValues();
  updateCalculation();
});

tipInput.addEventListener("input", () => {
  saveValues();
  updateCalculation();
});

amountInput.addEventListener("focus", () => {
  setTimeout(() => amountInput.select(), 0);
});

amountInput.addEventListener("click", () => {
  setTimeout(() => amountInput.select(), 0);
});

tipInput.addEventListener("focus", () => {
  setTimeout(() => tipInput.select(), 0);
});

tipInput.addEventListener("click", () => {
  setTimeout(() => tipInput.select(), 0);
});

resetBtn.addEventListener("click", () => {
  amountInput.value = "25.00";
  tipInput.value = "15";

  localStorage.removeItem("lastAmount");
  localStorage.removeItem("lastTipPercent");

  updateCalculation();

  resultsCard.classList.remove("flash-reset");
  void resultsCard.offsetWidth;
  resultsCard.classList.add("flash-reset");
});

async function loadExchangeRate() {
  const cachedRate = localStorage.getItem("usdToEurRate");
  const cachedDate = localStorage.getItem("usdToEurRateDate");

  if (cachedRate) {
    usdToEurRate = parseFloat(cachedRate) || FALLBACK_RATE;
    rateDateLabel = cachedDate || "";
    rateInfoEl.textContent = rateDateLabel
      ? `Gespeicherter Kurs: 1 $ = ${usdToEurRate.toFixed(4)} € (${rateDateLabel})`
      : `Gespeicherter Kurs: 1 $ = ${usdToEurRate.toFixed(4)} €`;
    updateCalculation();
  }

  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Kurs konnte nicht geladen werden");
    }

    const data = await response.json();
    const liveRate = data?.rates?.EUR;

    if (!liveRate) {
      throw new Error("Ungültige Kursdaten");
    }

    usdToEurRate = liveRate;
    rateDateLabel = data.date || "";

    localStorage.setItem("usdToEurRate", String(usdToEurRate));
    localStorage.setItem("usdToEurRateDate", rateDateLabel);

    rateInfoEl.textContent = rateDateLabel
      ? `Tageskurs: 1 $ = ${usdToEurRate.toFixed(4)} € (${rateDateLabel})`
      : `Tageskurs: 1 $ = ${usdToEurRate.toFixed(4)} €`;

    updateCalculation();
  } catch (error) {
    if (!cachedRate) {
      usdToEurRate = FALLBACK_RATE;
      rateInfoEl.textContent = `Fallback-Kurs: 1 $ = ${usdToEurRate.toFixed(4)} €`;
      updateCalculation();
    }
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}

const savedAmount = localStorage.getItem("lastAmount");
if (savedAmount !== null) {
  amountInput.value = savedAmount;
}

const savedTip = localStorage.getItem("lastTipPercent");
if (savedTip !== null) {
  tipInput.value = savedTip;
}

updateCalculation();
loadExchangeRate();
