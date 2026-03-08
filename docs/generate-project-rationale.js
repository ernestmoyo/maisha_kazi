const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType, Header, Footer, PageNumber,
  convertInchesToTwip,
} = require('docx');
const fs = require('fs');

// ─── Brand Colours ─────────────────────────────────────────────────────────
const GREEN  = '1B4332';
const AMBER  = 'D97706';
const LIGHT  = 'F0FDF4';
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
      new TextRun({ text: '\u2022  ', color: AMBER, bold: true, size: 20 }),
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
      new TextRun({ text: '\u26A0  ', bold: true, color: AMBER, size: 19 }),
      new TextRun({ text, italics: true, size: 19, color: '44403C' }),
    ],
    spacing: { before: 80, after: 80 },
    indent: { left: convertInchesToTwip(0.2) },
    shading: { type: ShadingType.SOLID, color: 'FFFBEB' },
    border: { left: { color: AMBER, size: 16, style: BorderStyle.SINGLE } },
  });
}

function quote(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: '\u201C', bold: true, color: GREEN, size: 28 }),
      new TextRun({ text, italics: true, size: 21, color: '44403C' }),
      new TextRun({ text: '\u201D', bold: true, color: GREEN, size: 28 }),
    ],
    spacing: { before: 120, after: 120 },
    indent: { left: convertInchesToTwip(0.4), right: convertInchesToTwip(0.4) },
    shading: { type: ShadingType.SOLID, color: LIGHT },
    border: { left: { color: GREEN, size: 16, style: BorderStyle.SINGLE } },
  });
}

function divider() {
  return new Paragraph({
    text: '',
    spacing: { before: 80, after: 80 },
    border: { bottom: { color: 'D6D3D1', size: 4, style: BorderStyle.SINGLE } },
  });
}

function spacer() {
  return new Paragraph({ text: '', spacing: { before: 100, after: 100 } });
}

function statRow(label, value) {
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: label, size: 20, color: '1C1917' })],
        })],
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        width: { size: 60, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: value, bold: true, size: 20, color: GREEN })],
          alignment: AlignmentType.RIGHT,
        })],
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        shading: { type: ShadingType.SOLID, color: LIGHT },
      }),
    ],
  });
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
        text: '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
        color: AMBER, size: 24,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'Project Rationale & Vision',
        bold: true, size: 40, color: GREEN,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 160 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: 'Why We Built Maisha Kazi and Where We Are Going',
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
      children: [new TextRun({ text: 'Version 1.0  \u2022  March 2026', size: 18, color: '78716C' })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: '\f', size: 1 })],
    }),
  ];
}

