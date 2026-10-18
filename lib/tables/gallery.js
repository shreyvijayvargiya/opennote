/**
 * Gallery of 100 ready-made tables (CRM, leads, pipelines, digital products, e-commerce …).
 *
 * Each template is one line:  t(category, name, description, keywords, "Col|type|options; …", "first, column, samples")
 *   column spec:  "Name" (text) · "Price|number" · "Stage|chips:Lead,Won,Lost" · "Snippet|code:python"
 * Sample rows are generated from the column names/types, so previews look real.
 */
import Fuse from "fuse.js";
import { AVATARS, makeOption, makeRow, uid, DIAL_CODES } from "./schema";

export const GALLERY_CATEGORIES = [
	["CRM", "🤝"], ["Leads", "🎯"], ["Pipelines", "🛤️"], ["Digital Products", "💾"], ["E-commerce", "🛒"],
	["Marketing", "📣"], ["Projects", "🗂️"], ["HR & Hiring", "🧑‍💼"], ["Finance", "💰"], ["Content", "✍️"],
	["Education", "🎓"], ["Personal", "🌱"],
];

const raw = [];
const t = (category, name, description, keywords, cols, samples = "") => raw.push({ category, name, description, keywords, cols, samples });

/* ------------------------------ CRM ------------------------------ */
t("CRM", "Contacts CRM", "Every person you work with, their company, stage and owner.", "people address book clients contacts crm airtable spreadsheet database", "Name; Company; Email; Phone|phone; Stage|chips:Lead,Contacted,Customer,Churned; Owner|avatar; Last contacted|date", "Ava Thompson, Liam Carter, Noah Singh");
t("CRM", "Companies & Accounts", "Accounts with industry, size, owner and health.", "accounts organizations b2b companies", "Company; Industry|chips:SaaS,Retail,Finance,Health,Education; Employees|number; Website|link; Health|chips:Healthy,At risk,Churning; Owner|avatar", "Acme Corp, Globex, Initech");
t("CRM", "Customer Support Tickets", "Support requests with priority, status and assignee.", "helpdesk tickets support issues", "Ticket; Customer; Priority|chips:Low,Medium,High,Urgent; Status|chips:Open,Pending,Solved; Assignee|avatar; Created|date; Notes", "Login fails on mobile, Refund request, Invoice question");
t("CRM", "Customer Feedback Log", "Collect feedback, ratings and follow-up actions.", "feedback nps reviews voice of customer", "Feedback; Customer; Rating|rating; Channel|chips:Email,Call,Chat,Survey; Follow up|checkbox; Date|date", "Love the new editor, Export is slow, Need dark mode");
t("CRM", "Deals Tracker", "Deals with value, stage and expected close date.", "deals opportunities revenue", "Deal; Company; Value|number; Stage|chips:Discovery,Proposal,Negotiation,Won,Lost; Close date|date; Owner|avatar", "Acme annual plan, Globex pilot, Initech expansion");
t("CRM", "Client Onboarding Checklist", "Step-by-step onboarding with owners and due dates.", "onboarding checklist kickoff clients", "Step; Client; Done|checkbox; Owner|avatar; Due|date; Status|chips:Not started,In progress,Done", "Kickoff call, Collect brand assets, Set up workspace");
t("CRM", "Meeting Notes & Follow-ups", "Meeting log with decisions and next steps.", "meetings notes follow up calls minutes", "Meeting; Date|date; Attendees; Decision; Next step; Done|checkbox", "Weekly sync, Product demo, Quarterly review");
t("CRM", "Partner & Reseller Directory", "Partners, tiers, contacts and commission.", "partners resellers affiliates agencies", "Partner; Tier|chips:Bronze,Silver,Gold; Contact; Email; Commission %|number; Website|link", "Northwind Agency, Bluebird Partners, Orbit Consulting");
t("CRM", "Renewals Calendar", "Upcoming renewals, amounts and risk.", "renewals subscriptions churn contracts", "Customer; Plan|chips:Starter,Pro,Enterprise; Renewal date|date; MRR|number; Risk|chips:Low,Medium,High; Owner|avatar", "Acme Corp, Globex, Initech");

