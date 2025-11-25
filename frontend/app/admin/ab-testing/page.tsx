'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ========== INTERFACES ==========

interface ABTest {
  id: string;
  test_name: string;
  test_type: 'landing_page' | 'email_subject' | 'email_content';
  status: 'draft' | 'running' | 'paused' | 'completed';
  start_date: string | null;
  end_date: string | null;
  winning_variant_id: string | null;
  statistical_confidence: number;
  variant_count: number;
  total_impressions: number;
  total_conversions: number;
  avg_conversion_rate: number;
  created_at: string;
}

interface Variant {
  id: string;
  variant_name: string;
  variant_type: 'control' | 'variant_a' | 'variant_b' | 'variant_c';
  traffic_percentage: number;
  impressions: number;
  conversions: number;
  conversion_rate: number;
  revenue_generated: number;
}

interface LandingPage {
  id: string;
  page_name: string;
  slug: string;
}

// ========== COMPONENT ==========

export default function ABTestingPage() {
  const router = useRouter();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Create form state
  const [testName, setTestName] = useState('');
  const [testType, setTestType] = useState<'landing_page' | 'email_subject' | 'email_content'>('landing_page');
  const [variants, setVariants] = useState<Array<{
    variantName: string;
    variantType: 'control' | 'variant_a' | 'variant_b' | 'variant_c';
    trafficPercentage: number;
    landingPageId?: string;
  }>>([
    { variantName: 'Control', variantType: 'control', trafficPercentage: 50 },
    { variantName: 'Variant A', variantType: 'variant_a', trafficPercentage: 50 },
  ]);

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  async function loadData() {
    setLoading(true);
    try {
      await Promise.all([
        loadTests(),
        loadLandingPages(),
      ]);
    } catch (error) {
      console.error('Failed to load A/B testing data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTests() {
    const params = new URLSearchParams();
    if (filterStatus !== 'all') {
      params.append('status', filterStatus);
    }

    const response = await fetch(`http://localhost:3001/api/ab-testing?${params}`);
    const data = await response.json();
    setTests(data.tests || []);
  }

  async function loadLandingPages() {
    const response = await fetch('http://localhost:3001/api/landing-pages?status=published');
    const data = await response.json();
    setLandingPages(data.pages || []);
  }

  async function handleCreateTest() {
    if (!testName) {
      alert('Please enter a test name');
      return;
    }

    // Validate traffic percentages sum to 100
    const totalTraffic = variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
    if (totalTraffic !== 100) {
      alert('Traffic percentages must sum to 100%');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/ab-testing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testName,
          testType,
          variants,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create test');
      }

      alert('A/B test created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadTests();
    } catch (error) {
      console.error('Failed to create test:', error);
      alert('Failed to create A/B test');
    }
  }

  function resetForm() {
    setTestName('');
    setTestType('landing_page');
    setVariants([
      { variantName: 'Control', variantType: 'control', trafficPercentage: 50 },
      { variantName: 'Variant A', variantType: 'variant_a', trafficPercentage: 50 },
    ]);
  }

  function addVariant() {
    if (variants.length >= 4) {
      alert('Maximum 4 variants allowed');
      return;
    }

    const variantTypes: Array<'control' | 'variant_a' | 'variant_b' | 'variant_c'> =
      ['control', 'variant_a', 'variant_b', 'variant_c'];
    const usedTypes = variants.map(v => v.variantType);
    const nextType = variantTypes.find(t => !usedTypes.includes(t));

    if (nextType) {
      setVariants([
        ...variants,
        {
          variantName: `Variant ${String.fromCharCode(64 + variants.length)}`,
          variantType: nextType,
          trafficPercentage: 0,
        },
      ]);
    }
  }

  function removeVariant(index: number) {
    if (variants.length <= 2) {
      alert('Minimum 2 variants required');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  }

  async function handleStartTest(testId: string) {
    if (!confirm('Are you sure you want to start this test?')) return;

    try {
      await fetch(`http://localhost:3001/api/ab-testing/${testId}/start`, {
        method: 'POST',
      });
      alert('Test started successfully!');
      loadTests();
    } catch (error) {
      console.error('Failed to start test:', error);
      alert('Failed to start test');
    }
  }

  async function handlePauseTest(testId: string) {
    if (!confirm('Are you sure you want to pause this test?')) return;

    try {
      await fetch(`http://localhost:3001/api/ab-testing/${testId}/pause`, {
        method: 'POST',
      });
      alert('Test paused successfully!');
      loadTests();
    } catch (error) {
      console.error('Failed to pause test:', error);
      alert('Failed to pause test');
    }
  }

  async function handleCompleteTest(testId: string) {
    if (!confirm('Are you sure you want to complete this test?')) return;

    try {
      await fetch(`http://localhost:3001/api/ab-testing/${testId}/complete`, {
        method: 'POST',
      });
      alert('Test completed successfully!');
      loadTests();
    } catch (error) {
      console.error('Failed to complete test:', error);
      alert('Failed to complete test');
    }
  }

  async function handleDeleteTest(testId: string) {
    if (!confirm('Are you sure you want to delete this test? This cannot be undone.')) return;

    try {
      await fetch(`http://localhost:3001/api/ab-testing/${testId}`, {
        method: 'DELETE',
      });
      alert('Test deleted successfully!');
      loadTests();
    } catch (error) {
      console.error('Failed to delete test:', error);
      alert('Failed to delete test');
    }
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      running: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  function getTestTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      landing_page: '📄',
      email_subject: '📧',
      email_content: '✉️',
    };
    return icons[type] || '🧪';
  }

  if (loading && tests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading A/B tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">A/B Testing</h1>
              <p className="text-gray-500 mt-1">
                Create and manage A/B tests for landing pages and emails
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
            >
              <span>🧪</span>
              <span>Create New Test</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Total Tests"
            count={tests.length}
            color="blue"
          />
          <StatCard
            label="Running"
            count={tests.filter(t => t.status === 'running').length}
            color="green"
          />
          <StatCard
            label="Completed"
            count={tests.filter(t => t.status === 'completed').length}
            color="purple"
          />
          <StatCard
            label="Draft"
            count={tests.filter(t => t.status === 'draft').length}
            color="gray"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Tests</option>
              <option value="draft">Draft</option>
              <option value="running">Running</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Tests List */}
        {tests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">
              No A/B tests yet. Create your first test to optimize conversions!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create Your First Test
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getTestTypeIcon(test.test_type)}</span>
                      <h3 className="text-xl font-semibold text-gray-900">{test.test_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                        {test.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div>
                        <div className="text-sm text-gray-500">Variants</div>
                        <div className="text-lg font-semibold text-gray-900">{test.variant_count}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Impressions</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {test.total_impressions?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Conversions</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {test.total_conversions || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Avg Conversion Rate</div>
                        <div className="text-lg font-semibold text-green-600">
                          {(test.avg_conversion_rate || 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {test.start_date && (
                      <div className="mt-3 text-sm text-gray-600">
                        Started: {new Date(test.start_date).toLocaleDateString()}
                        {test.end_date && ` • Ended: ${new Date(test.end_date).toLocaleDateString()}`}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <button
                      onClick={() => router.push(`/admin/ab-testing/${test.id}`)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      View Results
                    </button>

                    {test.status === 'draft' && (
                      <button
                        onClick={() => handleStartTest(test.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Start Test
                      </button>
                    )}

                    {test.status === 'running' && (
                      <>
                        <button
                          onClick={() => handlePauseTest(test.id)}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                        >
                          Pause
                        </button>
                        <button
                          onClick={() => handleCompleteTest(test.id)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                        >
                          Complete
                        </button>
                      </>
                    )}

                    {test.status === 'paused' && (
                      <button
                        onClick={() => handleStartTest(test.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Resume
                      </button>
                    )}

                    {(test.status === 'draft' || test.status === 'completed') && (
                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create New A/B Test</h2>
              <p className="text-gray-500 mt-1">Set up your experiment variants</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Test Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Name *
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g., Homepage CTA Button Test"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Test Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Type *
                </label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="landing_page">Landing Page</option>
                  <option value="email_subject">Email Subject Line</option>
                  <option value="email_content">Email Content</option>
                </select>
              </div>

              {/* Variants */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Variants (Traffic Split)
                  </label>
                  <button
                    onClick={addVariant}
                    disabled={variants.length >= 4}
                    className="text-sm text-indigo-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    + Add Variant
                  </button>
                </div>

                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                      <input
                        type="text"
                        value={variant.variantName}
                        onChange={(e) => {
                          const newVariants = [...variants];
                          newVariants[index].variantName = e.target.value;
                          setVariants(newVariants);
                        }}
                        placeholder="Variant name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />

                      {testType === 'landing_page' && (
                        <select
                          value={variant.landingPageId || ''}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[index].landingPageId = e.target.value;
                            setVariants(newVariants);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Select landing page...</option>
                          {landingPages.map((page) => (
                            <option key={page.id} value={page.id}>
                              {page.page_name}
                            </option>
                          ))}
                        </select>
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={variant.trafficPercentage}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[index].trafficPercentage = parseInt(e.target.value) || 0;
                            setVariants(newVariants);
                          }}
                          min="0"
                          max="100"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <span className="text-gray-600">%</span>
                      </div>

                      {variants.length > 2 && (
                        <button
                          onClick={() => removeVariant(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  Total traffic: {variants.reduce((sum, v) => sum + v.trafficPercentage, 0)}%
                  {variants.reduce((sum, v) => sum + v.trafficPercentage, 0) !== 100 && (
                    <span className="text-red-600 ml-2">(Must equal 100%)</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTest}
                disabled={!testName || variants.reduce((sum, v) => sum + v.trafficPercentage, 0) !== 100}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== HELPER COMPONENTS ==========

function StatCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    gray: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className={`rounded-lg p-6 ${colorClasses[color]}`}>
      <div className="text-3xl font-bold">{count}</div>
      <div className="text-sm mt-1">{label}</div>
    </div>
  );
}
