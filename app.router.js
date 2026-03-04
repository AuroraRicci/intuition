const AppRouter = (function () {

let screenIds = [
"dashboard",
"transactions",
"budget",
"stats",
"more",
"categories",
"goals",
"bills",
"settings"
]

let initialized = false

function init() {
if (initialized) return
initialized = true

bindTabs()
bindMoreItems()
bindPopState()

let start = getScreenFromHash() || AppState.getUI().screen || "dashboard"
go(start, true)
}

function bindTabs() {
let buttons = AppUtils.qsa(".tabs button")
for (let i = 0; i < buttons.length; i++) {
buttons[i].addEventListener("click", function () {
let s = this.getAttribute("data-screen")
if (!s) return
go(s)
})
}
}

function bindMoreItems() {
let items = AppUtils.qsa(".more-item")
for (let i = 0; i < items.length; i++) {
items[i].addEventListener("click", function () {
let s = this.getAttribute("data-screen")
if (!s) return
go(s)
})
}
}

function bindPopState() {
window.addEventListener("popstate", function () {
let s = getScreenFromHash() || "dashboard"
go(s, true)
})
}

function getScreenFromHash() {
let h = (location.hash || "").replace("#", "").trim()
if (!h) return ""
if (h.indexOf("/") >= 0) h = h.split("/")[0]
if (!isKnownScreen(h)) return ""
return h
}

function isKnownScreen(screenName) {
for (let i = 0; i < screenIds.length; i++) {
if (screenIds[i] === screenName) return true
}
return false
}

function setHash(screenName, replace) {
let next = "#" + screenName
if (replace) history.replaceState(null, "", next)
else history.pushState(null, "", next)
}

function go(screenName, replace) {
let s = isKnownScreen(screenName) ? screenName : "dashboard"
AppState.setScreen(s)
setHash(s, !!replace)
render(s)
}

function render(screenName) {
let screens = AppUtils.qsa(".screen")
for (let i = 0; i < screens.length; i++) {
screens[i].classList.remove("active")
}

let el = AppUtils.qs("#screen-" + screenName)
if (el) el.classList.add("active")

let tabButtons = AppUtils.qsa(".tabs button")
for (let i = 0; i < tabButtons.length; i++) {
tabButtons[i].classList.remove("active")
let ds = tabButtons[i].getAttribute("data-screen")
if (ds === screenName) tabButtons[i].classList.add("active")
}

let isSub = screenName === "categories" || screenName === "goals" || screenName === "bills" || screenName === "settings"
if (isSub) {
for (let i = 0; i < tabButtons.length; i++) {
let ds = tabButtons[i].getAttribute("data-screen")
if (ds === "more") tabButtons[i].classList.add("active")
}
}
}

return {
init,
go
}

})()
