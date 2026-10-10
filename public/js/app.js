import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const listEl = document.querySelector("#list");
const form = document.querySelector("#team-form");
const formError = document.querySelector("#form-error");
let mode = "login";
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function refresh() {
  const data = await api("/api/teams");
  listEl.innerHTML = "";
  data.teams.forEach((t) => {
    const box = document.createElement("div");
    box.className = "team";
    const title = document.createElement("div");
    title.innerHTML = `<strong>${t.name}</strong> <span class="pts">${t.points} pts</span>`;
    box.append(title);
    const players = document.createElement("div");
    players.textContent = t.players.join(", ") || "sin jugadores";
    box.append(players);
    const add = document.createElement("button");
    add.className = "ghost";
    add.textContent = "Agregar jugador";
    add.addEventListener("click", async () => {
      const name = window.prompt("Jugador");
      if (!name) return;
      await api(`/api/teams/${t.id}/player`, { method: "POST", body: JSON.stringify({ name }) });
      await refresh();
    });
    const pts = document.createElement("button");
    pts.className = "primary";
    pts.textContent = "+ puntos";
    pts.addEventListener("click", async () => {
      const n = Number(window.prompt("Puntos a sumar", "1"));
      if (Number.isNaN(n)) return;
      await api(`/api/teams/${t.id}/points`, { method: "POST", body: JSON.stringify({ points: n }) });
      await refresh();
    });
    const del = document.createElement("button");
    del.className = "ghost";
    del.textContent = "Borrar";
    del.addEventListener("click", async () => { await api(`/api/teams/${t.id}`, { method: "DELETE" }); await refresh(); });
    box.append(add, pts, del);
    listEl.append(box);
  });
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/teams", { method: "POST", body: JSON.stringify({ name: document.querySelector("#name").value.trim() }) });
    form.reset();
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
boot();
