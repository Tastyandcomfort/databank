"use strict";

/* =========================================================
   DATA BANK V3
   REAL BROWSER NETWORK DETECTION
   + LOCAL DATA BANK SIMULATION
   ========================================================= */


/* ---------------------------------------------------------
   STATE
--------------------------------------------------------- */

const STORAGE_KEY = "DATA_BANK_V3_STATE";


const DEFAULT_STATE = {

  dailyPlanMB: 1500,

  usedTodayMB: 300,

  bankedMB: 700,

  yesterdayMB: 920,

  monthlyMB: 6840,

  history: []

};


let state = loadState();


/* ---------------------------------------------------------
   STORAGE
--------------------------------------------------------- */

function loadState() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!saved) {

      return {
        ...DEFAULT_STATE
      };

    }

    return {
      ...DEFAULT_STATE,
      ...JSON.parse(saved)
    };

  } catch {

    return {
      ...DEFAULT_STATE
    };

  }

}


function saveState() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );

}


/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function $(id) {

  return document.getElementById(id);

}


function formatMB(mb) {

  mb = Math.max(
    0,
    Number(mb) || 0
  );


  if (mb >= 1000) {

    return (
      (mb / 1000)
        .toFixed(2)
        .replace(/\.00$/, "")
      + " GB"
    );

  }


  return Math.round(mb) + " MB";

}


function showToast(message) {

  const toast =
    $("toast");


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    window.__toastTimer
  );


  window.__toastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2600);

}


/* =========================================================
   REAL NETWORK INFORMATION
   ========================================================= */

function getConnection() {

  return (
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection ||
    null
  );

}


function detectNetwork() {

  const connection =
    getConnection();


  /*
   * Browser online status
   */

  if (!navigator.onLine) {

    $("networkState").textContent =
      "Offline";

    $("networkPill")
      .querySelector("i")
      .style.background =
      "#e5484d";

  } else {

    $("networkState").textContent =
      "Online";

    $("networkPill")
      .querySelector("i")
      .style.background =
      "#18a957";

  }


  /*
   * Network Information API
   */

  if (!connection) {

    $("connectionType").textContent =
      "Browser unavailable";

    $("connectionSpeed").textContent =
      "Not exposed";

    $("connectionLatency").textContent =
      "Not exposed";

    $("dataSaver").textContent =
      "Not exposed";

    return;

  }


  const type =
    connection.type;


  const effective =
    connection.effectiveType;


  const downlink =
    connection.downlink;


  const rtt =
    connection.rtt;


  const saveData =
    connection.saveData;


  /*
   * Connection type
   */

  let connectionText =
    type || effective || "Unknown";


  if (
    type &&
    effective &&
    type !== effective
  ) {

    connectionText +=
      ` (${effective})`;

  }


  $("connectionType").textContent =
    connectionText;


  /*
   * Speed
   */

  if (
    typeof downlink ===
    "number"
  ) {

    $("connectionSpeed").textContent =
      `${downlink} Mbps`;

  } else {

    $("connectionSpeed").textContent =
      "Unavailable";

  }


  /*
   * RTT
   */

  if (
    typeof rtt ===
    "number"
  ) {

    $("connectionLatency").textContent =
      `${rtt} ms`;

  } else {

    $("connectionLatency").textContent =
      "Unavailable";

  }


  /*
   * Data Saver
   */

  if (
    typeof saveData ===
    "boolean"
  ) {

    $("dataSaver").textContent =
      saveData
        ? "Enabled"
        : "Disabled";

  } else {

    $("dataSaver").textContent =
      "Unavailable";

  }


  /*
   * Re-render if connection changes.
   */

  connection.addEventListener(
    "change",
    detectNetwork
  );

}


/* =========================================================
   DATA DASHBOARD
   ========================================================= */

function renderDashboard() {

  const remaining =
    Math.max(
      0,
      state.dailyPlanMB -
      state.usedTodayMB
    );


  const totalAvailable =
    remaining +
    state.bankedMB;


  $("availableData").textContent =
    (
      totalAvailable / 1000
    ).toFixed(2);


  $("dailyPlan").textContent =
    formatMB(
      state.dailyPlanMB
    );


  $("todayUsed").textContent =
    formatMB(
      state.usedTodayMB
    );


  $("bankedData").textContent =
    formatMB(
      state.bankedMB
    );


  $("bankBalance").textContent =
    formatMB(
      state.bankedMB
    );


  /*
   * Daily usage ring.
   */

  const dailyPercent =
    Math.min(
      100,
      (
        state.usedTodayMB /
        state.dailyPlanMB
      ) * 100
    );


  document
    .querySelector(".data-ring")
    .style.background =
      `conic-gradient(
        var(--green) 0 ${dailyPercent}%,
        #e1e2dd ${dailyPercent}% 100%
      )`;


  /*
   * Bank capacity.
   */

  const bankPercent =
    Math.min(
      100,
      (
        state.bankedMB /
        5000
      ) * 100
    );


  $("bankProgress").style.width =
    `${Math.max(
      5,
      bankPercent
    )}%`;


  /*
   * Button.
   */

  $("bankButton").disabled =
    remaining <= 0;


  $("bankButton").textContent =
    remaining > 0
      ? `Bank ${formatMB(remaining)}`
      : "No unused data";

}


