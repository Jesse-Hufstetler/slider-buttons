# Draws the Speed knob filmstrip (64 frames of 64x64, stacked vertically) for the modgui.
# Usage: powershell -File tools/gen-knob.ps1
Add-Type -AssemblyName System.Drawing

$frames = 64
$size = 64
$ss = 4                       # supersample factor
$big = $size * $ss
$out = New-Object System.Drawing.Bitmap $size, ($size * $frames)
$g = [System.Drawing.Graphics]::FromImage($out)
$g.Clear([System.Drawing.Color]::Transparent)
$g.InterpolationMode = 'HighQualityBicubic'
$g.PixelOffsetMode = 'HighQuality'

for ($i = 0; $i -lt $frames; $i++) {
    $bmp = New-Object System.Drawing.Bitmap $big, $big
    $b = [System.Drawing.Graphics]::FromImage($bmp)
    $b.SmoothingMode = 'HighQuality'
    $b.Clear([System.Drawing.Color]::Transparent)
    $c = $big / 2

    # soft drop shadow
    $shadow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(70, 0, 0, 0))
    $b.FillEllipse($shadow, $c - 0.40 * $big, $c - 0.36 * $big, 0.80 * $big, 0.80 * $big)

    # outer rim
    $rim = New-Object System.Drawing.Drawing2D.LinearGradientBrush ([System.Drawing.PointF]::new(0, 0)), ([System.Drawing.PointF]::new(0, $big)), ([System.Drawing.Color]::FromArgb(255, 92, 96, 104)), ([System.Drawing.Color]::FromArgb(255, 28, 30, 34))
    $b.FillEllipse($rim, $c - 0.42 * $big, $c - 0.42 * $big, 0.84 * $big, 0.84 * $big)

    # cap
    $cap = New-Object System.Drawing.Drawing2D.LinearGradientBrush ([System.Drawing.PointF]::new(0, 0)), ([System.Drawing.PointF]::new(0, $big)), ([System.Drawing.Color]::FromArgb(255, 58, 62, 70)), ([System.Drawing.Color]::FromArgb(255, 34, 36, 41))
    $b.FillEllipse($cap, $c - 0.35 * $big, $c - 0.35 * $big, 0.70 * $big, 0.70 * $big)

    # indicator, sweeping -135deg .. +135deg from straight up
    $deg = -135 + 270 * $i / ($frames - 1)
    $rad = $deg * [Math]::PI / 180
    $dx = [Math]::Sin($rad)
    $dy = -[Math]::Cos($rad)
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 196, 64)), (0.075 * $big)
    $pen.StartCap = 'Round'
    $pen.EndCap = 'Round'
    $b.DrawLine($pen, [single]($c + $dx * 0.12 * $big), [single]($c + $dy * 0.12 * $big), [single]($c + $dx * 0.29 * $big), [single]($c + $dy * 0.29 * $big))

    $g.DrawImage($bmp, 0, $i * $size, $size, $size)
    $b.Dispose(); $bmp.Dispose()
}

$path = Join-Path $PSScriptRoot '..\slider-buttons.lv2\modgui\knob.png'
$out.Save([System.IO.Path]::GetFullPath($path), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $out.Dispose()
Write-Output "wrote $([System.IO.Path]::GetFullPath($path))"
