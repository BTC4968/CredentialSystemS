// Server-side PDF Export Utility
// This version uses jsPDF for server-side PDF generation

const jsPDF = require('jspdf').jsPDF;

// PDF Export Configuration Interface
export interface PDFConfig {
  companyName: string;
  companyLogo?: string; // Base64 encoded image or URL
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

// Client and Credential interfaces (matching the database schema)
interface Client {
  id: string;
  clientName: string;
  contactPerson: string;
  address: string;
  notes?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  createdBy: string;
  createdById: string;
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
}

interface Credential {
  id: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  username: string;
  password: string; // Encrypted
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  createdBy: string;
  createdById: string;
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
}

// Server-side PDF Export Class
export class PDFExporter {
  private config: PDFConfig;
  private doc: any;

  constructor(config: PDFConfig) {
    this.config = config;
    this.doc = new jsPDF();
    this.setupDocument();
  }

  private setupDocument() {
    // Set document properties
    this.doc.setProperties({
      title: 'Client Credentials Report',
      subject: 'Secure Credential Information',
      author: this.config.companyName,
      creator: 'Credential Management System'
    });

    // Set default font
    this.doc.setFont(this.config.fontFamily);
  }

  /**
   * Export credentials for a single client to PDF
   */
  async exportClientCredentials(
    client: Client,
    credentials: Credential[],
    decryptPassword: (encryptedPassword: string) => string
  ): Promise<Buffer> {
    // Reset document
    this.doc = new jsPDF();
    this.setupDocument();

    let yPosition = 20;

    // Add header with logo and company info
    yPosition = await this.addHeader(yPosition);

    // Add client information
    yPosition = this.addClientInfo(client, yPosition);

    // Add greeting
    yPosition = this.addGreeting(yPosition);

    // Add credentials table
    yPosition = this.addCredentialsTable(credentials, decryptPassword, yPosition);

    // Add closing
    yPosition = this.addClosing(yPosition);

    // Add footer
    this.addFooter();

    // Add watermark if specified
    if (this.config.watermark) {
      this.addWatermark();
    }

    // Return PDF as buffer
    return Buffer.from(this.doc.output('arraybuffer'));
  }

  private async addHeader(yPosition: number): Promise<number> {
    // Company logo (if provided)
    if (this.config.companyLogo) {
      try {
        // For now, we'll add a placeholder for the logo
        // In a real implementation, you would load and add the actual logo
        this.doc.setFillColor(this.config.primaryColor);
        this.doc.rect(20, yPosition, 30, 20, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(8);
        this.doc.text('LOGO', 25, yPosition + 12);
        yPosition += 25;
      } catch (error) {
        // Logo loading failed, continue without logo
      }
    }

    // Company name
    this.doc.setTextColor(this.config.primaryColor);
    this.doc.setFontSize(20);
    this.doc.setFont(this.config.fontFamily, 'bold');
    this.doc.text(this.config.companyName, 20, yPosition);
    yPosition += 10;

    // Company details
    this.doc.setTextColor(this.config.secondaryColor);
    this.doc.setFontSize(10);
    this.doc.setFont(this.config.fontFamily, 'normal');
    
    const addressLines = this.config.companyAddress.split('\n');
    addressLines.forEach((line, index) => {
      this.doc.text(line, 20, yPosition + (index * 4));
    });
    yPosition += addressLines.length * 4 + 5;

    // Contact information
    if (this.config.companyPhone) {
      this.doc.text(`Phone: ${this.config.companyPhone}`, 20, yPosition);
      yPosition += 4;
    }
    if (this.config.companyEmail) {
      this.doc.text(`Email: ${this.config.companyEmail}`, 20, yPosition);
      yPosition += 4;
    }
    if (this.config.companyWebsite) {
      this.doc.text(`Website: ${this.config.companyWebsite}`, 20, yPosition);
      yPosition += 4;
    }

    // Add timestamp if enabled
    if (this.config.includeTimestamp) {
      yPosition += 5;
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, yPosition);
      yPosition += 10;
    }

    // Add separator line
    this.doc.setDrawColor(this.config.primaryColor);
    this.doc.setLineWidth(0.5);
    this.doc.line(20, yPosition, 190, yPosition);
    yPosition += 15;

    return yPosition;
  }

