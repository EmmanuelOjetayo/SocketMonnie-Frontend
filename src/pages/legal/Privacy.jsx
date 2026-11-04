import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";

/**
 * Socket Monie — Privacy Policy
 * Informational consent surface linked from Terms & Conditions acceptance flows.
 * Points users to the governing legal text (see Terms §7 Identity Verification and §24 Data Protection and Privacy).
 */

const sections = [
  {
    id: "1",
    heading: "1. INFORMATION WE COLLECT",
    content: [
      { text: "We collect information you provide directly when you register or use the Platform, including:" },
      { list: ["full name;", "email address;", "phone number;", "residential address; and", "other profile information you choose to add."] },
      { text: "We also collect information collected during account security and verification workflows, including:" },
      { list: ["password and PIN (hashed);", "one-time passwords and authentication codes;", "identity documents such as National Identification Number or Bank Verification Number;", "and selfie verification images."] },
      { text: "We may also collect limited technical and usage data required for security, fraud prevention and service improvement." },
    ],
  },
  {
    id: "2",
    heading: "2. HOW WE USE YOUR INFORMATION",
    content: [
      { text: "We use your information to:" },
      { list: ["create and administer your member account;", "verify identity and eligibility;", "process savings, loan and payment transactions;", "assess cooperative credit and eligibility;", "provide notifications and customer support;", "maintain security and audit trails; and", "comply with regulatory and legal obligations."] },
    ],
  },
  {
    id: "3",
    heading: "3. DATA PROTECTION",
    content: [
      { text: "Personal data shall be processed lawfully, fairly and transparently in accordance with applicable Nigerian data-protection requirements." },
      { text: "Processing is carried out for purposes including membership administration; identity verification; payments; fraud prevention; savings administration; loan assessment; guarantees; credit assessment; customer support; security; audit; regulatory compliance; and service improvement." },
      { text: "Further details concerning the collection, use, disclosure, storage and protection of personal information are set out in the Socket Moni Privacy Policy referenced within the Terms and Conditions (see Sections 7 and 24)." },
    ],
  },
  {
    id: "4",
    heading: "4. RETENTION & SECURITY",
    content: [
      { text: "Personal information is retained only as long as necessary for the purposes described herein or as required by applicable law." },
      { text: "Account security measures include authentication via httpOnly session cookies, timing-safe verification, and audit logging of authentication activity and administrative actions." },
    ],
  },
  {
    id: "5",
    heading: "5. THIRD-PARTY PROVIDERS",
    content: [
      { text: "We may integrate with licensed third-party providers including banks, payment processors, identity-verification services and insurers. These providers operate under their own terms and privacy notices." },
    ],
  },
  {
    id: "6",
    heading: "6. YOUR RIGHTS & CONTACT",
    content: [
      { text: "You may request access to, correction of, or deletion of your personal information where required by applicable law, subject to cooperative and regulatory obligations." },
      { text: "Questions or complaints regarding privacy may be submitted through the official Socket Moni support channels." },
    ],
  },
];

export function Privacy() {
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    setAgreed(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-16">
      <header className="relative px-5 py-6 text-white shadow-md" style={{ background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)", borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
        <div className="flex items-center justify-between">
          <Link to={ROUTES.LOGIN} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">Privacy Policy</h1>
          <div className="w-10" />
        </div>
        <p className="mt-2 text-center text-xs font-medium text-[#dee3f9]">Socket Monie Digital Cooperative Platform</p>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-[#EEF1FD] flex items-center justify-center text-[#3B62EC] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Socket Monie — Privacy Policy</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Information Protection & Data Handling</p>
            </div>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.id}>
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

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-[11px] text-gray-600 mb-4">
              By using Socket Moni you also agree to the <Link to={ROUTES.TERMS} className="font-semibold text-[#3B62EC]">Terms and Conditions</Link>.
            </p>
            <label className="flex items-start gap-2 cursor-pointer bg-[#EEF1FD] border border-[#3B62EC]/30 rounded-2xl p-3 mb-5">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 rounded text-[#3B62EC] focus:ring-0" />
              <span className="text-xs font-semibold text-gray-900">I have read and acknowledge the Socket Monie Privacy Policy.</span>
            </label>
            <Button fullWidth onClick={handleAccept} disabled={!agreed} className="bg-[#3B62EC] hover:bg-[#3052D1] rounded-full">
              I Acknowledge & Continue
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 text-center mt-4">For the full legal text, refer to the Socket Moni Terms and Conditions of Use.</p>
      </main>
    </div>
  );
}
