const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const filePath = path.join(__dirname, 'products.csv');

const usedEanCodes = new Set();

const PRODUCT_TITLE_CHAR_LIMIT = 15;

const indexJson = {};

const productsJson = {};

function normalizeText(text) {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

const outputDir = path.join(__dirname, 'output');
if (fs.existsSync(outputDir)) {
    fs.rmdirSync(outputDir, { recursive: true });
}

const writeEanFile = async (ean, row) => {
    const outputDir = path.join(__dirname, 'output', 'ean');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        await fs.promises.writeFile(
            path.join(outputDir, `${ean}.json`),
            JSON.stringify(row)
        );
    } catch (error) {
        console.error(`Error writing file for EAN code ${ean}:`, error);
    }
};

const processCsv = () => {
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', async (row) => {
                if (row.ean) {
                    const ean = row.ean;
                    if (usedEanCodes.has(ean)) {
                        console.log(`Duplicate EAN code: ${ean}`);
                    } else {
                        usedEanCodes.add(ean);
                        indexJson[ean] = row.productTitle;

                        await writeEanFile(ean, row);

                        const normalizedTitle = normalizeText(row.productTitle);
                        const firstChars = normalizedTitle.substring(0, PRODUCT_TITLE_CHAR_LIMIT);
                        [...firstChars].reduce((acc, char) => {
                            const newPath = path.join(acc, char);

                            productsJson[newPath] = [
                                ...(productsJson[newPath] || []),
                                row,
                            ];

                            return newPath;
                        }, '');
                    }
                }
            })
            .on('end', resolve)
            .on('error', reject);
    });
};

const writeProductFiles = async () => {
    const entries = Object.entries(productsJson);

    for (const [outputDir, product] of entries) {
        const finalOutputDir = path.join(__dirname, 'output', 'title', outputDir);
        if (!fs.existsSync(finalOutputDir)) {
            fs.mkdirSync(finalOutputDir, { recursive: true });
        }

        try {
            await fs.promises.writeFile(
                path.join(finalOutputDir, 'index.json'),
                JSON.stringify(product)
            );
        } catch (error) {
            console.error(`Error writing file for path ${finalOutputDir}:`, error);
        }
    }
};

const writeIndexFile = async () => {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        await fs.promises.writeFile(
            path.join(outputDir, 'index.json'),
            JSON.stringify(indexJson)
        );
    } catch (error) {
        console.error('Error writing index file', error);
    }
};

const writeSettingsFile = async () => {
    const settingsOutputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(settingsOutputDir)) {
        fs.mkdirSync(settingsOutputDir, { recursive: true });
    }

    try {
        await fs.promises.writeFile(
            path.join(settingsOutputDir, 'settings.json'),
            JSON.stringify({ product_char_limit: PRODUCT_TITLE_CHAR_LIMIT })
        );
    } catch (error) {
        console.error('Error creating settings file', error);
    }
};

const main = async () => {
    try {
        await processCsv();
        await writeIndexFile();
        await writeProductFiles();
        await writeSettingsFile();
        console.log('Done');
    } catch (error) {
        console.error('An error occurred:', error);
    }
};

main();
