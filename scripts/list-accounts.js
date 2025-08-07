const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'main.json');

try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('Found ' + config.deviceAccounts.length + ' accounts:');
    config.deviceAccounts.forEach((acc, index) => {
        console.log('  ' + index + ': ' + (acc.name || 'Account ' + (index + 1)) + ' (' + acc.id.substring(0, 8) + '...)');
    });
} catch (error) {
    console.error('Error reading config:', error.message);
    process.exit(1);
}
