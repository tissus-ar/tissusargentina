# Execute this script inside the folder that contains your downloaded "products" directory.
# It will create a "flat_images" directory alongside it and copy all images there,
# prefixing the filename with the product ID: "productId__filename.ext"

$SourceDir = "products"
$DestDir = "flat_images"

if (-not (Test-Path $SourceDir)) {
    Write-Error "No se encontro la carpeta 'products'. Asegurate de descargarla con Cyberduck en este mismo directorio."
    exit
}

New-Item -ItemType Directory -Force -Path $DestDir | Out-Null

Get-ChildItem -Path $SourceDir -Recurse -File | ForEach-Object {
    $ProductId = $_.Directory.Name
    $NewName = "${ProductId}__$($_.Name)"
    Copy-Item -Path $_.FullName -Destination (Join-Path $DestDir $NewName) -Force
}

Write-Host "Completado! Todas las fotos fueron aplanadas en '$DestDir' con el prefijo '[ID]__'"
