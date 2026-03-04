(function () {

function init() {
AppState.init()
AppUI.init()
AppRouter.init()

FeatureTransactions.init()
FeatureCategories.init()
FeatureBudget.init()
FeatureGoals.init()
FeatureBills.init()
FeatureStats.init()
FeatureSettings.init()

wireGlobalActions()
AppState.emit("data")
AppState.emit("settings", AppState.getData().settings)
AppState.emit("screen", AppState.getUI().screen || "dashboard")
}

function wireGlobalActions() {
let btnAdd = AppUtils.qs("#btnAdd")
if (btnAdd) {
btnAdd.addEventListener("click", function () {
FeatureTransactions.openAdd()
})
}
}

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", init)
} else {
init()
}

})()
