import pdfParse from 'pdf-parse';
import { PatientInfo } from '../types';

class PatientInfoExtractionService {
  /**
   * Extract patient information from PDF text
   */
  extractPatientInfo(pdfText: string): Partial<PatientInfo> {
    const extracted: Partial<PatientInfo> = {};

    // Extract name - look for PatientName pattern
    const namePatterns = [
      /PatientName\s*[:=]?\s*([A-Za-z\s\.]+?)(?:\n|Age|Gender|$)/i,
      /(?:Patient\s*Name|Name)\s*[:=]?\s*([A-Za-z\s\.]+?)(?:\n|Age|Gender|$)/i,
    ];

    for (const pattern of namePatterns) {
      const match = pdfText.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (name.length > 2 && name.length < 100) {
          extracted.name = name;
          break;
        }
      }
    }

    // Extract age and gender from combined format like "34 Y/M" or "34 Y/F"
    const ageGenderPatterns = [
      /Age\s*\/\s*Gender\s*[:=]?\s*(\d{1,3})\s*Y\s*\/\s*([MF])/i,
      /(?:Age|Age\/Gender)\s*[:=]?\s*(\d{1,3})\s*Y\s*\/\s*([MF])/i,
      /(\d{1,3})\s*Y\s*\/\s*([MF])/i,
    ];

    for (const pattern of ageGenderPatterns) {
      const match = pdfText.match(pattern);
      if (match && match[1] && match[2]) {
        const age = parseInt(match[1]);
        if (age > 0 && age < 150) {
          extracted.age = age;
          
          const genderChar = match[2].toUpperCase();
          if (genderChar === 'M') {
            extracted.gender = 'male';
          } else if (genderChar === 'F') {
            extracted.gender = 'female';
          }
          break;
        }
      }
    }

    // Fallback: Extract age separately if combined extraction failed
    if (!extracted.age) {
      const agePatterns = [
        /Age\s*[:=]?\s*(\d{1,3})\s*(?:years?|yrs?|y\.o\.?|Y)?/i,
        /(\d{1,3})\s*(?:years?|yrs?|y\.o\.?|Y)\s*(?:old)?/i,
      ];

      for (const pattern of agePatterns) {
        const match = pdfText.match(pattern);
        if (match && match[1]) {
          const age = parseInt(match[1]);
          if (age > 0 && age < 150) {
            extracted.age = age;
            break;
          }
        }
      }
    }

    // Fallback: Extract gender separately if combined extraction failed
    if (!extracted.gender) {
      const genderPatterns = [
        /Gender\s*[:=]?\s*(Male|Female|M|F|Other)/i,
        /(?:Gender|Sex)\s*[:=]?\s*([MFO])/i,
      ];

      for (const pattern of genderPatterns) {
        const match = pdfText.match(pattern);
        if (match && match[1]) {
          const genderStr = match[1].toLowerCase();
          if (genderStr.startsWith('m')) {
            extracted.gender = 'male';
            break;
          } else if (genderStr.startsWith('f')) {
            extracted.gender = 'female';
            break;
          } else if (genderStr.startsWith('o')) {
            extracted.gender = 'other';
            break;
          }
        }
      }
    }

    return extracted;
  }

  /**
   * Extract text from PDF buffer
   */
  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF buffer is empty or invalid');
      }

      const pdfHeader = pdfBuffer.slice(0, 4).toString();
      if (!pdfHeader.startsWith('%PDF')) {
        throw new Error('File does not appear to be a valid PDF');
      }

      const data = await pdfParse(pdfBuffer, { max: 0 });
      return data.text || '';
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw error;
    }
  }

  /**
   * Extract and parse patient info from PDF
   */
  async extractPatientInfoFromPDF(pdfBuffer: Buffer): Promise<Partial<PatientInfo>> {
    try {
      const pdfText = await this.extractTextFromPDF(pdfBuffer);
      return this.extractPatientInfo(pdfText);
    } catch (error) {
      console.error('Failed to extract patient info from PDF:', error);
      return {};
    }
  }
}

export default new PatientInfoExtractionService();
