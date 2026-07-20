param(
  [string]$FfmpegPath = "C:\tmp\pact-video\node_modules\@ffmpeg-installer\win32-x64\ffmpeg.exe",
  [string]$OutputPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$imageDirectory = Join-Path $repoRoot "submission-assets\screenshots"
$videoDirectory = Join-Path $repoRoot "submission-assets\video"
$workDirectory = Join-Path $videoDirectory "work"

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $videoDirectory "pact-openai-build-week-demo.mp4"
}

if (-not (Test-Path -LiteralPath $FfmpegPath)) {
  throw "FFmpeg was not found at $FfmpegPath. Install @ffmpeg-installer/ffmpeg under C:\tmp\pact-video first."
}

New-Item -ItemType Directory -Force -Path $videoDirectory, $workDirectory | Out-Null

$scenes = @(
  [pscustomobject]@{
    File = "10-mission-control.png"
    Narration = "This is PACT, an Enterprise Outcome Operating System. Operation Northstar begins with one critical signal that may threaten eight point seven million dollars of committed revenue. PACT does not jump from an alert to a recommendation. It opens a governed investigation and refuses to call the signal material until evidence reproduces the risk."
  },
  [pscustomobject]@{
    File = "30-proofline-verification.png"
    Narration = "Seven synthetic evidence feeds converge on the delayed material. The ERP reports eight point one days of inventory coverage. Proofline removes quality-held, allocated, and incompatible stock, then applies current consumption. Ten deterministic controls reproduce only five point four usable days. The signal is now verified before recovery planning begins."
  },
  [pscustomobject]@{
    File = "20-plant-digital-twin.png"
    Narration = "The verified shortage is not another KPI card. PACT traces Copper Alloy C seventeen through the heat-exchanger cell, Line C, three manufacturing shifts, three hundred eighteen customer orders, forty-two strategic customers, and eight point seven million dollars of exposure. The operating twin makes the physical and commercial consequence visible to every team."
  },
  [pscustomobject]@{
    File = "40-independent-audit.png"
    Narration = "Codex helped build PACT's contracts, domain engine, interface, MCP safeguards, and sixty-test release chain. At runtime, GPT five point six is used only where model judgment matters. An Outcome Lead compares bounded recovery strategies. Deterministic code rejects Speed First on cost and Cost First on target. A separate Auditor receives an immutable evidence packet and challenges quality, customs, labor, compressor, and contingency risk. Response and trace identifiers remain visible. The result is decision-ready with five conditions, not approval, and neither agent has business tools."
  },
  [pscustomobject]@{
    File = "50-blocked-quality-guard.png"
    Narration = "Only the Plant Chief Operating Officer and Finance delegate can authorize the bounded plan. Human approval is meaningful, but it is not blanket autonomy. PACT deliberately attempts a supplier commitment too early. The deterministic tool rejects it because the required quality authorization is missing. Authority is not readiness. Evidence, policy, budget, approved suppliers, and completed predecessors still govern every material action."
  },
  [pscustomobject]@{
    File = "60-outcome-closeout.png"
    Narration = "After Quality and Finance satisfy the gates, ten commitments across eight functions execute in dependency order. Customer communication remains draft-only. The synthetic twin moves from five point four to nine point eight coverage days. On day twenty-one, PACT records ninety-six point one percent observed synthetic revenue protection against a ninety-five percent target, at three hundred eighty-nine thousand dollars against a four hundred twenty thousand dollar ceiling. No quality incident and no unauthorized communication occurred. The ledger preserves the complete evidence-to-outcome chain for replay and learning."
  }
)

foreach ($scene in $scenes) {
  $imagePath = Join-Path $imageDirectory $scene.File
  if (-not (Test-Path -LiteralPath $imagePath)) {
    throw "Required gallery image is missing: $imagePath"
  }
}

Add-Type -AssemblyName System.Speech

