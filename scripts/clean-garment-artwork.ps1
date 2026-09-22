param(
    [string]$Source = (Join-Path $PSScriptRoot "..\backend\data\garments"),
    [string]$Destination = (Join-Path $PSScriptRoot "..\backend\data\clean\garments")
)

Add-Type -AssemblyName System.Drawing

$paper = [System.Drawing.Color]::FromArgb(250, 247, 242)
$border = [System.Drawing.Color]::FromArgb(191, 174, 151)
New-Item -ItemType Directory -Force -Path $Destination | Out-Null

Get-ChildItem -LiteralPath $Source -Filter "*.png" | ForEach-Object {
    $sourceImage = [System.Drawing.Bitmap]::FromFile($_.FullName)
    $cleanImage = New-Object System.Drawing.Bitmap $sourceImage.Width, $sourceImage.Height
    $graphics = [System.Drawing.Graphics]::FromImage($cleanImage)
    $graphics.DrawImage($sourceImage, 0, 0, $cleanImage.Width, $cleanImage.Height)

    $scaleX = $cleanImage.Width / 640.0
    $scaleY = $cleanImage.Height / 640.0
    $paperBrush = New-Object System.Drawing.SolidBrush $paper
    $framePen = [System.Drawing.Pen]::new($border, [single][Math]::Max(1, [Math]::Round($scaleX)))

    # Every supplied garment card shares this print layout: a small upper-right seal
    # and a lower catalog caption. Keep the illustration and its frame only.
    $graphics.FillRectangle($paperBrush, [int](474 * $scaleX), [int](44 * $scaleY), [int](108 * $scaleX), [int](94 * $scaleY))
    $graphics.FillRectangle($paperBrush, [int](32 * $scaleX), [int](408 * $scaleY), [int](576 * $scaleX), [int](205 * $scaleY))
    $graphics.DrawRectangle($framePen, [int](24 * $scaleX), [int](24 * $scaleY), [int](592 * $scaleX), [int](592 * $scaleY))

    $targetPath = Join-Path $Destination $_.Name
    $cleanImage.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $framePen.Dispose()
    $paperBrush.Dispose()
    $graphics.Dispose()
    $cleanImage.Dispose()
    $sourceImage.Dispose()
}
