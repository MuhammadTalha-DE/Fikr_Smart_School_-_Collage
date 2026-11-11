/**
 * Template Render Service
 * 
 * Renders document templates by replacing placeholders with resolved data.
 * Supports Handlebars-like syntax: {{student.name}}, {{school.name}}, etc.
 * Also supports loops: {{#each results}}...{{/each}}
 * And conditionals: {{#if condition}}...{{/if}}
 */

/**
 * Replace placeholders in a string with actual data values
 * Supports nested paths like student.name, school.logo, etc.
 */
function replacePlaceholders(template, data) {
  if (!template) return '';

  let result = template;

  // Process {{#each array}}...{{/each}} blocks
  result = result.replace(/\{\{#each\s+([^}]+)\}\}(.*?)\{\{\/each\}\}/gs, (match, arrayPath, blockTemplate) => {
    const array = resolveNestedPath(data, arrayPath.trim());
    if (!Array.isArray(array) || array.length === 0) return '';
    
    return array.map(item => {
      // For each item, we need to resolve {{this}} and any nested properties
      let itemResult = blockTemplate;
      
      // Replace {{this.property}} with item.property
      itemResult = itemResult.replace(/\{\{this\.([^}]+)\}\}/g, (m, prop) => {
        const val = resolveNestedPath(item, prop.trim());
        return val !== null && val !== undefined ? String(val) : '';
      });
      
      // Replace {{this}} with the item itself (if primitive)
      itemResult = itemResult.replace(/\{\{this\}\}/g, () => {
        return typeof item === 'object' ? JSON.stringify(item) : String(item);
      });
      
      return itemResult;
    }).join('');
  });

  // Process {{#if condition}}...{{else}}...{{/if}} blocks
  result = result.replace(/\{\{#if\s+([^}]+)\}\}(.*?)(?:\{\{else\}\}(.*?))?\{\{\/if\}\}/gs, (match, condition, ifBlock, elseBlock = '') => {
    const value = resolveNestedPath(data, condition.trim());
    const isTruthy = value !== null && value !== undefined && value !== false && value !== '' && value !== 0;
    return isTruthy ? ifBlock : elseBlock;
  });

  // Replace {{path.to.value}} placeholders after blocks are expanded.
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmedPath = path.trim();

    if (trimmedPath.startsWith('#') || trimmedPath.startsWith('/')) {
      return '';
    }

    const value = resolveNestedPath(data, trimmedPath);
    
    if (value === null || value === undefined) {
      return ''; // Return empty string for missing values
    }

    if (trimmedPath.startsWith('document.customFields.')) {
      return escapeHtml(typeof value === 'object' ? JSON.stringify(value) : value);
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  });

  return result;
}

/**
 * Resolve a nested path like "student.name" or "school.logo" in a data object
 */
function resolveNestedPath(obj, path) {
  if (!obj || !path) return null;
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return null;
    
    if (typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  
  return current;
}

/**
 * Build a flat key-value map for simple placeholder replacement
 * from the nested data structure
 */
function buildFlatDataMap(data, prefix = '') {
  const map = {};
  
  function flatten(obj, currentPath) {
    if (!obj || typeof obj !== 'object') {
      map[currentPath] = obj;
      return;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      map[currentPath] = obj;
      obj.forEach((item, index) => {
        flatten(item, `${currentPath}[${index}]`);
      });
      return;
    }
    
    for (const key of Object.keys(obj)) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(typeof obj[key] === 'string' && (obj[key].startsWith('data:') || obj[key].startsWith('http')))) {
        flatten(obj[key], newPath);
      } else {
        map[newPath] = obj[key];
      }
    }
  }
  
  flatten(data, prefix);
  return map;
}

/**
 * Render a document template with data
 * Returns the rendered HTML/content string
 */
function renderTemplate(templateContent, data) {
  return replacePlaceholders(templateContent, data);
}

