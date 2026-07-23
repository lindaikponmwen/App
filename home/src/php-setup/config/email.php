<?php
/**
 * Email Helper Functions
 *
 * Provides functionality for sending transactional emails including
 * password reset emails, verification emails, etc.
 */

/**
 * Send Password Reset Email
 *
 * @param string $email Recipient email address
 * @param string $name Recipient name
 * @param string $resetLink Password reset link
 * @return bool True if email sent successfully, false otherwise
 */
function sendPasswordResetEmail(string $email, string $name, string $resetLink): bool {
    $subject = 'Password Reset Request - DrLevy.Ai';

    $message = buildPasswordResetEmailHtml($name, $resetLink);

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: DrLevy.Ai <noreply@drlevy.ai>',
        'Reply-To: support@drlevy.ai',
        'X-Mailer: PHP/' . phpversion()
    ];

    $result = mail($email, $subject, $message, implode("\r\n", $headers));

    if ($result) {
        error_log("Password reset email sent successfully to: {$email}");
    } else {
        error_log("Failed to send password reset email to: {$email}");
    }

    return $result;
}

/**
 * Send Email Verification Email
 *
 * @param string $email Recipient email address
 * @param string $name Recipient name
 * @param string $verificationLink Email verification link
 * @return bool True if email sent successfully, false otherwise
 */
function sendEmailVerificationEmail(string $email, string $name, string $verificationLink): bool {
    $subject = 'Verify Your Email - DrLevy.Ai';

    $message = buildEmailVerificationEmailHtml($name, $verificationLink);

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: DrLevy.Ai <noreply@drlevy.ai>',
        'Reply-To: support@drlevy.ai',
        'X-Mailer: PHP/' . phpversion()
    ];

    $result = mail($email, $subject, $message, implode("\r\n", $headers));

    if ($result) {
        error_log("Email verification email sent successfully to: {$email}");
    } else {
        error_log("Failed to send email verification email to: {$email}");
    }

    return $result;
}

/**
 * Build HTML Email for Email Verification
 *
 * @param string $name User's name
 * @param string $verificationLink Email verification link
 * @return string HTML email content
 */
function buildEmailVerificationEmailHtml(string $name, string $verificationLink): string {
    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 0;
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 40px;
        }
        .content p {
            margin: 0 0 20px 0;
            color: #4b5563;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #10b981;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
        }
        .button:hover {
            background-color: #059669;
        }
        .link-box {
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            word-break: break-all;
            font-size: 12px;
            color: #6b7280;
        }
        .info {
            background-color: #dbeafe;
            border-left: 4px solid #3b82f6;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info p {
            margin: 0;
            color: #1e40af;
            font-size: 14px;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to DrLevy.Ai!</h1>
        </div>

        <div class="content">
            <p>Hello {$name},</p>

            <p>Thank you for registering with DrLevy.Ai! To complete your registration and activate your account, please verify your email address by clicking the button below:</p>

            <div class="button-container">
                <a href="{$verificationLink}" class="button">Verify Email Address</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <div class="link-box">{$verificationLink}</div>

            <div class="info">
                <p><strong>Important:</strong> This verification link will expire in 24 hours. You must verify your email before you can log in to your account.</p>
            </div>

            <p>If you did not create an account with DrLevy.Ai, please ignore this email.</p>

            <p>Best regards,<br>The DrLevy.Ai Team</p>
        </div>

        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; 2024 DrLevy.Ai. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
HTML;
}

/**
 * Build HTML Email for Password Reset
 *
 * @param string $name User's name
 * @param string $resetLink Password reset link
 * @return string HTML email content
 */
function buildPasswordResetEmailHtml(string $name, string $resetLink): string {
    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 0;
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            padding: 40px;
            text-align: center;
        }
        .header img {
            height: 40px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 40px;
        }
        .content p {
            margin: 0 0 20px 0;
            color: #4b5563;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
        }
        .button:hover {
            background-color: #2563eb;
        }
        .link-box {
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            word-break: break-all;
            font-size: 12px;
            color: #6b7280;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>

        <div class="content">
            <p>Hello {$name},</p>

            <p>We received a request to reset the password for your DrLevy.Ai account. If you made this request, click the button below to reset your password:</p>

            <div class="button-container">
                <a href="{$resetLink}" class="button">Reset Password</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <div class="link-box">{$resetLink}</div>

            <div class="warning">
                <p><strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.</p>
            </div>

            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns. Your password will not be changed unless you access the link above and create a new password.</p>

            <p>Best regards,<br>The DrLevy.Ai Team</p>
        </div>

        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; 2024 DrLevy.Ai. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
HTML;
}
