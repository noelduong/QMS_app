# fix_styles_tag.ps1
$files = @(
    "d:\QC_APP\placeholders\fabric_testing.html",
    "d:\QC_APP\Index_GAS.html",
    "d:\QC_APP\placeholders\Index.html"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Output "Fixing style tag in $file..."
        $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
        
        # Replace the literal '1' followed by head with '</style>' followed by head
        # Using a regex that is insensitive to CRLF vs LF
        $newContent = [regex]::Replace($content, '(?s)1\r?\n\s*</head>', "</style>`n  </head>")
        
        [System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
        Write-Output "Successfully updated $file!"
    }
}
