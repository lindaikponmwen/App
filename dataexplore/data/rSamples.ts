
import { ChartType } from '../types';

export const R_SAMPLES: Record<ChartType, string> = {
  [ChartType.SCATTER]: `# =========================================================
# Script: Scatter Plot (Bivariate Analysis)
# Purpose: Explore correlations between variables.
# =========================================================
library(ggplot2)

ggplot(plot_data, aes(x = TIME, y = DV, color = factor(GROUP))) +
  geom_point(size = 2, alpha = 0.7) +
  geom_smooth(method = "loess", se = FALSE, size = 0.8) +
  xlab("Time (hours)") +
  ylab("Concentration (DV)") +
  labs(
    title = "Concentration Scatter Distribution",
    color = "Group"
  ) +
  theme_bw() +
  theme(legend.position = "bottom")`,

  [ChartType.LINE]: `# =========================================================
# Script: Mean Concentration-Time Profile
# Purpose: Visualize average pharmacological kinetics.
# =========================================================
library(ggplot2)
library(dplyr)

summary_data <- plot_data %>%
  group_by(GROUP, TIME) %>%
  mutate(MEAN_DV = mean(DV, na.rm = TRUE), 
        MEDIAN_DV = median(DV, na.rm = TRUE))

ggplot(summary_data, aes(x = TIME, y = MEAN_DV, color = GROUP)) +
  geom_line(size = 1.2) +
  geom_point(size = 3, aes(y=DV)) +
  xlab("Time (hours)") +
  ylab("Mean Concentration (DV)") +
  labs(
    title = "Mean Concentration-Time Profiles",
    color = "Group"
  ) +
  theme_bw()`,

  [ChartType.SPAGHETTI]: `# =========================================================
# Script: Individual Profiles (Spaghetti Plot)
# Purpose: Visualize variability across subjects.
# =========================================================
library(ggplot2)

ggplot(plot_data, aes(x = TIME, y = DV, group = ID, color = factor(GROUP))) +
  geom_line(alpha = 0.5) +
  geom_point(size = 1, alpha = 0.5) +
  xlab("Time (hours)") +
  ylab("Concentration (DV)") +
  labs(
    title = "Individual PK Profiles",
    color = "Group"
  ) +
  theme_bw() +
  theme(legend.position = "bottom")`,

  [ChartType.COND_SCATTER]: `# =========================================================
# Script: Conditional Scatter Plots
# Purpose: Stratified relationship analysis by subgroup.
# =========================================================
library(ggplot2)

ggplot(plot_data, aes(x = TIME, y = DV)) +
  geom_point(alpha = 0.6) +
  geom_smooth(method = "lm", colour = "blue", size = 0.5) +
  facet_wrap(~GROUP) +
  xlab("Time (hours)") +
  ylab("Concentration (DV)") +
  labs(
    title = "Conditional Concentration Trends"
  ) +
  theme_bw()`,

  [ChartType.HISTOGRAM]: `# =========================================================
# Script: Histogram of Variables
# Purpose: Check for normality and identify outliers.
# =========================================================
library(ggplot2)

ggplot(plot_data, aes(x = DV)) +
  geom_histogram(aes(y = ..density..), bins = 20, fill = "steelblue", color = "white", alpha = 0.5) +
  geom_density(color = "#2c3e50", size = 1) +
  geom_vline(aes(xintercept = mean(DV, na.rm = TRUE)), color = "red", linetype = "dashed", size = 0.8) +
  xlab("Concentration (DV)") +
  ylab("Density") +
  labs(
    title = "Variable Distribution Analysis"
  ) +
  theme_bw()`,

  [ChartType.DENSITY]: `# =========================================================
# Script: Density Plots
# Purpose: Smoothed visualization of data density.
# =========================================================
library(ggplot2)

ggplot(plot_data, aes(x = DV, fill = GROUP)) +
  geom_density(alpha = 0.4) +
  xlab("Concentration (DV)") +
  ylab("Density") +
  labs(
    title = "Data Density Distribution",
    fill = "Group"
  ) +
  theme_bw()`,

  [ChartType.BOXPLOT]: `# =========================================================
# Script: Box Plots of Covariates
# Purpose: Summarize distribution of continuous covariates.
# =========================================================
library(ggplot2)

ggplot(plot_data, aes(x = GROUP, y = WT, fill = GROUP)) +
  geom_boxplot(outlier.shape = 21, alpha = 0.7) +
  xlab("Treatment Group") +
  ylab("Body Weight (kg)") +
  labs(
    title = "Weight Distribution by Dose Group",
    fill = "Group"
  ) +
  theme_bw()`,

  [ChartType.PAIRS]: `# =========================================================
# Script: Scatterplot Matrix (Pairs Plot)
# Purpose: Assess pairwise relationships among covariates.
# =========================================================
num_cols <- plot_data[, sapply(plot_data, is.numeric)]
cov_cols <- num_cols[, !names(num_cols) %in% c("ID", "TIME")]

pairs(cov_cols, 
      main = "Covariate Scatterplot Matrix",
      pch = 21, 
      bg = "steelblue", 
      col = "white")`,

  [ChartType.PIE]: `# =========================================================
# Script: Compositional Analysis
# Purpose: Distribution of subjects across groups.
# =========================================================
library(ggplot2)
library(dplyr)

pie_data <- plot_data %>%
  distinct(ID, .keep_all = TRUE) %>%
  count(GROUP)

ggplot(pie_data, aes(x = "", y = n, fill = GROUP)) +
  geom_bar(stat = "identity", width = 1) +
  coord_polar("y", start = 0) +
  xlab(NULL) +
  ylab(NULL) +
  labs(title = "Subject Distribution by Group") +
  theme_void()`,

  [ChartType.SUMMARY_TABLE]: `# =========================================================
# Script: Summary Statistics Table (table1)
# =========================================================
library(table1)

plot_data$SEX <- factor(plot_data$SEX)
plot_data$GROUP <- factor(plot_data$GROUP)

t1 <- table1(~ AGE + WT + SEX + DV | GROUP, 
             data = plot_data, 
             overall = "Total")

print(t1)`,

  [ChartType.FREQ_TABLE]: `# =========================================================
# Script: Frequency Table (table1)
# =========================================================
library(table1)

sub_data <- plot_data[!duplicated(plot_data$ID), ]

t1 <- table1(~ factor(SEX) + factor(GROUP), 
             data = sub_data,
             caption = "Subject Demographics Distribution")

print(t1)`,

  [ChartType.LISTING_TABLE]: `# =========================================================
# Script: Data Listing (knitr::kable)
# =========================================================
library(dplyr)
library(knitr)

res_table <- plot_data %>% group_by(GROUP) %>%
  summarise(N = n(), Pct = 100*N/nrow(plot_data))

knitr::kable(res_table, format = "html")`,

  [ChartType.PK_PARAM_TABLE]: `# =========================================================
# Script: PK Parameter Summary Tables
# =========================================================
library(dplyr)
library(table1)

pk_params <- plot_data %>%
  group_by(ID, GROUP) %>%
  summarise(
    Cmax = max(DV, na.rm = TRUE),
    Tmax = TIME[which.max(DV)],
    .groups = 'drop'
  )

t1 <- table1(~ Cmax + Tmax | GROUP, 
             data = pk_params,
             caption = "Estimated PK Parameters by Dose Group")

print(t1)`
};