/* ------------------------------ Leads ------------------------------ */
t("Leads", "WhatsApp Leads", "Leads that reach you on WhatsApp: number, source, status and next follow-up.", "whatsapp leads chat messaging phone outreach wa", "Name; WhatsApp number|phone; Source|chips:Ad,Referral,Website,Story; Status|chips:New,Replied,Qualified,Lost; Last message; Follow-up|date; Hot|checkbox", "Rahul Verma, Priya Nair, Mohammed Ali");
t("Leads", "Instagram DM Leads", "People who DM you on Instagram with handle and interest.", "instagram dm social leads ig creators", "Handle; Name; Followers|number; Interest|chips:Course,Template,Service,Collab; Status|chips:New,Replied,Warm,Closed; Profile|link; Next step|date", "@designwithava, @liam.builds, @noah.codes");
t("Leads", "LinkedIn Outreach Leads", "Prospects you contact on LinkedIn with message stages.", "linkedin outreach prospects b2b sales navigator", "Prospect; Title; Company; Profile|link; Connection|chips:Not sent,Pending,Connected; Message|chips:None,Sent,Replied,Booked; Date|date", "Sara Lopez, Daniel Kim, Meera Shah");
t("Leads", "Cold Email Leads", "Cold email list with sequence status and replies.", "cold email outbound sequence emails leads", "Name; Email; Company; Sequence|chips:Step 1,Step 2,Step 3,Finished; Opened|checkbox; Replied|checkbox; Sent|date", "Ethan Brooks, Mia Zhang, Lucas Meyer");
t("Leads", "Local Business Leads", "Local businesses by category and city with phone and status.", "local business scraper kota city phone category leads sms", "Business; Category; City; Phone|phone; Status|chips:Pending,Contacted,Interested,Closed; Notes", "Rakshak Polymers, Prins Polytech, Payal Irrigation");
t("Leads", "Real Estate Leads", "Buyers and renters with budget, area and property type.", "real estate property buyers renters broker leads", "Lead; Phone|phone; Budget|number; Area; Type|chips:Apartment,Villa,Plot,Office; Stage|chips:New,Site visit,Negotiation,Closed; Visit date|date", "Anita Rao, Vikram Desai, Sophie Martin");
t("Leads", "Webinar Registrants", "Registrants, attendance and follow-up status.", "webinar event registrants attendees leads", "Name; Email; Registered|date; Attended|checkbox; Interest|chips:Cold,Warm,Hot; Follow-up|chips:None,Email sent,Call booked", "Olivia Reed, Hiro Tanaka, Zara Khan");
t("Leads", "SaaS Free Trial Leads", "Trial users, activation and conversion signals.", "saas trial users activation plg product led growth leads", "User; Email; Trial start|date; Activated|checkbox; Usage score|slider; Plan|chips:Free,Starter,Pro; Owner|avatar", "Jake Wilson, Nina Petrov, Omar Haddad");
t("Leads", "Inbound Website Leads", "Form submissions with source page and lead score.", "website forms inbound landing page leads contact form", "Name; Email; Message; Page|link; Score|rating; Status|chips:New,Contacted,Qualified,Spam; Received|date", "Emma Davis, Raj Patel, Chloe Martin");
t("Leads", "Event & Conference Leads", "Badge scans, notes and next steps from events.", "event conference trade show booth badge leads", "Name; Company; Email; Event; Interest|rating; Next step|chips:Email,Call,Demo,None; Met on|date", "Tom Becker, Lina Ortiz, Arjun Mehta");

/* ------------------------------ Pipelines ------------------------------ */
t("Pipelines", "Sales Pipeline", "Deals moving from lead to closed-won.", "sales pipeline funnel deals stages kanban", "Deal; Company; Value|number; Stage|chips:Lead,Qualified,Proposal,Negotiation,Won,Lost; Probability|slider; Close date|date; Owner|avatar", "Acme annual plan, Globex pilot, Initech expansion");
t("Pipelines", "Recruiting Pipeline", "Candidates by stage, role and interviewer.", "recruiting hiring pipeline candidates ats", "Candidate; Role; Stage|chips:Applied,Screen,Interview,Offer,Hired,Rejected; Rating|rating; Interviewer|avatar; Next date|date; Resume|files", "Sara Lopez, Daniel Kim, Meera Shah");
t("Pipelines", "Investor Fundraising Pipeline", "Investors, check size and conversation stage.", "investors fundraising vc seed angels pipeline", "Investor; Firm; Check size|number; Stage|chips:Intro,Pitched,Diligence,Term sheet,Passed; Warm intro|checkbox; Next step|date; Link|link", "Alex Morgan, Priya Kapoor, Sam Lee");
t("Pipelines", "Content Pipeline", "Ideas moving from draft to published.", "content pipeline editorial workflow blog publishing", "Title; Format|chips:Blog,Video,Thread,Newsletter; Stage|chips:Idea,Draft,Review,Scheduled,Published; Author|avatar; Publish date|date; Link|link", "Why local-first wins, 10 table templates, Launch thread");
t("Pipelines", "Partnership Pipeline", "Partnership opportunities and negotiation stage.", "partnership bd business development deals pipeline", "Partner; Type|chips:Integration,Reseller,Co-marketing; Stage|chips:Idea,Talking,Pilot,Signed; Owner|avatar; Value|number; Next step|date", "Northwind, Bluebird, Orbit");
t("Pipelines", "Freelance Client Pipeline", "Freelance leads, proposals and invoices.", "freelance clients proposals gigs upwork pipeline", "Client; Project; Budget|number; Stage|chips:Lead,Proposal,Active,Invoiced,Paid; Deadline|date; Contact|link", "Landing page redesign, Brand identity, Mobile app MVP");
t("Pipelines", "Product Feature Pipeline", "Feature requests from idea to shipped.", "product roadmap features requests shipped pipeline", "Feature; Votes|number; Stage|chips:Idea,Planned,Building,Shipped; Effort|chips:S,M,L,XL; Owner|avatar; Release|date", "Dark mode, CSV import, Team sharing");
t("Pipelines", "Customer Onboarding Pipeline", "New customers through setup milestones.", "customer onboarding activation pipeline success", "Customer; Plan|chips:Starter,Pro,Enterprise; Stage|chips:Signed,Kickoff,Setup,Live; Progress|slider; CSM|avatar; Go-live|date", "Acme Corp, Globex, Initech");

