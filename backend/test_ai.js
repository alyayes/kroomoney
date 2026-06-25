import { getAiInsights } from './controllers/settingsController.js';

// Mock request and response
const req = {};
const res = {
  status(code) {
    this.code = code;
    return this;
  },
  json(data) {
    this.data = data;
    console.log('Response Status:', this.code);
    console.log('Response JSON:', JSON.stringify(this.data, null, 2));
  }
};

async function run() {
  await getAiInsights(req, res);
}

run();
