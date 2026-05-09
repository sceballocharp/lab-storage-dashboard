const serverCapacityGb = 12000;
const lastUpdated = "May 7, 2026";

const labMembers = [
  {
    name: "Alice Martin",
    usageGb: 1430,
    details: [
      { label: "Raw microscopy data", usageGb: 860 },
      { label: "Processed datasets", usageGb: 340 },
      { label: "Analysis notebooks", usageGb: 120 },
      { label: "Exports and figures", usageGb: 110 },
    ],
  },
  {
    name: "Ben Carter",
    usageGb: 980,
    details: [
      { label: "Raw behavior videos", usageGb: 520 },
      { label: "Tracking outputs", usageGb: 260 },
      { label: "Analysis notebooks", usageGb: 80 },
      { label: "Shared reports", usageGb: 120 },
    ],
  },
  {
    name: "Chloe Singh",
    usageGb: 2210,
    details: [
      { label: "Raw imaging sessions", usageGb: 1280 },
      { label: "Preprocessed stacks", usageGb: 610 },
      { label: "Model outputs", usageGb: 230 },
      { label: "Manuscript figures", usageGb: 90 },
    ],
  },
  {
    name: "Daniel Rossi",
    usageGb: 760,
    details: [
      { label: "Electrophysiology recordings", usageGb: 420 },
      { label: "Spike sorting results", usageGb: 180 },
      { label: "Analysis notebooks", usageGb: 95 },
      { label: "Archived exports", usageGb: 65 },
    ],
  },
  {
    name: "Eva Nguyen",
    usageGb: 1325,
    details: [
      { label: "Raw calcium imaging", usageGb: 730 },
      { label: "Processed traces", usageGb: 310 },
      { label: "Model checkpoints", usageGb: 210 },
      { label: "Figures and tables", usageGb: 75 },
    ],
  },
  {
    name: "Felix Meyer",
    usageGb: 540,
    details: [
      { label: "Raw pilot data", usageGb: 260 },
      { label: "Processed data", usageGb: 150 },
      { label: "Analysis scripts", usageGb: 40 },
      { label: "Temporary exports", usageGb: 90 },
    ],
  },
];

const formatGb = (value) =>
  `${Math.round(value).toLocaleString("en-US")} GB`;

const formatPercent = (value) =>
  `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;

const usedGb = labMembers.reduce((total, member) => total + member.usageGb, 0);
const freeGb = Math.max(serverCapacityGb - usedGb, 0);
const usedPercent = (usedGb / serverCapacityGb) * 100;
const freePercent = (freeGb / serverCapacityGb) * 100;

document.querySelector("#spaceLeft").textContent = formatGb(freeGb);
document.querySelector("#spaceLeftPercent").textContent =
  `${formatPercent(freePercent)} free`;
document.querySelector("#totalCapacity").textContent = formatGb(serverCapacityGb);
document.querySelector("#usedSpace").textContent = formatGb(usedGb);
document.querySelector("#usedPercent").textContent =
  `${formatPercent(usedPercent)} used`;
document.querySelector("#memberCount").textContent =
  `${labMembers.length} members`;
document.querySelector("#lastUpdated").textContent = `Updated ${lastUpdated}`;

const usageTable = document.querySelector("#usageTable");

[...labMembers]
  .sort((a, b) => b.usageGb - a.usageGb)
  .forEach((member, index) => {
    const share = (member.usageGb / serverCapacityGb) * 100;
    const row = document.createElement("tr");
    const detailsRow = document.createElement("tr");
    const detailsId = `details-${index}`;
    const buttonId = `person-${index}`;

    row.innerHTML = `
      <td>
        <button
          class="person-name"
          id="${buttonId}"
          type="button"
          aria-expanded="false"
          aria-controls="${detailsId}"
        >
          ${member.name}
          <span aria-hidden="true">+</span>
        </button>
      </td>
      <td>
        <strong>${formatGb(member.usageGb)}</strong>
      </td>
      <td>
        <div class="usage-meter" aria-label="${member.name} uses ${formatPercent(share)} of the server">
          <span style="width: ${Math.min(share, 100)}%"></span>
        </div>
        <span class="usage-percent">${formatPercent(share)}</span>
      </td>
    `;

    detailsRow.className = "detail-row";
    detailsRow.id = detailsId;
    detailsRow.hidden = true;
    detailsRow.innerHTML = `
      <td colspan="3">
        <div class="detail-panel" aria-labelledby="${buttonId}">
          <div class="detail-summary">
            <strong>${member.name}</strong>
            <span>${formatGb(member.usageGb)} total usage</span>
          </div>
          <div class="detail-list">
            ${member.details
              .map((detail) => {
                const detailShare = (detail.usageGb / member.usageGb) * 100;

                return `
                  <div class="detail-item">
                    <div class="detail-label">
                      <span>${detail.label}</span>
                      <strong>${formatGb(detail.usageGb)}</strong>
                    </div>
                    <div class="detail-meter" aria-label="${detail.label}: ${formatPercent(detailShare)} of ${member.name}'s usage">
                      <span style="width: ${Math.min(detailShare, 100)}%"></span>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
      </td>
    `;

    usageTable.appendChild(row);
    usageTable.appendChild(detailsRow);

    const personButton = row.querySelector(".person-name");

    personButton.addEventListener("click", () => {
      const isOpen = personButton.getAttribute("aria-expanded") === "true";

      personButton.setAttribute("aria-expanded", String(!isOpen));
      detailsRow.hidden = isOpen;
      personButton.querySelector("span").textContent = isOpen ? "+" : "-";
    });
  });