function normalizeCssValue(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getFieldRawValue(field, data) {
  if (field.customInput && field.key) {
    const customValue = resolveNestedPath(data, `document.customFields.${field.key}`);
    if (customValue !== null && customValue !== undefined && customValue !== '') return customValue;
  }

  if (field.placeholder) {
    return renderTemplate(field.placeholder, data);
  }

  if (field.key) {
    const keyPath = field.key.includes('.') ? field.key : `document.${field.key}`;
    const value = resolveNestedPath(data, keyPath);
    if (value !== null && value !== undefined && value !== '') return value;
  }

  return field.defaultValue || '';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function renderTemplateFields(fields = [], data) {
  if (!Array.isArray(fields) || fields.length === 0) return '';

  return fields.map((field, index) => {
    const x = normalizeCssValue(field.x, 0);
    const y = normalizeCssValue(field.y, 0);
    const width = normalizeCssValue(field.width, 180);
    const height = normalizeCssValue(field.height, 28);
    const fontSize = normalizeCssValue(field.fontSize, 12);
    const color = field.fontColor || '#0f172a';
    const fontWeight = field.fontWeight || 'normal';
    const textAlign = field.textAlign || 'left';
    const rawValue = getFieldRawValue(field, data);
    const value = field.customInput ? escapeHtml(rawValue ?? '') : rawValue;
    const commonStyle = `
      position:absolute;
      left:${x}px;
      top:${y}px;
      width:${width}px;
      height:${height}px;
      font-size:${fontSize}px;
      color:${color};
      font-weight:${fontWeight};
      text-align:${textAlign};
      z-index:20;
      overflow:hidden;
      display:flex;
      align-items:center;
      justify-content:${textAlign === 'right' ? 'flex-end' : textAlign === 'center' ? 'center' : 'flex-start'};
    `;

    if (field.customInput) {
      return `<div data-field="${field.key || index}" style="${commonStyle}">${value}</div>`;
    }

    if (['image', 'signature', 'stamp'].includes(field.type)) {
      const imageSrc = value || resolveNestedPath(data, field.type === 'image' ? 'student.photoDataUrl' : field.type === 'signature' ? 'school.signatureDataUrl' : 'school.stampDataUrl');
      if (!imageSrc) return '';
      return `<img data-field="${field.key || index}" src="${imageSrc}" style="${commonStyle}object-fit:contain;" />`;
    }

    if (field.type === 'qr') {
      const qrSrc = value || resolveNestedPath(data, 'document.qrCodeDataUrl');
      if (qrSrc && String(qrSrc).startsWith('data:')) {
        return `<img data-field="${field.key || index}" src="${qrSrc}" style="${commonStyle}object-fit:contain;" />`;
      }
      return `<div data-field="${field.key || index}" style="${commonStyle}font-family:monospace;border:1px solid #cbd5e1;padding:4px;">${value || resolveNestedPath(data, 'document.verificationCode') || ''}</div>`;
    }

    if (field.type === 'barcode') {
      return `<div data-field="${field.key || index}" style="${commonStyle}font-family:'Courier New',monospace;letter-spacing:2px;border-top:2px solid ${color};border-bottom:2px solid ${color};">${value}</div>`;
    }

    return `<div data-field="${field.key || index}" style="${commonStyle}">${value}</div>`;
  }).join('');
}

/**
 * Generate HTML for a document based on template and data
 */
function generateDocumentHtml(template, data) {
  const { layout, content, headerTemplate, footerTemplate, watermark } = template;
  
  // Render header
  const headerHtml = headerTemplate ? renderTemplate(headerTemplate, data) : '';
  
  // Render body
  const bodyHtml = renderTemplate(content, data);
  
  // Render footer
  const footerHtml = footerTemplate ? renderTemplate(footerTemplate, data) : '';

  const fieldHtml = renderTemplateFields(template.fields, data);
  
  // Watermark style
  const watermarkStyle = watermark?.text ? `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: ${watermark.fontSize || 60}px;
    color: ${watermark.color || '#cccccc'};
    opacity: ${watermark.opacity || 0.1};
    pointer-events: none;
    z-index: 1000;
    white-space: nowrap;
  ` : '';
  
  const orientation = layout?.orientation || 'landscape';
  const width = layout?.width || (orientation === 'landscape' ? 842 : 595);
  const height = layout?.height || (orientation === 'landscape' ? 595 : 842);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: ${width}px ${height}px;
      margin: ${layout?.margins?.top || 20}px ${layout?.margins?.right || 20}px ${layout?.margins?.bottom || 20}px ${layout?.margins?.left || 20}px;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      background: ${layout?.backgroundColor || '#ffffff'};
      width: ${width}px;
      min-height: ${height}px;
      position: relative;
    }
    
    .document-container {
      width: 100%;
      min-height: ${height}px;
      padding: ${layout?.margins?.top || 20}px ${layout?.margins?.right || 20}px ${layout?.margins?.bottom || 20}px ${layout?.margins?.left || 20}px;
      position: relative;
    }
    
    ${watermark?.text ? `.watermark { ${watermarkStyle} }` : ''}
    
    .header-section {
      width: 100%;
      margin-bottom: 20px;
    }
    
    .footer-section {
      width: 100%;
      position: absolute;
      bottom: ${layout?.margins?.bottom || 20}px;
      left: ${layout?.margins?.left || 20}px;
      right: ${layout?.margins?.right || 20}px;
    }
    
    .school-logo {
      max-width: 80px;
      max-height: 80px;
    }
    
    .school-name {
      font-size: 24px;
      font-weight: bold;
      color: ${layout?.borderColor || '#1e3a8a'};
    }
    
    .document-title {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      margin: 15px 0;
      text-transform: uppercase;
    }
    
    .content-section {
      margin: 20px 0;
      line-height: 1.6;
    }
    
    .signature-section {
      margin-top: 40px;
      text-align: right;
    }
    
    .field-label {
      font-weight: bold;
    }
    
    .student-photo {
      width: 100px;
      height: 120px;
      object-fit: cover;
      border: 1px solid #ccc;
    }
    
    .qr-code {
      width: 80px;
      height: 80px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    
    table, th, td {
      border: 1px solid #ccc;
    }
    
    th, td {
      padding: 8px 12px;
      text-align: left;
    }
    
    th {
      background-color: #f8fafc;
      font-weight: bold;
    }
    
    .border-frame {
      border: ${layout?.borderWidth || 2}px solid ${layout?.borderColor || '#1e3a8a'};
      padding: 10px;
      border-radius: 4px;
    }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    
    .id-card {
      width: ${width - 40}px;
      border: 2px solid #1e3a8a;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .id-card-header {
      background: #1e3a8a;
      color: white;
      padding: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .id-card-body {
      padding: 15px;
    }
    
    .id-card-footer {
      background: #f8fafc;
      padding: 10px;
      font-size: 12px;
      text-align: center;
    }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="document-container">
    ${watermark?.text ? `<div class="watermark">${renderTemplate(watermark.text, data)}</div>` : ''}
    
    ${headerHtml ? `<div class="header-section">${headerHtml}</div>` : ''}
    
    <div class="content-section">
      ${bodyHtml}
    </div>

    ${fieldHtml}
    
    ${footerHtml ? `<div class="footer-section">${footerHtml}</div>` : ''}
  </div>
</body>
</html>`;
}

module.exports = {
  replacePlaceholders,
  resolveNestedPath,
  buildFlatDataMap,
  renderTemplate,
  renderTemplateFields,
  generateDocumentHtml,
};
