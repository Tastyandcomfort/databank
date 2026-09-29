"use strict";

/* =========================================================
   DATA BANK V3
   LOCAL MOCK CARRIER ENGINE
   ========================================================= */

const STORAGE_KEY = "dataBankV3";

const DEFAULT_STATE = {

  carrier: "Demo Carrier",

  dailyQuotaMB: 1500,

  usedMB: 800,

  bankedMB: 700,

  rolloverLimitMB: 5000,

  day: 1,

  hour: 17,

  minute: 0,

  history: []

};


let state = loadState();


/* =========================================================
   HELPERS
   ========================================================= */

const $ = id =>
  document.getElementById(id);


function cloneDefault() {

  return JSON.parse(
    JSON.stringify(DEFAULT_STATE)
  );

}


function loadState() {

  const saved =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!saved) {

    return cloneDefault();

  }

  try {

    return {
      ...cloneDefault(),
      ...JSON.parse(saved)
    };

  } catch {

    return cloneDefault();

  }

}


function saveState() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );

}


function formatMB(mb) {

  mb = Math.max(
    0,
    Number(mb)
  );

  if (mb >= 1000) {

    return (
      (mb / 1000)
        .toFixed(2)
        .replace(/\.00$/, "")
      + " GB"
    );

  }

  return (
    Math.round(mb)
    + " MB"
  );

}


function formatGB(mb) {

  return (
    (Math.max(0, mb) / 1000)
      .toFixed(2)
  );

}


function todayRemaining() {

  return Math.max(
    0,
    state.dailyQuotaMB -
    state.usedMB
  );

}


function totalAvailable() {

  return (
    todayRemaining() +
    state.bankedMB
  );

}


/* =========================================================
   UI
   ========================================================= */

function render() {

  const remaining =
    todayRemaining();

  const total =
    totalAvailable();

  $("carrierName").textContent =
    state.carrier;

  $("dailyQuota").textContent =
    formatMB(
      state.dailyQuotaMB
    );

  $("bankedQuota").textContent =
    formatMB(
      state.bankedMB
    );

  $("usedQuota").textContent =
    formatMB(
      state.usedMB
    );

  $("totalBalance").textContent =
    formatGB(total);

  $("usedLabel").textContent =
    `Used ${formatMB(state.usedMB)}`;

  $("availableLabel").textContent =
    `${formatMB(total)} available`;

  $("eligibleBank").textContent =
    formatMB(remaining);


  const usage =
    Math.min(
      100,
      (state.usedMB /
        state.dailyQuotaMB) *
      100
    );


  $("usageFill").style.width =
    `${usage}%`;


  const availableSpace =
    state.rolloverLimitMB -
    state.bankedMB;


  $("bankButton").disabled =
    remaining <= 0 ||
    availableSpace <= 0;


  if (remaining <= 0) {

    $("bankButton").textContent =
      "No unused data";

  } else if (availableSpace <= 0) {

    $("bankButton").textContent =
      "Bank is full";

  } else {

    $("bankButton").textContent =
      `Bank ${formatMB(
        Math.min(
          remaining,
          availableSpace
        )
      )}`;

  }


  $("simulatedTime").textContent =
    `Day ${state.day} • ` +
    `${String(state.hour).padStart(2, "0")}:` +
    `${String(state.minute).padStart(2, "0")}`;


  renderHistory();

}


/* =========================================================
   HISTORY
   ========================================================= */

function addHistory(
  title,
  amount,
  direction,
  icon
) {

  state.history.unshift({

    title,
    amount,
    direction,
    icon,

    day: state.day,

    hour: state.hour,

    minute: state.minute,

    timestamp:
      Date.now()

  });


  state.history =
    state.history.slice(
      0,
      80
    );

}


function renderHistory() {

  const container =
    $("history");


  if (
    !state.history ||
    state.history.length === 0
  ) {

    container.innerHTML =
      `
        <div class="empty">
          No data activity yet.
        </div>
      `;

    return;

  }


  container.innerHTML =
    state.history
      .map(item => {

        const positive =
          item.direction === "positive";


        const sign =
          positive
            ? "+"
            : "−";


        const className =
          positive
            ? "positive"
            : "negative";


        return `
          <div class="history-row">

            <div class="history-left">

              <div class="history-icon">
                ${item.icon || "•"}
              </div>

              <div>

                <div class="history-title">
                  ${escapeHTML(item.title)}
                </div>

                <div class="history-time">
                  Day ${item.day}
                  •
                  ${String(item.hour).padStart(2, "0")}:
                  ${String(item.minute).padStart(2, "0")}
                </div>

              </div>

            </div>

            <strong class="${className}">
              ${sign}${formatMB(item.amount)}
            </strong>

          </div>
        `;

      })
      .join("");

}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   BANK DATA
   ========================================================= */

function bankUnusedData() {

  const unused =
    todayRemaining();


  if (unused <= 0) {

    showToast(
      "There is no unused data to bank."
    );

    return;

  }


  const space =
    Math.max(
      0,
      state.rolloverLimitMB -
      state.bankedMB
    );


  if (space <= 0) {

    showToast(
      "Your Data Bank is full."
    );

    return;

  }


  const amount =
    Math.min(
      unused,
      space
    );


  /*
   * Mock carrier behavior:
   *
   * Today's unused quota is converted
   * into a rollover entitlement.
   */

  state.usedMB += amount;

  state.bankedMB += amount;


  addHistory(
    "Data banked",
    amount,
    "positive",
    "🏦"
  );


  $("bankMessage").textContent =
    `${formatMB(amount)} added to Data Bank.`;


  saveState();

  render();

  showToast(
    `${formatMB(amount)} banked successfully.`
  );

}


