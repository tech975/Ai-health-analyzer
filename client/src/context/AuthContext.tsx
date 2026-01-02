import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthContextType, LoginCredentials, RegisterCredentials } from '../types';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

// Auth state type
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Auth actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const user = await authApi.getProfile();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token },
          });
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('token');
          dispatch({ type: 'AUTH_FAILURE' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const authResponse = await authApi.login(credentials);
      
      // Store token in localStorage
      localStorage.setItem('token', authResponse.token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: authResponse.user,
          token: authResponse.token,
        },
      });
      
      toast.success('Login successful!');
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE' });
      const errorMessage = error.response?.data?.error?.message || 'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const authResponse = await authApi.register(credentials);
      
      // Store token in localStorage
      localStorage.setItem('token', authResponse.token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: authResponse.user,
          token: authResponse.token,
        },
      });
      
      toast.success('Registration successful!');
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE' });
      const errorMessage = error.response?.data?.error?.message || 'Registration failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  // Context value
  const value: AuthContextType = {
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;