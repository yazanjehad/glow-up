/**
 * Translation File Comparison Script
 * Compares en.json and ar.json translation files to find missing keys
 * 
 * Usage: node check-translations.js
 */

const fs = require('fs');
const path = require('path');

// Paths to translation files
const I18N_DIR = path.join(__dirname, 'src', 'i18n');
const EN_FILE = path.join(I18N_DIR, 'en', 'common.json');
const AR_FILE = path.join(I18N_DIR, 'ar', 'common.json');

/**
 * Recursively get all keys from a nested JSON object
 * @param {Object} obj - The JSON object
 * @param {string} prefix - Key prefix for nested objects
 * @returns {Set<string>} Set of all keys in dot notation
 */
function getAllKeys(obj, prefix = '') {
  const keys = new Set();
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const nestedKeys = getAllKeys(obj[key], fullKey);
      nestedKeys.forEach(k => keys.add(k));
    } else {
      keys.add(fullKey);
    }
  }
  
  return keys;
}

/**
 * Find missing keys between two sets
 * @param {Set<string>} set1 - First set of keys
 * @param {Set<string>} set2 - Second set of keys
 * @returns {string[]} Keys in set1 but not in set2
 */
function findMissingKeys(set1, set2) {
  const missing = [];
  for (const key of set1) {
    if (!set2.has(key)) {
      missing.push(key);
    }
  }
  return missing.sort();
}

/**
 * Compare two translation files
 */
function compareTranslations() {
  console.log('🔍 Comparing translation files...\n');
  console.log(`   English: ${path.relative(__dirname, EN_FILE)}`);
  console.log(`   Arabic:  ${path.relative(__dirname, AR_FILE)}\n`);

  // Check if files exist
  if (!fs.existsSync(EN_FILE)) {
    console.error(`❌ Error: English translation file not found: ${EN_FILE}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(AR_FILE)) {
    console.error(`❌ Error: Arabic translation file not found: ${AR_FILE}`);
    process.exit(1);
  }

  // Load translation files
  let enTranslations, arTranslations;
  
  try {
    enTranslations = JSON.parse(fs.readFileSync(EN_FILE, 'utf8'));
    arTranslations = JSON.parse(fs.readFileSync(AR_FILE, 'utf8'));
  } catch (error) {
    console.error(`❌ Error parsing JSON files: ${error.message}`);
    process.exit(1);
  }

  // Get all keys
  const enKeys = getAllKeys(enTranslations);
  const arKeys = getAllKeys(arTranslations);

  // Find missing keys
  const missingInArabic = findMissingKeys(enKeys, arKeys);
  const missingInEnglish = findMissingKeys(arKeys, enKeys);

  // Display results
  console.log('📊 Statistics:');
  console.log(`   Total keys in English: ${enKeys.size}`);
  console.log(`   Total keys in Arabic:  ${arKeys.size}`);
  console.log(`   Missing in Arabic:    ${missingInArabic.length}`);
  console.log(`   Missing in English:   ${missingInEnglish.length}\n`);

  // Display missing keys in Arabic
  if (missingInArabic.length > 0) {
    console.log('⚠️  Keys missing in Arabic (exist in English but not in Arabic):');
    for (const key of missingInArabic) {
      let value = enTranslations;
      const parts = key.split('.');
      for (const part of parts) {
        value = value?.[part];
      }
      console.log(`   - ${key}`);
      console.log(`     English: "${value}"`);
    }
    console.log('');
  }

  // Display missing keys in English
  if (missingInEnglish.length > 0) {
    console.log('⚠️  Keys missing in English (exist in Arabic but not in English):');
    for (const key of missingInEnglish) {
      let value = arTranslations;
      const parts = key.split('.');
      for (const part of parts) {
        value = value?.[part];
      }
      console.log(`   - ${key}`);
      console.log(`     Arabic: "${value}"`);
    }
    console.log('');
  }

  // Final summary
  if (missingInArabic.length === 0 && missingInEnglish.length === 0) {
    console.log('✅ All translation keys are complete! Both files have matching keys.');
  } else {
    console.log('📝 Summary:');
    console.log(`   - ${missingInArabic.length} keys need Arabic translations`);
    console.log(`   - ${missingInEnglish.length} keys need English translations`);
    console.log('\n💡 Tip: Add the missing keys to ensure complete translations for both languages.');
  }

  // Exit with error code if there are missing keys
  if (missingInArabic.length > 0 || missingInEnglish.length > 0) {
    process.exit(1);
  }
}

// Run the comparison
compareTranslations();

