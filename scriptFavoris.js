const FAV_KEY = "meteo_favoris_v1";

function lireFavoris() {
    try {
        const raw = localStorage.getItem(FAV_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function ecrireFavoris(list) {
    localStorage.setItem(FAV_KEY, JSON.stringify(list));
}

function supprimerFavori(key) {
    const favs = lireFavoris().filter(f => f.key !== key);
    ecrireFavoris(favs);
    renderFavoris();
}

function clearFavoris() {
    ecrireFavoris([]);
    renderFavoris();
}

function ouvrirDansIndex(ville) {
    // on ouvre index.html en passant la ville dans l'URL
    window.location.href = `index.html?city=${encodeURIComponent(ville)}`;
}

function renderFavoris() {
    const favs = lireFavoris();
    const listDiv = document.getElementById("fav-list");

    if (!favs.length) {
        listDiv.innerHTML = `
      <div class="fav-item">
        <div class="fav-city">Aucun favori</div>
        <div class="fav-sub">Ajoute des villes depuis la page météo ⭐</div>
      </div>
    `;
        return;
    }

    listDiv.innerHTML = favs.map(f => `
    <div class="fav-item">
      <div class="fav-top">
        <div>
          <div class="fav-city">${f.name}</div>
          <div class="fav-sub">${f.country}</div>
        </div>
        <div class="fav-actions">
          <button class="icon-btn" title="Ouvrir" data-action="open" data-key="${f.key}">↗️</button>
          <button class="icon-btn" title="Supprimer" data-action="delete" data-key="${f.key}">🗑️</button>
        </div>
      </div>
      <div class="fav-mini">
        <div class="left">
          <div style="font-size:12px;color:rgba(255,255,255,0.75);">Coordonnées</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.85);">
            ${Number(f.latitude).toFixed(2)}, ${Number(f.longitude).toFixed(2)}
          </div>
        </div>
        <div class="right">
          <span class="emoji">⭐</span>
        </div>
      </div>
    </div>
  `).join("");

    // events
    listDiv.querySelectorAll("button[data-action]").forEach(btn => {
        btn.addEventListener("click", () => {
            const action = btn.dataset.action;
            const key = btn.dataset.key;
            const fav = favs.find(x => x.key === key);
            if (!fav) return;

            if (action === "open") ouvrirDansIndex(fav.name);
            if (action === "delete") supprimerFavori(key);
        });
    });
}

document.getElementById("clear-favs").addEventListener("click", clearFavoris);

renderFavoris();