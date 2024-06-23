$output = @()

Get-ChildItem -Directory | ForEach-Object {
    $folderName = $_.Name
    $folderPath = "/projects/$folderName/index.html"
    $folderInfo = @{
        "name" = $folderName
        "path" = $folderPath
    }
    $output += $folderInfo
}

$output | ConvertTo-Json | Out-File -FilePath output.json