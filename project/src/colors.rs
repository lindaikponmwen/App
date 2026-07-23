pub const RESET: &str = "\x1b[0m";
pub const BOLD: &str = "\x1b[1m";

pub const GREEN: &str = "\x1b[32m";
pub const BLUE: &str = "\x1b[34m";
pub const YELLOW: &str = "\x1b[33m";
pub const CYAN: &str = "\x1b[36m";
pub const MAGENTA: &str = "\x1b[35m";
pub const WHITE: &str = "\x1b[37m";

pub const BG_GREEN: &str = "\x1b[42m";
pub const BG_BLUE: &str = "\x1b[44m";

pub fn green_header(text: &str, width: usize) -> String {
    let stars = "*".repeat(width);
    format!("{}{}{}\n{}{:^width$}{}\n{}{}{}",
        GREEN, stars, RESET,
        GREEN, text, RESET,
        GREEN, stars, RESET,
        width = width
    )
}

pub fn blue_header(text: &str, width: usize) -> String {
    let stars = "*".repeat(width);
    format!("{}{}{}\n{}{:^width$}{}\n{}{}{}",
        BLUE, stars, RESET,
        BLUE, text, RESET,
        BLUE, stars, RESET,
        width = width
    )
}

pub fn yellow_stars(width: usize) -> String {
    format!("{}{}{}", YELLOW, "*".repeat(width), RESET)
}

pub fn green_stars(width: usize) -> String {
    format!("{}{}{}", GREEN, "*".repeat(width), RESET)
}

pub fn blue_stars(width: usize) -> String {
    format!("{}{}{}", BLUE, "*".repeat(width), RESET)
}
