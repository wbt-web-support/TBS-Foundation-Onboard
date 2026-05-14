import { isFieldGroupKickoffDeferred, isProvideLaterSentinel } from "@/lib/answers";import { GALLERIES } from "@/lib/schema/galleries";
import { ONBOARDING_SCHEMA } from "@/lib/schema/questions";
import type { Question } from "@/lib/schema/types";
import type {
  AnswerValue,
  Answers,
  FieldGroupAnswer,
  RepeatableAnswer,
  TimeRangeAnswer,
} from "@/lib/types";

/** Keys written in the legacy `{ Question, Answer }` export shape (for stripping on load). */
export const LEGACY_EXPORT_KEYS = new Set<string>([
  "Company_Information_Part1",
  "Company_Information_Part2",
  "Company_Information_Part3",
  "Company_Information_Part4",
  "Company_Information_Part5",
  "Business_Proof_Of_Address",
  "Have_Any_Business_Colleagues",
  "Business_Colleagues_Details",
  "How_Many_Employees",
  "Vans_on_The_Road",
  "Van_Image",
  "Available_For_Emergency",
  "Provide_Finance_Option",
  "Finance_Company_Name",
  "Business_Operate",
  "Mile_Radius_And_Target_Towns",
  "Business_Opening_Hours",
  "Why_Customer_Choose_You",
  "Second_Part_Information",
  "New_Logo_Design",
  "Style_Of_Logo",
  "Logo_Upload_Or_Description",
  "Mockup_Type",
  "Mockup_Template_Choice",
  "Mockup_Changes_Details",
  "Affiliated_Website",
  "Your_Business_Industry_Type",
  "Products_Brand_Names",
  "Certification_Names",
  "Service_You_Promote",
  "Google_Sheet_Products_URL",
  "Offer_for_Customers",
  "What_Font_Use_For_Website",
  "Current_Fonts_Description",
  "Heading_Fonts",
  "Paragraph_Fonts",
  "How_Color_You_Choose",
  "Colour_Palette_Choice",
  "Colour_Palette_Description",
  "Button_Style_You_Like",
  "Tone_Of_Voice",
  "Features_Like_to_Add",
  "Features_Reference_Website",
  "Social_Media_URL",
  "Do_You_Have_Review",
  "Review_URL_Links",
  "Email_Show_On_Website",
  "Third_Part_Information",
  "Customer_Average_Age",
  "Key_Words_For_Find_Business",
  "Top_Keywords_List",
  "Everage_Customer_Worth_Over_Lifetime",
  "Leades_Converted_into_Sales",
  "How_Many_Leades_Looking_to_Target",
  "Have_You_Tried_Google_Ads_Before",
  "How_did_it_turn_out",
  "Postcodes_to_Run_Ads",
  "Describe_Your_Sales_Process_Google",
  "Have_You_Tried_Facebook_Ads",
  "Facebook_Ads_Details",
  "Describe_Your_Sales_Process_Facebook",
  "Fourth_Part_Information",
  "Do_You_Have_Website",
  "Current_Website_URL",
  "Host_New_On_Current_Domain",
  "Other_Affiliated_Website_URL",
  "Domain_Manage_By_Any_Company",
  "Website_Manager_Details",
  "Desired_Domain_Name",
  "Have_you_Domain_Register",
  "Domain_Provider",
  "GoDaddy_Delegate_Access",
  "Domain_Provider_Other_Name",
  "Domain_Provider_Credentials",
  "Payment_Accepted_By",
  "Stripe_Developer_Access",
  "Facebook_Page_Access",
  "Job_Management_Software",
  "Job_Management_Software_Other",
  "Job_Software_Credentials",
  "On_Boarding_Experience",
  "Your_Feedback",
]);

type LegacyEntry = { Question: string; Answer: string | Record<string, string> };

function findQuestion(id: string): Question | undefined {
  for (const s of ONBOARDING_SCHEMA.sections) {
    const q = s.questions.find((x) => x.id === id);
    if (q) return q;
  }
  return undefined;
}

function subOptionLabel(parentId: string, subId: string, value: string): string {
  const q = findQuestion(parentId);
  if (q?.type !== "field-group" || !q.group) return value;
  const sub = q.group.find((s) => s.id === subId);
  const o = sub?.options?.find((x) => x.value === value);
  return o?.label ?? value;
}

