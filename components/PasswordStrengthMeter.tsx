import React from 'react';

interface PasswordStrengthIndicator {
  strength: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  color: string;
  percentage: number;
  score: number;
  crackTime: string;
  errors: string[];
  warnings: string[];
}

interface PasswordStrengthMeterProps {
  password: string;
  userInfo?: {
    name?: string;
    email?: string;
    displayName?: string;
  };
  showDetails?: boolean;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ 
  password, 
  userInfo = {}, 
  showDetails = false 
}) => {
  const [strength, setStrength] = React.useState<PasswordStrengthIndicator | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Calculate password strength
  React.useEffect(() => {
    if (!password) {
      setStrength(null);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call or use client-side validation
    const calculateStrength = () => {
      const result = getPasswordStrength(password, userInfo);
      setStrength(result);
      setIsLoading(false);
    };

    // Debounce the calculation
    const timer = setTimeout(calculateStrength, 300);
    return () => clearTimeout(timer);
  }, [password, userInfo]);

  if (!password) {
    return null;
  }

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'very-weak': return 'bg-red-500';
      case 'weak': return 'bg-orange-500';
      case 'fair': return 'bg-yellow-500';
      case 'strong': return 'bg-blue-500';
      case 'very-strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthTextColor = (strength: string) => {
    switch (strength) {
      case 'very-weak': return 'text-red-600';
      case 'weak': return 'text-orange-600';
      case 'fair': return 'text-yellow-600';
      case 'strong': return 'text-blue-600';
      case 'very-strong': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStrengthLabel = (strength: string) => {
    switch (strength) {
      case 'very-weak': return 'Very Weak';
      case 'weak': return 'Weak';
      case 'fair': return 'Fair';
      case 'strong': return 'Strong';
      case 'very-strong': return 'Very Strong';
      default: return '';
    }
  };

  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strength ? getStrengthColor(strength.strength) : 'bg-gray-300'}`}
          style={{ width: `${strength?.percentage || 0}%` }}
        />
      </div>

      {/* Strength Label */}
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${strength ? getStrengthTextColor(strength.strength) : 'text-gray-500'}`}>
          {isLoading ? 'Checking...' : strength ? getStrengthLabel(strength.strength) : ''}
        </span>
        {strength?.crackTime && (
          <span className="text-xs text-gray-500">
            Time to crack: {strength.crackTime}
          </span>
        )}
      </div>

      {/* Detailed Feedback */}
      {showDetails && strength && (strength.errors.length > 0 || strength.warnings.length > 0) && (
        <div className="space-y-2 text-sm">
          {strength.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <h4 className="font-medium text-red-800 mb-1">Requirements:</h4>
              <ul className="list-disc list-inside space-y-1 text-red-700">
                {strength.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {strength.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <h4 className="font-medium text-yellow-800 mb-1">Suggestions:</h4>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                {strength.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Password Requirements Checklist */}
      <div className="text-xs space-y-1">
        <div className={`flex items-center ${password.length >= 12 ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{password.length >= 12 ? '✓' : '○'}</span>
          At least 12 characters
        </div>
        <div className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{/[A-Z]/.test(password) ? '✓' : '○'}</span>
          One uppercase letter
        </div>
        <div className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{/[a-z]/.test(password) ? '✓' : '○'}</span>
          One lowercase letter
        </div>
        <div className={`flex items-center ${/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{/\d/.test(password) ? '✓' : '○'}</span>
          One number
        </div>
        <div className={`flex items-center ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
          <span className="mr-2">{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '✓' : '○'}</span>
          One special character
        </div>
      </div>
    </div>
  );
};

// Client-side password strength calculation (simplified version)
function getPasswordStrength(password: string, userInfo: any): PasswordStrengthIndicator {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic checks
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common and easily guessable');
  }

  // Check for user info
  const lowerPassword = password.toLowerCase();
  if (userInfo.name && lowerPassword.includes(userInfo.name.toLowerCase())) {
    errors.push('Password cannot contain your name');
  }

  if (userInfo.email) {
    const emailParts = userInfo.email.split('@')[0].toLowerCase();
    if (lowerPassword.includes(emailParts)) {
      errors.push('Password cannot contain your email username');
    }
  }

  // Calculate score (simplified)
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  if (password.length >= 16) score++;

  // Determine strength
  let strength: string = 'very-weak';
  let color = 'red';
  let percentage = 0;

  if (score >= 6) {
    strength = 'very-strong';
    color = 'green';
    percentage = 100;
  } else if (score >= 5) {
    strength = 'strong';
    color = 'blue';
    percentage = 80;
  } else if (score >= 4) {
    strength = 'fair';
    color = 'yellow';
    percentage = 60;
  } else if (score >= 3) {
    strength = 'weak';
    color = 'orange';
    percentage = 40;
  } else {
    strength = 'very-weak';
    color = 'red';
    percentage = 20;
  }

  // Add warnings
  if (password.length < 16) {
    warnings.push('Consider using a longer password for better security');
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
    warnings.push('Mix different character types for stronger password');
  }

  return {
    strength: strength as any,
    color,
    percentage,
    score: Math.min(score, 4),
    crackTime: estimateCrackTime(score),
    errors,
    warnings
  };
}

function estimateCrackTime(score: number): string {
  const times = [
    'instantly',
    'minutes',
    'hours',
    'days',
    'years',
    'centuries'
  ];
  return times[Math.min(score, times.length - 1)];
}

export default PasswordStrengthMeter;
