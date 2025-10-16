import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';
import { decrypt } from '@/lib/encryption';
import { SecurityManager } from '@/lib/security';
import { auditLogger, createAuditEntry, auditActions, auditResources } from '@/lib/audit';
import { UserRole } from '@prisma/client';
import puppeteer from 'puppeteer';

interface PDFConfig {
  companyName: string;
  companyLogo?: string;
  companyAddress: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  greeting: string;
  closing: string;
  includeTimestamp: boolean;
  includePageNumbers: boolean;
  watermark?: string;
}

interface Credential {
  id: string;
  serviceName: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  clientName: string;
  createdAt: string;
}

interface Client {
  id: string;
  clientName: string;
  contactPerson: string;
  address: string;
  email?: string;
  phone?: string;
}

export const POST = requireAuth(async (request: NextRequest, user) => {
  const mongoClient = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
  
  try {
    const body = await request.json();
    const { clientId, pdfConfig } = SecurityManager.sanitizeInput(body);

    // Validate required fields
    if (!clientId) {
      await auditLogger.log(createAuditEntry(
        user,
        auditActions.EXPORT_PDF,
        auditResources.CREDENTIAL,
        { error: 'Missing client ID' },
        false,
        'Missing client ID',
        { ip: request.headers.get('x-forwarded-for') || 'unknown', headers: Object.fromEntries(request.headers) }
      ));
      
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Check if user can export data
    if (!SecurityManager.canExportData(user)) {
      await auditLogger.log(createAuditEntry(
        user,
        auditActions.EXPORT_PDF,
        auditResources.CREDENTIAL,
        { clientId },
        false,
        'Export permission denied',
        { ip: request.headers.get('x-forwarded-for') || 'unknown', headers: Object.fromEntries(request.headers) }
      ));
      
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await mongoClient.connect();
    const db = mongoClient.db('credential_manager');
    const credentialsCollection = db.collection('credentials');
    const clientsCollection = db.collection('clients');

    // Get client information
    const clientDoc = await clientsCollection.findOne({ _id: new ObjectId(clientId) });
    if (!clientDoc) {
      await auditLogger.log(createAuditEntry(
        user,
        auditActions.EXPORT_PDF,
        auditResources.CREDENTIAL,
        { clientId },
        false,
        'Client not found',
        { ip: request.headers.get('x-forwarded-for') || 'unknown', headers: Object.fromEntries(request.headers) }
      ));
      
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const clientInfo: Client = {
      id: clientDoc._id.toString(),
      clientName: clientDoc.clientName,
      contactPerson: clientDoc.contactPerson,
      address: clientDoc.address,
      email: clientDoc.email,
      phone: clientDoc.phone
    };

    // Get credentials for the client
    let whereClause: any = { clientId: new ObjectId(clientId) };
    
    if (user.role !== UserRole.ADMIN) {
      whereClause.createdById = new ObjectId(user.id);
    }

    const credentials = await credentialsCollection.find(whereClause).toArray();

    // Decrypt credentials
    const decryptedCredentials: Credential[] = credentials.map(cred => {
      try {
        const decryptedPassword = decrypt(cred.password);
        return {
          id: cred._id.toString(),
          serviceName: cred.serviceName,
          username: cred.username,
          password: decryptedPassword,
          url: cred.url || '',
          notes: cred.notes || '',
          clientName: cred.clientName,
          createdAt: cred.createdAt
        };
      } catch (error) {
        // Return with placeholder for failed decryption
        return {
          id: cred._id.toString(),
          serviceName: cred.serviceName,
          username: cred.username,
          password: '[PASSWORD ENCRYPTED - CONTACT ADMIN]',
          url: cred.url || '',
          notes: cred.notes || '',
          clientName: cred.clientName,
          createdAt: cred.createdAt
        };
      }
    });

    // Default PDF configuration
    const defaultConfig: PDFConfig = {
      companyName: 'Credential Management System',
      companyAddress: '123 Business Street, City, State 12345',
      companyPhone: '+1 (555) 123-4567',
      companyEmail: 'info@company.com',
      companyWebsite: 'www.company.com',
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      fontFamily: 'Arial, sans-serif',
      greeting: 'Dear Valued Client,',
      closing: 'Thank you for your business.',
      includeTimestamp: true,
      includePageNumbers: true,
      watermark: 'CONFIDENTIAL'
    };

    const config = { ...defaultConfig, ...pdfConfig };

    // Generate PDF
    const pdfBuffer = await generatePDF(clientInfo, decryptedCredentials, config, user);

    // Log successful PDF export
    await auditLogger.log(createAuditEntry(
      user,
      auditActions.EXPORT_PDF,
      auditResources.CREDENTIAL,
      { 
        clientId,
        clientName: clientInfo.clientName,
        credentialCount: decryptedCredentials.length,
        pdfSize: pdfBuffer.length
      },
      true,
      undefined,
      { ip: request.headers.get('x-forwarded-for') || 'unknown', headers: Object.fromEntries(request.headers) }
    ));

    // Return PDF as response
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${clientInfo.clientName}_credentials.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    // Log the error
    await auditLogger.log(createAuditEntry(
      user,
      auditActions.EXPORT_PDF,
      auditResources.CREDENTIAL,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      false,
      'Failed to generate PDF',
      { ip: request.headers.get('x-forwarded-for') || 'unknown', headers: Object.fromEntries(request.headers) }
    ));
    
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  } finally {
    await mongoClient.close();
  }
});

async function generatePDF(client: Client, credentials: Credential[], config: PDFConfig, user: any): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    const html = generateHTML(client, credentials, config, user);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = Buffer.from(await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; color: ${config.secondaryColor}; width: 100%; text-align: center; margin: 0 15mm;">
          <span>${config.companyName} - Confidential Document</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; color: ${config.secondaryColor}; width: 100%; text-align: center; margin: 0 15mm;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    }));

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

function generateHTML(client: Client, credentials: Credential[], config: PDFConfig, user: any): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Credentials Report - ${client.clientName}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm 15mm;
        }
        
        body {
          font-family: ${config.fontFamily};
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid ${config.primaryColor};
          padding-bottom: 20px;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: ${config.primaryColor};
          margin-bottom: 10px;
        }
        
        .company-details {
          font-size: 12px;
          color: ${config.secondaryColor};
          line-height: 1.4;
        }
        
        .document-info {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 25px;
        }
        
        .document-info h2 {
          color: ${config.primaryColor};
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        
        .client-info {
          background-color: #e9ecef;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 25px;
        }
        
        .client-info h3 {
          color: ${config.primaryColor};
          margin: 0 0 10px 0;
          font-size: 16px;
        }
        
        .credentials-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        
        .credentials-table th,
        .credentials-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        .credentials-table th {
          background-color: ${config.primaryColor};
          color: white;
          font-weight: bold;
        }
        
        .credentials-table tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: ${config.secondaryColor};
          text-align: center;
        }
        
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 48px;
          color: rgba(0, 0, 0, 0.1);
          z-index: -1;
          pointer-events: none;
        }
      </style>
    </head>
    <body>
      ${config.watermark ? `<div class="watermark">${config.watermark}</div>` : ''}
      
      <div class="header">
        <div class="company-name">${config.companyName}</div>
        <div class="company-details">
          ${config.companyAddress}<br>
          ${config.companyPhone ? `Phone: ${config.companyPhone}<br>` : ''}
          ${config.companyEmail ? `Email: ${config.companyEmail}<br>` : ''}
          ${config.companyWebsite ? `Website: ${config.companyWebsite}` : ''}
        </div>
      </div>
      
      <div class="document-info">
        <h2>Credentials Report</h2>
        <p><strong>Generated on:</strong> ${currentDate}</p>
        <p><strong>Generated by:</strong> ${user.name} (${user.email})</p>
        <p><strong>Total Credentials:</strong> ${credentials.length}</p>
      </div>
      
      <div class="client-info">
        <div class="info-section">
          <h3>Client Information</h3>
          <p><strong>Company:</strong> ${client.clientName}</p>
          <p><strong>Contact Person:</strong> ${client.contactPerson}</p>
          <p><strong>Address:</strong> ${client.address}</p>
          ${client.email ? `<p><strong>Email:</strong> ${client.email}</p>` : ''}
          ${client.phone ? `<p><strong>Phone:</strong> ${client.phone}</p>` : ''}
        </div>
      </div>
      
      <div class="greeting">
        <p>${config.greeting}</p>
        <p>Please find below the complete list of credentials for your account:</p>
      </div>
      
      <table class="credentials-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Username</th>
            <th>Password</th>
            <th>URL</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${credentials.map(cred => `
            <tr>
              <td>${cred.serviceName}</td>
              <td>${cred.username}</td>
              <td>${cred.password}</td>
              <td>${cred.url || ''}</td>
              <td>${cred.notes || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="closing">
        <p>${config.closing}</p>
      </div>
      
      <div class="footer">
        <p>This document contains confidential information. Please handle with care.</p>
        <p>Generated by ${config.companyName} - ${currentDate}</p>
      </div>
    </body>
    </html>
  `;
}
