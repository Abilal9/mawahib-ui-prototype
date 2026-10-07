import { apiRequest } from '../lib/apiClient';

export interface ApiInvoice {
  id: string;
  engagementId: string;
  paymentId: string;
  invoiceNumber: string;
  provider: string;
  status: string;
  currency: string;
  /** Decimal strings, e.g. "1250.00". */
  subtotal: string;
  taxAmount: string;
  total: string;
  originalFileName: string | null;
  /** True once a PDF exists and GET /invoices/:id/document will succeed. */
  hasDocument: boolean;
  /** Mock invoices are watermarked test documents, not fiscal invoices. */
  isTestDocument: boolean;
  issuedAt: string | null;
  createdAt: string;
}

export interface ApiInvoiceDocument {
  /** Short-lived signed URL. */
  url: string;
  originalFileName: string;
  mimeType: string;
}

export const invoicesApi = {
  listForEngagement(engagementId: string): Promise<ApiInvoice[]> {
    return apiRequest<ApiInvoice[]>(`/engagements/${engagementId}/invoices`);
  },

  get(id: string): Promise<ApiInvoice> {
    return apiRequest<ApiInvoice>(`/invoices/${id}`);
  },

  getDocument(id: string): Promise<ApiInvoiceDocument> {
    return apiRequest<ApiInvoiceDocument>(`/invoices/${id}/document`);
  },
};
