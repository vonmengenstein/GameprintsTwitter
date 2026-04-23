const teams = [
  { id: "duke", name: "Duke", tag: "Blue Devils", core: true },
  { id: "unc", name: "UNC", tag: "Tar Heels", core: true },
  { id: "uconn", name: "UConn", tag: "Huskies", core: true },
  { id: "kansas", name: "Kansas", tag: "Jayhawks", core: true },
  { id: "kentucky", name: "Kentucky", tag: "Wildcats", core: true },
  { id: "gonzaga", name: "Gonzaga", tag: "Bulldogs", core: true },
  { id: "michigan-state", name: "Michigan State", tag: "Spartans", core: true },
  { id: "purdue", name: "Purdue", tag: "Boilermakers", core: true },
  { id: "villanova", name: "Villanova", tag: "Wildcats", core: true },
  { id: "arizona", name: "Arizona", tag: "Wildcats", core: true },
  { id: "tennessee", name: "Tennessee", tag: "Volunteers", core: true },
  { id: "baylor", name: "Baylor", tag: "Bears", core: true },
  { id: "alabama", name: "Alabama", tag: "Crimson Tide", core: false },
  { id: "auburn", name: "Auburn", tag: "Tigers", core: false },
  { id: "florida", name: "Florida", tag: "Gators", core: false },
  { id: "houston", name: "Houston", tag: "Cougars", core: false },
  { id: "illinois", name: "Illinois", tag: "Fighting Illini", core: false },
  { id: "iowa-state", name: "Iowa State", tag: "Cyclones", core: false },
  { id: "marquette", name: "Marquette", tag: "Golden Eagles", core: false },
  { id: "texas-tech", name: "Texas Tech", tag: "Red Raiders", core: false },
];

const rivalryPairs = [
  ["Duke", "UNC"],
  ["Kansas", "Kentucky"],
  ["UConn", "Villanova"],
  ["Michigan State", "Purdue"],
  ["Arizona", "Gonzaga"],
];

const tournamentTerms = [
  "March Madness",
  "Final Four",
  "Sweet 16",
  "Elite Eight",
  "buzzer beater",
  "overtime",
  "upset",
];

const shortlistStorageKey = "gameprints-lead-finder-shortlist";

const state = {
  selectedTeams: new Set(teams.filter((team) => team.core).map((team) => team.id)),
  shortlist: loadShortlist(),
};

const teamGrid = document.getElementById("teamGrid");
const queryList = document.getElementById("queryList");
const shortlistItems = document.getElementById("shortlistItems");
const shortlistForm = document.getElementById("shortlistForm");
const searchMode = document.getElementById("searchMode");
const engagementPreset = document.getElementById("engagementPreset");
const extraKeywords = document.getElementById("extraKeywords");

document.getElementById("selectCore").addEventListener("click", () => {
  state.selectedTeams = new Set(teams.filter((team) => team.core).map((team) => team.id));
  render();
});

document.getElementById("selectAll").addEventListener("click", () => {
  state.selectedTeams = new Set(teams.map((team) => team.id));
  render();
});

document.getElementById("clearTeams").addEventListener("click", () => {
  state.selectedTeams.clear();
  render();
});

document.getElementById("resetFilters").addEventListener("click", () => {
  searchMode.value = "team";
  engagementPreset.value = "";
  extraKeywords.value = "";
  state.selectedTeams = new Set(teams.filter((team) => team.core).map((team) => team.id));
  render();
});

document.getElementById("openAll").addEventListener("click", () => {
  const queries = buildQueries();
  queries.forEach((query) => window.open(query.url, "_blank", "noopener,noreferrer"));
});

searchMode.addEventListener("change", renderQueries);
engagementPreset.addEventListener("change", renderQueries);
extraKeywords.addEventListener("input", renderQueries);

shortlistForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const postUrl = document.getElementById("postUrl").value.trim();
  const postContext = document.getElementById("postContext").value.trim();
  const postNotes = document.getElementById("postNotes").value.trim();

  state.shortlist.unshift({
    id: crypto.randomUUID(),
    postUrl,
    postContext,
    postNotes,
    createdAt: new Date().toISOString(),
  });

  persistShortlist();
  shortlistForm.reset();
  renderShortlist();
});