/* ------------------------------ Digital Products ------------------------------ */
t("Digital Products", "Digital Product Catalog", "All your digital products with price and status.", "digital products catalog gumroad store ebooks templates", "Product; Type|chips:Ebook,Course,Template,Plugin,Preset; Price|number; Status|chips:Draft,Live,Archived; Sales|number; Page|link; Cover|image", "Notion Life OS, SaaS Starter Kit, Lightroom Presets");
t("Digital Products", "Course Sales Tracker", "Course buyers, price paid and access status.", "course sales students buyers online course cohort", "Student; Email; Course; Paid|number; Date|date; Access|checkbox; Progress|slider", "Ava Thompson, Liam Carter, Noah Singh");
t("Digital Products", "Template Store Inventory", "Templates for sale, formats and downloads.", "templates store figma notion framer marketplace", "Template; Format|chips:Figma,Notion,Framer,Canva,Sheets; Price|number; Downloads|number; Rating|rating; Files|files", "Agency Landing Kit, Finance Dashboard, Habit Tracker");
t("Digital Products", "Ebook Launch Tracker", "Ebook launch tasks, channels and metrics.", "ebook launch book pdf writing publishing", "Task; Channel|chips:Email,Twitter,LinkedIn,Product Hunt; Status|chips:To do,In progress,Done; Due|date; Owner|avatar", "Write launch email, Design cover, Schedule tweets");
t("Digital Products", "SaaS Pricing Plans", "Plans, limits and monthly/annual price.", "saas pricing plans tiers subscription", "Plan; Monthly|number; Annual|number; Seats|number; Popular|checkbox; Features", "Free, Starter, Pro");
t("Digital Products", "License Keys", "License keys, owners and activation.", "license keys software activation serial", "Key|otp; Customer; Product; Issued|date; Activated|checkbox; Seats|number", "Acme Corp, Globex, Initech");
t("Digital Products", "Digital Downloads Orders", "Orders for downloadable products with delivery status.", "downloads orders delivery digital goods", "Order; Customer; Product; Amount|number; Delivered|checkbox; Date|date; Files|files", "#1001, #1002, #1003");
t("Digital Products", "Affiliate Program Tracker", "Affiliates, clicks, sales and payouts.", "affiliate program referrals commission payouts", "Affiliate; Email; Clicks|number; Sales|number; Commission|number; Paid|checkbox; Link|link", "Maya Collins, Dev Sharma, Lena Fischer");
t("Digital Products", "Product Roadmap & Releases", "Releases, versions and changelog notes.", "roadmap releases versions changelog", "Release; Version; Status|chips:Planned,Beta,Released; Date|date; Highlights; Owner|avatar", "Editor refresh, Team spaces, API beta");

/* ------------------------------ E-commerce ------------------------------ */
t("E-commerce", "Product Inventory", "Stock levels, SKUs and reorder points.", "inventory stock sku products warehouse shopify airtable spreadsheet", "Product; SKU; Category|chips:Apparel,Home,Beauty,Tech; Price|number; Stock|number; Reorder|checkbox; Photo|image", "Cotton Tee, Ceramic Mug, Wireless Earbuds");
t("E-commerce", "Orders", "Customer orders with status and totals.", "orders sales shopify fulfillment ecommerce", "Order; Customer; Total|number; Status|chips:Paid,Packed,Shipped,Delivered,Refunded; Date|date; Tracking|link", "#2041, #2042, #2043");
t("E-commerce", "Store Customers", "Shoppers with lifetime value and last order.", "customers shoppers ltv ecommerce store", "Customer; Email; Orders|number; Lifetime value|number; Segment|chips:New,Repeat,VIP; Last order|date", "Isabel Cruz, Kenji Sato, Fatima Noor");
t("E-commerce", "Suppliers", "Suppliers, lead times and contacts.", "suppliers vendors procurement sourcing", "Supplier; Contact; Phone|phone; Lead time (days)|number; Rating|rating; Terms", "Shenzhen Goods Co, Lotus Textiles, Nordic Pack");
t("E-commerce", "Returns & Refunds", "Return requests, reasons and refund status.", "returns refunds rma reverse logistics", "Order; Customer; Reason|chips:Damaged,Wrong item,Changed mind,Late; Refund|number; Status|chips:Requested,Approved,Refunded,Rejected; Date|date", "#2018, #2022, #2030");
t("E-commerce", "Discount Codes", "Promo codes with discount, limit and expiry.", "discount coupons promo codes sales", "Code; Discount %|number; Used|number; Limit|number; Expires|date; Active|checkbox", "WELCOME10, BLACKFRIDAY, VIP20");
t("E-commerce", "Shipping Tracker", "Parcels, carriers and delivery estimates.", "shipping tracking carriers delivery logistics", "Order; Carrier|chips:DHL,FedEx,UPS,USPS,India Post; Tracking|link; Shipped|date; ETA|date; Delivered|checkbox", "#2041, #2042, #2043");
t("E-commerce", "Product Reviews", "Reviews with rating, product and reply status.", "reviews ratings testimonials ecommerce feedback", "Review; Product; Rating|rating; Reviewer; Replied|checkbox; Date|date", "Great quality, Fits perfectly, Arrived late");
t("E-commerce", "Dropshipping Products", "Winning products, cost, price and margin.", "dropshipping winning products margin aliexpress", "Product; Supplier link|link; Cost|number; Price|number; Margin %|number; Status|chips:Testing,Winning,Dead; Image|image", "LED Sunset Lamp, Posture Corrector, Mini Projector");
t("E-commerce", "Abandoned Carts", "Abandoned carts with value and recovery status.", "abandoned carts recovery email ecommerce", "Customer; Email; Cart value|number; Items|number; Recovery|chips:None,Email 1,Email 2,Recovered; Date|date", "Maria Silva, Ben Cooper, Aisha Khan");

