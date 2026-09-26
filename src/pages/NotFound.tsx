import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-full text-brand-400 mb-4">
        <FileQuestion className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-100">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 mt-2 mb-6">
        The document or route you are looking for does not exist or has been moved.
      </p>
      <Link to="/">
        <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
