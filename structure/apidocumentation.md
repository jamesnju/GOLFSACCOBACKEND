# Golf Club SACCO API - Complete User Flow & API Documentation

## **Overview: Complete User Journey**

Here's the end-to-end flow of a user from registration to becoming a fully functional SACCO member:

```
1. Register
   ↓
2. Login
   ↓
3. Pay Registration Fee (KES 1,000)
   ↓
4. Account Activated
   ↓
5. Make Deposits (Savings)
   ↓
6. Wait 6 Months
   ↓
7. Apply for Loan
   ↓
8. Admin Approves Loan
   ↓
9. Receive Loan Disbursement
   ↓
10. Repay Loan
   ↓
11. Repeat (Savings & Loans)
```

---

## **API Documentation with Examples**

### **1. Authentication APIs**

#### **1.1 Register User**
**Endpoint:** `POST /api/v1/auth/register`

**Description:** Creates a new user account with their role (Player, Pro, or Caddy). The account is created in an "inactive" state until the registration fee is paid.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "phone": "0712345678",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PLAYER"  // Options: PLAYER, PRO, CADDY
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "usr_123456789",
      "email": "john.doe@example.com",
      "phone": "0712345678",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PLAYER",
      "joinDate": "2026-07-28T10:00:00.000Z",
      "isActive": false,
      "registrationFeePaid": false,
      "wallet": {
        "id": "wal_123456789",
        "balance": 0,
        "lockedBalance": 0
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

#### **1.2 Login**
**Endpoint:** `POST /api/v1/auth/login`

**Description:** Authenticates a user and returns JWT tokens. User must be active (registration fee paid).

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "usr_123456789",
      "email": "john.doe@example.com",
      "phone": "0712345678",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PLAYER",
      "isActive": true,
      "wallet": {
        "balance": 1000,
        "lockedBalance": 0
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Account not activated. Please pay the registration fee.",
  "timestamp": "2026-07-28T10:00:00.000Z"
}
```

---

#### **1.3 Get Profile**
**Endpoint:** `GET /api/v1/auth/profile`

**Description:** Gets the authenticated user's profile with wallet details.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "usr_123456789",
    "email": "john.doe@example.com",
    "phone": "0712345678",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PLAYER",
    "joinDate": "2026-01-28T10:00:00.000Z",
    "isActive": true,
    "wallet": {
      "id": "wal_123456789",
      "balance": 15000,
      "lockedBalance": 5000
    }
  }
}
```

---

### **2. Payment APIs (M-Pesa)**

#### **2.1 Initiate M-Pesa Payment**
**Endpoint:** `POST /api/v1/payments/initiate`

**Description:** Initiates an M-Pesa STK Push payment for registration fee, deposits, or loan repayment.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body:**
```json
{
  "phoneNumber": "0712345678",
  "amount": 1000,
  "purpose": "REGISTRATION"  // Options: REGISTRATION, DEPOSIT, LOAN_REPAYMENT
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment initiated",
  "data": {
    "payment": {
      "id": "pay_123456789",
      "amount": 1000,
      "purpose": "REGISTRATION",
      "status": "PENDING",
      "checkoutRequestId": "ws_CO_123456789"
    },
    "checkoutRequestId": "ws_CO_123456789",
    "responseCode": "0",
    "responseDescription": "Success. Request accepted for processing"
  }
}
```

**Note:** User will receive an M-Pesa prompt on their phone to enter PIN and confirm payment.

---

#### **2.2 M-Pesa Callback (M-Pesa Sends This)**
**Endpoint:** `POST /api/v1/payments/mpesa-callback`

**Description:** M-Pesa sends payment confirmation to this endpoint. This is automatic - you don't call this manually.

**Request Body (Sent by M-Pesa):**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "23343-11223344-1",
      "CheckoutRequestID": "ws_CO_123456789",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 1000 },
          { "Name": "MpesaReceiptNumber", "Value": "SDR1234567" },
          { "Name": "TransactionDate", "Value": "20260728100000" },
          { "Name": "PhoneNumber", "Value": 254712345678 }
        ]
      }
    }
  }
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Callback processed",
  "data": {
    "id": "pay_123456789",
    "status": "COMPLETED",
    "mpesaCode": "SDR1234567"
  }
}
```

---

### **3. Wallet APIs**

#### **3.1 Get Balance**
**Endpoint:** `GET /api/v1/wallets/balance`

**Description:** Gets current wallet balance, locked balance, and loan eligibility status.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Balance retrieved successfully",
  "data": {
    "balance": 15000,
    "lockedBalance": 5000,
    "availableBalance": 10000,
    "isEligibleForLoan": true,
    "activeLoan": {
      "id": "loa_123456789",
      "amount": 10000,
      "balance": 5000,
      "dueDate": "2026-10-28T10:00:00.000Z"
    }
  }
}
```