/* ------------------------------ Marketing ------------------------------ */
t("Marketing", "Campaign Planner", "Campaigns with channel, budget and results.", "campaign planner marketing ads channels", "Campaign; Channel|chips:Email,Ads,Social,SEO,Events; Budget|number; Status|chips:Planned,Live,Done; Start|date; Owner|avatar; Results", "Spring launch, Webinar push, Retargeting");
t("Marketing", "SEO Keyword Tracker", "Keywords, volume, difficulty and ranking.", "seo keywords rankings search volume", "Keyword; Volume|number; Difficulty|slider; Position|number; Intent|chips:Info,Commercial,Transactional; Target page|link", "notion alternative, crm for freelancers, airtable free");
t("Marketing", "Ad Creative Tests", "Ad variants with spend, CTR and winner.", "ads creative testing ab facebook google ctr", "Creative; Platform|chips:Meta,Google,TikTok,LinkedIn; Spend|number; CTR %|number; Winner|checkbox; Preview|image", "Hook A, Hook B, UGC cut");
t("Marketing", "Influencer Outreach", "Creators, reach and collaboration status.", "influencer outreach creators collab sponsorship", "Creator; Platform|chips:Instagram,YouTube,TikTok,X; Followers|number; Rate|number; Status|chips:Found,Pitched,Negotiating,Live; Profile|link", "@designwithava, @codewithliam, @noahmakes");
t("Marketing", "Email Newsletter Schedule", "Newsletter issues, subject lines and send dates.", "newsletter email schedule sends subject", "Issue; Subject; Send date|date; Status|chips:Idea,Writing,Scheduled,Sent; Open rate %|number; Author|avatar", "Issue 41, Issue 42, Issue 43");
t("Marketing", "Social Media Calendar", "Posts by platform, date and status.", "social media calendar posts twitter instagram linkedin schedule", "Post; Platform|chips:X,Instagram,LinkedIn,TikTok; Publish|date; Status|chips:Idea,Draft,Scheduled,Posted; Visual|image; Owner|avatar", "Launch teaser, Behind the scenes, Customer story");
t("Marketing", "Backlink Tracker", "Backlink targets, domain rating and status.", "backlinks link building seo outreach da dr", "Site; URL|link; DR|number; Status|chips:Target,Pitched,Live,Rejected; Contact; Date|date", "producthunt.com, indiehackers.com, dev.to");
t("Marketing", "Product Launch Checklist", "Everything to ship a launch on time.", "product launch checklist go to market gtm", "Task; Owner|avatar; Due|date; Done|checkbox; Priority|chips:Low,Medium,High; Notes", "Finalize pricing, Press kit, Launch email");
t("Marketing", "Marketing Budget", "Budget vs. actual spend by channel.", "marketing budget spend channels finance", "Channel; Budget|number; Spent|number; Owner|avatar; Month|date; Notes", "Paid social, Content, Events");

