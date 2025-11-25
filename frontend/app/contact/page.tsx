export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>

        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-700 leading-relaxed mb-8">
            If you have any questions, concerns, or feedback, please don't hesitate to reach out to us.
            We're here to help!
          </p>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">General Inquiries</h2>
              <p className="text-gray-700">
                For general questions about our service, please email us at:
              </p>
              <a
                href="mailto:support@example.com"
                className="text-primary-600 hover:underline font-medium"
              >
                support@example.com
              </a>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Technical Support</h2>
              <p className="text-gray-700">
                Having technical issues? Our support team is here to help:
              </p>
              <a
                href="mailto:tech@example.com"
                className="text-primary-600 hover:underline font-medium"
              >
                tech@example.com
              </a>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Privacy & Legal</h2>
              <p className="text-gray-700">
                For privacy concerns or legal matters:
              </p>
              <a
                href="mailto:legal@example.com"
                className="text-primary-600 hover:underline font-medium"
              >
                legal@example.com
              </a>
            </div>

            <div className="pt-6 border-t">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Business Hours</h2>
              <p className="text-gray-700">
                Monday - Friday: 9:00 AM - 5:00 PM (Your Timezone)
              </p>
              <p className="text-gray-700">
                We typically respond within 24-48 business hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
