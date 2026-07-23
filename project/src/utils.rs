use nalgebra::DMatrix;

pub fn matrix_to_vec(matrix: &DMatrix<f64>) -> Vec<Vec<f64>> {
    let mut result = Vec::new();
    for i in 0..matrix.nrows() {
        let mut row = Vec::new();
        for j in 0..matrix.ncols() {
            row.push(matrix[(i, j)]);
        }
        result.push(row);
    }
    result
}

pub fn vec_to_matrix(vec: &[Vec<f64>]) -> DMatrix<f64> {
    if vec.is_empty() {
        return DMatrix::zeros(0, 0);
    }

    let nrows = vec.len();
    let ncols = vec[0].len();

    let data: Vec<f64> = vec.iter().flatten().copied().collect();
    DMatrix::from_row_slice(nrows, ncols, &data)
}

pub fn format_scientific(value: f64) -> String {
    if value.abs() < 0.001 || value.abs() > 1000.0 {
        format!("{:.4e}", value)
    } else {
        format!("{:.6}", value)
    }
}

pub fn compute_cv(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }

    let mean = values.iter().sum::<f64>() / values.len() as f64;
    if mean == 0.0 {
        return 0.0;
    }

    let variance = values.iter()
        .map(|&x| (x - mean).powi(2))
        .sum::<f64>() / values.len() as f64;

    let sd = variance.sqrt();
    (sd / mean) * 100.0
}
