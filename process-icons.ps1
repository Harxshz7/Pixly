Add-Type -AssemblyName System.Drawing

function Convert-Icon($src, $dest, $w, $h) {
    $img = [System.Drawing.Image]::FromFile($src)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($img, 0, 0, $w, $h)
    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    Write-Host "Generated icon $dest ($w x $h)"
}

$iconSrc = "C:\Users\harxs\.gemini\antigravity-ide\brain\176812e3-4301-49e7-8b97-8291d694cb73\pixly_app_icon_1790838198755.jpg"
$publicIcons = "c:\Users\harxs\OneDrive\Desktop\Pixly\public\icons"
$storeAssets = "c:\Users\harxs\OneDrive\Desktop\Pixly\store-assets"

Convert-Icon $iconSrc "$publicIcons\icon128.png" 128 128
Convert-Icon $iconSrc "$publicIcons\icon48.png" 48 48
Convert-Icon $iconSrc "$publicIcons\icon32.png" 32 32
Convert-Icon $iconSrc "$publicIcons\icon16.png" 16 16
Convert-Icon $iconSrc "$storeAssets\icon-128.png" 128 128
