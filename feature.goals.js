const FeatureGoals = (function () {

let elList = null
let btnAdd = null

function init() {
elList = AppUtils.qs("#goals-list")
btnAdd = AppUtils.qs("#goal-add")

if (btnAdd) {
btnAdd.addEventListener("click", function () {
openAdd()
})
}

AppState.on("data", function () {
render()
})

AppState.on("screen", function (s) {
if (s === "goals") render()
})

render()
}

function ensureGoals() {
let d = AppState.getData()
if (!Array.isArray(d.goals)) d.goals = []
}

function getCurrency() {
let d = AppState.getData()
return (d && d.settings && d.settings.currency) ? d.settings.currency : AppConfig.defaultCurrency
}

function parseAmount(v) {
if (v == null) return 0
let s = String(v).replace(",", ".").replace(/[^0-9.\-]/g, "")
let n = Number(s)
if (!isFinite(n)) return 0
return n
}

function render() {
if (!elList) return
ensureGoals()

AppUI.clear(elList)

let d = AppState.getData()
let goals = d.goals || []
let currency = getCurrency()

let card = AppUI.card("Goals")
if (goals.length === 0) {
card.appendChild(AppUI.emptyState("No goals yet."))
} else {
for (let i = 0; i < goals.length; i++) {
card.appendChild(buildRow(goals[i], currency))
}
}
elList.appendChild(card)
}

function buildRow(g, currency) {
let row = AppUtils.el("div")
row.className = "item"

let left = AppUtils.el("div")
left.className = "item__left"

let name = AppUtils.el("div")
name.className = "item__note"
name.textContent = String(g.name || "Goal")

let target = Number(g.target) || 0
let current = Number(g.current) || 0
if (current < 0) current = 0
if (target < 0) target = 0

let percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
let sub = AppUtils.el("div")
sub.className = "item__date"
sub.textContent = AppUtils.formatMoney(current, currency) + " / " + AppUtils.formatMoney(target, currency) + " • " + percent + "%"

left.appendChild(name)
left.appendChild(sub)

let right = AppUtils.el("div")
right.className = "item__sum"
right.textContent = percent >= 100 ? "✅" : "🎯"

row.appendChild(left)
row.appendChild(right)

row.addEventListener("click", function () {
openEdit(g.id)
})

return row
}

function openAdd() {
ensureGoals()
let currency = getCurrency()

AppUI.formModal({
title: "Add Goal",
okText: "Save",
cancelText: "Cancel",
fields: [
{ id: "name", label: "Name", kind: "text", placeholder: "e.g., Emergency Fund", value: "" },
{ id: "target", label: "Target (" + currency + ")", kind: "number", placeholder: "0", value: "" },
{ id: "current", label: "Current (" + currency + ")", kind: "number", placeholder: "0", value: "" }
],
onSubmit: function (values) {
let name = String(values.name || "").trim()
if (!name) {
AppUI.toast("Enter a goal name.")
return false
}
if (name.length > 40) name = name.slice(0, 40)

let target = parseAmount(values.target)
if (!(target > 0)) {
AppUI.toast("Enter a valid target.")
return false
}

let current = parseAmount(values.current)
if (current < 0) current = 0
if (current > target) current = target

let d = AppState.getData()
d.goals.push({
id: AppUtils.uuid(),
name: name,
target: target,
current: current,
createdAt: Date.now()
})
AppState.save()
AppUI.toast("Saved.")
return true
}
})
}

function openEdit(id) {
ensureGoals()
let d = AppState.getData()
let goals = d.goals || []
let idx = indexById(goals, id)
if (idx < 0) return
let g = goals[idx]
let currency = getCurrency()

let body = AppUtils.el("div")

let btnRow = AppUtils.el("div")
btnRow.style.display = "flex"
btnRow.style.gap = "10px"
btnRow.style.marginBottom = "10px"

let delBtn = AppUtils.el("button")
delBtn.textContent = "Delete"
delBtn.style.background = "rgba(251,113,133,0.16)"
delBtn.style.color = "#fb7185"
delBtn.addEventListener("click", function () {
AppUI.confirm("Delete Goal", "Delete this goal?", function () {
removeById(id)
AppUI.closeModal()
AppUI.toast("Deleted.")
})
})

let addProgressBtn = AppUtils.el("button")
addProgressBtn.textContent = "Add Progress"
addProgressBtn.style.background = "rgba(148,163,184,0.18)"
addProgressBtn.style.color = "#e2e8f0"
addProgressBtn.addEventListener("click", function () {
openAddProgress(id)
})

btnRow.appendChild(delBtn)
btnRow.appendChild(addProgressBtn)

body.appendChild(btnRow)

let formWrap = AppUtils.el("div")
body.appendChild(formWrap)

AppUI.openModal({
title: "Edit Goal",
bodyEl: body,
cancelText: "Close",
okText: "Save",
onOk: function () {
let modal = document.querySelector(".modal")
if (!modal) return true
let inputs = modal.querySelectorAll("input")
if (!inputs || inputs.length < 3) return true

let name = String(inputs[0].value || "").trim()
let target = parseAmount(inputs[1].value)
let current = parseAmount(inputs[2].value)

if (!name) {
AppUI.toast("Enter a goal name.")
return false
}
if (!(target > 0)) {
AppUI.toast("Enter a valid target.")
return false
}
if (current < 0) current = 0
if (current > target) current = target

let d2 = AppState.getData()
let goals2 = d2.goals || []
let idx2 = indexById(goals2, id)
if (idx2 < 0) return true

goals2[idx2].name = name
goals2[idx2].target = target
goals2[idx2].current = current

AppState.save()
AppUI.toast("Saved.")
return true
}
})

setTimeout(function () {
let modal = document.querySelector(".modal")
if (!modal) return
formWrap.innerHTML = ""

let name = AppUtils.el("input")
name.type = "text"
name.value = String(g.name || "")
name.placeholder = "Name"

let target = AppUtils.el("input")
target.type = "text"
target.inputMode = "decimal"
target.value = String(g.target || "")
target.placeholder = "0"

let current = AppUtils.el("input")
current.type = "text"
current.inputMode = "decimal"
current.value = String(g.current || "")
current.placeholder = "0"

appendField(formWrap, "Name", name)
appendField(formWrap, "Target (" + currency + ")", target)
appendField(formWrap, "Current (" + currency + ")", current)
}, 0)
}

function openAddProgress(id) {
ensureGoals()
let d = AppState.getData()
let goals = d.goals || []
let idx = indexById(goals, id)
if (idx < 0) return
let g = goals[idx]
let currency = getCurrency()

AppUI.formModal({
title: "Add Progress",
okText: "Add",
cancelText: "Cancel",
fields: [
{ id: "amount", label: "Amount (" + currency + ")", kind: "number", placeholder: "0", value: "" }
],
onSubmit: function (values) {
let add = parseAmount(values.amount)
if (!(add > 0)) {
AppUI.toast("Enter a valid amount.")
return false
}

let d2 = AppState.getData()
let goals2 = d2.goals || []
let idx2 = indexById(goals2, id)
if (idx2 < 0) return true

let target = Number(goals2[idx2].target) || 0
let current = Number(goals2[idx2].current) || 0
current += add
if (target > 0 && current > target) current = target
goals2[idx2].current = current

AppState.save()
AppUI.toast("Updated.")
return true
}
})
}

function appendField(root, labelText, inputEl) {
let wrap = AppUtils.el("div")
wrap.style.marginBottom = "10px"
let lab = AppUtils.el("label")
lab.style.display = "block"
lab.style.fontSize = "12px"
lab.style.fontWeight = "700"
lab.style.color = "#94a3b8"
lab.style.marginBottom = "6px"
lab.textContent = labelText
wrap.appendChild(lab)
wrap.appendChild(inputEl)
root.appendChild(wrap)
}

function indexById(list, id) {
for (let i = 0; i < list.length; i++) {
if (list[i].id === id) return i
}
return -1
}

function removeById(id) {
let d = AppState.getData()
let goals = d.goals || []
let next = []
for (let i = 0; i < goals.length; i++) {
if (goals[i].id !== id) next.push(goals[i])
}
d.goals = next
AppState.save()
}

return {
init,
openAdd
}

})()
