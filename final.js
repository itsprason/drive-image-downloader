const axios = require('axios');
const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')();
const sharp = require('sharp');

async function downloadAndConvertToWebP(gDriveLink) {
  try {
    // Extract the file ID from the Google Drive link
    const fileId = gDriveLink.match(/\/d\/(.*?)(?:\/|$)/)[1];

    // Set /assets/images as output directory
    const outputDirectory = path.join(process.cwd(), 'assets', 'images');

    // Make a request to get the image file details
    const response = await axios.get(`https://drive.google.com/uc?id=${fileId}`, {
      responseType: 'stream',
    });

    // Extract the filename from the content disposition header using a regular expression
    const contentDisposition = response.headers['content-disposition'];
    const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;"]*)['"]?(?:$|;)/);
    const filename = filenameMatch ? filenameMatch[1].trim() : `downloaded_image_${fileId}.jpg`;

    // Create a write stream with the extracted or default filename
    const writeStream = fs.createWriteStream(path.join(outputDirectory, filename));

    // Pipe the response stream to the write stream
    response.data.pipe(writeStream);

    // Wait for the file to finish downloading
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Check if the downloaded file is a GIF; if yes, skip the conversion to WebP
    if (path.extname(filename).toLowerCase() !== '.gif') {
      // Convert the image to WebP with the specified quality
      await sharp(path.join(outputDirectory, filename))
        .webp({ quality: 80 })
        .toFile(path.join(outputDirectory, filename.replace(/\.[^/.]+$/, '.webp')));
    }

    fs.unlinkSync(path.join(outputDirectory, filename));


    console.log('Image downloaded and converted to WebP successfully.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example usage
const googleDriveLink = prompt('Google Drive Link: ');

downloadAndConvertToWebP(googleDriveLink)
  .then(() => {
    console.log('Download and conversion completed successfully.');
  })
  .catch((error) => {
    console.error('Error:', error.message);
  });

