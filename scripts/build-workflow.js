#!/usr/bin/env node

/**
 * Build script for Alfred workflow
 * Creates a .alfredworkflow file from the project
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const WORKFLOW_NAME = 'beeper-alfred.alfredworkflow';
const OUTPUT_PATH = path.join(DIST_DIR, WORKFLOW_NAME);

// The workflow has no runtime dependencies — everything it needs is in src/.
// node_modules is deliberately NOT bundled: the @beeper/desktop-api SDK was
// removed because it targets the dead /v0/* routes, and the remaining packages
// are dev-only tooling (eslint, jest, archiver).

async function buildWorkflow() {
  console.log('🔨 Building Alfred workflow...\n');

  // Create dist directory
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
    console.log('✅ Created dist directory');
  }

  // Remove existing workflow file
  if (fs.existsSync(OUTPUT_PATH)) {
    fs.unlinkSync(OUTPUT_PATH);
    console.log('✅ Removed existing workflow file');
  }

  // Create info.plist if it doesn't exist
  await ensureInfoPlist();

  // Create zip archive
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(OUTPUT_PATH);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`\n✅ Workflow built successfully!`);
      console.log(`📦 File: ${OUTPUT_PATH}`);
      console.log(`📊 Size: ${sizeInMB} MB`);
      console.log(`📝 Total files: ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on('error', (err) => {
      console.error('❌ Error creating workflow:', err);
      reject(err);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('⚠️  Warning:', err.message);
      } else {
        reject(err);
      }
    });

    archive.pipe(output);

    // Add files
    console.log('\n📦 Adding files to workflow:');

    // Add source files
    // Ship runtime code only — tests add weight and never execute in Alfred
    archive.glob('src/**/*.js', {
      ignore: ['src/__tests__/**', 'src/**/*.test.js']
    });
    console.log('  ✓ src/ (excluding tests)');

    // Add icons if they exist
    if (fs.existsSync('icons')) {
      archive.directory('icons/', 'icons/');
      console.log('  ✓ icons/');
    }

    // Add package files
    if (fs.existsSync('package.json')) {
      archive.file('package.json', { name: 'package.json' });
      console.log('  ✓ package.json');
    }

    if (fs.existsSync('package-lock.json')) {
      archive.file('package-lock.json', { name: 'package-lock.json' });
      console.log('  ✓ package-lock.json');
    }

    // Add README and LICENSE
    if (fs.existsSync('README.md')) {
      archive.file('README.md', { name: 'README.md' });
      console.log('  ✓ README.md');
    }

    if (fs.existsSync('LICENSE')) {
      archive.file('LICENSE', { name: 'LICENSE' });
      console.log('  ✓ LICENSE');
    }

    // Add info.plist
    if (fs.existsSync('info.plist')) {
      archive.file('info.plist', { name: 'info.plist' });
      console.log('  ✓ info.plist');
    }

    // Add icon.png
    if (fs.existsSync('icon.png')) {
      archive.file('icon.png', { name: 'icon.png' });
      console.log('  ✓ icon.png');
    } else {
      console.warn('  ⚠️  icon.png not found');
    }

    // No node_modules: the workflow is dependency-free at runtime.

    archive.finalize();
  });
}

async function ensureInfoPlist() {
  const infoPath = path.join(__dirname, '..', 'info.plist');

  if (fs.existsSync(infoPath)) {
    console.log('✅ info.plist already exists');
    return;
  }

  console.log('⚠️  info.plist not found, creating template...');

  const pkg = require('../package.json');

  const template = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>bundleid</key>
  <string>com.deletosh.beeper-alfred</string>
  <key>category</key>
  <string>Productivity</string>
  <key>connections</key>
  <dict></dict>
  <key>createdby</key>
  <string>deletosh</string>
  <key>description</key>
  <string>${pkg.description}</string>
  <key>disabled</key>
  <false/>
  <key>name</key>
  <string>Beeper for Alfred</string>
  <key>objects</key>
  <array></array>
  <key>readme</key>
  <string>See README.md for setup instructions and usage.</string>
  <key>uidata</key>
  <dict></dict>
  <key>version</key>
  <string>${pkg.version}</string>
  <key>webaddress</key>
  <string>${pkg.repository?.url || ''}</string>
</dict>
</plist>`;

  fs.writeFileSync(infoPath, template, 'utf8');
  console.log('✅ Created info.plist template');
}

// Run build
buildWorkflow()
  .then(() => {
    console.log('\n🎉 Build completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Build failed:', err);
    process.exit(1);
  });