/* ------------------------------ Projects ------------------------------ */
t("Projects", "Project Tracker", "Projects with owner, status, progress and deadline.", "project tracker management status airtable notion database", "Project; Owner|avatar; Status|chips:Not started,In progress,Blocked,Done; Progress|slider; Deadline|date; Priority|chips:Low,Medium,High", "Website redesign, Mobile app, Q4 launch");
t("Projects", "Sprint Backlog", "Stories with points, assignee and sprint.", "sprint backlog agile scrum stories points", "Story; Points|number; Assignee|avatar; Status|chips:Backlog,In sprint,Review,Done; Sprint; Priority|chips:Low,Medium,High", "Login flow, Search filters, Export CSV");
t("Projects", "Bug Tracker", "Bugs with severity, steps and fix status.", "bug tracker issues qa defects engineering", "Bug; Severity|chips:Minor,Major,Critical; Status|chips:Open,Fixing,Fixed,Won't fix; Assignee|avatar; Reported|date; Snippet|code:javascript", "Crash on save, Wrong total, Slow search");
t("Projects", "Task Board", "Simple to-do board with status and due date.", "tasks todo board kanban personal team airtable notion trello", "Task; Status|chips:To do,Doing,Done; Due|date; Owner|avatar; Done|checkbox", "Write brief, Review designs, Ship release");
t("Projects", "OKRs", "Objectives, key results and progress.", "okr objectives key results goals quarterly", "Objective; Key result; Owner|avatar; Progress|slider; Quarter|chips:Q1,Q2,Q3,Q4; Confidence|rating", "Grow revenue, Improve retention, Launch v2");
t("Projects", "Team Roadmap", "Quarterly roadmap by team and theme.", "roadmap planning quarters themes team", "Initiative; Team|chips:Product,Design,Engineering,Growth; Quarter|chips:Q1,Q2,Q3,Q4; Status|chips:Planned,Building,Shipped; Owner|avatar", "Onboarding revamp, API v2, Referral program");
t("Projects", "Meeting Agenda Tracker", "Agenda items, owners and time boxes.", "meeting agenda owners time", "Topic; Owner|avatar; Minutes|number; Decision; Done|checkbox", "Metrics review, Roadmap check-in, Hiring update");
t("Projects", "Risk Register", "Risks with likelihood, impact and mitigation.", "risk register project management mitigation", "Risk; Likelihood|chips:Low,Medium,High; Impact|chips:Low,Medium,High; Owner|avatar; Mitigation; Status|chips:Open,Mitigated,Closed", "Key hire leaves, Vendor delay, Budget overrun");
t("Projects", "Client Projects", "Client work with scope, budget and invoices.", "client projects agency freelance scope budget", "Client; Project; Budget|number; Status|chips:Proposal,Active,Review,Delivered; Deadline|date; Invoice sent|checkbox", "Acme Corp, Globex, Initech");

/* ------------------------------ HR & Hiring ------------------------------ */
t("HR & Hiring", "Candidate Tracker", "Candidates for open roles with stage and score.", "candidates hiring recruiting applicants resume", "Candidate; Role; Stage|chips:Applied,Screen,Interview,Offer,Hired,Rejected; Score|rating; Email; Resume|files", "Sara Lopez, Daniel Kim, Meera Shah");
t("HR & Hiring", "Employee Directory", "People, roles, teams and contact info.", "employees directory team people hr", "Name; Role; Team|chips:Product,Design,Engineering,Sales,Ops; Email; Phone|phone; Start date|date; Avatar|avatar", "Ava Thompson, Liam Carter, Noah Singh");
t("HR & Hiring", "Leave Tracker", "Leave requests with dates and approval.", "leave pto vacation absence hr approvals", "Employee; Type|chips:Vacation,Sick,Personal,Parental; From|date; To|date; Status|chips:Pending,Approved,Rejected; Approver|avatar", "Ava Thompson, Liam Carter, Noah Singh");
t("HR & Hiring", "Interview Scorecard", "Interview scores by skill and recommendation.", "interview scorecard evaluation hiring", "Candidate; Interviewer|avatar; Skills|rating; Culture|rating; Recommendation|chips:Strong yes,Yes,No,Strong no; Notes", "Sara Lopez, Daniel Kim, Meera Shah");
t("HR & Hiring", "Job Openings", "Open roles with department, location and status.", "job openings roles vacancies careers", "Role; Department|chips:Product,Design,Engineering,Sales; Location; Salary range; Status|chips:Open,On hold,Filled; Posted|date; Listing|link", "Senior Designer, Backend Engineer, Account Executive");
t("HR & Hiring", "Performance Reviews", "Review cycles with ratings and goals.", "performance reviews appraisal ratings goals", "Employee; Manager|avatar; Cycle|chips:H1,H2; Rating|rating; Goals met|slider; Due|date; Feedback", "Ava Thompson, Liam Carter, Noah Singh");
t("HR & Hiring", "New Hire Onboarding", "Onboarding tasks for each new hire.", "new hire onboarding checklist employee first day", "Task; New hire; Owner|avatar; Due|date; Done|checkbox; Status|chips:To do,In progress,Done", "Laptop setup, Accounts access, Intro meeting");
t("HR & Hiring", "Team Birthdays & Anniversaries", "Celebrations calendar for the team.", "birthdays anniversaries team culture celebrate", "Person; Event|chips:Birthday,Work anniversary; Date|date; Gift sent|checkbox; Avatar|avatar", "Ava Thompson, Liam Carter, Noah Singh");