// ─── Document body ───────────────────────────────────────────────────────────
const doc = new Document({
  numbering: { config: [] },
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 20, color: '1C1917' },
        paragraph: { spacing: { line: 276 } },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal',
        run: { bold: true, size: 28, color: GREEN, font: 'Calibri' },
        paragraph: { spacing: { before: 360, after: 120 } },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal',
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
                new TextRun({ text: '|  Project Rationale & Vision', color: '78716C', size: 16 }),
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
                new TextRun({ text: 'Maisha Community Initiatives  \u2022  maishaprojects.org  \u2022  Page ', size: 16, color: '78716C' }),
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

        // ── 1. THE PROBLEM ───────────────────────────────────────────────
        heading1('1.  The Problem We Are Solving'),
        body(
          'Tanzania has one of the youngest populations in Africa. Over 60% of its citizens are under 25, ' +
          'yet youth unemployment remains one of the country\'s most pressing challenges. In urban centres ' +
          'like Dar es Salaam, thousands of capable young people lack access to formal employment \u2014 not because ' +
          'they lack skills, but because they lack connections, visibility, and a trusted platform to showcase ' +
          'their abilities.'
        ),
        spacer(),
        body(
          'At the same time, corporate organisations and individuals regularly need service workers \u2014 for cleaning, ' +
          'gardening, car washing, handywork, and facility maintenance \u2014 but they struggle to find reliable, ' +
          'vetted workers. The result is a trust gap: clients cannot verify worker quality, and youth cannot ' +
          'prove their track record.'
        ),
        spacer(),
        heading3('The consequences are real:'),
        bullet('Youth remain trapped in informal, unpredictable work with no path to growth'),
        bullet('Clients resort to word-of-mouth hiring with no accountability or quality assurance'),
        bullet('Community organisations like Maisha spend enormous effort coordinating jobs manually \u2014 via phone calls, WhatsApp messages, and paper records'),
        bullet('Corporate Social Responsibility (CSR) investments in youth employment cannot be measured or reported on effectively'),
        divider(),

        // ── 2. OUR SOLUTION ─────────────────────────────────────────────
        heading1('2.  Our Solution: Maisha Kazi'),
        body(
          'Maisha Kazi is a digital work-order platform that bridges the gap between vetted youth workers ' +
          'and corporate/individual clients. Built by Maisha Community Initiatives, it digitises the entire ' +
          'job lifecycle \u2014 from service request to proof of completion \u2014 creating transparency, accountability, ' +
          'and measurable impact.'
        ),
        spacer(),
        quote(
          'Maisha Kazi does not just connect youth to jobs. It builds a verified track record that follows ' +
          'them throughout their career \u2014 turning informal gig work into a stepping stone toward formal employment.'
        ),
        spacer(),

        heading2('2.1  How It Works'),
        numberedStep(1, 'A corporate client posts a service request (e.g. office cleaning, car wash, garden maintenance).'),
        numberedStep(2, 'A Maisha coordinator reviews the request and assigns a vetted youth worker based on skills, location, and availability.'),
        numberedStep(3, 'The youth worker receives the job on their phone, navigates to the location, and taps "Start Job" on arrival.'),
        numberedStep(4, 'After completing the work, the youth uploads a proof photo (EXIF/GPS data is stripped for privacy).'),
        numberedStep(5, 'The client reviews the proof and confirms completion. The youth\'s earnings are credited.'),
        numberedStep(6, 'Both the client and youth build a verified history \u2014 enabling trust, repeat business, and CSR reporting.'),
        spacer(),

        heading2('2.2  What Makes It Different'),
        bullet('Vetting first: Every youth worker is verified by a Maisha coordinator before receiving any job assignment. ID documents, skills, and reliability are checked.'),
        bullet('Proof of work: Photo-based completion evidence creates accountability and protects both parties.'),
        bullet('Built-in CSR reporting: Clients can see their social impact \u2014 how many youth they have supported, jobs completed, and total investment \u2014 directly in the platform.'),
        bullet('Mobile-first: Designed for the way Tanzanian youth actually use technology \u2014 on smartphones, often with limited data.'),
        bullet('Open source: The entire codebase is publicly available, inviting community contribution and transparency.'),
        divider(),

        // ── 3. WHO WE SERVE ─────────────────────────────────────────────
        heading1('3.  Who We Serve'),
        spacer(),

        heading2('3.1  Youth Workers'),
        body(
          'Young people aged 18\u201335 in Dar es Salaam and surrounding areas who have practical skills ' +
          '(cleaning, gardening, handywork, car washing) but lack access to consistent work opportunities. ' +
          'Many are graduates of vocational training programmes or community skills workshops run by ' +
          'Maisha Community Initiatives.'
        ),
        spacer(),
        heading3('What they gain:'),
        bullet('A verified digital work profile that grows with every completed job'),
        bullet('Transparent earnings tracking \u2014 weekly, monthly, and all-time'),
        bullet('Direct access to corporate clients they would never reach on their own'),
        bullet('Dignity and professionalism \u2014 they are not "day labourers" but verified service providers'),
        spacer(),

        heading2('3.2  Corporate Clients'),
        body(
          'Companies operating in Tanzania that need reliable service workers and want their CSR investments ' +
          'in youth employment to be visible and measurable. Current demo clients include Coca-Cola, Vodacom, ' +
          'and TTCL \u2014 representing the type of corporate partner Maisha Kazi is built for.'
        ),
        spacer(),
        heading3('What they gain:'),
        bullet('Access to pre-vetted, reliable workers \u2014 no more guessing about quality'),
        bullet('Digital proof of every completed job for internal records and auditing'),
        bullet('Automated CSR impact reports showing jobs created, youth supported, and investment totals'),
        bullet('A branded portal experience with their company identity'),
        spacer(),

        heading2('3.3  Maisha Coordinators'),
        body(
          'Maisha staff who manage the day-to-day operations: vetting youth, assigning jobs, resolving ' +
          'disputes, and ensuring quality. The platform replaces their previous workflow of phone calls, ' +
          'WhatsApp groups, and manual spreadsheets.'
        ),
        divider(),

        // ── 4. THE IMPACT ───────────────────────────────────────────────
        heading1('4.  The Impact We Aim to Create'),
        spacer(),

        heading2('4.1  For Youth'),
        bullet('Transition from informal to formal-adjacent employment with a verifiable track record'),
        bullet('Consistent income through a steady pipeline of corporate service requests'),
        bullet('Skills development and professional growth through repeated, quality-tracked work'),
        bullet('Financial inclusion \u2014 documented earnings history that can support bank account applications or micro-loans'),
        spacer(),

        heading2('4.2  For the Community'),
        bullet('Reduced youth unemployment and idleness in urban centres'),
        bullet('Increased corporate investment in local communities through transparent CSR'),
        bullet('A replicable model that can expand to other cities and countries across East Africa'),
        spacer(),

        heading2('4.3  For Corporate Partners'),
        bullet('Measurable social impact \u2014 not just donations, but documented employment creation'),
        bullet('Reliable service delivery with accountability built into every transaction'),
        bullet('A partnership model that aligns business needs with community development'),
        divider(),

        // ── 5. WHY NOW ──────────────────────────────────────────────────
        heading1('5.  Why Now'),
        body(
          'Several converging trends make this the right moment for Maisha Kazi:'
        ),
        spacer(),
        bullet('Smartphone penetration in Tanzania has crossed 50%, with mobile data becoming increasingly affordable \u2014 the infrastructure for a mobile-first platform is in place.'),
        bullet('Corporate ESG and CSR requirements are tightening globally. Companies operating in Tanzania need better tools to demonstrate social impact.'),
        bullet('The gig economy is growing across Africa, but without trust infrastructure. Maisha Kazi provides that trust layer through vetting and proof of work.'),
        bullet('Post-pandemic, organisations are more open to digital service procurement \u2014 the cultural barrier to adopting a platform like this has lowered significantly.'),
        bullet('Maisha Community Initiatives has been operating on the ground for years, building the relationships and youth pipeline that make the platform viable from day one.'),
        divider(),

        // ── 6. OUR TEAM ─────────────────────────────────────────────────
        heading1('6.  Our Team'),
        body(
          'Maisha Kazi is built by the founding team of Maisha Community Initiatives \u2014 a Tanzania-based ' +
          'organisation dedicated to youth empowerment, community development, and sustainable impact.'
        ),
        spacer(),
        heading3('Founders'),
        bullet('Ernest Moyo \u2014 Co-Founder  |  PhD in Applied Mathematics & Computer Science; Public Health expertise. Leads technology and platform development.'),
        bullet('Mustafa Mhongera \u2014 Co-Founder  |  Nonprofit Programme Management; PhD Candidate in Development Studies. Leads community operations and partnerships.'),
        bullet('Rodden R. Chikonzo \u2014 Co-Founder  |  Automation & Control Systems Engineer. Leads systems design and operational efficiency.'),
        spacer(),
        body(
          'Together, the team combines deep technical capability with grassroots community experience \u2014 ' +
          'a combination that is essential for building technology that actually works in the Tanzanian context.'
        ),
        divider(),

        // ── 7. OPEN SOURCE ──────────────────────────────────────────────
        heading1('7.  Open Source & Transparency'),
        body(
          'Maisha Kazi is fully open source under the MIT License. The complete codebase \u2014 frontend, backend, ' +
          'database schema, and deployment configuration \u2014 is publicly available on GitHub.'
        ),
        spacer(),
        bullet('Repository: github.com/ernestmoyo/maisha_kazi'),
        bullet('License: MIT \u2014 free to use, modify, and distribute'),
        bullet('Contributions welcome: We invite developers, designers, and community organisations to contribute'),
        spacer(),
        body(
          'We believe that tools for youth empowerment should be transparent, auditable, and community-owned. ' +
          'Open-sourcing Maisha Kazi ensures that the platform can be adopted and adapted by other organisations ' +
          'facing similar challenges across Africa and beyond.'
        ),
        divider(),

        // ── 8. WHAT'S NEXT ──────────────────────────────────────────────
        heading1('8.  What\'s Next'),
        body('Maisha Kazi v1.0 is live and ready for team testing. Our roadmap includes:'),
        spacer(),
        heading3('Short-term (Q2 2026)'),
        bullet('Complete team testing and feedback integration'),
        bullet('Onboard first real corporate clients in Dar es Salaam'),
        bullet('Add M-Pesa payment integration for direct youth payouts'),
        bullet('SMS notifications for youth workers without reliable internet'),
        spacer(),
        heading3('Medium-term (Q3\u2013Q4 2026)'),
        bullet('Mobile app (React Native) for improved youth worker experience'),
        bullet('Automated job matching based on skills, location proximity, and ratings'),
        bullet('Multi-language support (Swahili + English)'),
        bullet('Expand to Arusha, Mwanza, and Dodoma'),
        spacer(),
        heading3('Long-term (2027+)'),
        bullet('Replicate the model in other East African countries (Kenya, Uganda, Rwanda)'),
        bullet('Partner with government employment agencies for youth registration'),
        bullet('Build a youth skills certification programme integrated with the platform'),
        bullet('Explore social enterprise sustainability models'),
        divider(),

        // ── 9. CONTACT ──────────────────────────────────────────────────
        heading1('9.  Get Involved'),
        body(
          'Maisha Kazi is more than a platform \u2014 it is a movement to dignify youth work and create ' +
          'transparent pathways from informal employment to sustainable livelihoods. We welcome partners, ' +
          'contributors, and supporters.'
        ),
        spacer(),
        heading3('Contact'),
        bullet('Email: info@maishaprojects.org'),
        bullet('Phone: +255 718 909 222'),
        bullet('Website: maishaprojects.org'),
        bullet('GitHub: github.com/ernestmoyo/maisha_kazi'),
        spacer(),
        divider(),
        spacer(),
        new Paragraph({
          children: [
            new TextRun({ text: 'Maisha Community Initiatives  \u2022  maishaprojects.org', size: 18, color: '78716C', italics: true }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Maisha Kazi \u2014 Project Rationale v1.0  \u2014  March 2026', size: 18, color: AMBER }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    },
  ],
});

// ─── Write to file ───────────────────────────────────────────────────────────
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('Maisha_Kazi_Project_Rationale_v1.0.docx', buffer);
  console.log('\u2713  Maisha_Kazi_Project_Rationale_v1.0.docx created successfully');
});
