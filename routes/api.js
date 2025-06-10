import multer from 'multer';
import path from 'path';
import express from 'express';
import fs from 'fs'
import fsp from 'fs/promises'
import unzipper from 'unzipper';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import cookieParser from 'cookie-parser';

import {
  updateConfig,
  insertModelUpload,
  getConfig,
  getModel,
  deleteModel,
  insertClassPhoto,
  getClassPhotoById,
  deleteClassPhoto,
  insertDetectedLogs,
  getLoginInfo,
  updateLoginInfoBy,
  updateAccount,
  changePass,
  updateClassPhotoByNotify,
} from '../db/services.js';

const router = express.Router();
router.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// middlewares
// Configure multer to store files in /uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'ml/zip'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    // Keep original file name
    cb(null, file.originalname);
  }
});

const photo_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploaded_photo_class');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});


const upload = multer({ storage: storage });
const upload_photo = multer({ storage: photo_storage });

router.post('/template', async (req, res) => {
  const { param } = req.body;

  try {
    
  } catch (error) {
    console.error('AI error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

router.post('/save-settings-t-f', async (req, res) => {
  const { probability, overlap, percent, filter_allow, filter_deny } = req.body;
  const token = req.cookies.auth_token;

  try {
    await updateConfig("probability", probability);
    await updateConfig("overlap", overlap);
    await updateConfig("percent", percent);
    await updateConfig("filter_allow", filter_allow);
    await updateConfig("filter_deny", filter_deny);
    
    // Simulate a response
    res.status(200).json({ status: 'success', message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// model
router.post('/upload-model', upload.single('file'), async (req, res) => {
  try {
    const projectRoot = path.resolve(__dirname, '..');
    const zipPath = path.join(projectRoot, 'ml/zip', req.file.filename);
    const baseName = path.parse(req.file.filename).name;
    const extractPath = path.join(projectRoot, 'ml/model', baseName);
    // const metadataPath = path.join(projectRoot, 'ml/model', 'metadata.json');
    // const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
    fs.mkdirSync(extractPath, { recursive: true });

    await fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise();

    // console.log(baseName);

    await insertModelUpload(baseName, req.file.filename, extractPath, zipPath)
    // await updateConfig('model', baseName);

    res.json({
      status: 'success',
      message: 'File uploaded and extracted successfully.',
      extracted_to: extractPath,
    });
  } catch (error) {
    console.error('Extraction failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to extract zip file.',
    });
  }
});

router.post('/use-model', async (req, res) => {
  try {
    const id = req.body.model_id;
    const model = await getModel(id);

    const projectRoot = path.resolve(__dirname, '..');
    const metadataPath = path.join(projectRoot, 'ml/model/', model.filename,'/metadata.json');
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const labelsString = metadata.wordLabels.join(', ');

    console.log(projectRoot);
    console.log(metadataPath);
    console.log(metadata);

    await updateConfig('model', model.filename);
    await updateConfig('all_filters', labelsString);

    res.json({
      status: 'success',
      message: `Model ${model.filename} activated.`,
      model: model.filename
    });
  } catch (error) {
    console.error('Extraction failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to extract zip file.',
    });
  }
});

router.post('/delete-model', async (req, res) => {
  try {
    const { model_id } = req.body; // destructure model_id from req.body
    console.log('Received model ID:', model_id);

    if (!model_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Model ID is required.',
      });
    }

    const model = await getModel(model_id);
    if (!model) {
      return res.status(404).json({ status: 'error', message: 'Model not found.' });
    }

    const projectRoot = path.resolve(__dirname, '..');
    const extractedPath = path.join(projectRoot, 'ml', 'model', model.filename);
    const zipPath = path.join(projectRoot, 'ml', 'model', model.original_name);

    await fsp.rm(extractedPath, { recursive: true, force: true });
    await fsp.rm(zipPath, { recursive: true, force: true });

    await updateConfig('model', '');
    await updateConfig('all_filters', '');
    await deleteModel(model.id);

    // For now, just send a success response
    res.json({
      status: 'success',
      message: `Model ${model_id} deleted.`,
      model: model_id,
    });

  } catch (error) {
    console.error('Deletion failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete model.',
    });
  }
});

router.post('/upload-photo-class', upload_photo.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
    }

    const file = req.file;
    const className = req.body.class_name || 'unknown'; // add this field from frontend

    const fullPath = path.join('uploaded_photo_class', file.filename);

    // Save record to database
    await insertClassPhoto(className, file.filename, file.originalname, fullPath);

    res.json({
      status: 'success',
      message: 'File uploaded successfully.',
      file_info: {
        stored_name: file.filename,
        original_name: file.originalname,
        path: fullPath,
      }
    });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'File upload failed.',
    });
  }
});

router.post('/delete-photo-class', async (req, res) => {
  try {
    const { class_id } = req.body;
    console.log(class_id);

    if (!class_id) {
      return res.status(400).json({ status: 'error', message: 'class_id is required.' });
    }

    // Get photo info from database
    const photo = await getClassPhotoById(class_id); // ← Your own function
    console.log(photo);
    if (!photo) {
      return res.status(404).json({ status: 'error', message: 'Photo not found.' });
    }

    const filePath = path.join(__dirname, '..', photo.path); // photo.path is like "uploaded_photo_class/filename.jpg"

    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await deleteClassPhoto(class_id); // ← Your own function

    res.json({ status: 'success', message: 'Photo deleted successfully.' });

  } catch (error) {
    console.error('Delete failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete photo.',
    });
  }
});

router.post('/notify-enable', async (req, res) => {
  try {
    const id = req.body.id;
    const isChecked = req.body.checked ? 1 : 0;

    await updateClassPhotoByNotify(id, isChecked);

    res.json({
      status: 'success',
      message: `Notification enabled.`,
    });
  } catch (error) {
    console.error('Extraction failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to extract zip file.',
    });
  }
});

// logs
router.post('/insert-logs-rt', async (req, res) => {
  const { name, img_path, percentage } = req.body;

  try {
    await insertDetectedLogs(name, img_path, percentage);
    res.status(200).json({ status: 'success', message: 'Logs inserted successfully' });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ error: 'Failed to save logs' });
  }
});

// login
router.post('/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    
    const exists = await getLoginInfo(email, password);
    console.log(exists);

    if (exists){
      const token = uuidv4();
      await updateLoginInfoBy(token, new Date(), email, password);
      
      if (rememberMe){
        res.cookie('auth_token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'Strict',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
        });
      } else {
         res.cookie('auth_token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'Strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
        });
      }

      res.status(200).json({ status: 'success', message: 'Login  successfully' });
    } else {
      res.status(200).json({ status: 'error', message: 'Invalid email or password.' });
    }
   
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// account
router.post('/save-account', async (req, res) => {
  const { first, middle, last, email, phone } = req.body;
  const token = req.cookies.auth_token;

  try {
    await updateAccount(first, middle, last, email, phone, token);
    
    // Simulate a response
    res.status(200).json({ status: 'success', message: 'Account saved successfully' });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

router.post('/change-pass', async (req, res) => {
  const { newpass, confirm} = req.body;
  const token = req.cookies.auth_token;

  if (newpass !== confirm){
    return res.status(200).json({ status: 'error', message: 'Password do not match.' });
  }

  try {
    await changePass(newpass, confirm, token);
    
    // Simulate a response
    res.status(200).json({ status: 'success', message: 'Password changed successfully' });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});


export default router;
