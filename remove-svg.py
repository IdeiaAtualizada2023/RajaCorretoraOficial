import re

# Read the file
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find and replace the button with SVG
# We'll replace the entire button content that has the SVG with just the text "ENVIAR"
old_button_pattern = r'<button type="submit" class="btn-enviar-lead">\s*<svg[^>]*>.*?</svg>\s*ENVIAR\s*</button>'

new_button = '<button type="submit" class="btn-enviar-lead">ENVIAR</button>'

# Replace using regex with DOTALL flag to match across multiple lines
content_new = re.sub(old_button_pattern, new_button, content, flags=re.DOTALL)

# Write the file back
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content_new)

print("Ícone SVG removido com sucesso!")
