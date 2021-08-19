const Client = require('coinbase').Client;
const prompt = require('prompt');
const fs = require('fs');
const config = require('./config/config.js')

let client = new Client({
    'apiKey': config.apiKey,
    'apiSecret': config.apiSecret,
    'strictSSL': false
});

let csv = 'ID,Type,Date,Amount,Native Amount,Native Currency\n';

function recursivePromiseGetTransactions(account_id, pagination_passed) {
    return new Promise(function (resolve, reject) {
        client.getAccount(account_id, function (err, account) {
            let config = pagination_passed || {limit: 25};
            account.getTransactions(config, function (err, txns, pagination) {
                txns.forEach(function (d) {
                    csv += `${d.id},${d.type},${d.updated_at},${d.amount.amount},${d.native_amount.amount},${d.native_amount.currency}` + '\n';
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
            console.log('Coinbase Report CSV Output:');
            console.log(res)

            // Save results to CSV file
            fs.writeFile(`reports/coinbase-report-${account_id}.csv`, res.data, (err) => {
                if (err) return console.log(err);
                console.log('Coinbase Report CSV File Created: ' + `coinbase-report-${account_id}.csv`)
            });
        })
});