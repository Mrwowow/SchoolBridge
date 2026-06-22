import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/ui';

export const metadata: Metadata = {
  title: 'SchoolBridge — Digital Communication for Nigerian Schools',
};

function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="container-max section-pad flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center" aria-label="SchoolBridge home">
          <Logo kind="lockup" color="brand" height={48} priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Marketing nav">
          <Link href="/#features" className="text-sm text-gray-600 transition-colors hover:text-gray-900">
            Features
          </Link>
          <Link href="/#for-nigerian-schools" className="text-sm text-gray-600 transition-colors hover:text-gray-900">
            Why SchoolBridge
          </Link>
          <Link href="/#pricing" className="text-sm text-gray-600 transition-colors hover:text-gray-900">
            Pricing
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            Sign in
          </Link>
          <Link
            href="/#pricing"
            className="inline-flex h-8 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="container-max section-pad py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center" aria-label="SchoolBridge home">
              <Logo kind="lockup" color="brand" height={44} />
            </Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Replacing paper communication booklets with instant, digital parent-teacher communication.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Product</h4>
            <ul className="flex flex-col gap-2 text-sm text-gray-500">
              <li><Link href="/#features" className="hover:text-gray-900 transition-colors">Features</Link></li>
              <li><Link href="/#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link></li>
              <li><Link href="/login" className="hover:text-gray-900 transition-colors">Sign in</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Company</h4>
            <ul className="flex flex-col gap-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-gray-900 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Legal</h4>
            <ul className="flex flex-col gap-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} SchoolBridge. All rights reserved. Built for Nigerian schools.
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </>
  );
}
