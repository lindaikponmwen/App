import { ChartType } from '../types';

export const R_SAMPLES: Record<string, string> = {
  [ChartType.DV_VS_IPRED]: `# =========================================================
# File: dv_vs_ipred.R
# Author: ModelExplorer1 AI Engine
# R Version: 4.2.0 (webr)
# Purpose: Goodness-of-fit plot of Observed (DV) vs. 
#          Individual Predicted (IPRED) concentrations.
# =========================================================
library(ggplot2)

ggplot(plot_data, aes(x = IPRED, y = DV)) +
  geom_point(aes(color = factor(ID)), alpha = 0.6, size = 2) +
  geom_abline(intercept = 0, slope = 1, linetype = "dashed", color = "red", size = 1) +
  geom_smooth(method = "loess", se = FALSE, color = "blue", size = 0.8) +
  xlab("Individual Predicted Concentration (IPRED)") +
  ylab("Observed Concentration (DV)") +
  labs(
    title = "Observed vs. Individual Predicted Concentrations",
    color = "Subject ID"
  ) +
  theme_bw(base_size = 14) +
  theme(legend.position = "none")

# To save the plot to a file, uncomment the line below
# ggsave("dv_vs_ipred.png", width = 8, height = 6, dpi = 300)`,
  
  [ChartType.DV_VS_PRED]: `# =========================================================
# File: dv_vs_pred.R
# Author: ModelExplorer1 AI Engine
# R Version: 4.2.0 (webr)
# Purpose: Goodness-of-fit plot of Observed (DV) vs. 
#          Population Predicted (PRED) concentrations.
# =========================================================
library(ggplot2)

ggplot(plot_data, aes(x = PRED, y = DV)) +
  geom_point(aes(color = factor(ID)), alpha = 0.6, size = 2) +
  geom_abline(intercept = 0, slope = 1, linetype = "dashed", color = "red", size = 1) +
  geom_smooth(method = "loess", se = FALSE, color = "blue", size = 0.8) +
  xlab("Population Predicted Concentration (PRED)") +
  ylab("Observed Concentration (DV)") +
  labs(
    title = "Observed vs. Population Predicted Concentrations",
    color = "Subject ID"
  ) +
  theme_bw(base_size = 14) +
  theme(legend.position = "none")

# To save the plot to a file, uncomment the line below
# ggsave("dv_vs_pred.png", width = 8, height = 6, dpi = 300)`,

  [ChartType.CWRES_VS_TIME]: `# =========================================================
# File: cwres_vs_time.R
# Author: ModelExplorer1 AI Engine
# R Version: 4.2.0 (webr)
# Purpose: Diagnostic plot of Conditional Weighted Residuals
#          (CWRES) vs. Time to detect temporal trends.
# =========================================================
library(ggplot2)

ggplot(plot_data, aes(x = TIME, y = CWRES)) +
  geom_point(aes(color = factor(ID)), alpha = 0.7, size = 2.5) +
  geom_hline(yintercept = 0, linetype = "dashed", color = "red", size = 1) +
  geom_smooth(method = "loess", se = FALSE, color = "blue", size = 0.8) +
  xlab("Time") +
  ylab("Conditional Weighted Residuals (CWRES)") +
  labs(
    title = "CWRES vs. Time",
    color = "Subject ID"
  ) +
  theme_bw(base_size = 14) +
  theme(legend.position = "none")

# To save the plot to a file, uncomment the line below
# ggsave("cwres_vs_time.png", width = 8, height = 6, dpi = 300)`,

  [ChartType.CWRES_VS_PRED]: `# =========================================================
# File: cwres_vs_pred.R
# Author: ModelExplorer1 AI Engine
# R Version: 4.2.0 (webr)
# Purpose: Diagnostic plot of Conditional Weighted Residuals
#          (CWRES) vs. Population Predictions (PRED).
# =========================================================
library(ggplot2)

ggplot(plot_data, aes(x = PRED, y = CWRES)) +
  geom_point(aes(color = factor(ID)), alpha = 0.7, size = 2.5) +
  geom_hline(yintercept = 0, linetype = "dashed", color = "red", size = 1) +
  geom_smooth(method = "loess", se = FALSE, color = "blue", size = 0.8) +
  xlab("Population Predicted Concentration") +
  ylab("Conditional Weighted Residuals") +
  labs(
    title = "CWRES vs. Population Predictions",
    color = "Subject ID"
  ) +
  theme_bw(base_size = 14) +
  theme(legend.position = "none")

# To save the plot to a file, uncomment the line below
# ggsave("cwres_vs_pred.png", width = 8, height = 6, dpi = 300)`,
  
  [ChartType.INDIVIDUAL_PLOTS]: `# =========================================================
# File: individual_fits.R
# Author: ModelExplorer1 AI Engine
# R Version: 4.2.0 (webr)
# Purpose: Visualize model fit at the individual level by
#          plotting DV, IPRED, and PRED vs. Time per subject.
# =========================================================
library(ggplot2)
library(dplyr)

ggplot(plot_data, aes(x = TIME)) +
  geom_line(aes(y = PRED), color = "red", linetype = "dashed", size=1) +
  geom_line(aes(y = IPRED), color = "blue", size=1) +
  geom_point(aes(y = DV), color = "black", size = 3, shape=21, fill="black") +
  facet_wrap(~ ID, scales = "free_y") +
  xlab("Time") +
  ylab("Concentration") +
  labs(
    title = "Individual Subject Fits"
  ) +
  theme_bw(base_size = 12)

# To save the plot to a file, uncomment the line below
# ggsave("individual_fits.png", width = 12, height = 10, dpi = 300)`,

  [ChartType.PARAMETER_TABLE]: `# =========================================================
# File: parameter_summary.R
# Author: ModelExplorer1 AI Engine
# R Version: 4.2.0 (webr)
# Purpose: Generate a summary table of individual PK parameters.
# =========================================================
library(dplyr)
library(knitr)

param_summary <- plot_data %>%
  select(ID, CL, Ka, Vc, Vp, AGE, WT, SEX) %>%
  distinct(ID, .keep_all = TRUE) %>%
  summarise(
    Parameter = c("CL", "Ka", "Vc", "Vp"),
    Mean = c(mean(CL), mean(Ka), mean(Vc), mean(Vp)),
    SD = c(sd(CL), sd(Ka), sd(Vc), sd(Vp)),
    CV_Percent = 100 * SD / Mean,
    Median = c(median(CL), median(Ka), median(Vc), median(Vp)),
    Min = c(min(CL), min(Ka), min(Vc), min(Vp)),
    Max = c(max(CL), max(Ka), max(Vc), max(Vp))
  ) %>%
  mutate(across(where(is.numeric), ~round(., 2)))

kable(param_summary, 
      format="html", 
      caption="Summary of Individual Parameter Estimates") #table output`,
      
  [ChartType.ETA_HISTOGRAM]: `# =========================================================
# File: eta_histogram.R
# Author: ModelExplorer1 AI Engine
# R Version: 4.2.0 (webr)
# Purpose: Assess the distribution of random effects (ETAs)
#          to check for normality.
# =========================================================
library(ggplot2)
library(dplyr)

distinct_etas <- plot_data %>% distinct(ID, .keep_all = TRUE)

ggplot(distinct_etas, aes(x = ETA_CL)) +
  geom_histogram(aes(y = ..density..), bins = 10, fill = "skyblue", color = "black", alpha = 0.7) +
  geom_density(color = "blue", size = 1) +
  stat_function(fun = dnorm, args = list(mean = mean(distinct_etas$ETA_CL), sd = sd(distinct_etas$ETA_CL)), color = "red", linetype="dashed", size=1) +
  facet_wrap(~ GROUP, scales = "free_y") +
  xlab("ETA of CL Value") +
  ylab("Density") +
  labs(
    title = "Distribution for Clearance",
    color = ""
  ) +
  theme_bw(base_size = 14)

# To save the plot to a file, uncomment the line below
# ggsave("eta_cl_distribution.png", width = 8, height = 6, dpi = 300)`,

  [ChartType.ETA_PAIRS]: `# =========================================================
# File: eta_pairs.R
# Author: ModelExplorer1 AI Engine
# R Version: 4.2.0 (webr)
# Purpose: Create a scatterplot matrix of ETAs to visualize
#          correlations between random effects.
# =========================================================
library(ggplot2)
library(dplyr)
library(GGally)

distinct_etas <- plot_data %>% distinct(ID, .keep_all = TRUE)
eta_cols <- select(distinct_etas, starts_with("ETA"))

# The ggpairs function returns a plot object that is automatically printed
p <- ggpairs(eta_cols, title="Pairs Plot of Random Effects")
p

# To save the plot to a file, uncomment the line below
# ggsave("eta_pairs_matrix.png", plot = p, width = 10, height = 10, dpi = 300)`,

  [ChartType.ETA_VS_COVARIATE]: `# =========================================================
# File: eta_vs_covariate.R
# Author: ModelExplorer1 AI Engine
# R Version: 4.2.0 (webr)
# Purpose: Explore relationships between random effects (ETAs)
#          and covariates to guide model development.
# =========================================================
library(ggplot2)
library(dplyr)

distinct_data <- plot_data %>% distinct(ID, .keep_all = TRUE)

ggplot(distinct_data, aes(x = WT, y = ETA_CL)) +
  geom_point(aes(color = SEX), size = 3, alpha = 0.8) +
  geom_smooth(method = "lm", se = FALSE, color = "black", linetype="dashed") +
  xlab("Weight (WT)") +
  ylab("ETA for Clearance") +
  labs(
    title = "ETA of CL vs. Weight",
    color = "Sex"
  ) +
  theme_bw(base_size = 14)

# To save the plot to a file, uncomment the line below
# ggsave("eta_cl_vs_wt.png", width = 8, height = 6, dpi = 300)`,

  // GENERIC PLOTS (Fallbacks)
  [ChartType.SCATTER]: `# =========================================================
# Script: Generic Scatter Plot
# =========================================================
library(ggplot2)
ggplot(plot_data, aes(x = TIME, y = DV)) +
  geom_point(size = 2, alpha = 0.7) +
  geom_smooth(method = "loess", se = FALSE, size = 0.8) +
  theme_bw()

# To save the plot to a file, uncomment the line below
# ggsave("generic_scatter.png", width = 8, height = 6, dpi = 300)`,
  
  [ChartType.BOXPLOT]: `# =========================================================
# Script: Generic Box Plot
# =========================================================
library(ggplot2)
ggplot(plot_data, aes(x = GROUP, y = DV, fill = GROUP)) +
  geom_boxplot() +
  theme_bw()

# To save the plot to a file, uncomment the line below
# ggsave("generic_boxplot.png", width = 8, height = 6, dpi = 300)`,

  [ChartType.HISTOGRAM]: `# =========================================================
# Script: Generic Histogram
# =========================================================
library(ggplot2)
ggplot(plot_data, aes(x = DV)) +
  geom_histogram(bins = 30, fill = "steelblue", color = "white") +
  theme_bw()

# To save the plot to a file, uncomment the line below
# ggsave("generic_histogram.png", width = 8, height = 6, dpi = 300)`,
};