const AppConfig = {
appName: "Finance Assistant",
version: "1.0",
storageKey: "finance_assistant_data",
privacyPolicyUrl: "https://auroraricci.github.io/intuition-privacy/",
defaultCurrency: "USD",
currencies: [
"USD",
"EUR",
"GBP",
"RUB",
"JPY",
"CNY",
"CAD",
"AUD"
],
themes: [
"dark",
"light"
],
defaultCategories: {
income: [
{ id: "income_salary", name: "Salary" },
{ id: "income_bonus", name: "Bonus" },
{ id: "income_gift", name: "Gift" },
{ id: "income_other", name: "Other" }
],
expense: [
{ id: "expense_food", name: "Food" },
{ id: "expense_transport", name: "Transport" },
{ id: "expense_home", name: "Home" },
{ id: "expense_entertainment", name: "Entertainment" },
{ id: "expense_health", name: "Health" },
{ id: "expense_other", name: "Other" }
]
}
}