/* ------------------------------ Finance ------------------------------ */
t("Finance", "Expense Tracker", "Expenses by category with receipts.", "expenses spending receipts personal business", "Expense; Category|chips:Food,Travel,Software,Office,Other; Amount|number; Date|date; Paid by|avatar; Receipt|files", "Team lunch, Flight to Berlin, Figma plan");
t("Finance", "Invoice Tracker", "Invoices, amounts, due dates and paid status.", "invoices billing payments freelance accounts receivable", "Invoice; Client; Amount|number; Issued|date; Due|date; Status|chips:Draft,Sent,Paid,Overdue; Link|link", "INV-001, INV-002, INV-003");
t("Finance", "Budget Planner", "Monthly budget by category vs actual.", "budget planner monthly personal finance", "Category; Planned|number; Actual|number; Month|date; Over budget|checkbox; Notes", "Rent, Groceries, Transport");
t("Finance", "Subscriptions Tracker", "Recurring subscriptions and renewal dates.", "subscriptions recurring saas spend renewals", "Service; Cost|number; Billing|chips:Monthly,Yearly; Renews|date; Category|chips:Work,Personal,Entertainment; Active|checkbox; Link|link", "Notion, Figma, Spotify");
t("Finance", "Freelance Income Log", "Income by client and project.", "income freelance earnings clients revenue", "Client; Project; Amount|number; Date|date; Status|chips:Invoiced,Paid; Method|chips:Bank,PayPal,Stripe,Crypto", "Acme Corp, Globex, Initech");
t("Finance", "Investment Portfolio", "Holdings, cost basis and notes.", "investments portfolio stocks crypto holdings", "Asset; Type|chips:Stock,ETF,Crypto,Bond; Quantity|number; Buy price|number; Current price|number; Thesis", "AAPL, VOO, BTC");
t("Finance", "Bills & Payments", "Bills with due dates and autopay.", "bills payments utilities due dates autopay", "Bill; Amount|number; Due|date; Paid|checkbox; Autopay|checkbox; Account", "Electricity, Internet, Rent");
t("Finance", "Savings Goals", "Goals with target, saved amount and deadline.", "savings goals targets emergency fund", "Goal; Target|number; Saved|number; Progress|slider; Deadline|date; Priority|chips:Low,Medium,High", "Emergency fund, New laptop, Trip to Japan");

/* ------------------------------ Content ------------------------------ */
t("Content", "Blog Editorial Calendar", "Posts with keyword, author and publish date.", "blog editorial calendar articles seo writing", "Title; Keyword; Author|avatar; Status|chips:Idea,Draft,Edit,Scheduled,Live; Publish|date; URL|link", "Local-first notes explained, Airtable alternatives, Table templates");
t("Content", "YouTube Video Planner", "Video ideas, scripts and upload dates.", "youtube video planner scripts channel", "Video; Hook; Status|chips:Idea,Script,Filming,Editing,Published; Upload|date; Thumbnail|image; Link|link", "I built an Airtable clone, Notion vs RowTabs, Offline apps in 2026");
t("Content", "Podcast Episodes", "Episodes, guests and recording status.", "podcast episodes guests recording", "Episode; Guest; Record date|date; Status|chips:Booked,Recorded,Edited,Live; Length (min)|number; Link|link", "Building in public, Pricing deep dive, Founder stories");
t("Content", "Newsletter Issue Tracker", "Issues with topics and performance.", "newsletter issues topics performance substack", "Issue; Topic; Send date|date; Subscribers|number; Open rate %|number; Status|chips:Draft,Sent", "Issue 12, Issue 13, Issue 14");
t("Content", "Content Ideas Bank", "A pile of ideas with format and priority.", "content ideas bank inspiration brainstorm", "Idea; Format|chips:Post,Video,Thread,Guide; Priority|rating; Used|checkbox; Source|link", "Day in the life, Tool comparison, Lessons learned");
t("Content", "Code Snippets Library", "Reusable code snippets with language and highlight.", "code snippets library developer javascript python html", "Title; Language|chips:JavaScript,Python,HTML,SQL; Snippet|code:javascript; Tags; Favorite|checkbox", "Debounce, Fetch JSON, Flexbox center");
t("Content", "Brand Asset Library", "Logos, images and files for your brand.", "brand assets logos images design system files", "Asset; Type|chips:Logo,Photo,Icon,Font,Guideline; Preview|image; File|files; Updated|date; Owner|avatar", "Primary logo, Hero image, Brand guide");
t("Content", "Press & Media Mentions", "Where you were mentioned and the reach.", "press media mentions pr coverage", "Outlet; Headline; Link|link; Date|date; Reach|number; Sentiment|chips:Positive,Neutral,Negative", "TechCrunch, The Verge, Hacker News");

/* ------------------------------ Education ------------------------------ */
t("Education", "Course Curriculum", "Lessons, objectives and resources per module.", "curriculum syllabus lessons course teaching", "Lesson; Module|chips:Intro,Basics,Advanced,Project; Duration (min)|number; Done|checkbox; Resource|link; Notes", "Welcome, Core concepts, Final project");
t("Education", "Student Gradebook", "Students, scores and grades.", "gradebook students grades scores teacher", "Student; Email; Test 1|number; Test 2|number; Final|number; Grade|chips:A,B,C,D,F", "Ava Thompson, Liam Carter, Noah Singh");
t("Education", "Assignment Tracker", "Assignments, due dates and status.", "assignments homework due dates student planner", "Assignment; Subject|chips:Math,Science,History,English,Art; Due|date; Status|chips:To do,Doing,Submitted; Grade|number; Done|checkbox", "Essay draft, Lab report, Problem set");
t("Education", "Reading List", "Books and papers with status and rating.", "reading list books papers library goodreads", "Title; Author; Status|chips:Want to read,Reading,Finished; Rating|rating; Finished|date; Link|link", "Deep Work, The Pragmatic Programmer, Atomic Habits");
t("Education", "Language Vocabulary", "Words, meanings and mastery.", "vocabulary language learning flashcards words", "Word; Meaning; Example; Mastery|slider; Language|chips:Spanish,French,German,Japanese; Learned|date", "hola, bonjour, danke");
t("Education", "Study Planner", "Study sessions by topic and time.", "study planner exams revision schedule", "Topic; Subject|chips:Math,Science,History,Languages; Date|date; Hours|number; Done|checkbox; Confidence|rating", "Calculus review, Organic chemistry, Essay outline");