function Get-WavDurationSeconds {
  param([Parameter(Mandatory = $true)][string]$Path)

  $bytes = [System.IO.File]::ReadAllBytes($Path)
  if ($bytes.Length -lt 44) { throw "Invalid WAV file: $Path" }

  $position = 12
  $byteRate = 0
  $dataSize = 0
  while ($position + 8 -le $bytes.Length) {
    $chunkId = [System.Text.Encoding]::ASCII.GetString($bytes, $position, 4)
    $chunkSize = [System.BitConverter]::ToInt32($bytes, $position + 4)
    if ($chunkId -eq "fmt ") {
      $byteRate = [System.BitConverter]::ToInt32($bytes, $position + 16)
    }
    if ($chunkId -eq "data") {
      $dataSize = $chunkSize
      break
    }
    $position += 8 + $chunkSize + ($chunkSize % 2)
  }

  if ($byteRate -le 0 -or $dataSize -le 0) {
    throw "Could not determine WAV duration: $Path"
  }
  return $dataSize / $byteRate
}

$voiceRate = -1
$totalAudioSeconds = 0.0
do {
  $totalAudioSeconds = 0.0
  $sceneIndex = 0
  foreach ($scene in $scenes) {
    $sceneIndex++
    $wavPath = Join-Path $workDirectory ("scene-{0:D2}.wav" -f $sceneIndex)
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    try {
      $synth.SelectVoice("Microsoft David Desktop")
      $synth.Rate = $voiceRate
      $synth.Volume = 100
      $synth.SetOutputToWaveFile($wavPath)
      $synth.Speak($scene.Narration)
    } finally {
      $synth.Dispose()
    }
    $audioSeconds = Get-WavDurationSeconds -Path $wavPath
    $scene | Add-Member -Force -NotePropertyName WavPath -NotePropertyValue $wavPath
    $scene | Add-Member -Force -NotePropertyName AudioSeconds -NotePropertyValue $audioSeconds
    $totalAudioSeconds += $audioSeconds
  }

  if ($totalAudioSeconds -gt 170 -and $voiceRate -lt 2) {
    $voiceRate++
    continue
  }
  if ($totalAudioSeconds -lt 142 -and $voiceRate -gt -3) {
    $voiceRate--
    continue
  }
  break
} while ($true)

$sceneFiles = @()
$totalVideoSeconds = 0
$sceneIndex = 0
foreach ($scene in $scenes) {
  $sceneIndex++
  $imagePath = Join-Path $imageDirectory $scene.File
  $scenePath = Join-Path $workDirectory ("scene-{0:D2}.mp4" -f $sceneIndex)
  $duration = [Math]::Ceiling($scene.AudioSeconds + 1.0)
  $frameCount = $duration * 30
  $fadeOutStart = $duration - 0.3
  $totalVideoSeconds += $duration

  $videoFilter = "[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x03111A,zoompan=z='min(zoom+0.00015,1.025)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frameCount}:s=1920x1080:fps=30,fade=t=in:st=0:d=0.3,fade=t=out:st=${fadeOutStart}:d=0.3,format=yuv420p[v];[1:a]apad[a]"

  $ffmpegArguments = @(
    "-y",
    "-i", $imagePath,
    "-i", $scene.WavPath,
    "-filter_complex", $videoFilter,
    "-map", "[v]",
    "-map", "[a]",
    "-t", ([string]$duration),
    "-r", "30",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "18",
    "-c:a", "aac",
    "-b:a", "160k",
    "-movflags", "+faststart",
    $scenePath
  )
  & $FfmpegPath @ffmpegArguments
  if ($LASTEXITCODE -ne 0) { throw "FFmpeg failed while rendering scene $sceneIndex." }
  $sceneFiles += $scenePath
}

if ($totalVideoSeconds -ge 180) {
  throw "Rendered duration would be $totalVideoSeconds seconds; the demo must remain under three minutes."
}

$concatPath = Join-Path $workDirectory "scenes.txt"
$concatLines = $sceneFiles | ForEach-Object { "file '$($_.Replace('\', '/'))'" }
[System.IO.File]::WriteAllLines($concatPath, $concatLines, (New-Object System.Text.UTF8Encoding($false)))

& $FfmpegPath -y -f concat -safe 0 -i $concatPath -c copy -movflags +faststart $OutputPath
if ($LASTEXITCODE -ne 0) { throw "FFmpeg failed while joining the final demo." }

$outputInfo = Get-Item -LiteralPath $OutputPath
[pscustomobject]@{
  Output = $outputInfo.FullName
  Bytes = $outputInfo.Length
  DurationSeconds = $totalVideoSeconds
  Voice = "Microsoft David Desktop"
  VoiceRate = $voiceRate
  Scenes = $scenes.Count
}
