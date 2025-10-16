// BEXIO API Integration Utility
// This file contains functions to interact with the BEXIO API for importing client data

export interface BexioClient {
  id: number;
  contact_type_id: number;
  name_1: string;
  name_2?: string;
  salutation_id?: number;
  salutation_form?: string;
  firstname?: string;
  lastname?: string;
  birthday?: string;
  address?: string;
  postcode?: string;
  city?: string;
  country_id?: number;
  mail?: string;
  mail_second?: string;
  phone_fixed?: string;
  phone_mobile?: string;
  fax?: string;
  url?: string;
  skype_name?: string;
  remarks?: string;
  language_id?: number;
  is_lead?: boolean;
  contact_group_ids?: number[];
  contact_branch_ids?: number[];
  user_id?: number;
  owner_id?: number;
  updated_at?: string;
}

export interface BexioApiConfig {
  apiKey: string;
  baseUrl: string;
}

export class BexioApiClient {
  private config: BexioApiConfig;

  constructor(config: BexioApiConfig) {
    this.config = config;
  }

  /**
   * Fetch all contacts/clients from BEXIO
   * In a real implementation, this would make actual API calls to BEXIO
   */
  async fetchClients(): Promise<BexioClient[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock BEXIO API response
    const mockBexioClients: BexioClient[] = [
      {
        id: 1,
        contact_type_id: 1,
        name_1: "BEXIO Software AG",
        firstname: "Max",
        lastname: "Mustermann",
        address: "Bahnhofstrasse 100",
        postcode: "8001",
        city: "Zürich",
        country_id: 1,
        mail: "max.mustermann@bexio-software.com",
        phone_fixed: "+41 44 123 45 67",
        phone_mobile: "+41 79 123 45 67",
        remarks: "Software development company",
        language_id: 1,
        is_lead: false,
        updated_at: "2024-01-15T10:30:00Z"
      },
      {
        id: 2,
        contact_type_id: 1,
        name_1: "Tech Solutions GmbH",
        firstname: "Anna",
        lastname: "Schmidt",
        address: "Musterstrasse 50",
        postcode: "3000",
        city: "Bern",
        country_id: 1,
        mail: "anna.schmidt@tech-solutions.ch",
        phone_fixed: "+41 31 987 65 43",
        phone_mobile: "+41 79 987 65 43",
        remarks: "IT consulting and support",
        language_id: 1,
        is_lead: false,
        updated_at: "2024-01-16T14:20:00Z"
      },
      {
        id: 3,
        contact_type_id: 1,
        name_1: "Digital Marketing AG",
        firstname: "Peter",
        lastname: "Weber",
        address: "Hauptstrasse 200",
        postcode: "4001",
        city: "Basel",
        country_id: 1,
        mail: "peter.weber@digital-marketing.ch",
        phone_fixed: "+41 61 555 12 34",
        phone_mobile: "+41 79 555 12 34",
        remarks: "Digital marketing and advertising agency",
        language_id: 1,
        is_lead: false,
        updated_at: "2024-01-17T09:15:00Z"
      }
    ];

    // In a real implementation, you would make an HTTP request like this:
    /*
    const response = await fetch(`${this.config.baseUrl}/2.0/contact`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`BEXIO API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
    */

    return mockBexioClients;
  }

  /**
   * Convert BEXIO client data to our internal client format
   */
  convertBexioClientToInternal(bexioClient: BexioClient, createdBy: string, createdByName: string) {
    return {
      id: `bexio_${bexioClient.id}`,
      clientName: bexioClient.name_1,
      contactPerson: `${bexioClient.firstname || ''} ${bexioClient.lastname || ''}`.trim() || bexioClient.name_1,
      address: `${bexioClient.address || ''}, ${bexioClient.postcode || ''} ${bexioClient.city || ''}`.replace(/^,\s*|,\s*$/g, ''),
      notes: `Imported from BEXIO - ${bexioClient.remarks || 'No additional notes'}`,
      email: bexioClient.mail || undefined,
      phone: bexioClient.phone_fixed || bexioClient.phone_mobile || undefined,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      createdBy,
      createdById: createdBy,
      createdByName
    };
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // In a real implementation, you would make a simple API call to test the connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful connection test
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Helper function to import clients from BEXIO
 */
export async function importClientsFromBexio(
  apiKey: string, 
  baseUrl: string = 'https://api.bexio.com',
  createdBy: string,
  createdByName: string
) {
  const bexioClient = new BexioApiClient({ apiKey, baseUrl });
  
  try {
    // Test connection first
    const isConnected = await bexioClient.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to BEXIO API. Please check your API key.');
    }

    // Fetch clients from BEXIO
    const bexioClients = await bexioClient.fetchClients();
    
    // Convert to internal format
    const internalClients = bexioClients.map(client => 
      bexioClient.convertBexioClientToInternal(client, createdBy, createdByName)
    );

    return internalClients;
  } catch (error) {
    throw error;
  }
}
