# Execute this script after editing the images in the "flat_images" folder.
# It will read the prefix "[ID]__" from each file, recreate the original "products_edited/[ID]" folder structure,
# and save the images with their original filenames.

$SourceDir = "flat_images"
$DestDir = "products_edited"

if (-not (Test-Path $SourceDir)) {
    Write-Error "No se encontro la carpeta '$SourceDir' con las imagenes editadas."
    exit
}

New-Item -ItemType Directory -Force -Path $DestDir | Out-Null

Get-ChildItem -Path $SourceDir -File | ForEach-Object {
    if ($_.Name -match '^(.+?)__(.+)$') {
        $ProductId = $Matches[1]
        $FileName = $Matches[2]
        
        $ProdDir = New-Item -ItemType Directory -Force -Path (Join-Path $DestDir $ProductId)
        Copy-Item -Path $_.FullName -Destination (Join-Path $ProdDir $FileName) -Force
    }
}

Write-Host "Completado! Las imagenes se han re-organizado en '$DestDir'. Ahora puedes arrastrar esta carpeta a Cyberduck para sobreescribir las imagenes originales."
