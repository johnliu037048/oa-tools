const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ALLOWED_SOURCES = ['.doc', '.docx', '.ppt', '.pptx', '.pdf', '.png', '.jpg', '.jpeg'];
const ALLOWED_TARGETS = {
  '.doc': ['pdf'],
  '.docx': ['pdf'],
  '.ppt': ['pdf'],
  '.pptx': ['pdf'],
  '.png': ['pdf'],
  '.jpg': ['pdf'],
  '.jpeg': ['pdf'],
  '.pdf': ['docx', 'pptx']
};
const CONVERT_FILTERS = {
  pdf: 'pdf',
  docx: 'docx',
  pptx: 'pptx'
};

// PDF has no default import/export filter pairing, so it must be named explicitly
const PDF_SOURCE_FILTERS = {
  docx: { infilter: 'writer_pdf_import', outfilter: 'docx:MS Word 2007 XML' },
  pptx: { infilter: 'draw_pdf_import', outfilter: 'pptx:Impress MS PowerPoint 2007 XML' }
};

const findLibreOffice = () => {
  const candidates = [
    process.env.LIBREOFFICE_PATH,
    'C:\\Program Files\\LibreOffice\\program\\soffice.com',
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    '/usr/bin/soffice',
    '/usr/bin/libreoffice',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice'
  ].filter(Boolean);

  return candidates.find(candidate => fs.existsSync(candidate)) || null;
};

const decodeFileName = (name = '') => {
  try {
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch {
    return name;
  }
};

const validateConversion = (sourceExt, target) => {
  const allowed = ALLOWED_TARGETS[sourceExt] || [];
  if (!allowed.includes(target)) {
    throw new Error(`不支持从 ${sourceExt || '未知格式'} 转换到 ${target}`);
  }
};

const runLibreOffice = (bin, args) => new Promise((resolve, reject) => {
  const child = spawn(bin, args, { windowsHide: true });
  let output = '';
  const timer = setTimeout(() => {
    child.kill();
    reject(new Error('转换超时，请缩小文件后重试'));
  }, 180000);

  child.stdout.on('data', chunk => {
    output += chunk.toString();
  });
  child.stderr.on('data', chunk => {
    output += chunk.toString();
  });
  child.on('error', error => {
    clearTimeout(timer);
    reject(error);
  });
  child.on('close', code => {
    clearTimeout(timer);
    // LibreOffice may report filter errors while still exiting with code 0
    const failure = output.split(/\r?\n/).find(line => line.trim().startsWith('Error:'));
    if (code === 0 && !failure) {
      resolve();
      return;
    }
    reject(new Error(failure?.replace(/^Error:\s*/, '').trim() || `LibreOffice 退出码 ${code}`));
  });
});

const convertWithLibreOffice = async (inputPath, outputDir, target, profileDir) => {
  const bin = findLibreOffice();
  if (!bin) {
    throw new Error('未检测到 LibreOffice，请安装后重试，或设置 LIBREOFFICE_PATH');
  }

  fs.mkdirSync(outputDir, { recursive: true });
  if (profileDir) fs.mkdirSync(profileDir, { recursive: true });

  const isPdfSource = path.extname(inputPath).toLowerCase() === '.pdf';
  const pdfFilters = isPdfSource ? PDF_SOURCE_FILTERS[target] : null;
  const args = ['--headless', '--norestore'];

  if (pdfFilters) {
    args.push(`--infilter=${pdfFilters.infilter}`);
  }
  args.push(
    '--convert-to',
    pdfFilters?.outfilter || CONVERT_FILTERS[target] || target,
    '--outdir',
    outputDir,
    inputPath
  );

  await runLibreOffice(bin, args);

  const expected = path.join(
    outputDir,
    `${path.basename(inputPath, path.extname(inputPath))}.${target}`
  );
  if (fs.existsSync(expected)) {
    return expected;
  }

  const generated = fs.readdirSync(outputDir).find(name => name.toLowerCase().endsWith(`.${target}`));
  if (!generated) {
    throw new Error('转换完成但未找到输出文件');
  }
  return path.join(outputDir, generated);
};

module.exports = {
  ALLOWED_SOURCES,
  ALLOWED_TARGETS,
  findLibreOffice,
  decodeFileName,
  validateConversion,
  convertWithLibreOffice
};
