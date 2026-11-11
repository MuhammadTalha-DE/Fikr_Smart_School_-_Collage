import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (userDataOrToken) => {
    // ✅ CASE 1: Face login — data already has token
    if (userDataOrToken && userDataOrToken.token) {
      setUser(userDataOrToken);
      // Store BOTH keys for consistency
      localStorage.setItem('user', JSON.stringify(userDataOrToken));
      localStorage.setItem('authToken', userDataOrToken.token);
      // Set Axios header
      api.defaults.headers.common['Authorization'] = `Bearer ${userDataOrToken.token}`;
      return userDataOrToken;
    }

    // ✅ CASE 2: Traditional username/password login
    const { username, password } = userDataOrToken;
    // Login can take longer than the normal API budget while the local API or
    // database is waking up. Keep the regular request timeout for other calls.
    const { data } = await api.post('/auth/login', { username, password }, { timeout: 30000 });
    setUser(data);
    // Store BOTH keys
    localStorage.setItem('user', JSON.stringify(data));
    localStorage.setItem('authToken', data.token);
    // Set Axios header
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
    isParent: user?.role === 'parent',
    isLibrarian: user?.role === 'librarian',
    isWarden: user?.role === 'warden',
    isTransport: user?.role === 'transport',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
