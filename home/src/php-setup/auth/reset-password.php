<?php
/**
 * Password Reset Page
 *
 * Displays a secure form for users to reset their password using a valid token.
 * Validates token before showing the form.
 */

require_once __DIR__ . '/../config/database.php';

// Get token from URL
$token = $_GET['token'] ?? '';
$error = '';
$success = false;
$tokenValid = false;
$email = '';

// Validate token if provided
if (!empty($token)) {
    try {
        $db = Database::getInstance();

        // Check if token exists and is valid
        $query = "SELECT pr.email, pr.expires_at, pr.used, u.name
                  FROM password_resets pr
                  JOIN users u ON pr.email = u.email
                  WHERE pr.token = ?
                  LIMIT 1";

        $resetRecord = $db->queryOne($query, [$token]);

        if (!$resetRecord) {
            $error = 'Invalid or expired reset token';
        } elseif ($resetRecord['used']) {
            $error = 'This reset link has already been used';
        } elseif (strtotime($resetRecord['expires_at']) < time()) {
            $error = 'This reset link has expired. Please request a new one.';
        } else {
            $tokenValid = true;
            $email = $resetRecord['email'];
        }
    } catch (Exception $e) {
        error_log('Token validation error: ' . $e->getMessage());
        $error = 'An error occurred. Please try again.';
    }
} else {
    $error = 'No reset token provided';
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $tokenValid) {
    $newPassword = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';

    // Validate passwords
    if (empty($newPassword)) {
        $error = 'Password is required';
    } elseif (strlen($newPassword) < 8) {
        $error = 'Password must be at least 8 characters long';
    } elseif ($newPassword !== $confirmPassword) {
        $error = 'Passwords do not match';
    } else {
        try {
            $db = Database::getInstance();

            // Hash the new password
            $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);

            // Update user's password
            $updateQuery = "UPDATE users
                           SET password_hash = ?,
                               updated_at = NOW()
                           WHERE email = ?";

            $db->execute($updateQuery, [$passwordHash, $email]);

            // Mark token as used
            $markUsedQuery = "UPDATE password_resets
                             SET used = TRUE
                             WHERE token = ?";

            $db->execute($markUsedQuery, [$token]);

            $success = true;

            error_log("Password reset successful for: {$email}");
        } catch (Exception $e) {
            error_log('Password update error: ' . $e->getMessage());
            $error = 'Failed to update password. Please try again.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - DrLevy.Ai</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 480px;
            width: 100%;
            padding: 40px;
        }

        .logo {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo img {
            height: 40px;
        }

        h1 {
            color: #1a202c;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .subtitle {
            color: #718096;
            font-size: 15px;
            margin-bottom: 30px;
        }

        .alert {
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }

        .alert-error {
            background-color: #fed7d7;
            border: 1px solid #fc8181;
            color: #c53030;
        }

        .alert-success {
            background-color: #c6f6d5;
            border: 1px solid #68d391;
            color: #22543d;
        }

        .alert-icon {
            font-size: 20px;
            flex-shrink: 0;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            color: #2d3748;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
        }

        input[type="password"] {
            width: 100%;
            padding: 12px 16px;
            font-size: 15px;
            border: 1px solid #cbd5e0;
            border-radius: 8px;
            transition: all 0.2s;
        }

        input[type="password"]:focus {
            outline: none;
            border-color: #805ad5;
            box-shadow: 0 0 0 3px rgba(128, 90, 213, 0.1);
        }

        .password-requirements {
            margin-top: 8px;
            font-size: 13px;
            color: #718096;
        }

        .btn {
            width: 100%;
            padding: 14px;
            font-size: 15px;
            font-weight: 600;
            color: white;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }

        .btn:active {
            transform: translateY(0);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .back-link {
            text-align: center;
            margin-top: 24px;
        }

        .back-link a {
            color: #805ad5;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }

        .back-link a:hover {
            text-decoration: underline;
        }

        .success-icon {
            text-align: center;
            margin-bottom: 20px;
        }

        .success-icon svg {
            width: 64px;
            height: 64px;
            color: #48bb78;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="https://drlevy.ai/logo.png" alt="DrLevy.Ai">
        </div>

        <?php if ($success): ?>
            <div class="success-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>

            <h1>Password Reset Successfully!</h1>
            <p class="subtitle">Your password has been updated. You can now sign in with your new password.</p>

            <div class="back-link">
                <a href="/">Return to Sign In</a>
            </div>

        <?php elseif (!$tokenValid): ?>
            <h1>Invalid Reset Link</h1>
            <p class="subtitle">This password reset link is invalid or has expired</p>

            <?php if ($error): ?>
                <div class="alert alert-error">
                    <span class="alert-icon">⚠️</span>
                    <span><?php echo htmlspecialchars($error); ?></span>
                </div>
            <?php endif; ?>

            <div class="back-link">
                <a href="/forgot-password">Request a new reset link</a>
            </div>

        <?php else: ?>
            <h1>Reset Your Password</h1>
            <p class="subtitle">Enter your new password below</p>

            <?php if ($error): ?>
                <div class="alert alert-error">
                    <span class="alert-icon">⚠️</span>
                    <span><?php echo htmlspecialchars($error); ?></span>
                </div>
            <?php endif; ?>

            <form method="POST" action="">
                <div class="form-group">
                    <label for="password">New Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        minlength="8"
                        autocomplete="new-password"
                    >
                    <div class="password-requirements">
                        Must be at least 8 characters long
                    </div>
                </div>

                <div class="form-group">
                    <label for="confirm_password">Confirm New Password</label>
                    <input
                        type="password"
                        id="confirm_password"
                        name="confirm_password"
                        required
                        minlength="8"
                        autocomplete="new-password"
                    >
                </div>

                <button type="submit" class="btn">Reset Password</button>
            </form>

            <div class="back-link">
                <a href="/">Back to Sign In</a>
            </div>
        <?php endif; ?>
    </div>

    <script>
        // Client-side password validation
        document.querySelector('form')?.addEventListener('submit', function(e) {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;

            if (password !== confirmPassword) {
                e.preventDefault();
                alert('Passwords do not match. Please try again.');
                return false;
            }

            if (password.length < 8) {
                e.preventDefault();
                alert('Password must be at least 8 characters long.');
                return false;
            }
        });
    </script>
</body>
</html>