/* =========================================================
   BANK SIMULATION
   ========================================================= */

function bankUnusedData() {

  const remaining =
    Math.max(
      0,
      state.dailyPlanMB -
      state.usedTodayMB
    );


  if (remaining <= 0) {

    showToast(
      "No unused daily data available."
    );

    return;

  }


  const bankCapacity =
    5000 -
    state.bankedMB;


  if (bankCapacity <= 0) {

    showToast(
      "Data Bank capacity reached."
    );

    return;

  }


  const amount =
    Math.min(
      remaining,
      bankCapacity
    );


  /*
   * Simulation:
   *
   * We mark the daily quota as consumed
   * and add the eligible amount to the
   * Data Bank.
   */

  state.usedTodayMB +=
    amount;


  state.bankedMB +=
    amount;


  state.history.unshift({

    type: "bank",

    title:
      "Data added to Data Bank",

    amount,

    time:
      new Date().toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      )

  });


  saveState();

  renderDashboard();

  renderHistory();

  showToast(
    `${formatMB(amount)} added to Data Bank.`
  );

}


/* =========================================================
   SIMULATED APP USAGE
   ========================================================= */

function consumeData(
  app,
  amount
) {

  amount =
    Number(amount);


  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    return;

  }


  let remaining =
    amount;


  /*
   * Use today's normal quota first.
   */

  const dailyRemaining =
    Math.max(
      0,
      state.dailyPlanMB -
      state.usedTodayMB
    );


  const fromDaily =
    Math.min(
      dailyRemaining,
      remaining
    );


  state.usedTodayMB +=
    fromDaily;


  remaining -=
    fromDaily;


  /*
   * Then use Data Bank.
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


  if (consumed <= 0) {

    showToast(
      "No available data."
    );

    return;

  }


  state.monthlyMB +=
    consumed;


  state.history.unshift({

    type: "usage",

    title:
      `${app} used data`,

    amount:
      consumed,

    time:
      new Date().toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      )

  });


  saveState();

  renderDashboard();

  renderHistory();


  if (remaining > 0) {

    showToast(
      `${formatMB(consumed)} used. ${formatMB(remaining)} unavailable.`
    );

  } else {

    showToast(
      `${app}: ${formatMB(consumed)} used.`
    );

  }

}


/* =========================================================
   USAGE TABS
   ========================================================= */

function renderUsage(period) {

  const summary =
    $("usageSummary");


  if (period === "yesterday") {

    summary.textContent =
      `Yesterday: ${formatMB(
        state.yesterdayMB
      )} mobile data used.`;

    return;

  }


  if (period === "month") {

    summary.textContent =
      `This month: ${formatMB(
        state.monthlyMB
      )} mobile data used.`;

    return;

  }


  summary.textContent =
    `Today: ${formatMB(
      state.usedTodayMB
    )} mobile data used.`;

}


/* =========================================================
   HISTORY
   ========================================================= */

function renderHistory() {

  const list =
    $("historyList");


  if (
    !state.history ||
    state.history.length === 0
  ) {

    list.innerHTML =
      `
        <div class="history-empty">
          No Data Bank activity yet.
        </div>
      `;

    return;

  }


  list.innerHTML =
    state.history
      .slice(0, 15)
      .map(item => {

        const sign =
          item.type === "bank"
            ? "+"
            : "−";


        const color =
          item.type === "bank"
            ? "var(--green)"
            : "var(--text)";


        return `
          <div class="history-item">

            <span>
              ${escapeHTML(item.title)}
              <br>
              ${escapeHTML(item.time)}
            </span>

            <strong
              style="color:${color}"
            >
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
   CARRIER BUTTON
   ========================================================= */

function carrierIntegration() {

  $("carrierMessage").textContent =
    "No carrier API is connected. The website can display carrier data only after an authorized operator integration is provided.";

  showToast(
    "Carrier integration is not connected."
  );

}


/* =========================================================
   EVENTS
   ========================================================= */

$("bankButton")
  .addEventListener(
    "click",
    bankUnusedData
  );


$("carrierButton")
  .addEventListener(
    "click",
    carrierIntegration
  );


document
  .querySelectorAll(
    ".app-row"
  )
  .forEach(row => {

    row.addEventListener(
      "click",
      () => {

        consumeData(
          row.dataset.app,
          Number(
            row.dataset.usage
          )
        );

      }
    );

  });


document
  .querySelectorAll(
    ".usage-tab"
  )
  .forEach(tab => {

    tab.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".usage-tab"
          )
          .forEach(button =>
            button.classList.remove(
              "active"
            )
          );


        tab.classList.add(
          "active"
        );


        renderUsage(
          tab.dataset.period
        );

      }
    );

  });


$("clearHistory")
  .addEventListener(
    "click",
    () => {

      state.history = [];

      saveState();

      renderHistory();

      showToast(
        "History cleared."
      );

    }
  );


window.addEventListener(
  "online",
  detectNetwork
);


window.addEventListener(
  "offline",
  detectNetwork
);


/* =========================================================
   START
   ========================================================= */

renderDashboard();

renderUsage(
  "today"
);

renderHistory();

detectNetwork();
