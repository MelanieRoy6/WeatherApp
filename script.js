const FAV_KEY = "meteo_favoris_v1";

function lireFavoris() {
    try {
        const raw = localStorage.getItem(FAV_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

// Stocke le dernier résultat de recherche
let lastSearch = null;

function ecrireFavoris(list) {
    localStorage.setItem(FAV_KEY, JSON.stringify(list));
}

// Convertit un code météo WMO en emoji + texte
function getMeteoInfo(code) {
    const codes = {
        0:  { emoji: "☀️",  label: "Ciel dégagé" },
        1:  { emoji: "🌤",  label: "Principalement dégagé" },
        2:  { emoji: "⛅",  label: "Partiellement nuageux" },
        3:  { emoji: "☁️",  label: "Couvert" },
        45: { emoji: "🌫",  label: "Brouillard" },
        48: { emoji: "🌫",  label: "Brouillard givrant" },
        51: { emoji: "🌦",  label: "Bruine légère" },
        53: { emoji: "🌦",  label: "Bruine modérée" },
        55: { emoji: "🌦",  label: "Bruine forte" },
        61: { emoji: "🌧",  label: "Pluie légère" },
        63: { emoji: "🌧",  label: "Pluie modérée" },
        65: { emoji: "🌧",  label: "Pluie forte" },
        71: { emoji: "🌨",  label: "Neige légère" },
        73: { emoji: "🌨",  label: "Neige modérée" },
        75: { emoji: "🌨",  label: "Neige forte" },
        80: { emoji: "🌦",  label: "Averses légères" },
        81: { emoji: "🌦",  label: "Averses modérées" },
        82: { emoji: "🌧",  label: "Averses fortes" },
        95: { emoji: "⛈",  label: "Orage" },
        96: { emoji: "⛈",  label: "Orage + grêle" },
        99: { emoji: "⛈",  label: "Orage fort + grêle" },
    };
    return codes[code] ?? { emoji: "🌡", label: "Données indisponibles" };
}

// Géocodage : ville -> latitude / longitude
async function getCoordinates(ville) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(ville)}&count=1&language=fr`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Problème réseau (géocodage).");

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
        throw new Error("Ville introuvable.");
    }

    const { latitude, longitude, name, country } = data.results[0];
    return { latitude, longitude, name, country };
}

// Météo : latitude / longitude -> données
async function getMeteo(latitude, longitude) {
    const params = new URLSearchParams({
        latitude,
        longitude,
        current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
        daily: "temperature_2m_max,temperature_2m_min,weather_code",
        timezone: "auto"
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Problème réseau (météo).");

    return await response.json();
}

// Affichage météo actuelle
function afficherMeteoActuelle(ville, pays, data) {
    const { temperature_2m, relative_humidity_2m, wind_speed_10m, weather_code } = data.current;
    const { emoji, label } = getMeteoInfo(weather_code);

    const meteoDiv = document.getElementById("meteo-actuelle");
    meteoDiv.innerHTML = `
    <h2>📍 ${ville}, ${pays}</h2>
    <div class="card-actuelle">
      <div class="temp-big">${emoji} ${Math.round(temperature_2m)}°C</div>
      <div class="description">${label}</div>
      <div class="details">
        💧 Humidité : ${Math.round(relative_humidity_2m)}% &nbsp;|&nbsp;
        💨 Vent : ${Math.round(wind_speed_10m)} km/h
      </div>
    </div>
  `;
    meteoDiv.classList.remove("hidden");
}

// Affichage prévisions (7 prochains jours)
function afficherPrevisions(data) {
    const { time, temperature_2m_max, weather_code } = data.daily;
    const jours = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    const cartes = time.slice(1, 8).map((date, i) => {
        const d = new Date(date);
        const jour = jours[d.getDay()];

        const code = weather_code[i + 1];
        const { emoji } = getMeteoInfo(code);

        const tmax = Math.round(temperature_2m_max[i + 1]);

        return `
      <div class="carte-prevision">
        <div class="jour">${jour}</div>
        <div class="emoji">${emoji}</div>
        <div class="temp">${tmax}°C</div>
      </div>
    `;
    }).join("");

    const prevDiv = document.getElementById("previsions");
    prevDiv.innerHTML = `
    <h3>Prévisions 7 jours</h3>
    <div class="grille-previsions">${cartes}</div>
  `;
    prevDiv.classList.remove("hidden");
}

function setLoading(isLoading) {
    document.getElementById("loading").classList.toggle("hidden", !isLoading);
}

function cacherAncienAffichage() {
    ["meteo-actuelle", "previsions", "erreur"].forEach(id => {
        document.getElementById(id).classList.add("hidden");
    });
}

// Fonction principale
async function rechercherVille() {
    const input = document.getElementById("city-input");
    const ville = input.value.trim();
    if (!ville) return;

    cacherAncienAffichage();
    setLoading(true);

    try {
        const { latitude, longitude, name, country } = await getCoordinates(ville);
        const data = await getMeteo(latitude, longitude);
        const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
        lastSearch = { name, country, latitude, longitude, key };

// active le bouton si tu veux
        const favBtn = document.getElementById("fav-btn");
        if (favBtn) favBtn.disabled = false;

        afficherMeteoActuelle(name, country, data);
        afficherPrevisions(data);
    } catch (error) {
        const erreurDiv = document.getElementById("erreur");
        erreurDiv.textContent = "❌ " + error.message;
        erreurDiv.classList.remove("hidden");
    } finally {
        setLoading(false);
    }
}

// Events
document.getElementById("search-btn").addEventListener("click", rechercherVille);
document.getElementById("city-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") rechercherVille();
});

// Si on arrive sur index.html?city=NomDeVille -> on lance la recherche automatiquement
(function autoSearchFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const city = params.get("city");
    if (!city) return;

    const input = document.getElementById("city-input");
    input.value = city;
    rechercherVille(); // utilise déjà la normalisation
})();

function ajouterDerniereVilleAuxFavoris() {
    if (!lastSearch) return;

    const favs = lireFavoris();

    // évite les doublons
    const exists = favs.some(f => f.key === lastSearch.key);
    if (!exists) {
        favs.unshift(lastSearch);
        ecrireFavoris(favs);
    }

    // feedback simple (optionnel)
    alert(exists ? "Déjà dans les favoris ⭐" : "Ajouté aux favoris ⭐");
}

const favBtn = document.getElementById("fav-btn");
if (favBtn) {
    favBtn.disabled = true; // désactivé tant qu'aucune recherche
    favBtn.addEventListener("click", ajouterDerniereVilleAuxFavoris);
}