function loadShortlist() {
  try {
    const raw = window.localStorage.getItem(shortlistStorageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistShortlist() {
  window.localStorage.setItem(shortlistStorageKey, JSON.stringify(state.shortlist));
}

function selectedTeamObjects() {
  return teams.filter((team) => state.selectedTeams.has(team.id));
}

function buildQueries() {
  const activeTeams = selectedTeamObjects();
  const extras = extraKeywords.value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const engagementHint = engagementPreset.value ? ` Min likes hint: ${engagementPreset.value}+.` : "";

  if (!activeTeams.length) {
    return [];
  }

  if (searchMode.value === "rivalry") {
    const availablePairs = rivalryPairs.filter(([home, away]) =>
      activeTeams.some((team) => team.name === home) && activeTeams.some((team) => team.name === away)
    );

    return availablePairs.map(([home, away]) => {
      const baseQuery = `"${home}" "${away}" ("vs" OR "beat" OR "defeated" OR "buzzer beater" OR "overtime" OR "upset") lang:en -is:retweet`;
      return createQueryCardData(
        `${home} vs ${away}`,
        `${baseQuery}${appendExtraTerms(extras)}`,
        `Use this when you want explicit game chatter between both fan bases.${engagementHint}`
      );
    });
  }

  if (searchMode.value === "tournament") {
    return activeTeams.slice(0, 8).map((team) => {
      const baseQuery = `"${team.name}" ("${tournamentTerms.join('" OR "')}") lang:en -is:retweet`;
      return createQueryCardData(
        `${team.name} tournament buzz`,
        `${baseQuery}${appendExtraTerms(extras)}`,
        `Captures big-moment language around tournament runs and close finishes.${engagementHint}`
      );
    });
  }

  return activeTeams.map((team) => {
    const baseQuery = `("${team.name}" OR "${team.tag}") ("beat" OR "defeated" OR "vs" OR "what a game" OR "insane" OR "buzzer beater" OR "final") lang:en -is:retweet`;
    return createQueryCardData(
      `${team.name} recent game talk`,
      `${baseQuery}${appendExtraTerms(extras)}`,
      `General search for high-signal reactions around games for ${team.name}.${engagementHint}`
    );
  });
}

function appendExtraTerms(extras) {
  if (!extras.length) {
    return "";
  }

  return ` (${extras.map((item) => `"${item}"`).join(" OR ")})`;
}

function createQueryCardData(title, query, notes) {
  const url = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`;
  return { title, query, notes, url };
}

function renderTeams() {
  teamGrid.innerHTML = teams
    .map((team) => {
      const active = state.selectedTeams.has(team.id);
      return `
        <label class="team-card ${active ? "active" : ""}">
          <input type="checkbox" data-team-id="${team.id}" ${active ? "checked" : ""} />
          <span>
            <strong>${team.name}</strong>
            <small>${team.tag}</small>
          </span>
        </label>
      `;
    })
    .join("");

  teamGrid.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const teamId = event.target.dataset.teamId;
      if (event.target.checked) {
        state.selectedTeams.add(teamId);
      } else {
        state.selectedTeams.delete(teamId);
      }
      render();
    });
  });
}

function renderQueries() {
  const queries = buildQueries();

  if (!queries.length) {
    queryList.innerHTML = `
      <div class="empty-state">
        Select at least one team to generate X searches.
      </div>
    `;
    return;
  }

  queryList.innerHTML = queries
    .map(
      (query) => `
        <article class="query-card">
          <header>
            <div>
              <h3>${query.title}</h3>
              <p class="meta">${query.notes}</p>
            </div>
          </header>
          <div class="query-text">${query.query}</div>
          <div class="query-actions">
            <a class="link-button" href="${query.url}" target="_blank" rel="noopener noreferrer">Open on X</a>
            <button class="ghost-button" type="button" data-copy-query="${encodeURIComponent(query.query)}">Copy query</button>
          </div>
        </article>
      `
    )
    .join("");

  queryList.querySelectorAll("[data-copy-query]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const value = decodeURIComponent(event.currentTarget.dataset.copyQuery);
      await navigator.clipboard.writeText(value);
      event.currentTarget.textContent = "Copied";
      window.setTimeout(() => {
        event.currentTarget.textContent = "Copy query";
      }, 1200);
    });
  });
}

function renderShortlist() {
  if (!state.shortlist.length) {
    shortlistItems.innerHTML = `
      <div class="empty-state">
        No saved posts yet. Add interesting X posts here while you review search results.
      </div>
    `;
    return;
  }

  shortlistItems.innerHTML = state.shortlist
    .map(
      (item) => `
        <article class="shortlist-card">
          <header>
            <div>
              <h3>${item.postContext}</h3>
              <p class="meta">${new Date(item.createdAt).toLocaleString()}</p>
            </div>
          </header>
          <p>${item.postNotes || "No notes added yet."}</p>
          <div class="shortlist-actions">
            <a class="link-button" href="${item.postUrl}" target="_blank" rel="noopener noreferrer">Open post</a>
            <button class="danger-button" type="button" data-delete-id="${item.id}">Remove</button>
          </div>
        </article>
      `
    )
    .join("");

  shortlistItems.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const itemId = event.currentTarget.dataset.deleteId;
      state.shortlist = state.shortlist.filter((item) => item.id !== itemId);
      persistShortlist();
      renderShortlist();
    });
  });
}

function render() {
  renderTeams();
  renderQueries();
  renderShortlist();
}

render();
