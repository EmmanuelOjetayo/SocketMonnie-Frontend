import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";

/**
 * Socket Monie — Terms and Conditions of Use
 * Source of truth: Socket_Moni_Terms_and_Conditions_Full.docx (preserved verbatim;
 * bracketed placeholders retained). Do not rewrite or remove legal clauses.
 * This is a faithful JSX transcription of that document.
 */

const sections = [
  {
    id: "1",
    heading: "1. ABOUT SOCKET MONI",
    content: [
      {
        text: "Socket Moni is a digital platform designed to facilitate access to authorised cooperative services, including:",
        list: [
          "membership registration and administration;",
          "cooperative savings and contributions;",
          "share and financial-interest records;",
          "loan applications and administration;",
          "guarantor management;",
          "payment initiation and transaction records;",
          "member statements;",
          "credit and eligibility assessment;",
          "notifications and communications;",
          "branch and chapter administration;",
          "other services approved by the Society.",
        ],
      },
      {
        text: "Socket Moni is a technology platform. Unless separately licensed by the appropriate regulatory authority, Socket Moni is not a bank, deposit-taking institution, insurance company, investment company, electronic-money issuer, payment-service provider or independent lender.",
      },
      {
        text: "Financial services made available through Socket Moni are provided or administered by the relevant registered cooperative society and, where required, appropriately licensed banks, payment-service providers, insurers or other authorised institutions.",
      },
    ],
  },
  {
    id: "2",
    heading: "2. THE SOCIETY AND THE PLATFORM",
    content: [
      { text: "For purposes of these Terms:" },
      { text: '"Socket Moni" or "Platform" means the authorised mobile application, website, software and related technology used to administer the services described in these Terms.' },
      { text: '"Society" means [Registered Society Name], the cooperative society responsible for the cooperative relationship with its members.' },
      { text: '"Technology Provider" means [Insert Legal Name], where applicable, being the company or service provider appointed to develop, host, maintain or support Socket Moni.' },
      { text: '"Payment Partner" means a bank, mobile-money operator, payment-service provider or other institution properly licensed to provide the relevant payment service.' },
      { text: '"Member" means an individual who has satisfied the Society\'s admission requirements and has been formally admitted into the Society.' },
      {
        text: "The Platform may facilitate transactions and display financial information, but member funds shall belong to, or be held for, the Society through authorised financial institutions and shall not become the property of the Technology Provider merely because the transaction was initiated or displayed through Socket Moni.",
      },
    ],
  },
  {
    id: "3",
    heading: "3. ELIGIBILITY",
    content: [
      { text: "You must be at least eighteen (18) years old to register for Socket Moni." },
      {
        text: "You must also satisfy any additional membership or service requirements prescribed by the Society, including applicable requirements concerning:",
        list: [
          "identity;",
          "agricultural or other approved economic activity;",
          "residence or operational location;",
          "referral;",
          "membership qualification;",
          "financial interest;",
          "verification;",
          "and compliance with applicable laws and cooperative rules.",
        ],
      },
      { text: "Socket Moni may refuse, defer or restrict registration where required information has not been supplied or cannot reasonably be verified." },
    ],
  },
  {
    id: "4",
    heading: "4. REGISTRATION DOES NOT AUTOMATICALLY CREATE MEMBERSHIP",
    content: [
      {
        text: "Downloading Socket Moni, creating an account, receiving a referral, receiving an account number or payment reference, paying an application fee or completing digital registration does not automatically make you a member of the Society.",
      },
      { text: "Membership begins only after the Society has:" },
      { list: ["completed the required verification;", "approved the application;", "confirmed any required financial interest;", "recorded the person in the official membership register; and", "completed any additional requirement imposed by applicable cooperative law or the Society's registered bye-laws."] },
      { text: "Where the Society operates an approved legacy-member migration programme, qualified legacy members may be admitted under the applicable migration procedures." },
    ],
  },
  {
    id: "5",
    heading: "5. REFERRALS",
    content: [
      { text: "Where a referral is required for admission, the applicant must obtain a valid referral from an eligible active member." },
      { text: "A referral:", list: ["permits an application to proceed;", "does not guarantee admission;", "does not constitute a loan guarantee; and", "does not make the referrer financially responsible for the applicant."] },
      { text: "A referrer becomes financially liable only where that person separately and expressly accepts a valid guarantor obligation." },
    ],
  },
  {
    id: "6",
    heading: "6. ACCOUNT INFORMATION",
    content: [
      { text: "You must provide complete, truthful and accurate information when registering or using Socket Moni." },
      { text: "You agree to keep relevant information up to date." },
      {
        text: "Socket Moni or the Society may request additional information where necessary to:",
        list: [
          "verify identity;",
          "prevent fraud;",
          "determine membership eligibility;",
          "assess loan eligibility;",
          "verify agricultural or other approved activities;",
          "comply with regulatory requirements;",
          "resolve account discrepancies;",
          "or protect members and the Platform.",
        ],
      },
      { text: "Providing false, misleading, incomplete or fraudulent information may result in rejection, account restriction, suspension, disciplinary action or other lawful measures." },
    ],
  },
  {
    id: "7",
    heading: "7. IDENTITY VERIFICATION",
    content: [
      { text: "You authorise the Society and its authorised service providers, where legally permitted, to verify information supplied by you using appropriate verification services." },
      {
        text: "Verification may include information relating to:",
        list: [
          "full name;",
          "date of birth;",
          "telephone number;",
          "email address;",
          "residential or farm location;",
          "National Identification Number;",
          "Bank Verification Number;",
          "Cooperative Member Identification Number;",
          "photograph;",
          "farming or business activity;",
          "and other information reasonably required for the relevant service.",
        ],
      },
      { text: "Personal information shall only be processed in accordance with applicable data-protection requirements and the Socket Moni Privacy Policy." },
    ],
  },
  {
    id: "8",
    heading: "8. ACCOUNT SECURITY",
    content: [
      { text: "You are responsible for protecting your: password; PIN; one-time passwords; authentication codes; registered device; biometric credentials; and other account-security information." },
      { text: "You must not intentionally disclose security credentials to another person." },
      {
        text: "You must notify Socket Moni promptly if you reasonably believe that:",
        list: [
          "your account has been compromised;",
          "your device has been lost or stolen;",
          "your login credentials have been disclosed;",
          "an unauthorised transaction has occurred;",
          "or another person has gained access to your account.",
        ],
      },
      { text: "Socket Moni may temporarily restrict an account where necessary to investigate suspected fraud, compromise or unauthorised activity." },
    ],
  },
  {
    id: "9",
    heading: "9. COOPERATIVE SHARES AND SAVINGS",
    content: [
      { text: "Where applicable, the Society may maintain separate records for:", list: ["shares;", "compulsory savings;", "voluntary savings;", "loan balances;", "accrued interest;", "guarantee holds;", "produce proceeds;", "refunds;", "and other approved financial interests."] },
      { text: "Amounts displayed within Socket Moni represent records maintained for cooperative administration and shall not automatically constitute a bank deposit or independently issued electronic-money balance." },
      {
        text: "Certain savings, shares or other interests may be restricted from withdrawal where they are:",
        list: [
          "compulsory;",
          "pledged;",
          "subject to a guarantee;",
          "subject to a lawful lien or set-off;",
          "connected to an outstanding loan;",
          "or otherwise restricted under the registered bye-laws or an accepted contract.",
        ],
      },
    ],
  },
  {
    id: "10",
    heading: "10. PAYMENTS AND COLLECTIONS",
    content: [
      { text: "Socket Moni may allow you to initiate payments through authorised Payment Partners." },
      { text: "The actual receipt, transfer, direct debit, card payment, bank transfer, virtual-account transaction, cash-out or similar regulated payment service shall be processed by a properly authorised institution." },
      { text: "A transaction may be shown as:", list: ["pending;", "processing;", "successful;", "failed;", "reversed;", "refunded;", "or otherwise appropriately classified."] },
      { text: "A pending transaction shall not be treated as finally settled until confirmation has been received from the relevant payment channel or financial institution." },
    ],
  },
  {
    id: "11",
    heading: "11. VIRTUAL ACCOUNTS AND PAYMENT REFERENCES",
    content: [
      { text: "Where available, you may be assigned a dedicated virtual account number or payment reference." },
      { text: "Such an account or reference is provided for payment identification and reconciliation." },
      { text: "Unless expressly stated otherwise by the licensed institution providing the service, it does not constitute a separate personal bank account operated by Socket Moni." },
      { text: "Funds received through such arrangements shall settle according to the approved structure established between the Society and the relevant Payment Partner." },
    ],
  },
  {
    id: "12",
    heading: "12. TRANSACTION RECORDS",
    content: [
      { text: "Each financial transaction should, where applicable, contain identifying information such as:", list: ["transaction reference;", "amount;", "date and time;", "transaction type;", "status;", "payment channel;", "and relevant payer or recipient information."] },
      { text: "You are responsible for reviewing your transaction history and notifying Socket Moni promptly of any discrepancy." },
      { text: "Where a correction is required, records should be corrected through traceable adjustment, reversal or replacement procedures rather than through unexplained alteration of financial balances." },
    ],
  },
  {
    id: "13",
    heading: "13. WITHDRAWALS AND REFUNDS",
    content: [
      { text: "Withdrawal of eligible savings or other amounts may be subject to:", list: ["verification;", "applicable notice periods;", "sufficient available balance;", "Society liquidity;", "outstanding obligations;", "guarantee holds;", "applicable policies;", "and authorised payment processing."] },
      { text: "Refunds and transaction reversals may require investigation and supporting evidence before completion." },
    ],
  },
  {
    id: "14",
    heading: "14. LOAN SERVICES",
    content: [
      { text: "Eligible members may apply for loans through Socket Moni." },
      { text: "Submission of a loan application does not guarantee approval." },
      { text: "Loan approval may take into consideration:", list: ["eligible savings;", "membership history;", "repayment history;", "affordability;", "loan purpose;", "existing obligations;", "guarantor capacity;", "credit assessment;", "agricultural or income cycle;", "available cooperative funds;", "and other approved risk considerations."] },
      { text: "The specific amount, interest, repayment schedule, charges and other conditions applicable to a loan shall be disclosed before the member accepts the loan." },
    ],
  },
  {
    id: "15",
    heading: "15. STANDARD LOAN FRAMEWORK",
    content: [
      {
        text: "Subject to the Society's registered bye-laws, approved policies and the specific loan offer presented to the member, the standard lending structure may provide for:",
        list: [
          "an ordinary loan of up to two times eligible savings;",
          "an enhanced loan of up to three times eligible savings for qualifying members;",
          "four qualified member guarantors;",
          "interest calculated at one per cent (1%) per month on outstanding principal;",
          "no interest charged on previously accrued interest;",
          "a three-month payment moratorium;",
          "nine scheduled monthly repayments following the moratorium; and",
          "a standard maximum term of twelve months from disbursement.",
        ],
      },
      { text: "The maximum amount available under any loan category is a ceiling and does not create an automatic entitlement to that amount." },
      { text: "The actual loan offer accepted by the member shall govern the transaction, subject to applicable law and the Society's registered bye-laws." },
    ],
  },
  {
    id: "16",
    heading: "16. LOAN MORATORIUM AND REPAYMENT",
    content: [
      { text: "Where a three-month moratorium applies, no scheduled principal repayment is required during the moratorium period." },
      { text: "However, simple interest may accrue on outstanding principal during the moratorium where stated in the accepted loan agreement." },
      { text: "After the moratorium, the outstanding principal and applicable interest shall be repaid according to the repayment schedule presented to and accepted by the borrower." },
      { text: "Members may repay a loan early without penalty where the applicable loan terms permit it." },
    ],
  },
  {
    id: "17",
    heading: "17. GUARANTORS",
    content: [
      { text: "Certain loans may require guarantors." },
      { text: "A person becomes a guarantor only after giving separate, informed and authenticated consent." },
      { text: "Being a: referrer; relative; friend; branch officer; cooperative officer; or associate of a borrower does not by itself create a guarantee obligation." },
      {
        text: "Before accepting a guarantee, the prospective guarantor should be informed of relevant matters including:",
        list: [
          "the loan amount;",
          "the guarantor's maximum exposure;",
          "the repayment period;",
          "the applicable borrower risk information;",
          "circumstances under which deductions may occur;",
          "and conditions for release of the guarantee.",
        ],
      },
    ],
  },
  {
    id: "18",
    heading: "18. GUARANTEE HOLDS",
    content: [
      { text: "Where permitted by the Society's rules, an amount of a guarantor's eligible unencumbered cooperative savings may be placed on hold to secure the accepted guarantee obligation." },
      { text: "Amounts subject to a valid guarantee hold may not be withdrawn or pledged again until the guarantee exposure has been reduced or discharged." },
      { text: "A guarantor cannot ordinarily withdraw from an accepted guarantee after loan disbursement unless an eligible replacement has been approved and the required substitution process has been completed." },
    ],
  },
  {
    id: "19",
    heading: "19. DEFAULT AND RECOVERY",
    content: [
      { text: "A loan instalment becomes overdue after its due date." },
      { text: "Where applicable, the Society may provide reminders and a grace period before further action is taken." },
      { text: "Formal default may arise where:", list: ["an amount remains unpaid for the applicable default period;", "material false information was used to obtain the loan;", "the borrower deliberately misuses the loan;", "the borrower repudiates the obligation;", "fraud occurs;", "or another event of default specified in the loan agreement takes place."] },
      { text: "Subject to applicable procedures, recovery measures may include:", list: ["direct repayment requests;", "restructuring consideration;", "set-off against eligible borrower interests;", "recovery from applicable produce proceeds;", "enforcement against approved collateral or financed assets;", "deductions from valid guarantor security within accepted limits;", "and other lawful recovery measures."] },
      { text: "A borrower remains liable for outstanding obligations even where part of the debt has been recovered from guarantors." },
    ],
  },
  {
    id: "20",
    heading: "20. CREDIT SCORING AND ELIGIBILITY ASSESSMENT",
    content: [
      { text: "The Society may operate an internal cooperative credit-assessment or scoring system." },
      { text: "Relevant factors may include:", list: ["repayment history;", "savings behaviour;", "guarantee conduct;", "referral conduct;", "participation;", "and verified agricultural or economic activity."] },
      { text: "A credit score may support but should not automatically replace affordability assessment, purpose assessment or human review where required." },
      { text: "You may request correction of materially inaccurate information used in an assessment." },
    ],
  },
  {
    id: "21",
    heading: "21. FEES AND CHARGES",
    content: [
      { text: "Any material fees or charges applicable to a transaction or service should be disclosed before confirmation where reasonably practicable." },
      { text: "Applicable charges may include fees imposed by:", list: ["the Society;", "banks;", "payment processors;", "verification providers;", "or other authorised service providers."] },
      { text: "No undisclosed Technology Provider service fee should be secretly deducted from member cooperative savings." },
    ],
  },
  {
    id: "22",
    heading: "22. ELECTRONIC CONSENT",
    content: [
      { text: "You agree that transactions, applications, consents and instructions may be completed electronically where appropriate security and authentication procedures are used." },
      { text: "Electronic acceptance may include:", list: ["selecting an acceptance button;", "entering a PIN;", "providing an OTP;", "biometric confirmation;", "authenticated digital approval;", "or another approved electronic confirmation method."] },
      { text: "An authenticated electronic instruction may have the same effect as a written instruction to the extent permitted by law." },
    ],
  },
  {
    id: "23",
    heading: "23. COMMUNICATIONS AND NOTICES",
    content: [
      { text: "You agree that Socket Moni may send important service communications through:", list: ["in-app notifications;", "SMS;", "email;", "push notifications;", "telephone;", "approved messaging channels;", "or other contact details supplied by you."] },
      { text: "You are responsible for maintaining accurate contact information." },
      { text: "Service-related notices may include:", list: ["account alerts;", "transaction notifications;", "repayment reminders;", "security warnings;", "guarantee requests;", "meeting notices;", "policy updates;", "and other important account information."] },
    ],
  },
  {
    id: "24",
    heading: "24. DATA PROTECTION AND PRIVACY",
    content: [
      { text: "Personal data shall be processed lawfully, fairly and transparently in accordance with applicable Nigerian data-protection requirements." },
      { text: "Information may be processed for purposes including:", list: ["membership administration;", "identity verification;", "payments;", "fraud prevention;", "savings administration;", "loan assessment;", "guarantees;", "credit assessment;", "customer support;", "security;", "audit;", "regulatory compliance;", "and service improvement."] },
      { text: "Further details concerning the collection, use, disclosure, storage and protection of personal information shall be contained in the Socket Moni Privacy Policy." },
    ],
  },
  {
    id: "25",
    heading: "25. SECURITY AND AUDIT TRAILS",
    content: [
      { text: "Socket Moni may maintain logs and audit records relating to:", list: ["financial transactions;", "account changes;", "loan decisions;", "guarantee consent;", "administrative actions;", "authentication activity;", "and security events."] },
      { text: "These records may be retained for security, audit, dispute resolution and regulatory purposes." },
    ],
  },
  {
    id: "26",
    heading: "26. PROHIBITED USE",
    content: [
      { text: "You must not use Socket Moni to:", list: ["commit fraud;", "impersonate another person;", "provide knowingly false information;", "launder money or conceal unlawful proceeds;", "compromise another user's account;", "interfere with Platform security;", "manipulate transaction records;", "exploit software vulnerabilities;", "use automated methods to gain unauthorised access;", "conduct unlawful activities;", "or assist another person in doing any prohibited act."] },
      { text: "Suspected unlawful activity may be reported to the appropriate authorities where required by law." },
    ],
  },
  {
    id: "27",
    heading: "27. SERVICE AVAILABILITY",
    content: [
      { text: "Socket Moni aims to provide reliable access to its services." },
      { text: "However, uninterrupted or error-free access cannot be guaranteed." },
      { text: "Services may be interrupted because of:", list: ["scheduled maintenance;", "emergency maintenance;", "telecommunications failure;", "internet failure;", "banking-system interruption;", "Payment Partner downtime;", "cybersecurity incidents;", "power failure;", "government action;", "natural events;", "or circumstances beyond reasonable control."] },
      { text: "Reasonable steps will be taken to restore affected services." },
    ],
  },
  {
    id: "28",
    heading: "28. THIRD-PARTY SERVICES",
    content: [
      { text: "Socket Moni may integrate with third-party providers including banks, payment processors, identity-verification services, insurers and other authorised institutions." },
      { text: "Those providers may operate under their own terms and privacy notices." },
      { text: "Socket Moni shall not represent itself as providing a separately regulated service where that service is in fact being provided by a licensed third party." },
    ],
  },
  {
    id: "29",
    heading: "29. ACCOUNT RESTRICTION OR SUSPENSION",
    content: [
      { text: "Access to an account or particular service may be temporarily restricted where reasonably necessary because of:", list: ["suspected fraud;", "account compromise;", "incomplete verification;", "material arrears;", "security risk;", "legal or regulatory requirements;", "breach of these Terms;", "or investigation of a disputed transaction."] },
      { text: "Where appropriate, the user should be informed of the reason and given an opportunity to resolve the matter." },
    ],
  },
  {
    id: "30",
    heading: "30. TERMINATION OF MEMBERSHIP",
    content: [
      { text: "Closing a Socket Moni account does not automatically discharge:", list: ["outstanding loans;", "guarantee obligations;", "unpaid charges;", "liabilities arising before closure;", "lawful holds;", "or other obligations owed to the Society."] },
      { text: "Termination of cooperative membership shall be governed by the Society's registered bye-laws and applicable law." },
    ],
  },
  {
    id: "31",
    heading: "31. COMPLAINTS",
    content: [
      { text: "Complaints relating to Socket Moni should first be submitted through the official support channels." },
      { text: "Socket Moni and the Society should maintain procedures for reviewing and resolving complaints concerning:", list: ["account access;", "payments;", "balances;", "savings;", "loans;", "guarantees;", "membership;", "privacy;", "security;", "and other services."] },
      { text: "Users should provide sufficient details and supporting evidence to allow proper investigation." },
    ],
  },
  {
    id: "32",
    heading: "32. DISPUTE RESOLUTION",
    content: [
      { text: "Where a dispute concerns cooperative membership, loans, guarantees, disciplinary matters or other Society affairs, applicable internal dispute procedures and statutory cooperative dispute mechanisms may apply." },
      { text: "Nothing in these Terms removes any right or remedy that cannot lawfully be excluded." },
    ],
  },
  {
    id: "33",
    heading: "33. INTELLECTUAL PROPERTY",
    content: [
      { text: "The Socket Moni name, logo, software, interface, databases, designs, content and related intellectual property belong to their respective lawful owners." },
      { text: "You receive a limited, personal, non-exclusive and revocable right to use the Platform for its intended purpose." },
      { text: "You may not copy, modify, reverse-engineer, reproduce, sell, licence or commercially exploit protected Platform materials except as permitted by law or written authorisation." },
    ],
  },
  {
    id: "34",
    heading: "34. LIMITATION OF LIABILITY",
    content: [
      { text: "Nothing in these Terms excludes liability where exclusion would be unlawful." },
      {
        text: "Subject to applicable law, Socket Moni, the Society and authorised service providers shall not be responsible for losses caused solely by:",
        list: [
          "incorrect information supplied by the user;",
          "disclosure of security credentials by the user;",
          "unauthorised activity resulting from the user's failure to protect credentials;",
          "failure of telecommunications networks outside reasonable control;",
          "downtime of independent financial-service providers;",
          "events beyond reasonable control;",
          "or a user's breach of these Terms.",
        ],
      },
      { text: "This clause does not excuse fraud, gross negligence, deliberate misconduct or other liability that cannot lawfully be excluded." },
    ],
  },
  {
    id: "35",
    heading: "35. CHANGES TO THESE TERMS",
    content: [
      { text: "These Terms may be updated where reasonably necessary because of:", list: ["changes in law;", "regulatory requirements;", "registered cooperative amendments;", "security improvements;", "new services;", "operational changes;", "or changes to third-party integrations."] },
      { text: "Where a change materially affects a member's rights or obligations, reasonable notice should be provided before the change takes effect, except where immediate action is required by law or for security reasons." },
      { text: "A Platform setting or policy shall not retrospectively increase a member's financial liability contrary to law or an accepted contract." },
    ],
  },
  {
    id: "36",
    heading: "36. RELATIONSHIP WITH THE SOCIETY'S BYE-LAWS",
    content: [
      { text: "These Terms regulate use of Socket Moni." },
      { text: "They do not replace the Society's registered bye-laws." },
      {
        text: "Where there is a conflict between:",
        list: ["1. applicable law;", "2. registered cooperative bye-laws;", "3. an individually accepted financial contract;", "and 4. these Platform Terms,"],
      },
      { text: "the document with superior legal authority shall prevail to the extent of the conflict." },
    ],
  },
  {
    id: "37",
    heading: "37. GOVERNING LAW",
    content: [
      { text: "These Terms shall be governed by the applicable laws of the Federal Republic of Nigeria, including laws and regulations applicable to cooperative societies, electronic transactions, payment services, consumer protection and data protection." },
    ],
  },
  {
    id: "38",
    heading: "38. CONTACT AND SUPPORT",
    content: [
      { text: "Questions, complaints or notices regarding these Terms may be submitted through:", list: ["Socket Moni Support;", "Email: [Insert Official Email];", "Telephone: [Insert Telephone Number];", "Website: [Insert Website];", "Registered Address: [Insert Address]."] },
    ],
  },
];

