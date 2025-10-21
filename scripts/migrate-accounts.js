#!/usr/bin/env node

/**
 * Account Migration CLI Tool
 * Helps migrate existing accounts to the new enhanced system
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const AUTH_BASE_URL = 'http://localhost:6800';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(`${colors.blue}${prompt}${colors.reset} `, resolve);
  });
}

async function resetUserPassword(email, password, adminToken) {
  try {
    const response = await axios.post(`${AUTH_BASE_URL}/api/admin/reset-password`, {
      email,
      newPassword: password,
      adminToken
    });

    if (response.data.success) {
      log(`✓ Password reset successful for ${email}`, colors.green);
      log(`  Platform ID: ${response.data.data.platformId}`, colors.reset);
      return true;
    } else {
      log(`✗ Password reset failed for ${email}: ${response.data.error}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`✗ Password reset failed for ${email}: ${error.response?.data?.error || error.message}`, colors.red);
    return false;
  }
}

async function expireAccounts(adminToken, expiryDays = 30) {
  try {
    const response = await axios.post(`${AUTH_BASE_URL}/api/admin/expire-accounts`, {
      adminToken,
      expiryDays
    });

    if (response.data.success) {
      log(`✓ Set expiry for ${response.data.data.affectedAccounts} accounts`, colors.green);
      log(`  Expiry date: ${new Date(response.data.data.expiryDate).toLocaleDateString()}`, colors.reset);
      return true;
    } else {
      log(`✗ Failed to set account expiry: ${response.data.error}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`✗ Failed to set account expiry: ${error.response?.data?.error || error.message}`, colors.red);
    return false;
  }
}

async function main() {
  log(`${colors.bold}🔧 Account Migration Tool${colors.reset}\n`);

  const adminToken = await question('Enter admin token: ');
  if (!adminToken) {
    log('Admin token is required', colors.red);
    process.exit(1);
  }

  log('\nSelect an option:', colors.blue);
  log('1. Reset password for specific user');
  log('2. Set expiry for all accounts without password hashes');
  log('3. Reset password for tony@fusionduotech.com (super admin)');

  const choice = await question('Choice (1-3): ');

  switch (choice) {
    case '1':
      const email = await question('Enter user email: ');
      const password = await question('Enter new password: ');
      await resetUserPassword(email, password, adminToken);
      break;

    case '2':
      const days = await question('Expiry days (default 30): ') || '30';
      await expireAccounts(adminToken, parseInt(days));
      break;

    case '3':
      const superAdminPassword = await question('Enter new password for tony@fusionduotech.com: ');
      const success = await resetUserPassword('tony@fusionduotech.com', superAdminPassword, adminToken);
      if (success) {
        log('\n🎉 Super admin account is now ready for enhanced login!', colors.green);
        log('You can now login with the enhanced RBAC system.', colors.green);
      }
      break;

    default:
      log('Invalid choice', colors.red);
      break;
  }

  rl.close();
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\nOperation cancelled', colors.yellow);
  rl.close();
  process.exit(0);
});

main().catch((error) => {
  log(`\n💥 Unexpected error: ${error.message}`, colors.red);
  rl.close();
  process.exit(1);
});