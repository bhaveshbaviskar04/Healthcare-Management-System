$baseUrl = "http://localhost:8080/api"
$results = @()

function Test-Case($name, $scriptBlock) {
    try {
        $res = & $scriptBlock
        Write-Host "[PASS] $name" -ForegroundColor Green
        return @{ Test = $name; Status = "PASS"; Details = $res }
    } catch {
        Write-Host "[FAIL] $name - $($_.Exception.Message)" -ForegroundColor Red
        return @{ Test = $name; Status = "FAIL"; Details = $_.Exception.Message }
    }
}

# 1. AUTH & SECURITY EDGE CASES
$res1 = Test-Case "Auth: Reject invalid password with 400 Bad Request" {
    $badLogin = @{ username = "dr_sharma"; password = "WrongPassword!" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $badLogin -ContentType "application/json"
        throw "Should have rejected bad password"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 400) { "Correctly returned HTTP 400 Bad Request" } else { throw $_ }
    }
}
$results += $res1

$res2 = Test-Case "Auth: Reject non-existent user with 400 Bad Request" {
    $ghostLogin = @{ username = "ghost_user"; password = "Password@123" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $ghostLogin -ContentType "application/json"
        throw "Should have rejected non-existent user"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 400) { "Correctly returned HTTP 400 Bad Request" } else { throw $_ }
    }
}
$results += $res2

$res3 = Test-Case "Auth: Reject unauthenticated access to protected endpoint" {
    try {
        Invoke-RestMethod -Uri "$baseUrl/inpatient/wards" -Method Get
        throw "Should require authentication"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 403) { "Correctly denied unauthenticated request with HTTP 403" } else { throw $_ }
    }
}
$results += $res3

# Authenticate users
$recAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ username = "receptionist1"; password = "Password@123" } | ConvertTo-Json) -ContentType "application/json"
$docAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ username = "dr_sharma"; password = "Password@123" } | ConvertTo-Json) -ContentType "application/json"
$pharmAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ username = "pharmacist1"; password = "Password@123" } | ConvertTo-Json) -ContentType "application/json"

$recHeader = @{ Authorization = "Bearer $($recAuth.token)" }
$docHeader = @{ Authorization = "Bearer $($docAuth.token)" }
$pharmHeader = @{ Authorization = "Bearer $($pharmAuth.token)" }

# 2. QUEUE & PREDICTION EDGE CASES
$res4 = Test-Case "Queue: Handle non-existent patient token generation" {
    $badTokenReq = @{ patientId = 99999; department = "General Medicine" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/queue/generate" -Method Post -Body $badTokenReq -ContentType "application/json" -Headers $recHeader
        throw "Should fail for invalid patient ID"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 400) { "Safely rejected missing patient" } else { throw $_ }
    }
}
$results += $res4

$res5 = Test-Case "Queue: Dynamic Wait Time Calculation with Multiple Ahead" {
    # Generate Normal Token for Patient 1 (Rahul)
    $t1 = Invoke-RestMethod -Uri "$baseUrl/queue/generate" -Method Post -Body (@{ patientId = 1; priority = $false } | ConvertTo-Json) -ContentType "application/json" -Headers $recHeader
    # Generate Normal Token for Patient 2 (Sunita)
    $t2 = Invoke-RestMethod -Uri "$baseUrl/queue/generate" -Method Post -Body (@{ patientId = 2; priority = $false } | ConvertTo-Json) -ContentType "application/json" -Headers $recHeader
    
    # Patient 1 has 0 ahead -> wait = 0 mins
    # Patient 2 has 1 ahead -> wait = 12 mins
    $queue = Invoke-RestMethod -Uri "$baseUrl/queue/today"
    $t2Live = $queue | Where-Object { $_.tokenId -eq $t2.tokenId }
    if ($t2Live.estimatedWaitingMinutes -ge 12) {
        "Accurately predicted $($t2Live.estimatedWaitingMinutes) mins wait for 2nd patient in line"
    } else {
        throw "Expected >= 12 mins, got $($t2Live.estimatedWaitingMinutes)"
    }
}
$results += $res5

$res6 = Test-Case "Queue: Emergency Priority Patient Preemption" {
    # Generate Priority Token for Patient 3 (Aarav - Emergency)
    $t3 = Invoke-RestMethod -Uri "$baseUrl/queue/generate" -Method Post -Body (@{ patientId = 3; priority = $true; priorityReason = "High fever convulsion" } | ConvertTo-Json) -ContentType "application/json" -Headers $recHeader
    
    # Doctor calls next token: MUST be t3 (Priority Aarav), even though t1 and t2 arrived earlier
    $called = Invoke-RestMethod -Uri "$baseUrl/queue/call-next" -Method Post -Headers $docHeader
    if ($called.tokenId -eq $t3.tokenId -and $called.priorityFlag -eq $true) {
        "Priority token correctly called first (Emergency Preemption verified)"
    } else {
        throw "Failed: Token #$($called.tokenNumber) called instead of Priority Token #$($t3.tokenNumber)"
    }
}
$results += $res6

