/**
 * Authentication Service - Handles multiple authentication modes
 * Supports Azure AD, MongoDB, and Demo authentication
 * Maintains existing code structure while adding Azure AD capabilities
 */

import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest, graphConfig, authModes, defaultAuthMode, demoEmployees } from '../config/authConfig';

class AuthService {
    constructor() {
        // Initialize MSAL instance for Azure AD
        this.msalInstance = new PublicClientApplication(msalConfig);
        
        // Set default authentication mode
        this.currentAuthMode = defaultAuthMode;
        
        // Initialize MSAL
        this.initializeMsal();
    }

    async initializeMsal() {
        try {
            await this.msalInstance.initialize();
            console.log('MSAL initialized successfully');
        } catch (error) {
            console.error('MSAL initialization failed:', error);
        }
    }

    // Set authentication mode
    setAuthMode(mode) {
        if (Object.values(authModes).includes(mode)) {
            this.currentAuthMode = mode;
            console.log(`Authentication mode set to: ${mode}`);
        } else {
            console.warn(`Invalid auth mode: ${mode}. Using default: ${defaultAuthMode}`);
        }
    }

    // Get current authentication mode
    getAuthMode() {
        return this.currentAuthMode;
    }

    // Azure AD Login
    async azureLogin() {
        try {
            console.log('🔍 Attempting Azure AD authentication...');
            
            const loginResponse = await this.msalInstance.loginPopup(loginRequest);
            
            if (loginResponse) {
                // Get user profile from Microsoft Graph
                const profile = await this.getAzureUserProfile(loginResponse.accessToken);
                
                // Map Azure AD user to application user format
                const userData = this.mapAzureUserToAppUser(profile, loginResponse);
                
                // Store authentication data
                this.storeUserSession(userData, authModes.AZURE_AD);
                
                return {
                    success: true,
                    user: userData,
                    authMode: authModes.AZURE_AD,
                    message: 'Azure AD login successful'
                };
            }
        } catch (error) {
            console.error('Azure AD login failed:', error);
            return {
                success: false,
                error: error.message,
                authMode: authModes.AZURE_AD
            };
        }
    }

