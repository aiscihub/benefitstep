/** BenefitStep local policy engine. No I/O, model calls or government decisions. */
export type Program = 'calfresh' | 'medi_cal';
export type Stage = 'quick' | 'details' | 'followup';
export type Importance = 'GATE' | 'PATH' | 'CALCULATION' | 'SUPPORTING';
export type FactStatus = 'known' | 'unknown' | 'declined' | 'deferred' | 'conflict';
export type Interval = {min: number; max: number | null; referenceId?: string; householdSize?: number};
export type Scalar = string | number | boolean | null;
export type Value = Scalar | Interval | Scalar[];
export interface Fact {
  id: string; key: string; subject: string; programs: Program[];
  status: FactStatus; value?: Value; revision: number;
  origin: 'user' | 'document' | 'derived'; confirmedRevision?: number;
  evidenceIds?: string[]; validFrom: string; validThrough: string;
  basis?: string; dependencies?: {id: string; revision: number}[];
}
export interface Person {id: string; appliesFor: Program[]; sensitiveConsent?: string[]}
export type PeriodBasis = 'earned' | 'received' | 'service' | 'issued' | 'unspecified';
export interface Evidence {
  id: string; subject: string; programs: Program[]; category: string;
  period?: {from: string; through: string}; periodBasis?: PeriodBasis; readable: boolean;
  missingPages?: boolean; sha256?: string; integrityConcern?: boolean;
  fields?: Record<string, number>; // Integer cents, only for supported consistency checks.
}
export interface EvidenceRequest {
  id: string; program: Program; subject: string; category: string;
  period?: {from: string; through: string}; periodBasis?: PeriodBasis; dueDate?: string;
  sourceEvidenceId: string; confirmed: boolean; sentEvidenceIds?: string[];
}
export interface Input {
  asOf: string; stage: Stage; selectedPrograms: Program[]; people: Person[];
  facts: Fact[]; evidence?: Evidence[]; requests?: EvidenceRequest[];
}
export type Expr =
  | {literal: Value}
  | {fact: string; scope?: 'subject' | 'household'; minTrust?: 'reported' | 'confirmed'}
  | {context: 'asOf' | 'stage'}
  | {op: string; args: Expr[]; table?: string};
export type OutcomeStatus = 'reported_condition_met' | 'reference_only' | 'within_reference' |
  'above_reference' | 'needs_information' | 'needs_review' | 'pathway_to_review' |
  'not_applicable' | 'deferred' | 'stale_policy' | 'policy_not_released';
export interface Outcome {
  status: OutcomeStatus; code: string; text: string; action?: string;
  alternatives?: {id: string; status: 'referral_only'; reason: string}[];
  computed?: Record<string, Expr>;
}
export interface Rule {
  id: string; dimension: string; importance: Importance; scope: 'household' | 'applicant';
  stages: Stage[]; sourceIds: string[]; implementation: 'executable' | 'review_only';
  window?: {from: string; through: string};
  when?: Expr; branches: {when: Expr; then: Outcome}[]; otherwise: Outcome;
  priority: number; notes?: string;
}
export interface Question {
  id: string; factKey: string; text: string; help: string; type: 'boolean' | 'integer' | 'enum' | 'interval' | 'date';
  scope: 'person' | 'household'; programs: Program[]; priority: number;
  choices?: {value: string; label: string}[]; min?: number; max?: number;
  sensitivity?: string; uiCollect: boolean; preparationAction?: string;
  evidenceCategory?: string[];
}
export interface SourceRecord {
  id: string; title: string; url: string; authority: string; locator: string;
  retrievedOn: string; status: 'research_checked'; limitation: string;
  supersedes?: string[];
}
export interface Table {
  id: string; title: string; sourceIds: string[]; unit: 'USD_cents';
  from: string; through: string; rows: Record<string, number>; incrementAfter?: {row: number; amount: number; maximumRow: number};
}
export interface BenefitConfig {
  id: Program; name: string; agency: string; geography: string;
  policyVersion: string; supportedWindow: {from: string; through: string};
  fullEligibilityImplemented: false;
  dimensions: {id: string; importance: Importance; description: string; coverage: string}[];
  rules: Rule[]; sourceIds: string[];
  officialApplication: string; rosterPrompt: string;
}
export interface Derivation {id: string; program: Program; key: string; when: Expr; value: Expr; sourceIds: string[]}
export interface Bundle {
  schemaVersion: '1.0'; id: string; version: string;
  release: {status: 'research_preview' | 'approved'; reviewers: string[]};
  derivations?: Derivation[]; questions: Question[]; sources: SourceRecord[]; tables: Table[]; benefits: BenefitConfig[];
}
export interface Cell {
  known: boolean; value?: Value; missing: string[]; reasons: string[]; factIds: string[]; sourceIds: string[];
}
export interface Finding extends Omit<Outcome, 'computed'> {
  ruleId: string; dimension: string; importance: Importance; subject: string; program: Program;
  sourceIds: string[]; usedFactIds: string[]; missingKeys: string[]; reasons: string[];
  computed: Record<string, Value>; implementation: Rule['implementation'];
}
export interface NextQuestion extends Question {
  subject: string; forPrograms: Program[]; justifiedBy: string[]; sourceIds: string[];
  suggestedEvidence: string[];
}
export interface ProgramResult {
  program: Program; status: 'needs_more_information' | 'needs_review' | 'limited_checks_complete' | 'policy_unavailable';
  findings: Finding[]; notAssessed: string[]; fullEligibilityImplemented: false; coverage: {dimension:string;coverage:string}[]; canContinuePreparation: true; canOpenOfficialApplication: true;
  officialApplication: string;
}
export interface Evaluation {
  engineVersion: string; policyBundle: string; policyVersion: string; asOf: string; stage: Stage;
  mode: 'preview' | 'released'; authoritative: false; approvalPrediction: null;
  results: ProgramResult[]; nextQuestions: NextQuestion[]; blockedQuestions: NextQuestion[];
  requiredActions: {program: Program; subject: string; code: string; text: string}[];
  packageIssues: PackageIssue[]; warnings: string[];
}
export interface PackageIssue {
  id: string; code: string; level: 'attention' | 'clarification' | 'request';
  text: string; action: string; evidenceIds: string[]; program?: Program;
  subject: string; affectedAnswerPaused: boolean; filingBlocked: false; dueDate?: string;
}
