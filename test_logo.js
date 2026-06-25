import { buildReportHtml } from './backend/services/pdfService.js';
const html = buildReportHtml({transactions:[], allTransactions:[]}, {name: 'Test'}, {nama: 'Test'});
const match = html.match(/src="(data:image[^"]+)"/);
console.log(match ? 'Found src length: ' + match[1].length : 'No src match found');