---

#### **3.2 Deposit Money**
**Endpoint:** `POST /api/v1/wallets/deposit`

**Description:** Adds money to the user's wallet. This is typically done via M-Pesa, but can also be manual.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body:**
```json
{
  "amount": 5000,
  "paymentMethod": "MPESA",
  "description": "Monthly savings deposit"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Deposit successful",
  "data": {
    "id": "trx_123456789",
    "type": "DEPOSIT",
    "amount": 5000,
    "reference": "DEP-169876543210-abc123",
    "status": "COMPLETED",
    "description": "Monthly savings deposit",
    "completedAt": "2026-07-28T10:30:00.000Z"
  }
}
```

**Note:** If user has an active loan, 30% of the deposit will automatically go towards loan repayment.

---

#### **3.3 Withdraw Money**
**Endpoint:** `POST /api/v1/wallets/withdraw`

**Description:** Withdraws money from the user's wallet. Restrictions apply:
- Minimum withdrawal: KES 100
- Cannot withdraw if you have an active loan
- Withdrawals above KES 10,000 require 6 months of membership

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body:**
```json
{
  "amount": 2000,
  "mpesaNumber": "0712345678",
  "description": "Emergency withdrawal"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Withdrawal request submitted",
  "data": {
    "id": "trx_123456790",
    "type": "WITHDRAWAL",
    "amount": 2000,
    "reference": "WTH-169876543211-xyz789",
    "status": "PENDING",
    "description": "Emergency withdrawal"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Cannot withdraw while you have an active loan",
  "timestamp": "2026-07-28T10:30:00.000Z"
}
```

---

### **4. Transaction APIs**

#### **4.1 Get Transaction History**
**Endpoint:** `GET /api/v1/transactions/history`

**Description:** Gets paginated transaction history with optional filters.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Query Parameters:**
```
?page=1&limit=10&type=DEPOSIT&status=COMPLETED&startDate=2026-01-01&endDate=2026-07-28
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Transaction history retrieved",
  "data": {
    "transactions": [
      {
        "id": "trx_123456789",
        "type": "DEPOSIT",
        "amount": 5000,
        "reference": "DEP-169876543210-abc123",
        "description": "Monthly savings deposit",
        "status": "COMPLETED",
        "createdAt": "2026-07-28T10:30:00.000Z",
        "user": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

#### **4.2 Get Transaction by Reference**
**Endpoint:** `GET /api/v1/transactions/:reference`

**Description:** Gets a specific transaction by its reference number.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Transaction retrieved",
  "data": {
    "id": "trx_123456789",
    "type": "LOAN_DISBURSEMENT",
    "amount": 10000,
    "reference": "LOAN-DISB-169876543210",
    "description": "Loan disbursement - Golf equipment",
    "status": "COMPLETED",
    "createdAt": "2026-07-28T10:30:00.000Z",
    "completedAt": "2026-07-28T10:35:00.000Z",
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "wallet": {
      "id": "wal_123456789",
      "balance": 15000
    }
  }
}
```

---

#### **4.3 Generate Statement**
**Endpoint:** `GET /api/v1/transactions/statement`

