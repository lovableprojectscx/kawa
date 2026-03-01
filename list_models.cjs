const https = require('https');
const fs = require('fs');

const key = "AIzaSyCR1GlAmhdmr9YJVrbHQW3wqBaNwbpvlS8";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

console.log(`Fetching from: ${url.replace(key, 'KEY')}`);

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const content = JSON.stringify(json, null, 2);
            fs.writeFileSync('models_full.txt', content);
            console.log("Wrote models to models_full.txt");
        } catch (e) {
            console.error("Error parsing/writing:", e);
        }
    });
}).on('error', err => {
    console.error("Request Error:", err.message);
});
