const Client = require('coinbase').Client;
const prompt = require('prompt');
const fs = require('fs');
const config = require('./config/config.js')

let client = new Client({
    'apiKey': config.apiKey,
    'apiSecret': config.apiSecret,
    'strictSSL': false
});

let postfix_subtotal_amount = 0;        // Amount applied toward purchase
let postfix_total_fees = 0;             // All Coinbase fees
let postfix_total_plus_fees = 0;        // Applied toward purchase + fees
let postfix_total_amount = 0;           // Total amount of coin held
let postfix_buy_count = 0;              // Number of transactions
let postfix_average_buy_price = 0;      // Average purchase price
let csv = 'ID,Date,Amount,Subtotal Amount,Total Amount,Unit Price,Total Fees\n';
let csv_postfix =
    '\n' +
    'Current Coin Value,{0}\n' +
    'Total $ Owned,{1}\n' +
    'Total $ Fees,{2}\n' +
    'Total $ Owned + Fees,{3}\n' +
    'Return Percent,{4}\n' +
    'Return Dollars,{5}\n' +
    'Total Held,{6}\n' +
    'Average Buy Price,{7}\n'

function convertTemplateString(string, tokens) {
    tokens.forEach((token, i) => {
        string = string.replace(new RegExp("\\{"+i+"\\}", "g"), tokens[i])
    })
    return string
}

function recursivePromiseGetTransactions(account_id, pagination_passed) {
    return new Promise(function (resolve, reject) {
        client.getAccount(account_id, function (err, account) {
            let config = pagination_passed || {limit: 25};
            account.getBuys(config, function (err, buys, pagination) {
                buys.forEach(function (d) {
                    let subtotal_amount = parseFloat(d.subtotal.amount);
                    let total_plus_fees = parseFloat(d.total.amount);
                    let total_fees = parseFloat(d.fees[0].amount.amount) + parseFloat(d.fees[1].amount.amount);
                    let total_amount = parseFloat(d.amount.amount);
                    let unit_price = parseFloat(d.unit_price.amount);
                    csv += `${d.id},${d.created_at},${total_amount},${subtotal_amount},${total_plus_fees},${unit_price},${total_fees}` + '\n';

                    // Update global figures
                    postfix_subtotal_amount += subtotal_amount;
                    postfix_total_fees += total_fees;
                    postfix_total_plus_fees += total_plus_fees;
                    postfix_total_amount += total_amount;
                    postfix_buy_count += 1;
                    postfix_average_buy_price += unit_price;
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

            // Parse postfix results
            let parsed_postfix = convertTemplateString(csv_postfix, [
                0,
                '$'+postfix_subtotal_amount,
                '$'+postfix_total_fees,
                '$'+postfix_total_plus_fees,
                0,
                0,
                postfix_total_amount.toFixed(9),
                '$'+(postfix_average_buy_price / postfix_buy_count).toFixed(2)
            ])

            // Save results to CSV file
            fs.writeFile(`reports/coinbase-report-buys-${account_id}.csv`, res.data + parsed_postfix, (err) => {
                if (err) return console.log(err);
                console.log('Coinbase Report Buys CSV File Created: ' + `coinbase-report-buys-${account_id}.csv`)
            });
        })
});