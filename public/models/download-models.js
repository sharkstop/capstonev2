
// سكريبت لتنزيل نماذج face-api.js

const fs = require('fs');
const path = require('path');
const https = require('https');

const MODELS_DIR = __dirname;
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const MODELS = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1'
];

// التأكد من وجود المجلد
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

// دالة لتنزيل ملف
function downloadFile(filename) {
  const url = `${BASE_URL}/${filename}`;
  const filePath = path.join(MODELS_DIR, filename);
  
  // التحقق مما إذا كان الملف موجودًا بالفعل
  if (fs.existsSync(filePath)) {
    console.log(`الملف ${filename} موجود بالفعل`);
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    console.log(`جاري تنزيل ${filename}...`);
    
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`تم تنزيل ${filename} بنجاح`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(filePath);
      console.error(`فشل تنزيل ${filename}: ${err.message}`);
      reject(err);
    });
  });
}

// تنزيل جميع النماذج
async function downloadAllModels() {
  console.log('بدء تنزيل نماذج face-api.js...');
  
  try {
    // تنزيل الملفات بشكل متتالي
    for (const model of MODELS) {
      await downloadFile(model);
    }
    console.log('تم تنزيل جميع النماذج بنجاح!');
  } catch (error) {
    console.error('حدث خطأ أثناء تنزيل النماذج:', error);
  }
}

// بدء التنزيل
downloadAllModels();
