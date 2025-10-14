# 🚀 Vercel Environment Variables Setup

## Setup Instructions for tire-slt.vercel.app

### 1. Go to Vercel Dashboard
1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `tire_frontend` project
3. Go to **Settings** > **Environment Variables**

### 2. Add These Environment Variables

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `REACT_APP_API_URL` | `https://tire-backend-58a9.onrender.com` | Production |
| `REACT_APP_AZURE_CLIENT_ID` | `YOUR_ACTUAL_CLIENT_ID` | Production |
| `REACT_APP_AZURE_AUTHORITY` | `https://login.microsoftonline.com/common` | Production |
| `REACT_APP_REDIRECT_URI` | `https://tire-slt.vercel.app` | Production |
| `REACT_APP_AUTH_MODE` | `mongodb` | Production |

### 3. Azure AD Configuration Values

Replace these with your actual Azure AD App Registration values:

```env
REACT_APP_AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789012
REACT_APP_AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
REACT_APP_REDIRECT_URI=https://tire-slt.vercel.app
```

### 4. After Adding Variables
1. **Redeploy** the application
2. Variables will be available in next deployment
3. Test Microsoft login functionality

## 🔧 Quick Setup Steps:

1. **Create Azure AD App Registration** (see AZURE_AD_SETUP.md)
2. **Copy Client ID** from Azure Portal  
3. **Add to Vercel** environment variables
4. **Redeploy** application
5. **Test** Microsoft login

## ✅ Verification
After setup, users should be able to:
- Click "Use your organizational Microsoft account" button
- Redirect to Microsoft login page  
- Authenticate with organizational account
- Return to application home page

## 🚨 Troubleshooting
If errors occur:
- Verify Client ID is correct
- Check redirect URI matches exactly
- Ensure tenant/authority is correct
- Check Azure AD app permissions