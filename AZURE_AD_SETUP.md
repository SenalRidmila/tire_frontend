# 🔐 Azure AD Setup Guide - Tire Management System

## Step 1: Azure Portal App Registration

### 1.1 Create New App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **"New registration"**

### 1.2 Configure App Registration
- **Name:** `Tire Management System`
- **Supported account types:** 
  - Select "Accounts in this organizational directory only (Horizon Campus only - Single tenant)"
  - OR "Accounts in any organizational directory (Any Azure AD directory - Multitenant)"
- **Redirect URI:** 
  - Platform: `Single-page application (SPA)`
  - URI: `https://tire-slt.vercel.app`

### 1.3 Get Application Details ✅ COMPLETED
Your actual values:
- **Application (client) ID:** `065f3754-3c30-494b-86bd-ff4ff3b98756`
- **Directory (tenant) ID:** `875ad673-beae-4720-aca9-1a470796d844`

## Step 2: Configure Redirect URIs

### 2.1 Add Redirect URIs
In your app registration:
1. Go to **Authentication**
2. Add these redirect URIs:
   - `https://tire-slt.vercel.app`
   - `https://tire-slt.vercel.app/home`
   - `http://localhost:3001` (for development)

### 2.2 Configure Platform Settings
- **Platform:** Single-page application
- **Access tokens:** ✅ Enabled
- **ID tokens:** ✅ Enabled

## Step 3: API Permissions (Optional)
1. Go to **API permissions**
2. Add Microsoft Graph permissions:
   - `User.Read` (to read user profile)
   - `openid`, `profile`, `email` (basic OpenID Connect scopes)

## Step 4: Update Environment Variables ✅ COMPLETED
Values updated in `.env` file:

```env
REACT_APP_AZURE_CLIENT_ID=065f3754-3c30-494b-86bd-ff4ff3b98756
REACT_APP_AZURE_AUTHORITY=https://login.microsoftonline.com/875ad673-beae-4720-aca9-1a470796d844
REACT_APP_REDIRECT_URI=https://tire-slt.vercel.app
```

## Step 5: Test Configuration
1. Update the environment variables
2. Deploy to Vercel
3. Test Microsoft login button

## 🔧 Configuration Values Needed

| Field | Value | Example |
|-------|--------|---------|
| Client ID | From App Registration | `12345678-1234-1234-1234-123456789012` |
| Tenant ID | From Azure AD Overview | `87654321-4321-4321-4321-210987654321` |
| Authority | Tenant-specific or common | `https://login.microsoftonline.com/common` |

## 📝 Notes
- Use `common` authority for multi-tenant support
- Use specific tenant ID for single-tenant only
- Ensure redirect URIs match exactly
- Test both development and production URLs