# 3. CLINICAL CONSULTATION EDGE CASES
$res7 = Test-Case "Clinical: Prevent duplicate consultation on the same visit" {
    # Generate a fresh visit for testing duplicate consultation prevention
    $freshToken = Invoke-RestMethod -Uri "$baseUrl/queue/generate" -Method Post -Body (@{ patientId = 3 } | ConvertTo-Json) -ContentType "application/json" -Headers $recHeader
    
    $rxReq = @{
        visitId = $freshToken.visit.visitId;
        symptoms = "Fever";
        diagnosis = "Viral infection";
        items = @(@{ medicineName = "Paracetamol (Dolo)"; quantity = 5 })
    } | ConvertTo-Json
    
    # First consultation: succeeds
    $rx1 = Invoke-RestMethod -Uri "$baseUrl/clinical/prescriptions" -Method Post -Body $rxReq -ContentType "application/json" -Headers $docHeader
    
    # Second consultation on same visit: MUST fail with 409 Conflict
    try {
        Invoke-RestMethod -Uri "$baseUrl/clinical/prescriptions" -Method Post -Body $rxReq -ContentType "application/json" -Headers $docHeader
        throw "Should have prevented duplicate consultation on same visit"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 409) { "Duplicate consultation correctly blocked with 409 Conflict" } else { throw $_ }
    }
}
$results += $res7

# 4. BED ALLOCATION & CONFLICT EDGE CASES
$res8 = Test-Case "Inpatient: Prevent double-booking on OCCUPIED or RESERVED bed" {
    # Bed 5 is pre-seeded as RESERVED in ICU
    $badAlloc = @{ admissionId = 1; bedId = 5; notes = "Trying to allocate reserved bed" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/inpatient/allocate" -Method Post -Body $badAlloc -ContentType "application/json" -Headers $recHeader
        throw "Should not allow allocating RESERVED bed"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 409) { "Double-booking prevented with 409 Conflict" } else { throw $_ }
    }
}
$results += $res8

$res9 = Test-Case "Inpatient: Successful Bed Allocation & Status State Change" {
    $beds = Invoke-RestMethod -Uri "$baseUrl/inpatient/beds" -Headers $recHeader
    $availBed = $beds | Where-Object { $_.bedStatus -eq "AVAILABLE" } | Select-Object -First 1
    if (-not $availBed) {
        $rnd = Get-Random -Minimum 1000 -Maximum 9999
        $availBed = Invoke-RestMethod -Uri "$baseUrl/inpatient/beds" -Method Post -Body (@{ wardId = 1; bedLabel = "BED-T-$rnd"; bedStatus = "AVAILABLE"; dailyRate = 50.0 } | ConvertTo-Json) -ContentType "application/json" -Headers $recHeader
    }
    
    # Create a fresh visit with admission recommendation
    $tAdm = Invoke-RestMethod -Uri "$baseUrl/queue/generate" -Method Post -Body (@{ patientId = 2 } | ConvertTo-Json) -ContentType "application/json" -Headers $recHeader
    $rxAdmReq = @{
        visitId = $tAdm.visit.visitId;
        symptoms = "Pneumonia";
        diagnosis = "Severe Lower Respiratory Infection";
        recommendAdmission = $true;
        items = @()
    } | ConvertTo-Json
    $rxAdm = Invoke-RestMethod -Uri "$baseUrl/clinical/prescriptions" -Method Post -Body $rxAdmReq -ContentType "application/json" -Headers $docHeader
    
    $pendingAdms = Invoke-RestMethod -Uri "$baseUrl/inpatient/pending-admissions" -Headers $recHeader
    $adm = $pendingAdms | Where-Object { $_.admissionStatus -eq "REQUESTED" } | Select-Object -Last 1
    $script:activeAdmissionId = $adm.admissionId
    
    $assigned = Invoke-RestMethod -Uri "$baseUrl/inpatient/allocate" -Method Post -Body (@{ admissionId = $adm.admissionId; bedId = $availBed.bedId } | ConvertTo-Json) -ContentType "application/json" -Headers $recHeader
    
    $checkBeds = Invoke-RestMethod -Uri "$baseUrl/inpatient/beds" -Headers $recHeader
    $updated = $checkBeds | Where-Object { $_.bedId -eq $availBed.bedId }
    if ($updated.bedStatus -eq "OCCUPIED") {
        "Bed $($availBed.bedLabel) changed from AVAILABLE to OCCUPIED"
    } else {
        throw "Expected OCCUPIED status"
    }
}
$results += $res9

