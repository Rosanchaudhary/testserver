import fs  from "fs";
import path from "path";

// CHANGE THIS to your folder path
const directoryPath = "C:/Upwork/web_three/myapp/public/assets/player";

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.error("Error reading directory:", err);
    return;
  }

  files.forEach((file) => {
    // Only process png images
    if (!file.toLowerCase().endsWith(".png")) return;

    const newName = file.replace(/\s+/g, "");

    if (file !== newName) {
      const oldPath = path.join(directoryPath, file);
      const newPath = path.join(directoryPath, newName);

      fs.rename(oldPath, newPath, (err) => {
        if (err) {
          console.error(`Failed to rename ${file}:`, err);
        } else {
          console.log(`${file} → ${newName}`);
        }
      });
    }
  });
});
