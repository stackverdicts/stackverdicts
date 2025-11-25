'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// ========== INTERFACES ==========

interface Product {
  id: string;
  name: string;
  commission_value: number;
  category: string;
}

interface OperationResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
  results: any[];
}

// ========== COMPONENT ==========

export default function BulkOperationsPage() {
  const router = useRouter();
  const [activeOperation, setActiveOperation] = useState<'scripts' | 'pages' | 'publish'>('scripts');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OperationResult | null>(null);

  // Form state
  const [scriptType, setScriptType] = useState<'tutorial' | 'review' | 'comparison' | 'listicle'>('tutorial');
  const [templateType, setTemplateType] = useState<'review' | 'comparison' | 'listicle' | 'educational' | 'squeeze'>('review');
  const [tone, setTone] = useState('professional');
  const [duration, setDuration] = useState(10);
  const [includeLeadCapture, setIncludeLeadCapture] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const response = await fetch('http://localhost:3001/api/products?active_only=true&limit=100');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }

  function toggleProductSelection(productId: string) {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }

  function selectAll() {
    setSelectedProductIds(products.map(p => p.id));
  }

  function deselectAll() {
    setSelectedProductIds([]);
  }

  async function handleBulkGenerateScripts() {
    if (selectedProductIds.length === 0) {
      alert('Please select at least one product');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/bulk-operations/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedProductIds,
          scriptType,
          tone,
          duration,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate scripts');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Failed to bulk generate scripts:', error);
      alert('Failed to bulk generate scripts');
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkGeneratePages() {
    if (selectedProductIds.length === 0) {
      alert('Please select at least one product');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/bulk-operations/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedProductIds,
          templateType,
          tone,
          includeLeadCapture,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate landing pages');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Failed to bulk generate landing pages:', error);
      alert('Failed to bulk generate landing pages');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bulk Operations</h1>
              <p className="text-gray-500 mt-1">
                Perform actions on multiple items at once
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Operation Type Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Operation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setActiveOperation('scripts');
                setResult(null);
              }}
              className={`p-6 rounded-lg border-2 transition-all ${
                activeOperation === 'scripts'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-4xl mb-2">📝</div>
              <div className="font-semibold text-gray-900">Generate Scripts</div>
              <div className="text-sm text-gray-600 mt-1">
                Bulk create YouTube scripts
              </div>
            </button>

            <button
              onClick={() => {
                setActiveOperation('pages');
                setResult(null);
              }}
              className={`p-6 rounded-lg border-2 transition-all ${
                activeOperation === 'pages'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-4xl mb-2">📄</div>
              <div className="font-semibold text-gray-900">Generate Pages</div>
              <div className="text-sm text-gray-600 mt-1">
                Bulk create landing pages
              </div>
            </button>

            <button
              onClick={() => {
                setActiveOperation('publish');
                setResult(null);
              }}
              className={`p-6 rounded-lg border-2 transition-all ${
                activeOperation === 'publish'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              disabled
            >
              <div className="text-4xl mb-2">🚀</div>
              <div className="font-semibold text-gray-900">Publish/Unpublish</div>
              <div className="text-sm text-gray-600 mt-1">
                Manage page visibility
              </div>
              <div className="text-xs text-gray-400 mt-2">Coming soon</div>
            </button>
          </div>
        </div>

        {/* Configuration Panel */}
        {activeOperation === 'scripts' && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Script Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Script Type
                </label>
                <select
                  value={scriptType}
                  onChange={(e) => setScriptType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="tutorial">Tutorial</option>
                  <option value="review">Review</option>
                  <option value="comparison">Comparison</option>
                  <option value="listicle">Listicle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="educational">Educational</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
                  min="5"
                  max="30"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeOperation === 'pages' && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Landing Page Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Type
                </label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="review">Review</option>
                  <option value="comparison">Comparison</option>
                  <option value="listicle">Listicle</option>
                  <option value="educational">Educational</option>
                  <option value="squeeze">Squeeze</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="trustworthy">Trustworthy</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeLeadCapture}
                    onChange={(e) => setIncludeLeadCapture(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include lead capture</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Product Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Select Products</h2>
            <div className="space-x-2">
              <button
                onClick={selectAll}
                className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            {selectedProductIds.length} of {products.length} products selected
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {products.map((product) => (
              <label
                key={product.id}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedProductIds.includes(product.id)
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(product.id)}
                  onChange={() => toggleProductSelection(product.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.category}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Execute Button */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <button
            onClick={activeOperation === 'scripts' ? handleBulkGenerateScripts : handleBulkGeneratePages}
            disabled={loading || selectedProductIds.length === 0}
            className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>
                  {activeOperation === 'scripts' ? 'Generate Scripts' : 'Generate Landing Pages'}
                </span>
              </>
            )}
          </button>

          {selectedProductIds.length === 0 && (
            <p className="text-center text-gray-500 text-sm mt-2">
              Select at least one product to continue
            </p>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Operation Results</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-sm text-indigo-600 font-medium">Total</div>
                <div className="text-2xl font-bold text-blue-900">{result.total}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Successful</div>
                <div className="text-2xl font-bold text-green-900">{result.successful}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-sm text-red-600 font-medium">Failed</div>
                <div className="text-2xl font-bold text-red-900">{result.failed}</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Errors</h3>
                <div className="space-y-2">
                  {result.errors.map((error, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="text-sm text-red-800">
                        <span className="font-medium">ID: {error.id}</span> - {error.error}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.results.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Successful Operations</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.results.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.productName}</td>
                          <td className="px-6 py-4 text-sm text-green-600">
                            {activeOperation === 'scripts' ? `Script ID: ${item.scriptId}` : `Page: /${item.slug}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
