// services/configService.js
import db from './db.js';
import * as queries from './queries.js';

// system config
export async function getConfig(name) {
  const [rows] = await db.execute(queries.GET_CONFIG_BY_NAME, [name]);
  return rows[0];
}

export async function insertConfig(name, value) {
  const [result] = await db.execute(queries.INSERT_CONFIG, [name, value]);
  return result.insertId;
}

export async function updateConfig(name, value) {
  const [result] = await db.execute(queries.UPDATE_CONFIG, [value, name]);
  return result.affectedRows;
}

export async function deleteConfig(name) {
  const [result] = await db.execute(queries.DELETE_CONFIG, [name]);
  return result.affectedRows;
}

export async function getAllConfigs() {
  const [rows] = await db.execute(queries.GET_ALL_CONFIGS);
  return rows;
}

// uploaded model
export async function getModel(id) {
  const [rows] = await db.execute(queries.GET_MODEL_BY_ID, [id]);
  return rows[0];
}

export async function insertModelUpload(filename, original_name, extracted_path, zip_path) {
  const [result] = await db.execute(queries.INSERT_MODEL, [filename, original_name, extracted_path, zip_path]);
  return result.insertId;
}

// export async function updateConfig(name, value) {
//   const [result] = await db.execute(queries.UPDATE_CONFIG, [value, name]);
//   return result.affectedRows;
// }

export async function deleteModel(id) {
  const [result] = await db.execute(queries.DELETE_MODEL, [id]);
  return result.affectedRows;
}

export async function getAllUploadedModels() {
  const [rows] = await db.execute(queries.GET_ALL_UPLOADED_MODELS);
  return rows;
}

// class photo
export async function getAllUploadedPhotoClass() {
  const [rows] = await db.execute(queries.GET_ALL_UPLOADED_PHOTO_CLASS);
  return rows;
}

export async function insertClassPhoto(class_name, image_name, original_name, path) {
  const [result] = await db.execute(queries.INSERT_CLASS_PHOTO, [class_name, image_name, original_name, path]);
  return result.insertId;
}

export async function getClassPhotoById(id) {
  const [result] = await db.execute(queries.GET_CLASS_PHOTO_BY_ID, [id]);
  return result[0];
}

export async function deleteClassPhoto(id) {
  const [result] = await db.execute(queries.DELETE_CLASS_PHOTO_BY_ID, [id]);
  return result.affectedRows;
}

export async function updateClassPhotoByNotify(id, checked) {
  const [result] = await db.execute(queries.UPDATE_CLASS_PHOTO_BY_NOTIFY, [checked, id]);
  return result.affectedRows;
}


// logs
export async function insertDetectedLogs(name, img_path, percentage) {
  const [result] = await db.execute(queries.INSERT_DETECTED_LOGS, [name, img_path, percentage]);
  return result.insertId;
}

export async function getAllDetectedLogs() {
  const [rows] = await db.execute(queries.GET_ALL_DETECTED_LOGS);
  return rows;
}

// login
export async function getLoginInfo(email, password) {
  const [result] = await db.execute(queries.GET_LOGIN_INFO, [email, password]);
  return result[0];
}

export async function updateLoginInfoBy(token, lastlogin, email, password) {
  const [result] = await db.execute(queries.UPDATE_LOGIN, [token, lastlogin, email, password]);
  return result.affectedRows;
}

export async function checkauth(token) {
  const [result] = await db.execute(queries.CHECK_TOKEN, [token]);
  return result[0];
}

// account
export async function updateAccount(first, middle, last, email, phone, token) {
  const [result] = await db.execute(queries.UPDATE_ACCOUNT, [first, middle, last, email, phone, token]);
  return result.affectedRows;
}

export async function changePass(newpass, confirm, token) {
  const [result] = await db.execute(queries.UPDATE_ACCOUNT_PASS, [newpass, token]);
  return result.affectedRows;
}