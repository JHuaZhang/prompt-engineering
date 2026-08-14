const TOKEN_KEY = 'prompt_token';
const TEMP_TOKEN_KEY = 'prompt_temp_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function getTempToken(): string | null {
  return localStorage.getItem(TEMP_TOKEN_KEY);
}

function setTempToken(token: string): void {
  localStorage.setItem(TEMP_TOKEN_KEY, token);
}

function removeTempToken(): void {
  localStorage.removeItem(TEMP_TOKEN_KEY);
}

export {
  getToken,
  setToken,
  removeToken,
  getTempToken,
  setTempToken,
  removeTempToken,
};
