import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="text-white" style={{ backgroundColor: 'rgb(31, 31, 31)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-3">
            <Link href="/" className="inline-block -ml-4">
              <img
                src="/logo-with-text-white.svg"
                alt="StackVerdicts"
                className="h-16 md:h-28"
              />
            </Link>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <a href="https://www.youtube.com/@Stackverdicts" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Watch Videos
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
          <p className="text-sm text-white col-span-1 md:col-span-3">
            © {currentYear} StackVerdicts. All rights reserved.
          </p>
          <div className="flex flex-row space-x-4">
            <a href="/privacy" className="text-white hover:text-gray-300 transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-white hover:text-gray-300 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
