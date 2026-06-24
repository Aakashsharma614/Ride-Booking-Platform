$ErrorActionPreference = 'Stop'
$dir = "dev/commits"
if (!(Test-Path -Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
for ($i = 1; $i -le 50; $i++) {
  $file = Join-Path $dir ("commit-$i.md")
  $content = "Commit number $i`nGenerated on $(Get-Date -Format o)`n"
  Set-Content -Path $file -Value $content -Encoding UTF8
  git add $file
  git commit -m "chore(commits): add commit $i"
  Write-Host "Committed $i"
}
Write-Host "Done: 50 commits created locally."
