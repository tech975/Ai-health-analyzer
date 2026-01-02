import { useState } from 'react';
import { PatientFormData } from '../types';

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void;
  isLoading?: boolean;
}

interface FormErrors {
  name?: string;
  age?: string;
  gender?: string;
  phoneNumber?: string;
}

const PatientForm: React.FC<PatientFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    age: 0,
    gender: 'male',
    phoneNumber: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return 'Name must be at least 2 characters long';
        }
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          return 'Name can only contain letters and spaces';
        }
        break;
      
      case 'age':
        const ageNum = Number(value);
        if (!value || ageNum <= 0) {
          return 'Age is required and must be greater than 0';
        }
        if (ageNum > 150) {
          return 'Age must be less than 150';
        }
        break;
      
      case 'gender':
        if (!value || !['male', 'female', 'other'].includes(value)) {
          return 'Please select a valid gender';
        }
        break;
      
      case 'phoneNumber':
        if (!value || value.trim().length < 10) {
          return 'Phone number must be at least 10 digits';
        }
        if (!/^[\d\s\-\+\(\)]+$/.test(value.trim())) {
          return 'Phone number can only contain digits, spaces, and common symbols';
        }
        break;
      
      default:
        return undefined;
    }
    return undefined;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'age' ? Number(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));

    // Real-time validation
    if (touched[name]) {
      const error = validateField(name, processedValue);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'age' ? Number(value) : value;
    
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, processedValue);
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof PatientFormData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched({
      name: true,
      age: true,
      gender: true,
      phoneNumber: true,
    });

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <legend className="sr-only">Patient Information</legend>
        
        {/* Patient Name */}
        <div className="sm:col-span-2 md:col-span-1">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Patient Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isLoading}
            required
            aria-invalid={errors.name && touched.name ? 'true' : 'false'}
            aria-describedby={errors.name && touched.name ? 'name-error' : undefined}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.name && touched.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter patient's full name"
          />
          {errors.name && touched.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">{errors.name}</p>
          )}
        </div>

        {/* Age */}
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
            Age *
          </label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age || ''}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isLoading}
            min="1"
            max="150"
            required
            aria-invalid={errors.age && touched.age ? 'true' : 'false'}
            aria-describedby={errors.age && touched.age ? 'age-error' : undefined}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.age && touched.age ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter age"
          />
          {errors.age && touched.age && (
            <p id="age-error" className="mt-1 text-sm text-red-600" role="alert">{errors.age}</p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
            Gender *
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isLoading}
            required
            aria-invalid={errors.gender && touched.gender ? 'true' : 'false'}
            aria-describedby={errors.gender && touched.gender ? 'gender-error' : undefined}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.gender && touched.gender ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && touched.gender && (
            <p id="gender-error" className="mt-1 text-sm text-red-600" role="alert">{errors.gender}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="sm:col-span-2 md:col-span-1">
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isLoading}
            required
            aria-invalid={errors.phoneNumber && touched.phoneNumber ? 'true' : 'false'}
            aria-describedby={errors.phoneNumber && touched.phoneNumber ? 'phoneNumber-error' : undefined}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.phoneNumber && touched.phoneNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter phone number"
          />
          {errors.phoneNumber && touched.phoneNumber && (
            <p id="phoneNumber-error" className="mt-1 text-sm text-red-600" role="alert">{errors.phoneNumber}</p>
          )}
        </div>
      </fieldset>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          aria-describedby={isLoading ? 'submit-loading' : undefined}
        >
          {isLoading ? 'Processing...' : 'Continue'}
          {isLoading && <span id="submit-loading" className="sr-only">Form is being processed</span>}
        </button>
      </div>
    </form>
  );
};

export default PatientForm;