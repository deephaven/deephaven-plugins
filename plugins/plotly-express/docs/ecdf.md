# ECDF Plot

> [!WARNING]
> This plot type is not yet implemented.

An Empirical Cumulative Distribution Function (ECDF) plot is a non-parametric statistical tool used to visualize the distribution of data. It displays the cumulative proportion of data points that are less than or equal to a given value, providing insights into data spread and characteristics without making assumptions about the underlying probability distribution.

Interpreting an Empirical Cumulative Distribution Function (ECDF) involves examining its curve, which represents the cumulative proportion of data points below a given value. The steepness of the ECDF curve at a particular point indicates the density of data points at that value. Steeper segments imply higher density, while flatter segments suggest lower density.

ECDF plots are appropriate when the data contain a continuous variable of interest.

### What are ECDF plots useful for?

- **Visualizing distributions**: ECDF plots are one approach to visualizing the distribution of a continuous variable. They scale well for large datasets, but can be counterintuitive to read without proper context.
- **Comparing to a Normal distribution**: ECDF plots are often plotted against the ECDF of an appropriate normal distribution to indicate whether the data are normally distributed.
- **Computing empirical percentiles**: ECDF plots can be used to compute the empirical percentile of any given value in a dataset, yielding a quick and easy way to visualize a laborious calculation.