function optionLabel(questionId: string, value: string): string {
  const q = findQuestion(questionId);
  const o = q?.options?.find((x) => x.value === value);
  return o?.label ?? value;
}

function multiLabels(questionId: string, values: string[]): string {
  return values.map((v) => optionLabel(questionId, v)).join(", ");
}

function fg(answers: Answers, id: string): FieldGroupAnswer | undefined {
  const v = answers[id];
  if (v && typeof v === "object" && !Array.isArray(v) && !("open" in (v as object))) {
    return v as FieldGroupAnswer;
  }
  return undefined;
}

function rep(answers: Answers, id: string): RepeatableAnswer | undefined {
  const v = answers[id];
  if (Array.isArray(v)) return v as RepeatableAnswer;
  return undefined;
}

function str(v: AnswerValue | undefined): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return "";
}

function htmlDiv(text: string): string {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<div>${esc}</div>`;
}

function formatPartners(rows: RepeatableAnswer): string {
  return rows
    .map((row) => {
      const fn = str(row.first_name);
      const ln = str(row.last_name);
      const em = str(row.email);
      const ph = str(row.phone);
      return `<div> <span> Name: </span> <span> ${fn} ${ln}</span></div><br /><div>  <span> Email: </span> <span>  ${em}</span></div><br /><div> <span> Phone: </span> <span>${ph}</span></div>`;
    })
    .join("<br />");
}

function formatRepeatableReasons(rows: RepeatableAnswer): string {
  return rows.map((row) => htmlDiv(`${str(row.reason)} — ${str(row.description)}`)).join("<br />");
}

function formatWebsiteFeatures(rows: RepeatableAnswer): string {
  return rows
    .map((row) => htmlDiv(`${str(row.feature)}${str(row.url) ? ` (${str(row.url)})` : ""}`))
    .join("<br />");
}

function formatLikedWebsites(rows: RepeatableAnswer): string {
  return rows
    .map((row) => htmlDiv(`${str(row.website_url)} — ${str(row.what_you_like)}`))
    .join("<br />");
}

function formatOffers(rows: RepeatableAnswer): string {
  return rows.map((row) => htmlDiv(`${str(row.offer)}: ${str(row.description)}`)).join("<br />");
}

function formatReviewUrls(rows: RepeatableAnswer): string {
  return rows.map((row) => htmlDiv(str(row.url))).join("<br class='separate'  />");
}

function to12h(time24: string): string {
  const [hRaw, mRaw] = time24.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(m) || m < 0 || m > 59) return time24;
  const mer = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")}${mer}`;
}

function formatOpeningHours(tr: TimeRangeAnswer): string {
  if (tr.alwaysOpen) {
    return `<div> <span> Every Day: </span> <span>24 hours</span></div>`;
  }
  const open = to12h(tr.open);
  const close = to12h(tr.close);
  return `<div> <span> Mon–Fri: </span> <span> ${open} to  ${close}</span></div>`;
}

function galleryLabels(question: Question | undefined, value: AnswerValue | undefined): string {
  if (!question) return str(value as AnswerValue);
  const opts = question.galleryOptions ?? (question.galleryKey ? GALLERIES[question.galleryKey] : []) ?? [];
  const ids = Array.isArray(value) ? value : value ? [String(value)] : [];
  return ids
    .map((id) => opts.find((o) => o.id === id)?.label ?? id)
    .filter(Boolean)
    .join(", ");
}

function entry(question: string, answer: string | Record<string, string>): LegacyEntry {
  return { Question: question, Answer: answer };
}

function anyBrandingAnswered(a: Answers): boolean {
  const ids = [
    "logo_situation",
    "logo_style_pick",
    "branding_style",
    "template_real",
    "template_animated",
    "template_mixed",
    "industry",
  ];
  return ids.some((id) => str(a[id]).length > 0 || (Array.isArray(a[id]) && (a[id] as string[]).length > 0));
}

function anyAdsAnswered(a: Answers): boolean {
  return Boolean(str(a.customer_age) || str(a.top_keywords_status));
}

function anyAccessAnswered(a: Answers): boolean {
  return Boolean(
    str(a.has_current_website) ||
      str(a.domain_registered) ||
      str(a.payment_methods) ||
      (Array.isArray(a.payment_methods) && (a.payment_methods as string[]).length > 0),
  );
}

