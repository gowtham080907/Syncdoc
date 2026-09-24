import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto min-h-[60vh]">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-full text-blue-600 mb-4 shadow-sm">
        <FileQuestion className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">404 - Page Not Found</h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6">
        The document or route you are looking for does not exist or has been moved.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
