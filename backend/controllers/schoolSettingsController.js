const Config = require('../models/Config');
const AcademicYear = require('../models/AcademicYear');
const GradeScale = require('../models/GradeScale');
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ensureUploadDir = (folder) => {
  const absolutePath = path.join(__dirname, '..', 'uploads', folder);
  if (!fs.existsSync(absolutePath)) fs.mkdirSync(absolutePath, { recursive: true });
  return absolutePath;
};

const removeStoredUpload = async (url) => {
  if (!url || !url.startsWith('/uploads/')) return;
  const relativePath = url.replace(/^\/uploads\//, '');
  const absolutePath = path.join(__dirname, '..', 'uploads', relativePath);
  if (fs.existsSync(absolutePath)) await fs.promises.unlink(absolutePath);
};

const normalizeOfficialImage = async (file, {
  assetName,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  requireWide = false,
}) => {
  if (!file) {
    const error = new Error('Please upload an image');
    error.statusCode = 400;
    throw error;
  }

  const metadata = await sharp(file.buffer, { failOn: 'warning' }).metadata();
  if (!metadata.width || !metadata.height) {
    const error = new Error(`The uploaded ${assetName} is not a valid image`);
    error.statusCode = 422;
    throw error;
  }

  if (metadata.width < minWidth || metadata.height < minHeight) {
    const error = new Error(`The ${assetName} image is too small. Upload a clearer image.`);
    error.statusCode = 422;
    throw error;
  }

  if (requireWide && metadata.width <= metadata.height) {
    const error = new Error('Principal signature must be a wide handwritten signature image');
    error.statusCode = 422;
    throw error;
  }

  return sharp(file.buffer, { failOn: 'warning' })
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
};

const saveOfficialAsset = async ({ file, folder, prefix, previousUrl, options }) => {
  const normalized = await normalizeOfficialImage(file, options);
  const uploadDir = ensureUploadDir(folder);
  const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
  const absolutePath = path.join(uploadDir, filename);

  await fs.promises.writeFile(absolutePath, normalized);
  await removeStoredUpload(previousUrl);

  return `/uploads/${folder}/${filename}`;
};

const getSchoolInfoSettings = async () => {
  const keys = [
    'school_name',
    'school_tagline',
    'school_street',
    'school_city',
    'school_state',
    'school_postal',
    'school_phone',
    'school_email',
    'school_logo',
    'principal_name',
    'principal_signature',
    'school_stamp',
  ];
  const entries = await Promise.all(keys.map(key => Config.findOne({ key })));
  const valueFor = (key) => entries.find(entry => entry?.key === key)?.value || '';

  return {
    name: valueFor('school_name'),
    tagline: valueFor('school_tagline'),
    street: valueFor('school_street'),
    city: valueFor('school_city'),
    state: valueFor('school_state'),
    postal: valueFor('school_postal'),
    phone: valueFor('school_phone'),
    email: valueFor('school_email'),
    logo: valueFor('school_logo'),
    principalName: valueFor('principal_name'),
    principalSignature: valueFor('principal_signature'),
    schoolStamp: valueFor('school_stamp'),
  };
};

// ----- GET all settings (school info, active academic year, grade scales) -----
const getSettings = asyncHandler(async (req, res) => {
  res.json(await getSettingsData());
});

const getSettingsLegacy = asyncHandler(async (req, res) => {
  const [schoolName, tagline, street, city, state, postal, phone, email, logo, principalSignature, schoolStamp ] = await Promise.all([
    Config.findOne({ key: 'school_name' }),
    Config.findOne({ key: 'school_tagline' }),
    Config.findOne({ key: 'school_street' }),
    Config.findOne({ key: 'school_city' }),
    Config.findOne({ key: 'school_state' }),
    Config.findOne({ key: 'school_postal' }),
    Config.findOne({ key: 'school_phone' }),
    Config.findOne({ key: 'school_email' }),
    Config.findOne({ key: 'school_logo' }),
    Config.findOne({ key: 'principal_name' }),
    Config.findOne({ key: 'principal_signature' }),   // ← ADD
  Config.findOne({ key: 'school_stamp' }),           // ← ADD
  ]);

  const activeYear = await AcademicYear.findOne({ isActive: true });
  const gradeScales = await GradeScale.find().sort('minPercentage');

  res.json({
    schoolInfo: {
      name: schoolName?.value || '',
      tagline: tagline?.value || '',
      street: street?.value || '',
      city: city?.value || '',
      state: state?.value || '',
      postal: postal?.value || '',
      phone: phone?.value || '',
        principalSignature: principalSignature?.value || '',   // ADD
  schoolStamp: schoolStamp?.value || '',                 // ADD
      email: email?.value || '',
      
      logo: logo?.value || '',
       
    },
    academicYear: activeYear || null,
    gradeScales,
  });
});

// ----- PUT update all settings -----
const updateSettings = asyncHandler(async (req, res) => {
  const { schoolInfo, academicYear, gradeScales } = req.body;

  // School info – save each key in Config
  if (schoolInfo) {
    const info = schoolInfo;
    await Config.findOneAndUpdate({ key: 'school_name' }, { value: info.name || '' }, { upsert: true });
    await Config.findOneAndUpdate({ key: 'school_tagline' }, { value: info.tagline || '' }, { upsert: true });
    await Config.findOneAndUpdate({ key: 'school_street' }, { value: info.street || '' }, { upsert: true });
    await Config.findOneAndUpdate({ key: 'school_city' }, { value: info.city || '' }, { upsert: true });
    await Config.findOneAndUpdate({ key: 'school_state' }, { value: info.state || '' }, { upsert: true });
    await Config.findOneAndUpdate({ key: 'school_postal' }, { value: info.postal || '' }, { upsert: true });
    await Config.findOneAndUpdate({ key: 'school_phone' }, { value: info.phone || '' }, { upsert: true });
    await Config.findOneAndUpdate({ key: 'school_email' }, { value: info.email || '' }, { upsert: true });
    await Config.findOneAndUpdate({ key: 'principal_name' }, { value: info.principalName || '' }, { upsert: true });
  }

  // Academic year – if sent, create/update active year
  if (academicYear) {
    const { name, startDate, endDate, terms } = academicYear;
    // Deactivate all other years
    await AcademicYear.updateMany({}, { isActive: false });
    let year = await AcademicYear.findOne({ name, startDate, endDate });
    if (year) {
      year.terms = terms || [];
      year.isActive = true;
      await year.save();
    } else {
      year = await AcademicYear.create({
        name,
        startDate,
        endDate,
        terms: terms || [],
        isActive: true,
      });
    }
  }

  // Grade scales – replace entire list
  if (gradeScales && Array.isArray(gradeScales)) {
    await GradeScale.deleteMany({});
    await GradeScale.insertMany(gradeScales);
  }

  // Return the updated settings (use the get logic)
  const updated = await getSettingsData();
  res.json(updated);
});

// helper to avoid duplication
async function getSettingsData() {
  {
    const [schoolInfo, activeYear, gradeScales] = await Promise.all([
      getSchoolInfoSettings(),
      AcademicYear.findOne({ isActive: true }),
      GradeScale.find().sort('minPercentage'),
    ]);

    return {
      schoolInfo,
      academicYear: activeYear || null,
      gradeScales,
    };
  }

  const [schoolName, tagline, street, city, state, postal, phone, email, logo, principalName, principalSignature, schoolStamp] = await Promise.all([
    Config.findOne({ key: 'school_name' }),
    Config.findOne({ key: 'school_tagline' }),
    Config.findOne({ key: 'school_street' }),
    Config.findOne({ key: 'school_city' }),
    Config.findOne({ key: 'school_state' }),
    Config.findOne({ key: 'school_postal' }),
    Config.findOne({ key: 'school_phone' }),
    Config.findOne({ key: 'school_email' }),
    Config.findOne({ key: 'school_logo' }),
     Config.findOne({ key: 'principal_signature' }),   // ← ADD
  Config.findOne({ key: 'school_stamp' }),     
  ]);
  const activeYear = await AcademicYear.findOne({ isActive: true });
  const gradeScales = await GradeScale.find().sort('minPercentage');
  return {
    schoolInfo: {
      name: schoolName?.value || '',
      tagline: tagline?.value || '',
      street: street?.value || '',
      city: city?.value || '',
      state: state?.value || '',
      postal: postal?.value || '',
      phone: phone?.value || '',
      email: email?.value || '',

      logo: logo?.value || '',
      principalSignature: principalSignature?.value || '',   // ADD
  schoolStamp: schoolStamp?.value || '',  
    },
    academicYear: activeYear || null,
    gradeScales,
  };
}

// ----- Logo upload -----



const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw new Error('Please upload an image');

  // Build the public URL
  const logoUrl = `/uploads/logos/${req.file.filename}`;
  
  // Save the URL in the database
  await Config.findOneAndUpdate(
    { key: 'school_logo' },
    { value: logoUrl },
    { upsert: true }
  );

  res.json({ logo: logoUrl });
});

