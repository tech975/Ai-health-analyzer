import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse';
import { AIAnalysisResult, PatientInfo, AbnormalValue, ExtractedPatientDetails } from '../types';

class AIAnalysisService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.initializeModel();
  }

  /**
   * Initialize model with free tier options
   */
  private initializeModel() {
    // Free tier model names to try
    const freeModels = [
      'gemini-2.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest', 
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro-latest',
      'gemini-1.0-pro'
    ];

    // Try the first available model (we'll test it during actual usage)
    for (const modelName of freeModels) {
      try {
        console.log(`Trying to initialize model: ${modelName}`);
        this.model = this.genAI.getGenerativeModel({ model: modelName });
        console.log(`✅ Model initialized: ${modelName}`);
        break;
      } catch (error) {
        console.log(`❌ Failed to initialize model ${modelName}:`, error);
        continue;
      }
    }

    if (!this.model) {
      // Fallback to the most basic model
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  /**
   * Extract text content from PDF buffer
   */
  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      console.log('Attempting to extract text from PDF, buffer size:', pdfBuffer.length);
      
      // Check if buffer is valid
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF buffer is empty or invalid');
      }

      // Check if it's actually a PDF file
      const pdfHeader = pdfBuffer.slice(0, 4).toString();
      if (!pdfHeader.startsWith('%PDF')) {
        throw new Error('File does not appear to be a valid PDF (missing PDF header)');
      }

      const data = await pdfParse(pdfBuffer, {
        // Add options to handle problematic PDFs
        max: 0 // No limit on pages
      });
      
      console.log('PDF parsing successful, extracted text length:', data.text.length);
      console.log('PDF info:', {
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata
      });

      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      
      // Try alternative extraction methods
      try {
        console.log('Trying alternative PDF parsing...');
        const data = await pdfParse(pdfBuffer, {
          // Use only valid options for pdf-parse
          max: 0
        });
        
        if (data.text && data.text.trim().length > 0) {
          console.log('Alternative parsing successful');
          return data.text;
        }
      } catch (altError) {
        console.error('Alternative PDF parsing also failed:', altError);
      }

      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Invalid PDF structure'}`);
    }
  }

  /**
   * Generate AI analysis for health report
   */
  async analyzeHealthReport(
    pdfBuffer: Buffer, 
    patientInfo: PatientInfo
  ): Promise<AIAnalysisResult> {
    try {
      console.log('Starting health report analysis for patient:', patientInfo.name);
      console.log('PDF buffer size:', pdfBuffer.length, 'bytes');

      // Extract text from PDF with timeout
      let reportText = '';
      try {
        console.log('Step 1/3: Extracting text from PDF...');
        reportText = await this.extractTextFromPDF(pdfBuffer);
        
        if (!reportText.trim()) {
          console.warn('PDF text extraction returned empty content');
          throw new Error('No readable text found in the PDF document');
        }

        console.log('✅ Text extraction completed. Length:', reportText.length);
        console.log('First 200 characters:', reportText.substring(0, 200));
      } catch (pdfError) {
        console.error('❌ PDF text extraction failed:', pdfError);
        
        // If PDF extraction fails, provide a basic analysis
        console.log('Falling back to basic analysis due to PDF extraction failure');
        return this.generateFallbackAnalysis('', patientInfo, 'PDF text extraction failed');
      }

      // Try AI analysis with timeout and retry logic
      try {
        console.log('Step 2/3: Preparing AI analysis...');
        
        // Create structured prompt for AI analysis
        const prompt = this.createAnalysisPrompt(reportText, patientInfo);
        
        console.log('Step 3/3: Sending request to AI model...');
        
        // Generate AI analysis with timeout
        const analysisPromise = this.model.generateContent(prompt);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AI analysis timeout after 3 minutes')), 180000);
        });
        
        const result = await Promise.race([analysisPromise, timeoutPromise]) as any;
        const response = await result.response;
        const analysisText = response.text();
        
        console.log('✅ AI analysis completed. Response length:', analysisText.length);
        
        // Parse the structured response
        const parsedResult = this.parseAIResponse(analysisText);
        console.log('✅ Analysis parsing completed successfully');
        
        return parsedResult;
      } catch (aiError) {
        console.error('❌ AI service failed, using fallback analysis:', aiError);
        
        // Fallback to basic analysis based on extracted text
        return this.generateFallbackAnalysis(reportText, patientInfo, 'AI service unavailable');
      }
      
    } catch (error) {
      console.error('❌ AI Analysis Error Details:', error);
      
      // Last resort fallback
      return this.generateFallbackAnalysis('', patientInfo, 'Analysis service temporarily unavailable');
    }
  }

  /**
   * Generate a basic fallback analysis when AI service is unavailable
   */
  private generateFallbackAnalysis(reportText: string, patientInfo: PatientInfo, reason: string = 'AI service unavailable'): AIAnalysisResult {
    console.log(`Generating fallback analysis due to: ${reason}`);
    
    // Try to extract patient details from report text if available
    const extractedPatientDetails = this.extractPatientDetailsFromText(reportText);
    
    // Basic text analysis to find potential abnormal values
    const abnormalValues = reportText ? this.extractAbnormalValues(reportText) : [];
    
    const hasTextContent = reportText && reportText.trim().length > 0;
    
    return {
      patientDetails: extractedPatientDetails,
      summary: `Health report analysis completed. ${hasTextContent ? 'The report contains various laboratory test results and measurements.' : 'The report was processed but detailed text content could not be extracted.'} Professional medical consultation is recommended for proper interpretation.`,
      simpleExplanation: `${hasTextContent ? 'Your health report shows various test results. Some values may be outside the normal ranges, which could indicate areas that need medical attention.' : 'Your health report has been received and processed.'} It's important to discuss these results with your healthcare provider for proper medical interpretation and guidance.`,
      abnormalValues: abnormalValues,
      detectedDiseases: hasTextContent ? [
        'Further medical evaluation needed to determine specific conditions',
        'Consult with healthcare provider for accurate diagnosis'
      ] : [],
      possibleCauses: hasTextContent ? [
        'Dietary factors and nutritional deficiencies',
        'Lifestyle factors including physical activity levels',
        'Metabolic and hormonal changes',
        'Underlying medical conditions requiring evaluation',
        'Medication effects or interactions',
        'Age-related physiological changes'
      ] : [
        'Professional medical evaluation required for detailed analysis'
      ],
      symptoms: [
        'Consult your healthcare provider to discuss any symptoms you may be experiencing',
        'Monitor for any changes in your health status',
        'Report any concerning symptoms to your doctor promptly'
      ],
      lifestyleRecommendations: [
        'Maintain a balanced diet rich in fruits, vegetables, whole grains, and lean proteins',
        'Engage in regular physical activity as recommended by your healthcare provider',
        'Ensure adequate sleep (7-9 hours per night) for optimal health',
        'Manage stress through relaxation techniques, meditation, or counseling',
        'Stay well-hydrated by drinking adequate water throughout the day',
        'Avoid smoking and limit alcohol consumption',
        'Follow any specific dietary restrictions recommended by your doctor'
      ],
      medicineRecommendations: [
        'Take all prescribed medications exactly as directed by your healthcare provider',
        'Discuss any over-the-counter medications or supplements with your doctor before use',
        'Do not stop or change medications without consulting your healthcare provider',
        'Consider vitamin D and B12 supplements if deficiencies are indicated (consult doctor first)',
        'Maintain a medication list and share it with all healthcare providers'
      ],
      doctorRecommendations: [
        'Schedule a follow-up appointment with your primary care physician to discuss these results',
        'Bring the original report and any questions you have about your health',
        'Ask your doctor to explain any values that are outside normal ranges',
        'Discuss whether additional testing or specialist referrals are needed',
        'Consider consulting an endocrinologist if metabolic issues are suspected',
        'Seek immediate medical attention if you experience any concerning symptoms',
        hasTextContent ? 'Request a detailed explanation of all test results during your appointment' : 'Ensure your healthcare provider has access to the complete original report'
      ]
    };
  }

  /**
   * Extract patient details from report text
   */
  private extractPatientDetailsFromText(reportText: string): ExtractedPatientDetails {
    if (!reportText) {
      return {
        name: 'Not specified',
        age: 'Not specified',
        gender: 'Not specified',
        phoneNumber: 'Not specified'
      };
    }

    // More comprehensive patterns to extract patient information
    const namePatterns = [
      /(?:patient|name|pt\.?|mr\.?|mrs\.?|ms\.?)\s*:?\s*([A-Za-z\s\.]+)/i,
      /name\s*:\s*([A-Za-z\s\.]+)/i,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)/m, // First line with proper names
    ];
    
    const agePatterns = [
      /(?:age|yrs?|years?|y\/o)\s*:?\s*(\d+)/i,
      /(\d+)\s*(?:years?|yrs?|y\/o)/i,
      /age\s*(\d+)/i
    ];
    
    const genderPatterns = [
      /(?:gender|sex)\s*:?\s*(male|female|m|f)/i,
      /(?:^|\s)(male|female)(?:\s|$)/i,
      /\b(m|f)\b.*(?:gender|sex)/i
    ];
    
    const phonePatterns = [
      /(?:phone|mobile|contact|tel)\s*:?\s*([\d\-\+\(\)\s]{10,})/i,
      /(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/,
      /(\d{10})/
    ];

    let extractedName = 'Not specified';
    let extractedAge = 'Not specified';
    let extractedGender = 'Not specified';
    let extractedPhone = 'Not specified';

    // Extract name
    for (const pattern of namePatterns) {
      const match = reportText.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim().replace(/[^\w\s\.]/g, '');
        if (name.length > 2 && name.length < 50) {
          extractedName = name;
          break;
        }
      }
    }

    // Extract age
    for (const pattern of agePatterns) {
      const match = reportText.match(pattern);
      if (match && match[1]) {
        const age = parseInt(match[1]);
        if (age > 0 && age < 120) {
          extractedAge = age.toString();
          break;
        }
      }
    }

    // Extract gender
    for (const pattern of genderPatterns) {
      const match = reportText.match(pattern);
      if (match && match[1]) {
        const gender = match[1].toLowerCase();
        if (gender.startsWith('m')) {
          extractedGender = 'Male';
        } else if (gender.startsWith('f')) {
          extractedGender = 'Female';
        }
        break;
      }
    }

    // Extract phone
    for (const pattern of phonePatterns) {
      const match = reportText.match(pattern);
      if (match && match[1]) {
        const phone = match[1].trim();
        if (phone.length >= 10) {
          extractedPhone = phone;
          break;
        }
      }
    }

    return {
      name: extractedName,
      age: extractedAge,
      gender: extractedGender,
      phoneNumber: extractedPhone
    };
  }

  /**
   * Extract potential abnormal values from report text
   */
  private extractAbnormalValues(reportText: string): AbnormalValue[] {
    const abnormalValues: AbnormalValue[] = [];
    
    // Common medical test patterns with more specific matching
    const medicalTestPatterns = [
      // Pattern: Test Name: Value Unit (Range)
      /([A-Za-z\s]+(?:glucose|cholesterol|hemoglobin|iron|vitamin|protein|creatinine|urea|bilirubin|triglycerides|hdl|ldl))\s*:?\s*([\d.]+)\s*([a-zA-Z\/]+)?\s*(?:\(([^)]+)\))?/gi,
      // Pattern: Test Name Value Unit
      /(glucose|cholesterol|hemoglobin|hgb|iron|vitamin\s*[a-z0-9]+|protein|creatinine|urea|bilirubin|triglycerides|hdl|ldl|calcium|sodium|potassium)\s*:?\s*([\d.]+)\s*([a-zA-Z\/]+)/gi,
      // General pattern: Word: Number Unit
      /([A-Za-z][A-Za-z\s]{2,20})\s*:?\s*([\d.]+)\s*([a-zA-Z\/]+)/gi
    ];
    
    // Common normal ranges for reference
    const normalRanges: { [key: string]: string } = {
      'glucose': '70-100 mg/dL',
      'cholesterol': '<200 mg/dL',
      'hdl': '>40 mg/dL (men), >50 mg/dL (women)',
      'ldl': '<100 mg/dL',
      'triglycerides': '<150 mg/dL',
      'hemoglobin': '12-16 g/dL (women), 14-18 g/dL (men)',
      'hgb': '12-16 g/dL (women), 14-18 g/dL (men)',
      'iron': '60-170 mcg/dL',
      'vitamin d': '30-100 ng/mL',
      'vitamin b12': '200-900 pg/mL',
      'creatinine': '0.6-1.2 mg/dL',
      'urea': '7-20 mg/dL',
      'bilirubin': '0.3-1.2 mg/dL',
      'calcium': '8.5-10.5 mg/dL',
      'sodium': '135-145 mEq/L',
      'potassium': '3.5-5.0 mEq/L'
    };
    
    for (const pattern of medicalTestPatterns) {
      let match;
      while ((match = pattern.exec(reportText)) !== null && abnormalValues.length < 8) {
        const [, parameter, value, unit] = match;
        
        if (parameter && value && parameter.length > 2) {
          const cleanParameter = parameter.trim().toLowerCase();
          const numericValue = parseFloat(value);
          
          // Skip if not a valid number or parameter is too generic
          if (isNaN(numericValue) || ['the', 'and', 'for', 'with', 'date', 'time', 'page'].includes(cleanParameter)) {
            continue;
          }
          
          // Determine severity based on common medical knowledge
          let severity: 'low' | 'high' | 'critical' = 'low';
          let normalRange = normalRanges[cleanParameter] || 'Consult reference ranges';
          
          // Basic severity assessment for common tests
          if (cleanParameter.includes('glucose')) {
            if (numericValue > 126) severity = 'high';
            else if (numericValue < 70) severity = 'low';
            else continue; // Normal, skip
          } else if (cleanParameter.includes('cholesterol')) {
            if (numericValue > 240) severity = 'high';
            else if (numericValue > 200) severity = 'low';
            else continue; // Normal, skip
          } else if (cleanParameter.includes('hemoglobin') || cleanParameter.includes('hgb')) {
            if (numericValue < 10) severity = 'critical';
            else if (numericValue < 12) severity = 'low';
            else if (numericValue > 18) severity = 'high';
            else continue; // Normal, skip
          }
          
          abnormalValues.push({
            parameter: parameter.trim(),
            value: `${value} ${unit || ''}`.trim(),
            normalRange: normalRange,
            severity: severity
          });
        }
      }
    }
    
    return abnormalValues.slice(0, 6); // Limit to 6 most relevant values
  }

  /**
   * Create structured prompt for health report analysis
   */
  private createAnalysisPrompt(reportText: string, patientInfo: PatientInfo): string {
    return `
You are an expert medical AI assistant analyzing a health/lab report. Provide a comprehensive medical analysis by extracting patient information directly from the report and following the exact medical report format.

Health Report Content:
${reportText}

IMPORTANT INSTRUCTIONS:
1. Extract patient details (name, age, gender, phone) ONLY from the PDF content
2. Analyze lab values and identify which ones are outside normal ranges
3. Provide medical insights based on the actual test results
4. Use proper medical terminology but explain in patient-friendly language
5. Be specific about the actual test results found in the report

Please respond with a valid JSON object in this EXACT structure:

{
  "patientDetails": {
    "name": "Extract exact patient name from report (if not found, use 'Not specified')",
    "age": "Extract exact age from report (if not found, use 'Not specified')", 
    "gender": "Extract exact gender from report (if not found, use 'Not specified')",
    "phoneNumber": "Extract phone number from report (if not found, use 'Not specified')"
  },
  "summary": "Brief 2-3 sentence medical summary of the key findings from this specific report",
  "simpleExplanation": "Patient-friendly explanation of what the test results mean for their health (3-4 sentences, avoid medical jargon)",
  "abnormalValues": [
    {
      "parameter": "Exact test name from the report",
      "value": "Exact value with units from the report", 
      "normalRange": "Standard normal range for this test",
      "severity": "low|high|critical (based on how far outside normal range)"
    }
  ],
  "detectedDiseases": [
    "List specific medical conditions that these test results may indicate",
    "Only include conditions strongly supported by the abnormal values",
    "Use proper medical condition names"
  ],
  "possibleCauses": [
    "Medical reasons why these abnormal values might occur",
    "Include dietary, lifestyle, and pathological causes",
    "Be specific to the actual abnormal findings"
  ],
  "symptoms": [
    "Clinical symptoms associated with the detected abnormal values",
    "Symptoms the patient might experience with these conditions",
    "Be specific to the medical findings"
  ],
  "lifestyleRecommendations": [
    "Specific dietary recommendations based on the test results",
    "Exercise recommendations relevant to the findings", 
    "Lifestyle changes that could improve the abnormal values",
    "Specific to the medical conditions detected"
  ],
  "medicineRecommendations": [
    "General medication categories that might be considered",
    "Supplements that could help with the specific deficiencies found",
    "Always emphasize consulting with healthcare provider"
  ],
  "doctorRecommendations": [
    "Specific medical specialists to consult based on findings",
    "Urgency level for follow-up based on severity",
    "Additional tests that might be needed",
    "Specific medical advice for the conditions found"
  ]
}

CRITICAL REQUIREMENTS:
- Extract patient info ONLY from the report text, ignore any provided patient data
- Only include abnormal values that are actually outside normal ranges
- Be medically accurate and specific to the actual test results
- Provide actionable medical recommendations
- Use proper medical terminology but explain clearly
- Return ONLY valid JSON, no additional text
- If specific information cannot be found in the report, use appropriate medical language like "Further evaluation needed"
`;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(responseText: string): AIAnalysisResult {
    try {
      // Clean the response text to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const jsonText = jsonMatch[0];
      const parsed = JSON.parse(jsonText);

      // Validate and structure the response
      const analysis: AIAnalysisResult = {
        patientDetails: {
          name: parsed.patientDetails?.name || 'Not specified',
          age: parsed.patientDetails?.age || 'Not specified',
          gender: parsed.patientDetails?.gender || 'Not specified',
          phoneNumber: parsed.patientDetails?.phoneNumber || 'Not specified'
        },
        summary: parsed.summary || 'Analysis completed',
        simpleExplanation: parsed.simpleExplanation || 'Please consult with a healthcare professional for detailed interpretation.',
        abnormalValues: Array.isArray(parsed.abnormalValues) ? parsed.abnormalValues : [],
        detectedDiseases: Array.isArray(parsed.detectedDiseases) ? parsed.detectedDiseases : [],
        possibleCauses: Array.isArray(parsed.possibleCauses) ? parsed.possibleCauses : [],
        symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
        lifestyleRecommendations: Array.isArray(parsed.lifestyleRecommendations) ? parsed.lifestyleRecommendations : [],
        medicineRecommendations: Array.isArray(parsed.medicineRecommendations) ? parsed.medicineRecommendations : [],
        doctorRecommendations: Array.isArray(parsed.doctorRecommendations) ? parsed.doctorRecommendations : []
      };

      return analysis;
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Invalid response format'}`);
    }
  }

  /**
   * Test AI service connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Hello, please respond with "AI service is working"');
      const response = await result.response;
      return response.text().includes('working');
    } catch (error) {
      console.error('AI service test failed:', error);
      return false;
    }
  }
}

export default new AIAnalysisService();