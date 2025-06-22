const groceryPrompt = {
  description:
    "Generate a categorized grocery list and 2–10 recipes based on user-defined dietary needs, cost, serving size, and duration. The output is structured for easy frontend rendering.",

  inputParameters: {
    dietType: "DIET_TYPE",
    dietaryRestrictions: "DIETARY_RESTRICTIONS",
    maxCostUSD: 75,
    servingSize: 4,
    durationDays: 7,
  },

  requirements: {
    groceryList: {
      objective:
        "Generate a grocery list that supports the user's dietary preferences for the specified number of people and days, while staying within budget.",
      priorities: [
        "Accessibility (widely available ingredients)",
        "Health and nutrition",
        "Affordability",
      ],
      constraints: {
        maxTotalCostUSD: "Must not exceed maxCostUSD",
        servings: "Must serve servingSize people",
        duration: "Must last for durationDays days",
      },
      categories: [
        "Produce",
        "Dairy",
        "Meat/Protein",
        "Freezer Goods",
        "Canned Goods",
        "Other Grocery Items",
      ],
      itemFormat: {
        Item: "string (e.g., 'Apples')",
        Quantity: "integer (e.g., 6)",
        Price: "float (e.g., 0.75) in USD",
      },
      returnFormat:
        "Return each category as a key in a JavaScript object with an array of grocery items, using the structure below.",
    },

    recipeGeneration: {
      objective:
        "Generate 2–10 unique, simple recipes using only the ingredients from the grocery list.",
      constraints: [
        "Must use only ingredients from the grocery list",
        "Must follow dietType and dietaryRestrictions",
        "Avoid duplicate recipes",
        "Recipes must scale to match servingSize",
      ],
      recipeFormat: {
        title: "string",
        description: "string",
        ingredients: [{ item: "string", quantity: "string" }],
        instructions: ["string"],
        prepTimeMinutes: "integer",
        cookTimeMinutes: "integer",
        servings: "integer",
      },
      returnFormat: "Return all recipes in an array named 'recipes'.",
    },
  },

  outputFormat: {
    type: "JavaScript Object",
    structure: {
      Produce: [{ Item: "string", Quantity: 0, Price: 0.0 }],
      Dairy: [],
      MeatProtein: [],
      FreezerGoods: [],
      CannedGoods: [],
      OtherGroceryItems: [],
      recipes: [
        {
          title: "string",
          description: "string",
          ingredients: [{ item: "string", quantity: "string" }],
          instructions: ["string"],
          prepTimeMinutes: 0,
          cookTimeMinutes: 0,
          servings: 0,
        },
      ],
    },
  },

  example: {
    Produce: [
      { Item: "Carrots", Quantity: 4, Price: 0.5 },
      { Item: "Spinach", Quantity: 1, Price: 2.0 },
    ],
    Dairy: [{ Item: "Greek Yogurt", Quantity: 2, Price: 1.25 }],
    MeatProtein: [{ Item: "Chickpeas", Quantity: 2, Price: 0.9 }],
    FreezerGoods: [],
    CannedGoods: [{ Item: "Diced Tomatoes", Quantity: 1, Price: 1.1 }],
    OtherGroceryItems: [{ Item: "Olive Oil", Quantity: 1, Price: 5.0 }],
    recipes: [
      {
        title: "Chickpea & Spinach Curry",
        description:
          "A simple and flavorful curry using chickpeas and fresh spinach.",
        ingredients: [
          { item: "Chickpeas", quantity: "1 can" },
          { item: "Spinach", quantity: "1 bunch" },
          { item: "Diced Tomatoes", quantity: "1 can" },
        ],
        instructions: [
          "Heat oil in a pan.",
          "Add tomatoes and cook for 5 minutes.",
          "Add chickpeas and spinach, cook until soft.",
          "Season to taste and serve hot.",
        ],
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 4,
      },
    ],
  },
};

module.exports = groceryPrompt;