const acceptanceItems = [
  "you have read and understood these Terms;",
  "you agree to comply with these Terms and applicable cooperative rules;",
  "the information you provide will be truthful and accurate;",
  "you understand that Socket Moni is a digital platform and is not automatically the custodian of cooperative funds;",
  "you understand that regulated payment services may be provided by licensed third-party institutions;",
  "you understand that loans, savings and guarantees are subject to applicable conditions and separate financial agreements;",
  "and you consent to lawful electronic communication, authentication and processing necessary to provide the services.",
];

export function Terms({ onAccepted }) {
  const [agreed, setAgreed] = useState(false);
  const [readSections, setReadSections] = useState([]);

  const markSectionRead = (id) => {
    setReadSections((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const allRead = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38"];

  const handleAccept = () => {
    if (!agreed) return;
    onAccepted?.({ agreed: true, acceptedAt: new Date().toISOString(), version: "1.0" });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-16">
      {/* Header */}
      <header className="relative px-5 py-6 text-white shadow-md" style={{ background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)", borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <div className="flex items-center justify-between">
          <Link to={ROUTES.LOGIN} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">Terms & Conditions</h1>
          <div className="w-10" />
        </div>
        <p className="mt-2 text-center text-xs font-medium text-[#dee3f9]">Socket Monie Digital Cooperative Platform</p>
      </header>

      {/* Document */}
      <main className="max-w-3xl mx-auto px-5 py-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-[#EEF1FD] flex items-center justify-center text-[#3B62EC] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Socket Moni — Terms and Conditions of Use</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Comprehensive Draft</p>
            </div>
          </div>

          <p className="text-xs text-gray-600">Effective Date: [Insert Effective Date]</p>
          <p className="text-xs text-gray-600">Last Updated: [Insert Date]</p>
          <p className="text-xs text-gray-600">Prepared for the Socket Moni digital cooperative platform</p>
          <p className="text-[11px] text-gray-500 mt-2">Please read these Terms carefully before creating an account or using any Socket Moni service.</p>
          <p className="text-[11px] text-gray-600 mt-3">
            By selecting “I Agree,” “Accept,” “Continue,” or any similar confirmation, creating an account, submitting an application, initiating a transaction or otherwise using Socket Moni, you confirm that you have read, understood and agreed to these Terms.
          </p>
          <p className="text-[11px] text-gray-600">If you do not agree with these Terms, you should not register for or use Socket Moni.</p>

          {/* Sections */}
          <div className="mt-6 space-y-6">
            {sections.map((section) => (
              <section key={section.id} className="scroll-mt-6" onScrollCapture={() => markSectionRead(section.id)}>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{section.heading}</h3>
                <div className="space-y-3">
                  {section.content.map((block, idx) => (
                    <div key={idx}>
                      <p className="text-xs text-gray-700 leading-relaxed">{block.text}</p>
                      {block.list && (
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {block.list.map((item, i) => (
                            <li key={i} className="text-xs text-gray-700 leading-relaxed">{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* USER ACCEPTANCE */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">USER ACCEPTANCE</h3>
            <p className="text-xs text-gray-700 mb-3">By selecting “I Agree”, creating or activating your Socket Moni account, or continuing to use the Platform, you confirm that:</p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              {acceptanceItems.map((item, idx) => (
                <li key={idx} className="text-xs text-gray-700">{item}</li>
              ))}
            </ul>
            <label className="flex items-start gap-2 cursor-pointer bg-[#EEF1FD] border border-[#3B62EC]/30 rounded-2xl p-3">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 rounded text-[#3B62EC] focus:ring-0" />
              <span className="text-xs font-semibold text-gray-900">☐ I have read and agree to the Socket Moni Terms and Conditions.</span>
            </label>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-[10px] text-gray-400">Version v1.0</p>
              <Button fullWidth onClick={handleAccept} disabled={!agreed} className="bg-[#3B62EC] hover:bg-[#3052D1] rounded-full">
                I Agree & Accept
              </Button>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 text-center mt-4">Document note: Replace all bracketed placeholders with the final approved legal and contact details before publication or implementation.</p>
      </main>
    </div>
  );
}