/* ------------------------------ Personal ------------------------------ */
t("Personal", "Habit Tracker", "Daily habits and streaks.", "habits tracker streak routine daily", "Habit; Mon|checkbox; Tue|checkbox; Wed|checkbox; Thu|checkbox; Fri|checkbox; Streak|number", "Read 20 pages, Workout, Meditate");
t("Personal", "Workout Log", "Exercises, sets, reps and weight.", "workout log fitness gym exercises sets reps", "Exercise; Muscle|chips:Chest,Back,Legs,Arms,Core; Sets|number; Reps|number; Weight|number; Date|date", "Bench press, Squat, Pull-ups");
t("Personal", "Meal Planner", "Weekly meals, ingredients and prep.", "meal planner food recipes groceries nutrition", "Meal; Day|chips:Mon,Tue,Wed,Thu,Fri,Sat,Sun; Type|chips:Breakfast,Lunch,Dinner; Calories|number; Recipe|link; Prepped|checkbox", "Overnight oats, Chicken bowl, Veggie curry");
t("Personal", "Travel Itinerary", "Trip plan by day, place and booking.", "travel itinerary trip plan vacation booking", "Plan; Place; Date|date; Type|chips:Flight,Hotel,Activity,Food; Cost|number; Booked|checkbox; Link|link", "Flight to Tokyo, Hotel check-in, Temple tour");
t("Personal", "Watchlist", "Movies and shows to watch with rating.", "movies shows watchlist netflix tv films", "Title; Type|chips:Movie,Series,Doc; Platform|chips:Netflix,Prime,Disney,Apple; Watched|checkbox; Rating|rating; Poster|image", "Dune, Severance, Planet Earth");
t("Personal", "Wishlist", "Things you want, price and link.", "wishlist shopping gifts want list", "Item; Price|number; Priority|chips:Low,Medium,High; Link|link; Bought|checkbox; Photo|image", "Mechanical keyboard, Standing desk, Noise-canceling headphones");

export const TEMPLATE_COUNT = raw.length; // 100

/* ---------------------------- sample row generator ---------------------------- */
const PEOPLE = ["Ava Thompson", "Liam Carter", "Noah Singh", "Mia Zhang", "Lucas Meyer"];
const COMPANIES = ["Acme Corp", "Globex", "Initech", "Umbrella Co", "Hooli"];
const CITIES = ["Kota", "Jaipur", "Mumbai", "Berlin", "Austin"];
const EMAILS = ["ava@acme.io", "liam@globex.com", "noah@initech.co", "mia@umbrella.dev", "lucas@hooli.com"];
const NOTES = ["Asked for a demo", "Follow up next week", "Waiting on feedback", "Looks promising", "Needs pricing"];
const WORDS = ["Alpha", "Beta", "Gamma", "Delta", "Omega"];
const PHONES = ["415 555 0132", "98765 43210", "20 7946 0958", "415 555 0178", "98123 45670"];
const SNIPPETS = {
	javascript: ["const sum = (a, b) => a + b;", "fetch(url).then((r) => r.json());", "arr.map((x) => x * 2);"],
	python: ["def add(a, b):\n    return a + b", "print('hello')", "[x * 2 for x in items]"],
	html: ["<div class=\"card\">Hello</div>", "<a href=\"/\">Home</a>", "<button>Save</button>"],
	sql: ["SELECT * FROM users;", "UPDATE t SET done = true;", "DELETE FROM logs;"],
};
const addDays = (iso, n) => {
	const d = new Date(`${iso}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
};

const sampleCell = (col, name, i, first, samples) => {
	const n = name.toLowerCase();
	switch (col.type) {
		case "chips":
			return col.options[i % col.options.length].id;
		case "number":
			if (/price|cost|amount|value|revenue|budget|salary|total|paid|mrr|spent|rate|check|income|valuation|current|buy|target|saved|planned|actual/.test(n)) return [1200, 450, 89, 2300, 640][i % 5];
			if (/%|rate|score|pct/.test(n)) return [42, 18, 67, 31, 55][i % 5];
			return [12, 4, 27, 9, 61][i % 5];
		case "checkbox":
			return [true, false, true, false, true][i % 5];
		case "date":
			return addDays("2026-11-03", i * 6);
		case "rating":
			return [5, 4, 3, 5, 2][i % 5];
		case "slider":
			return [80, 45, 20, 65, 100][i % 5];
		case "phone":
			return `${DIAL_CODES[i % 3 === 1 ? 2 : 0][0]} ${PHONES[i % 5]}`;
		case "link":
			return `https://example.com/${n.replace(/[^a-z]+/g, "-")}/${i + 1}`;
		case "avatar":
			return AVATARS[(i * 5 + 2) % AVATARS.length][0];
		case "otp":
			return ["482913", "730256", "119087", "664201", "305774"][i % 5];
		case "code":
			return (SNIPPETS[col.lang] || SNIPPETS.javascript)[i % 3];
		case "table":
		case "files":
		case "image":
		case "icon":
			return undefined;
		default:
			if (first && samples[i]) return samples[i];
			if (/email/.test(n)) return EMAILS[i % 5];
			if (/company|business|brand|vendor|supplier|account|firm|outlet|partner|client/.test(n)) return COMPANIES[i % 5];
			if (/city|location|area|place/.test(n)) return CITIES[i % 5];
			if (/name|person|contact|author|candidate|employee|customer|guest|student|prospect|investor|creator|lead|reviewer|user|manager|attendees/.test(n)) return PEOPLE[i % 5];
			if (/note|comment|description|summary|reason|feedback|message|decision|next|mitigation|thesis|goals|features|highlights|hook|terms|results|topic/.test(n)) return NOTES[i % 5];
			return `${WORDS[i % 5]} ${col.name.split(" ")[0]}`;
	}
};