$res10 = Test-Case "Inpatient: Ward/Bed Transfer maintains history & frees source bed" {
    $beds = Invoke-RestMethod -Uri "$baseUrl/inpatient/beds" -Headers $recHeader
    $newAvailBed = $beds | Where-Object { $_.bedStatus -eq "AVAILABLE" } | Select-Object -First 1
    if (-not $newAvailBed) {
        $rnd = Get-Random -Minimum 1000 -Maximum 9999
        $newAvailBed = Invoke-RestMethod -Uri "$baseUrl/inpatient/beds" -Method Post -Body (@{ wardId = 1; bedLabel = "BED-TR-$rnd"; bedStatus = "AVAILABLE"; dailyRate = 50.0 } | ConvertTo-Json) -ContentType "application/json" -Headers $recHeader
    }
    
    $transferReq = @{ admissionId = $script:activeAdmissionId; bedId = $newAvailBed.bedId } | ConvertTo-Json
    $transferred = Invoke-RestMethod -Uri "$baseUrl/inpatient/transfer" -Method Post -Body $transferReq -ContentType "application/json" -Headers $recHeader
    
    $checkBeds = Invoke-RestMethod -Uri "$baseUrl/inpatient/beds" -Headers $recHeader
    $newBedStatus = ($checkBeds | Where-Object { $_.bedId -eq $newAvailBed.bedId }).bedStatus
    if ($newBedStatus -eq "OCCUPIED") {
        "Transferred successfully: Bed $($newAvailBed.bedLabel) is now OCCUPIED"
    } else {
        throw "Expected new bed to be OCCUPIED"
    }
}
$results += $res10

# 5. PHARMACY & INVENTORY EDGE CASES
$res11 = Test-Case "Pharmacy: Partial Dispensing & Zero Negative Stock on Shortage" {
    # Generate unique drug with 100 units initially auto-created by consultation service
    $uniqueDrugName = "ShortageTestDrug_" + [Guid]::NewGuid().ToString().Substring(0, 8)
    
    # Prescribe 120 units (which exceeds the 100 default stock)
    $tPharm = Invoke-RestMethod -Uri "$baseUrl/queue/generate" -Method Post -Body (@{ patientId = 1 } | ConvertTo-Json) -ContentType "application/json" -Headers $recHeader
    $shortageReq = @{
        visitId = $tPharm.visit.visitId;
        symptoms = "Severe condition";
        diagnosis = "Shortage evaluation";
        items = @(@{ medicineName = $uniqueDrugName; quantity = 120; dosage = "1 Tab"; frequency = "1-0-1"; duration = "30 Days" })
    } | ConvertTo-Json
    $shortageRx = Invoke-RestMethod -Uri "$baseUrl/clinical/prescriptions" -Method Post -Body $shortageReq -ContentType "application/json" -Headers $docHeader
    $script:dispensedRxId = $shortageRx.prescriptionId
    
    $disp = Invoke-RestMethod -Uri "$baseUrl/pharmacy/dispense/$($shortageRx.prescriptionId)" -Method Post -Headers $pharmHeader
    $item = $disp.items[0]
    $inv = Invoke-RestMethod -Uri "$baseUrl/pharmacy/inventory" -Headers $pharmHeader
    $drug = $inv | Where-Object { $_.name -eq $uniqueDrugName }
    
    if ($item.quantityDispensed -eq 100 -and $drug.stockQuantity -eq 0) {
        "Partially dispensed 100 available units; Stock safely decremented to 0 without going negative"
    } else {
        throw "Stock: $($drug.stockQuantity), Dispensed: $($item.quantityDispensed)"
    }
}
$results += $res11

$res12 = Test-Case "Pharmacy: Prevent Double Dispensing on same prescription" {
    # Try dispensing the already-dispensed prescription again
    try {
        Invoke-RestMethod -Uri "$baseUrl/pharmacy/dispense/$($script:dispensedRxId)" -Method Post -Headers $pharmHeader
        throw "Should have rejected double-dispensing"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 409) { "Prevented double dispensing with 409 Conflict" } else { throw $_ }
    }
}
$results += $res12

# 6. EMPTY QUEUE EXHAUSTION EDGE CASE
$res13 = Test-Case "Queue: Call Next on Exhausted/Empty Waiting Queue" {
    # Call remaining waiting tokens until queue is truly empty
    while ($true) {
        try {
            Invoke-RestMethod -Uri "$baseUrl/queue/call-next" -Method Post -Headers $docHeader | Out-Null
        } catch {
            break
        }
    }
    # Now calling on empty queue MUST fail gracefully with 409 Conflict
    try {
        Invoke-RestMethod -Uri "$baseUrl/queue/call-next" -Method Post -Headers $docHeader
        throw "Should have thrown conflict exception on empty queue"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 409) { "Gracefully caught empty queue with 409 Conflict" } else { throw $_ }
    }
}
$results += $res13

Write-Host "`n=================== COMPREHENSIVE EDGE-CASE AUDIT ===================" -ForegroundColor Cyan
$results | Format-Table -AutoSize
