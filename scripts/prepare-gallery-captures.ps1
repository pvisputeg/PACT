param(
  [string]$SourceDirectory = $env:TEMP,
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\submission-assets\screenshots')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$captures = @(
  @{ Source = 'pact-10-mission-control.jpg'; Output = '10-mission-control.png' },
  @{ Source = 'pact-20-plant-digital-twin.jpg'; Output = '20-plant-digital-twin.png' },
  @{ Source = 'pact-30-proofline-verification.jpg'; Output = '30-proofline-verification.png' },
  @{ Source = 'pact-40-independent-audit.jpg'; Output = '40-independent-audit.png' },
  @{ Source = 'pact-50-blocked-quality-guard.jpg'; Output = '50-blocked-quality-guard.png' },
  @{ Source = 'pact-60-outcome-closeout.jpg'; Output = '60-outcome-closeout.png' }
)

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
[System.IO.Directory]::CreateDirectory($resolvedOutput) | Out-Null

foreach ($capture in $captures) {
  $sourcePath = Join-Path $SourceDirectory $capture.Source
  if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Missing browser capture: $sourcePath"
  }

  $source = [System.Drawing.Image]::FromFile($sourcePath)
  try {
    $canvas = New-Object System.Drawing.Bitmap 1440, 960, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($canvas)
      try {
        $graphics.Clear([System.Drawing.Color]::FromArgb(2, 12, 20))
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

        $scale = [Math]::Min(1440 / $source.Width, 960 / $source.Height)
        $width = [Math]::Round($source.Width * $scale)
        $height = [Math]::Round($source.Height * $scale)
        $x = [Math]::Floor((1440 - $width) / 2)
        $y = [Math]::Floor((960 - $height) / 2)
        $graphics.DrawImage($source, $x, $y, $width, $height)
      } finally {
        $graphics.Dispose()
      }

      $outputPath = Join-Path $resolvedOutput $capture.Output
      $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
      Write-Output "$($capture.Output): 1440x960"
    } finally {
      $canvas.Dispose()
    }
  } finally {
    $source.Dispose()
  }
}