/* =========================================================
   APP DATA USAGE
   ========================================================= */

function consumeData(
  app,
  amount
) {

  amount =
    Number(amount);


  if (
    !app ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    showToast(
      "Invalid data amount."
    );

    return;

  }


  let remaining =
    amount;


  /*
   * First consume today's quota.
   */

  const dailyAvailable =
    todayRemaining();


  const fromDaily =
    Math.min(
      dailyAvailable,
      remaining
    );


  state.usedMB +=
    fromDaily;


  remaining -=
    fromDaily;


  /*
   * Then consume rollover.
   */

  const fromBank =
    Math.min(
      state.bankedMB,
      remaining
    );


  state.bankedMB -=
    fromBank;


  remaining -=
    fromBank;


  const consumed =
    fromDaily +
    fromBank;


  if (consumed > 0) {

    addHistory(
      app,
      consumed,
      "negative",
      "📡"
    );

  }


  saveState();

  render();


  if (remaining > 0) {

    showToast(
      `${app}: ${formatMB(remaining)} unavailable.`
    );

  } else if (fromBank > 0) {

    showToast(
      `${app} used ${formatMB(consumed)}, including rollover.`
    );

  } else {

    showToast(
      `${app} used ${formatMB(consumed)}.`
    );

  }

}


/* =========================================================
   MIDNIGHT
   ========================================================= */

function simulateMidnight() {

  const unused =
    todayRemaining();


  if (unused > 0) {

    const space =
      Math.max(
        0,
        state.rolloverLimitMB -
        state.bankedMB
      );


    const rollover =
      Math.min(
        unused,
        space
      );


    if (rollover > 0) {

      state.bankedMB +=
        rollover;

      state.usedMB +=
        rollover;


      addHistory(
        "Automatic rollover",
        rollover,
        "positive",
        "↻"
      );

    }

  }


  state.day += 1;

  state.hour = 0;

  state.minute = 0;

  /*
   * New daily allowance.
   */

  state.usedMB = 0;


  addHistory(
    "New daily allowance",
    state.dailyQuotaMB,
    "positive",
    "☀"
  );


  $("bankMessage").textContent =
    "New simulated day started.";


  saveState();

  render();

  showToast(
    "Midnight simulated."
  );

}


/* =========================================================
   TIME
   ========================================================= */

function advanceHour() {

  state.hour += 1;


  if (state.hour >= 24) {

    simulateMidnight();

    return;

  }


  saveState();

  render();

}


/* =========================================================
   CUSTOM TRAFFIC
   ========================================================= */

function customTraffic() {

  const app =
    $("customApp")
      .value
      .trim();


  const amount =
    Number(
      $("customData").value
    );


  if (
    !app ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    showToast(
      "Enter an app name and MB amount."
    );

    return;

  }


  consumeData(
    app,
    amount
  );


  $("customApp").value = "";

  $("customData").value = "";

}


/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {

  document.body.classList.toggle(
    "dark"
  );


  localStorage.setItem(
    "dataBankV3Theme",
    document.body.classList.contains("dark")
      ? "dark"
      : "light"
  );

}


function loadTheme() {

  const theme =
    localStorage.getItem(
      "dataBankV3Theme"
    );


  if (theme === "dark") {

    document.body.classList.add(
      "dark"
    );

  }

}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer;


function showToast(message) {

  const toast =
    $("toast");


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2800);

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

$("bankButton")
  .addEventListener(
    "click",
    bankUnusedData
  );


$("themeToggle")
  .addEventListener(
    "click",
    toggleTheme
  );


$("advanceHour")
  .addEventListener(
    "click",
    advanceHour
  );


$("midnight")
  .addEventListener(
    "click",
    simulateMidnight
  );


$("customUse")
  .addEventListener(
    "click",
    customTraffic
  );


$("clearHistory")
  .addEventListener(
    "click",
    () => {

      state.history = [];

      saveState();

      render();

      showToast(
        "History cleared."
      );

    }
  );


/* APP TRAFFIC */

document
  .querySelectorAll(
    ".app-card"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        consumeData(
          button.dataset.app,
          Number(
            button.dataset.size
          )
        );

      }
    );

  });


/* ENTER KEY */

$("customApp")
  .addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        customTraffic();

      }

    }
  );


$("customData")
  .addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        customTraffic();

      }

    }
  );


/* =========================================================
   START
   ========================================================= */

loadTheme();

render();


/* =========================================================
   DEBUG / FUTURE API PLACEHOLDER
   =========================================================

   The production carrier integration would eventually
   replace these mock functions with an authorized API.

   Example future flow:

   DataBankV3.carrier.getBalance()
   DataBankV3.carrier.getEligibility()
   DataBankV3.carrier.bankQuota(amount)

   Those functions must communicate with an
   operator-authorized backend/API.

   ========================================================= */

window.DataBankV3 = {

  getState() {
    return structuredClone(state);
  },

  bank() {
    bankUnusedData();
  },

  use(app, mb) {
    consumeData(app, mb);
  },

  midnight() {
    simulateMidnight();
  },

  reset() {

    localStorage.removeItem(
      STORAGE_KEY
    );

    state =
      cloneDefault();

    saveState();

    render();

    showToast(
      "Data Bank reset."
    );

  }

};
