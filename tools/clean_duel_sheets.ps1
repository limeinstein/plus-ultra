param(
  [string]$Root = (Join-Path $PSScriptRoot '..\images\duel\fighters')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$resolved = (Resolve-Path -LiteralPath $Root).Path
$expected = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\images\duel\fighters')).Path
if ($resolved -ne $expected) { throw "일기토 전투원 폴더만 정리할 수 있습니다: $resolved" }

$emptyCells = @(
  @(4, 1), @(5, 1),
  @(3, 2), @(4, 2), @(5, 2)
)

Get-ChildItem -LiteralPath $resolved -Filter '*.png' -File | ForEach-Object {
  $bitmap = [System.Drawing.Bitmap]::new($_.FullName)
  if ($bitmap.Width -ne 1536 -or $bitmap.Height -ne 1024) {
    $bitmap.Dispose()
    throw "시트 크기가 1536×1024가 아닙니다: $($_.FullName)"
  }
  $copy = [System.Drawing.Bitmap]::new($bitmap.Width, $bitmap.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($copy)
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $g.DrawImageUnscaled($bitmap, 0, 0)
  $clear = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::Transparent)
  foreach ($cell in $emptyCells) {
    $g.FillRectangle($clear, $cell[0] * 256, $cell[1] * 256, 256, 256)
  }
  $clear.Dispose(); $g.Dispose(); $bitmap.Dispose()

  $tmp = Join-Path $_.DirectoryName ($_.BaseName + '.clean.png')
  $stream = [System.IO.MemoryStream]::new()
  $copy.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  $copy.Dispose()
  [System.IO.File]::WriteAllBytes($tmp, $stream.ToArray())
  $stream.Dispose()
  Move-Item -LiteralPath $tmp -Destination $_.FullName -Force
  Write-Output "정리: $($_.Name)"
}
