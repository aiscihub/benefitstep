export const POLICY_BUNDLE={
  "schemaVersion": "1.0",
  "id": "benefitstep.ca.2026q4",
  "version": "0.1.0",
  "release": {
    "status": "research_preview",
    "reviewers": []
  },
  "questions": [
    {
      "id": "q.shared.age_band",
      "factKey": "shared.age_band",
      "text": "Age group of this applicant",
      "help": "Used only for initial routing. A later condition may require age in years; never infer an exact age from this range.",
      "type": "enum",
      "scope": "person",
      "programs": [
        "medi_cal"
      ],
      "priority": 9,
      "uiCollect": true,
      "choices": [
        {
          "value": "under19",
          "label": "Under 19"
        },
        {
          "value": "19to64",
          "label": "19 to 64"
        },
        {
          "value": "65plus",
          "label": "65 or older"
        }
      ]
    },
    {
      "id": "q.shared.age_years",
      "factKey": "shared.age_years",
      "text": "How old is this applicant?",
      "help": "An age is enough for this check; no birth date is needed.",
      "type": "integer",
      "scope": "person",
      "programs": [
        "calfresh",
        "medi_cal"
      ],
      "priority": 10,
      "uiCollect": true,
      "min": 0,
      "max": 120
    },
    {
      "id": "q.shared.ca_residence",
      "factKey": "shared.ca_residence",
      "text": "Does this applicant live in California?",
      "help": "No fixed address is required. A temporary absence or unusual living arrangement may need review.",
      "type": "boolean",
      "scope": "person",
      "programs": [
        "calfresh",
        "medi_cal"
      ],
      "priority": 11,
      "uiCollect": true,
      "evidenceCategory": [
        "rent_record",
        "utility_bill",
        "other_residency_record"
      ]
    },
    {
      "id": "q.shared.immigration_status",
      "factKey": "shared.immigration_status",
      "text": "Which citizenship or immigration status does this applicant report?",
      "help": "Only people applying are asked. Not sure, prefer not to answer, and direct county entry remain available. Do not infer status from language, name or a medication.",
      "type": "enum",
      "scope": "person",
      "programs": [
        "calfresh",
        "medi_cal"
      ],
      "priority": 60,
      "uiCollect": true,
      "choices": [
        {
          "value": "us_citizen",
          "label": "U.S. citizen"
        },
        {
          "value": "us_national",
          "label": "Noncitizen U.S. national"
        },
        {
          "value": "lpr",
          "label": "Lawful permanent resident / Green Card"
        },
        {
          "value": "cuban_haitian_entrant",
          "label": "Cuban or Haitian entrant"
        },
        {
          "value": "cofa",
          "label": "COFA resident"
        },
        {
          "value": "refugee",
          "label": "Refugee (not currently LPR)"
        },
        {
          "value": "asylee",
          "label": "Asylee (not currently LPR)"
        },
        {
          "value": "withholding",
          "label": "Granted withholding of removal/deportation"
        },
        {
          "value": "parole_one_year",
          "label": "Paroled for one year or longer"
        },
        {
          "value": "parole_other",
          "label": "Other parole"
        },
        {
          "value": "afghan_humanitarian_parole",
          "label": "Afghan humanitarian parole"
        },
        {
          "value": "ukrainian_humanitarian_parole",
          "label": "Ukrainian humanitarian parole"
        },
        {
          "value": "conditional_entrant",
          "label": "Conditional entrant"
        },
        {
          "value": "certified_trafficking",
          "label": "Certified trafficking survivor"
        },
        {
          "value": "battered_qualified",
          "label": "Qualified battered noncitizen"
        },
        {
          "value": "daca",
          "label": "DACA"
        },
        {
          "value": "undocumented",
          "label": "No current lawful immigration status"
        },
        {
          "value": "other",
          "label": "Other / needs individual review"
        }
      ],
      "sensitivity": "immigration",
      "evidenceCategory": [
        "status_record"
      ]
    },
    {
      "id": "q.shared.pregnancy_state",
      "factKey": "shared.pregnancy_state",
      "text": "Is this applicant pregnant or within a year after pregnancy ended?",
      "help": "Used only for an applicable coverage pathway; no diagnosis is requested.",
      "type": "enum",
      "scope": "person",
      "programs": [
        "calfresh",
        "medi_cal"
      ],
      "priority": 25,
      "uiCollect": true,
      "choices": [
        {
          "value": "pregnant",
          "label": "Pregnant"
        },
        {
          "value": "postpartum",
          "label": "Within a year after pregnancy ended"
        },
        {
          "value": "neither",
          "label": "Neither"
        }
      ],
      "sensitivity": "health"
    },
    {
      "id": "q.shared.expected_children",
      "factKey": "shared.expected_children",
      "text": "How many babies is this applicant expecting?",
      "help": "",
      "type": "integer",
      "scope": "person",
      "programs": [
        "medi_cal"
      ],
      "priority": 27,
      "uiCollect": true,
      "min": 1,
      "max": 8,
      "sensitivity": "health"
    },
    {
      "id": "q.cf.ca_residence",
      "factKey": "cf.ca_residence",
      "text": "Do you live in California?",
      "help": "A self-report for routing, not verification. No fixed address or rent upload is required here.",
      "type": "boolean",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 10,
      "uiCollect": true,
      "evidenceCategory": [
        "rent_record",
        "utility_bill",
        "other_residency_record"
      ]
    },
    {
      "id": "q.cf.household_size_estimate",
      "factKey": "cf.household_size_estimate",
      "text": "Including you, how many people live together and usually buy and prepare food together?",
      "help": "Include spouses living together and children under 22 living with parents even if food is separate. Other mandatory groupings and exceptions need later review.",
      "type": "integer",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 11,
      "uiCollect": true,
      "min": 1,
      "max": 20
    },
    {
      "id": "q.cf.monthly_income_range",
      "factKey": "cf.monthly_income_range",
      "text": "Estimated monthly household income before tax",
      "help": "Use an estimate or a range. This checks only the dated starting MCE reference. Money is represented in cents.",
      "type": "interval",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 12,
      "uiCollect": true,
      "evidenceCategory": [
        "pay_statement",
        "business_record",
        "benefit_statement"
      ]
    },
    {
      "id": "q.cf.application_context",
      "factKey": "cf.application_context",
      "text": "Are you starting a new application or updating an existing CalFresh case?",
      "help": "",
      "type": "enum",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 20,
      "uiCollect": true,
      "choices": [
        {
          "value": "new_application",
          "label": "New application"
        },
        {
          "value": "renewal",
          "label": "Renewal / recertification"
        },
        {
          "value": "midperiod",
          "label": "Change to an existing case"
        }
      ]
    },
    {
      "id": "q.cf.application_date",
      "factKey": "cf.application_date",
      "text": "What is the intended or actual CalFresh filing date?",
      "help": "Distinguishes the policy applicable to an application from the date of this local check.",
      "type": "date",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 21,
      "uiCollect": true
    },
    {
      "id": "q.cf.income_kind",
      "factKey": "cf.income_kind",
      "text": "What type of income is included?",
      "help": "",
      "type": "enum",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 25,
      "uiCollect": true,
      "choices": [
        {
          "value": "wages",
          "label": "Employee wages"
        },
        {
          "value": "self_employment_only",
          "label": "Only self-employment income"
        },
        {
          "value": "mixed",
          "label": "More than one income type"
        },
        {
          "value": "other",
          "label": "Other income"
        },
        {
          "value": "none",
          "label": "No income"
        }
      ]
    },
    {
      "id": "q.cf.older_or_disability",
      "factKey": "cf.older_or_disability",
      "text": "Does the food household include someone age 60 or older, or someone receiving disability-related benefits?",
      "help": "A Yes routes to individual rule review; not all disability descriptions satisfy the CalFresh definition.",
      "type": "boolean",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 30,
      "uiCollect": true
    },
    {
      "id": "q.cf.business_receipts_cents",
      "factKey": "cf.business_receipts_cents",
      "text": "Monthly business receipts before costs",
      "help": "",
      "type": "integer",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 31,
      "uiCollect": true,
      "min": 0,
      "max": 100000000000,
      "evidenceCategory": [
        "business_record"
      ]
    },
    {
      "id": "q.cf.business_method",
      "factKey": "cf.business_method",
      "text": "Which business-expense method do you choose for this new application?",
      "help": "A choice is required. Existing-case method changes and actual-cost verification need additional review.",
      "type": "enum",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 32,
      "uiCollect": true,
      "choices": [
        {
          "value": "standard40",
          "label": "Standard 40 percent method"
        },
        {
          "value": "actual",
          "label": "Actual allowable costs"
        }
      ]
    },
    {
      "id": "q.cf.income_sources_complete",
      "factKey": "cf.income_sources_complete",
      "text": "Have all income sources for this food household been included?",
      "help": "A set of documents does not prove that every income source is represented.",
      "type": "boolean",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 33,
      "uiCollect": true
    },
    {
      "id": "q.cf.request_urgent_help",
      "factKey": "cf.request_urgent_help",
      "text": "Would you like to check whether to ask about expedited food assistance?",
      "help": "",
      "type": "boolean",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 40,
      "uiCollect": true
    },
    {
      "id": "q.cf.urgent_gross_income_cents",
      "factKey": "cf.urgent_gross_income_cents",
      "text": "Gross income expected this month",
      "help": "Used for limited expedited-service referral examples, not a benefits decision.",
      "type": "integer",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 41,
      "uiCollect": true,
      "min": 0,
      "max": 100000000000
    },
    {
      "id": "q.cf.urgent_liquid_assets_cents",
      "factKey": "cf.urgent_liquid_assets_cents",
      "text": "Available cash and other liquid resources",
      "help": "Used for limited expedited-service referral examples, not a benefits decision.",
      "type": "integer",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 41,
      "uiCollect": true,
      "min": 0,
      "max": 100000000000
    },
    {
      "id": "q.cf.urgent_rent_utilities_cents",
      "factKey": "cf.urgent_rent_utilities_cents",
      "text": "This month's rent/mortgage and utility costs",
      "help": "Used for limited expedited-service referral examples, not a benefits decision.",
      "type": "integer",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 41,
      "uiCollect": true,
      "min": 0,
      "max": 100000000000
    },
    {
      "id": "q.cf.higher_education_half_time",
      "factKey": "cf.higher_education_half_time",
      "text": "Is this applicant enrolled at least half-time in higher education?",
      "help": "A Yes requires checking student exemptions, not automatic rejection.",
      "type": "boolean",
      "scope": "person",
      "programs": [
        "calfresh"
      ],
      "priority": 65,
      "uiCollect": true
    },
    {
      "id": "q.cf.finances_comparable",
      "factKey": "cf.finances_comparable",
      "text": "Do these expense and income amounts cover the same food household and month?",
      "help": "",
      "type": "boolean",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 70,
      "uiCollect": true
    },
    {
      "id": "q.cf.recorded_income_cents",
      "factKey": "cf.recorded_income_cents",
      "text": "Recorded income for the comparison month",
      "help": "",
      "type": "integer",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 71,
      "uiCollect": false,
      "min": 0,
      "max": 100000000000,
      "preparationAction": "Prepare comparable same-person, same-period totals; do not compare two-week pay with a month of expenses."
    },
    {
      "id": "q.cf.recorded_expenses_cents",
      "factKey": "cf.recorded_expenses_cents",
      "text": "Listed expenses for the comparison month",
      "help": "",
      "type": "integer",
      "scope": "household",
      "programs": [
        "calfresh"
      ],
      "priority": 71,
      "uiCollect": false,
      "min": 0,
      "max": 100000000000,
      "preparationAction": "Prepare comparable same-person, same-period totals; do not compare two-week pay with a month of expenses."
    },
    {
      "id": "q.mc.medicare",
      "factKey": "mc.medicare",
      "text": "Is this applicant enrolled in Medicare Part A or B?",
      "help": "This changes which Medi-Cal coverage pathways need review.",
      "type": "boolean",
      "scope": "person",
      "programs": [
        "medi_cal"
      ],
      "priority": 28,
      "uiCollect": true
    },
    {
      "id": "q.mc.enrollment_context",
      "factKey": "mc.enrollment_context",
      "text": "What is this applicant's Medi-Cal situation?",
      "help": "Current coverage, new enrollment, and reinstatement need different rules.",
      "type": "enum",
      "scope": "person",
      "programs": [
        "medi_cal"
      ],
      "priority": 29,
      "uiCollect": true,
      "choices": [
        {
          "value": "new",
          "label": "Applying for the first time / no current coverage"
        },
        {
          "value": "current_full_scope",
          "label": "Currently has full-scope Medi-Cal"
        },
        {
          "value": "coverage_ended",
          "label": "Medi-Cal coverage ended"
        }
      ]
    },
    {
      "id": "q.mc.former_foster",
      "factKey": "mc.former_foster",
      "text": "Was this applicant in foster care on their 18th birthday?",
      "help": "Used to route applicants under age 26 to former-foster-youth review; other conditions remain to be checked.",
      "type": "boolean",
      "scope": "person",
      "programs": [
        "medi_cal"
      ],
      "priority": 30,
      "uiCollect": true
    },
    {
      "id": "q.mc.tax_role",
      "factKey": "mc.tax_role",
      "text": "Which tax situation describes this applicant this year?",
      "help": "Medi-Cal households are determined separately for each applicant, not from the CalFresh food group.",
      "type": "enum",
      "scope": "person",
      "programs": [
        "medi_cal"
      ],
      "priority": 35,
      "uiCollect": true,
      "choices": [
        {
          "value": "independent_filer",
          "label": "Files a return and is not claimed by anyone else"
        },
        {
          "value": "joint_filer",
          "label": "Files jointly with a spouse"
        },
        {
          "value": "nonfiler",
          "label": "Does not file and is not claimed by anyone"
        },
        {
          "value": "dependent",
          "label": "Is claimed by someone else"
        }
      ]
    },
    {
      "id": "q.mc.lives_with_spouse",
      "factKey": "mc.lives_with_spouse",
      "text": "Does this applicant live with a spouse?",
      "help": "",
      "type": "boolean",
      "scope": "person",
      "programs": [
        "medi_cal"
      ],
      "priority": 36,
      "uiCollect": true
    },
    {
      "id": "q.mc.tax_dependents",
      "factKey": "mc.tax_dependents",
      "text": "How many people does this applicant expect to claim as tax dependents?",
      "help": "",
      "type": "integer",
      "scope": "person",
      "programs": [
        "medi_cal"
      ],
      "priority": 37,
      "uiCollect": true,
      "min": 0,
      "max": 20
    },
    {
      "id": "q.mc.resident_children_under19",
      "factKey": "mc.resident_children_under19",
      "text": "How many of this applicant's children under 19 live with them?",
      "help": "Used only for the bounded nonfiler household path. Complex rosters remain unresolved.",
      "type": "integer",
      "scope": "person",
      "programs": [
        "medi_cal"
      ],
      "priority": 38,
      "uiCollect": true,
      "min": 0,
      "max": 20
    },
    {
      "id": "q.mc.prepared_family_size",
      "factKey": "mc.prepared_family_size",
      "text": "Prepare this applicant's Medi-Cal household size",
      "help": "",
      "type": "integer",
      "scope": "person",
      "programs": [
        "medi_cal"
      ],
      "priority": 42,
      "uiCollect": false,
      "min": 1,
      "max": 12,
      "preparationAction": "Resolve the applicant-specific tax/dependent/nonfiler rules. Do not copy the CalFresh count."
    },
    {
      "id": "q.mc.monthly_magi_range",
      "factKey": "mc.monthly_magi_range",
      "text": "Prepared current monthly MAGI-based household income",
      "help": "",
      "type": "interval",
      "scope": "person",
      "programs": [
        "medi_cal"
      ],
      "priority": 43,
      "uiCollect": false,
      "preparationAction": "Prepare this applicant's monthly MAGI-based household income, including relevant income sources and exclusions. Do not copy wages or a CalFresh deduction result.",
      "evidenceCategory": [
        "pay_statement",
        "tax_record",
        "business_record",
        "benefit_statement"
      ]
    },
    {
      "id": "q.mc.income_basis",
      "factKey": "mc.income_basis",
      "text": "Basis of the prepared income",
      "help": "",
      "type": "enum",
      "scope": "person",
      "programs": [
        "medi_cal"
      ],
      "priority": 44,
      "uiCollect": false,
      "choices": [
        {
          "value": "magi_prepared",
          "label": "Prepared MAGI-based household amount"
        },
        {
          "value": "raw_gross",
          "label": "Raw gross amount only"
        },
        {
          "value": "unknown_basis",
          "label": "Basis unresolved"
        }
      ],
      "preparationAction": "Supply a reviewed MAGI-based budget or keep this comparison unresolved."
    },
    {
      "id": "q.mc.needs_specific_care",
      "factKey": "mc.needs_specific_care",
      "text": "Would you like help asking about a particular treatment or service?",
      "help": "Optional navigation; a care question cannot produce a Medi-Cal eligibility failure.",
      "type": "boolean",
      "scope": "person",
      "programs": [
        "medi_cal"
      ],
      "priority": 90,
      "uiCollect": true,
      "sensitivity": "health"
    }
  ],
  "sources": [
    {
      "id": "CF_RESIDENCE",
      "title": "7 CFR 273.3 - Residency",
      "url": "https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-B/section-273.3",
      "authority": "Federal SNAP regulation",
      "locator": "273.3(a)",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Residence self-report is not verification; no permanent dwelling or minimum residency duration."
    },
    {
      "id": "CF_HOUSEHOLD",
      "title": "7 CFR 273.1 - Household concept",
      "url": "https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-A/section-273.1",
      "authority": "Federal SNAP regulation",
      "locator": "273.1(a), (b)(1)-(2)",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Mandatory groupings and special cases; numerical estimate is not a resolved eligible-member budget."
    },
    {
      "id": "CF_PROCESS",
      "title": "7 CFR 273.2 - Application processing",
      "url": "https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-A/section-273.2",
      "authority": "Federal SNAP regulation",
      "locator": "273.2(c), (f), (i)",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Filing and verification are separate; two expedited numerical examples are not a complete expedited determination."
    },
    {
      "id": "CF_2027_TABLE",
      "title": "CDSS ACIN I-40-26",
      "url": "https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACINs/2026/I-40_26.pdf?ver=H4zUIA8n2Aca6xBYlObOUg%3D%3D",
      "authority": "California official guidance",
      "locator": "Attachment I, PDF page 7; visually checked",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Effective 2026-10-01 through 2027-09-30. MCE reference is not a universal eligibility or reporting limit."
    },
    {
      "id": "CF_MCE",
      "title": "Santa Clara County Modified Categorical Eligibility",
      "url": "https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/CEHouseholds/MCE.htm",
      "authority": "Official county handbook",
      "locator": "MCE limits and elderly/disabled further evaluation",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "County explanation, not a complete statewide CE/MCE implementation."
    },
    {
      "id": "CF_NONCITIZEN",
      "title": "CDSS ACL 25-92",
      "url": "https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACLs/2025/25-92.pdf?ver=DCTxoAnXCUHKJ572rddl_A%3D%3D",
      "authority": "California official guidance",
      "locator": "PDF pp. 3-8; implementation, categories, CFAP limits",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Specific current-category routing for new applications; five-year bar/history exceptions are referred, not fully calculated."
    },
    {
      "id": "CF_NONCITIZEN_ERRATA",
      "title": "CDSS ACIN I-29-26E",
      "url": "https://www.cdss.ca.gov/Portals/9/Additional-Resources/Letters-and-Notices/ACINs/2026/I-29_26E.pdf?ver=lIQCMdaY9EW2VgkZN6HhDg%3D%3D",
      "authority": "California official guidance",
      "locator": "Revised Q8 and Q14, PDF pp. 4-5",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "No immigration verification request for nonapplicants. AHP/UHP losing eligibility under the cited changes do not automatically qualify for CFAP.",
      "supersedes": [
        "Affected passages of ACIN I-29-26"
      ]
    },
    {
      "id": "CF_CFAP",
      "title": "CDSS Current CFAP Eligibility",
      "url": "https://www.cdss.ca.gov/inforesources/cdss-programs/calfresh/cfap/who-is-eligible",
      "authority": "California official guidance",
      "locator": "Current CFAP Eligibility Requirements",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Read with September 2026 errata, not a fallback for every CalFresh noncitizen exclusion."
    },
    {
      "id": "CF_SELFEMP",
      "title": "Santa Clara County Self-Employment",
      "url": "https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Budgeting_Concepts/SlfEmplymnt.htm",
      "authority": "Official county handbook",
      "locator": "Allowable costs; standard 40 percent choice",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Limited new-applicant standard-method illustration; actual-cost allowance, method changes and mixed-income budget are not resolved."
    },
    {
      "id": "CF_STUDENT",
      "title": "7 CFR 273.5 - Students",
      "url": "https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-C/section-273.5",
      "authority": "Federal SNAP regulation",
      "locator": "273.5(a)-(b)",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Student status routes to exemption review; the exemption catalog is not fully implemented."
    },
    {
      "id": "CF_WORK",
      "title": "CDSS CalFresh Work and Community Engagement",
      "url": "https://www.cdss.ca.gov/benefits-services/food-nutrition-services/calfresh/frequently-asked-questions",
      "authority": "California official guidance",
      "locator": "Work requirements and exceptions",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "No adverse work-requirement decision, month counting or county-waiver calculation in this version."
    },
    {
      "id": "CF_RECONCILE",
      "title": "Santa Clara County Questionable Information",
      "url": "https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/Verification/QuestnblInfo.htm",
      "authority": "Official county handbook",
      "locator": "Expenses exceeding income",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Clarification only; expense-income difference by itself is not grounds for denial."
    },
    {
      "id": "MC_RESIDENCE",
      "title": "DHCS ACWDL 26-15",
      "url": "https://www.dhcs.ca.gov/file/acwdl-26-15-pdf/",
      "authority": "California official guidance",
      "locator": "Residency policy; electronic and administrative verification",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "No connection to CalHEERS/SAVE. No universal rent/utility upload requirement.",
      "supersedes": [
        "ACWDL 26-04",
        "ACWDL 26-04E"
      ]
    },
    {
      "id": "MC_MAGI",
      "title": "42 CFR 435.603 - MAGI",
      "url": "https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-C/part-435/subpart-G/section-435.603",
      "authority": "Federal Medicaid regulation",
      "locator": "(b), (d), (f), (g), (h), (j)",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Only isolated adult household derivation is automated. Dependents, complex tax groups, other-member pregnancy counts and income exclusions require a prepared scoped budget."
    },
    {
      "id": "MC_FPL_LETTER",
      "title": "DHCS ACWDL 26-01",
      "url": "https://www.dhcs.ca.gov/services/medi-cal/eligibility/letters/Documents/26-01.pdf",
      "authority": "California official guidance",
      "locator": "PDF page 2, MAGI effective date",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "2026 MAGI values apply from January 1, 2026; other program dates differ."
    },
    {
      "id": "MC_FPL_MONTHLY",
      "title": "DHCS 2026 Monthly FPL Values, Enclosure 1",
      "url": "https://www.dhcs.ca.gov/services/medi-cal-resources/medi-cal-eligibility-division/all-county-welfare-directors-medi-cal-eligibility-division-information-letters/2026-fpl-calculation-chart-monthly-values-enclosure-1/",
      "authority": "California official guidance",
      "locator": "Rows 1-12; 138, 213, 266, 322 percent columns",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Use the published monthly rows, not annual FPL rounded by another formula. No extra 5 percent on a ceiling already including it."
    },
    {
      "id": "MC_CATEGORIES",
      "title": "DHCS Program Descriptions by FPL, Enclosure 3",
      "url": "https://www.dhcs.ca.gov/services/medi-cal-resources/medi-cal-eligibility-division/all-county-welfare-directors-medi-cal-eligibility-division-information-letters/program-descriptions-by-fpl-enclosure-3/",
      "authority": "California official guidance",
      "locator": "Adult 138%; pregnant 213%; OTLIC 266%; MCAP 213-322%",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Reference comparisons only. OTLIC is not a universal adult or child category/adjudication determination."
    },
    {
      "id": "MC_NONCITIZEN",
      "title": "DHCS ACWDL 26-13",
      "url": "https://www.dhcs.ca.gov/file/acwdl-26-13-pdf/",
      "authority": "California official guidance",
      "locator": "PDF pp. 2-5, effective 2026-10-01",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Federal funding categories differ from state-funded full-scope coverage; do not convert a federal change into automatic loss of Medi-Cal."
    },
    {
      "id": "MC_CHANGES",
      "title": "DHCS Medi-Cal Changes",
      "url": "https://www.dhcs.ca.gov/medi-cal/updates/medi-cal-changes/",
      "authority": "California official guidance",
      "locator": "Enrollment freeze; child/pregnancy/former-foster exceptions; dated changes",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Future 2027 provisions are NOT activated in this Q4 2026 pack. Public future descriptions require primary implementation reconciliation."
    },
    {
      "id": "MC_IMMIGRATION_TABLE",
      "title": "DHCS Immigration Status and Changes to Medi-Cal Eligibility",
      "url": "https://www.dhcs.ca.gov/immigration-status-and-changes-to-medi-cal-eligibility/",
      "authority": "California official guidance",
      "locator": "2026 population/status rows",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Category alone does not establish all eligibility conditions. Future July 2027 details differ in presentation from the general updates page; excluded from execution."
    },
    {
      "id": "MC_BENEFITS",
      "title": "DHCS Medi-Cal Benefits",
      "url": "https://www.dhcs.ca.gov/medi-cal/benefits/",
      "authority": "California official guidance",
      "locator": "Covered benefit categories",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "No treatment coverage, medical necessity, network availability or authorization decision is made."
    },
    {
      "id": "MC_INDEX",
      "title": "DHCS 2026 All County Welfare Directors Letters",
      "url": "https://www.dhcs.ca.gov/services/medi-cal-resources/medi-cal-eligibility-division/all-county-welfare-directors-medi-cal-eligibility-division-information-letters/2026-all-county-welfare-directors-letters/",
      "authority": "California official guidance",
      "locator": "Index through ACWDL 26-18",
      "retrievedOn": "2026-10-04",
      "status": "research_checked",
      "limitation": "Change discovery only; indexing a letter is not implementing it."
    }
  ],
  "tables": [
    {
      "id": "cf_mce_2026_10",
      "title": "CalFresh 200% MCE starting gross-income reference",
      "sourceIds": [
        "CF_2027_TABLE"
      ],
      "unit": "USD_cents",
      "through": "2027-09-30",
      "rows": {
        "1": 266000,
        "2": 360800,
        "3": 455400,
        "4": 550000,
        "5": 644800,
        "6": 739400,
        "7": 834000,
        "8": 928800
      },
      "from": "2026-10-01",
      "incrementAfter": {
        "row": 8,
        "amount": 94800,
        "maximumRow": 20
      }
    },
    {
      "id": "cf_net_2026_10",
      "title": "CalFresh 100% net-income reference - not a calculated net budget",
      "sourceIds": [
        "CF_2027_TABLE"
      ],
      "unit": "USD_cents",
      "through": "2027-09-30",
      "rows": {
        "1": 133000,
        "2": 180400,
        "3": 227700,
        "4": 275000,
        "5": 322400,
        "6": 369700,
        "7": 417000,
        "8": 464400
      },
      "from": "2026-10-01",
      "incrementAfter": {
        "row": 8,
        "amount": 47400,
        "maximumRow": 20
      }
    },
    {
      "id": "cf_sar_2026_10",
      "title": "CalFresh 130% SAR gross-income table - not individual notice IRT",
      "sourceIds": [
        "CF_2027_TABLE"
      ],
      "unit": "USD_cents",
      "through": "2027-09-30",
      "rows": {
        "1": 172900,
        "2": 234500,
        "3": 296000,
        "4": 357500,
        "5": 419100,
        "6": 480600,
        "7": 542100,
        "8": 603700
      },
      "from": "2026-10-01",
      "incrementAfter": {
        "row": 8,
        "amount": 61600,
        "maximumRow": 20
      }
    },
    {
      "id": "cf_separate_ed_2026_10",
      "title": "165% other-household income reference for elderly/disabled separate-household provision",
      "sourceIds": [
        "CF_2027_TABLE"
      ],
      "unit": "USD_cents",
      "through": "2027-09-30",
      "rows": {
        "1": 219500,
        "2": 297600,
        "3": 375700,
        "4": 453800,
        "5": 531900,
        "6": 610000,
        "7": 688100,
        "8": 766200
      },
      "from": "2026-10-01",
      "incrementAfter": {
        "row": 8,
        "amount": 78100,
        "maximumRow": 20
      }
    },
    {
      "id": "mc_fpl_138_2026",
      "title": "2026 Medi-Cal 138% monthly FPL reference",
      "sourceIds": [
        "MC_FPL_LETTER",
        "MC_FPL_MONTHLY",
        "MC_CATEGORIES"
      ],
      "unit": "USD_cents",
      "through": "2026-12-31",
      "rows": {
        "1": 183600,
        "2": 249000,
        "3": 314300,
        "4": 379500,
        "5": 445000,
        "6": 510200,
        "7": 575500,
        "8": 640900,
        "9": 706200,
        "10": 771500,
        "11": 836900,
        "12": 902200
      },
      "from": "2026-01-01"
    },
    {
      "id": "mc_fpl_213_2026",
      "title": "2026 Medi-Cal 213% monthly FPL reference",
      "sourceIds": [
        "MC_FPL_LETTER",
        "MC_FPL_MONTHLY",
        "MC_CATEGORIES"
      ],
      "unit": "USD_cents",
      "through": "2026-12-31",
      "rows": {
        "1": 283300,
        "2": 384300,
        "3": 485100,
        "4": 585800,
        "5": 686800,
        "6": 787500,
        "7": 888300,
        "8": 989200,
        "9": 1090000,
        "10": 1190700,
        "11": 1291700,
        "12": 1392400
      },
      "from": "2026-01-01"
    },
    {
      "id": "mc_fpl_266_2026",
      "title": "2026 Medi-Cal 266% monthly FPL reference",
      "sourceIds": [
        "MC_FPL_LETTER",
        "MC_FPL_MONTHLY",
        "MC_CATEGORIES"
      ],
      "unit": "USD_cents",
      "through": "2026-12-31",
      "rows": {
        "1": 353800,
        "2": 479900,
        "3": 605700,
        "4": 731500,
        "5": 857600,
        "6": 983500,
        "7": 1109300,
        "8": 1235400,
        "9": 1361200,
        "10": 1487000,
        "11": 1613100,
        "12": 1738900
      },
      "from": "2026-01-01"
    },
    {
      "id": "mc_fpl_322_2026",
      "title": "2026 Medi-Cal 322% monthly FPL reference",
      "sourceIds": [
        "MC_FPL_LETTER",
        "MC_FPL_MONTHLY",
        "MC_CATEGORIES"
      ],
      "unit": "USD_cents",
      "through": "2026-12-31",
      "rows": {
        "1": 428300,
        "2": 580900,
        "3": 733200,
        "4": 885500,
        "5": 1038200,
        "6": 1190500,
        "7": 1342800,
        "8": 1495400,
        "9": 1647700,
        "10": 1800000,
        "11": 1952700,
        "12": 2105000
      },
      "from": "2026-01-01"
    }
  ],
  "benefits": [
    {
      "id": "calfresh",
      "name": "CalFresh",
      "agency": "CDSS",
      "geography": "California",
      "policyVersion": "2026-Q4-research.1",
      "supportedWindow": {
        "from": "2026-10-01",
        "through": "2026-12-31"
      },
      "fullEligibilityImplemented": false,
      "dimensions": [
        {
          "id": "residency",
          "importance": "GATE",
          "description": "Residence self-report and verification boundary",
          "coverage": "executable_limited"
        },
        {
          "id": "household",
          "importance": "CALCULATION",
          "description": "Food-group estimate; detailed membership unresolved",
          "coverage": "executable_limited"
        },
        {
          "id": "income",
          "importance": "CALCULATION",
          "description": "200% MCE initial comparison only",
          "coverage": "executable_limited"
        },
        {
          "id": "application_context",
          "importance": "PATH",
          "description": "New application versus existing case",
          "coverage": "executable_limited"
        },
        {
          "id": "immigration_status",
          "importance": "PATH",
          "description": "Per-applicant current category and referral",
          "coverage": "executable_limited"
        },
        {
          "id": "exceptions",
          "importance": "PATH",
          "description": "Above-reference older/disability pathway",
          "coverage": "executable_limited"
        },
        {
          "id": "self_employment",
          "importance": "CALCULATION",
          "description": "Chosen standard-method illustration only",
          "coverage": "executable_limited"
        },
        {
          "id": "deductions",
          "importance": "CALCULATION",
          "description": "Net budget and allowable deductions",
          "coverage": "review_only"
        },
        {
          "id": "assets",
          "importance": "CALCULATION",
          "description": "CE/MCE and other resource applicability",
          "coverage": "review_only"
        },
        {
          "id": "student_status",
          "importance": "PATH",
          "description": "Higher-education exemptions",
          "coverage": "executable_limited"
        },
        {
          "id": "work",
          "importance": "PATH",
          "description": "Work rules and county waivers",
          "coverage": "review_only"
        },
        {
          "id": "expedited_service",
          "importance": "PATH",
          "description": "Limited urgent referral examples",
          "coverage": "executable_limited"
        },
        {
          "id": "identity",
          "importance": "SUPPORTING",
          "description": "Identity evidence alternatives",
          "coverage": "review_only"
        },
        {
          "id": "ssn",
          "importance": "SUPPORTING",
          "description": "Direct official entry",
          "coverage": "review_only"
        },
        {
          "id": "verification",
          "importance": "SUPPORTING",
          "description": "Evidence versus county acceptance",
          "coverage": "review_only"
        },
        {
          "id": "consistency",
          "importance": "SUPPORTING",
          "description": "Expenses and income explanation",
          "coverage": "executable_limited"
        },
        {
          "id": "filing_followup",
          "importance": "SUPPORTING",
          "description": "Submission and county follow-up",
          "coverage": "review_only"
        }
      ],
      "rules": [
        {
          "id": "cf.residency",
          "dimension": "residency",
          "importance": "GATE",
          "scope": "household",
          "stages": [
            "quick",
            "details"
          ],
          "sourceIds": [
            "CF_RESIDENCE",
            "CF_PROCESS"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "eq",
                "args": [
                  {
                    "fact": "cf.ca_residence"
                  },
                  {
                    "literal": true
                  }
                ]
              },
              "then": {
                "status": "reported_condition_met",
                "code": "ca_reported",
                "text": "California residence is reported. No agency verification is implied."
              }
            }
          ],
          "otherwise": {
            "status": "needs_review",
            "code": "residence_review",
            "text": "The California residence question needs clarification or an out-of-state route. No fixed address or specified bill is required here.",
            "action": "check_residency"
          },
          "priority": 1
        },
        {
          "id": "cf.household_estimate",
          "dimension": "household",
          "importance": "CALCULATION",
          "scope": "household",
          "stages": [
            "quick",
            "details"
          ],
          "sourceIds": [
            "CF_HOUSEHOLD"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "gte",
                "args": [
                  {
                    "fact": "cf.household_size_estimate"
                  },
                  {
                    "literal": 1
                  }
                ]
              },
              "then": {
                "status": "reference_only",
                "code": "food_group_estimate",
                "text": "This is a food-household estimate, not final eligible membership. Mandatory groupings and exclusions still need review.",
                "computed": {
                  "estimatedSize": {
                    "fact": "cf.household_size_estimate"
                  }
                }
              }
            }
          ],
          "otherwise": {
            "status": "needs_information",
            "code": "household_needed",
            "text": "Prepare a food-household estimate."
          },
          "priority": 2
        },
        {
          "id": "cf.income_reference",
          "dimension": "income",
          "importance": "CALCULATION",
          "scope": "household",
          "stages": [
            "quick",
            "details"
          ],
          "sourceIds": [
            "CF_2027_TABLE",
            "CF_MCE"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "and",
                "args": [
                  {
                    "op": "exists",
                    "args": [
                      {
                        "fact": "cf.income_kind"
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "cf.income_kind"
                      },
                      {
                        "literal": "self_employment_only"
                      }
                    ]
                  }
                ]
              },
              "then": {
                "status": "needs_review",
                "code": "business_receipts_need_cost_method",
                "text": "Business receipts need the applicable self-employment cost method before interpreting this income comparison.",
                "action": "review_business_method"
              }
            },
            {
              "when": {
                "op": "interval_lte",
                "args": [
                  {
                    "fact": "cf.monthly_income_range"
                  },
                  {
                    "op": "table",
                    "table": "cf_mce_2026_10",
                    "args": [
                      {
                        "fact": "cf.household_size_estimate"
                      }
                    ]
                  }
                ]
              },
              "then": {
                "status": "within_reference",
                "code": "within_mce_reference",
                "text": "The estimate is at or below this starting gross-income reference. This does not establish eligibility.",
                "computed": {
                  "monthlyReferenceCents": {
                    "op": "table",
                    "table": "cf_mce_2026_10",
                    "args": [
                      {
                        "fact": "cf.household_size_estimate"
                      }
                    ]
                  }
                }
              }
            },
            {
              "when": {
                "op": "interval_gt",
                "args": [
                  {
                    "fact": "cf.monthly_income_range"
                  },
                  {
                    "op": "table",
                    "table": "cf_mce_2026_10",
                    "args": [
                      {
                        "fact": "cf.household_size_estimate"
                      }
                    ]
                  }
                ]
              },
              "then": {
                "status": "above_reference",
                "code": "above_mce_reference",
                "text": "The estimate is above this starting reference. Other pathways and income treatment need review; this is not a denial.",
                "action": "review_income_path",
                "computed": {
                  "monthlyReferenceCents": {
                    "op": "table",
                    "table": "cf_mce_2026_10",
                    "args": [
                      {
                        "fact": "cf.household_size_estimate"
                      }
                    ]
                  }
                }
              }
            }
          ],
          "otherwise": {
            "status": "needs_review",
            "code": "income_range_unresolved",
            "text": "The income range cannot resolve this reference."
          },
          "priority": 3
        },
        {
          "id": "cf.context",
          "dimension": "application_context",
          "importance": "PATH",
          "scope": "household",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "CF_NONCITIZEN"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "eq",
                "args": [
                  {
                    "fact": "cf.application_context"
                  },
                  {
                    "literal": "new_application"
                  }
                ]
              },
              "then": {
                "status": "reference_only",
                "code": "new_application",
                "text": "New-application configuration selected. Filing date still controls applicable policy."
              }
            }
          ],
          "otherwise": {
            "status": "needs_review",
            "code": "existing_case_review",
            "text": "Renewals and mid-period changes require case-specific dates and rules; this engine does not discontinue benefits.",
            "action": "review_existing_case"
          },
          "priority": 4
        },
        {
          "id": "cf.above_reference_path",
          "dimension": "exceptions",
          "importance": "PATH",
          "scope": "household",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "CF_MCE"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "eq",
                "args": [
                  {
                    "fact": "cf.older_or_disability"
                  },
                  {
                    "literal": true
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "elderly_disabled_review",
                "text": "An older/disability-related pathway may require a different financial review. Do not deny based on the MCE reference.",
                "action": "review_non_mce_path"
              }
            }
          ],
          "otherwise": {
            "status": "needs_review",
            "code": "income_treatment_review",
            "text": "Review income type and supported exclusions before drawing a conclusion.",
            "action": "prepare_income_details"
          },
          "priority": 5,
          "when": {
            "op": "interval_gt",
            "args": [
              {
                "fact": "cf.monthly_income_range"
              },
              {
                "op": "table",
                "table": "cf_mce_2026_10",
                "args": [
                  {
                    "fact": "cf.household_size_estimate"
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "cf.citizenship_immigration",
          "dimension": "immigration_status",
          "importance": "PATH",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "CF_NONCITIZEN",
            "CF_NONCITIZEN_ERRATA",
            "CF_CFAP"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "in",
                "args": [
                  {
                    "fact": "shared.immigration_status"
                  },
                  {
                    "literal": [
                      "us_citizen",
                      "us_national"
                    ]
                  }
                ]
              },
              "then": {
                "status": "reported_condition_met",
                "code": "cf_citizenship_category",
                "text": "Reported citizenship/national category meets this category check only; verification and all other conditions remain separate."
              }
            },
            {
              "when": {
                "op": "in",
                "args": [
                  {
                    "fact": "shared.immigration_status"
                  },
                  {
                    "literal": [
                      "cuban_haitian_entrant",
                      "cofa"
                    ]
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "cf_supported_non_citizen_category",
                "text": "This reported category is in the current federal CalFresh category list. Confirm the exact category and other conditions with the county.",
                "action": "confirm_applicant_category"
              }
            },
            {
              "when": {
                "op": "eq",
                "args": [
                  {
                    "fact": "shared.immigration_status"
                  },
                  {
                    "literal": "lpr"
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "cf_lpr_history_review",
                "text": "The LPR pathway requires waiting-period, prior-status and exemption review. A new Green Card alone does not settle it.",
                "action": "review_lpr_history",
                "alternatives": [
                  {
                    "id": "cfap",
                    "status": "referral_only",
                    "reason": "Ask whether existing CFAP rules apply if federal ineligibility is solely for a covered immigration reason; not automatic."
                  }
                ]
              }
            },
            {
              "when": {
                "op": "in",
                "args": [
                  {
                    "fact": "shared.immigration_status"
                  },
                  {
                    "literal": [
                      "afghan_humanitarian_parole",
                      "ukrainian_humanitarian_parole"
                    ]
                  }
                ]
              },
              "then": {
                "status": "needs_review",
                "code": "cf_ahp_uhp_no_auto_cfap",
                "text": "This reported parole category requires current policy review. Do not automatically route an exclusion to CFAP; the September 2026 errata expressly limits that fallback.",
                "action": "county_food_options_review"
              }
            },
            {
              "when": {
                "op": "in",
                "args": [
                  {
                    "fact": "shared.immigration_status"
                  },
                  {
                    "literal": [
                      "refugee",
                      "asylee",
                      "withholding",
                      "certified_trafficking"
                    ]
                  }
                ]
              },
              "then": {
                "status": "needs_review",
                "code": "cf_current_nonlpr_review",
                "text": "This current non-LPR category is not enough for federal CalFresh under the reviewed new-application rules. Check any status change and other household applicants separately. CFAP is not automatic.",
                "action": "county_food_options_review"
              }
            },
            {
              "when": {
                "op": "in",
                "args": [
                  {
                    "fact": "shared.immigration_status"
                  },
                  {
                    "literal": [
                      "parole_one_year",
                      "parole_other",
                      "conditional_entrant",
                      "battered_qualified"
                    ]
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "cf_individual_cfap_review",
                "text": "An individual food-assistance pathway review is needed. Existing CFAP conditions, history and exclusions must be checked.",
                "action": "review_cfap_conditions",
                "alternatives": [
                  {
                    "id": "cfap",
                    "status": "referral_only",
                    "reason": "Eligibility is not established; an individual review is required."
                  }
                ]
              }
            }
          ],
          "otherwise": {
            "status": "needs_review",
            "code": "cf_immigration_unresolved",
            "text": "This category is not resolved by this pack. Other household applicants may have a different result.",
            "action": "enter_directly_with_county"
          },
          "priority": 20,
          "when": {
            "op": "and",
            "args": [
              {
                "op": "eq",
                "args": [
                  {
                    "fact": "cf.application_context",
                    "scope": "household"
                  },
                  {
                    "literal": "new_application"
                  }
                ]
              },
              {
                "op": "gte",
                "args": [
                  {
                    "fact": "cf.application_date",
                    "scope": "household"
                  },
                  {
                    "literal": "2026-04-01"
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "cf.business_standard_method",
          "dimension": "self_employment",
          "importance": "CALCULATION",
          "scope": "household",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "CF_SELFEMP"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "eq",
                "args": [
                  {
                    "fact": "cf.business_method"
                  },
                  {
                    "literal": "actual"
                  }
                ]
              },
              "then": {
                "status": "needs_review",
                "code": "actual_cost_review",
                "text": "Actual allowable business costs and their verification require review. No standard deduction is substituted automatically.",
                "action": "review_actual_costs"
              }
            },
            {
              "when": {
                "op": "and",
                "args": [
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "cf.business_method"
                      },
                      {
                        "literal": "standard40"
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "cf.income_sources_complete"
                      },
                      {
                        "literal": true
                      }
                    ]
                  }
                ]
              },
              "then": {
                "status": "reference_only",
                "code": "standard_method_illustration",
                "text": "Illustration of the chosen 40 percent business-expense method for a new applicant with only self-employment income. Preserve gross receipts; this is not a reporting threshold or final countable-income determination.",
                "computed": {
                  "grossReceiptsCents": {
                    "fact": "cf.business_receipts_cents"
                  },
                  "afterBusinessCostsCents": {
                    "op": "multiply_ratio",
                    "args": [
                      {
                        "fact": "cf.business_receipts_cents"
                      },
                      {
                        "literal": 60
                      },
                      {
                        "literal": 100
                      }
                    ]
                  },
                  "monthlyReferenceCents": {
                    "op": "table",
                    "table": "cf_mce_2026_10",
                    "args": [
                      {
                        "fact": "cf.household_size_estimate"
                      }
                    ]
                  },
                  "withinStartingReferenceAfterCosts": {
                    "op": "lte",
                    "args": [
                      {
                        "op": "multiply_ratio",
                        "args": [
                          {
                            "fact": "cf.business_receipts_cents"
                          },
                          {
                            "literal": 60
                          },
                          {
                            "literal": 100
                          }
                        ]
                      },
                      {
                        "op": "table",
                        "table": "cf_mce_2026_10",
                        "args": [
                          {
                            "fact": "cf.household_size_estimate"
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            }
          ],
          "otherwise": {
            "status": "needs_review",
            "code": "business_context_incomplete",
            "text": "Confirm other income sources and the expense method. Existing cases and mixed income need separate review.",
            "action": "prepare_business_income"
          },
          "priority": 22,
          "when": {
            "op": "and",
            "args": [
              {
                "op": "and",
                "args": [
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "cf.application_context"
                      },
                      {
                        "literal": "new_application"
                      }
                    ]
                  },
                  {
                    "op": "gte",
                    "args": [
                      {
                        "fact": "cf.application_date"
                      },
                      {
                        "literal": "2026-04-01"
                      }
                    ]
                  }
                ]
              },
              {
                "op": "eq",
                "args": [
                  {
                    "fact": "cf.income_kind"
                  },
                  {
                    "literal": "self_employment_only"
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "cf.student",
          "dimension": "student_status",
          "importance": "PATH",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "CF_STUDENT"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "eq",
                "args": [
                  {
                    "fact": "cf.higher_education_half_time"
                  },
                  {
                    "literal": true
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "student_exemptions_review",
                "text": "Review applicable higher-education student exemptions. Student enrollment alone is not a rejection.",
                "action": "check_student_exemptions"
              }
            }
          ],
          "otherwise": {
            "status": "not_applicable",
            "code": "student_restriction_not_triggered",
            "text": "This half-time student branch was not triggered by the reported answer."
          },
          "priority": 40,
          "when": {
            "op": "and",
            "args": [
              {
                "op": "gte",
                "args": [
                  {
                    "fact": "shared.age_years"
                  },
                  {
                    "literal": 18
                  }
                ]
              },
              {
                "op": "lte",
                "args": [
                  {
                    "fact": "shared.age_years"
                  },
                  {
                    "literal": 49
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "cf.work_requirements",
          "dimension": "work",
          "importance": "PATH",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "CF_WORK"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "needs_review",
            "code": "work_requirements_not_automated",
            "text": "Current work rules, exemptions, countable months and county waivers need review; no adverse work-rule result is produced.",
            "action": "county_work_rule_review"
          },
          "priority": 60
        },
        {
          "id": "cf.expedited",
          "dimension": "expedited_service",
          "importance": "PATH",
          "scope": "household",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "CF_PROCESS"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "and",
                "args": [
                  {
                    "op": "lt",
                    "args": [
                      {
                        "fact": "cf.urgent_gross_income_cents"
                      },
                      {
                        "literal": 15000
                      }
                    ]
                  },
                  {
                    "op": "lte",
                    "args": [
                      {
                        "fact": "cf.urgent_liquid_assets_cents"
                      },
                      {
                        "literal": 10000
                      }
                    ]
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "ask_expedited_low_income",
                "text": "Reported amounts match one numerical circumstance for expedited-service review. Ask the county promptly; no service date is promised.",
                "action": "ask_about_expedited"
              }
            },
            {
              "when": {
                "op": "lt",
                "args": [
                  {
                    "op": "add",
                    "args": [
                      {
                        "fact": "cf.urgent_gross_income_cents"
                      },
                      {
                        "fact": "cf.urgent_liquid_assets_cents"
                      }
                    ]
                  },
                  {
                    "fact": "cf.urgent_rent_utilities_cents"
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "ask_expedited_shelter",
                "text": "Reported income plus liquid resources are below reported shelter/utility costs. Ask about expedited service.",
                "action": "ask_about_expedited"
              }
            }
          ],
          "otherwise": {
            "status": "needs_review",
            "code": "other_expedited_not_assessed",
            "text": "These two examples did not identify a route. Other expedited circumstances, including some migrant/seasonal cases, remain unassessed.",
            "action": "ask_county_if_urgent"
          },
          "priority": 0,
          "when": {
            "op": "and",
            "args": [
              {
                "op": "exists",
                "args": [
                  {
                    "fact": "cf.request_urgent_help"
                  }
                ]
              },
              {
                "op": "eq",
                "args": [
                  {
                    "fact": "cf.request_urgent_help"
                  },
                  {
                    "literal": true
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "cf.expense_income_context",
          "dimension": "consistency",
          "importance": "SUPPORTING",
          "scope": "household",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "CF_RECONCILE"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "gt",
                "args": [
                  {
                    "fact": "cf.recorded_expenses_cents"
                  },
                  {
                    "fact": "cf.recorded_income_cents"
                  }
                ]
              },
              "then": {
                "status": "needs_review",
                "code": "explain_financing_difference",
                "text": "Listed expenses exceed recorded income for the confirmed comparison scope. Explain savings, unpaid balances or other financing; this alone is not grounds for denial.",
                "action": "explain_difference",
                "computed": {
                  "differenceCents": {
                    "op": "subtract",
                    "args": [
                      {
                        "fact": "cf.recorded_expenses_cents"
                      },
                      {
                        "fact": "cf.recorded_income_cents"
                      }
                    ]
                  }
                }
              }
            }
          ],
          "otherwise": {
            "status": "reference_only",
            "code": "no_positive_gap",
            "text": "No positive expense-income gap was found in these supplied comparable totals."
          },
          "priority": 70,
          "when": {
            "op": "and",
            "args": [
              {
                "op": "exists",
                "args": [
                  {
                    "fact": "cf.finances_comparable"
                  }
                ]
              },
              {
                "op": "eq",
                "args": [
                  {
                    "fact": "cf.finances_comparable"
                  },
                  {
                    "literal": true
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "cf.deductions",
          "dimension": "deductions",
          "importance": "SUPPORTING",
          "scope": "household",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "CF_2027_TABLE"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "needs_review",
            "code": "cf_deductions",
            "text": "Deduction amounts are configured in the parameters file, but allowable-expense classification, net budgeting and allotment calculation are not implemented.",
            "action": "continue_official_process"
          },
          "priority": 90
        },
        {
          "id": "cf.resources",
          "dimension": "assets",
          "importance": "SUPPORTING",
          "scope": "household",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "CF_MCE",
            "CF_2027_TABLE"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "needs_review",
            "code": "cf_resources",
            "text": "CE/MCE status, resource applicability, exclusions and exceptions require review. No asset test is imposed universally.",
            "action": "continue_official_process"
          },
          "priority": 90
        },
        {
          "id": "cf.identity",
          "dimension": "identity",
          "importance": "SUPPORTING",
          "scope": "household",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "CF_PROCESS"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "needs_review",
            "code": "cf_identity",
            "text": "Use the county process and acceptable alternatives for identity; no automatic demand for a photo ID scan.",
            "action": "continue_official_process"
          },
          "priority": 90
        },
        {
          "id": "cf.ssn",
          "dimension": "ssn",
          "importance": "SUPPORTING",
          "scope": "household",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "CF_PROCESS"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "needs_review",
            "code": "cf_ssn",
            "text": "Provide identifying numbers directly to the official portal when requested. They are not collected by this engine.",
            "action": "continue_official_process"
          },
          "priority": 90
        },
        {
          "id": "cf.verification",
          "dimension": "verification",
          "importance": "SUPPORTING",
          "scope": "household",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "CF_PROCESS"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "needs_review",
            "code": "cf_verification",
            "text": "Supporting evidence and county verification are separate. A locally matched file is not acceptance.",
            "action": "continue_official_process"
          },
          "priority": 90
        },
        {
          "id": "cf.submission",
          "dimension": "filing_followup",
          "importance": "SUPPORTING",
          "scope": "household",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "CF_PROCESS"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "needs_review",
            "code": "cf_submission",
            "text": "Sign and submit on BenefitsCal. Local confirmation, copying or exporting does not submit an application.",
            "action": "continue_official_process"
          },
          "priority": 90
        }
      ],
      "sourceIds": [
        "CF_2027_TABLE",
        "CF_CFAP",
        "CF_HOUSEHOLD",
        "CF_MCE",
        "CF_NONCITIZEN",
        "CF_NONCITIZEN_ERRATA",
        "CF_PROCESS",
        "CF_RECONCILE",
        "CF_RESIDENCE",
        "CF_SELFEMP",
        "CF_STUDENT",
        "CF_WORK"
      ],
      "officialApplication": "https://benefitscal.com/",
      "rosterPrompt": "Choose the people applying for CalFresh. No real names or identity numbers are needed in the engine."
    },
    {
      "id": "medi_cal",
      "name": "Medi-Cal",
      "agency": "DHCS",
      "geography": "California",
      "policyVersion": "2026-Q4-research.1",
      "supportedWindow": {
        "from": "2026-10-01",
        "through": "2026-12-31"
      },
      "fullEligibilityImplemented": false,
      "dimensions": [
        {
          "id": "residency",
          "importance": "GATE",
          "description": "Applicant-specific residence",
          "coverage": "executable_limited"
        },
        {
          "id": "age",
          "importance": "PATH",
          "description": "Child/adult/older routing",
          "coverage": "executable_limited"
        },
        {
          "id": "household",
          "importance": "CALCULATION",
          "description": "Applicant-specific MAGI family size",
          "coverage": "executable_limited"
        },
        {
          "id": "income",
          "importance": "CALCULATION",
          "description": "Prepared monthly MAGI reference comparisons",
          "coverage": "executable_limited"
        },
        {
          "id": "pregnancy",
          "importance": "PATH",
          "description": "Pregnancy and postpartum distinct",
          "coverage": "review_only"
        },
        {
          "id": "medicare_disability_ltc",
          "importance": "PATH",
          "description": "Non-MAGI and other category review",
          "coverage": "review_only"
        },
        {
          "id": "former_foster",
          "importance": "PATH",
          "description": "Former-foster-youth pathway",
          "coverage": "executable_limited"
        },
        {
          "id": "immigration_status",
          "importance": "PATH",
          "description": "Federal/state funding and enrollment context",
          "coverage": "executable_limited"
        },
        {
          "id": "assets",
          "importance": "CALCULATION",
          "description": "MAGI exclusion and non-MAGI review",
          "coverage": "executable_limited"
        },
        {
          "id": "identity_verification",
          "importance": "SUPPORTING",
          "description": "Electronic/administrative verification",
          "coverage": "review_only"
        },
        {
          "id": "filing_followup",
          "importance": "SUPPORTING",
          "description": "Official process and notices",
          "coverage": "review_only"
        },
        {
          "id": "future_policy",
          "importance": "PATH",
          "description": "Future policy intentionally inactive",
          "coverage": "review_only"
        },
        {
          "id": "service_coverage",
          "importance": "PATH",
          "description": "Treatment navigation separate from eligibility",
          "coverage": "review_only"
        }
      ],
      "rules": [
        {
          "id": "mc.residency",
          "dimension": "residency",
          "importance": "GATE",
          "scope": "applicant",
          "stages": [
            "quick",
            "details"
          ],
          "sourceIds": [
            "MC_RESIDENCE"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "eq",
                "args": [
                  {
                    "fact": "shared.ca_residence"
                  },
                  {
                    "literal": true
                  }
                ]
              },
              "then": {
                "status": "reported_condition_met",
                "code": "mc_ca_reported",
                "text": "California residence is reported for this person. Electronic/administrative county verification remains separate."
              }
            }
          ],
          "otherwise": {
            "status": "needs_review",
            "code": "mc_residence_review",
            "text": "Clarify temporary absence, intent, work-entry, age/institutional circumstances or out-of-state residence. Do not decide from an address alone.",
            "action": "review_residency"
          },
          "priority": 1
        },
        {
          "id": "mc.age_route",
          "dimension": "age",
          "importance": "PATH",
          "scope": "applicant",
          "stages": [
            "quick",
            "details"
          ],
          "sourceIds": [
            "MC_CATEGORIES"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "eq",
                "args": [
                  {
                    "fact": "shared.age_band"
                  },
                  {
                    "literal": "under19"
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "mc_child_route",
                "text": "Prepare a child-specific coverage review; do not apply the adult income threshold.",
                "action": "prepare_child_details"
              }
            },
            {
              "when": {
                "op": "eq",
                "args": [
                  {
                    "fact": "shared.age_band"
                  },
                  {
                    "literal": "65plus"
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "mc_older_route",
                "text": "An older-adult/non-MAGI or other pathway needs review. Do not use the new-adult 138% comparison as a verdict.",
                "action": "prepare_non_magi_review"
              }
            }
          ],
          "otherwise": {
            "status": "pathway_to_review",
            "code": "mc_adult_route",
            "text": "Prepare adult-specific coverage details, including category and applicant-specific household.",
            "action": "prepare_adult_details"
          },
          "priority": 2
        },
        {
          "id": "mc.household",
          "dimension": "household",
          "importance": "CALCULATION",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_MAGI"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "gte",
                "args": [
                  {
                    "fact": "mc.prepared_family_size"
                  },
                  {
                    "literal": 1
                  }
                ]
              },
              "then": {
                "status": "reference_only",
                "code": "mc_scoped_family_size",
                "text": "A prepared applicant-specific family size is available. The automatic derivation covers only the documented isolated-adult cases; other sizes require a separately prepared budget.",
                "computed": {
                  "familySize": {
                    "fact": "mc.prepared_family_size"
                  }
                }
              }
            }
          ],
          "otherwise": {
            "status": "needs_review",
            "code": "mc_household_review",
            "text": "Resolve this applicant's tax/dependent/nonfiler household.",
            "action": "prepare_magi_household"
          },
          "priority": 12
        },
        {
          "id": "mc.adult_income",
          "dimension": "income",
          "importance": "CALCULATION",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_FPL_LETTER",
            "MC_FPL_MONTHLY",
            "MC_CATEGORIES",
            "MC_MAGI"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "ne",
                "args": [
                  {
                    "fact": "mc.income_basis",
                    "minTrust": "confirmed"
                  },
                  {
                    "literal": "magi_prepared"
                  }
                ]
              },
              "then": {
                "status": "needs_review",
                "code": "magi_basis_unresolved",
                "text": "This amount is not yet a prepared MAGI-based household budget. Raw wages or CalFresh income cannot be used as a substitute.",
                "action": "prepare_magi_income"
              }
            },
            {
              "when": {
                "op": "interval_lte",
                "args": [
                  {
                    "fact": "mc.monthly_magi_range",
                    "minTrust": "confirmed"
                  },
                  {
                    "op": "table",
                    "table": "mc_fpl_138_2026",
                    "args": [
                      {
                        "fact": "mc.prepared_family_size",
                        "minTrust": "confirmed"
                      }
                    ]
                  }
                ]
              },
              "then": {
                "status": "within_reference",
                "code": "within_mc_fpl_138_2026",
                "text": "Prepared income is at or below the new-adult 138% reference only. Other eligibility conditions and coverage scope remain unresolved.",
                "computed": {
                  "monthlyReferenceCents": {
                    "op": "table",
                    "table": "mc_fpl_138_2026",
                    "args": [
                      {
                        "fact": "mc.prepared_family_size",
                        "minTrust": "confirmed"
                      }
                    ]
                  }
                }
              }
            },
            {
              "when": {
                "op": "interval_gt",
                "args": [
                  {
                    "fact": "mc.monthly_magi_range",
                    "minTrust": "confirmed"
                  },
                  {
                    "op": "table",
                    "table": "mc_fpl_138_2026",
                    "args": [
                      {
                        "fact": "mc.prepared_family_size",
                        "minTrust": "confirmed"
                      }
                    ]
                  }
                ]
              },
              "then": {
                "status": "above_reference",
                "code": "above_mc_fpl_138_2026",
                "text": "Prepared income is above the new-adult 138% reference. This is not a denial of every Medi-Cal pathway.",
                "action": "review_other_coverage_paths",
                "computed": {
                  "monthlyReferenceCents": {
                    "op": "table",
                    "table": "mc_fpl_138_2026",
                    "args": [
                      {
                        "fact": "mc.prepared_family_size",
                        "minTrust": "confirmed"
                      }
                    ]
                  }
                }
              }
            }
          ],
          "otherwise": {
            "status": "needs_review",
            "code": "mc_income_unresolved",
            "text": "A scoped income comparison cannot be completed."
          },
          "priority": 18,
          "when": {
            "op": "and",
            "args": [
              {
                "op": "and",
                "args": [
                  {
                    "op": "gte",
                    "args": [
                      {
                        "fact": "shared.age_years"
                      },
                      {
                        "literal": 19
                      }
                    ]
                  },
                  {
                    "op": "lt",
                    "args": [
                      {
                        "fact": "shared.age_years"
                      },
                      {
                        "literal": 65
                      }
                    ]
                  }
                ]
              },
              {
                "op": "eq",
                "args": [
                  {
                    "fact": "shared.pregnancy_state"
                  },
                  {
                    "literal": "neither"
                  }
                ]
              },
              {
                "op": "eq",
                "args": [
                  {
                    "fact": "mc.medicare"
                  },
                  {
                    "literal": false
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "mc.child_income",
          "dimension": "income",
          "importance": "CALCULATION",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_FPL_LETTER",
            "MC_FPL_MONTHLY",
            "MC_CATEGORIES",
            "MC_MAGI"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "ne",
                "args": [
                  {
                    "fact": "mc.income_basis",
                    "minTrust": "confirmed"
                  },
                  {
                    "literal": "magi_prepared"
                  }
                ]
              },
              "then": {
                "status": "needs_review",
                "code": "magi_basis_unresolved",
                "text": "This amount is not yet a prepared MAGI-based household budget. Raw wages or CalFresh income cannot be used as a substitute.",
                "action": "prepare_magi_income"
              }
            },
            {
              "when": {
                "op": "interval_lte",
                "args": [
                  {
                    "fact": "mc.monthly_magi_range",
                    "minTrust": "confirmed"
                  },
                  {
                    "op": "table",
                    "table": "mc_fpl_266_2026",
                    "args": [
                      {
                        "fact": "mc.prepared_family_size",
                        "minTrust": "confirmed"
                      }
                    ]
                  }
                ]
              },
              "then": {
                "status": "within_reference",
                "code": "within_mc_fpl_266_2026",
                "text": "Prepared income is at or below the child OTLIC 266% reference only. Other eligibility conditions and coverage scope remain unresolved.",
                "computed": {
                  "monthlyReferenceCents": {
                    "op": "table",
                    "table": "mc_fpl_266_2026",
                    "args": [
                      {
                        "fact": "mc.prepared_family_size",
                        "minTrust": "confirmed"
                      }
                    ]
                  }
                }
              }
            },
            {
              "when": {
                "op": "interval_gt",
                "args": [
                  {
                    "fact": "mc.monthly_magi_range",
                    "minTrust": "confirmed"
                  },
                  {
                    "op": "table",
                    "table": "mc_fpl_266_2026",
                    "args": [
                      {
                        "fact": "mc.prepared_family_size",
                        "minTrust": "confirmed"
                      }
                    ]
                  }
                ]
              },
              "then": {
                "status": "above_reference",
                "code": "above_mc_fpl_266_2026",
                "text": "Prepared income is above the child OTLIC 266% reference. This is not a denial of every Medi-Cal pathway.",
                "action": "review_child_coverage_paths",
                "computed": {
                  "monthlyReferenceCents": {
                    "op": "table",
                    "table": "mc_fpl_266_2026",
                    "args": [
                      {
                        "fact": "mc.prepared_family_size",
                        "minTrust": "confirmed"
                      }
                    ]
                  }
                }
              }
            }
          ],
          "otherwise": {
            "status": "needs_review",
            "code": "mc_income_unresolved",
            "text": "A scoped income comparison cannot be completed."
          },
          "priority": 18,
          "when": {
            "op": "lt",
            "args": [
              {
                "fact": "shared.age_years"
              },
              {
                "literal": 19
              }
            ]
          }
        },
        {
          "id": "mc.pregnancy_income",
          "dimension": "income",
          "importance": "CALCULATION",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_FPL_LETTER",
            "MC_FPL_MONTHLY",
            "MC_CATEGORIES",
            "MC_MAGI"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "ne",
                "args": [
                  {
                    "fact": "mc.income_basis",
                    "minTrust": "confirmed"
                  },
                  {
                    "literal": "magi_prepared"
                  }
                ]
              },
              "then": {
                "status": "needs_review",
                "code": "magi_basis_unresolved",
                "text": "This amount is not yet a prepared MAGI-based household budget. Raw wages or CalFresh income cannot be used as a substitute.",
                "action": "prepare_magi_income"
              }
            },
            {
              "when": {
                "op": "interval_lte",
                "args": [
                  {
                    "fact": "mc.monthly_magi_range",
                    "minTrust": "confirmed"
                  },
                  {
                    "op": "table",
                    "table": "mc_fpl_213_2026",
                    "args": [
                      {
                        "fact": "mc.prepared_family_size",
                        "minTrust": "confirmed"
                      }
                    ]
                  }
                ]
              },
              "then": {
                "status": "within_reference",
                "code": "within_mc_fpl_213_2026",
                "text": "Prepared income is at or below the pregnancy 213% reference only. Other eligibility conditions and coverage scope remain unresolved.",
                "computed": {
                  "monthlyReferenceCents": {
                    "op": "table",
                    "table": "mc_fpl_213_2026",
                    "args": [
                      {
                        "fact": "mc.prepared_family_size",
                        "minTrust": "confirmed"
                      }
                    ]
                  }
                }
              }
            },
            {
              "when": {
                "op": "interval_gt",
                "args": [
                  {
                    "fact": "mc.monthly_magi_range",
                    "minTrust": "confirmed"
                  },
                  {
                    "op": "table",
                    "table": "mc_fpl_213_2026",
                    "args": [
                      {
                        "fact": "mc.prepared_family_size",
                        "minTrust": "confirmed"
                      }
                    ]
                  }
                ]
              },
              "then": {
                "status": "above_reference",
                "code": "above_mc_fpl_213_2026",
                "text": "Prepared income is above the pregnancy 213% reference. This is not a denial of every Medi-Cal pathway.",
                "action": "ask_about_mcap_or_other_paths",
                "computed": {
                  "monthlyReferenceCents": {
                    "op": "table",
                    "table": "mc_fpl_213_2026",
                    "args": [
                      {
                        "fact": "mc.prepared_family_size",
                        "minTrust": "confirmed"
                      }
                    ]
                  }
                }
              }
            }
          ],
          "otherwise": {
            "status": "needs_review",
            "code": "mc_income_unresolved",
            "text": "A scoped income comparison cannot be completed."
          },
          "priority": 18,
          "when": {
            "op": "eq",
            "args": [
              {
                "fact": "shared.pregnancy_state"
              },
              {
                "literal": "pregnant"
              }
            ]
          }
        },
        {
          "id": "mc.postpartum",
          "dimension": "pregnancy",
          "importance": "PATH",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_CHANGES",
            "MC_NONCITIZEN"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "pathway_to_review",
            "code": "postpartum_individual_review",
            "text": "Review the pregnancy-end date, prior coverage and applicable postpartum protection. Do not stop coverage because of a new generic income comparison.",
            "action": "review_postpartum_coverage"
          },
          "priority": 19,
          "when": {
            "op": "eq",
            "args": [
              {
                "fact": "shared.pregnancy_state"
              },
              {
                "literal": "postpartum"
              }
            ]
          }
        },
        {
          "id": "mc.medicare_route",
          "dimension": "medicare_disability_ltc",
          "importance": "PATH",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_MAGI",
            "MC_CATEGORIES"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "pathway_to_review",
            "code": "medicare_path_review",
            "text": "Medicare enrollment calls for the applicable Medi-Cal/Medicare Savings or other review; the new-adult comparator is not used.",
            "action": "review_medicare_pathways"
          },
          "priority": 20,
          "when": {
            "op": "and",
            "args": [
              {
                "op": "and",
                "args": [
                  {
                    "op": "gte",
                    "args": [
                      {
                        "fact": "shared.age_years"
                      },
                      {
                        "literal": 19
                      }
                    ]
                  },
                  {
                    "op": "lt",
                    "args": [
                      {
                        "fact": "shared.age_years"
                      },
                      {
                        "literal": 65
                      }
                    ]
                  }
                ]
              },
              {
                "op": "eq",
                "args": [
                  {
                    "fact": "mc.medicare"
                  },
                  {
                    "literal": true
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "mc.foster_route",
          "dimension": "former_foster",
          "importance": "PATH",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_CHANGES"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "eq",
                "args": [
                  {
                    "fact": "mc.former_foster"
                  },
                  {
                    "literal": true
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "former_foster_review",
                "text": "Review former-foster-youth coverage and the applicable history conditions. No ordinary adult income result should close this pathway.",
                "action": "review_former_foster"
              }
            }
          ],
          "otherwise": {
            "status": "not_applicable",
            "code": "foster_branch_not_reported",
            "text": "The reported answer does not trigger this former-foster branch."
          },
          "priority": 21,
          "when": {
            "op": "and",
            "args": [
              {
                "op": "gte",
                "args": [
                  {
                    "fact": "shared.age_years"
                  },
                  {
                    "literal": 18
                  }
                ]
              },
              {
                "op": "lt",
                "args": [
                  {
                    "fact": "shared.age_years"
                  },
                  {
                    "literal": 26
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "mc.immigration",
          "dimension": "immigration_status",
          "importance": "PATH",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_NONCITIZEN",
            "MC_CHANGES",
            "MC_IMMIGRATION_TABLE"
          ],
          "implementation": "executable",
          "branches": [
            {
              "when": {
                "op": "in",
                "args": [
                  {
                    "fact": "shared.immigration_status"
                  },
                  {
                    "literal": [
                      "us_citizen",
                      "us_national"
                    ]
                  }
                ]
              },
              "then": {
                "status": "reported_condition_met",
                "code": "mc_citizenship_category",
                "text": "Reported citizenship/national category is recorded; all other eligibility factors remain separate."
              }
            },
            {
              "when": {
                "op": "in",
                "args": [
                  {
                    "fact": "shared.immigration_status"
                  },
                  {
                    "literal": [
                      "cuban_haitian_entrant",
                      "cofa"
                    ]
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "mc_federal_category",
                "text": "This is a reported category in the current federal full-scope category list. Confirm exact status and all other requirements.",
                "action": "review_full_scope_path"
              }
            },
            {
              "when": {
                "op": "eq",
                "args": [
                  {
                    "fact": "shared.immigration_status"
                  },
                  {
                    "literal": "lpr"
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "mc_lpr_state_federal",
                "text": "LPR history affects federal funding and the waiting period. California state-funded full-scope coverage may remain available when the federal waiting period is unmet.",
                "action": "review_lpr_medi_cal_path"
              }
            },
            {
              "when": {
                "op": "in",
                "args": [
                  {
                    "fact": "shared.immigration_status"
                  },
                  {
                    "literal": [
                      "refugee",
                      "asylee",
                      "withholding",
                      "conditional_entrant",
                      "parole_one_year",
                      "certified_trafficking",
                      "battered_qualified"
                    ]
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "mc_qnc_state_route",
                "text": "For the reported category, review current qualified-noncitizen and state-funded full-scope rules. Loss of a federal funding category is not automatic loss of Medi-Cal.",
                "action": "review_state_full_scope"
              }
            },
            {
              "when": {
                "op": "lt",
                "args": [
                  {
                    "fact": "shared.age_years"
                  },
                  {
                    "literal": 19
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "mc_child_status_exception",
                "text": "Review the child coverage pathway regardless of immigration status, with other requirements still applicable.",
                "action": "review_child_full_scope"
              }
            },
            {
              "when": {
                "op": "in",
                "args": [
                  {
                    "fact": "shared.pregnancy_state"
                  },
                  {
                    "literal": [
                      "pregnant",
                      "postpartum"
                    ]
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "mc_pregnancy_status_exception",
                "text": "Review pregnancy/postpartum coverage regardless of immigration status; applicable period and other conditions still need confirmation.",
                "action": "review_pregnancy_full_scope"
              }
            },
            {
              "when": {
                "op": "and",
                "args": [
                  {
                    "op": "lt",
                    "args": [
                      {
                        "fact": "shared.age_years"
                      },
                      {
                        "literal": 26
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "mc.former_foster"
                      },
                      {
                        "literal": true
                      }
                    ]
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "mc_foster_status_exception",
                "text": "Check former-foster-youth coverage, history and age conditions before considering enrollment restrictions.",
                "action": "review_former_foster"
              }
            },
            {
              "when": {
                "op": "eq",
                "args": [
                  {
                    "fact": "mc.enrollment_context"
                  },
                  {
                    "literal": "current_full_scope"
                  }
                ]
              },
              "then": {
                "status": "pathway_to_review",
                "code": "mc_existing_coverage",
                "text": "Review continuation and renewal of existing full-scope coverage. Do not apply the new-enrollment freeze as an automatic termination.",
                "action": "review_renewal"
              }
            },
            {
              "when": {
                "op": "eq",
                "args": [
                  {
                    "fact": "mc.enrollment_context"
                  },
                  {
                    "literal": "coverage_ended"
                  }
                ]
              },
              "then": {
                "status": "needs_review",
                "code": "mc_reinstatement_review",
                "text": "Review the termination date and any reinstatement/re-enrollment period. The engine does not invent a deadline.",
                "action": "review_coverage_dates"
              }
            }
          ],
          "otherwise": {
            "status": "needs_review",
            "code": "mc_new_enrollment_scope_review",
            "text": "Some adult new enrollments are restricted by current immigration rules. Review the exact category and restricted/full-scope alternatives with the county; this is not a blanket Medi-Cal denial.",
            "action": "county_scope_review"
          },
          "priority": 30
        },
        {
          "id": "mc.magi_resources",
          "dimension": "assets",
          "importance": "SUPPORTING",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_MAGI"
          ],
          "implementation": "executable",
          "branches": [],
          "otherwise": {
            "status": "reference_only",
            "code": "no_magi_asset_test",
            "text": "No asset/resource test is applied in this bounded MAGI income comparison. This does not remove asset rules from non-MAGI pathways."
          },
          "priority": 40,
          "when": {
            "op": "and",
            "args": [
              {
                "op": "lt",
                "args": [
                  {
                    "fact": "shared.age_years"
                  },
                  {
                    "literal": 65
                  }
                ]
              },
              {
                "op": "eq",
                "args": [
                  {
                    "fact": "mc.income_basis"
                  },
                  {
                    "literal": "magi_prepared"
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "mc.nonmagi",
          "dimension": "medicare_disability_ltc",
          "importance": "SUPPORTING",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_MAGI",
            "MC_CATEGORIES"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "needs_review",
            "code": "mc_nonmagi",
            "text": "Disability, long-term-care, medically needy, working-disabled and Medicare Savings methods need separate review; no MAGI result closes them.",
            "action": "official_review_when_applicable"
          },
          "priority": 90
        },
        {
          "id": "mc.nonmagi_assets",
          "dimension": "assets",
          "importance": "SUPPORTING",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_CHANGES",
            "MC_INDEX"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "needs_review",
            "code": "mc_nonmagi_assets",
            "text": "Non-MAGI assets and exclusions must be evaluated within the applicable category. Do not impose an asset limit merely because someone reports a disability.",
            "action": "official_review_when_applicable"
          },
          "priority": 90
        },
        {
          "id": "mc.identity_verification",
          "dimension": "identity_verification",
          "importance": "SUPPORTING",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_RESIDENCE",
            "MC_NONCITIZEN"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "needs_review",
            "code": "mc_identity_verification",
            "text": "County verification is separate from local user-confirmed evidence. No bill or identity scan is universally demanded up front.",
            "action": "official_review_when_applicable"
          },
          "priority": 90
        },
        {
          "id": "mc.application",
          "dimension": "filing_followup",
          "importance": "SUPPORTING",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_RESIDENCE"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "needs_review",
            "code": "mc_application",
            "text": "Application signatures, uploads, verification and decisions occur in the official process. Local progress is not agency status.",
            "action": "official_review_when_applicable"
          },
          "priority": 90
        },
        {
          "id": "mc.future_work",
          "dimension": "future_policy",
          "importance": "SUPPORTING",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_CHANGES"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "needs_review",
            "code": "mc_future_work",
            "text": "Future 2027 work, renewal and other changes are not active in this Q4 2026 configuration.",
            "action": "official_review_when_applicable"
          },
          "priority": 90
        },
        {
          "id": "mc.coverage",
          "dimension": "service_coverage",
          "importance": "PATH",
          "scope": "applicant",
          "stages": [
            "details"
          ],
          "sourceIds": [
            "MC_BENEFITS"
          ],
          "implementation": "review_only",
          "branches": [],
          "otherwise": {
            "status": "needs_review",
            "code": "treatment_coverage_unresolved",
            "text": "Eligibility and coverage of a particular treatment are different. Prepare a question for the provider or plan; do not diagnose or discourage applying based on an unconfirmed coverage concern.",
            "action": "prepare_coverage_question"
          },
          "priority": 80,
          "when": {
            "op": "and",
            "args": [
              {
                "op": "exists",
                "args": [
                  {
                    "fact": "mc.needs_specific_care"
                  }
                ]
              },
              {
                "op": "eq",
                "args": [
                  {
                    "fact": "mc.needs_specific_care"
                  },
                  {
                    "literal": true
                  }
                ]
              }
            ]
          }
        }
      ],
      "sourceIds": [
        "MC_BENEFITS",
        "MC_CATEGORIES",
        "MC_CHANGES",
        "MC_FPL_LETTER",
        "MC_FPL_MONTHLY",
        "MC_IMMIGRATION_TABLE",
        "MC_INDEX",
        "MC_MAGI",
        "MC_NONCITIZEN",
        "MC_RESIDENCE"
      ],
      "officialApplication": "https://benefitscal.com/",
      "rosterPrompt": "Choose the people applying for Medi-Cal. No real names or identity numbers are needed in the engine."
    }
  ],
  "derivations": [
    {
      "id": "derive.mc.isolated_adult",
      "program": "medi_cal",
      "key": "mc.prepared_family_size",
      "when": {
        "op": "and",
        "args": [
          {
            "op": "or",
            "args": [
              {
                "op": "and",
                "args": [
                  {
                    "op": "and",
                    "args": [
                      {
                        "op": "gte",
                        "args": [
                          {
                            "fact": "shared.age_years"
                          },
                          {
                            "literal": 19
                          }
                        ]
                      },
                      {
                        "op": "lt",
                        "args": [
                          {
                            "fact": "shared.age_years"
                          },
                          {
                            "literal": 65
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "mc.tax_role"
                      },
                      {
                        "literal": "independent_filer"
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "mc.lives_with_spouse"
                      },
                      {
                        "literal": false
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "mc.tax_dependents"
                      },
                      {
                        "literal": 0
                      }
                    ]
                  }
                ]
              },
              {
                "op": "and",
                "args": [
                  {
                    "op": "and",
                    "args": [
                      {
                        "op": "gte",
                        "args": [
                          {
                            "fact": "shared.age_years"
                          },
                          {
                            "literal": 19
                          }
                        ]
                      },
                      {
                        "op": "lt",
                        "args": [
                          {
                            "fact": "shared.age_years"
                          },
                          {
                            "literal": 65
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "mc.tax_role"
                      },
                      {
                        "literal": "nonfiler"
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "mc.lives_with_spouse"
                      },
                      {
                        "literal": false
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "mc.resident_children_under19"
                      },
                      {
                        "literal": 0
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "op": "eq",
            "args": [
              {
                "fact": "shared.pregnancy_state"
              },
              {
                "literal": "neither"
              }
            ]
          }
        ]
      },
      "value": {
        "literal": 1
      },
      "sourceIds": [
        "MC_MAGI"
      ]
    },
    {
      "id": "derive.mc.isolated_pregnant",
      "program": "medi_cal",
      "key": "mc.prepared_family_size",
      "when": {
        "op": "and",
        "args": [
          {
            "op": "or",
            "args": [
              {
                "op": "and",
                "args": [
                  {
                    "op": "and",
                    "args": [
                      {
                        "op": "gte",
                        "args": [
                          {
                            "fact": "shared.age_years"
                          },
                          {
                            "literal": 19
                          }
                        ]
                      },
                      {
                        "op": "lt",
                        "args": [
                          {
                            "fact": "shared.age_years"
                          },
                          {
                            "literal": 65
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "mc.tax_role"
                      },
                      {
                        "literal": "independent_filer"
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "mc.lives_with_spouse"
                      },
                      {
                        "literal": false
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "mc.tax_dependents"
                      },
                      {
                        "literal": 0
                      }
                    ]
                  }
                ]
              },
              {
                "op": "and",
                "args": [
                  {
                    "op": "and",
                    "args": [
                      {
                        "op": "gte",
                        "args": [
                          {
                            "fact": "shared.age_years"
                          },
                          {
                            "literal": 19
                          }
                        ]
                      },
                      {
                        "op": "lt",
                        "args": [
                          {
                            "fact": "shared.age_years"
                          },
                          {
                            "literal": 65
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "mc.tax_role"
                      },
                      {
                        "literal": "nonfiler"
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "mc.lives_with_spouse"
                      },
                      {
                        "literal": false
                      }
                    ]
                  },
                  {
                    "op": "eq",
                    "args": [
                      {
                        "fact": "mc.resident_children_under19"
                      },
                      {
                        "literal": 0
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "op": "eq",
            "args": [
              {
                "fact": "shared.pregnancy_state"
              },
              {
                "literal": "pregnant"
              }
            ]
          }
        ]
      },
      "value": {
        "op": "add",
        "args": [
          {
            "literal": 1
          },
          {
            "fact": "shared.expected_children"
          }
        ]
      },
      "sourceIds": [
        "MC_MAGI"
      ]
    },
    {
      "id": "derive.mc.age_band.under19",
      "program": "medi_cal",
      "key": "shared.age_band",
      "when": {
        "op": "and",
        "args": [
          {
            "op": "exists",
            "args": [
              {
                "fact": "shared.age_years"
              }
            ]
          },
          {
            "op": "lt",
            "args": [
              {
                "fact": "shared.age_years"
              },
              {
                "literal": 19
              }
            ]
          }
        ]
      },
      "value": {
        "literal": "under19"
      },
      "sourceIds": [
        "MC_CATEGORIES"
      ]
    },
    {
      "id": "derive.mc.age_band.19to64",
      "program": "medi_cal",
      "key": "shared.age_band",
      "when": {
        "op": "and",
        "args": [
          {
            "op": "exists",
            "args": [
              {
                "fact": "shared.age_years"
              }
            ]
          },
          {
            "op": "and",
            "args": [
              {
                "op": "gte",
                "args": [
                  {
                    "fact": "shared.age_years"
                  },
                  {
                    "literal": 19
                  }
                ]
              },
              {
                "op": "lt",
                "args": [
                  {
                    "fact": "shared.age_years"
                  },
                  {
                    "literal": 65
                  }
                ]
              }
            ]
          }
        ]
      },
      "value": {
        "literal": "19to64"
      },
      "sourceIds": [
        "MC_CATEGORIES"
      ]
    },
    {
      "id": "derive.mc.age_band.65plus",
      "program": "medi_cal",
      "key": "shared.age_band",
      "when": {
        "op": "and",
        "args": [
          {
            "op": "exists",
            "args": [
              {
                "fact": "shared.age_years"
              }
            ]
          },
          {
            "op": "gte",
            "args": [
              {
                "fact": "shared.age_years"
              },
              {
                "literal": 65
              }
            ]
          }
        ]
      },
      "value": {
        "literal": "65plus"
      },
      "sourceIds": [
        "MC_CATEGORIES"
      ]
    }
  ]
}
;
