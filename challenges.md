1. We need a way to send data after the initial data has been sent (plugin limitation)
2. Data columns (x, y, etc.) are sometimes combined into one data object if a category such as color is provided
3. When new categories are added you need to add a new data object, but keep track of where you are, such as in color_discrete_sequence
4. It isn't always clear where the new data object should be inserted
5. If you insert a data point with a new color value, but not a new symbol value, you need to have stored what symbol was used
6. Categories such as color are sometimes processed differently if the column is numerical vs categorical
7. With faceting, you need to make sure to add the proper axis
8. We need to extract defaults (or create our own) for properties such as color
9. We need to merge layouts when we're adding data in some way
10. What do we do if passed something that isn't a deephaven table and columns in it?