    // MongoDB Authentication (existing functionality)
    async mongoLogin(userId, password) {
        try {
            console.log('🔍 Attempting MongoDB employee authentication...');
            
            const response = await fetch('https://tire-backend-58a9.onrender.com/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employeeId: userId,
                    password: password
                }),
            });

            if (response.ok) {
                const userData = await response.json();
                
                // Store authentication data
                const user = {
                    id: userData.employeeId,
                    name: userData.name || userId,
                    role: userData.role || 'user',
                    department: userData.department,
                    email: userData.email || `${userId}@company.com`,
                    position: userData.position || 'Employee'
                };
                
                this.storeUserSession(user, authModes.MONGODB);
                
                return {
                    success: true,
                    user: user,
                    authMode: authModes.MONGODB,
                    message: 'MongoDB login successful'
                };
            } else {
                throw new Error(`MongoDB API error: ${response.status}`);
            }
        } catch (error) {
            console.error('MongoDB authentication failed:', error);
            return {
                success: false,
                error: error.message,
                authMode: authModes.MONGODB
            };
        }
    }

    // Demo Authentication (existing functionality)
    demoLogin(userId, password) {
        try {
            console.log('🔍 Attempting demo authentication...');
            
            const validEmployee = demoEmployees.find(
                emp => emp.employeeId === userId && emp.password === password
            );
            
            if (validEmployee) {
                const user = {
                    id: validEmployee.employeeId,
                    name: validEmployee.name,
                    role: validEmployee.role,
                    department: validEmployee.department,
                    email: validEmployee.email,
                    position: validEmployee.position
                };
                
                this.storeUserSession(user, authModes.DEMO);
                
                return {
                    success: true,
                    user: user,
                    authMode: authModes.DEMO,
                    message: 'Demo login successful'
                };
            } else {
                return {
                    success: false,
                    error: 'Invalid credentials',
                    authMode: authModes.DEMO
                };
            }
        } catch (error) {
            console.error('Demo authentication failed:', error);
            return {
                success: false,
                error: error.message,
                authMode: authModes.DEMO
            };
        }
    }

    // Unified login method - tries multiple authentication modes
    async login(userId, password) {
        // If Azure AD mode is enabled and no userId/password provided, try Azure AD
        if (this.currentAuthMode === authModes.AZURE_AD && (!userId || !password)) {
            return await this.azureLogin();
        }
        
        // If userId and password provided, try MongoDB first, then demo
        if (userId && password) {
            // Try MongoDB authentication
            const mongoResult = await this.mongoLogin(userId, password);
            if (mongoResult.success) {
                return mongoResult;
            }
            
            // Fallback to demo authentication
            console.log('MongoDB failed, trying demo authentication...');
            return this.demoLogin(userId, password);
        }
        
        return {
            success: false,
            error: 'No valid authentication method available',
            authMode: this.currentAuthMode
        };
    }

    // Get Azure user profile from Microsoft Graph
    async getAzureUserProfile(accessToken) {
        try {
            const response = await fetch(graphConfig.graphMeEndpoint, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to fetch user profile from Microsoft Graph');
            }
        } catch (error) {
            console.error('Error fetching Azure user profile:', error);
            throw error;
        }
    }

    // Map Azure AD user to application user format
    mapAzureUserToAppUser(azureProfile, loginResponse) {
        return {
            id: azureProfile.id,
            name: azureProfile.displayName || azureProfile.givenName + ' ' + azureProfile.surname,
            email: azureProfile.mail || azureProfile.userPrincipalName,
            role: this.determineRoleFromAzureUser(azureProfile),
            department: azureProfile.department || 'Unknown',
            position: azureProfile.jobTitle || 'Employee',
            azureId: azureProfile.id,
            accessToken: loginResponse.accessToken
        };
    }

    // Determine user role based on Azure AD user information
    determineRoleFromAzureUser(azureProfile) {
        // You can customize this logic based on your Azure AD setup
        // For example, check group membership, job title, department, etc.
        
        if (azureProfile.jobTitle && azureProfile.jobTitle.toLowerCase().includes('manager')) {
            return 'manager';
        } else if (azureProfile.jobTitle && azureProfile.jobTitle.toLowerCase().includes('engineer')) {
            return 'engineer';
        } else if (azureProfile.department && azureProfile.department.toLowerCase().includes('transport')) {
            return 'tto';
        } else {
            return 'user'; // Default role
        }
    }

    // Store user session data
    storeUserSession(userData, authMode) {
        // Store user info and authentication status for session
        localStorage.setItem('user', JSON.stringify({
            id: userData.id,
            username: userData.name,
            role: userData.role,
            department: userData.department,
            email: userData.email,
            timestamp: new Date().toISOString(),
            authMode: authMode
        }));
        
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('currentUser', JSON.stringify({
            id: userData.id,
            name: userData.name,
            role: userData.role,
            department: userData.department,
            email: userData.email,
            authMode: authMode
        }));
        
        console.log(`User session stored with ${authMode} authentication`);
    }

    // Check if user is authenticated
    isAuthenticated() {
        return localStorage.getItem('isAuthenticated') === 'true';
    }

    // Get current user
    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    // Logout
    async logout() {
        try {
            const currentUser = this.getCurrentUser();
            
            // If user was authenticated via Azure AD, perform Azure logout
            if (currentUser && currentUser.authMode === authModes.AZURE_AD) {
                await this.msalInstance.logoutPopup();
            }
            
            // Clear all session data
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('user');
            
            console.log('User logged out successfully');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get MSAL instance (for advanced usage)
    getMsalInstance() {
        return this.msalInstance;
    }
}

// Export singleton instance
export default new AuthService();