# Choose the State Structure

Structuring state effectively can be the difference between a component that is easy to modify and debug, and one that is a persistent source of bugs. Here are some tips to consider when organizing state.

## Principles for structuring state

When you write a component that holds state, you will make choices about how many state variables to use and what the shape of their data should be. While it is possible to write correct programs even with a suboptimal state structure, there are a few principles that can help you to make better choices:

1. **Group related state.** If you always update two or more state variables at the same time, consider merging them into a single state variable.
2. **Avoid contradictions in state.** When the state is structured in a way that several pieces of state may contradict and “disagree” with each other, you leave room for mistakes. Try to avoid this.
3. **Avoid redundant state.** If you can calculate some information from the component’s props or its existing state variables during rendering, you should not put that information into that component’s state.
4. **Avoid duplication in state.** When the same data is duplicated between multiple state variables, or within nested objects, it is difficult to keep them in sync. Reduce duplication when you can.
5. **Avoid deeply nested state.** Deeply hierarchical state is not very convenient to update. When possible, prefer to structure state in a flat way.

The purpose of these principles is to simplify state updates and minimize errors. By eliminating redundant and duplicate data from the state, you can ensure consistency across all its pieces. This approach is akin to how a database engineer might "normalize" a database structure to minimize bugs.

## Group related state
