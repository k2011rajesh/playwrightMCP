# Email Notifications - Quick Reference

## 🚀 Quick Setup (2 minutes)

### Step 1: Gmail App Password
```
1. Go: https://myaccount.google.com/apppasswords
2. Select App: Mail | Device: Windows Computer
3. Copy the 16-character password
```

### Step 2: GitHub Secrets
```
Settings → Secrets and variables → Actions → New repository secret

EMAIL_FROM → k2011.rajesh@gmail.com
EMAIL_PASSWORD → [paste app password]
EMAIL_TO → k2011.rajesh@gmail.com (optional)
```

### Step 3: Done! ✅
Emails now automatically send after each test run

---

## 📬 Email Contents

When tests complete, you receive:
- ✅ or ❌ Status emoji
- Test statistics (Passed/Failed/Skipped)
- Direct link to Allure report
- Run number and timestamp
- Repository information

**Example Email Subject:** ✅ Playwright Test Report - Run #42

---

## 💻 Run Locally

### Send Email After Tests (Easiest)
```bash
npm run test:full
```

### Manual: Set Variables & Send
```powershell
$env:EMAIL_FROM = "your-email@gmail.com"
$env:EMAIL_PASSWORD = "your-app-password"
$env:EMAIL_TO = "recipient@gmail.com"

npm run notify:email
```

---

## 🔄 How It Works

1. **Tests Run** → GitHub Actions (or local machine)
2. **Allure Report Generated** → Results collected
3. **Email Script Triggers** → Reads test results
4. **Email Sent** → Via Gmail SMTP
5. **Report Link Included** → Direct access to dashboard

---

## 📋 Files & Scripts

| File | Purpose |
|------|---------|
| `scripts/send-email-notification.js` | Email notification engine |
| `.github/workflows/playwright-tests.yml` | GitHub Actions workflow |
| `EMAIL_NOTIFICATION_SETUP.md` | Full setup guide |
| `npm run notify:email` | Send email script |
| `npm run test:full` | Tests + Email |

---

## ⚠️ Troubleshooting

**"Invalid login" Error?**
- ✓ Check EMAIL_FROM is correct
- ✓ Use app password (not Gmail password)
- ✓ Verify 2-Step Verification enabled

**Email not received?**
- ✓ Check GitHub Actions logs
- ✓ Verify secrets are set correctly
- ✓ Check spam folder
- ✓ Confirm EMAIL_TO is valid

**No test statistics in email?**
- ✓ Ensure tests ran successfully
- ✓ Check test-results/results.xml exists

---

## 🔐 Security Checklist

- ✅ Never commit secrets to git
- ✅ Use app password only
- ✅ GitHub secrets are masked in logs
- ✅ Rotate app password monthly

---

## 📞 Need Help?

See [EMAIL_NOTIFICATION_SETUP.md](EMAIL_NOTIFICATION_SETUP.md) for:
- Detailed step-by-step guide
- Environment variables reference
- Advanced configurations
- Full troubleshooting section

---

## ✨ Features

- 🤖 Fully automated
- 📧 Beautiful HTML emails
- 📱 Mobile-friendly format
- 🔗 Direct report links
- 📊 Test statistics included
- ⚡ Works with CI/CD
- 🏠 Works locally too
