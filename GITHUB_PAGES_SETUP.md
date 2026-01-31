# GitHub Pages Setup & Live Report Access

## ✅ Current Configuration

Your GitHub Actions workflow now automatically deploys Allure reports to GitHub Pages after every test run.

## 📊 Access Your Live Allure Report

### Option 1: Direct Link (Recommended)
After each workflow run, the report is available at:
```
https://k2011rajesh.github.io/playwrightMCP/allure/[run_number]/index.html
```

Example: `https://k2011rajesh.github.io/playwrightMCP/allure/123/index.html`

### Option 2: Latest Report Index
A simple index page lists all available reports:
```
https://k2011rajesh.github.io/playwrightMCP/allure/
```

### Option 3: PR Comments
Pull requests automatically receive comments with direct links to the latest Allure report.

## 🔧 Configuration Details

**Workflow Step (Automated):**
```yaml
- name: Deploy Allure Report to GitHub Pages
  if: always()
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./allure-report
    destination_dir: allure/${{ github.run_number }}
```

**Reports Location:**
- GitHub Pages Branch: `gh-pages` (auto-created)
- Report Structure: `allure/[run_number]/index.html`
- Historical Access: All reports retained

## ✨ Report Features

View comprehensive test information:
- **Timeline:** Visual representation of test execution
- **Test Cases:** All 14 tests with detailed status
- **Failures:** Detailed error messages and stack traces
- **Metrics:** Pass rate, duration, and trends
- **Attachments:** Screenshots and logs from failed tests
- **History:** Compare results across multiple runs

## 🚀 How to Use

1. **View Latest Report:**
   - Go to [GitHub Actions](https://github.com/k2011rajesh/playwrightMCP/actions)
   - Click the latest workflow run
   - Scroll to "Deploy Allure Report to GitHub Pages" step
   - Link appears in PR comments for pull requests

2. **Access Specific Run:**
   - Replace `[run_number]` with actual number from GitHub Actions
   - Example: `https://k2011rajesh.github.io/playwrightMCP/allure/123/index.html`

3. **Share Reports:**
   - Direct links work for anyone with access
   - Perfect for sharing with team members
   - No authentication required for public repos

## 📝 Settings Check (if reports don't appear)

1. Go to Repository Settings → Pages
2. Verify Source is set to "Deploy from a branch"
3. Confirm Branch is `gh-pages` with root folder selected
4. Save if any changes needed

## ⚙️ Troubleshooting

**Reports not appearing?**
- Check that workflow completed successfully (green checkmark)
- Verify GitHub Pages is enabled in Settings → Pages
- Wait 1-2 minutes for deployment to complete
- Try accessing: https://k2011rajesh.github.io/playwrightMCP/allure/

**Report is empty?**
- Ensure tests ran successfully (no failures that prevent Allure generation)
- Check JUnit results were generated: `test-results/results.xml`
- Check Allure results exist: `allure-results/` directory

**Links in PRs not working?**
- Ensure you're on a public repository
- Verify branch is `main` (workflow only runs for main/develop)
- Check that pull request is from a branch in your repo

## 📚 Next Steps

- ✅ Add status badges to README (done!)
- ✅ Configure GitHub Pages deployment (done!)
- Next: Run tests and verify live reports
- Consider: Add custom Allure report styling
- Advanced: Set up test history and trends
