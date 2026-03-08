const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType, Header, Footer, PageNumber,
  NumberFormat, convertInchesToTwip, PageOrientation,
  UnderlineType, LevelFormat,
} = require('docx');
const fs = require('fs');

// ─── Brand Colours ─────────────────────────────────────────────────────────
const GREEN  = '1B4332';
const AMBER  = 'D97706';
const LIGHT  = 'F0FDF4';  // very light green for shading
const STONE  = 'F5F5F4';
const WHITE  = 'FFFFFF';

// ─── Helpers ────────────────────────────────────────────────────────────────
function heading1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    border: { bottom: { color: GREEN, size: 8, style: BorderStyle.SINGLE } },
    run: { color: GREEN, bold: true, size: 28 },
  });
}

function heading2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    run: { color: GREEN, bold: true, size: 24 },
  });
}

function heading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, color: AMBER, size: 22 })],
    spacing: { before: 200, after: 60 },
  });
}

function body(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: '1C1917' })],
    spacing: { before: 60, after: 60 },
    indent: { left: convertInchesToTwip(0.1) },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: '•  ', color: AMBER, bold: true, size: 20 }),
      new TextRun({ text, size: 20, color: '1C1917' }),
    ],
    spacing: { before: 40, after: 40 },
    indent: { left: convertInchesToTwip(0.35) },
  });
}

