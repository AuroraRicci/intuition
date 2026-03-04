const FeatureStats = (function () {

let elPeriod = null
let elIncomeExpense = null
let elCategories = null

function init() {
elPeriod = AppUtils.qs("#stats-period")
elIncomeExpense = AppUtils.qs("#stats-income-expense")
elCategories = AppUtils.qs("#stats-categories")

AppState.on("data", function () {
render()
})

AppState.on("statsPeriod", function () {
render()
})

AppState.on("screen", function (s) {
if (s === "stats") render()
})

render()
}

function render() {
if (!elPeriod || !elIncomeExpense || !elCategories) return
renderPeriod()
renderIncomeExpense()
renderCategories()
}

function getCurrency() {
let d = AppState.getData()
return (d && d.settings && d.settings.currency) ? d.settings.currency : AppConfig.defaultCurrency
}

function periodKey() {
let ui = AppState.getUI()
let p = ui && ui.statsPeriod ? ui.statsPeriod : "month"
if (p !== "week" && p !== "month" && p !== "year") p = "month"
return p
}

function startOfToday() {
let d = new Date()
d.setHours(0, 0, 0, 0)
return d.getTime()
}

function startOfWeek() {
let d = new Date()
d.setHours(0, 0, 0, 0)
let day = d.getDay()
let diff = (day + 6) % 7
d.setDate(d.getDate() - diff)
return d.getTime()
}

function startOfMonth() {
let d = new Date()
d.setHours(0, 0, 0, 0)
d.setDate(1)
return d.getTime()
}

function startOfYear() {
let d = new Date()
d.setHours(0, 0, 0, 0)
d.setMonth(0, 1)
return d.getTime()
}

function parseTime(ds) {
let t = Date.parse(ds)
if (!isFinite(t)) return 0
return t
}

function periodStartTs(p) {
if (p === "week") return startOfWeek()
if (p === "year") return startOfYear()
return startOfMonth()
}

function filterTxns() {
let d = AppState.getData()
let txns = (d && d.transactions) ? d.transactions : []
let p = periodKey()
let start = periodStartTs(p)
let out = []
for (let i = 0; i < txns.length; i++) {
let t = txns[i]
let ts = parseTime(t.date)
if (ts >= start) out.push(t)
}
return out
}

function getCategoryMap() {
let d = AppState.getData()
let map = { all: "Uncategorized" }
let inc = (d && d.categories && d.categories.income) ? d.categories.income : []
let exp = (d && d.categories && d.categories.expense) ? d.categories.expense : []
for (let i = 0; i < inc.length; i++) map[inc[i].id] = inc[i].name
for (let i = 0; i < exp.length; i++) map[exp[i].id] = exp[i].name
return map
}

function renderPeriod() {
AppUI.clear(elPeriod)

let card = AppUI.card("Period")

let row = AppUtils.el("div")
row.style.display = "grid"
row.style.gridTemplateColumns = "1fr"
row.style.gap = "10px"

let sel = AppUtils.el("select")
let o1 = AppUtils.el("option"); o1.value = "week"; o1.textContent = "This week"
let o2 = AppUtils.el("option"); o2.value = "month"; o2.textContent = "This month"
let o3 = AppUtils.el("option"); o3.value = "year"; o3.textContent = "This year"
sel.appendChild(o1); sel.appendChild(o2); sel.appendChild(o3)
sel.value = periodKey()

sel.addEventListener("change", function () {
AppState.setStatsPeriod(sel.value)
})

row.appendChild(sel)
card.appendChild(row)
elPeriod.appendChild(card)
}

function renderIncomeExpense() {
AppUI.clear(elIncomeExpense)

let currency = getCurrency()
let txns = filterTxns()

let income = 0
let expense = 0
for (let i = 0; i < txns.length; i++) {
let t = txns[i]
let a = Number(t.amount) || 0
if (t.type === "income") income += a
else expense += a
}

let balance = income - expense

let card = AppUI.card("Overview")

let grid = AppUtils.el("div")
grid.style.display = "grid"
grid.style.gridTemplateColumns = "1fr 1fr"
grid.style.gap = "10px"

grid.appendChild(metricBox("Income", AppUtils.formatMoney(income, currency), "#34d399"))
grid.appendChild(metricBox("Expenses", AppUtils.formatMoney(expense, currency), "#fb7185"))

let balBox = AppUtils.el("div")
balBox.style.marginTop = "10px"
balBox.style.padding = "12px"
balBox.style.borderRadius = "12px"
balBox.style.border = "1px solid rgba(255,255,255,0.08)"
balBox.style.background = "rgba(255,255,255,0.03)"

let balLabel = AppUtils.el("div")
balLabel.style.fontSize = "12px"
balLabel.style.fontWeight = "700"
balLabel.style.color = "#94a3b8"
balLabel.textContent = "Balance"

let balValue = AppUtils.el("div")
balValue.style.marginTop = "4px"
balValue.style.fontSize = "22px"
balValue.style.fontWeight = "900"
balValue.textContent = AppUtils.formatMoney(balance, currency)
balValue.style.color = balance >= 0 ? "#34d399" : "#fb7185"

balBox.appendChild(balLabel)
balBox.appendChild(balValue)

let barWrap = AppUtils.el("div")
barWrap.style.marginTop = "12px"
barWrap.appendChild(splitBar(income, expense))

card.appendChild(grid)
card.appendChild(balBox)
card.appendChild(barWrap)

elIncomeExpense.appendChild(card)
}

function metricBox(label, value, color) {
let box = AppUtils.el("div")
box.style.padding = "12px"
box.style.borderRadius = "12px"
box.style.border = "1px solid rgba(255,255,255,0.08)"
box.style.background = "rgba(255,255,255,0.03)"

let l = AppUtils.el("div")
l.style.fontSize = "12px"
l.style.fontWeight = "700"
l.style.color = "#94a3b8"
l.textContent = label

let v = AppUtils.el("div")
v.style.marginTop = "4px"
v.style.fontSize = "18px"
v.style.fontWeight = "900"
v.textContent = value
if (color) v.style.color = color

box.appendChild(l)
box.appendChild(v)
return box
}

function splitBar(income, expense) {
let total = Math.max(0, Number(income) || 0) + Math.max(0, Number(expense) || 0)
let iPct = total > 0 ? Math.round((Math.max(0, income) / total) * 100) : 0
let ePct = 100 - iPct

let wrap = AppUtils.el("div")
wrap.style.border = "1px solid rgba(255,255,255,0.08)"
wrap.style.borderRadius = "999px"
wrap.style.overflow = "hidden"
wrap.style.height = "14px"
wrap.style.background = "rgba(255,255,255,0.03)"

let i = AppUtils.el("div")
i.style.height = "100%"
i.style.width = iPct + "%"
i.style.background = "rgba(52,211,153,0.85)"

let e = AppUtils.el("div")
e.style.height = "100%"
e.style.width = ePct + "%"
e.style.background = "rgba(251,113,133,0.85)"

wrap.style.display = "flex"
wrap.appendChild(i)
wrap.appendChild(e)

let label = AppUtils.el("div")
label.style.marginTop = "8px"
label.style.display = "flex"
label.style.justifyContent = "space-between"
label.style.fontSize = "12px"
label.style.color = "#94a3b8"
label.innerHTML = "<span>Income " + iPct + "%</span><span>Expenses " + ePct + "%</span>"

let out = AppUtils.el("div")
out.appendChild(wrap)
out.appendChild(label)
return out
}

function renderCategories() {
AppUI.clear(elCategories)

let currency = getCurrency()
let txns = filterTxns()
let catMap = getCategoryMap()

let incomeBy = {}
let expenseBy = {}

for (let i = 0; i < txns.length; i++) {
let t = txns[i]
let a = Number(t.amount) || 0
let id = t.categoryId || "all"
if (t.type === "income") {
if (!incomeBy[id]) incomeBy[id] = 0
incomeBy[id] += a
} else {
if (!expenseBy[id]) expenseBy[id] = 0
expenseBy[id] += a
}
}

let incomeTotal = sumMap(incomeBy)
let expenseTotal = sumMap(expenseBy)

let card = AppUI.card("By Category")

let hint = AppUtils.el("div")
hint.style.color = "#94a3b8"
hint.style.fontSize = "13px"
hint.style.lineHeight = "1.35"
hint.style.marginBottom = "10px"
hint.textContent = "Category totals are calculated from the selected period."
card.appendChild(hint)

let block = AppUtils.el("div")
block.style.display = "grid"
block.style.gridTemplateColumns = "1fr"
block.style.gap = "12px"

block.appendChild(categorySection("Expenses", expenseBy, expenseTotal, catMap, currency, "#fb7185"))
block.appendChild(categorySection("Income", incomeBy, incomeTotal, catMap, currency, "#34d399"))

card.appendChild(block)
elCategories.appendChild(card)
}

function categorySection(title, map, total, catMap, currency, accent) {
let wrap = AppUtils.el("div")
wrap.style.border = "1px solid rgba(255,255,255,0.08)"
wrap.style.borderRadius = "14px"
wrap.style.padding = "12px"
wrap.style.background = "rgba(255,255,255,0.02)"

let t = AppUtils.el("div")
t.style.fontWeight = "900"
t.style.marginBottom = "8px"
t.textContent = title

wrap.appendChild(t)

let keys = Object.keys(map || {})
keys.sort(function (a, b) { return (map[b] || 0) - (map[a] || 0) })

if (keys.length === 0 || total <= 0) {
wrap.appendChild(AppUI.emptyState("No data yet."))
return wrap
}

let maxRows = 8
for (let i = 0; i < keys.length && i < maxRows; i++) {
let id = keys[i]
let value = Number(map[id]) || 0
if (value <= 0) continue
let pct = total > 0 ? Math.round((value / total) * 100) : 0
wrap.appendChild(categoryRow(catMap[id] || "Uncategorized", value, pct, total, currency, accent))
}

if (keys.length > maxRows) {
let more = AppUtils.el("div")
more.style.marginTop = "8px"
more.style.fontSize = "12px"
more.style.color = "#94a3b8"
more.textContent = "Showing top " + maxRows + " categories."
wrap.appendChild(more)
}

return wrap
}

function categoryRow(name, value, pct, total, currency, accent) {
let row = AppUtils.el("div")
row.style.marginTop = "10px"

let head = AppUtils.el("div")
head.style.display = "flex"
head.style.justifyContent = "space-between"
head.style.gap = "10px"
head.style.alignItems = "baseline"

let l = AppUtils.el("div")
l.style.fontWeight = "750"
l.textContent = name

let r = AppUtils.el("div")
r.style.fontWeight = "900"
r.style.color = accent
r.textContent = AppUtils.formatMoney(value, currency)

head.appendChild(l)
head.appendChild(r)

let barWrap = AppUtils.el("div")
barWrap.style.marginTop = "6px"
barWrap.style.border = "1px solid rgba(255,255,255,0.08)"
barWrap.style.borderRadius = "999px"
barWrap.style.overflow = "hidden"
barWrap.style.height = "10px"
barWrap.style.background = "rgba(255,255,255,0.03)"

let bar = AppUtils.el("div")
bar.style.height = "100%"
bar.style.width = Math.max(2, Math.min(100, pct)) + "%"
bar.style.background = accent
bar.style.opacity = "0.85"
barWrap.appendChild(bar)

let foot = AppUtils.el("div")
foot.style.marginTop = "6px"
foot.style.display = "flex"
foot.style.justifyContent = "space-between"
foot.style.fontSize = "12px"
foot.style.color = "#94a3b8"
foot.innerHTML = "<span>" + pct + "%</span><span>" + AppUtils.formatMoney(total, currency) + " total</span>"

row.appendChild(head)
row.appendChild(barWrap)
row.appendChild(foot)
return row
}

function sumMap(map) {
let total = 0
let keys = Object.keys(map || {})
for (let i = 0; i < keys.length; i++) total += Number(map[keys[i]] || 0)
return total
}

return {
init
}

})()
