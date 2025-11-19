$API_URL = "http://localhost:3000/api/v1"
$EMAIL = "user@example.com"
$PASSWORD = "password123"

Write-Host "=== Testing Course Enrollment & Payment API ===" -ForegroundColor Green
Write-Host ""

Write-Host "1. Login..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body (@{
    email = $EMAIL
    password = $PASSWORD
} | ConvertTo-Json) -ContentType "application/json"

if ($loginResponse.success) {
    $TOKEN = $loginResponse.data.token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "Token: $($TOKEN.Substring(0, 20))..." -ForegroundColor Gray
} else {
    Write-Host "✗ Login failed" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

Write-Host ""
Write-Host "2. Try enrolling in FREE course (ID: 1)..." -ForegroundColor Yellow
try {
    $enrollFree = Invoke-RestMethod -Uri "$API_URL/course-enrollments/1/enroll" -Method Post -Headers $headers
    Write-Host "✓ Enrolled in free course" -ForegroundColor Green
    Write-Host "Enrollment ID: $($enrollFree.data.id)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "ℹ Already enrolled" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "3. Try enrolling in PAID course (ID: 4)..." -ForegroundColor Yellow
try {
    $enrollPaid = Invoke-RestMethod -Uri "$API_URL/course-enrollments/4/enroll" -Method Post -Headers $headers
    Write-Host "✗ Should require payment!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 402) {
        Write-Host "✓ Correctly requires payment (402)" -ForegroundColor Green
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Course: $($errorResponse.data.courseTitle)" -ForegroundColor Gray
        Write-Host "Price: $($errorResponse.data.price)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Unexpected error: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "4. Get active coupons..." -ForegroundColor Yellow
try {
    $coupons = Invoke-RestMethod -Uri "$API_URL/payments/coupons/active" -Method Get -Headers $headers
    Write-Host "✓ Found $($coupons.data.Count) active coupons" -ForegroundColor Green
    foreach ($coupon in $coupons.data) {
        Write-Host "  - $($coupon.code): $($coupon.description)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. Validate coupon WELCOME50..." -ForegroundColor Yellow
try {
    $validateCoupon = Invoke-RestMethod -Uri "$API_URL/payments/coupons/WELCOME50/validate?courseId=4&amount=299000" -Method Get -Headers $headers
    Write-Host "✓ Coupon is valid" -ForegroundColor Green
    Write-Host "Discount: $($validateCoupon.data.discountAmount)" -ForegroundColor Gray
    Write-Host "Final Amount: $($validateCoupon.data.finalAmount)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "6. Create payment intent for course 4..." -ForegroundColor Yellow
try {
    $paymentIntent = Invoke-RestMethod -Uri "$API_URL/payments/courses/4/payment-intent" -Method Post -Headers $headers -Body (@{
        couponCode = "WELCOME50"
    } | ConvertTo-Json)
    Write-Host "✓ Payment intent created" -ForegroundColor Green
    Write-Host "Original: $($paymentIntent.data.originalAmount)" -ForegroundColor Gray
    Write-Host "Discount: $($paymentIntent.data.discountAmount)" -ForegroundColor Gray
    Write-Host "Final: $($paymentIntent.data.finalAmount)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "ℹ $($errorResponse.message)" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "7. Process payment for course 4..." -ForegroundColor Yellow
try {
    $processPayment = Invoke-RestMethod -Uri "$API_URL/payments/courses/4/process-payment" -Method Post -Headers $headers -Body (@{
        paymentMethod = "vnpay"
        couponCode = "WELCOME50"
    } | ConvertTo-Json)
    Write-Host "✓ Payment successful!" -ForegroundColor Green
    Write-Host "Transaction ID: $($processPayment.data.payment.transactionId)" -ForegroundColor Gray
    Write-Host "Enrollment ID: $($processPayment.data.enrollment.id)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "ℹ $($errorResponse.message)" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "8. Get my enrollments..." -ForegroundColor Yellow
try {
    $myEnrollments = Invoke-RestMethod -Uri "$API_URL/course-enrollments/my-enrollments" -Method Get -Headers $headers
    Write-Host "✓ Found $($myEnrollments.data.Count) enrollments" -ForegroundColor Green
    foreach ($enrollment in $myEnrollments.data) {
        Write-Host "  - Course: $($enrollment.Course.title) | Type: $($enrollment.enrollment_type) | Progress: $($enrollment.progress)%" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "9. Get my payments..." -ForegroundColor Yellow
try {
    $myPayments = Invoke-RestMethod -Uri "$API_URL/payments/my-payments" -Method Get -Headers $headers
    Write-Host "✓ Found $($myPayments.data.Count) payments" -ForegroundColor Green
    foreach ($payment in $myPayments.data) {
        Write-Host "  - Amount: $($payment.amount) | Status: $($payment.payment_status) | Course: $($payment.Course.title)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Green
