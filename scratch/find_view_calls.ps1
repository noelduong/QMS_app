# find_view_calls.ps1
$transcriptPath = "C:\Users\Hello\.gemini\antigravity\brain\9b6cad92-4a20-4bc2-ade1-b063d0558dd8\.system_generated\logs\transcript.jsonl"

if (-not (Test-Path $transcriptPath)) {
    Write-Error "Transcript log not found!"
    exit 1
}

$lines = Get-Memory | Out-Null # not needed
$lines = Get-Content $transcriptPath
$i = 0
foreach ($line in $lines) {
    if ($line -like "*Index_GAS.html*" -and $line -like "*view_file*" -and $line -like "*content*") {
        $startLine = ""
        $endLine = ""
        if ($line -match '"StartLine":(\d+)') { $startLine = $matches[1] }
        if ($line -match '"EndLine":(\d+)') { $endLine = $matches[1] }
        
        Write-Output "Step $i - viewed Index_GAS.html from line $startLine to $endLine"
    }
    $i++
}
