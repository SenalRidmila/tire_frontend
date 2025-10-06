/**
 * Azure AD MSAL Configuration
 * This configuration enables Azure Active Directory authentication
 * while maintaining compatibility with existing MongoDB authentication
 */

import { LogLevel } from "@azure/msal-browser";

// Azure AD Configuration
export const msalConfig = {
    auth: {
        clientId: process.env.REACT_APP_AZURE_CLIENT_ID || "your-azure-app-client-id", // Replace with your Azure App Registration Client ID
        authority: process.env.REACT_APP_AZURE_AUTHORITY || "https://login.microsoftonline.com/common", // Use 'common' for multi-tenant or specific tenant ID
        redirectUri: process.env.REACT_APP_REDIRECT_URI || window.location.origin + "/home",
        postLogoutRedirectUri: window.location.origin + "/login",
        navigateToLoginRequestUrl: false
    },
    cache: {
        cacheLocation: "localStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                    default:
                        return;
                }
            }
        }
    }
};

// Add scopes here for ID token to be used at Microsoft Graph API endpoints.
export const loginRequest = {
    scopes: ["User.Read", "openid", "profile", "email"]
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};

// Authentication mode configuration
export const authModes = {
    AZURE_AD: 'azure_ad',
    MONGODB: 'mongodb',
    DEMO: 'demo'
};

// Default authentication mode (can be changed via environment variable)
export const defaultAuthMode = process.env.REACT_APP_AUTH_MODE || authModes.MONGODB;

// Fallback demo employees (existing functionality preserved)
export const demoEmployees = [
    { 
        employeeId: 'EMP001', 
        password: 'Kaushalya417#', 
        name: 'Chalani Kaushalya', 
        role: 'employee',
        department: 'IT Solutions',
        position: 'Software Engineer',
        email: 'chalani.emp001@slt.lk'
    },
    { 
        employeeId: 'EMP002', 
        password: 'saman123', 
        name: 'Engineer Saman', 
        role: 'engineer',
        department: 'Technical',
        position: 'Senior Engineer',
        email: 'saman.emp002@slt.lk'
    },
    { 
        employeeId: 'EMP003', 
        password: 'nimal456', 
        name: 'User Nimal', 
        role: 'user',
        department: 'Operations',
        position: 'Operations Coordinator',
        email: 'nimal.emp003@slt.lk'
    }
];