# Coinbase Report Generator

This is a tool that uses Node.js and Coinbase API to generate transaction reports as CSV files for better
viewing of your Coinbase history (buys, sells, sends, etc).

Upon running `node report.js` you will be prompted for the symbol of which you would like to
generate a report from (ie BTC). Reports will be generated as easy to import CSV files that can
be manipulated with your choice of spreadsheet tool. Enjoy.

## Authors

- Wil Neeley ([william.neeley@gmail.com](mailto:william.neeley@gmail.com))

## Requirements

- Node >= v13
- [Coinbase API](https://developers.coinbase.com/)

## Installation

1) Make sure you have Node >= v10 installed

``` bash
node --version
```

2) Install all dependencies

``` bash
npm install
```

## Usage

Be sure and create a copy of `config/config.default.js` in the `config/` directory named `config.js` and update it with
your Coinbase `apiKey` and `apiSecret`.

To launch the application:

``` bash
node report.js
```
