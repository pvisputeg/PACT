Add-Type -AssemblyName System.Drawing

$outputPath = Join-Path (Get-Location) 'public\og.png'
$submissionPath = Join-Path (Get-Location) 'submission-assets\devpost-cover.png'
$bitmap = New-Object System.Drawing.Bitmap 1200, 630
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

function Color([string]$hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function Font([float]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular, [string]$family = 'Segoe UI') {
  return New-Object System.Drawing.Font $family, $size, $style, ([System.Drawing.GraphicsUnit]::Point)
}

function Text([string]$value, [float]$x, [float]$y, [float]$size, [string]$hex, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular, [string]$family = 'Segoe UI') {
  $font = Font $size $style $family
  $brush = New-Object System.Drawing.SolidBrush (Color $hex)
  try { $graphics.DrawString($value, $font, $brush, $x, $y) } finally { $font.Dispose(); $brush.Dispose() }
}

function RoundedRect([float]$x, [float]$y, [float]$width, [float]$height, [float]$radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $radius * 2
  $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
  $path.AddArc($x + $width - $diameter, $y, $diameter, $diameter, 270, 90)
  $path.AddArc($x + $width - $diameter, $y + $height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($x, $y + $height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Panel([float]$x, [float]$y, [float]$width, [float]$height, [float]$radius = 10) {
  $path = RoundedRect $x $y $width $height $radius
  $fill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(225, 9, 15, 22))
  $stroke = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(74, 102, 132, 145)), 1
  try { $graphics.FillPath($fill, $path); $graphics.DrawPath($stroke, $path) } finally { $fill.Dispose(); $stroke.Dispose(); $path.Dispose() }
}

try {
  $backgroundRect = New-Object System.Drawing.Rectangle 0, 0, 1200, 630
  $background = New-Object System.Drawing.Drawing2D.LinearGradientBrush $backgroundRect, (Color '#05080c'), (Color '#0a1118'), 25
  $graphics.FillRectangle($background, $backgroundRect)
  $background.Dispose()

  $gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(16, 110, 145, 160)), 1
  for ($x = 0; $x -le 1200; $x += 44) { $graphics.DrawLine($gridPen, $x, 0, $x, 630) }
  for ($y = 0; $y -le 630; $y += 44) { $graphics.DrawLine($gridPen, 0, $y, 1200, $y) }
  $gridPen.Dispose()

  $glowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(16, 70, 223, 202))
  $graphics.FillEllipse($glowBrush, 760, 65, 430, 330)
  $glowBrush.Dispose()

  $diamondPen = New-Object System.Drawing.Pen (Color '#46dfca'), 1
  $diamondInnerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(145, 70, 223, 202)), 1
  $graphics.DrawPolygon($diamondPen, @([System.Drawing.Point]::new(37, 18), [System.Drawing.Point]::new(56, 37), [System.Drawing.Point]::new(37, 56), [System.Drawing.Point]::new(18, 37)))
  $graphics.DrawPolygon($diamondInnerPen, @([System.Drawing.Point]::new(37, 27), [System.Drawing.Point]::new(47, 37), [System.Drawing.Point]::new(37, 47), [System.Drawing.Point]::new(27, 37)))
  $coreBrush = New-Object System.Drawing.SolidBrush (Color '#46dfca')
  $graphics.FillEllipse($coreBrush, 34, 34, 6, 6)
  $coreBrush.Dispose(); $diamondPen.Dispose(); $diamondInnerPen.Dispose()
  Text 'PACT' 67 18 19 '#f4f7f8' ([System.Drawing.FontStyle]::Bold)
  Text 'PROOF | ACTION | COORDINATION | TRACKING' 68 44 6.8 '#82919c' ([System.Drawing.FontStyle]::Regular) 'Consolas'

  $statusPath = RoundedRect 858 22 294 35 7
  $statusFill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(135, 12, 30, 31))
  $statusPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(70, 70, 223, 202)), 1
  $graphics.FillPath($statusFill, $statusPath); $graphics.DrawPath($statusPen, $statusPath)
  $statusDot = New-Object System.Drawing.SolidBrush (Color '#46dfca')
  $graphics.FillEllipse($statusDot, 876, 36, 6, 6)
  Text 'SYNTHETIC BUSINESS TWIN | GOVERNANCE ONLINE' 891 32 7.1 '#65e7d4' ([System.Drawing.FontStyle]::Regular) 'Consolas'
  $statusPath.Dispose(); $statusFill.Dispose(); $statusPen.Dispose(); $statusDot.Dispose()

  Text 'ENTERPRISE OUTCOME OPERATING SYSTEM' 47 91 8 '#56dfcd' ([System.Drawing.FontStyle]::Regular) 'Consolas'
  Text 'AI accountable for the' 44 116 32 '#f4f7f8' ([System.Drawing.FontStyle]::Bold)
  Text 'business outcome--not just the answer.' 44 158 32 '#f4f7f8' ([System.Drawing.FontStyle]::Bold)
  Text 'One governed loop from disputed signal to human-authorized action,' 47 222 12.5 '#a9b5bd'
  Text 'measured result, and organizational learning.' 47 246 12.5 '#a9b5bd'

  Panel 866 91 286 176 16
  $ringPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(85, 70, 223, 202)), 1
  $graphics.DrawEllipse($ringPen, 944, 112, 130, 130)
  $ringPen.Dispose()
  Text 'NORTHSTAR OUTCOME' 961 137 7 '#56dfcd' ([System.Drawing.FontStyle]::Regular) 'Consolas'
  Text '96.1%' 966 158 30 '#f4f7f8' ([System.Drawing.FontStyle]::Regular) 'Consolas'
  Text 'observed synthetic' 975 207 8.5 '#aeb9c0'

  $cardX = @(47, 321, 595, 869)
  $numbers = @('01', '02', '03', '04')
  $titles = @('Prove the signal', 'GPT-5.6 challenges', 'Human authorizes', 'Measure the outcome')
  $lineOne = @('Independent evidence before', 'Separate Auditor changes', 'Conditions, cost, owners,', 'Observed result stays separate')
  $lineTwo = @('organizational action.', 'decision readiness.', 'and risk stay visible.', 'from projection.')
  for ($index = 0; $index -lt 4; $index += 1) {
    Panel $cardX[$index] 307 240 130 10
    $badge = RoundedRect ($cardX[$index] + 16) 324 28 25 6
    $badgeFill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(25, 70, 223, 202))
    $badgeStroke = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(70, 70, 223, 202)), 1
    $graphics.FillPath($badgeFill, $badge); $graphics.DrawPath($badgeStroke, $badge)
    Text $numbers[$index] ($cardX[$index] + 22) 331 7 '#58e0ce' ([System.Drawing.FontStyle]::Regular) 'Consolas'
    Text $titles[$index] ($cardX[$index] + 16) 356 11.5 '#f4f7f8' ([System.Drawing.FontStyle]::Bold)
    Text $lineOne[$index] ($cardX[$index] + 16) 384 8.3 '#7f909b'
    Text $lineTwo[$index] ($cardX[$index] + 16) 400 8.3 '#7f909b'
    $badge.Dispose(); $badgeFill.Dispose(); $badgeStroke.Dispose()
    if ($index -lt 3) { Text '>' ($cardX[$index] + 248) 355 16 '#3a6563' }
  }

  $chips = @('OPENAI AGENTS SDK', 'CODEX PLUGIN', '15 GOVERNED MCP TOOLS', '38 TESTS')
  $chipX = 47
  foreach ($chip in $chips) {
    $chipWidth = 20 + ($chip.Length * 6.3)
    $chipPath = RoundedRect $chipX 482 $chipWidth 31 5
    $chipFill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(175, 8, 14, 20))
    $chipPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(65, 104, 132, 146)), 1
    $graphics.FillPath($chipFill, $chipPath); $graphics.DrawPath($chipPen, $chipPath)
    Text $chip ($chipX + 10) 492 6.6 '#aab5bc' ([System.Drawing.FontStyle]::Regular) 'Consolas'
    $chipX += $chipWidth + 9
    $chipPath.Dispose(); $chipFill.Dispose(); $chipPen.Dispose()
  }

  Text 'THE UNIT OF WORK IS AN OUTCOME--NOT A CHAT, ANSWER, OR TASK.' 47 550 8 '#56dfcd' ([System.Drawing.FontStyle]::Regular) 'Consolas'
  Text 'HUMAN AUTHORITY | DETERMINISTIC CONTROLS' 841 550 7.2 '#56dfcd' ([System.Drawing.FontStyle]::Regular) 'Consolas'
  Text 'PACT | BUILD WEEK 2026' 47 585 6.8 '#64727c' ([System.Drawing.FontStyle]::Regular) 'Consolas'

  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Save($submissionPath, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output "Generated $outputPath and $submissionPath (1200x630)"
}
finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}
