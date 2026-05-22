const formatGb = (value) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const maximumFractionDigits = safeValue > 0 && safeValue < 10 ? 2 : 1;

  return `${safeValue.toLocaleString("en-US", { maximumFractionDigits })} GB`;
};

const formatPercent = (value) =>
  `${(Number.isFinite(value) ? value : 0).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}%`;

const driveTable = document.querySelector("#driveTable");
const usageTable = document.querySelector("#usageTable");

function getStorageGb(item) {
  if (Number.isFinite(item.usageGb)) {
    return item.usageGb;
  }

  if (Number.isFinite(item.usageTotalGb)) {
    return item.usageTotalGb;
  }

  if (Number.isFinite(item.usageTb)) {
    return item.usageTb * 1024;
  }

  if (Number.isFinite(item.usageMo)) {
    return item.usageMo / 1024;
  }

  if (Number.isFinite(item.usageMO)) {
    return item.usageMO / 1024;
  }

  return 0;
}

function normalizeStorageItem(item) {
  const details = (item.details || []).map((detail) => ({
    ...detail,
    usageGb: getStorageGb(detail),
  }));
  const detailTotalGb = details.reduce(
    (total, detail) => total + detail.usageGb,
    0,
  );
  const directUsageGb = getStorageGb(item);

  return {
    ...item,
    usageGb: directUsageGb || detailTotalGb,
    details,
  };
}

function getWidthPercent(value) {
  return Number.isFinite(value) ? Math.min(value, 100) : 0;
}

function renderStorageTable(items, table, serverCapacityGb, idPrefix) {
  table.textContent = "";

  [...items]
    .sort((a, b) => b.usageGb - a.usageGb)
    .forEach((item, index) => {
      const share = serverCapacityGb > 0 ? (item.usageGb / serverCapacityGb) * 100 : 0;
      const row = document.createElement("tr");
      const detailsRow = document.createElement("tr");
      const detailsId = `${idPrefix}-details-${index}`;
      const buttonId = `${idPrefix}-item-${index}`;

      row.innerHTML = `
        <td>
          <button
            class="person-name"
            id="${buttonId}"
            type="button"
            aria-expanded="false"
            aria-controls="${detailsId}"
          >
            ${item.name}
            <span aria-hidden="true">+</span>
          </button>
        </td>
        <td>
          <strong>${formatGb(item.usageGb)}</strong>
        </td>
        <td>
          <div class="usage-meter" aria-label="${item.name} uses ${formatPercent(share)} of the server">
            <span style="width: ${getWidthPercent(share)}%"></span>
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
              <strong>${item.name}</strong>
              <span>${formatGb(item.usageGb)} total usage</span>
            </div>
            <div class="detail-list">
              ${item.details
                .map((detail) => {
                  const detailShare =
                    item.usageGb > 0 ? (detail.usageGb / item.usageGb) * 100 : 0;

                  return `
                    <div class="detail-item">
                      <div class="detail-label">
                        <span>${detail.label}</span>
                        <strong>${formatGb(detail.usageGb)}</strong>
                      </div>
                      <div class="detail-meter" aria-label="${detail.label}: ${formatPercent(detailShare)} of ${item.name}'s usage">
                        <span style="width: ${getWidthPercent(detailShare)}%"></span>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        </td>
      `;

      table.appendChild(row);
      table.appendChild(detailsRow);

      const itemButton = row.querySelector(".person-name");

      itemButton.addEventListener("click", () => {
        const isOpen = itemButton.getAttribute("aria-expanded") === "true";

        itemButton.setAttribute("aria-expanded", String(!isOpen));
        detailsRow.hidden = isOpen;
        itemButton.querySelector("span").textContent = isOpen ? "+" : "-";
      });
    });
}

function renderDashboard(data) {
  const serverCapacityGb =
    data.serverCapacityGb || (data.serverCapacityTb || 0) * 1024;
  const drives = (data.drives || data.Drives || []).map(normalizeStorageItem);
  const labMembers = (data.members || data.Members || []).map(normalizeStorageItem);
  const summaryItems = drives.length > 0 ? drives : labMembers;
  const usedGb = summaryItems.reduce((total, item) => total + item.usageGb, 0);
  const freeGb = Math.max(serverCapacityGb - usedGb, 0);
  const usedPercent = serverCapacityGb > 0 ? (usedGb / serverCapacityGb) * 100 : 0;
  const freePercent = serverCapacityGb > 0 ? (freeGb / serverCapacityGb) * 100 : 0;

  document.querySelector("#spaceLeft").textContent = formatGb(freeGb);
  document.querySelector("#spaceLeftPercent").textContent =
    `${formatPercent(freePercent)} free`;
  document.querySelector("#totalCapacity").textContent =
    formatGb(serverCapacityGb);
  document.querySelector("#usedSpace").textContent = formatGb(usedGb);
  document.querySelector("#usedPercent").textContent =
    `${formatPercent(usedPercent)} used`;
  document.querySelector("#driveCount").textContent =
    `${drives.length} ${drives.length === 1 ? "drive" : "drives"}`;
  document.querySelector("#memberCount").textContent =
    `${labMembers.length} members`;
  document.querySelector("#lastUpdated").textContent =
    `Updated ${data.lastUpdated}`;

  renderStorageTable(drives, driveTable, serverCapacityGb, "drive");
  renderStorageTable(labMembers, usageTable, serverCapacityGb, "member");
}

async function loadDashboard() {
  try {
    const response = await fetch("data/storage.json");

    if (!response.ok) {
      throw new Error(`Could not load storage data: ${response.status}`);
    }

    const data = await response.json();
    renderDashboard(data);
  } catch (error) {
    driveTable.innerHTML = "";
    usageTable.innerHTML = `
      <tr>
        <td colspan="3">
          Could not load data/storage.json. If you opened this file directly on your computer, use the Netlify site after pushing to GitHub.
        </td>
      </tr>
    `;
    console.error(error);
  }
}

loadDashboard();