**Description:** Generates a complete statement with summary.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Query Parameters:**
```
?startDate=2026-01-01&endDate=2026-07-28
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Statement generated",
  "data": {
    "transactions": [
      {
        "type": "DEPOSIT",
        "amount": 5000,
        "description": "Monthly savings deposit",
        "createdAt": "2026-07-28T10:30:00.000Z"
      }
    ],
    "summary": {
      "totalCredits": 15000,
      "totalDebits": 5000,
      "balance": 10000
    }
  }
}
```

---

### **5. Loan APIs**

#### **5.1 Check Loan Eligibility**
**Endpoint:** `GET /api/v1/loans/eligibility`

**Description:** Checks if user is eligible for a loan (6 months membership + minimum savings).

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Eligibility check completed",
  "data": {
    "isEligible": true,
    "joinDate": "2026-01-28T10:00:00.000Z",
    "eligibleDate": "2026-07-28T10:00:00.000Z",
    "hasActiveLoan": false,
    "savingsBalance": 15000,
    "maxLoanAmount": 45000,
    "minSavingsRequirement": 2000
  }
}
```

---

#### **5.2 Apply for Loan**
**Endpoint:** `POST /api/v1/loans/apply`

**Description:** Applies for a loan. Requirements:
- 6 months of membership
- Minimum savings of KES 2,000
- No active loans
- Loan amount ≤ 3x savings balance

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body:**
```json
{
  "amount": 10000,
  "purpose": "Golf equipment and training",
  "durationMonths": 3
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Loan application submitted",
  "data": {
    "id": "loa_123456789",
    "amount": 10000,
    "interestRate": 0.05,
    "totalAmount": 10500,
    "balance": 10500,
    "status": "PENDING",
    "purpose": "Golf equipment and training",
    "applicationDate": "2026-07-28T10:30:00.000Z",
    "dueDate": "2026-10-28T10:30:00.000Z",
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "wallet": {
        "balance": 15000,
        "lockedBalance": 10000
      }
    }
  }
}
```

---

#### **5.3 Get User's Loans**
**Endpoint:** `GET /api/v1/loans/user`

**Description:** Gets all loans for the authenticated user.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Loans retrieved",
  "data": [
    {
      "id": "loa_123456789",
      "amount": 10000,
      "totalAmount": 10500,
      "balance": 5000,
      "status": "ACTIVE",
      "purpose": "Golf equipment",
      "applicationDate": "2026-07-28T10:30:00.000Z",
      "dueDate": "2026-10-28T10:30:00.000Z",
      "approvedBy": {
        "firstName": "Admin",
        "lastName": "User"
      }
    }
  ]
}
```

---

### **6. Admin APIs**

#### **6.1 Get Dashboard Stats (Admin Only)**
**Endpoint:** `GET /api/v1/admin/dashboard`

