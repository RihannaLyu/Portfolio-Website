# Applies the HOUSE FINISH (finish.html) to an image and writes a transparent PNG.
param([string]$Src, [string]$Out, [int]$W, [int]$H, [string]$Ink = "")
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$dir  = Split-Path $MyInvocation.MyCommand.Path
$profile = Join-Path $env:TEMP "house-finish-edge"
$srcUrl = [Uri]::EscapeDataString(([System.Uri]$Src).AbsoluteUri)
$url = ([System.Uri](Join-Path $dir "house-finish.html")).AbsoluteUri + "?w=$W&h=$H&ink=$Ink&src=$srcUrl"
& $edge --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 `
  --user-data-dir="$profile" --default-background-color=00000000 --allow-file-access-from-files `
  --window-size="$W,$H" --virtual-time-budget=5000 --screenshot="$Out" $url 2>$null | Out-Null
Start-Sleep -Milliseconds 300
if (Test-Path $Out) { "{0}  {1:N0} KB" -f $Out, ((Get-Item $Out).Length / 1KB) } else { "FAILED $Out" }
