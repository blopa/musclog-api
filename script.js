const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const filePath = path.join(__dirname, 'products.csv');

const usedEanCodes = new Set();

const PRODUCT_TITLE_CHAR_LIMIT = 40;

const indexJson = {};

const productsJson = {};

function normalizeText(text) {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
        if (row.ean) {
            const ean = row.ean;
            if (usedEanCodes.has(ean)) {
                console.log(`Duplicate EAN code: ${ean}`);
            } else {
                usedEanCodes.add(ean);
                indexJson[ean] = row.productTitle;

                const outputDir = path.join(__dirname, 'output', 'ean');
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                fs.writeFile(path.join(outputDir, `${ean}.json`), JSON.stringify(row), (error) => {
                    if (error) {
                        console.error(`Error writing file for EAN code ${ean}:`, error);
                    }
                });

                const normalizedTitle = normalizeText(row.productTitle);
                const first10Chars = normalizedTitle.substring(0, PRODUCT_TITLE_CHAR_LIMIT);
                const outputPath = [...first10Chars].reduce((acc, char) => {
                    return path.join(acc, char);
                }, '');

                productsJson[outputPath] = [
                    ...(productsJson[outputPath] || []),
                    row,
                ];
            }
        }
    })
    .on('end', () => {
        const outputDir = path.join(__dirname, 'output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFile(path.join(outputDir, 'index.json'), JSON.stringify(indexJson), (error) => {
            if (error) {
                console.error('Error writing index file', error);
            }
        });

        Object.entries(productsJson).forEach(([outputDir, product]) => {
            const finalOutputDir = path.join(__dirname, 'output', 'title', outputDir);
            if (!fs.existsSync(finalOutputDir)) {
                fs.mkdirSync(finalOutputDir, { recursive: true });
            }

            fs.writeFile(path.join(finalOutputDir, 'index.json'), JSON.stringify(product), (error) => {
                if (error) {
                    console.error(`Error writing file for path ${path}:`, error);
                }
            });
        });

        const settingsOutputDir = path.join(__dirname, 'output');
        if (!fs.existsSync(settingsOutputDir)) {
            fs.mkdirSync(settingsOutputDir, { recursive: true });
        }
        fs.writeFile(path.join(settingsOutputDir, 'settings.json'), JSON.stringify({
            product_char_limit: PRODUCT_TITLE_CHAR_LIMIT,
        }), (error) => {
            if (error) {
                console.error('Error creating settings file', error);
            }
        });

        console.log('Done');
    })
    .on('error', (error) => {
        console.error('Error reading the CSV file:', error);
    });
