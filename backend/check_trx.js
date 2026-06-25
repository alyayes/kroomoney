import TransactionModel from './models/transactionModel.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const trx = await TransactionModel.findById(1);
    console.log('=== TRANSACTION 1 BY ID ===');
    console.log(JSON.stringify(trx, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