  private addClientInfo(client: Client, yPosition: number): number {
    this.doc.setTextColor(this.config.primaryColor);
    this.doc.setFontSize(14);
    this.doc.setFont(this.config.fontFamily, 'bold');
    this.doc.text('Client Information', 20, yPosition);
    yPosition += 10;

    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(10);
    this.doc.setFont(this.config.fontFamily, 'normal');

    // Client details in a structured format
    const clientInfo = [
      `Client Name: ${client.clientName}`,
      `Contact Person: ${client.contactPerson}`,
      `Address: ${client.address}`,
      client.email ? `Email: ${client.email}` : '',
      client.phone ? `Phone: ${client.phone}` : '',
      client.notes ? `Notes: ${client.notes}` : ''
    ].filter(Boolean);

    clientInfo.forEach((info, index) => {
      this.doc.text(info, 25, yPosition + (index * 5));
    });

    yPosition += clientInfo.length * 5 + 15;
    return yPosition;
  }

  private addGreeting(yPosition: number): number {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(11);
    this.doc.setFont(this.config.fontFamily, 'normal');
    
    const greetingLines = this.config.greeting.split('\n');
    greetingLines.forEach((line, index) => {
      this.doc.text(line, 20, yPosition + (index * 5));
    });

    yPosition += greetingLines.length * 5 + 10;
    return yPosition;
  }

  private addCredentialsTable(
    credentials: Credential[],
    decryptPassword: (encryptedPassword: string) => string,
    yPosition: number
  ): number {
    this.doc.setTextColor(this.config.primaryColor);
    this.doc.setFontSize(14);
    this.doc.setFont(this.config.fontFamily, 'bold');
    this.doc.text('Credential Information', 20, yPosition);
    yPosition += 10;

    // Table headers
    const headers = ['Service', 'Username/Email', 'Password', 'Notes'];
    const colWidths = [40, 50, 40, 50];
    const colPositions = [20, 60, 110, 150];

    // Header background
    this.doc.setFillColor(this.config.primaryColor);
    this.doc.rect(20, yPosition - 5, 170, 8, 'F');

    // Header text
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(9);
    this.doc.setFont(this.config.fontFamily, 'bold');
    headers.forEach((header, index) => {
      this.doc.text(header, colPositions[index], yPosition);
    });

    yPosition += 10;

    // Credential rows
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(8);
    this.doc.setFont(this.config.fontFamily, 'normal');

    credentials.forEach((credential, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        this.doc.addPage();
        yPosition = 20;
      }

      // Row background (alternating colors)
      if (index % 2 === 0) {
        this.doc.setFillColor(248, 250, 252);
        this.doc.rect(20, yPosition - 3, 170, 12, 'F');
      }

      // Service name
      this.doc.text(credential.serviceName, colPositions[0], yPosition + 2);

      // Username
      this.doc.text(credential.username, colPositions[1], yPosition + 2);

      // Password (decrypted)
      const decryptedPassword = decryptPassword(credential.password);
      this.doc.text(decryptedPassword, colPositions[2], yPosition + 2);

      // Notes (truncated if too long)
      const notes = credential.notes && credential.notes.length > 30 
        ? credential.notes.substring(0, 30) + '...' 
        : credential.notes || 'N/A';
      this.doc.text(notes, colPositions[3], yPosition + 2);

      yPosition += 12;
    });

    yPosition += 10;
    return yPosition;
  }

  private addClosing(yPosition: number): number {
    // Check if we need a new page
    if (yPosition > 200) {
      this.doc.addPage();
      yPosition = 20;
    }

    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(11);
    this.doc.setFont(this.config.fontFamily, 'normal');
    
    const closingLines = this.config.closing.split('\n');
    closingLines.forEach((line, index) => {
      this.doc.text(line, 20, yPosition + (index * 5));
    });

    yPosition += closingLines.length * 5 + 20;
    return yPosition;
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.doc.setDrawColor(this.config.primaryColor);
      this.doc.setLineWidth(0.5);
      this.doc.line(20, 280, 190, 280);

      // Page numbers
      if (this.config.includePageNumbers) {
        this.doc.setTextColor(this.config.secondaryColor);
        this.doc.setFontSize(8);
        this.doc.setFont(this.config.fontFamily, 'normal');
        this.doc.text(`Page ${i} of ${pageCount}`, 20, 285);
      }

      // Company name in footer
      this.doc.text(this.config.companyName, 150, 285);
    }
  }

  private addWatermark(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Save current graphics state
      this.doc.saveGraphicsState();
      
      // Set watermark properties
      this.doc.setTextColor(200, 200, 200);
      this.doc.setFontSize(50);
      this.doc.setFont(this.config.fontFamily, 'bold');
      
      // Rotate and position watermark
      this.doc.setGState(new (this.doc as any).GState({ opacity: 0.1 }));
      this.doc.text(this.config.watermark!, 105, 150, {
        angle: 45,
        align: 'center'
      });
      
      // Restore graphics state
      this.doc.restoreGraphicsState();
    }
  }
}
