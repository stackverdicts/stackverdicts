'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface EmailStep {
  id: string;
  step_number: number;
  step_name: string;
  subject_line: string;
  html_content: string;
  delay_value: number;
  delay_unit: 'minutes' | 'hours' | 'days' | 'weeks';
  sent_count?: number;
  opened_count?: number;
  clicked_count?: number;
}

interface Sequence {
  id: string;
  sequence_name: string;
  description: string;
  trigger_type: string;
  status: 'active' | 'paused' | 'draft';
  total_enrolled: number;
  steps: EmailStep[];
}

export default function EditSequencePage() {
  const params = useParams();
  const router = useRouter();
  const sequenceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sequence, setSequence] = useState<Sequence | null>(null);

  // Form state
  const [sequenceName, setSequenceName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<string>('manual');
  const [status, setStatus] = useState<'active' | 'paused' | 'draft'>('draft');
  const [steps, setSteps] = useState<EmailStep[]>([]);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  useEffect(() => {
    loadSequence();
  }, [sequenceId]);

  async function loadSequence() {
    try {
      const response = await fetch(`http://localhost:3001/api/email/sequences/${sequenceId}`);
      if (!response.ok) {
        throw new Error('Sequence not found');
      }
      const data = await response.json();
      const seq = data.sequence;

      setSequence(seq);
      setSequenceName(seq.sequence_name);
      setDescription(seq.description || '');
      setTriggerType(seq.trigger_type);
      setStatus(seq.status);
      setSteps(seq.steps || []);

      if (seq.steps?.length > 0) {
        setEditingStepId(seq.steps[0].id);
      }
    } catch (error) {
      console.error('Failed to load sequence:', error);
      alert('Failed to load sequence');
      router.push('/admin/email');
    } finally {
      setLoading(false);
    }
  }

  function addStep() {
    const newStep: EmailStep = {
      id: crypto.randomUUID(),
      step_number: steps.length + 1,
      step_name: `Email ${steps.length + 1}`,
      subject_line: '',
      html_content: '',
      delay_value: steps.length === 0 ? 0 : 3,
      delay_unit: 'days',
    };
    setSteps([...steps, newStep]);
    setEditingStepId(newStep.id);
  }

  function updateStep(id: string, updates: Partial<EmailStep>) {
    setSteps(steps.map(step =>
      step.id === id ? { ...step, ...updates } : step
    ));
  }

  function removeStep(id: string) {
    if (steps.length <= 1) {
      alert('A sequence must have at least one email');
      return;
    }
    setSteps(steps.filter(step => step.id !== id));
    if (editingStepId === id) {
      setEditingStepId(null);
    }
  }

  function moveStep(id: string, direction: 'up' | 'down') {
    const index = steps.findIndex(s => s.id === id);
    if (direction === 'up' && index > 0) {
      const newSteps = [...steps];
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
      setSteps(newSteps);
    } else if (direction === 'down' && index < steps.length - 1) {
      const newSteps = [...steps];
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      setSteps(newSteps);
    }
  }

  async function handleSave() {
    if (!sequenceName.trim()) {
      alert('Please enter a sequence name');
      return;
    }

    if (steps.some(s => !s.subject_line.trim())) {
      alert('All emails must have a subject line');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`http://localhost:3001/api/email/sequences/${sequenceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence_name: sequenceName,
          description,
          trigger_type: triggerType,
          status,
          steps: steps.map((step, index) => ({
            id: step.id,
            step_number: index + 1,
            step_name: step.step_name,
            subject_line: step.subject_line,
            html_content: step.html_content,
            delay_value: step.delay_value,
            delay_unit: step.delay_unit,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update sequence');
      }

      alert('Sequence saved successfully!');
    } catch (error) {
      console.error('Failed to save sequence:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this sequence? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/email/sequences/${sequenceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete sequence');
      }

      router.push('/admin/email');
    } catch (error) {
      console.error('Failed to delete sequence:', error);
      alert('Failed to delete sequence');
    }
  }

  const editingStep = steps.find(s => s.id === editingStepId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sequence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/email"
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Sequence</h1>
                <p className="text-gray-500 text-sm">{sequence?.sequence_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Delete
              </button>
              <Link
                href="/admin/email"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Sequence Details & Steps */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sequence Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sequence Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sequence Name *
                  </label>
                  <input
                    type="text"
                    value={sequenceName}
                    onChange={(e) => setSequenceName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'paused' | 'draft')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger
                  </label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="manual">Manual Enrollment</option>
                    <option value="lead_capture">Lead Capture Form</option>
                    <option value="tag_added">Tag Added</option>
                    <option value="purchase">After Purchase</option>
                  </select>
                </div>

                {sequence && sequence.total_enrolled > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{sequence.total_enrolled}</span> subscribers enrolled
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Email Steps */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Email Steps</h2>
                <button
                  onClick={addStep}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Email</span>
                </button>
              </div>

              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      editingStepId === step.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setEditingStepId(step.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveStep(step.id, 'up');
                            }}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveStep(step.id, 'down');
                            }}
                            disabled={index === steps.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="font-medium text-gray-900">{step.step_name}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 truncate max-w-[180px]">
                            {step.subject_line || 'No subject'}
                          </p>
                          {index > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              Wait {step.delay_value} {step.delay_unit}
                            </p>
                          )}
                          {(step.sent_count ?? 0) > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                              {step.sent_count} sent • {step.opened_count || 0} opened
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStep(step.id);
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Email Editor */}
          <div className="lg:col-span-2">
            {editingStep ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Edit: {editingStep.step_name}
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Step Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step Name
                    </label>
                    <input
                      type="text"
                      value={editingStep.step_name}
                      onChange={(e) => updateStep(editingStep.id, { step_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Delay (not for first email) */}
                  {steps.findIndex(s => s.id === editingStep.id) > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wait Before Sending
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          value={editingStep.delay_value}
                          onChange={(e) => updateStep(editingStep.id, { delay_value: parseInt(e.target.value) || 0 })}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <select
                          value={editingStep.delay_unit}
                          onChange={(e) => updateStep(editingStep.id, { delay_unit: e.target.value as EmailStep['delay_unit'] })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                        </select>
                        <span className="text-gray-500">after previous email</span>
                      </div>
                    </div>
                  )}

                  {/* Subject Line */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Line *
                    </label>
                    <input
                      type="text"
                      value={editingStep.subject_line}
                      onChange={(e) => updateStep(editingStep.id, { subject_line: e.target.value })}
                      placeholder="Enter email subject..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use {'{{firstName}}'} to personalize
                    </p>
                  </div>

                  {/* Email Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Content
                    </label>
                    <textarea
                      value={editingStep.html_content}
                      onChange={(e) => updateStep(editingStep.id, { html_content: e.target.value })}
                      placeholder="Write your email content here... You can use HTML or plain text."
                      rows={15}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available variables: {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an email to edit</h3>
                <p className="text-gray-500">Click on an email step in the left panel to edit its content</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
