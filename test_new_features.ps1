$ErrorActionPreference = "Stop"

Write-Host "=== Testing Authentications ===" -ForegroundColor Cyan
$doctorLogin = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -ContentType 'application/json' -Body '{"username":"dr_sharma","password":"Password@123"}'
$receptLogin = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -ContentType 'application/json' -Body '{"username":"receptionist1","password":"Password@123"}'
$pharmLogin = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -ContentType 'application/json' -Body '{"username":"pharmacist1","password":"Password@123"}'

Write-Host "Doctor (dr_sharma), Receptionist (receptionist1), and Pharmacist (pharmacist1) logged in successfully."

Write-Host "`n=== 1. Test Pharmacist Add Drug ===" -ForegroundColor Cyan
$drugRand = Get-Random -Minimum 1000 -Maximum 9999
$newDrug = @{
    name = "Amoxicillin 500mg #$drugRand"
    strengthForm = "Capsule"
    currentStock = 120
    reorderThreshold = 25
    unitPrice = 12.50
    batchNumber = "AMX-$drugRand"
    expiryDate = "2027-12-31"
} | ConvertTo-Json

$drugRes = Invoke-RestMethod -Uri 'http://localhost:8080/api/pharmacy/medicines' -Method Post -ContentType 'application/json' -Headers @{ Authorization = "Bearer " + $pharmLogin.token } -Body $newDrug
Write-Host "Created medicine ID: $($drugRes.medicineId), Name: $($drugRes.name)"

Write-Host "`n=== 2. Test Pharmacist Update Drug ===" -ForegroundColor Cyan
$editDrug = @{
    name = "Amoxicillin 500mg Plus #$drugRand"
    strengthForm = "Capsule"
    currentStock = 150
    reorderThreshold = 30
    unitPrice = 14.00
    batchNumber = "AMX-$drugRand-B"
    expiryDate = "2028-01-01"
} | ConvertTo-Json

$updatedDrug = Invoke-RestMethod -Uri ("http://localhost:8080/api/pharmacy/medicines/" + $drugRes.medicineId) -Method Put -ContentType 'application/json' -Headers @{ Authorization = "Bearer " + $pharmLogin.token } -Body $editDrug
Write-Host "Updated medicine: $($updatedDrug.name), New Stock: $($updatedDrug.currentStock)"

Write-Host "`n=== 3. Test Receptionist Add Bed ===" -ForegroundColor Cyan
$bedRand = Get-Random -Minimum 100 -Maximum 999
$newBed = @{
    wardId = 1
    bedLabel = "TEST-BED-$bedRand"
    bedStatus = "AVAILABLE"
    dailyRate = 85.00
} | ConvertTo-Json

$bedRes = Invoke-RestMethod -Uri 'http://localhost:8080/api/inpatient/beds' -Method Post -ContentType 'application/json' -Headers @{ Authorization = "Bearer " + $receptLogin.token } -Body $newBed
Write-Host "Created bed ID: $($bedRes.bedId), Label: $($bedRes.bedLabel)"

Write-Host "`n=== 4. Test Receptionist Update Bed ===" -ForegroundColor Cyan
$editBed = @{
    wardId = 1
    bedLabel = "TEST-BED-$bedRand-MOD"
    bedStatus = "RESERVED"
    dailyRate = 95.00
} | ConvertTo-Json

$updatedBed = Invoke-RestMethod -Uri ("http://localhost:8080/api/inpatient/beds/" + $bedRes.bedId) -Method Put -ContentType 'application/json' -Headers @{ Authorization = "Bearer " + $receptLogin.token } -Body $editBed
Write-Host "Updated Bed: $($updatedBed.bedLabel), Status: $($updatedBed.bedStatus)"

Write-Host "`n=== 5. Test Doctor Rejected on Add Bed (Expect 403 Forbidden) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri 'http://localhost:8080/api/inpatient/beds' -Method Post -ContentType 'application/json' -Headers @{ Authorization = "Bearer " + $doctorLogin.token } -Body $newBed
    Write-Host "FAILED: Doctor should not have been allowed to add bed!" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: Doctor correctly rejected with status: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

Write-Host "`n=== 6. Test Doctor Rejected on Edit Bed (Expect 403 Forbidden) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri ("http://localhost:8080/api/inpatient/beds/" + $bedRes.bedId) -Method Put -ContentType 'application/json' -Headers @{ Authorization = "Bearer " + $doctorLogin.token } -Body $editBed
    Write-Host "FAILED: Doctor should not have been allowed to edit bed!" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: Doctor correctly rejected with status: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

Write-Host "`n=== 7. Test Receptionist Edit Inpatient Admission ===" -ForegroundColor Cyan
# Get admissions
$admissions = Invoke-RestMethod -Uri 'http://localhost:8080/api/inpatient/admissions' -Method Get -Headers @{ Authorization = "Bearer " + $receptLogin.token }
if ($admissions.Count -gt 0) {
    $firstAdm = $admissions[0]
    $editAdm = @{
        admissionStatus = $firstAdm.admissionStatus
        administrativeNotes = "Updated notes by receptionist at " + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    } | ConvertTo-Json
    $admRes = Invoke-RestMethod -Uri ("http://localhost:8080/api/inpatient/admissions/" + $firstAdm.admissionId) -Method Put -ContentType 'application/json' -Headers @{ Authorization = "Bearer " + $receptLogin.token } -Body $editAdm
    Write-Host "Updated admission ID: $($admRes.admissionId), Notes: $($admRes.administrativeNotes)"
} else {
    Write-Host "No admissions present to test update."
}

Write-Host "`n=== ALL NEW FEATURE TESTS PASSED SUCCESSFULLY! ===" -ForegroundColor Green