**Description:** Gets comprehensive system statistics. Admin only.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Dashboard data retrieved",
  "data": {
    "users": {
      "total": 150,
      "active": 120,
      "byRole": [
        { "role": "PLAYER", "_count": 100 },
        { "role": "PRO", "_count": 30 },
        { "role": "CADDY", "_count": 20 }
      ]
    },
    "finances": {
      "totalSavings": 2500000,
      "totalLoans": 45,
      "activeLoans": 12
    },
    "transactions": {
      "total": 350,
      "recent": [
        {
          "id": "trx_123456789",
          "type": "DEPOSIT",
          "amount": 5000,
          "user": {
            "firstName": "John",
            "lastName": "Doe"
          },
          "createdAt": "2026-07-28T10:30:00.000Z"
        }
      ]
    },
    "pendingLoans": [
      {
        "id": "loa_123456789",
        "amount": 10000,
        "user": {
          "firstName": "John",
          "lastName": "Doe"
        },
        "applicationDate": "2026-07-28T10:30:00.000Z"
      }
    ]
  }
}
```

---

#### **6.2 Get All Users (Admin Only)**
**Endpoint:** `GET /api/v1/admin/users`

**Description:** Gets paginated list of all users. Admin only.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Query Parameters:**
```
?page=1&limit=10&search=john
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Users retrieved",
  "data": {
    "users": [
      {
        "id": "usr_123456789",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "0712345678",
        "role": "PLAYER",
        "isActive": true,
        "joinDate": "2026-01-28T10:00:00.000Z",
        "wallet": {
          "balance": 15000
        },
        "_count": {
          "transactions": 25,
          "loans": 2
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15
    }
  }
}
```

---

#### **6.3 Approve/Reject Loan (Admin Only)**
**Endpoint:** `POST /api/v1/loans/approve`

**Description:** Approves or rejects a pending loan application. Admin only.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body:**
```json
{
  "loanId": "loa_123456789",
  "status": "APPROVED",
  "rejectionReason": null
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Loan approved",
  "data": {
    "id": "loa_123456789",
    "status": "ACTIVE",
    "approvalDate": "2026-07-28T10:45:00.000Z",
    "approvedById": "usr_admin123"
  }
}
```

---

#### **6.4 Activate User (Admin Only)**
**Endpoint:** `POST /api/v1/admin/users/:userId/activate`

**Description:** Activates a user account. Admin only.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User activated successfully",
  "data": {
    "id": "usr_123456789",
    "isActive": true,
    "registrationFeePaid": true
  }
}
```

---

## **Complete User Journey Example**

### **Phase 1: Registration**

**1. User Registers**
```bash
POST /api/v1/auth/register
{
  "email": "jane.golfer@example.com",
  "phone": "0712345678",
  "password": "Golf2026!",
  "firstName": "Jane",
  "lastName": "Golfer",
  "role": "PLAYER"
}
```

**Response:** User created with `isActive: false`, `registrationFeePaid: false`

---

**2. User Logs In (First Time)**
```bash
POST /api/v1/auth/login
{
  "email": "jane.golfer@example.com",
  "password": "Golf2026!"
}
```

**Response:** 
```json
{
  "message": "Account not activated. Please pay the registration fee."
}
```

---

**3. User Pays Registration Fee (KES 1,000)**
```bash
POST /api/v1/payments/initiate
Authorization: Bearer ACCESS_TOKEN
{
  "phoneNumber": "0712345678",
  "amount": 1000,
  "purpose": "REGISTRATION"
}
```

**Response:** M-Pesa STK Push sent to user's phone
```json
{
  "checkoutRequestId": "ws_CO_123456789",
  "responseDescription": "Success. Request accepted for processing"
}
```

**4. User Enters PIN on Phone → Payment Complete**

**5. User's Account is Automatically Activated**
```bash
GET /api/v1/auth/profile
Authorization: Bearer ACCESS_TOKEN
```

**Response:**
```json
{
  "isActive": true,
  "registrationFeePaid": true,
  "wallet": { "balance": 0 }
}
```

---

### **Phase 2: Building Savings**

**6. User Makes First Deposit**
```bash
POST /api/v1/payments/initiate
Authorization: Bearer ACCESS_TOKEN
{
  "phoneNumber": "0712345678",
  "amount": 5000,
  "purpose": "DEPOSIT"
}
```

**7. User Continues Saving Over 6 Months**
```bash
# Multiple deposits
POST /api/v1/payments/initiate
{
  "amount": 3000,
  "purpose": "DEPOSIT"
}
```

**8. Check Balance and Eligibility**
```bash
GET /api/v1/wallets/balance
Authorization: Bearer ACCESS_TOKEN
```

**Response:**
```json
{
  "balance": 20000,
  "isEligibleForLoan": true,  // After 6 months
  "availableBalance": 20000
}
```

---

### **Phase 3: Loan Application & Approval**

**9. Check Loan Eligibility**
```bash
GET /api/v1/loans/eligibility
Authorization: Bearer ACCESS_TOKEN
```

**Response:**
```json
{
  "isEligible": true,
  "maxLoanAmount": 60000,  // 3x savings
  "savingsBalance": 20000
}
```

**10. Apply for Loan**
```bash
POST /api/v1/loans/apply
Authorization: Bearer ACCESS_TOKEN
{
  "amount": 15000,
  "purpose": "New golf clubs",
  "durationMonths": 3
}
```

**Response:** Loan is `PENDING` and `lockedBalance` increases

---

**11. Admin Approves Loan**
```bash
POST /api/v1/loans/approve
Authorization: Bearer ADMIN_TOKEN
{
  "loanId": "loa_123456789",
  "status": "APPROVED"
}
```

**Response:** 
- Loan status becomes `ACTIVE`
- Funds are disbursed to wallet
- `balance` increases by loan amount
- `lockedBalance` decreases

---

### **Phase 4: Using & Repaying Loan**

**12. Check Updated Wallet**
```bash
GET /api/v1/wallets/balance
```

**Response:**
```json
{
  "balance": 35000,  // 20000 savings + 15000 loan
  "lockedBalance": 0,
  "activeLoan": {
    "amount": 15000,
    "balance": 15750,  // With 5% interest
    "dueDate": "2026-10-28"
  }
}
```

**13. Make Deposit (Automatic Loan Repayment)**
```bash
POST /api/v1/payments/initiate
{
  "amount": 10000,
  "purpose": "DEPOSIT"
}
```

**Response:** 30% of deposit (KES 3,000) automatically goes to loan repayment

---

**14. Full Loan Repayment**
```bash
# User continues making deposits
# When loan balance reaches 0:
POST /api/v1/loans/repay  # Automatic when depositing
```

**Response:** Loan status becomes `PAID`

```json
{
  "message": "Loan fully repaid! You can now apply for another loan.",
  "data": {
    "loanStatus": "PAID",
    "repaidAt": "2026-10-15T10:00:00.000Z"
  }
}
```

---

### **Phase 5: Repeat Cycle**

**15. Apply for Another (Larger) Loan**
```bash
POST /api/v1/loans/apply
{
  "amount": 40000,
  "purpose": "Golf tournament fees",
  "durationMonths": 6
}
```

**Response:** New loan application submitted (based on higher savings balance)

---

## **API Summary Table**

| Category | Method | Endpoint | Purpose | Authentication |
|----------|--------|----------|---------|----------------|
| **Auth** | POST | `/auth/register` | Register new user | Public |
| **Auth** | POST | `/auth/login` | Login user | Public |
| **Auth** | GET | `/auth/profile` | Get user profile | Required |
| **Payment** | POST | `/payments/initiate` | Initiate M-Pesa payment | Required |
| **Payment** | POST | `/payments/mpesa-callback` | M-Pesa callback | Public |
| **Wallet** | GET | `/wallets/balance` | Get wallet balance | Required |
| **Wallet** | POST | `/wallets/deposit` | Deposit money | Required |
| **Wallet** | POST | `/wallets/withdraw` | Withdraw money | Required |
| **Transaction** | GET | `/transactions/history` | Get transaction history | Required |
| **Transaction** | GET | `/transactions/:reference` | Get specific transaction | Required |
| **Transaction** | GET | `/transactions/statement` | Get statement | Required |
| **Loan** | GET | `/loans/eligibility` | Check loan eligibility | Required |
| **Loan** | POST | `/loans/apply` | Apply for loan | Required |
| **Loan** | GET | `/loans/user` | Get user's loans | Required |
| **Loan** | POST | `/loans/approve` | Approve/reject loan | Admin Only |
| **Loan** | GET | `/loans/pending` | Get pending loans | Admin Only |
| **Admin** | GET | `/admin/dashboard` | Dashboard stats | Admin Only |
| **Admin** | GET | `/admin/users` | Get all users | Admin Only |
| **Admin** | GET | `/admin/users/:userId` | Get user details | Admin Only |
| **Admin** | POST | `/admin/users/:userId/activate` | Activate user | Admin Only |
| **Admin** | POST | `/admin/users/:userId/deactivate` | Deactivate user | Admin Only |
| **Admin** | GET | `/admin/analytics/transactions` | Transaction analytics | Admin Only |

---

This is the complete flow of your Golf Club SACCO application. The APIs are designed to be secure, with proper authentication and role-based access control throughout the user journey.