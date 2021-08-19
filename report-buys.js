const Client = require('coinbase').Client;
const prompt = require('prompt');
const fs = require('fs');
const config = require('./config/config.js')

let client = new Client({
    'apiKey': config.apiKey,
    'apiSecret': config.apiSecret,
    'strictSSL': false
});

let csv = 'ID,Date,Amount,Subtotal Amount,Total Amount,Unit Price,Total Fees\n';

function recursivePromiseGetTransactions(account_id, pagination_passed) {
    return new Promise(function (resolve, reject) {
        client.getAccount(account_id, function (err, account) {
            let config = pagination_passed || {limit: 25};
            account.getBuys(config, function (err, buys, pagination) {
                buys.forEach(function (d) {
                    let total_fees = parseFloat(d.fees[0].amount.amount) + parseFloat(d.fees[1].amount.amount)
                    csv += `${d.id},${d.created_at},${d.amount.amount},${d.subtotal.amount},${d.total.amount},${d.unit_price.amount},${total_fees}` + '\n';
                });

                // Recursively call function requesting next set of transactions
                if (pagination.next_uri) {
                    console.log('Recursivelly requesting transactions from Coinbase...');
                    resolve(recursivePromiseGetTransactions(account_id, pagination))
                } else {
                    if (err) {
                        console.log("ERROR: recursivePromiseGetTransactions()", err);
                        reject({success: false});
                    } else {
                        resolve({success: true, data: csv});
                    }
                }
            });
        });
    });
}

console.log('A report will be generated as a CSV file from your Coinbase transaction history.');
prompt.start();
prompt.get(['symbol'], function (err, result) {
    if (err) {
        console.log(err);
        return 1;
    }

    // Which "account id" to request (maps to crypto symbols)
    let account_id = result.symbol.toUpperCase();

    // Request transaction history from Coinbase
    recursivePromiseGetTransactions(account_id)
        .then((res) => {
            console.log('Coinbase Report Buys CSV Output:');

            // Save results to CSV file
            fs.writeFile(`reports/coinbase-report-buys-${account_id}.csv`, res.data, (err) => {
                if (err) return console.log(err);
                console.log('Coinbase Report Buys CSV File Created: ' + `coinbase-report-buys-${account_id}.csv`)
            });
        })
});