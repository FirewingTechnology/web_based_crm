export interface NextBestAction {
  lead_id: number;
  lead_name: string;
  current_status: string;
  suggested_next_status?: string | null;
  primary_action: string;
  suggested_channel: string;
  urgency: 'Normal' | 'High' | 'Urgent';
  talking_points: string[];
  stage_progression_readiness: boolean;
  blockers: string[];
  health_score: number;
  health_category: string;
}
