# extract_index_gas.ps1
$transcriptPath = "C:\Users\Hello\.gemini\antigravity\brain\9b6cad92-4a20-4bc2-ade1-b063d0558dd8\.system_generated\logs\transcript.jsonl"

if (-not (Test-Path $transcriptPath)) {
    Write-Error "Transcript log not found!"
    exit 1
}

$lines = Get-Content $transcriptPath
$maxLength = 0
$bestLine = ""
foreach ($line in $lines) {
    if ($line -like "*Index_GAS.html*" -and $line -like "*view_file*" -and $line -like "*content*") {
        if ($line.Length -gt $maxLength) {
            $maxLength = $line.Length
            $bestLine = $line
        }
    }
}

if ($bestLine) {
    Write-Output "Found longest entry with length $maxLength"
    try {
        $json = ConvertFrom-Json $bestLine
        $fileContent = $json.content
        
        # Strip line number prefixes if present
        if ($fileContent -match '(?m)^\s*\d+:\s') {
            Write-Output "Stripping line number prefixes..."
            $fileContent = $fileContent -replace '(?m)^\s*\d+:\s?', ''
        }
        
        [System.IO.File]::WriteAllText("d:\QC_APP\scratch\restored_Index_GAS.html", $fileContent, [System.Text.Encoding]::UTF8)
        Write-Output "Successfully wrote restored_Index_GAS.html"
    } catch {
        Write-Error "Failed to parse JSON: $_"
    }
} else {
    Write-Error "No matching entry found!"
}