const parseCols = (spec) =>
	spec.split(";").map((s, idx) => {
		const [name, typeSpec = "text"] = s.trim().split("|");
		const [type, arg] = typeSpec.split(":");
		const col = { id: `c${idx}`, name: name.trim(), type };
		if (type === "chips") col.options = (arg || "").split(",").map((l, k) => ({ id: `o${idx}_${k}`, label: l.trim(), color: ["gray", "blue", "green", "amber", "red", "purple", "pink", "teal"][(k + 1) % 8] }));
		if (type === "code") col.lang = arg || "javascript";
		return col;
	});

/** Plain template object (stable ids, used for preview + search). */
export const TEMPLATES = raw.map((r, idx) => {
	const columns = parseCols(r.cols);
	const samples = r.samples.split(",").map((s) => s.trim()).filter(Boolean);
	const rows = Array.from({ length: 4 }, (_, i) => ({
		id: `r${i}`,
		cells: Object.fromEntries(columns.map((c, ci) => [c.id, sampleCell(c, c.name, i, ci === 0, samples)]).filter(([, v]) => v !== undefined)),
	}));
	return { id: `t${idx + 1}`, ...r, columns, rows, columnNames: columns.map((c) => c.name).join(" ") };
});

/** Fresh table data (new ids) from a template, ready to be saved. */
export const buildTableFromTemplate = (tpl, { withSamples = true } = {}) => {
	const colMap = new Map();
	const columns = tpl.columns.map((c) => {
		const nc = { ...c, id: uid() };
		if (c.options) nc.options = c.options.map((o, k) => ({ ...makeOption(o.label, k), color: o.color }));
		colMap.set(c.id, nc);
		return nc;
	});
	const rows = withSamples
		? tpl.rows.slice(0, 3).map((r) =>
				makeRow(
					Object.fromEntries(
						Object.entries(r.cells).map(([cid, v]) => {
							const nc = colMap.get(cid);
							const old = tpl.columns.find((c) => c.id === cid);
							const val = old.type === "chips" ? nc.options[old.options.findIndex((o) => o.id === v)]?.id : v;
							return [nc.id, val];
						}),
					),
				),
			)
		: [makeRow(), makeRow(), makeRow()];
	return { v: 1, columns, rows };
};

/* ---------------------------- fuzzy search ---------------------------- */
const fuse = new Fuse(TEMPLATES, {
	includeScore: true,
	threshold: 0.4,
	ignoreLocation: true,
	minMatchCharLength: 2,
	keys: [
		{ name: "name", weight: 3 },
		{ name: "keywords", weight: 2 },
		{ name: "columnNames", weight: 1.5 },
		{ name: "description", weight: 1 },
		{ name: "category", weight: 1 },
	],
});

const STOP = new Set(["table", "tables", "for", "a", "an", "the", "my", "of", "to", "with", "and", "in", "on", "template", "tracker", "list", "sheet", "new", "make", "create", "me", "i", "need", "want"]);

/**
 * Typo-tolerant search. "table for leads whatsapp" -> WhatsApp Leads first:
 * every meaningful word is searched on its own and scores are added up, so templates
 * matching MORE of the words rank higher.
 */
export const searchTemplates = (query, category = null, limit = 60) => {
	const pool = category && category !== "All" ? TEMPLATES.filter((t) => t.category === category) : TEMPLATES;
	const q = (query || "").trim().toLowerCase();
	if (!q) return pool.slice(0, limit);
	const words = q.split(/[^a-z0-9&%+]+/).filter((w) => w.length > 1 && !STOP.has(w));
	const terms = words.length ? words : [q];
	const score = new Map();
	for (const w of terms) {
		for (const r of fuse.search(w, { limit: 100 })) score.set(r.item.id, (score.get(r.item.id) || 0) + (1 - r.score));
	}
	if (terms.length > 1) {
		for (const r of fuse.search(terms.join(" "), { limit: 50 })) score.set(r.item.id, (score.get(r.item.id) || 0) + (1 - r.score) * 0.5);
	}
	const ids = new Set(pool.map((t) => t.id));
	return [...score.entries()]
		.filter(([id]) => ids.has(id))
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([id]) => TEMPLATES.find((t) => t.id === id));
};