const deleteLogo = asyncHandler(async (req, res) => {
  // Optionally remove the file from disk
  const logoEntry = await Config.findOne({ key: 'school_logo' });
  if (logoEntry?.value) {
    const filePath = path.join(__dirname, '..', logoEntry.value);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await Config.findOneAndUpdate({ key: 'school_logo' }, { value: '' }, { upsert: true });
  res.json({ message: 'Logo removed' });
});

// POST /api/school-settings/academic-year/clone
const cloneAcademicYear = asyncHandler(async (req, res) => {
  const { newYearName, dateShift } = req.body;  // dateShift = number of days to add (usually 365)
  const sourceYear = await AcademicYear.findOne({ isActive: true });
  if (!sourceYear) throw new Error('No active academic year to clone');

  // Deactivate all others
  await AcademicYear.updateMany({}, { isActive: false });

  // Create new year with shifted dates
  const newYear = await AcademicYear.create({
    name: newYearName,
    startDate: new Date(sourceYear.startDate.getTime() + dateShift * 86400000),
    endDate: new Date(sourceYear.endDate.getTime() + dateShift * 86400000),
    terms: sourceYear.terms.map(t => ({
      name: t.name,
      startDate: new Date(t.startDate.getTime() + dateShift * 86400000),
      endDate: new Date(t.endDate.getTime() + dateShift * 86400000),
    })),
    isActive: true,
  });

  res.status(201).json(newYear);
});
const uploadPrincipalSignature = asyncHandler(async (req, res) => {
  const previous = await Config.findOne({ key: 'principal_signature' });
  const signatureUrl = await saveOfficialAsset({
    file: req.file,
    folder: 'signatures',
    prefix: 'principal-signature',
    previousUrl: previous?.value,
    options: {
      assetName: 'principal signature',
      minWidth: 180,
      minHeight: 45,
      maxWidth: 720,
      maxHeight: 220,
      requireWide: true,
    },
  });

  await Config.findOneAndUpdate(
    { key: 'principal_signature' },
    { value: signatureUrl },
    { upsert: true }
  );

  res.json({
    signature: signatureUrl,
    schoolInfo: await getSchoolInfoSettings(),
  });
});

const uploadSchoolStamp = asyncHandler(async (req, res) => {
  const previous = await Config.findOne({ key: 'school_stamp' });
  const stampUrl = await saveOfficialAsset({
    file: req.file,
    folder: 'stamps',
    prefix: 'school-stamp',
    previousUrl: previous?.value,
    options: {
      assetName: 'school stamp',
      minWidth: 100,
      minHeight: 100,
      maxWidth: 520,
      maxHeight: 520,
    },
  });

  await Config.findOneAndUpdate(
    { key: 'school_stamp' },
    { value: stampUrl },
    { upsert: true }
  );

  res.json({
    stamp: stampUrl,
    schoolInfo: await getSchoolInfoSettings(),
  });
});




module.exports = { getSettings, updateSettings, uploadLogo, deleteLogo, cloneAcademicYear,uploadPrincipalSignature,  
  uploadSchoolStamp, };
