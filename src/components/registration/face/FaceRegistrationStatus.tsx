
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const FaceRegistrationStatus: React.FC = () => {
  return (
    <div className="mt-4 text-sm text-muted-foreground">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          سيتم تشفير بيانات وجهك وتخزينها بشكل آمن. سيتم استخدامها فقط للتحكم في الوصول داخل هذا النظام.
        </p>
      </div>
    </div>
  );
};

export default FaceRegistrationStatus;
