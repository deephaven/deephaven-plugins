# Render Cycle

Before your components are displayed on screen, they must be rendered. Understanding the steps in this process will help you think about how your code executes and explain its behavior.

Think of your components as chefs in a kitchen, preparing delicious meals from various ingredients. In this analogy, `deephaven.ui` acts as the waiter, taking orders from customers and delivering the finished dishes. This process of handling UI requests and rendering them involves three main steps:

1. Triggering a render (delivering the guest’s order to the kitchen)
2. Rendering the component (preparing the order in the kitchen)
3. Committing to the DOM (placing the order on the table)

## Step 1: Trigger a render
