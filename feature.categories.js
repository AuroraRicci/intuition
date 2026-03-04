const FeatureCategories = (function () {

let elIncome = null
let elExpense = null
let btnAdd = null

function init() {
elIncome = AppUtils.qs("#categories-income")
elExpense = AppUtils.qs("#categories-expense")
btnAdd = AppUtils.qs("#category-add")

if (btnAdd) {
btnAdd.addEventListener("click", function () {
openAdd()
})
}

AppState.on("data", function () {
render()
})
AppState.on("screen", function (s) {
if (s === "categories") render()
})

render()
}

function getData() {
return AppState.getData()
}

function ensureLists() {
let d = getData()
if (!d.categories) d.categories = { income: [], expense: [] }
if (!Array.isArray(d.categories.income)) d.categories.income = []
if (!Array.isArray(d.categories.expense)) d.categories.expense = []
}

function render() {
if (!elIncome || !elExpense) return
ensureLists()

AppUI.clear(elIncome)
AppUI.clear(elExpense)

let d = getData()
let inc = d.categories.income
let exp = d.categories.expense

let incCard = AppUI.card("Income Categories")
if (inc.length === 0) {
incCard.appendChild(AppUI.emptyState("No income categories."))
} else {
for (let i = 0; i < inc.length; i++) {
incCard.appendChild(buildRow("income", inc[i]))
}
}
elIncome.appendChild(incCard)

let expCard = AppUI.card("Expense Categories")
if (exp.length === 0) {
expCard.appendChild(AppUI.emptyState("No expense categories."))
} else {
for (let i = 0; i < exp.length; i++) {
expCard.appendChild(buildRow("expense", exp[i]))
}
}
elExpense.appendChild(expCard)
}

function buildRow(type, cat) {
let row = AppUtils.el("div")
row.className = "item"

let left = AppUtils.el("div")
left.className = "item__left"

let name = AppUtils.el("div")
name.className = "item__note"
name.textContent = String(cat.name || "Unnamed")

let sub = AppUtils.el("div")
sub.className = "item__date"
sub.textContent = type === "income" ? "Income" : "Expense"

left.appendChild(name)
left.appendChild(sub)

let actions = AppUtils.el("div")
actions.style.display = "flex"
actions.style.gap = "8px"

let editBtn = AppUtils.el("button")
editBtn.textContent = "Edit"
editBtn.style.background = "rgba(148,163,184,0.18)"
editBtn.style.color = "#e2e8f0"
editBtn.addEventListener("click", function (e) {
e.stopPropagation()
openEdit(type, cat.id)
})

let delBtn = AppUtils.el("button")
delBtn.textContent = "Delete"
delBtn.style.background = "rgba(251,113,133,0.16)"
delBtn.style.color = "#fb7185"
delBtn.addEventListener("click", function (e) {
e.stopPropagation()
tryDelete(type, cat.id)
})

actions.appendChild(editBtn)
actions.appendChild(delBtn)

row.appendChild(left)
row.appendChild(actions)

row.addEventListener("click", function () {
openEdit(type, cat.id)
})

return row
}

function openAdd() {
ensureLists()

AppUI.formModal({
title: "Add Category",
okText: "Save",
cancelText: "Cancel",
fields: [
{
id: "type",
label: "Type",
kind: "select",
value: "expense",
options: [
{ value: "income", label: "Income" },
{ value: "expense", label: "Expense" }
]
},
{ id: "name", label: "Name", kind: "text", placeholder: "Category name", value: "" }
],
onSubmit: function (values) {
let type = values.type === "income" ? "income" : "expense"
let name = String(values.name || "").trim()
if (!name) {
AppUI.toast("Enter a category name.")
return false
}
if (name.length > 28) name = name.slice(0, 28)

if (existsName(type, name)) {
AppUI.toast("Category already exists.")
return false
}

let d = getData()
let cat = { id: type + "_" + AppUtils.uuid(), name: name }
d.categories[type].push(cat)
AppState.save()
AppUI.toast("Saved.")
return true
}
})
}

function openEdit(type, id) {
ensureLists()
let d = getData()
let list = type === "income" ? d.categories.income : d.categories.expense
let idx = indexById(list, id)
if (idx < 0) return
let cat = list[idx]

AppUI.formModal({
title: "Edit Category",
okText: "Save",
cancelText: "Cancel",
fields: [
{ id: "name", label: "Name", kind: "text", placeholder: "Category name", value: String(cat.name || "") }
],
onSubmit: function (values) {
let name = String(values.name || "").trim()
if (!name) {
AppUI.toast("Enter a category name.")
return false
}
if (name.length > 28) name = name.slice(0, 28)

if (existsName(type, name, id)) {
AppUI.toast("Category already exists.")
return false
}

let d2 = getData()
let list2 = type === "income" ? d2.categories.income : d2.categories.expense
let idx2 = indexById(list2, id)
if (idx2 < 0) return true
list2[idx2].name = name
AppState.save()
AppUI.toast("Saved.")
return true
}
})
}

function tryDelete(type, id) {
let usage = countUsage(id)
let msg = usage > 0
? ("This category is used in " + usage + " transaction(s). Deleting it will mark those transactions as Uncategorized. Continue?")
: "Delete this category?"
AppUI.confirm("Delete Category", msg, function () {
deleteCategory(type, id)
AppUI.toast("Deleted.")
})
}

function deleteCategory(type, id) {
ensureLists()
let d = getData()
let list = type === "income" ? d.categories.income : d.categories.expense

let next = []
for (let i = 0; i < list.length; i++) {
if (list[i].id !== id) next.push(list[i])
}
if (type === "income") d.categories.income = next
else d.categories.expense = next

let txns = d.transactions || []
for (let i = 0; i < txns.length; i++) {
if (txns[i].categoryId === id) txns[i].categoryId = "all"
}

AppState.save()
}

function countUsage(categoryId) {
let d = getData()
let txns = d.transactions || []
let c = 0
for (let i = 0; i < txns.length; i++) {
if (txns[i].categoryId === categoryId) c++
}
return c
}

function indexById(list, id) {
for (let i = 0; i < list.length; i++) {
if (list[i].id === id) return i
}
return -1
}

function normalizeName(s) {
return String(s || "").trim().toLowerCase()
}

function existsName(type, name, excludeId) {
ensureLists()
let d = getData()
let list = type === "income" ? d.categories.income : d.categories.expense
let n = normalizeName(name)
for (let i = 0; i < list.length; i++) {
if (excludeId && list[i].id === excludeId) continue
if (normalizeName(list[i].name) === n) return true
}
return false
}

return {
init,
openAdd
}

})()
