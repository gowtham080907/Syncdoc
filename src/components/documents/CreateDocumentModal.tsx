import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { apiService } from '../../services/api';

export interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      const newDoc = await apiService.createDocument(title, description);
      setTitle('');
      setDescription('');
      onClose();
      navigate(`/documents/${newDoc.id}`);
    } catch (err) {
      console.error('Failed to create document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Collaborative Document">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Document Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. SyncDoc Engine Specification"
            className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of this technical specification..."
            className="w-full bg-slate-950 text-sm text-slate-100 px-3.5 py-2.5 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Create & Open Editor
          </Button>
        </div>
      </form>
    </Modal>
  );
};
