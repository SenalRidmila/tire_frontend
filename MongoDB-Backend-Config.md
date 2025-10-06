# MongoDB Backend Configuration

## Database Connection
- **MongoDB URI:** `mongodb+srv://slthrmanager:<db_password>@cluster0.xpc7gfy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
- **Database Name:** `tire_management`
- **Employee Collection:** `employee`

## Employee Authentication
The system authenticates users against the MongoDB employee collection through the Railway backend:

### API Endpoint
```
POST https://tirebackend-production.up.railway.app/api/auth/login
```

### Request Body
```json
{
  "employeeId": "EMP001",
  "password": "user_password"
}
```

### Expected Employee Document Structure
```json
{
  "_id": "ObjectId",
  "employeeId": "EMP001",
  "password": "hashed_password",
  "name": "Chalani Kaushalya",
  "role": "employee",
  "department": "IT Solutions",
  "position": "Software Engineer",
  "email": "chalani.emp001@slt.lk",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Fallback System
If MongoDB is unavailable, the system falls back to demo credentials:

### Demo Employees
1. **EMP001** / **Kaushalya417#**
   - Name: Chalani Kaushalya
   - Role: employee
   - Department: IT Solutions

2. **EMP002** / **saman123**
   - Name: Engineer Saman
   - Role: engineer
   - Department: Technical

3. **EMP003** / **nimal456**
   - Name: TTO Nimal
   - Role: tto
   - Department: Transport

## Backend Implementation Requirements
The Railway backend should:

1. Connect to MongoDB using the provided connection string
2. Implement `/api/auth/login` endpoint
3. Verify employee credentials against the `employee` collection
4. Return user data on successful authentication
5. Handle password hashing/verification securely

## Frontend Integration
- Frontend automatically tries MongoDB authentication first
- Falls back to demo mode if backend is unavailable
- Stores user data in localStorage for session management
- Redirects to home page on successful login

## Security Notes
- Passwords should be hashed in MongoDB
- Use environment variables for database credentials
- Implement proper error handling for authentication failures
- Consider implementing JWT tokens for session management
