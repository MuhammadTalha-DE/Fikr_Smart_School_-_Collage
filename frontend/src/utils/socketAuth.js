export const getSocketAuth = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const token = storedUser?.token || localStorage.getItem('authToken');
    return token ? { token } : {};
  } catch {
    const token = localStorage.getItem('authToken');
    return token ? { token } : {};
  }
};
