const fs = require('fs');
const path = require('path');

// List of API route files that need audit log fixes
const apiFiles = [
  'src/app/api/clients/[id]/route.ts',
  'src/app/api/credentials/route.ts',
  'src/app/api/credentials/[id]/route.ts',
  'src/app/api/credentials/[id]/decrypt/route.ts',
  'src/app/api/export/pdf/route.ts'
];

function fixAuditLogs(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace direct auditLog.create calls with try-catch blocks
    const auditLogPattern = /(\s+)(await prisma\.auditLog\.create\(\{[\s\S]*?\}\);\s*)/g;
    
    if (auditLogPattern.test(content)) {
      content = content.replace(auditLogPattern, (match, indent, auditCall) => {
        return `${indent}// Log the action (optional - may fail if MongoDB is not a replica set)
${indent}try {
${auditCall.replace(/^/gm, indent + '  ')}
${indent}} catch (auditError) {
${indent}  console.warn('Failed to create audit log:', auditError.message);
${indent}}`;
      });
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed audit logs in: ${filePath}`);
    } else {
      console.log(`ℹ️  No audit logs found in: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing audit log issues in API routes...');

apiFiles.forEach(fixAuditLogs);

console.log('🎉 Audit log fixes completed!');
