const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Send email notification with Allure report link
 * Environment Variables:
 *   EMAIL_FROM: Gmail address (e.g., k2011.rajesh@gmail.com)
 *   EMAIL_PASSWORD: Gmail app password (not regular password)
 *   EMAIL_TO: Recipient email address
 *   REPORT_URL: Full URL to Allure report (optional)
 *   GITHUB_REPOSITORY: GitHub repo name (for linking)
 *   GITHUB_RUN_NUMBER: GitHub Actions run number
 */

async function sendEmailNotification() {
  try {
    // Get environment variables
    const emailFrom = process.env.EMAIL_FROM;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailTo = process.env.EMAIL_TO || 'k2011.rajesh@gmail.com';
    const githubRepo = process.env.GITHUB_REPOSITORY || 'k2011rajesh/playwrightMCP';
    const runNumber = process.env.GITHUB_RUN_NUMBER || 'local-test';
    const reportUrl = process.env.REPORT_URL || `https://${githubRepo.split('/')[0]}.github.io/${githubRepo.split('/')[1]}/allure/${runNumber}/index.html`;

    // Validate required environment variables
    if (!emailFrom || !emailPassword) {
      console.error('ERROR: EMAIL_FROM and EMAIL_PASSWORD environment variables are required');
      console.error('Set EMAIL_FROM to your Gmail address');
      console.error('Set EMAIL_PASSWORD to your Gmail app-specific password');
      process.exit(1);
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailFrom,
        pass: emailPassword
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });

    // Get test results
    let testStats = '';
    const junitPath = path.join(__dirname, '../test-results/results.xml');
    
    if (fs.existsSync(junitPath)) {
      const xmlContent = fs.readFileSync(junitPath, 'utf8');
      const testsMatch = xmlContent.match(/tests="(\d+)"/);
      const failuresMatch = xmlContent.match(/failures="(\d+)"/);
      const skippedMatch = xmlContent.match(/skipped="(\d+)"/);
      
      if (testsMatch) {
        const total = parseInt(testsMatch[1]);
        const failures = failuresMatch ? parseInt(failuresMatch[1]) : 0;
        const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
        const passed = total - failures - skipped;
        
        testStats = `
<table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
  <tr style="background-color: #f5f5f5;">
    <td style="border: 1px solid #ddd; padding: 10px;"><strong>Total Tests</strong></td>
    <td style="border: 1px solid #ddd; padding: 10px; text-align: center;"><strong>${total}</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ddd; padding: 10px; color: #28a745;"><strong>Passed</strong></td>
    <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #28a745;"><strong>${passed}</strong></td>
  </tr>
  ${failures > 0 ? `
  <tr style="background-color: #ffe0e0;">
    <td style="border: 1px solid #ddd; padding: 10px; color: #dc3545;"><strong>Failed</strong></td>
    <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #dc3545;"><strong>${failures}</strong></td>
  </tr>
  ` : ''}
  ${skipped > 0 ? `
  <tr>
    <td style="border: 1px solid #ddd; padding: 10px; color: #ffc107;"><strong>Skipped</strong></td>
    <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #ffc107;"><strong>${skipped}</strong></td>
  </tr>
  ` : ''}
</table>`;
      }
    }

    // Create email content
    const statusEmoji = !testStats.includes('Failed') || testStats.includes('<strong>Failed</strong></td>\n    <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #dc3545;"><strong>0</strong>') ? '✅' : '❌';
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #007bff; color: white; padding: 20px; border-radius: 5px; }
        .content { margin: 20px 0; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .button:hover { background-color: #0056b3; }
        .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; }
        .info { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${statusEmoji} Playwright Test Report - Run #${runNumber}</h1>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            <p>Your Playwright test automation suite has completed execution. The detailed Allure report is ready for review.</p>
            
            ${testStats}
            
            <div class="info">
                <strong>📊 View Full Report:</strong><br>
                <a href="${reportUrl}" class="button">Open Allure Report</a>
            </div>
            
            <div class="info">
                <strong>Repository:</strong> ${githubRepo}<br>
                <strong>Run Number:</strong> ${runNumber}<br>
                <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
                <strong>Report URL:</strong> <a href="${reportUrl}">${reportUrl}</a>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>Review the Allure report for detailed test results</li>
                <li>Check failed tests (if any) for debugging information</li>
                <li>View timeline to analyze test execution performance</li>
                <li>Share the report link with your team</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This is an automated email from your Playwright CI/CD pipeline. Do not reply to this email.</p>
            <p>&copy; 2026 Playwright MCP - Test Automation Suite</p>
        </div>
    </div>
</body>
</html>
`;

    // Send email
    const mailOptions = {
      from: emailFrom,
      to: emailTo,
      subject: `${statusEmoji} Playwright Test Report - Run #${runNumber}`,
      html: emailHtml,
      text: `Test Report Complete\n\nYour Playwright test automation suite has completed execution.\n\nReport: ${reportUrl}\n\nRun Number: ${runNumber}\nRepository: ${githubRepo}`
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${emailTo}`);
    console.log(`📧 Subject: ${mailOptions.subject}`);
    console.log(`📊 Report: ${reportUrl}`);
    
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    if (error.message.includes('Invalid login')) {
      console.error('\n⚠️  Authentication failed. Check:');
      console.error('  1. EMAIL_FROM is a valid Gmail address');
      console.error('  2. EMAIL_PASSWORD is an app-specific password (not your Gmail password)');
      console.error('  3. Go to: https://myaccount.google.com/apppasswords');
    }
    process.exit(1);
  }
}

// Run the function
sendEmailNotification();
