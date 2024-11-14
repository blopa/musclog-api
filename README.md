# musclog-api

source: https://docs.google.com/spreadsheets/d/1IYmN3VyHLo4KidFQoC9yMTtsjD4rUbldeeQ1QUCjhIg/edit

## How to use this API
Access https://blopa.github.io/musclog-api/index.json to get all products in JSON format.

## lol but there's 21110 products
Yes, I know. You can filter the products by name by using the path, for example the product `Aarts Perziken op lichte siroop` can be found in the https://blopa.github.io/musclog-api/title/a/a/r/t/s/p/e/r/z/i/k/e/n/o/p/index.json path, which as you can see uses the first letter of each word in the product name.

To know how many characters to be used in the path, you can access https://blopa.github.io/musclog-api/settings.json.

If you know the EAN of the product, you can access https://blopa.github.io/musclog-api/ean/0000000000000.json, replacing the zeros with the EAN, for example https://blopa.github.io/musclog-api/ean/8710277323314.json.

## License
MIT