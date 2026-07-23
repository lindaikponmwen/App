<?php
/**
 * EmailTemplates.php - HTML Email Templates
 */

class EmailTemplates {
    
    /**
     * Template for the Lead Notification (Sent to Admin)
     */
    public static function getEnterpriseLeadHtml($data) {
        $name = htmlspecialchars($data['name']);
        $company = htmlspecialchars($data['companyName']);
        $email = htmlspecialchars($data['email']);
        $phone = htmlspecialchars($data['phone']);
        $size = htmlspecialchars($data['companySize']);
        $package = htmlspecialchars($data['package']);
        $message = nl2br(htmlspecialchars($data['message']));
        $date = date('Y-m-d H:i:s');

        return "
        <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;'>
            <div style='text-align: center; margin-bottom: 20px;'>
                <img src='https://test.drlevy.ai/logo.png' alt='Dr. Levy AI Logo' width='120' style='display: block; margin: 0 auto;'>
            </div>
            <h2 style='color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px;'>New Enterprise Application</h2>
            <p>A new application has been submitted from the website.</p>
            
            <table style='width: 100%; border-collapse: collapse; margin-top: 20px;'>
                <tr>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 150px;'>Full Name:</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee;'>$name</td>
                </tr>
                <tr>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Company:</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee;'>$company</td>
                </tr>
                <tr>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Work Email:</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee;'>$email</td>
                </tr>
                <tr>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Phone:</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee;'>$phone</td>
                </tr>
                <tr>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Company Size:</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee;'>$size</td>
                </tr>
                <tr>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Package:</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee;'>$package</td>
                </tr>
            </table>
            
            <div style='margin-top: 30px;'>
                <h3 style='color: #0f172a;'>Usage Needs:</h3>
                <div style='background: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; font-style: italic;'>
                    $message
                </div>
            </div>
            
            <p style='margin-top: 30px; font-size: 12px; color: #64748b;'>Submitted on: $date</p>
        </div>
        ";
    }

    /**
     * Template for the User Confirmation (Sent to Applicant)
     */
    public static function getThankYouEmailHtml($name) {
        $name = htmlspecialchars($name);
        
        return "
        <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;'>
            <div style='text-align: center; padding: 0;'>
                <img src='https://test.drlevy.ai/logo.png' alt='Dr. Levy AI Logo' width='600' style='display: block; width: 100%; height: auto;'>
            </div>
            
            <div style='padding: 40px 20px;'>
                <h2 style='color: #0f172a;'>Hello $name,</h2>
                
                <p>Thank you for your interest in the Dr. Levy AI Enterprise plan. We have successfully received your application and our team is currently reviewing your usage needs.</p>
                
                <p>A member of our team will reach out to you at this email address within the next 24-48 business hours to discuss the next steps.</p>
                
                <p>In the meantime, if you have any urgent questions, feel free to reply to this email.</p>
                
                <div style='margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;'>
                    <p style='margin: 0; font-weight: bold;'>Best regards,</p>
                    <p style='margin: 0;'>The Dr. Levy AI Team</p>
                </div>
            </div>
            
            <div style='background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;'>
                &copy; " . date('Y') . " Dr. Levy AI Research Dept. All rights reserved.
            </div>
        </div>
        ";
    }
}
