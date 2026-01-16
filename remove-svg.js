const fs = require('fs');

// Read the file
const content = fs.readFileSync('index.html', 'utf-8');

// Pattern to find and replace the button with SVG
// We'll replace the entire button content that has the SVG with just the text "ENVIAR"
const oldButtonPattern = /<button type="submit" class="btn-enviar-lead">\s*<svg[^>]*>.*?<\/svg>\s*ENVIAR\s*<\/button>/gs;

const newButton = '<button type="submit" class="btn-enviar-lead">ENVIAR</button>';

// Replace using regex
const contentNew = content.replace(oldButtonPattern, newButton);

// Write the file back
fs.writeFileSync('index.html', contentNew, 'utf-8');

console.log("Ícone SVG removido com sucesso!");
