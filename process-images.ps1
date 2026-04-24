# 設定資料夾與裁切參數
$inputFolder = "C:\Users\Johna\Downloads\hSD14-19\hSD19"
$outputFolder = "C:\Users\Johna\Desktop\holotcg-online\client\public\webpcards\hSD19-trans"
$prefix = "hSD09"
$width = 1120
$height = 1080
$usePrefix = $false   # 是否使用 prefix 命名（$true = 重新命名；$false = 保留原檔名）

# 建立輸出資料夾（如果不存在）
if (!(Test-Path $outputFolder)) {
    New-Item -ItemType Directory -Path $outputFolder | Out-Null
}

# 取得所有 JPEG 檔案，根據名稱排序
$images = Get-ChildItem -Path $inputFolder -File | Where-Object { $_.Extension -match '\.jpe?g$' -or $_.Extension -match '\.JPG$' } | Sort-Object Name

# 處理圖片
$count = 1
foreach ($img in $images) {
    if ($usePrefix) {
        $outputFileName = "{0}-{1:D3}.webp" -f $prefix, $count
    } else {
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($img.Name)
        $outputFileName = "$baseName.webp"
    }

    $outputPath = Join-Path $outputFolder $outputFileName
    Write-Host "處理第 $count 張：$($img.Name) ➜ $outputFileName"

    & "C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe" "$($img.FullName)" -gravity East -crop ${width}x${height}+0+0 +repage "$outputPath"

    $count++
}

Write-Host "✅ 所有圖片已處理完畢，輸出至 $outputFolder"
