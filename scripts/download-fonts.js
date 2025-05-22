const fs = require('fs');
const path = require('path');
const https = require('https');

const FONTS = {
  'OpenSans-Regular.woff2': 'https://fonts.gstatic.com/s/opensans/v34/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-mu0SC55I.woff2',
  'OpenSans-Medium.woff2': 'https://fonts.gstatic.com/s/opensans/v34/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTSGmu0SC55I.woff2',
  'OpenSans-SemiBold.woff2': 'https://fonts.gstatic.com/s/opensans/v34/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTSumu0SC55I.woff2'
};

const FONTS_DIR = path.join(__dirname, '..', 'src', 'fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(FONTS_DIR)) {
  fs.mkdirSync(FONTS_DIR, { recursive: true });
}

// Download a single font file
function downloadFont(filename, url) {
  const filepath = path.join(FONTS_DIR, filename);

  // Skip if file already exists
  if (fs.existsSync(filepath)) {
    console.log(`Font ${filename} already exists, skipping download`);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    console.log(`Downloading ${filename}...`);
    const file = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file if download failed
      reject(err);
    });
  });
}

// Download all fonts
async function downloadFonts() {
  try {
    await Promise.all(
      Object.entries(FONTS).map(([filename, url]) => downloadFont(filename, url))
    );
    console.log('All fonts downloaded successfully');
  } catch (error) {
    console.error('Error downloading fonts:', error);
    process.exit(1);
  }
}

downloadFonts();