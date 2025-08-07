const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'main.json');

function loadConfig() {
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('❌ Error loading config:', error.message);
    process.exit(1);
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Configuration saved successfully!');
  } catch (error) {
    console.error('❌ Error saving config:', error.message);
    process.exit(1);
  }
}

function listAccounts(config) {
  console.log('\n📋 Available accounts:');
  config.deviceAccounts.forEach((account, index) => {
    const isActive = index === config.activeAccountIndex;
    const status = isActive ? '🟢 ACTIVE' : '⚪';
    console.log(`  ${index}: ${account.name || `Account ${index + 1}`} ${status}`);
  });
  console.log('');
}

function switchAccount(newIndex) {
  const config = loadConfig();
  
  if (newIndex < 0 || newIndex >= config.deviceAccounts.length) {
    console.error(`❌ Invalid account index: ${newIndex}`);
    console.log(`Available accounts: 0-${config.deviceAccounts.length - 1}`);
    process.exit(1);
  }

  const oldIndex = config.activeAccountIndex;
  const oldAccount = config.deviceAccounts[oldIndex];
  const newAccount = config.deviceAccounts[newIndex];

  config.activeAccountIndex = newIndex;
  saveConfig(config);

  console.log(`🔄 Switched from "${oldAccount.name || `Account ${oldIndex + 1}`}" to "${newAccount.name || `Account ${newIndex + 1}`}"`);
  console.log(`🎮 Now running: ${newAccount.name || `Account ${newIndex + 1}`} (ID: ${newAccount.id.substring(0, 8)}...)`);
}

function showUsage() {
  console.log(`
🎮 Pokemon TCG Bot Account Switcher

Usage:
  node switch-account.js <account_index>
  node switch-account.js list

Examples:
  node switch-account.js 0     # Switch to first account
  node switch-account.js 1     # Switch to second account
  node switch-account.js list  # Show all accounts

After switching, run: node approve.js
`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  showUsage();
  process.exit(0);
}

const command = args[0];

if (command === 'list') {
  const config = loadConfig();
  listAccounts(config);
} else {
  const accountIndex = parseInt(command);
  if (isNaN(accountIndex)) {
    console.error('❌ Invalid account index. Must be a number.');
    showUsage();
    process.exit(1);
  }
  switchAccount(accountIndex);
}
