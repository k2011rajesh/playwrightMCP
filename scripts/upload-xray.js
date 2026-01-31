#!/usr/bin/env node
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function main() {
  const clientId = process.env.XRAY_CLIENT_ID;
  const clientSecret = process.env.XRAY_CLIENT_SECRET;
  const junitPath = process.env.JUNIT_PATH || 'test-results/results.xml';
  const testExecKey = process.env.XRAY_TEST_EXEC || '';

  if (!clientId || !clientSecret) {
    console.error('Set XRAY_CLIENT_ID and XRAY_CLIENT_SECRET environment variables.');
    process.exit(1);
  }
  if (!fs.existsSync(junitPath)) {
    console.error('JUnit file not found:', junitPath);
    process.exit(1);
  }

  try {
    const auth = await axios.post('https://xray.cloud.getxray.app/api/v2/authenticate', {
      client_id: clientId,
      client_secret: clientSecret,
    });
    const token = auth.data;
    const form = new FormData();
    form.append('file', fs.createReadStream(junitPath));
    const url = `https://xray.cloud.getxray.app/api/v2/import/execution/junit${testExecKey ? '?testExecutionKey=' + encodeURIComponent(testExecKey) : ''}`;
    const res = await axios.post(url, form, {
      headers: { Authorization: `Bearer ${token}`, ...form.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    console.log('Upload result:', res.data);
  } catch (err) {
    console.error('Upload failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

main();
