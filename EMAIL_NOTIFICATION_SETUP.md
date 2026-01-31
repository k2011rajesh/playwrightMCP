# Email Notification Setup Guide

## Overview

Automated email notifications are sent to your inbox whenever Playwright tests complete and the Allure report is generated. This includes detailed test statistics and direct links to view the report.

## 📧 Features

- ✅ **Automatic Notifications** - Email sent after every test run
- 📊 **Test Statistics** - Summary of passed, failed, and skipped tests
- 🔗 **Direct Report Link** - One-click access to full Allure report
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎯 **GitHub Actions Integration** - Runs automatically in CI/CD pipeline
- 🏠 **Local Testing** - Send test emails from your machine

## 🔧 Setup Instructions

### Step 1: Create Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already enabled)
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select:
   - App: **Mail**
   - Device: **Windows Computer** (or your device)
5. Google will generate a 16-character app password
6. **Copy and save this password** - you'll need it shortly

**⚠️ Important:** Use the app password, NOT your Gmail password!

### Step 2: Add GitHub Secrets

For CI/CD email notifications, add these secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

| Secret Name | Value |
|-------------|-------|
| `EMAIL_FROM` | Your Gmail address (e.g., `k2011.rajesh@gmail.com`) |
| `EMAIL_PASSWORD` | The 16-character app password from Step 1 |
| `EMAIL_TO` | Your email address (or leave empty to use EMAIL_FROM) |

**Example:**
- Name: `EMAIL_FROM`
- Value: `k2011.rajesh@gmail.com`

### Step 3: Local Testing (Optional)

To test email notifications locally before CI/CD:

```bash
# Set environment variables and run
export EMAIL_FROM="your-email@gmail.com"
export EMAIL_PASSWORD="your-app-password"
export EMAIL_TO="recipient@gmail.com"
export GITHUB_REPOSITORY="k2011rajesh/playwrightMCP"
export GITHUB_RUN_NUMBER="123"

# Run tests and send email
npm run test:allure
npm run notify:email

# OR run the full pipeline with email
npm run test:full
```

**On Windows PowerShell:**
```powershell
$env:EMAIL_FROM = "your-email@gmail.com"
$env:EMAIL_PASSWORD = "your-app-password"
$env:EMAIL_TO = "recipient@gmail.com"
$env:GITHUB_REPOSITORY = "k2011rajesh/playwrightMCP"
$env:GITHUB_RUN_NUMBER = "123"

npm run test:full
```

## 🚀 Usage

### Automatic (CI/CD)

After setup, emails are sent automatically:
- After every push to `main` or `develop`
- After every pull request creation/update
- With full test statistics and report link

### Manual (Local Machine)

```bash
# Generate report and send email
npm run test:full

# Or send email for existing report
npm run notify:email

# Or just run tests
npm run test:allure
```

## 📬 Email Contents

The automated email includes:

1. **Header** - Test run number and status emoji (✅ or ❌)
2. **Test Statistics Table**:
   - Total tests
   - Passed count (green)
   - Failed count (red, if any)
   - Skipped count (yellow, if any)
3. **Direct Report Link** - One-click access to Allure dashboard
4. **Metadata**:
   - Repository name
   - Run number
   - Generation timestamp
   - Full report URL
5. **Next Steps** - Guidance on reviewing results

## 🔍 Troubleshooting

### ❌ "Invalid login" Error

**Problem:** Email not sending with authentication error

**Solutions:**
1. Verify `EMAIL_FROM` is correct Gmail address
2. Check `EMAIL_PASSWORD` is the **app password**, not Gmail password
3. Regenerate app password at [Google App Passwords](https://myaccount.google.com/apppasswords)
4. Ensure 2-Step Verification is enabled on Gmail account

### ❌ "No such host" Error

**Problem:** Email service unreachable

**Solutions:**
1. Check internet connection
2. Verify firewall isn't blocking SMTP port 587
3. Confirm Gmail SMTP settings are correct (smtp.gmail.com)
4. Try test email from local machine first

### ❌ Email not sent in GitHub Actions

**Problem:** Notification not received after workflow completes

**Solutions:**
1. Check GitHub Actions logs for error messages
2. Verify secrets are added to repository (Settings → Secrets)
3. Confirm secret values are exact (no extra spaces)
4. Check email spam folder
5. Verify `EMAIL_PASSWORD` has not expired

### ❌ Blank Test Statistics

**Problem:** Email sent but no test counts shown

**Likely Cause:** Tests didn't generate JUnit results

**Solution:**
1. Ensure tests ran successfully
2. Verify `test-results/results.xml` exists
3. Check test output format matches JUnit

## 🛠️ Advanced Configuration

### Custom Email Recipients

Use different email addresses for different scenarios:

```bash
# Send to multiple people (comma-separated in secret)
EMAIL_TO="user1@gmail.com,user2@gmail.com"

# Or specific recipient per run
export EMAIL_TO="specific-user@company.com"
npm run notify:email
```

### Disable Email Notifications

To disable temporarily:
1. Remove secrets from GitHub
2. Don't run `npm run test:full` locally
3. The workflow will skip email if secrets are missing

### Integration with Other Tools

Combine with other notifications:
```bash
npm run test:full && npm run upload:xray  # Email + Xray upload
```

## 📋 npm Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run notify:email` | Send email for existing report |
| `npm run test:full` | Tests + Allure report + Email |
| `npm run test:allure` | Tests + Allure report |
| `npm run test` | Tests only (JUnit) |

## 🔐 Security Notes

- **Never commit secrets** to version control
- **Use app passwords**, not Gmail password
- **Rotate app password** periodically
- **GitHub secrets are masked** in workflow logs
- **Revoke access** by regenerating app password

## 📞 Support

For Gmail app password issues:
- Visit: [Google Support - App Passwords](https://support.google.com/accounts/answer/185833)
- Ensure 2-Step Verification is enabled
- Check that account is not using security key

For script issues:
- Check `scripts/send-email-notification.js` for implementation
- Review GitHub Actions workflow logs
- Test locally with manual `npm run notify:email`

## ✅ Verification Checklist

Before going live:

- [ ] Gmail account has 2-Step Verification enabled
- [ ] App password generated and saved
- [ ] GitHub secrets added (EMAIL_FROM, EMAIL_PASSWORD, EMAIL_TO)
- [ ] Local test sent successfully: `npm run test:full`
- [ ] Workflow file updated with email notification step
- [ ] Email received with correct test statistics
- [ ] Report link in email is accessible
- [ ] Email formatting looks good on mobile

## 📈 Next Steps

1. ✅ Complete setup using this guide
2. 🧪 Send test email locally
3. 🚀 Push changes to GitHub
4. 📧 Verify email received after workflow
5. 🎯 Share report link with team
6. 📊 Review reports regularly
