# MongoDB Employee Collection Authentication

## 🗄️ MongoDB Collection Structure

### Employee Collection (`employees`)
```json
{
  "_id": "ObjectId",
  "employeeId": "EMP001",
  "name": "Manager Kaushalya", 
  "password": "hashedPassword", // Use bcrypt for password hashing
  "role": "manager", // manager, engineer, user, admin
  "department": "Management",
  "email": "kaushalya@company.com",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

## 🔧 Required Backend API Endpoint

### POST `/api/auth/login`

**Request Body:**
```json
{
  "employeeId": "EMP001",
  "password": "Kaushalya417#"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "employeeId": "EMP001",
  "name": "Manager Kaushalya",
  "role": "manager",
  "department": "Management"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

## 📊 Sample Employee Data

Insert these employees into MongoDB:
```json
[
  {
    "employeeId": "EMP001",
    "name": "Manager Kaushalya",
    "password": "$2b$10$...", // bcrypt hash of "Kaushalya417#"
    "role": "manager",
    "department": "Management",
    "email": "kaushalya@company.com"
  },
  {
    "employeeId": "EMP002", 
    "name": "Engineer Saman",
    "password": "$2b$10$...", // bcrypt hash of "saman123"
    "role": "engineer",
    "department": "Technical",
    "email": "saman@company.com"
  },
  {
    "employeeId": "EMP003",
    "name": "User Nimal", 
    "password": "$2b$10$...", // bcrypt hash of "nimal456"
    "role": "user",
    "department": "Operations",
    "email": "nimal@company.com"
  }
]
```

## 🔐 Backend Implementation Notes

1. **Password Security**: Use bcrypt to hash passwords before storing
2. **Database Connection**: Connect to MongoDB Atlas
3. **Validation**: Validate both employeeId and password
4. **CORS**: Enable CORS for frontend domain
5. **Error Handling**: Return proper error messages
6. **Security**: Never return password in response

## 🚀 Deployment

Deploy to Railway: `https://tirebackend-production.up.railway.app`
