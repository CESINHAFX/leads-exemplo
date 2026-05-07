import { Lead } from '../../types/lead';
import { Interaction } from '../../types/interaction';

export interface CRMUpsertResult {
  success: boolean;
  contactId?: string;
  error?: string;
}

export interface CRMInteractionResult {
  success: boolean;
  error?: string;
}

export interface CRMProvider {
  isEnabled(): boolean;
  upsertLead(lead: Lead): Promise<CRMUpsertResult>;
  logInteraction(
    interaction: Interaction,
    contactId: string
  ): Promise<CRMInteractionResult>;
  healthCheck(): Promise<boolean>;
}
