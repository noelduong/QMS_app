# search_transcript.ps1
$transcriptPath = "C:\Users\Hello\.gemini\antigravity\brain\9b6cad92-4a20-4bc2-ade1-b063d0558dd8\.system_generated\logs\transcript.jsonl"
$outputFile = "d:\QC_APP\scratch\extracted_index_gas.txt"

if (-not (Test-Path $transcriptPath)) {
    Write-Error "Transcript log not found!"
    exit 1
}

Write-Output "Searching transcript log for original Index_GAS.html contents..."
$lines = Get-Content $transcriptPath

$count = 0
foreach ($line in $lines) {
    if ($line -like "*Index_GAS.html*" -and $line -like "*view_file*" -and $line -like "*output*") {
        Write-Output "Found matching log entry at line $count"
        [System.IO.File]::WriteAllText("d:\QC_APP\scratch\match_$count.json", $line)
    }
    $count++
}

Write-Output "Finished searching transcript log!"
