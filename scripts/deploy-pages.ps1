$ErrorActionPreference = 'Stop'

$repository = 'Xuea18/Xuea18.github.io'
$branch = 'main'
$distRoot = (Resolve-Path (Join-Path $PSScriptRoot '../dist')).Path

$credentialInput = "protocol=https`nhost=github.com`n`n"
$credentialLines = $credentialInput | git credential fill
$tokenLine = $credentialLines | Where-Object { $_ -like 'password=*' } | Select-Object -First 1
if (-not $tokenLine) { throw 'GitHub credential token is unavailable.' }
$token = $tokenLine.Substring('password='.Length)
$headers = @{
  Accept = 'application/vnd.github+json'
  Authorization = "Bearer $token"
  'X-GitHub-Api-Version' = '2022-11-28'
}
$api = "https://api.github.com/repos/$repository"

$ref = Invoke-RestMethod -Headers $headers -Uri "$api/git/ref/heads/$branch"
$expectedHead = $ref.object.sha
$commit = Invoke-RestMethod -Headers $headers -Uri "$api/git/commits/$expectedHead"
$baseTree = $commit.tree.sha
$existingTree = Invoke-RestMethod -Headers $headers -Uri "$api/git/trees/$baseTree`?recursive=1"

$treeElements = [System.Collections.Generic.List[object]]::new()
foreach ($entry in $existingTree.tree) {
  if ($entry.type -eq 'blob' -and $entry.path.StartsWith('b/')) {
    $treeElements.Add(@{ path = $entry.path; mode = '100644'; type = 'blob'; sha = $null })
  }
}

$files = Get-ChildItem -LiteralPath $distRoot -Recurse -File
$index = 0
foreach ($file in $files) {
  $index++
  $relative = $file.FullName.Substring($distRoot.Length).TrimStart('\','/').Replace('\','/')
  Write-Output "Uploading $index/$($files.Count): b/$relative"
  $content = [Convert]::ToBase64String([IO.File]::ReadAllBytes($file.FullName))
  $blobBody = @{ content = $content; encoding = 'base64' } | ConvertTo-Json -Compress
  $blob = Invoke-RestMethod -Method Post -Headers $headers -ContentType 'application/json' -Uri "$api/git/blobs" -Body $blobBody
  $treeElements.Add(@{ path = "b/$relative"; mode = '100644'; type = 'blob'; sha = $blob.sha })
}

$treeBody = @{ base_tree = $baseTree; tree = $treeElements } | ConvertTo-Json -Depth 6 -Compress
$newTree = Invoke-RestMethod -Method Post -Headers $headers -ContentType 'application/json' -Uri "$api/git/trees" -Body $treeBody
$commitBody = @{ message = 'Deploy updated Rites Part 5 experience'; tree = $newTree.sha; parents = @($expectedHead) } | ConvertTo-Json -Depth 4 -Compress
$newCommit = Invoke-RestMethod -Method Post -Headers $headers -ContentType 'application/json' -Uri "$api/git/commits" -Body $commitBody

$currentRef = Invoke-RestMethod -Headers $headers -Uri "$api/git/ref/heads/$branch"
if ($currentRef.object.sha -ne $expectedHead) { throw 'The Pages branch changed during deployment; nothing was published.' }
$refBody = @{ sha = $newCommit.sha; force = $false } | ConvertTo-Json -Compress
Invoke-RestMethod -Method Patch -Headers $headers -ContentType 'application/json' -Uri "$api/git/refs/heads/$branch" -Body $refBody | Out-Null
Write-Output "Published commit: $($newCommit.sha)"
