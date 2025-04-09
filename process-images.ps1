# 設定資料夾
$inputFolder = "C:\Users\Johna\Desktop\holotcg-online\client\public\webpcards\hBD24-trans"
$outputFolder = "C:\Users\Johna\Desktop\holotcg-online\client\public\webpcards\hBD24-trans"
$prefix = "hBD24"
$width = 1120
$height = 1080

# 建立輸出資料夾（如果不存在）
if (!(Test-Path $outputFolder)) {
    New-Item -ItemType Directory -Path $outputFolder | Out-Null
}

# 取得所有 JPEG 檔案，根據 CreationTime 排序
$images = Get-ChildItem -Path $inputFolder -File | Where-Object { $_.Extension -match '\.jpe?g$' -or $_.Extension -match '\.JPG$' } | Sort-Object CreationTime

# 處理圖片
$count = 1
foreach ($img in $images) {
    $outputFileName = "{0}-{1:D3}.webp" -f $prefix, $count
    $outputPath = Join-Path $outputFolder $outputFileName

    Write-Host "處理第 $count 張：$($img.Name) ➜ $outputFileName"

    # 使用 ImageMagick 裁切右側區塊並輸出為 .webp
    magick "$($img.FullName)" -gravity East -crop ${width}x${height}+0+0 +repage "$outputPath"

    $count++
}

Write-Host "✅ 所有圖片已處理完畢，輸出至 $outputFolder"
