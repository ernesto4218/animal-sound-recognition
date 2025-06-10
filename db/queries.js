// system settings
export const GET_CONFIG_BY_NAME = 'SELECT * FROM system_settings WHERE name = ?';
export const INSERT_CONFIG = 'INSERT INTO system_settings (name, value) VALUES (?, ?)';
export const UPDATE_CONFIG = 'UPDATE system_settings SET value = ? WHERE name = ?';
export const DELETE_CONFIG = 'DELETE FROM system_settings WHERE name = ?';
export const GET_ALL_CONFIGS = 'SELECT * FROM system_settings';

// model
export const GET_MODEL_BY_ID = 'SELECT * FROM uploaded_models WHERE id = ?';
export const INSERT_MODEL = 'INSERT INTO uploaded_models (filename, original_name, extracted_path, zip_path) VALUES (?, ?, ?, ?)';
// export const UPDATE_CONFIG = 'UPDATE system_settings SET value = ? WHERE name = ?';
export const DELETE_MODEL = 'DELETE FROM uploaded_models WHERE id = ?';
export const GET_ALL_UPLOADED_MODELS = 'SELECT * FROM uploaded_models ORDER BY id DESC';

// class photo
export const INSERT_CLASS_PHOTO = 'INSERT INTO uploaded_images (class_name, image_name, original_name, path) VALUES (?, ?, ?, ?)';
export const GET_ALL_UPLOADED_PHOTO_CLASS = 'SELECT * FROM uploaded_images ORDER BY id DESC';
export const GET_CLASS_PHOTO_BY_ID = 'SELECT * FROM uploaded_images WHERE id = ?';
export const DELETE_CLASS_PHOTO_BY_ID = 'DELETE FROM uploaded_images WHERE id = ?';
export const UPDATE_CLASS_PHOTO_BY_NOTIFY = 'UPDATE uploaded_images SET notify = ? WHERE id = ?';

// logs
export const INSERT_DETECTED_LOGS = 'INSERT INTO detected_logs (name, img_path, percentage) VALUES (?, ?, ?)';
export const GET_ALL_DETECTED_LOGS = 'SELECT * FROM detected_logs ORDER BY id DESC';

// login
export const GET_LOGIN_INFO = 'SELECT * FROM users WHERE email = ? AND password = ?';
export const UPDATE_LOGIN = 'UPDATE users SET auth_token = ?, last_signin = ? WHERE email = ? && password = ?';
export const CHECK_TOKEN = 'SELECT * FROM users WHERE auth_token = ?';

// account
export const UPDATE_ACCOUNT = 'UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, email = ?, phone = ? WHERE auth_token = ?';
export const UPDATE_ACCOUNT_PASS = 'UPDATE users SET password = ? WHERE auth_token = ?';
