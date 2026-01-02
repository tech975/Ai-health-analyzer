import puppeteer from 'puppeteer';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType } from 'docx';
import fs from 'fs';
import path from 'path';
import { IReport } from '../models/Report';

export class DocumentGenerationService {
  
  /**
   * Generate PDF from HTML content
   */
  async generatePDF(report: IReport): Promise<Buffer> {
    const htmlContent = this.generateHTMLContent(report);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false
      });
      
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate Word document - Matches ReportViewer exactly
   */
  async generateWord(report: IReport): Promise<Buffer> {
    const patientDetails = report.analysis.patientDetails || {
      name: report.patientInfo.name,
      age: report.patientInfo.age.toString(),
      gender: report.patientInfo.gender,
      phoneNumber: report.patientInfo.phoneNumber
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch
              right: 720,  // 0.5 inch
              bottom: 720, // 0.5 inch
              left: 720,   // 0.5 inch
            },
          },
        },
        children: [
          // Header - Ultra Compact
          new Paragraph({
            text: "Health Report Summary",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 }
          }),
          new Paragraph({
            text: formatDate(report.createdAt.toString()),
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 }
          }),

          // Patient Details - Ultra Compact Inline
          new Paragraph({
            children: [
              new TextRun({ 
                text: `${patientDetails.name} • ${patientDetails.age}y • ${patientDetails.gender.charAt(0).toUpperCase() + patientDetails.gender.slice(1)}`,
                bold: true,
                size: 24
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            shading: {
              fill: "F3F4F6"
            }
          }),

          // 1. Explanation - Ultra Compact
          new Paragraph({
            text: "1. Explanation",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 120, after: 120 }
          }),
          ...report.analysis.simpleExplanation.split('.').filter(sentence => sentence.trim()).slice(0, 3).map((sentence, index) => 
            new Paragraph({
              children: [
                new TextRun({ text: `${index + 1}. `, bold: true }),
                new TextRun({ text: sentence.trim() + '.', bold: true })
              ],
              spacing: { after: 60 }
            })
          ),

          // 2. Abnormal Values - Ultra Compact
          ...(report.analysis.abnormalValues && report.analysis.abnormalValues.length > 0 ? [
            new Paragraph({
              text: "2. Abnormal Values",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 240, after: 120 }
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ 
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "Test", bold: true, color: "FFFFFF" })] 
                      })],
                      shading: { fill: "DC2626" }
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "Value", bold: true, color: "FFFFFF" })] 
                      })],
                      shading: { fill: "DC2626" }
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "Normal", bold: true, color: "FFFFFF" })] 
                      })],
                      shading: { fill: "DC2626" }
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "Status", bold: true, color: "FFFFFF" })] 
                      })],
                      shading: { fill: "DC2626" }
                    })
                  ]
                }),
                ...report.analysis.abnormalValues.slice(0, 3).map(value => 
                  new TableRow({
                    children: [
                      new TableCell({ 
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: value.parameter, bold: true })] 
                        })]
                      }),
                      new TableCell({ 
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: value.value, bold: true, color: "B91C1C" })] 
                        })]
                      }),
                      new TableCell({ 
                        children: [new Paragraph(value.normalRange)]
                      }),
                      new TableCell({ 
                        children: [new Paragraph({ 
                          children: [new TextRun({ 
                            text: value.severity === 'critical' ? 'CRIT' :
                                  value.severity === 'high' ? 'HIGH' :
                                  value.severity === 'low' ? 'LOW' : 'NORM',
                            bold: true,
                            color: value.severity === 'critical' ? 'FFFFFF' :
                                   value.severity === 'high' ? 'FFFFFF' :
                                   value.severity === 'low' ? '000000' : 'FFFFFF'
                          })] 
                        })]
                      })
                    ]
                  })
                )
              ]
            })
          ] : []),

          // 3. Diseases - Ultra Compact
          ...(report.analysis.detectedDiseases && report.analysis.detectedDiseases.length > 0 ? [
            new Paragraph({
              text: "3. Diseases",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 240, after: 120 }
            }),
            ...report.analysis.detectedDiseases.slice(0, 3).map((disease, index) => 
              new Paragraph({
                children: [
                  new TextRun({ text: `${index + 1}. `, bold: true }),
                  new TextRun({ text: disease, bold: true })
                ],
                spacing: { after: 60 }
              })
            )
          ] : []),

          // 4. Causes - Ultra Compact
          ...(report.analysis.possibleCauses && report.analysis.possibleCauses.length > 0 ? [
            new Paragraph({
              text: "4. Causes",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 240, after: 120 }
            }),
            ...report.analysis.possibleCauses.slice(0, 3).map((cause, index) => 
              new Paragraph({
                children: [
                  new TextRun({ text: `${index + 1}. `, bold: true }),
                  new TextRun({ text: cause, bold: true })
                ],
                spacing: { after: 60 }
              })
            )
          ] : []),

          // 5. Symptoms - Ultra Compact
          ...(report.analysis.symptoms && report.analysis.symptoms.length > 0 ? [
            new Paragraph({
              text: "5. Symptoms",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 240, after: 120 }
            }),
            ...report.analysis.symptoms.slice(0, 3).map((symptom, index) => 
              new Paragraph({
                children: [
                  new TextRun({ text: `${index + 1}. `, bold: true }),
                  new TextRun({ text: symptom, bold: true })
                ],
                spacing: { after: 60 }
              })
            )
          ] : []),

          // 6. Lifestyle - Ultra Compact
          ...(report.analysis.lifestyleRecommendations && report.analysis.lifestyleRecommendations.length > 0 ? [
            new Paragraph({
              text: "6. Lifestyle",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 240, after: 120 }
            }),
            ...report.analysis.lifestyleRecommendations.slice(0, 2).map((recommendation, index) => 
              new Paragraph({
                children: [
                  new TextRun({ text: `${index + 1}. `, bold: true }),
                  new TextRun({ text: recommendation, bold: true })
                ],
                spacing: { after: 60 }
              })
            )
          ] : []),

          // 7. Medicines - Ultra Compact
          new Paragraph({
            text: "7. Medicines",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 }
          }),

          // Medicine Recommendations
          ...(report.analysis.medicineRecommendations && report.analysis.medicineRecommendations.length > 0 ? 
            report.analysis.medicineRecommendations.slice(0, 3).map((medicine, index) => 
              new Paragraph({
                children: [
                  new TextRun({ text: `${index + 1}. `, bold: true }),
                  new TextRun({ text: medicine, bold: true })
                ],
                spacing: { after: 60 }
              })
            ) : []
          ),

          // Doctor Recommendations - Ultra Compact
          ...(report.analysis.doctorRecommendations && report.analysis.doctorRecommendations.length > 0 ? [
            new Paragraph({
              children: [new TextRun({ text: "Doctor:", bold: true })],
              spacing: { before: 120, after: 60 }
            }),
            ...report.analysis.doctorRecommendations.slice(0, 1).map(recommendation => 
              new Paragraph({
                children: [new TextRun({ text: recommendation, bold: true })],
                spacing: { after: 60 }
              })
            )
          ] : [])
        ]
      }]
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Generate HTML content for PDF - Matches ReportViewer exactly
   */
  private generateHTMLContent(report: IReport): string {
    const patientDetails = report.analysis.patientDetails || {
      name: report.patientInfo.name,
      age: report.patientInfo.age.toString(),
      gender: report.patientInfo.gender,
      phoneNumber: report.patientInfo.phoneNumber
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    // Helper function to get severity badge styling
    const getSeverityBadge = (severity: string) => {
      const badges = {
        'critical': { bg: '#dc2626', text: 'white', label: 'CRIT' },
        'high': { bg: '#f97316', text: 'white', label: 'HIGH' },
        'low': { bg: '#eab308', text: 'black', label: 'LOW' },
        'normal': { bg: '#6b7280', text: 'white', label: 'NORM' }
      };
      const badge = badges[severity as keyof typeof badges] || badges.normal;
      return `<span style="background-color: ${badge.bg}; color: ${badge.text}; padding: 2px 4px; border-radius: 2px; font-size: 10px; font-weight: bold;">${badge.label}</span>`;
    };

    // Helper function to create numbered bullet points
    const createNumberedBullet = (index: number, color: string) => {
      return `<span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; color: white; font-weight: bold; border-radius: 50%; text-align: center; line-height: 10px; font-size: 7px; margin-right: 3px; flex-shrink: 0; margin-top: 1px;">${index + 1}</span>`;
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Health Report Summary</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: white;
            color: #111827;
            line-height: 1.1;
            font-size: 10px;
            max-width: 800px;
            margin: 0 auto;
            padding: 6px;
            height: 100vh;
            overflow: hidden;
        }

        .report-container {
            background-color: white;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 6px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            height: calc(100vh - 12px);
            overflow: hidden;
        }

        /* Header - Ultra Compact */
        .header {
            text-align: center;
            margin-bottom: 8px;
        }

        .header h1 {
            font-size: 16px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 1px;
        }

        .header .date {
            font-size: 10px;
            color: #6b7280;
        }

        /* Patient Details - Ultra Compact Inline */
        .patient-details {
            margin-bottom: 6px;
            background-color: #f3f4f6;
            padding: 3px;
            border-radius: 2px;
            text-align: center;
            font-size: 10px;
        }

        .patient-details .name {
            font-weight: bold;
        }

        .patient-details .separator {
            margin: 0 4px;
        }

        /* Section Styling */
        .section {
            margin-bottom: 6px;
        }

        .section-header {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 3px;
            padding-bottom: 1px;
        }

        .section-content {
            padding: 3px;
            border-radius: 2px;
        }

        /* 1. Explanation */
        .explanation .section-header {
            color: #1e3a8a;
            border-bottom: 1px solid #bfdbfe;
        }

        .explanation .section-content {
            background-color: #eff6ff;
        }

        .explanation-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 1px;
            font-size: 10px;
            color: #1f2937;
            font-weight: bold;
            line-height: 1.1;
        }

        /* 2. Abnormal Values */
        .abnormal-values .section-header {
            color: #7f1d1d;
            border-bottom: 1px solid #fecaca;
        }

        .abnormal-values .section-content {
            background-color: #fef2f2;
        }

        .abnormal-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            background-color: white;
        }

        .abnormal-table th {
            background-color: #dc2626;
            color: white;
            border: 1px solid #000;
            padding: 1px 3px;
            text-align: left;
            font-weight: bold;
            font-size: 10px;
        }

        .abnormal-table td {
            border: 1px solid #000;
            padding: 1px 3px;
            font-size: 10px;
        }

        .abnormal-table .value-cell {
            font-weight: bold;
            color: #b91c1c;
        }

        .abnormal-table .parameter-cell {
            font-weight: 500;
        }

        /* 3. Diseases */
        .diseases .section-header {
            color: #9a3412;
            border-bottom: 1px solid #fed7aa;
        }

        .diseases .section-content {
            background-color: #fff7ed;
        }

        .disease-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 1px;
            font-size: 10px;
            color: #1f2937;
            font-weight: bold;
            line-height: 1.1;
        }

        /* 4. Causes */
        .causes .section-header {
            color: #581c87;
            border-bottom: 1px solid #e9d5ff;
        }

        .causes .section-content {
            background-color: #faf5ff;
        }

        .cause-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 1px;
            font-size: 10px;
            color: #1f2937;
            font-weight: bold;
            line-height: 1.1;
        }

        /* 5. Symptoms */
        .symptoms .section-header {
            color: #831843;
            border-bottom: 1px solid #fbcfe8;
        }

        .symptoms .section-content {
            background-color: #fdf2f8;
        }

        .symptom-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 1px;
            font-size: 10px;
            color: #1f2937;
            font-weight: bold;
            line-height: 1.1;
        }

        /* 6. Lifestyle */
        .lifestyle .section-header {
            color: #14532d;
            border-bottom: 1px solid #bbf7d0;
        }

        .lifestyle .section-content {
            background-color: #f0fdf4;
        }

        .lifestyle-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 1px;
            font-size: 10px;
            color: #1f2937;
            font-weight: bold;
            line-height: 1.1;
        }

        /* 7. Medicines */
        .medicines .section-header {
            color: #312e81;
            border-bottom: 1px solid #c7d2fe;
        }

        .medicines .section-content {
            background-color: #eef2ff;
        }

        .medicine-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 1px;
            font-size: 10px;
            color: #1f2937;
            font-weight: bold;
            line-height: 1.1;
        }

        .doctor-section {
            margin-top: 3px;
            padding-top: 3px;
            border-top: 1px solid #c7d2fe;
        }

        .doctor-header {
            font-size: 10px;
            font-weight: bold;
            color: #3730a3;
            margin-bottom: 1px;
        }

        .doctor-item {
            font-size: 10px;
            color: #374151;
            font-weight: bold;
            line-height: 1.1;
        }

        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header - Ultra Compact -->
        <div class="header">
            <h1>Health Report Summary</h1>
            <p class="date">${formatDate(report.createdAt.toString())}</p>
        </div>

        <!-- Patient Details - Ultra Compact Inline -->
        <div class="patient-details">
            <span class="name">${patientDetails.name}</span>
            <span class="separator">•</span>
            <span class="name">${patientDetails.age}y</span>
            <span class="separator">•</span>
            <span class="name">${patientDetails.gender.charAt(0).toUpperCase() + patientDetails.gender.slice(1)}</span>
        </div>

        <!-- 1. Explanation - Ultra Compact -->
        <div class="section explanation">
            <div class="section-header">1. Explanation</div>
            <div class="section-content">
                ${report.analysis.simpleExplanation.split('.').filter(sentence => sentence.trim()).slice(0, 3).map((sentence, index) => `
                    <div class="explanation-item">
                        ${createNumberedBullet(index, '#2563eb')}
                        <span>${sentence.trim()}.</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- 2. Abnormal Values - Ultra Compact -->
        ${report.analysis.abnormalValues && report.analysis.abnormalValues.length > 0 ? `
        <div class="section abnormal-values">
            <div class="section-header">2. Abnormal Values</div>
            <div class="section-content">
                <table class="abnormal-table">
                    <thead>
                        <tr>
                            <th>Test</th>
                            <th>Value</th>
                            <th>Normal</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.analysis.abnormalValues.slice(0, 3).map(value => `
                        <tr>
                            <td class="parameter-cell">${value.parameter}</td>
                            <td class="value-cell">${value.value}</td>
                            <td>${value.normalRange}</td>
                            <td>${getSeverityBadge(value.severity)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}

        <!-- 3. Diseases - Ultra Compact -->
        ${report.analysis.detectedDiseases && report.analysis.detectedDiseases.length > 0 ? `
        <div class="section diseases">
            <div class="section-header">3. Diseases</div>
            <div class="section-content">
                ${report.analysis.detectedDiseases.slice(0, 3).map((disease, index) => `
                    <div class="disease-item">
                        ${createNumberedBullet(index, '#ea580c')}
                        <span>${disease}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- 4. Causes - Ultra Compact -->
        ${report.analysis.possibleCauses && report.analysis.possibleCauses.length > 0 ? `
        <div class="section causes">
            <div class="section-header">4. Causes</div>
            <div class="section-content">
                ${report.analysis.possibleCauses.slice(0, 3).map((cause, index) => `
                    <div class="cause-item">
                        ${createNumberedBullet(index, '#7c3aed')}
                        <span>${cause}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- 5. Symptoms - Ultra Compact -->
        ${report.analysis.symptoms && report.analysis.symptoms.length > 0 ? `
        <div class="section symptoms">
            <div class="section-header">5. Symptoms</div>
            <div class="section-content">
                ${report.analysis.symptoms.slice(0, 3).map((symptom, index) => `
                    <div class="symptom-item">
                        ${createNumberedBullet(index, '#db2777')}
                        <span>${symptom}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- 6. Lifestyle - Ultra Compact -->
        ${report.analysis.lifestyleRecommendations && report.analysis.lifestyleRecommendations.length > 0 ? `
        <div class="section lifestyle">
            <div class="section-header">6. Lifestyle</div>
            <div class="section-content">
                ${report.analysis.lifestyleRecommendations.slice(0, 2).map((recommendation, index) => `
                    <div class="lifestyle-item">
                        ${createNumberedBullet(index, '#16a34a')}
                        <span>${recommendation}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- 7. Medicines - Ultra Compact -->
        <div class="section medicines">
            <div class="section-header">7. Medicines</div>
            <div class="section-content">
                <!-- Medicine Recommendations -->
                ${report.analysis.medicineRecommendations && report.analysis.medicineRecommendations.length > 0 ? `
                    ${report.analysis.medicineRecommendations.slice(0, 3).map((medicine, index) => `
                        <div class="medicine-item">
                            ${createNumberedBullet(index, '#4f46e5')}
                            <span>${medicine}</span>
                        </div>
                    `).join('')}
                ` : ''}

                <!-- Doctor Recommendations - Ultra Compact -->
                ${report.analysis.doctorRecommendations && report.analysis.doctorRecommendations.length > 0 ? `
                <div class="doctor-section">
                    <div class="doctor-header">Doctor:</div>
                    ${report.analysis.doctorRecommendations.slice(0, 1).map(recommendation => `
                        <div class="doctor-item">${recommendation}</div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }
}

export default new DocumentGenerationService();