$content = Get-Content -Path 'index.html' -Encoding UTF8 -Raw

# Remove the WhatsApp SVG icon (the entire SVG tag)
$pattern = '<svg xmlns="http://www\.w3\.org/2000/svg"[^>]*?>\s*<path d="M13\.601[^<]*?</path>\s*</svg>\s*'
$content = $content -replace $pattern, ''

# Save the file
Set-Content -Path 'index.html' -Encoding UTF8 -NoNewline -Value $content

Write-Host "SVG removido com sucesso!"
