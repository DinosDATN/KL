# Course Enrollment & Payment API

## Enrollment APIs

### 1. Enroll in Course (Free or Check Payment)
```
POST /api/v1/course-enrollments/:courseId/enroll
Authorization: Bearer <token>
```

**Response (Free Course):**
```json
{
  "success": true,
  "message": "Successfully enrolled in course",
  "data": {
    "id": 1,
    "user_id": 123,
    "course_id": 456,
    "enrollment_type": "free",
    "progress": 0,
    "status": "not-started"
  }
}
```

**Response (Paid Course - 402):**
```json
{
  "success": false,
  "message": "This is a paid course. Payment required.",
  "requiresPayment": true,
  "data": {
    "courseId": 456,
    "courseTitle": "Advanced JavaScript",
    "price": 500000,
    "originalPrice": 1000000,
    "discount": 50
  }
}
```

### 2. Get My Enrollments
```
GET /api/v1/course-enrollments/my-enrollments?status=in-progress
Authorization: Bearer <token>
```

### 3. Check Enrollment Status
```
GET /api/v1/course-enrollments/:courseId/check
Authorization: Bearer <token>
```

### 4. Get Course Progress
```
GET /api/v1/course-enrollments/:courseId/progress
Authorization: Bearer <token>
```

### 5. Complete Lesson
```
POST /api/v1/course-enrollments/:courseId/lessons/:lessonId/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "timeSpent": 300
}
```

### 6. Get Learning Dashboard
```
GET /api/v1/course-enrollments/dashboard
Authorization: Bearer <token>
```

## Payment APIs

### 1. Create Payment Intent
```
POST /api/v1/payments/courses/:courseId/payment-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "couponCode": "WELCOME50"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "courseId": 1,
    "courseTitle": "JavaScript Fundamentals",
    "originalAmount": 500000,
    "discountAmount": 250000,
    "finalAmount": 250000,
    "coupon": {
      "code": "WELCOME50",
      "description": "Giảm 50% cho khóa học đầu tiên"
    }
  }
}
```

### 2. Process Payment
```
POST /api/v1/payments/courses/:courseId/process-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "vnpay",
  "couponCode": "WELCOME50"
}
```

**Payment Methods:**
- credit_card
- debit_card
- bank_transfer
- e_wallet
- paypal
- momo
- vnpay
- zalopay

**Response:**
```json
{
  "success": true,
  "message": "Thanh toán thành công",
  "data": {
    "payment": {
      "id": 123,
      "transactionId": "TXN1234567890",
      "amount": 250000,
      "status": "completed"
    },
    "enrollment": {
      "id": 456,
      "courseId": 1,
      "status": "not-started"
    },
    "redirectUrl": "/courses/1/learn"
  }
}
```

### 3. Get My Payments
```
GET /api/v1/payments/my-payments?status=completed
Authorization: Bearer <token>
```

### 4. Get Payment Detail
```
GET /api/v1/payments/payments/:paymentId
Authorization: Bearer <token>
```

### 5. Validate Coupon
```
GET /api/v1/payments/coupons/:code/validate?courseId=1&amount=500000
Authorization: Bearer <token>
```

### 6. Get Active Coupons
```
GET /api/v1/payments/coupons/active
Authorization: Bearer <token>
```

### 7. Request Refund
```
POST /api/v1/payments/payments/:paymentId/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Khóa học không phù hợp"
}
```

## Flow

### Free Course Flow
```
1. POST /course-enrollments/:id/enroll
2. → Create enrollment immediately
3. → Start learning
```

### Paid Course Flow
```
1. POST /course-enrollments/:id/enroll
2. → Response 402 (Payment Required)
3. POST /payments/courses/:id/payment-intent (optional, for coupon)
4. POST /payments/courses/:id/process-payment
5. → Create payment + enrollment
6. → Start learning
```

## Sample Coupons

| Code | Type | Value | Condition |
|------|------|-------|-----------|
| WELCOME50 | percentage | 50% | Max 500k, 100 uses |
| NEWYEAR2024 | fixed_amount | 200k | Min 500k, 500 uses |
| STUDENT30 | percentage | 30% | Max 300k, unlimited |

## Error Codes

- 400: Bad request (already enrolled, invalid data)
- 401: Unauthorized (no token)
- 402: Payment Required (paid course)
- 403: Forbidden (not enrolled)
- 404: Not found (course/payment not found)
- 500: Server error
