const formatGb = (value) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const maximumFractionDigits = safeValue > 0 && safeValue < 10 ? 2 : 1;

  return `${safeValue.toLocaleString("en-US", { maximumFractionDigits })} GB`;
};

const formatPercent = (value) =>
  `${(Number.isFinite(value) ? value : 0).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}%`;

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

function normalizeMember(member) {
  const details = (member.details || []).map((detail) => ({
    ...detail,
    usageGb: getStorageGb(detail),
  }));
  const detailTotalGb = details.reduce(
    (total, detail) => total + detail.usageGb,
    0,
  );
  const directUsageGb = getStorageGb(member);

  return {
    ...member,
    usageGb: directUsageGb || detailTotalGb,
    details,
  };
}

function renderDashboard(data) {
  const serverCapacityGb =
    data.serverCapacityGb || (data.serverCapacityTb || 0) * 1024;
  const labMembers = data.members.map(normalizeMember);
  const usedGb = labMembers.reduce((total, member) => total + member.usageGb, 0);
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
  document.querySelector("#memberCount").textContent =
    `${labMembers.length} members`;
  document.querySelector("#lastUpdated").textContent =
    `Updated ${data.lastUpdated}`;

  usageTable.textContent = "";

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