function hasGalleryValue(v: AnswerValue | undefined): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.trim().length > 0;
  return false;
}

function firstTemplatePick(answers: Answers): { q: Question | undefined; val: AnswerValue | undefined } {
  if (hasGalleryValue(answers.template_real)) {
    return { q: findQuestion("template_real"), val: answers.template_real };
  }
  if (hasGalleryValue(answers.template_animated)) {
    return { q: findQuestion("template_animated"), val: answers.template_animated };
  }
  if (hasGalleryValue(answers.template_mixed)) {
    return { q: findQuestion("template_mixed"), val: answers.template_mixed };
  }
  return { q: undefined, val: undefined };
}

/** Build legacy `{ Question, Answer }` blocks aligned with the historical export format. */
export function buildLegacyQuestionnaire(answers: Answers): Record<string, LegacyEntry> {
  const out: Record<string, LegacyEntry> = {};

  const cd = fg(answers, "company_details");
  if (cd) {
    const ans: Record<string, string> = {};
    if (cd.company_name != null) ans.client_company_name = str(cd.company_name);
    if (cd.org_type != null) ans.client_organisation_type = subOptionLabel("company_details", "org_type", str(cd.org_type));
    if (cd.company_registration_number != null)
      ans.client_company_registration_number = str(cd.company_registration_number);
    if (cd.tax_identification_number != null)
      ans.client_tax_identification_number = str(cd.tax_identification_number);
    out.Company_Information_Part1 = entry("  What is Your company name  ", ans);
  }

  const yn = fg(answers, "your_name");
  if (yn) {
    out.Company_Information_Part2 = entry(" Enter your name ", {
      client_first_name: str(yn.first_name),
      client_last_name: str(yn.last_name),
    });
  }

  const cc = fg(answers, "company_contact");
  if (cc) {
    out.Company_Information_Part3 = entry(" Enter your company contact details ", {
      client_landline_number: str(cc.company_landline),
      client_business_email: str(cc.business_email),
      client_phone_number: str(cc.phone_number),
    });
  }

  const ca = fg(answers, "company_address");
  if (ca) {
    out.Company_Information_Part4 = entry(" Enter your company address details ", {
      client_street_address: str(ca.street_address),
      client_city: str(ca.city),
      client_country: subOptionLabel("company_address", "country", str(ca.country)),
      client_state: str(ca.state_region),
      client_postcode: str(ca.postal_code),
    });
  }

  const y = str(answers.company_started_year);
  if (y) {
    out.Company_Information_Part5 = entry(" Business foundation Year of your company ", {
      client_business_founded_year: y,
    });
  }

  const proof = str(answers.business_proof_of_address);
  if (proof) {
    out.Business_Proof_Of_Address = entry(
      findQuestion("business_proof_of_address")?.title ?? "Business proof of address",
      proof,
    );
  }

  const hp = str(answers.has_partners);
  if (hp) {
    out.Have_Any_Business_Colleagues = entry(
      " Will there be any other colleague's or business partner's we'd be discussing this project with? ",
      optionLabel("has_partners", hp),
    );
  }

  const partners = rep(answers, "partners");
  if (partners?.length) {
    out.Business_Colleagues_Details = entry(
      " Please provide colleagues or business partner's details: ",
      formatPartners(partners),
    );
  }

  const ec = str(answers.employee_count);
  if (ec) {
    out.How_Many_Employees = entry(
      " How many employees, including yourself, work for the business? ",
      optionLabel("employee_count", ec),
    );
  }

  const vc = str(answers.van_count);
  if (vc) {
    out.Vans_on_The_Road = entry(" How many vans do you currently have on the road? ", optionLabel("van_count", vc));
  }

  const vanPic = str(answers.van_picture);
  if (vanPic) {
    out.Van_Image = entry(" Do you have real picture of your vans you can upload? ", vanPic);
  }

  const em = str(answers.emergency_24_7);
  if (em) {
    out.Available_For_Emergency = entry(
      " Are you available for 24/7 emergency services? ",
      optionLabel("emergency_24_7", em),
    );
  }

  const fo = str(answers.finance_options);
  if (fo) {
    out.Provide_Finance_Option = entry(" Do you provide finance options to your customers?", optionLabel("finance_options", fo));
  }

  const fn = str(answers.finance_company_name);
  if (fn) {
    out.Finance_Company_Name = entry(" Please select the finance company you use? ", htmlDiv(fn));
  }

  const bs = str(answers.business_scope);
  if (bs) {
    out.Business_Operate = entry(
      " Does your business operate Nationally or Locally? ",
      optionLabel("business_scope", bs),
    );
  }

  const mr = str(answers.mile_radius);
  const tt = str(answers.top_10_towns);
  if (mr || tt) {
    const parts = [mr ? `Radius: ${optionLabel("mile_radius", mr)}` : "", tt ? `Towns: ${tt}` : ""].filter(Boolean);
    out.Mile_Radius_And_Target_Towns = entry(
      "Mile radius / target towns",
      parts.join(" — "),
    );
  }

  const oh = answers.opening_hours as TimeRangeAnswer | undefined;
  if (oh && (oh.alwaysOpen || (oh.open && oh.close))) {
    out.Business_Opening_Hours = entry(
      " What are the opening hours for the business? ",
      formatOpeningHours(oh),
    );
  }

  const comp = rep(answers, "competitor_advantages");
  if (comp?.length) {
    out.Why_Customer_Choose_You = entry(
      findQuestion("competitor_advantages")?.title ??
        "Please write a detailed list below of what makes your business better than your competitors and why customers should choose you over them.",
      formatRepeatableReasons(comp),
    );
  }

  if (anyBrandingAnswered(answers)) {
    out.Second_Part_Information = entry("", "Website_Design_and_Branding");
  }

  const ls = str(answers.logo_situation);
  if (ls) {
    out.New_Logo_Design = entry(" Please select the option below that is most relevant: ", optionLabel("logo_situation", ls));
  }

  const lsp = answers.logo_style_pick;
  if (lsp != null && (Array.isArray(lsp) ? lsp.length : String(lsp))) {
    out.Style_Of_Logo = entry(
      " Please select the style of logo you like the look of ",
      galleryLabels(findQuestion("logo_style_pick"), lsp),
    );
  }

  const uploads = [str(answers.logo_upload_keep), str(answers.logo_upload_new)].filter(Boolean).join(" ");
  const lnd = str(answers.logo_new_description);
  if (uploads || lnd) {
    out.Logo_Upload_Or_Description = entry("Logo upload / change details", [uploads, lnd].filter(Boolean).join(" — "));
  }

  const br = str(answers.branding_style);
  if (br) {
    out.Mockup_Type = entry(
      findQuestion("branding_style")?.title ??
        "For your brand we can create different styles of design. Please select whether you would like your branding to be based on real life, animated or a mixture of both.",
      optionLabel("branding_style", br),
    );
  }

  const { q: tplQ, val: tplVal } = firstTemplatePick(answers);
  if (tplQ && tplVal != null) {
    out.Mockup_Template_Choice = entry(
      tplQ.title ?? "Template choice",
      galleryLabels(tplQ, tplVal),
    );
  }

  const tf = str(answers.template_feedback);
  if (tf) {
    out.Mockup_Changes_Details = entry(
      " Could you please provide more details about what you like or dislike in the mockup you have chosen? ",
      htmlDiv(tf),
    );
  }

  const aw = str(answers.affiliated_website);
  if (aw) {
    out.Affiliated_Website = entry(
      findQuestion("affiliated_website")?.title ?? "Affiliated website",
      `${optionLabel("affiliated_website", aw)}${str(answers.affiliated_website_url) ? ` — ${str(answers.affiliated_website_url)}` : ""}`,
    );
  }

  const ind = answers.industry;
  if (Array.isArray(ind) && ind.length && ind.every((x) => typeof x === "string")) {
    const labels = multiLabels("industry", ind as string[]);
    const other = str(answers.industry_other);
    out.Your_Business_Industry_Type = entry(" What industry is your Business in?", other ? `${labels}, ${other}` : labels);
  }

  const bm = str(answers.brands_manufacturers);
  if (bm) {
    out.Products_Brand_Names = entry(
      "  Please list the brands and manufactures you work with and would want to display on your website. ",
      htmlDiv(bm),
    );
  }

  const acc = str(answers.accreditations);
  if (acc) {
    out.Certification_Names = entry(
      "Please list the accreditation and certificates you would like to display on your website.",
      htmlDiv(acc),
    );
  }

  const ws = answers.website_services;
  if (Array.isArray(ws) && ws.length && ws.every((x) => typeof x === "string")) {
    const labels = multiLabels("website_services", ws as string[]);
    const wo = str(answers.website_services_other);
    out.Service_You_Promote = entry(
      " What is the main product or service you want to promote on your website/landing page? ",
      htmlDiv(wo ? `${labels} (${wo})` : labels),
    );
  }

  const gsu = str(answers.google_sheet_url);
  if (gsu) {
    out.Google_Sheet_Products_URL = entry("Google Sheet product URL", gsu);
  }

  const off = rep(answers, "offers");
  if (off?.length) {
    out.Offer_for_Customers = entry(
      " Please list below any discounts or extras you are willing to offer customers for your specific services. ",
      formatOffers(off),
    );
  }

  const tc = str(answers.typography_choice);
  if (tc) {
    out.What_Font_Use_For_Website = entry(
      " In order to maintain a consistent brand image, please choose one of the typography options below ",
      optionLabel("typography_choice", tc),
    );
  }

  const cfd = str(answers.current_fonts_description);
  if (cfd) {
    out.Current_Fonts_Description = entry(
      findQuestion("current_fonts_description")?.title ?? "Current fonts",
      htmlDiv(cfd),
    );
  }

  const hf = str(answers.heading_font);
  if (hf) {
    const ho = str(answers.heading_font_other);
    out.Heading_Fonts = entry(
      " Please select the HEADING font you like the most. ",
      ho ? `${optionLabel("heading_font", hf)} (${ho})` : optionLabel("heading_font", hf),
    );
  }

  const pf = str(answers.paragraph_font);
  if (pf) {
    const po = str(answers.paragraph_font_other);
    out.Paragraph_Fonts = entry(
      " Please select the PARAGRAPH font you like the most. ",
      po ? `${optionLabel("paragraph_font", pf)} (${po})` : optionLabel("paragraph_font", pf),
    );
  }

  const cp = str(answers.colour_preference);
  if (cp) {
    out.How_Color_You_Choose = entry(
      " To maintain consistency in your branding, could you please let us know your preferred colours for the website and design\n        branding? ",
      optionLabel("colour_preference", cp),
    );
  }

  const cpp = answers.colour_palette_pick;
  if (cpp != null && (Array.isArray(cpp) ? cpp.length : String(cpp))) {
    out.Colour_Palette_Choice = entry(
      "Choose a palette",
      galleryLabels(findQuestion("colour_palette_pick"), cpp),
    );
  }

  const cpd = str(answers.colour_palette_description);
  if (cpd) {
    out.Colour_Palette_Description = entry(
      findQuestion("colour_palette_description")?.title ?? "Palette description",
      htmlDiv(cpd),
    );
  }

  const btn = answers.button_style;
  if (btn != null && String(btn)) {
    out.Button_Style_You_Like = entry(
      " Please select the style of button you would like the most. ",
      galleryLabels(findQuestion("button_style"), btn),
    );
  }

  const tov = str(answers.tone_of_voice);
  if (tov) {
    out.Tone_Of_Voice = entry("How would you like your website to sound?", optionLabel("tone_of_voice", tov));
  }

  const wf = rep(answers, "website_features");
  if (wf?.length) {
    out.Features_Like_to_Add = entry(
      "  Please include details of any features you would like to add to your\n            website/landing page. ",
      formatWebsiteFeatures(wf),
    );
  }

  const lw = rep(answers, "liked_websites");
  if (lw?.length) {
    out.Features_Reference_Website = entry(
      " Please provide the URLs to any other websites that you like and provide a detailed description below.",
      formatLikedWebsites(lw),
    );
  }

  const sm = fg(answers, "social_media");
  if (sm) {
    const bits = ["facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube"]
      .map((k) => str(sm[k]))
      .filter(Boolean);
    if (bits.length) {
      out.Social_Media_URL = entry(
        " Please add your current social media URLs in the relevant boxes below if you have them.",
        `<div>${bits.join("<br class='separate'  />")}</div>`,
      );
    }
  }

  const hr = str(answers.has_reviews);
  if (hr) {
    out.Do_You_Have_Review = entry(
      " Do you have reviews from any past customers on other websites? ",
      optionLabel("has_reviews", hr),
    );
  }

  const ru = rep(answers, "review_urls");
  if (ru?.length) {
    out.Review_URL_Links = entry(
      "  Please provide the links (URLs) to any website you have generated\n            reviews from past customers. ",
      formatReviewUrls(ru),
    );
  }

  const deRaw = answers.display_email;
  const de =
    typeof deRaw === "string" && !isProvideLaterSentinel(deRaw) ? deRaw.trim() : "";
  if (de) {
    out.Email_Show_On_Website = entry(
      " What email address do you want to display on your website? This address will receive your lead notifications. ",
      de,
    );
  }

  if (anyAdsAnswered(answers)) {
    out.Third_Part_Information = entry("", "Ad Campaigns Info");
  }

  const cage = str(answers.customer_age);
  if (cage) {
    out.Customer_Average_Age = entry(
      " What is the average age of a typical customer? ",
      optionLabel("customer_age", cage),
    );
  }

  const tks = str(answers.top_keywords_status);
  if (tks) {
    out.Key_Words_For_Find_Business = entry(
      " If you had a magic wand and could appear at the top of Google for any keywords, what would the top 5 keywords / phrases be?",
      optionLabel("top_keywords_status", tks),
    );
  }

  const tk = str(answers.top_keywords);
  if (tk) {
    out.Top_Keywords_List = entry("Your top 5 keywords / phrases", htmlDiv(tk));
  }

  const clv = str(answers.customer_lifetime_value);
  if (clv) {
    out.Everage_Customer_Worth_Over_Lifetime = entry(
      " What is the average customer/client worth to you over their lifetime?(u00a3) ",
      optionLabel("customer_lifetime_value", clv),
    );
  }

  const lcr = str(answers.lead_conversion_rate);
  if (lcr) {
    out.Leades_Converted_into_Sales = entry(
      " What percentage of leads does your team convert into sales? ",
      optionLabel("lead_conversion_rate", lcr),
    );
  }

  const al = str(answers.additional_leads_per_week);
  if (al) {
    out.How_Many_Leades_Looking_to_Target = entry(
      " Realistically, how many additional leads would you like to be bringing in each week? ",
      htmlDiv(al),
    );
  }

  const tga = str(answers.tried_google_ads);
  if (tga) {
    out.Have_You_Tried_Google_Ads_Before = entry(" Have you tried Google Ads before? ", optionLabel("tried_google_ads", tga));
  }

  const gad = str(answers.google_ads_details);
  if (gad) {
    out.How_did_it_turn_out = entry(" How did it turn out? ", htmlDiv(gad));
  }

  const spg = str(answers.sales_process_google);
  if (spg) {
    out.Describe_Your_Sales_Process_Google = entry(
      findQuestion("sales_process_google")?.title ?? "Sales process (Google)",
      htmlDiv(spg),
    );
  }

  const tfa = str(answers.tried_facebook_ads);
  if (tfa) {
    out.Have_You_Tried_Facebook_Ads = entry(
      "Have you tried Facebook Ads before?",
      optionLabel("tried_facebook_ads", tfa),
    );
  }

  const fad = str(answers.facebook_ads_details);
  if (fad) {
    out.Facebook_Ads_Details = entry(
      findQuestion("facebook_ads_details")?.title ?? "Facebook Ads details",
      htmlDiv(fad),
    );
  }

  const spf = str(answers.sales_process_facebook);
  if (spf) {
    out.Describe_Your_Sales_Process_Facebook = entry(
      findQuestion("sales_process_facebook")?.title ?? "Sales process (Facebook)",
      htmlDiv(spf),
    );
  }

  if (anyAccessAnswered(answers)) {
    out.Fourth_Part_Information = entry("", "domain info");
  }

  const hcw = str(answers.has_current_website);
  if (hcw) {
    out.Do_You_Have_Website = entry(" Do you have a website? ", optionLabel("has_current_website", hcw));
  }

  const cwd = str(answers.current_website_domain);
  if (cwd) {
    out.Current_Website_URL = entry(" Please Enter Website URL", htmlDiv(cwd));
  }

  const hno = str(answers.host_new_on_current_domain);
  if (hno) {
    out.Host_New_On_Current_Domain = entry(
      findQuestion("host_new_on_current_domain")?.title ?? "Host on current domain",
      optionLabel("host_new_on_current_domain", hno),
    );
  }

  const oad = str(answers.other_affiliated_domain);
  if (oad) {
    out.Other_Affiliated_Website_URL = entry("Other affiliated website", oad);
  }

  const dmc = str(answers.domain_managed_by_company);
  if (dmc) {
    out.Domain_Manage_By_Any_Company = entry(
      " Do you have any company managing Domain, Email and Hosting for you? ",
      optionLabel("domain_managed_by_company", dmc),
    );
  }

  const dmf = fg(answers, "domain_manager_contact");
  if (dmf) {
    out.Website_Manager_Details = entry(
      " Please provide the Name and Email of the contact person who manages website, domain and email for you. ",
      htmlDiv(`${str(dmf.person_name)} / ${str(dmf.person_email)}`),
    );
  }

  const ddn = str(answers.desired_domain_name);
  if (ddn) {
    out.Desired_Domain_Name = entry(
      findQuestion("desired_domain_name")?.title ?? "Desired domain",
      htmlDiv(ddn),
    );
  }

  const dr = str(answers.domain_registered);
  if (dr) {
    out.Have_you_Domain_Register = entry("  Have you registered your domain/hosting? ", optionLabel("domain_registered", dr));
  }

  const dp = str(answers.domain_provider);
  if (dp) {
    out.Domain_Provider = entry("Please select your domain provider", optionLabel("domain_provider", dp));
  }

  const gdd = str(answers.godaddy_delegate_access);
  if (gdd) {
    out.GoDaddy_Delegate_Access = entry(
      findQuestion("godaddy_delegate_access")?.title ?? "GoDaddy delegate access",
      optionLabel("godaddy_delegate_access", gdd),
    );
  }

  const dpon = str(answers.domain_provider_other_name);
  if (dpon) {
    out.Domain_Provider_Other_Name = entry("Other domain provider name", dpon);
  }

  const dpc = fg(answers, "domain_provider_credentials");
  if (dpc && !isFieldGroupKickoffDeferred(dpc)) {
    out.Domain_Provider_Credentials = entry(
      findQuestion("domain_provider_credentials")?.title ?? "Domain provider credentials",
      {
        username: str(dpc.username),
        password: str(dpc.password),
        notes: str(dpc.notes),
      },
    );
  }

  const pm = answers.payment_methods;
  if (Array.isArray(pm) && pm.length && pm.every((x) => typeof x === "string")) {
    out.Payment_Accepted_By = entry(
      " What forms of payment do you accept? ",
      multiLabels("payment_methods", pm as string[]),
    );
  }

  const sda = str(answers.stripe_developer_access);
  if (sda) {
    out.Stripe_Developer_Access = entry(
      findQuestion("stripe_developer_access")?.title ?? "Stripe developer access",
      optionLabel("stripe_developer_access", sda),
    );
  }

  const fba = str(answers.facebook_page_access);
  if (fba) {
    out.Facebook_Page_Access = entry(
      findQuestion("facebook_page_access")?.title ?? "Facebook page access",
      optionLabel("facebook_page_access", fba),
    );
  }

  const jm = answers.job_management_software;
  if (Array.isArray(jm) && jm.length && jm.every((x) => typeof x === "string")) {
    out.Job_Management_Software = entry(
      " Do you use any of the following quoting or job management softwares? ",
      multiLabels("job_management_software", jm as string[]),
    );
  }

  const jmo = str(answers.job_management_software_other);
  if (jmo) {
    out.Job_Management_Software_Other = entry("Other job management software", jmo);
  }

  const jsc = fg(answers, "job_software_credentials");
  if (jsc && (str(jsc.username) || str(jsc.password))) {
    out.Job_Software_Credentials = entry(
      findQuestion("job_software_credentials")?.title ?? "Job software credentials",
      { username: str(jsc.username), password: str(jsc.password) },
    );
  }

  const sat = str(answers.satisfaction_rating);
  if (sat) {
    out.On_Boarding_Experience = entry(
      " On a scale of 1-10, how have you found the on-boarding experience so far? ",
      optionLabel("satisfaction_rating", sat),
    );
  }

  const fb = str(answers.experience_feedback);
  if (fb) {
    out.Your_Feedback = entry(" We are always trying to improve and really value your feedback. ", fb);
  }

  return out;
}