function numberedStep(n, text) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${n}.  `, bold: true, color: GREEN, size: 20 }),
      new TextRun({ text, size: 20, color: '1C1917' }),
    ],
    spacing: { before: 40, after: 40 },
    indent: { left: convertInchesToTwip(0.35) },
  });
}

function note(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: '⚠  Note: ', bold: true, color: AMBER, size: 19 }),
      new TextRun({ text, italics: true, size: 19, color: '44403C' }),
    ],
    spacing: { before: 80, after: 80 },
    indent: { left: convertInchesToTwip(0.2) },
    shading: { type: ShadingType.SOLID, color: 'FFFBEB' },
    border: { left: { color: AMBER, size: 16, style: BorderStyle.SINGLE } },
  });
}

function divider() {
  return new Paragraph({
    text: '',
    spacing: { before: 80, after: 80 },
    border: { bottom: { color: 'D6D3D1', size: 4, style: BorderStyle.SINGLE } },
  });
}

function roleTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: ['Role', 'Login Email (demo)', 'Access Level'].map(h =>
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: h, bold: true, color: WHITE, size: 19 })],
            })],
            shading: { type: ShadingType.SOLID, color: GREEN },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
          })
        ),
      }),
      ...rows.map(([role, email, access], i) =>
        new TableRow({
          children: [role, email, access].map(cell =>
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: cell, size: 18, color: '1C1917' })],
              })],
              shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? LIGHT : WHITE },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
            })
          ),
        })
      ),
    ],
  });
}

function statusTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: ['Status', 'Meaning', 'Who Acts Next'].map(h =>
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: h, bold: true, color: WHITE, size: 19 })],
            })],
            shading: { type: ShadingType.SOLID, color: GREEN },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
          })
        ),
      }),
      ...rows.map(([status, meaning, actor], i) =>
        new TableRow({
          children: [status, meaning, actor].map(cell =>
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: cell, size: 18, color: '1C1917' })],
              })],
              shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? LIGHT : WHITE },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
            })
          ),
        })
      ),
    ],
  });
}

function spacer() {
  return new Paragraph({ text: '', spacing: { before: 100, after: 100 } });
}

// ─── Cover page ──────────────────────────────────────────────────────────────
function coverPage() {
  return [
    spacer(), spacer(), spacer(),
    new Paragraph({
      children: [new TextRun({
        text: 'MAISHA KAZI',
        bold: true, size: 72, color: GREEN, allCaps: true,
        characterSpacing: 200,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'Youth Work-Order Platform',
        size: 32, color: AMBER, italics: true,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: '━━━━━━━━━━━━━━━━━━━━━━',
        color: AMBER, size: 24,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'Standard Operating Procedure',
        bold: true, size: 40, color: GREEN,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 160 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'Coordinator, Youth Worker & Corporate Client Guide',
        size: 24, color: '78716C',
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 600 },
    }),
    spacer(), spacer(),
    new Paragraph({
      children: [new TextRun({ text: 'Prepared by', size: 20, color: '78716C' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Maisha Community Initiatives', bold: true, size: 22, color: GREEN })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'maishaprojects.org', size: 20, color: AMBER })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Version 1.0  •  March 2026', size: 18, color: '78716C' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: '\f', size: 1 })], // page break
    }),
  ];
}

// ─── Document body ───────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [],
  },
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 20, color: '1C1917' },
        paragraph: { spacing: { line: 276 } },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        run: { bold: true, size: 28, color: GREEN, font: 'Calibri' },
        paragraph: { spacing: { before: 360, after: 120 } },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        run: { bold: true, size: 24, color: GREEN, font: 'Calibri' },
        paragraph: { spacing: { before: 240, after: 80 } },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(1.1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.1),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'MAISHA KAZI  ', bold: true, color: GREEN, size: 16 }),
                new TextRun({ text: '|  Standard Operating Procedure', color: '78716C', size: 16 }),
              ],
              border: { bottom: { color: AMBER, size: 8, style: BorderStyle.SINGLE } },
              spacing: { after: 60 },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Maisha Community Initiatives  •  maishaprojects.org  •  Page ', size: 16, color: '78716C' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREEN }),
                new TextRun({ text: ' of ', size: 16, color: '78716C' }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: GREEN }),
              ],
              alignment: AlignmentType.CENTER,
              border: { top: { color: 'D6D3D1', size: 4, style: BorderStyle.SINGLE } },
            }),
          ],
        }),
      },
      children: [
        // ── COVER ──────────────────────────────────────────────────────────
        ...coverPage(),

        // ── 1. PURPOSE ─────────────────────────────────────────────────────
        heading1('1.  Purpose & Scope'),
        body(
          'This Standard Operating Procedure (SOP) governs the day-to-day use of the Maisha Kazi ' +
          'platform — a digital work-order system developed by Maisha Community Initiatives to connect ' +
          'vetted youth workers with corporate and individual clients in Tanzania.'
        ),
        spacer(),
        body('This document is intended for:'),
        bullet('Platform Coordinators (Maisha staff) who manage jobs, youth, and clients'),
        bullet('Youth Workers who receive, execute, and submit proof of completed jobs'),
        bullet('Corporate Clients who post service requests and confirm completed work'),
        divider(),

        // ── 2. PLATFORM OVERVIEW ───────────────────────────────────────────
        heading1('2.  Platform Overview'),
        body(
          'Maisha Kazi digitises the full job lifecycle: from a client posting a service request, ' +
          'through coordinator vetting and youth assignment, to proof-of-completion photo submission ' +
          'and client confirmation. CSR impact reports are generated automatically.'
        ),
        spacer(),
        heading2('2.1  Technology'),
        bullet('Web application — accessible on any device via browser (mobile-first design)'),
        bullet('React frontend  +  Node.js/Express backend  +  PostgreSQL database'),
        bullet('JWT-based authentication — sessions expire after 15 minutes; a refresh token (7 days) keeps users logged in automatically'),
        spacer(),
        heading2('2.2  User Roles & Demo Credentials'),
        spacer(),
        roleTable([
          ['Coordinator', 'coordinator@maishakazi.org', 'Full access — manage all entities'],
          ['Corporate Client', 'coca-cola@demo.com', 'Post jobs, view own jobs, CSR reports'],
          ['Corporate Client', 'vodacom@demo.com', 'Post jobs, view own jobs, CSR reports'],
          ['Corporate Client', 'ttcl@demo.com', 'Post jobs, view own jobs, CSR reports'],
          ['Youth Worker', 'amina@demo.com', 'Browse & apply for jobs, upload proof, earnings'],
          ['Youth Worker', 'baraka@demo.com', 'Browse & apply for jobs, upload proof, earnings'],
          ['Youth Worker', 'consolata@demo.com', 'Browse & apply for jobs, upload proof, earnings'],
          ['Youth Worker', 'daudi@demo.com', 'Browse & apply for jobs, upload proof, earnings'],
        ]),
        note('All demo accounts use the password: password123  —  Change all passwords before going live.'),
        divider(),

        // ── 3. JOB LIFECYCLE ──────────────────────────────────────────────
        heading1('3.  Job Lifecycle'),
        body(
          'Every job on Maisha Kazi follows a linear status progression. Understanding this flow is ' +
          'essential for all three user roles.'
        ),
        spacer(),
        statusTable([
          ['OPEN',        'Job posted by a client; youth can browse and apply',                   'Youth / Coordinator'],
          ['ASSIGNED',    'Coordinator has assigned a vetted youth worker',                       'Youth Worker'],
          ['IN_PROGRESS', 'Youth worker has tapped "Start Job" on arrival',                       'Youth Worker'],
          ['COMPLETED',   'Youth uploaded proof & marked complete; client confirms',               'Client'],
          ['DISPUTED',    'Client raised a dispute instead of confirming',                        'Coordinator'],
          ['CANCELLED',   'Job cancelled before assignment or completion',                        'Coordinator'],
        ]),
        spacer(),
        note(
          'Youth must upload a proof photo before marking a job as COMPLETED. ' +
          'After completion, the client can confirm the work or raise a dispute. ' +
          'Coordinators can override status at any stage if needed.'
        ),
        divider(),

        // ── 4. COORDINATOR ────────────────────────────────────────────────
        heading1('4.  Coordinator SOP'),
        body(
          'Coordinators are Maisha staff who administer the platform. They have visibility into all ' +
          'youth, clients, jobs, and reports.'
        ),
        spacer(),

        heading2('4.1  Vetting a Youth Worker'),
        numberedStep(1, 'Log in at the platform URL using coordinator credentials.'),
        numberedStep(2, 'Navigate to Youth Management in the left sidebar.'),
        numberedStep(3, 'Find the youth worker — use the search bar or filter by "Not Vetted".'),
        numberedStep(4, 'Click the youth\'s row to open their profile. Review ID document and bio.'),
        numberedStep(5, 'Click Vet Youth. The badge changes to "Verified" immediately.'),
        note('Only vetted youth can be assigned to jobs. Always verify ID documents before vetting.'),
        spacer(),

        heading2('4.2  Creating a Job'),
        numberedStep(1, 'Navigate to Job Management → click + New Job.'),
        numberedStep(2, 'Fill in: Title, Description, Service Type, Location, Fee (TSH), and optionally Scheduled Date and Notes for the youth worker.'),
        numberedStep(3, 'Select the Client from the dropdown (or the client can post directly — see Section 6).'),
        numberedStep(4, 'Click Create Job. Status is set to OPEN automatically.'),
        spacer(),

        heading2('4.3  Assigning a Youth Worker'),
        numberedStep(1, 'Open the job from Job Management.'),
        numberedStep(2, 'Click Assign Youth and select an available, vetted worker.'),
        numberedStep(3, 'The youth receives an in-app notification. Status moves to ASSIGNED.'),
        note('A notification is sent automatically. You do not need to call the youth separately unless urgent.'),
        spacer(),

        heading2('4.4  Monitoring & Dispute Resolution'),
        bullet('Dashboard shows live stats: active youth, open jobs, completions this week, total revenue.'),
        bullet('Disputed jobs appear highlighted. Open the job, review the proof photo and client notes, then either mark as Completed or Cancelled.'),
        bullet('Run a CSR report for any client via Reports → select client → Generate Report.'),
        divider(),

        // ── 5. YOUTH WORKER ───────────────────────────────────────────────
        heading1('5.  Youth Worker SOP'),
        body('Youth workers use the platform primarily on mobile devices to receive and execute jobs.'),
        spacer(),

        heading2('5.1  First-Time Setup'),
        numberedStep(1, 'Log in with the email and password provided by the coordinator.'),
        numberedStep(2, 'Go to My Profile and fill in: Bio, Location, Phone Number, and Skills.'),
        numberedStep(3, 'Upload your ID Document using the upload button on the Profile page. The coordinator will review and vet your account.'),
        note('You will not receive job assignments until a coordinator marks you as Vetted.'),
        spacer(),

        heading2('5.2  Browsing & Applying for Jobs'),
        numberedStep(1, 'Open the Jobs page from the sidebar. All OPEN jobs are visible to vetted youth.'),
        numberedStep(2, 'Browse available jobs by service type, location, and fee.'),
        numberedStep(3, 'Tap a job card to view full details: description, location map, fee, and client info.'),
        numberedStep(4, 'Tap Apply for Job. The coordinator is notified and will review your application.'),
        numberedStep(5, 'If selected, the coordinator assigns you and you receive an in-app notification. Status moves to ASSIGNED.'),
        note('You can only apply for jobs with OPEN status. You cannot apply for the same job twice.'),
        spacer(),

        heading2('5.3  Starting an Assigned Job'),
        numberedStep(1, 'Open My Jobs and tap the assigned job card to view details: location, description, fee, and coordinator notes.'),
        numberedStep(2, 'Use the map on the job detail page to navigate to the location.'),
        numberedStep(3, 'When you arrive, tap Start Job. Status moves to IN_PROGRESS.'),
        note('Always tap Start Job before beginning work — this timestamps your arrival and protects you in case of a dispute.'),
        spacer(),

        heading2('5.4  Uploading Proof of Completion'),
        numberedStep(1, 'After completing the work, tap the camera button on the job detail page.'),
        numberedStep(2, 'Take a clear photo showing the completed work (e.g. clean office, washed car, fixed window).'),
        numberedStep(3, 'Tap Upload & Complete. The photo is sent to the client for confirmation.'),
        numberedStep(4, 'Status moves to COMPLETED. You will be paid once the client confirms the work.'),
        bullet('Maximum photo size: 5 MB  •  Accepted formats: JPEG, PNG, WebP'),
        bullet('GPS/EXIF data is automatically stripped from photos to protect your privacy.'),
        spacer(),

        heading2('5.5  Tracking Earnings'),
        bullet('Go to Earnings in the sidebar to view this week, this month, and all-time earnings.'),
        bullet('Each completed and confirmed job appears in the Recent Earnings list with date and amount.'),
        bullet('Your share is 80% of the job fee. Maisha retains 20% for platform and coordination costs.'),
        divider(),

        // ── 6. CLIENT ─────────────────────────────────────────────────────
        heading1('6.  Corporate Client SOP'),
        body(
          'Corporate clients post service requests and confirm completed jobs. Their dashboard is ' +
          'branded with their organisation\'s colour and name.'
        ),
        spacer(),

        heading2('6.1  Posting a Service Request'),
        numberedStep(1, 'Log in and you are taken directly to your Branded Portal (dashboard).'),
        numberedStep(2, 'Tap Request a Service or navigate to Request Service in the sidebar.'),
        numberedStep(3, 'Fill in: Service Type, Description of work needed, Location, and Fee (TSH).'),
        numberedStep(4, 'Submit. The coordinator receives a notification and will assign a youth worker.'),
        note('Service types available: Car Wash, Cleaning, Gardening, Window Repair, Handywork, Other.'),
        spacer(),

        heading2('6.2  Tracking Your Jobs'),
        numberedStep(1, 'Navigate to My Jobs to see all your service requests and their current statuses.'),
        numberedStep(2, 'When a job is completed and the youth uploads proof, you will see a notification.'),
        numberedStep(3, 'Open the job and review the proof photo. If satisfied, click Confirm Completion.'),
        numberedStep(4, 'If there is an issue, click Raise Dispute. The coordinator will be alerted.'),
        spacer(),

        heading2('6.3  CSR Reports'),
        bullet('Navigate to CSR Report to view your organisation\'s social impact summary.'),
        bullet('Report includes: total jobs completed, total youth supported, hours of employment generated, and total CSR investment.'),
        bullet('Coordinators can generate a formal PDF-ready CSR report from the Reports section on request.'),
        divider(),

        // ── 7. NOTIFICATIONS ──────────────────────────────────────────────
        heading1('7.  Notifications'),
        body('All users receive in-app notifications for key events. The bell icon in the top bar shows an unread count badge.'),
        spacer(),
        bullet('JOB ASSIGNED — Sent to the youth worker when a coordinator assigns them a job'),
        bullet('JOB COMPLETED — Sent to the client when a youth uploads proof'),
        bullet('JOB REQUEST — Sent to the coordinator when a client posts a new job'),
        bullet('DISPUTE RAISED — Sent to the coordinator when a client disputes a job'),
        bullet('PAYMENT RECEIVED — Sent to the youth worker when earnings are confirmed'),
        spacer(),
        body('Tap any notification to mark it as read. Use Mark All Read to clear all at once.'),
        divider(),

        // ── 8. DATA & PRIVACY ─────────────────────────────────────────────
        heading1('8.  Data & Privacy'),
        bullet('All proof photos have GPS/EXIF metadata stripped automatically before storage.'),
        bullet('User passwords are hashed with bcrypt (cost factor 12) — they are never stored in plain text.'),
        bullet('JWT access tokens expire after 15 minutes. Refresh tokens expire after 7 days.'),
        bullet('ID documents uploaded for vetting are stored securely and accessible only to coordinators.'),
        bullet('The platform is hosted within a private Docker network — the database is not publicly exposed.'),
        divider(),

        // ── 9. TROUBLESHOOTING ────────────────────────────────────────────
        heading1('9.  Common Issues & Troubleshooting'),
        spacer(),
        heading3('I can\'t log in'),
        bullet('Check that Caps Lock is off. Passwords are case-sensitive.'),
        bullet('Contact the coordinator to reset your password (no self-service reset in v1.0).'),
        spacer(),
        heading3('The proof photo won\'t upload'),
        bullet('Ensure the photo is JPEG, PNG, or WebP and smaller than 5 MB.'),
        bullet('HEIC photos (iPhone default) must be converted or set your iPhone to capture in JPEG (Settings → Camera → Formats → Most Compatible).'),
        bullet('Ensure you are on IN_PROGRESS status — photos cannot be uploaded before tapping Start Job.'),
        spacer(),
        heading3('My earnings show TSH 0'),
        bullet('Earnings only count jobs with status COMPLETED and client-confirmed.'),
        bullet('Check if the client has confirmed the completed job — earnings are only credited after client confirmation.'),
        spacer(),
        heading3('Youth data not showing in coordinator dashboard'),
        bullet('Ensure the youth worker has logged in at least once so their profile was created.'),
        bullet('Check that you are logged in as COORDINATOR, not as a CLIENT or YOUTH account.'),
        divider(),

        // ── 10. CONTACTS ──────────────────────────────────────────────────
        heading1('10.  Contacts & Support'),
        spacer(),
        heading3('Platform Founders'),
        bullet('Ernest Moyo — Co-Founder  |  ernest@maishaprojects.org'),
        bullet('Mustafa Mhongera — Co-Founder  |  mustafa@maishaprojects.org'),
        bullet('Rodden R. Chikonzo — Co-Founder  |  rodden@maishaprojects.org'),
        spacer(),
        heading3('Organisation'),
        bullet('Maisha Community Initiatives  |  maishaprojects.org'),
        bullet('Dar es Salaam, Tanzania'),
        spacer(),
        note(
          'For platform bugs or feature requests, log an issue at the project repository or contact ' +
          'the technical team directly. Include screenshots and a description of the steps taken.'
        ),
        divider(),
        spacer(),
        new Paragraph({
          children: [
            new TextRun({ text: 'Maisha Community Initiatives  •  maishaprojects.org', size: 18, color: '78716C', italics: true }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Maisha Kazi SOP v1.0  —  March 2026', size: 18, color: AMBER }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    },
  ],
});

// ─── Write to file ───────────────────────────────────────────────────────────
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('Maisha_Kazi_SOP_v1.0.docx', buffer);
  console.log('✓  Maisha_Kazi_SOP_v1.0.docx created successfully');
});
