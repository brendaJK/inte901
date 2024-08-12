const API_URL = 'https://localhost:7268';

export const ENDPOINTS = {
  login: `${API_URL}/Account/login`,
  logout: `${API_URL}/Account/logout`,
  test: `${API_URL}/Home/protected`,
  producto: `${API_URL}/api/Productos`,
  compras: `${API_URL}/api/Purchases`,
  materia_prima: `${API_URL}/api/MateriasPrimas`,
  ingrediente: `${API_URL}/api/Ingredientes`,
  proveedor: `${API_URL}/api/Proveedores`,
  materiaPrimaProveedor: `${API_URL}/api/MateriasPrimasProveedores`,
  ventas: `${API_URL}/api/Orders`,
} as const;
