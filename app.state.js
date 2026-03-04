const AppState = (function () {

let data = null

let ui = {
screen: "dashboard",
statsPeriod: "month",
transactionsFilters: {
type: "all",
categoryId: "all",
query: "",
sort: "date_desc"
}
}

let listeners = {}

function init() {
data = AppStorage.load()
applyTheme(data.settings.theme)
}

function getData() {
return data
}

function setData(next) {
data = next
AppStorage.save(data)
emit("data")
}

function save() {
AppStorage.save(data)
emit("data")
}

function on(event, fn) {
if (!listeners[event]) listeners[event] = []
listeners[event].push(fn)
return function () {
listeners[event] = (listeners[event] || []).filter(x => x !== fn)
}
}

function emit(event, payload) {
let list = listeners[event] || []
for (let i = 0; i < list.length; i++) {
try { list[i](payload) } catch {}
}
}

function getUI() {
return ui
}

function setScreen(screenName) {
ui.screen = screenName
emit("screen", screenName)
}

function setStatsPeriod(period) {
ui.statsPeriod = period
emit("statsPeriod", period)
}

function setTransactionsFilter(partial) {
ui.transactionsFilters = Object.assign({}, ui.transactionsFilters, partial || {})
emit("transactionsFilters", ui.transactionsFilters)
}

function updateSettings(partial) {
data.settings = Object.assign({}, data.settings, partial || {})
AppStorage.save(data)
if (partial && typeof partial.theme === "string") applyTheme(partial.theme)
emit("settings", data.settings)
emit("data")
}

function applyTheme(theme) {
let t = theme === "light" ? "light" : "dark"
document.documentElement.setAttribute("data-theme", t)
}

function resetAll() {
AppStorage.clear()
data = AppStorage.load()
applyTheme(data.settings.theme)
emit("settings", data.settings)
emit("screen", ui.screen)
emit("data")
}

return {
init,
getData,
setData,
save,
on,
emit,
getUI,
setScreen,
setStatsPeriod,
setTransactionsFilter,
updateSettings,
resetAll
}

})()
